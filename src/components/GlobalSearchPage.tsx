import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  Copy,
  Loader2,
  MoonStar,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import type {
  Dua,
  GlobalSearchResponse,
  Hadith,
  Language,
  QuranSearchResult,
  Surah,
} from '../types/islamic';
import { cleanAyahArabic } from './QuranTafsirModal';
import { safeReadJson } from '../utils/safeFetch';

interface GlobalSearchPageProps {
  lang: Language;
  initialQuery?: string;
  onOpenQuranVerse: (surahNumber: number, ayahNumber: number) => void;
  onOpenHadith: (hadith: Hadith) => void;
  onOpenDua: (dua: Dua) => void;
}

type SearchScope = 'all' | 'quran' | 'hadith' | 'dua';

const SUGGESTED_QUERIES = [
  { q: '2:255', bn: 'আয়াতুল কুরসি (2:255)', en: 'Ayat al-Kursi (2:255)' },
  { q: 'mercy', bn: 'Mercy / রহমত', en: 'Mercy' },
  { q: 'রহমত', bn: 'রহমত', en: 'রহমত (Mercy)' },
  { q: 'patience', bn: 'Patience / ধৈর্য', en: 'Patience' },
  { q: 'Al-Fatihah', bn: 'সূরা আল-ফাতিহা', en: 'Al-Fatihah' },
];

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightText(text: string, query: string): ReactNode {
  const trimmed = query.trim();
  if (!trimmed || /^\d+:\d+$/.test(trimmed) || trimmed.length < 2) return text;
  const regex = new RegExp(`(${escapeRegExp(trimmed)})`, 'gi');
  const parts = text.split(regex);
  if (parts.length <= 1) return text;
  const lower = trimmed.toLowerCase();
  return parts.map((part, idx) =>
    part.toLowerCase() === lower ? (
      <mark key={idx} className="bg-[#f3e3b3] text-[#183027] px-0.5 rounded-xs font-semibold">
        {part}
      </mark>
    ) : (
      <span key={idx}>{part}</span>
    )
  );
}

