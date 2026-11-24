import type { Ayah, SurahDetailResponse } from '../types/islamic';

// The static deploy has no express server, so /api/surahs/:n is unreachable
// there. public/quran/:n.json carries the same ayahs, built by
// scripts/build-quran.mjs, and is used whenever the API cannot answer.
//
// Tafsir text is stored once per surah in `strings` and referenced by index
// from each ayah, which keeps the payload to a fraction of its raw size.

interface StaticSurahFile {
  surah_number: number;
  total_ayahs: number;
  strings?: string[];
  ayahs: Array<Record<string, string | number>>;
}

const TAFSIR_KEYS = ['short_tafsir_bn', 'short_tafsir_en', 'tafsir_bn', 'tafsir_en'] as const;

const cache = new Map<number, Ayah[]>();

function expand(file: StaticSurahFile): Ayah[] {
  const strings = file.strings ?? [];
  return (file.ayahs ?? []).map((raw) => {
    const ayah = { ...raw } as Record<string, unknown>;
    for (const key of TAFSIR_KEYS) {
      const value = ayah[key];
      if (typeof value === 'number') {
        ayah[key] = strings[value] ?? '';
      }
    }
    return ayah as unknown as Ayah;
  });
}

export function quranDataUrl(surahNumber: number): string {
  return `${import.meta.env.BASE_URL}quran/${surahNumber}.json`;
}

export async function loadStaticSurah(surahNumber: number): Promise<Ayah[] | null> {
  const cached = cache.get(surahNumber);
  if (cached) return cached;

  try {
    const res = await fetch(quranDataUrl(surahNumber));
    if (!res.ok) return null;
    const data = (await res.json()) as StaticSurahFile;
    if (!Array.isArray(data.ayahs)) return null;
    const ayahs = expand(data);
    cache.set(surahNumber, ayahs);
    return ayahs;
  } catch {
    return null;
  }
}
