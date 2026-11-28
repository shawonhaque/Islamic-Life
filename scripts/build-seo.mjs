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

# Search results, the admin area and the API are not useful to crawl.
Disallow: /api/
Disallow: /Islamic-Life/search/
Disallow: /Islamic-Life/admin/
Disallow: /Islamic-Life/settings/

Sitemap: ${SITE_URL}sitemap.xml
`;

// Every section has its own page, and so does each surah. Keep this list in
// sync with the sections that scripts/build-routes.mjs writes.
const SECTIONS = [
  'quran',
  'tafsir',
  'hadith',
  'dua',
  'namaz',
  'prayer-time',
  'qibla',
  'tasbih',
  'zakat',
  'ramadan',
  'calendar',
  'hajj-umrah',
  'names-99',
  'knowledge',
  'mosque-finder',
  'arabic-learning',
  'ai-studio',
  'terrarium',
];

const url = (loc, priority) => `  <url>
    <loc>${loc}</loc>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;

const entries = [
  url(SITE_URL, '1.0'),
  ...SECTIONS.map((slug) => url(`${SITE_URL}${slug}/`, '0.8')),
  ...Array.from({ length: 114 }, (_, i) => url(`${SITE_URL}quran/${i + 1}/`, '0.6')),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

fs.copyFileSync(path.resolve(process.cwd(), 'assets/og-cover.jpg'), path.join(PUBLIC_DIR, 'og-cover.jpg'));

fs.writeFileSync(path.join(PUBLIC_DIR, 'robots.txt'), robots, 'utf8');
fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemap, 'utf8');
console.log('Wrote public/robots.txt and public/sitemap.xml');