export function GlobalSearchPage({
  lang,
  initialQuery = '',
  onOpenQuranVerse,
  onOpenHadith,
  onOpenDua,
}: GlobalSearchPageProps) {
  const [query, setQuery] = useState(initialQuery);
  const [scope, setScope] = useState<SearchScope>('all');
  const [data, setData] = useState<GlobalSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const reqSeqRef = useRef(0);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const runSearch = useMemo(
    () => async (q: string, sc: SearchScope, signal?: AbortSignal) => {
      const trimmed = q.trim();
      if (!trimmed) {
        setData(null);
        setError(null);
        setLoading(false);
        return;
      }

      const seq = ++reqSeqRef.current;
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          q: trimmed,
          scope: sc,
          limit: '45',
        });
        const res = await fetch(`/api/search?${params.toString()}`, { signal });
        const json = await safeReadJson<GlobalSearchResponse>(res, `HTTP ${res.status}`);
        if (reqSeqRef.current !== seq) return;
        setData(json);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        if (reqSeqRef.current !== seq) return;
        setError(
          lang === 'bn'
            ? 'অনুসন্ধান করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
            : 'Unable to complete search right now. Please try again.'
        );
      } finally {
        if (reqSeqRef.current === seq) {
          setLoading(false);
        }
      }
    },
    [lang]
  );

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void runSearch(trimmed, scope, controller.signal);
    }, 200);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, scope, runSearch]);

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1600);
    } catch {
      // ignore clipboard errors
    }
  };

  const counts = data?.counts ?? { all: 0, quran: 0, hadith: 0, dua: 0 };
  const surahMatches: Surah[] = data?.surahMatches ?? [];
  const quranResults: QuranSearchResult[] = data?.quranResults ?? [];
  const hadithResults: Hadith[] = data?.hadithResults ?? [];
  const duaResults: Dua[] = data?.duaResults ?? [];

  const totalShown =
    (scope === 'all' || scope === 'quran' ? surahMatches.length + quranResults.length : 0) +
    (scope === 'all' || scope === 'hadith' ? hadithResults.length : 0) +
    (scope === 'all' || scope === 'dua' ? duaResults.length : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#183027]">
          {lang === 'bn'
            ? 'সমন্বিত ইসলামিক অনুসন্ধান'
            : 'Global Islamic Search'}
        </h1>
        <p className="text-sm sm:text-base text-[#5a7066] mt-1">
          {lang === 'bn'
            ? 'কুরআনের আয়াত (১১৪ সূরা), তাফসির, সহিহ হাদিস এবং দৈনন্দিন দোয়া একসাথে খুঁজুন।'
            : 'Search across all 114 Surahs of the Holy Quran, short tafsir, Sahih Hadiths, and daily Duas.'}
        </p>
      </div>

      {/* Search Form & Scope Filters */}
      <div className="bg-white rounded-2xl border border-[#ebe6da] p-4 sm:p-5 space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runSearch(query, scope);
          }}
          className="flex flex-col sm:flex-row gap-2.5"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6e7268] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              data-testid="global-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={
                lang === 'bn'
                  ? 'কুরআন, হাদিস ও দোয়া খুঁজুন'
                  : 'Search Quran verses, hadiths, and duas'
              }
              placeholder={
                lang === 'bn'
                  ? 'উদাহরণ: 2:255, রহমত, ধৈর্য, আল-ফাতিহা, Mercy...'
                  : 'Try: 2:255, mercy, patience, Al-Fatihah, forgiveness...'
              }
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#dce7e0] bg-[#faf7f0] text-sm text-[#183027] focus:outline-none focus:border-[#087653]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label={lang === 'bn' ? 'মুছুন' : 'Clear search'}
                className="p-1 rounded-md text-[#6e7268] hover:text-[#183027] absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            data-testid="global-search-submit"
            className="px-5 py-2.5 rounded-xl bg-[#087653] hover:bg-[#065c40] text-white text-sm font-semibold transition-colors cursor-pointer shrink-0 inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>{lang === 'bn' ? 'খুঁজুন' : 'Search'}</span>
          </button>
        </form>

        {/* Scope Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex flex-wrap gap-1.5 bg-[#f5efe0] p-1 rounded-xl">
            {(
              [
                { id: 'all', bn: 'সবগুলো', en: 'All', count: counts.all },
                { id: 'quran', bn: 'কুরআন', en: 'Quran', count: counts.quran },
                { id: 'hadith', bn: 'হাদিস', en: 'Hadiths', count: counts.hadith },
                { id: 'dua', bn: 'দোয়া', en: 'Duas', count: counts.dua },
              ] as const
            ).map((tab) => {
              const active = scope === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  data-testid={`search-tab-${tab.id}`}
                  onClick={() => setScope(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                    active
                      ? 'bg-white text-[#087653] shadow-xs'
                      : 'text-[#5a7066] hover:text-[#183027]'
                  }`}
                >
                  <span>{tab[lang]}</span>
                  {data && (
                    <span
                      className={`font-mono-tabular px-1.5 py-0.2 rounded-md text-[11px] ${
                        active ? 'bg-[#eef5f0] text-[#087653]' : 'bg-white/60 text-[#6e7268]'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[#6e7268]">
              {lang === 'bn' ? 'জনপ্রিয়:' : 'Popular:'}
            </span>
            {SUGGESTED_QUERIES.map((item) => (
              <button
                key={item.q}
                type="button"
                onClick={() => setQuery(item.q)}
                className="px-2.5 py-1 rounded-lg bg-[#faf7f0] border border-[#ebe6da] hover:border-[#b58328] text-[#494e45] font-medium cursor-pointer"
              >
                {item[lang]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Empty Prompt State */}
      {!query.trim() && (
        <div className="bg-white rounded-2xl border border-[#ebe6da] p-10 text-center space-y-2">
          <Search className="w-8 h-8 text-[#b58328] mx-auto" />
          <h2 className="font-display text-lg font-bold text-[#183027]">
            {lang === 'bn'
              ? 'যেকোনো শব্দ, বিষয় বা আয়াত নম্বর লিখুন'
              : 'Enter a keyword, topic, or verse reference'}
          </h2>
          <p className="text-sm text-[#5a7066] max-w-lg mx-auto">
            {lang === 'bn'
              ? 'বাংলা, ইংরেজি, আরবি কিংবা "2:255" ফরম্যাটে সরাসরি সূরা ও আয়াত খুঁজতে পারবেন।'
              : 'Search in Bengali, English, Arabic script, or jump directly with Surah:Ayah like 2:255.'}
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] rounded-2xl p-5 text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {query.trim() && loading && !data && (
        <div className="bg-white rounded-2xl border border-[#ebe6da] p-12 text-center text-sm text-[#5a7066] flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#087653]" />
          <span>
            {lang === 'bn'
              ? 'কুরআন, হাদিস ও দোয়া থেকে খোঁজা হচ্ছে...'
              : 'Searching Quran, Hadiths, and Duas...'}
          </span>
        </div>
      )}

      {/* No Results */}
      {query.trim() && data && !loading && totalShown === 0 && (
        <div className="bg-white rounded-2xl border border-[#ebe6da] p-10 text-center space-y-2">
          <p className="font-bold text-base text-[#183027]">
            {lang === 'bn'
              ? `"${data.query}" এর জন্য কোনো ফলাফল পাওয়া যায়নি`
              : `No matches found for "${data.query}"`}
          </p>
          <p className="text-xs text-[#5a7066]">
            {lang === 'bn'
              ? 'ভিন্ন শব্দ বা "সবগুলো" ট্যাবে চেষ্টা করে দেখুন।'
              : 'Try another keyword, check spelling, or switch back to the All tab.'}
          </p>
        </div>
      )}

      {/* Matching Surahs Quick Directory */}
      {data &&
        (scope === 'all' || scope === 'quran') &&
        surahMatches.length > 0 && (
          <section className="space-y-3" data-testid="search-section-surahs">
            <h2 className="text-sm font-bold text-[#183027] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#087653]" />
              <span>
                {lang === 'bn'
                  ? `মিল পাওয়া সূরা (${surahMatches.length})`
                  : `Matching Surahs (${surahMatches.length})`}
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {surahMatches.map((s) => (
                <button
                  key={s.surah_number}
                  type="button"
                  onClick={() => onOpenQuranVerse(s.surah_number, 1)}
                  className="bg-white rounded-xl border border-[#ebe6da] hover:border-[#087653] p-4 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-[#6e7268] font-mono-tabular">
                      {lang === 'bn' ? `সূরা ${s.surah_number}` : `Surah ${s.surah_number}`} ·{' '}
                      {s.total_ayahs} {lang === 'bn' ? 'আয়াত' : 'Ayahs'}
                    </p>
                    <p className="text-sm font-bold text-[#183027] truncate mt-0.5">
                      {highlightText(lang === 'bn' ? s.name_bn : s.name_en, data.query)}
                    </p>
                    <p className="text-xs text-[#5a7066] truncate">
                      {lang === 'bn' ? s.meaning_bn : s.meaning_en}
                    </p>
                  </div>
                  <span className="font-arabic text-xl text-[#087653] shrink-0">
                    {s.name_ar}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

      {/* Quran Verses Section */}
      {data && (scope === 'all' || scope === 'quran') && quranResults.length > 0 && (
        <section className="space-y-3" data-testid="search-section-quran">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#183027] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#087653]" />
              <span>
                {lang === 'bn'
                  ? `কুরআনের আয়াত (${quranResults.length})`
                  : `Quranic Verses (${quranResults.length})`}
              </span>
            </h2>
          </div>

          <div className="space-y-3">
            {quranResults.map((v) => {
              const copyId = `q-${v.surah_number}-${v.ayah_number}`;
              const shortTafsir =
                lang === 'bn'
                  ? v.short_tafsir_bn || v.short_tafsir_en
                  : v.short_tafsir_en || v.short_tafsir_bn;
              return (
                <article
                  key={`${v.surah_number}:${v.ayah_number}`}
                  className="bg-white rounded-2xl border border-[#dce7e0] p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tabular text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#eef5f0] text-[#087653]">
                        {v.surah_number}:{v.ayah_number}
                      </span>
                      <span className="text-sm font-semibold text-[#183027]">
                        {lang === 'bn' ? v.surah_name_bn : v.surah_name_en}
                      </span>
                      <span className="font-arabic text-base text-[#087653]">
                        {v.surah_name_ar}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            copyId,
                            `${v.arabic}\n${lang === 'bn' ? v.translation_bn : v.translation_en} (${v.surah_number}:${v.ayah_number})`
                          )
                        }
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#5a7066] hover:text-[#087653] cursor-pointer"
                      >
                        {copiedKey === copyId ? (
                          <Check className="w-3.5 h-3.5 text-[#087653]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedKey === copyId ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied') : lang === 'bn' ? 'কপি' : 'Copy'}</span>
                      </button>

                      <button
                        type="button"
                        data-testid={`search-open-quran-${v.surah_number}-${v.ayah_number}`}
                        onClick={() => onOpenQuranVerse(v.surah_number, v.ayah_number)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#087653] hover:bg-[#065c40] text-white text-xs font-semibold cursor-pointer"
                      >
                        <span>{lang === 'bn' ? 'কুরআনে পড়ুন' : 'Open in Quran'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="font-arabic text-2xl text-[#183027] text-right leading-loose">
                    {cleanAyahArabic(v.arabic, v.surah_number, v.ayah_number)}
                  </p>

                  <p className="text-sm sm:text-base text-[#183027] font-medium">
                    {highlightText(
                      lang === 'bn' ? v.translation_bn : v.translation_en,
                      data.query
                    )}
                  </p>
                  <p className="text-xs text-[#5a7066]">
                    {highlightText(
                      lang === 'bn' ? v.translation_en : v.translation_bn,
                      data.query
                    )}
                  </p>

                  {shortTafsir && (
                    <div className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] p-3 text-xs text-[#494e45] leading-relaxed">
                      <span className="font-semibold text-[#8f6319] mr-1.5">
                        {lang === 'bn' ? 'সংক্ষিপ্ত তাফসির:' : 'Short Tafsir:'}
                      </span>
                      {highlightText(shortTafsir, data.query)}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Hadiths Section */}
      {data && (scope === 'all' || scope === 'hadith') && hadithResults.length > 0 && (
        <section className="space-y-3" data-testid="search-section-hadith">
          <h2 className="text-base font-bold text-[#183027] flex items-center gap-2">
            <MoonStar className="w-4 h-4 text-[#b58328]" />
            <span>
              {lang === 'bn'
                ? `সহিহ হাদিস (${hadithResults.length})`
                : `Sahih Hadiths (${hadithResults.length})`}
            </span>
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {hadithResults.map((h) => {
              const copyId = `h-${h.id}`;
              return (
                <article
                  key={h.id}
                  className="bg-white rounded-2xl border border-[#ebe6da] p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-[#5a7066] flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-[#f5efe0] text-[#8f6319] font-semibold">
                        {h.category}
                      </span>
                      <span>
                        {h.source} #{h.hadith_number}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            copyId,
                            `${h.arabic}\n${lang === 'bn' ? h.translation_bn : h.translation_en} (${h.source} #${h.hadith_number})`
                          )
                        }
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#5a7066] hover:text-[#087653] cursor-pointer"
                      >
                        {copiedKey === copyId ? (
                          <Check className="w-3.5 h-3.5 text-[#087653]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedKey === copyId ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied') : lang === 'bn' ? 'কপি' : 'Copy'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenHadith(h)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#faf7f0] border border-[#ebe6da] hover:border-[#b58328] text-xs font-semibold text-[#8f6319] cursor-pointer"
                      >
                        <span>{lang === 'bn' ? 'হাদিস দেখুন' : 'Open Hadith'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-[#183027]">
                    {highlightText(lang === 'bn' ? h.title_bn : h.title_en, data.query)}
                  </h3>

                  {h.arabic && (
                    <p className="font-arabic text-xl text-[#087653] text-right leading-loose">
                      {h.arabic}
                    </p>
                  )}

                  <p className="text-sm sm:text-base text-[#183027]">
                    {highlightText(
                      lang === 'bn' ? h.translation_bn : h.translation_en,
                      data.query
                    )}
                  </p>
                  <p className="text-xs text-[#5a7066]">
                    {highlightText(
                      lang === 'bn' ? h.translation_en : h.translation_bn,
                      data.query
                    )}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Duas Section */}
      {data && (scope === 'all' || scope === 'dua') && duaResults.length > 0 && (
        <section className="space-y-3" data-testid="search-section-dua">
          <h2 className="text-base font-bold text-[#183027] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#087653]" />
            <span>
              {lang === 'bn'
                ? `দৈনন্দিন দোয়া (${duaResults.length})`
                : `Daily Duas (${duaResults.length})`}
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {duaResults.map((d) => {
              const copyId = `d-${d.id}`;
              return (
                <article
                  key={d.id}
                  className="bg-white rounded-2xl border border-[#ebe6da] p-5 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 text-xs text-[#5a7066]">
                      <span className="px-2 py-0.5 rounded-md bg-[#eef5f0] text-[#087653] font-semibold">
                        {d.category} · {d.reference}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              copyId,
                              `${d.arabic}\n${lang === 'bn' ? d.meaning_bn : d.meaning_en}`
                            )
                          }
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#5a7066] hover:text-[#087653] cursor-pointer"
                        >
                          {copiedKey === copyId ? (
                            <Check className="w-3.5 h-3.5 text-[#087653]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenDua(d)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#faf7f0] border border-[#ebe6da] hover:border-[#087653] text-xs font-semibold text-[#087653] cursor-pointer"
                        >
                          <span>{lang === 'bn' ? 'দোয়া দেখুন' : 'Open Dua'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-[#183027]">
                      {highlightText(lang === 'bn' ? d.title_bn : d.title_en, data.query)}
                    </h3>

                    <p className="font-arabic text-2xl text-[#087653] text-right leading-loose">
                      {d.arabic}
                    </p>

                    <p className="text-xs font-medium text-[#494e45]">
                      {highlightText(
                        lang === 'bn' ? d.pronunciation_bn : d.pronunciation_en,
                        data.query
                      )}
                    </p>

                    <p className="text-sm text-[#5a7066]">
                      {highlightText(
                        lang === 'bn' ? d.meaning_bn : d.meaning_en,
                        data.query
                      )}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
