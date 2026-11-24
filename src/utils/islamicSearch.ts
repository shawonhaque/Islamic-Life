import { KNOWLEDGE_CATEGORIES, type KnowledgeArticle } from '../data/islamicKnowledge';
import { SEED_DUAS, SEED_HADITHS } from '../data/islamicSeed';
import type { Dua, GlobalSearchResponse, Hadith, QuranSearchResult, Surah } from '../types/islamic';

/**
 * Search that runs entirely in the browser.
 *
 * The express server exposes /api/search, but GitHub Pages only serves static
 * files, so on the live site that request returns the SPA shell and the page
 * showed a generic failure. This module reproduces the server's matching
 * rules against a lazily fetched Quran index plus the bundled hadith, dua and
 * knowledge data, so search works with or without a backend.
 */

const ARABIC_DIACRITICS = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;

export function normalizeArabic(text: string): string {
  return text
    .replace(/^\uFEFF/, '')
    .replace(ARABIC_DIACRITICS, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .toLowerCase();
}

interface QuranRow {
  surah_number: number;
  ayah_number: number;
  arabic: string;
  translation_bn: string;
  translation_en: string;
  haystack: string;
  arabicNorm: string;
}

let indexPromise: Promise<QuranRow[]> | null = null;
let cachedIndex: QuranRow[] | null = null;

function parseIndex(raw: string, surahs: Surah[]): QuranRow[] {
  const meta = new Map<number, Surah>();
  for (const s of surahs) meta.set(s.surah_number, s);

  const rows: QuranRow[] = [];
  for (const line of raw.split('\n')) {
    if (!line) continue;
    const [sNum, aNum, arabic, bn, en] = line.split('\t');
    const surahNumber = Number(sNum);
    const ayahNumber = Number(aNum);
    if (!Number.isFinite(surahNumber) || !Number.isFinite(ayahNumber)) continue;
    const m = meta.get(surahNumber);
    rows.push({
      surah_number: surahNumber,
      ayah_number: ayahNumber,
      arabic,
      translation_bn: bn || '',
      translation_en: en || '',
      haystack: `${surahNumber}:${ayahNumber} ${m?.name_bn ?? ''} ${m?.name_en ?? ''} ${
        m?.meaning_bn ?? ''
      } ${m?.meaning_en ?? ''} ${bn || ''} ${en || ''}`.toLowerCase(),
      arabicNorm: normalizeArabic(arabic),
    });
  }
  return rows;
}

/** Loads the Quran index once; failures are not cached so a retry can succeed. */
export function loadQuranIndex(surahs: Surah[]): Promise<QuranRow[]> {
  if (cachedIndex) return Promise.resolve(cachedIndex);
  if (indexPromise) return indexPromise;

  const url = `${import.meta.env.BASE_URL}search/quran-index.txt`;
  indexPromise = fetch(url)
    .then(async (res) => {
      if (!res.ok) throw new Error(`Search index unavailable (HTTP ${res.status}).`);
      const rows = parseIndex(await res.text(), surahs);
      if (rows.length === 0) throw new Error('Search index is empty.');
      cachedIndex = rows;
      return rows;
    })
    .catch((err) => {
      indexPromise = null;
      throw err;
    });

  return indexPromise;
}

export function isQuranIndexLoaded(): boolean {
  return cachedIndex !== null;
}

export function warmQuranIndex(surahs: Surah[]): void {
  void loadQuranIndex(surahs).catch(() => {
    // Callers that need the index surface the error; prefetch stays silent.
  });
}

export interface KnowledgeHit {
  categoryId: string;
  categoryTitle_bn: string;
  categoryTitle_en: string;
  article: KnowledgeArticle;
}

function matchKnowledge(q: string, qArabic: string): KnowledgeHit[] {
  const hits: KnowledgeHit[] = [];
  for (const category of KNOWLEDGE_CATEGORIES) {
    for (const article of category.articles) {
      const hay = `${article.title_bn} ${article.title_en} ${article.content_bn} ${
        article.content_en
      } ${article.reference} ${article.tags.join(' ')}`.toLowerCase();
      if (hay.includes(q) || (qArabic.length >= 2 && normalizeArabic(hay).includes(qArabic))) {
        hits.push({
          categoryId: category.id,
          categoryTitle_bn: category.title_bn,
          categoryTitle_en: category.title_en,
          article,
        });
      }
    }
  }
  return hits;
}

function matchSurahs(query: string, qArabic: string, surahs: Surah[]): Surah[] {
  const q = query.toLowerCase();
  return surahs
    .filter((s) => {
      if (String(s.surah_number) === query) return true;
      return (
        s.name_en.toLowerCase().includes(q) ||
        s.name_bn.includes(query) ||
        s.meaning_en.toLowerCase().includes(q) ||
        s.meaning_bn.includes(query) ||
        (qArabic.length >= 2 && normalizeArabic(s.name_ar).includes(qArabic))
      );
    })
    .slice(0, 12);
}

function matchHadith(query: string, qArabic: string): Hadith[] {
  const q = query.toLowerCase();
  return SEED_HADITHS.filter((h) => {
    const hay = `${h.title_bn} ${h.title_en} ${h.translation_bn} ${h.translation_en} ${h.source} ${h.hadith_number} ${h.category}`.toLowerCase();
    return hay.includes(q) || (qArabic.length >= 2 && normalizeArabic(h.arabic).includes(qArabic));
  });
}

function matchDuas(query: string, qArabic: string): Dua[] {
  const q = query.toLowerCase();
  return SEED_DUAS.filter((d) => {
    const hay = `${d.title_bn} ${d.title_en} ${d.pronunciation_bn} ${d.pronunciation_en} ${d.meaning_bn} ${d.meaning_en} ${d.reference} ${d.category}`.toLowerCase();
    return hay.includes(q) || (qArabic.length >= 2 && normalizeArabic(d.arabic).includes(qArabic));
  });
}

export interface LocalSearchInput {
  query: string;
  scope: 'all' | 'quran' | 'hadith' | 'dua';
  limit?: number;
  surahs: Surah[];
}

export interface LocalSearchResult extends GlobalSearchResponse {
  knowledgeResults: KnowledgeHit[];
  /** Set when the Quran index could not load; the rest of the search still ran. */
  quranIndexError?: string;
}

export async function runLocalSearch({
  query,
  scope,
  limit = 45,
  surahs,
}: LocalSearchInput): Promise<LocalSearchResult> {
  const trimmed = query.trim();
  const q = trimmed.toLowerCase();
  const qArabic = normalizeArabic(trimmed);
  const refMatch = trimmed.match(/^(\d{1,3})\s*[:\-]\s*(\d{1,3})$/);

  const empty: LocalSearchResult = {
    query: trimmed,
    scope,
    counts: { all: 0, quran: 0, hadith: 0, dua: 0 },
    surahMatches: [],
    quranResults: [],
    hadithResults: [],
    duaResults: [],
    knowledgeResults: [],
  };

  if (!trimmed) return empty;

  let quranIndexError: string | undefined;
  let rows: QuranRow[] = [];
  try {
    rows = await loadQuranIndex(surahs);
  } catch (err) {
    quranIndexError = err instanceof Error ? err.message : 'Search index unavailable.';
  }

  const surahMatches = scope === 'hadith' || scope === 'dua' ? [] : matchSurahs(trimmed, qArabic, surahs);

  const matchedAyahs: QuranRow[] = [];
  if (scope !== 'hadith' && scope !== 'dua') {
    for (const row of rows) {
      if (refMatch) {
        if (row.surah_number === Number(refMatch[1]) && row.ayah_number === Number(refMatch[2])) {
          matchedAyahs.push(row);
        }
        continue;
      }
      if (row.haystack.includes(q) || (qArabic.length >= 2 && row.arabicNorm.includes(qArabic))) {
        matchedAyahs.push(row);
      }
    }
  }

  const matchedHadiths = scope === 'quran' || scope === 'dua' ? [] : matchHadith(trimmed, qArabic);
  const matchedDuas = scope === 'quran' || scope === 'hadith' ? [] : matchDuas(trimmed, qArabic);
  const knowledgeResults =
    scope === 'quran' || scope === 'hadith' || scope === 'dua' ? [] : matchKnowledge(q, qArabic);

  const surahMeta = new Map<number, Surah>();
  for (const s of surahs) surahMeta.set(s.surah_number, s);

  const quranResults: QuranSearchResult[] = matchedAyahs
    .slice(0, scope === 'quran' ? limit : Math.min(limit, 25))
    .map((row) => {
      const m = surahMeta.get(row.surah_number);
      return {
        surah_number: row.surah_number,
        surah_name_bn: m?.name_bn ?? '',
        surah_name_en: m?.name_en ?? '',
        surah_name_ar: m?.name_ar ?? '',
        ayah_number: row.ayah_number,
        arabic: row.arabic,
        translation_bn: row.translation_bn,
        translation_en: row.translation_en,
      };
    });

  return {
    query: trimmed,
    scope,
    counts: {
      all: matchedAyahs.length + matchedHadiths.length + matchedDuas.length + knowledgeResults.length,
      quran: matchedAyahs.length,
      hadith: matchedHadiths.length,
      dua: matchedDuas.length,
    },
    surahMatches,
    quranResults,
    hadithResults: matchedHadiths.slice(0, limit),
    duaResults: matchedDuas.slice(0, limit),
    knowledgeResults: knowledgeResults.slice(0, limit),
    quranIndexError,
  };
}
