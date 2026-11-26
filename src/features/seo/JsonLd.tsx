import type { JsonLdData } from './json-ld';

// JSON-LD в `<script>`: `<` экранируется, чтобы текст из контента вроде «</script>» не закрыл тег
// (так советует документация Next, «JSON-LD»).

export function serializeJsonLd(data: JsonLdData): string {
  return JSON.stringify(data).replaceAll('<', '\\u003c');
}

export function JsonLd({ data }: { data: JsonLdData | undefined }) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
