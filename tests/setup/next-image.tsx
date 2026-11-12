// Путь внутренний, без semver-гарантий: при обновлении Next проверить, что он на месте (ADR-031).
import { getImageProps, type ImageProps } from 'next/dist/shared/lib/image-external';

// next/image – CommonJS-модуль: в Vite default-импорт приходит объектом экспортов, а не компонентом.
// Подмена для компонентных тестов рендерит <img> с атрибутами, которые считает сам Next
// (srcset, sizes, loading, fetchpriority), – без клиентской логики загрузки.
export default function Image(props: ImageProps) {
  const { props: imgProps } = getImageProps(props);
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- alt приходит из props Next
  return <img {...imgProps} />;
}
