import Image from 'next/image';

import { cn } from '@/lib/cn';

// Маленькое фото репетитора рядом с его именем – шапка колонки отзывов и карточки «О сайте»
// (макеты D-6-reviews, D-9-about). Без фото – инициал на kraft, как у PhotoTape.

type AvatarProps = {
  name: string;
  /** Адрес исходника фото; без него – инициал. */
  photo?: string | undefined;
  /** Сторона в px: 48 – отзывы, 64 – «О сайте». */
  size: 48 | 64;
};

const SIZES = { 48: 'size-12 text-[1.125rem]', 64: 'size-16 text-[1.5rem]' } as const;

/** Декор: имя рядом всегда написано текстом, поэтому фото и инициал скрыты от дикторов. */
export function Avatar({ name, photo, size }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative flex flex-none items-center justify-center overflow-hidden rounded-button bg-kraft font-display leading-none font-bold text-ink/50',
        SIZES[size],
      )}
    >
      {photo ? (
        <Image src={photo} alt="" fill sizes={`${size}px`} className="object-cover" />
      ) : (
        name.trim().charAt(0).toUpperCase()
      )}
    </span>
  );
}
