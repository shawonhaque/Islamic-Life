// public/ is gitignored, so robots.txt and sitemap.xml are emitted on every
// build instead of being committed. Keep the URLs in sync with the deploy
// target: GitHub Pages serves this project from /Islamic-Life/.
import fs from 'node:fs';
import path from 'node:path';

const SITE_URL = 'https://shawonhaque.github.io/Islamic-Life/';
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

fs.mkdirSync(PUBLIC_DIR, { recursive: true });

const robots = `User-agent: *
Allow: /

# The app is a single page with state-driven navigation, so every section
# lives under the root URL. Search result pages and the API are not useful
# to crawl.
Disallow: /api/

Sitemap: ${SITE_URL}sitemap.xml
`;

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;

fs.writeFileSync(path.join(PUBLIC_DIR, 'robots.txt'), robots, 'utf8');
fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemap, 'utf8');
console.log('Wrote public/robots.txt and public/sitemap.xml');
