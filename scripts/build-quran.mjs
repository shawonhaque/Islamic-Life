// Publishes the surah snapshots in data/quran/ as static JSON the client can
// fetch directly. Without this the app depends on the express server, which is
// not part of the static deploy, so every surah fell back to the 41 seeded
// ayahs and most of the Quran looked empty.
//
// Tafsir text repeats heavily between neighbouring ayahs, so each surah file
// carries a string table and its ayahs reference entries by index. That takes
// the payload from 146 MB to 48 MB raw, ~11 MB gzipped.

import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.resolve(process.cwd(), 'data/quran');
const OUT_DIR = path.resolve(process.cwd(), 'public/quran');

const TAFSIR_KEYS = ['short_tafsir_bn', 'short_tafsir_en', 'tafsir_bn', 'tafsir_en'];
const AYAH_KEYS = ['id', 'surah_id', 'ayah_number', 'arabic', 'translation_bn', 'translation_en'];

if (!fs.existsSync(SRC_DIR)) {
  console.error(`No surah data at ${SRC_DIR}`);
  process.exit(1);
}

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

const index = [];

for (let n = 1; n <= 114; n += 1) {
  const file = path.join(SRC_DIR, `${n}.json`);
  if (!fs.existsSync(file)) {
    console.error(`Missing surah ${n}`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const table = new Map();
  const ayahs = [];

  for (const a of raw.ayahs ?? []) {
    const entry = {};
    for (const key of AYAH_KEYS) entry[key] = a[key];

    for (const key of TAFSIR_KEYS) {
      const text = a[key] || '';
      if (!text) continue;
      if (!table.has(text)) table.set(text, table.size);
      entry[key] = table.get(text);
    }
    ayahs.push(entry);
  }

  const payload = {
    surah_number: raw.surah_number ?? n,
    total_ayahs: raw.total_ayahs ?? ayahs.length,
    strings: [...table.keys()],
    ayahs,
  };

  fs.writeFileSync(path.join(OUT_DIR, `${n}.json`), JSON.stringify(payload), 'utf8');

  index.push({ surah_number: payload.surah_number, total_ayahs: payload.total_ayahs });
}

fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify(index), 'utf8');

const bytes = fs
  .readdirSync(OUT_DIR)
  .reduce((sum, f) => sum + fs.statSync(path.join(OUT_DIR, f)).size, 0);

console.log(`Wrote ${index.length} surahs to public/quran (${(bytes / 1e6).toFixed(1)} MB)`);
