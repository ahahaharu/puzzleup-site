import { withContentCollections } from '@content-collections/next';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  output: 'standalone',
  poweredByHeader: false,
};

// Content Collections собирает `content/` перед `next build`, `next dev` (с отслеживанием) и `next typegen`.
export default withContentCollections(nextConfig);
