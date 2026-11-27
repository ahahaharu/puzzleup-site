import { describe, expect, it } from 'vitest';

import { imageSize } from './image-size';

const bytes = (...parts: (number[] | string)[]) =>
  Uint8Array.from(
    parts.flatMap((part) =>
      typeof part === 'string' ? [...part].map((char) => char.charCodeAt(0)) : part,
    ),
  );

const be16 = (value: number) => [value >> 8, value & 0xff];
const be32 = (value: number) => [...be16(value >>> 16), ...be16(value & 0xffff)];
const le16 = (value: number) => [value & 0xff, value >> 8];
const le24 = (value: number) => [value & 0xff, (value >> 8) & 0xff, value >> 16];

const PNG = bytes([0x89], 'PNG\r\n', [0x1a, 0x0a], be32(13), 'IHDR', be32(912), be32(925));

// SOI, APP0 на 16 байт, затем SOF0: длина, точность, высота, ширина.
const JPEG = bytes(
  [0xff, 0xd8],
  [0xff, 0xe0],
  be16(16),
  'JFIF',
  Array.from({ length: 10 }, () => 0),
  [0xff, 0xff],
  [0xff, 0xc0],
  be16(17),
  [8],
  be16(409),
  be16(899),
);

const riff = (chunk: string, payload: number[]) =>
  bytes('RIFF', [0, 0, 0, 0], 'WEBP', chunk, [0, 0, 0, 0], payload);

describe('imageSize', () => {
  it('reads PNG from IHDR', () => {
    expect(imageSize(PNG)).toEqual({ width: 912, height: 925 });
  });

  it('reads JPEG from the first frame marker, skipping other segments and fill bytes', () => {
    expect(imageSize(JPEG)).toEqual({ width: 899, height: 409 });
  });

  it('reads every WebP flavour', () => {
    const lossy = riff('VP8 ', [0, 0, 0, 0x9d, 0x01, 0x2a, ...le16(1085), ...le16(517)]);
    expect(imageSize(lossy)).toEqual({ width: 1085, height: 517 });

    // VP8L: 14 бит ширины − 1, затем 14 бит высоты − 1.
    const bits = (1085 - 1) | ((517 - 1) << 14);
    const lossless = riff('VP8L', [0x2f, ...le24(bits & 0xffffff), bits >>> 24]);
    expect(imageSize(lossless)).toEqual({ width: 1085, height: 517 });

    const extended = riff('VP8X', [0, 0, 0, 0, ...le24(1085 - 1), ...le24(517 - 1)]);
    expect(imageSize(extended)).toEqual({ width: 1085, height: 517 });
  });

  it('gives up on unknown, truncated and empty files', () => {
    expect(imageSize(bytes('GIF89a', [1, 0, 1, 0]))).toBeUndefined();
    expect(imageSize(JPEG.subarray(0, 12))).toBeUndefined();
    expect(imageSize(PNG.subarray(0, 20))).toBeUndefined();
    expect(imageSize(new Uint8Array())).toBeUndefined();
  });
});
