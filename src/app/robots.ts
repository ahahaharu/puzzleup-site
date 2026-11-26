import type { MetadataRoute } from 'next';

import { getSite } from '@/content';

// `/robots.txt`. Служебные `/api/*` поисковикам не нужны; ушедший репетитор и 404 скрыты тегом
// `noindex`, а не здесь: закрытую в robots.txt страницу поисковик не прочитает и тег не увидит.
// staging закрывает Caddy (`X-Robots-Tag: noindex` и basic auth, docs/architecture.md, раздел 9).

export default function robots(): MetadataRoute.Robots {
  const { url } = getSite();
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    sitemap: `${url}/sitemap.xml`,
  };
}
