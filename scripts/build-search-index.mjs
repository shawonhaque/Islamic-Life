// Builds a compact Quran search index for the static deploy.
//
// /api/search lives in server.ts, which GitHub Pages never runs, so every
// search on the live site answered with the SPA shell and the UI showed a
// generic failure. This index carries only what search needs (Arabic,
// Bengali, English per ayah) and is fetched lazily the first time someone
// searches, so it never blocks first paint.

import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.resolve(process.cwd(), 'data/quran');
const OUT_DIR = path.resolve(process.cwd(), 'public/search');

if (!fs.existsSync(SRC_DIR)) {
  console.error(`No surah data at ${SRC_DIR}`);
  process.exit(1);
}

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

// One record per line: surah, ayah, arabic, bengali, english. Tab-separated
// because JSON quoting around 6236 rows costs more than the separators save.
const lines = [];

for (let n = 1; n <= 114; n += 1) {
  const file = path.join(SRC_DIR, `${n}.json`);
  if (!fs.existsSync(file)) {
    console.error(`Missing surah ${n}`);
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const ayah of raw.ayahs ?? []) {
    const arabic = String(ayah.arabic ?? '').replace(/\t|\n|\r/g, ' ').replace(/^\uFEFF/, '');
    const bn = String(ayah.translation_bn ?? '').replace(/\t|\n|\r/g, ' ');
    const en = String(ayah.translation_en ?? '').replace(/\t|\n|\r/g, ' ');
    lines.push(`${n}\t${ayah.ayah_number}\t${arabic}\t${bn}\t${en}`);
  }
}

const outFile = path.join(OUT_DIR, 'quran-index.txt');
const body = lines.join('\n');
fs.writeFileSync(outFile, body, 'utf8');

const mb = (Buffer.byteLength(body, 'utf8') / 1e6).toFixed(2);
console.log(`Wrote ${lines.length} ayahs to public/search/quran-index.txt (${mb} MB raw)`);
