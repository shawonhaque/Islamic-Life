import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve(process.cwd(), 'data/quran');
fs.mkdirSync(OUT_DIR, { recursive: true });

async function fetchJson(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 400 * attempt));
    }
  }
}

function buildLookup(entries) {
  const map = new Map();
  if (!Array.isArray(entries)) return map;
  for (const item of entries) {
    const num = Number(item.ayah);
    const txt = typeof item.text === 'string' ? item.text.trim() : '';
    if (num > 0 && txt) {
      map.set(num, txt);
    }
  }
  return map;
}

function resolveAyahTafsir(map, ayahNum) {
  if (map.has(ayahNum)) return map.get(ayahNum);
  // Some detailed tafsirs (like Ibn Kathir) group consecutive ayahs under the first ayah in the passage
  for (let n = ayahNum - 1; n >= 1; n--) {
    if (map.has(n)) return map.get(n);
  }
  for (let n = ayahNum + 1; n <= ayahNum + 10; n++) {
    if (map.has(n)) return map.get(n);
  }
  return '';
}

async function main() {
  console.log('Fetching complete Quran editions (Arabic, Bengali, English)...');
  const [arRes, bnRes, enRes] = await Promise.all([
    fetchJson('https://api.alquran.cloud/v1/quran/quran-uthmani'),
    fetchJson('https://api.alquran.cloud/v1/quran/bn.bengali'),
    fetchJson('https://api.alquran.cloud/v1/quran/en.sahih'),
  ]);

  const arSurahs = arRes.data.surahs;
  const bnSurahs = bnRes.data.surahs;
  const enSurahs = enRes.data.surahs;

  const surahNumbers = Array.from({ length: 114 }, (_, i) => i + 1);
  const concurrency = 10;
  let index = 0;

  async function worker() {
    while (index < surahNumbers.length) {
      const sNum = surahNumbers[index++];
      const arSurah = arSurahs[sNum - 1];
      const bnSurah = bnSurahs[sNum - 1];
      const enSurah = enSurahs[sNum - 1];

      const [shortBnRaw, shortEnRaw, fullBnRaw, fullEnRaw] = await Promise.all([
        fetchJson(`https://raw.githubusercontent.com/spa5k/tafsir_api/main/tafsir/bengali-mokhtasar/${sNum}.json`).catch(() => []),
        fetchJson(`https://raw.githubusercontent.com/spa5k/tafsir_api/main/tafsir/en-tafsir-al-mukhtasar/${sNum}.json`).catch(() => []),
        fetchJson(`https://raw.githubusercontent.com/spa5k/tafsir_api/main/tafsir/bn-tafseer-ibn-e-kaseer/${sNum}.json`).catch(() => []),
        fetchJson(`https://raw.githubusercontent.com/spa5k/tafsir_api/main/tafsir/en-tafisr-ibn-kathir/${sNum}.json`).catch(() => []),
      ]);

      const shortBnMap = buildLookup(shortBnRaw);
      const shortEnMap = buildLookup(shortEnRaw);
      const fullBnMap = buildLookup(fullBnRaw);
      const fullEnMap = buildLookup(fullEnRaw);

      const ayahs = arSurah.ayahs.map((arAyah, idx) => {
        const ayahNum = arAyah.numberInSurah;
        const bnAyah = bnSurah.ayahs[idx];
        const enAyah = enSurah.ayahs[idx];
        const sBn = resolveAyahTafsir(shortBnMap, ayahNum);
        const sEn = resolveAyahTafsir(shortEnMap, ayahNum);
        const fBn = resolveAyahTafsir(fullBnMap, ayahNum) || sBn;
        const fEn = resolveAyahTafsir(fullEnMap, ayahNum) || sEn;

        return {
          id: sNum * 1000 + ayahNum,
          surah_id: sNum,
          ayah_number: ayahNum,
          arabic: arAyah.text,
          translation_bn: bnAyah ? bnAyah.text : '',
          translation_en: enAyah ? enAyah.text : '',
          short_tafsir_bn: sBn,
          short_tafsir_en: sEn,
          tafsir_bn: fBn,
          tafsir_en: fEn,
        };
      });

      const payload = {
        surah_number: sNum,
        total_ayahs: ayahs.length,
        ayahs,
      };

      fs.writeFileSync(path.join(OUT_DIR, `${sNum}.json`), JSON.stringify(payload), 'utf8');
      if (sNum % 15 === 0 || sNum === 114) {
        console.log(`Processed Surah ${sNum}/114 (${ayahs.length} ayahs)`);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  console.log('Successfully built complete Quran & Tafsir dataset for all 114 Surahs!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
