// Ширина и высота картинки по заголовку файла – JPEG, PNG и WebP, без декодирования и без
// зависимостей (`sharp` – новая зависимость ради трёх форматов, ADR-055). Нужны скриншотам отзывов:
// next/image резервирует место по пропорции, и кладка не прыгает, пока снимки грузятся (ADR-071).
// Поворот из EXIF не учитывается: скриншоты сохраняются без него.

export type ImageSize = { width: number; height: number };

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

function png(view: DataView): ImageSize | undefined {
  if (view.byteLength < 24) return undefined;
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

function webp(bytes: Uint8Array, view: DataView): ImageSize | undefined {
  const chunk = ascii(bytes, 12, 4);
  // Заголовок VP8L – 25 байт, VP8 и VP8X – 30.
  if (bytes.length < (chunk === 'VP8L' ? 25 : 30)) return undefined;
  if (chunk === 'VP8 ') {
    return { width: view.getUint16(26, true) & 0x3fff, height: view.getUint16(28, true) & 0x3fff };
  }
  if (chunk === 'VP8L') {
    const [b0 = 0, b1 = 0, b2 = 0, b3 = 0] = bytes.subarray(21, 25);
    return {
      width: 1 + (((b1 & 0x3f) << 8) | b0),
      height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
    };
  }
  if (chunk === 'VP8X') {
    const uint24 = (offset: number) =>
      (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8) | ((bytes[offset + 2] ?? 0) << 16);
    return { width: 1 + uint24(24), height: 1 + uint24(27) };
  }
  return undefined;
}

// Маркеры начала кадра SOF0–SOF15, кроме DHT (C4), JPG (C8) и DAC (CC).
const SOF = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

function jpeg(bytes: Uint8Array, view: DataView): ImageSize | undefined {
  let offset = 2;
  while (offset + 9 <= bytes.length) {
    if (bytes[offset] !== 0xff) return undefined;
    const marker = bytes[offset + 1] ?? 0;
    // Байты-заполнители 0xFF перед маркером.
    if (marker === 0xff) {
      offset += 1;
      continue;
    }
    if (SOF.has(marker)) {
      return { width: view.getUint16(offset + 7), height: view.getUint16(offset + 5) };
    }
    offset += 2 + view.getUint16(offset + 2);
  }
  return undefined;
}

/** Размер по первым байтам файла; неизвестный или битый формат – `undefined`. */
export function imageSize(bytes: Uint8Array): ImageSize | undefined {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let size: ImageSize | undefined;
  if (bytes[0] === 0x89 && ascii(bytes, 1, 3) === 'PNG') size = png(view);
  else if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') size = webp(bytes, view);
  else if (bytes[0] === 0xff && bytes[1] === 0xd8) size = jpeg(bytes, view);
  return size && size.width > 0 && size.height > 0 ? size : undefined;
}
