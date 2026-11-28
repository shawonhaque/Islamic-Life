// GitHub Pages answers unknown paths with 404.html, so every section also gets
// a real page: /quran/, /qibla/, /quran/2/ … each with its own canonical URL.
// The pages are the app shell — the section is chosen from the path on boot.
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve(process.cwd(), 'dist');
const SITE_URL = 'https://shawonhaque.github.io/Islamic-Life/';

const SECTIONS = {
  quran: 'কুরআন',
  tafsir: 'তাফসির',
  hadith: 'হাদিস',
  dua: 'দুআ',
  namaz: 'নামাজ',
  'prayer-time': 'নামাজের সময়',
  qibla: 'কিবলা দিক',
  tasbih: 'তাসবিহ',
  zakat: 'যাকাত',
  ramadan: 'রমজান',
  calendar: 'হিজরি ক্যালেন্ডার',
  'hajj-umrah': 'হজ ও উমরাহ',
  'names-99': 'আল্লাহর ৯৯ নাম',
  knowledge: 'ইসলামিক জ্ঞান',
  'mosque-finder': 'মসজিদ খুঁজুন',
  'arabic-learning': 'আরবি শিক্ষা',
  'ai-studio': 'AI স্টুডিও',
  terrarium: 'টেরারিয়াম',
  search: 'সার্চ',
  settings: 'সেটিংস',
  admin: 'অ্যাডমিন',
};

function surahs() {
  const source = fs.readFileSync(
    path.resolve(process.cwd(), 'src/data/surahs114.ts'),
    'utf8'
  );
  const tuples = source.matchAll(/^\s*\[(\d+),\s*'([^']*)',\s*'([^']*)',\s*'([^']*)'/gm);
  return [...tuples].map(([, number, arabic, bengali, english]) => ({
    number: Number(number),
    arabic,
    bengali,
    english,
  }));
}

const shell = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');

function page({ url, title, description }) {
  return shell
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace(
      /<meta name="description" content="[^"]*"/,
      `<meta name="description" content="${description}"`
    )
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(
      /(<meta property="og:description" content=")[^"]*(")/,
      `$1${description}$2`
    )
    .replace(
      /(<meta name="twitter:description" content=")[^"]*(")/,
      `$1${description}$2`
    );
}

function write(relativePath, html) {
  const target = path.join(DIST, relativePath, 'index.html');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, html, 'utf8');
}

let written = 0;
for (const [slug, label] of Object.entries(SECTIONS)) {
  write(
    slug,
    page({
      url: `${SITE_URL}${slug}/`,
      title: `${label} — Islamic Life`,
      description: `${label}: কুরআন, নামাজ, দুআ ও ইসলামিক জ্ঞানের বাংলা-প্রথম অ্যাপ — Islamic Life.`,
    })
  );
  written += 1;
}

for (const surah of surahs()) {
  const label = `সূরা ${surah.bengali} (${surah.english})`;
  write(
    `quran/${surah.number}`,
    page({
      url: `${SITE_URL}quran/${surah.number}/`,
      title: `${label} — Islamic Life`,
      description: `${label} — আরবি পাঠ, বাংলা ও ইংরেজি অনুবাদ এবং তাফসিরের সাথে পড়ুন।`,
    })
  );
  written += 1;
}

console.log(`Wrote ${written} route pages to dist/`);
