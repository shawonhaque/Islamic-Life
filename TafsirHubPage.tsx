import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Compass,
  Globe2,
  Layers,
  Loader2,
  Search,
  ScrollText,
  Sparkles,
} from 'lucide-react';
import { TAFSIR_EDITIONS, THEMATIC_TAFSIR_TOPICS } from '../data/islamicModulesData';
import type {
  Language,
  QuranSearchResult,
  Surah,
  TafsirEdition,
  TafsirReadResponse,
  TafsirViewTab,
} from '../types/islamic';
import { safeReadJson } from '../utils/safeFetch';

interface TafsirHubPageProps {
  lang: Language;
  surahs: Surah[];
  onOpenInQuran?: (surahNumber: number, ayahNumber: number) => void;
}

const FAMOUS_VERSE_CHIPS: Array<{ surah: number; ayah: number; bn: string; en: string }> = [
  { surah: 1, ayah: 1, bn: 'আল-ফাতিহা (১:১)', en: 'Al-Fatihah (1:1)' },
  { surah: 2, ayah: 255, bn: 'আয়াতুল কুরসি (২:২৫৫)', en: 'Ayat al-Kursi (2:255)' },
  { surah: 2, ayah: 286, bn: 'বাকারা শেষ আয়াত (২:২৮৬)', en: 'Al-Baqarah (2:286)' },
  { surah: 94, ayah: 5, bn: 'কষ্টের পর স্বস্তি (৯৪:৫)', en: 'Al-Sharh (94:5)' },
  { surah: 103, ayah: 1, bn: 'সূরা আল-আসর (১০৩:১)', en: 'Al-Asr (103:1)' },
  { surah: 112, ayah: 1, bn: 'সূরা আল-ইখলাস (১১২:১)', en: 'Al-Ikhlas (112:1)' },
];

const SEARCH_SUGGESTIONS: Array<{ q: string; bn: string; en: string }> = [
  { q: 'রহমত', bn: 'রহমত', en: 'Mercy (রহমত)' },
  { q: 'ধৈর্য', bn: 'ধৈর্য ও সবর', en: 'Patience (ধৈর্য)' },
  { q: 'রোজা', bn: 'রোজা ও তাকওয়া', en: 'Fasting (রোজা)' },
  { q: '2:255', bn: '২:২৫৫ (আয়াতুল কুরসি)', en: '2:255 (Ayat al-Kursi)' },
  { q: 'নামাজ', bn: 'নামাজ ও সালাত', en: 'Prayer (নামাজ)' },
];

export function TafsirHubPage({ lang, surahs, onOpenInQuran }: TafsirHubPageProps) {
  const [activeTab, setActiveTab] = useState<TafsirViewTab>('all');
  const [selectedEditionId, setSelectedEditionId] = useState<string>('bn-ibn-kathir');
  const [selectedSurahNum, setSelectedSurahNum] = useState<number>(1);
  const [selectedAyahNum, setSelectedAyahNum] = useState<number>(1);

  const [surahSearch, setSurahSearch] = useState<string>('');
  const [surahFilter, setSurahFilter] = useState<'all' | 'makki' | 'madani' | 'short'>('all');
  const [ayahJumpInput, setAyahJumpInput] = useState<string>('1:1');

  const [tafsirData, setTafsirData] = useState<TafsirReadResponse | null>(null);
  const [loadingTafsir, setLoadingTafsir] = useState<boolean>(false);

  const [tafsirSearchQuery, setTafsirSearchQuery] = useState<string>('');
  const [tafsirSearchResults, setTafsirSearchResults] = useState<QuranSearchResult[]>([]);
  const [searchingTafsir, setSearchingTafsir] = useState<boolean>(false);

  const readerPanelRef = useRef<HTMLDivElement | null>(null);

  const activeSurah = useMemo(
    () => surahs.find((s) => s.surah_number === selectedSurahNum) ?? surahs[0] ?? null,
    [surahs, selectedSurahNum]
  );

  const activeEdition: TafsirEdition = useMemo(
    () => TAFSIR_EDITIONS.find((e) => e.id === selectedEditionId) ?? TAFSIR_EDITIONS[0],
    [selectedEditionId]
  );

  const bnEditions = useMemo(
    () => TAFSIR_EDITIONS.filter((e) => e.language === 'bn'),
    []
  );
  const enEditions = useMemo(
    () => TAFSIR_EDITIONS.filter((e) => e.language === 'en'),
    []
  );
  const arEditions = useMemo(
    () => TAFSIR_EDITIONS.filter((e) => e.language === 'ar'),
    []
  );

  const filteredSurahs = useMemo(() => {
    const q = surahSearch.trim().toLowerCase();
    return surahs.filter((s) => {
      if (surahFilter === 'makki' && s.revelation_type !== 'Makki') {
        return false;
      }
      if (surahFilter === 'madani' && s.revelation_type !== 'Madani') {
        return false;
      }
      if (surahFilter === 'short' && s.surah_number < 93 && s.surah_number !== 1) {
        return false;
      }
      if (!q) return true;
      return (
        String(s.surah_number) === q ||
        s.name_en.toLowerCase().includes(q) ||
        s.name_bn.toLowerCase().includes(q) ||
        s.name_ar.includes(q)
      );
    });
  }, [surahs, surahSearch, surahFilter]);

  const handleSelectTab = (tab: TafsirViewTab) => {
    setActiveTab(tab);
    if (tab === 'bn' && activeEdition.language !== 'bn') {
      setSelectedEditionId('bn-ibn-kathir');
    } else if (tab === 'en' && activeEdition.language !== 'en') {
      setSelectedEditionId('en-ibn-kathir');
    } else if (tab === 'ar' && activeEdition.language !== 'ar') {
      setSelectedEditionId('ar-ibn-kathir');
    }
  };

  const fetchEditionTafsir = useCallback(
    async (editionId: string, surahNum: number, ayahNum: number) => {
      setLoadingTafsir(true);
      try {
        const res = await fetch(
          `/api/tafsir/read?edition=${encodeURIComponent(editionId)}&surah=${surahNum}&ayah=${ayahNum}`
        );
        if (res.ok) {
          const data = await safeReadJson<TafsirReadResponse>(res);
          setTafsirData(data);
        }
      } catch {
        // ignore network issues
      } finally {
        setLoadingTafsir(false);
      }
    },
    []
  );

  useEffect(() => {
    if (activeTab !== 'thematic' && activeTab !== 'search') {
      void fetchEditionTafsir(selectedEditionId, selectedSurahNum, selectedAyahNum);
    }
  }, [activeTab, selectedEditionId, selectedSurahNum, selectedAyahNum, fetchEditionTafsir]);

  useEffect(() => {
    setAyahJumpInput(`${selectedSurahNum}:${selectedAyahNum}`);
  }, [selectedSurahNum, selectedAyahNum]);

  const handleSearchTafsir = async (query: string) => {
    const q = query.trim();
    if (!q) {
      setTafsirSearchResults([]);
      return;
    }
    setSearchingTafsir(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&scope=quran&limit=24`);
      if (res.ok) {
        const data = await safeReadJson<{ quranResults?: QuranSearchResult[] }>(res);
        setTafsirSearchResults(Array.isArray(data.quranResults) ? data.quranResults : []);
      }
    } catch {
      setTafsirSearchResults([]);
    } finally {
      setSearchingTafsir(false);
    }
  };

  const handleAyahJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const match = ayahJumpInput.trim().match(/^(\d{1,3})\s*[:\-.\s]\s*(\d{1,3})$/);
    if (!match) return;
    const sNum = Math.max(1, Math.min(114, Number(match[1])));
    const targetSurah = surahs.find((s) => s.surah_number === sNum);
    const maxAyah = targetSurah?.total_ayahs ?? 286;
    const aNum = Math.max(1, Math.min(maxAyah, Number(match[2])));
    setSelectedSurahNum(sNum);
    setSelectedAyahNum(aNum);
  };

  const stepAyah = (delta: -1 | 1) => {
    const maxAyah = activeSurah?.total_ayahs ?? 7;
    if (delta === -1) {
      if (selectedAyahNum > 1) {
        setSelectedAyahNum(selectedAyahNum - 1);
      } else if (selectedSurahNum > 1) {
        const prevSurah = surahs.find((s) => s.surah_number === selectedSurahNum - 1);
        setSelectedSurahNum(selectedSurahNum - 1);
        setSelectedAyahNum(prevSurah?.total_ayahs ?? 1);
      }
    } else {
      if (selectedAyahNum < maxAyah) {
        setSelectedAyahNum(selectedAyahNum + 1);
      } else if (selectedSurahNum < 114) {
        setSelectedSurahNum(selectedSurahNum + 1);
        setSelectedAyahNum(1);
      }
    }
  };

  const visibleLanguageEditions = useMemo(() => {
    if (activeTab === 'bn') return bnEditions;
    if (activeTab === 'en') return enEditions;
    if (activeTab === 'ar') return arEditions;
    return TAFSIR_EDITIONS;
  }, [activeTab, bnEditions, enEditions, arEditions]);

  const tabs: Array<{ id: TafsirViewTab; bn: string; en: string }> = [
    { id: 'all', bn: 'সকল তাফসির', en: 'All Tafsirs' },
    { id: 'by-surah', bn: 'সূরা অনুযায়ী তাফসির', en: 'By Surah' },
    { id: 'by-ayah', bn: 'আয়াত অনুযায়ী তাফসির', en: 'By Ayah' },
    { id: 'bn', bn: 'বাংলা তাফসির', en: 'Bengali Tafsirs' },
    { id: 'en', bn: 'English Tafsirs', en: 'English Tafsirs' },
    { id: 'ar', bn: 'আরবি তাফসির', en: 'Arabic Tafsirs' },
    { id: 'thematic', bn: 'বিষয়ভিত্তিক তাফসির', en: 'Thematic Tafsirs' },
    { id: 'search', bn: 'তাফসির সার্চ', en: 'Search' },
  ];

  const langGroupBadge = (code: TafsirEdition['language']) => {
    if (code === 'ar') return lang === 'bn' ? 'আরবি তাফসির' : 'Arabic';
    if (code === 'bn') return lang === 'bn' ? 'বাংলা তাফসির' : 'Bengali';
    return 'English';
  };

  const openEditionInReader = (editionId: string) => {
    setSelectedEditionId(editionId);
    readerPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  // Reusable Reader Card used by By Surah, By Ayah, Language Studios, and All Tafsirs preview
  const renderTafsirReader = () => (
    <section
      ref={readerPanelRef}
      className="bg-white rounded-2xl border border-[#dce7e0] p-5 sm:p-6 space-y-5"
    >
      {/* Surah & Ayah Selector Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pb-4 border-b border-[#eef5f0]">
        <label className="sm:col-span-6 text-xs font-medium text-[#5a7066]">
          <span>{lang === 'bn' ? 'সূরা নির্বাচন করুন' : 'Select Surah'}</span>
          <select
            data-testid="tafsir-surah-select"
            value={selectedSurahNum}
            onChange={(e) => {
              setSelectedSurahNum(Number(e.target.value));
              setSelectedAyahNum(1);
            }}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-[#dce7e0] bg-[#f7faf8] text-sm font-semibold text-[#183027]"
          >
            {surahs.map((s) => (
              <option key={s.surah_number} value={s.surah_number}>
                {s.surah_number}. {lang === 'bn' ? s.name_bn : s.name_en} ({s.total_ayahs})
              </option>
            ))}
          </select>
        </label>

        <label className="sm:col-span-3 text-xs font-medium text-[#5a7066]">
          <span>{lang === 'bn' ? 'আয়াত নং' : 'Ayah #'}</span>
          <select
            data-testid="tafsir-ayah-select"
            value={selectedAyahNum}
            onChange={(e) => setSelectedAyahNum(Number(e.target.value))}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-[#dce7e0] bg-[#f7faf8] font-mono-tabular text-sm font-semibold text-[#183027]"
          >
            {Array.from({ length: activeSurah?.total_ayahs ?? 7 }).map((_, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {idx + 1}
              </option>
            ))}
          </select>
        </label>

        <div className="sm:col-span-3 flex items-end gap-1.5">
          <button
            type="button"
            onClick={() => stepAyah(-1)}
            aria-label={lang === 'bn' ? 'আগের আয়াত' : 'Previous Ayah'}
            className="p-2 rounded-lg border border-[#dce7e0] text-[#183027] hover:bg-[#eef5f0] cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => stepAyah(1)}
            aria-label={lang === 'bn' ? 'পরের আয়াত' : 'Next Ayah'}
            className="p-2 rounded-lg border border-[#dce7e0] text-[#183027] hover:bg-[#eef5f0] cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {onOpenInQuran && (
            <button
              type="button"
              onClick={() => onOpenInQuran(selectedSurahNum, selectedAyahNum)}
              className="flex-1 py-2 px-2.5 rounded-lg border border-[#087653] text-[#087653] hover:bg-[#eef5f0] text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              {lang === 'bn' ? 'কুরআনে পড়ুন' : 'In Quran'}
            </button>
          )}
        </div>
      </div>

      {/* Active Edition Metadata */}
      <div className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-[#8f6319]">
            {langGroupBadge(activeEdition.language)} ·{' '}
            {lang === 'bn' ? activeEdition.author_bn : activeEdition.author_en}
          </p>
          <h2 className="text-lg font-bold text-[#183027] mt-0.5">
            {lang === 'bn' ? activeEdition.name_bn : activeEdition.name_en}
          </h2>
          <p className="text-xs text-[#5a7066] mt-0.5">
            {lang === 'bn' ? activeEdition.methodology_bn : activeEdition.methodology_en}
          </p>
        </div>
        <span className="font-arabic text-xl text-[#087653]">{activeEdition.name_ar}</span>
      </div>

      {/* Verse + Commentary Content */}
      {loadingTafsir ? (
        <div className="py-14 flex flex-col items-center justify-center gap-2 text-sm text-[#5a7066]">
          <Loader2 className="w-5 h-5 animate-spin text-[#087653]" />
          <span>
            {lang === 'bn' ? 'তাফসির লোড হচ্ছে...' : 'Loading Tafsir commentary...'}
          </span>
        </div>
      ) : tafsirData ? (
        <div className="space-y-5" data-testid="tafsir-reader-content">
          <div className="space-y-3 pb-4 border-b border-[#eef5f0]">
            <div className="flex items-center justify-between">
              <span className="font-mono-tabular text-xs font-bold px-2.5 py-1 rounded-md bg-[#eef5f0] text-[#087653]">
                {tafsirData.surah_number}:{tafsirData.ayah_number}
              </span>
              <span className="text-xs text-[#5a7066]">
                {activeSurah ? (lang === 'bn' ? activeSurah.name_bn : activeSurah.name_en) : ''}
              </span>
            </div>

            <p className="font-arabic text-3xl text-[#183027] text-right leading-loose">
              {tafsirData.arabic}
            </p>

            <p className="text-sm sm:text-base font-medium text-[#183027]">
              {lang === 'bn' ? tafsirData.translation_bn : tafsirData.translation_en}
            </p>
          </div>

          {tafsirData.short_tafsir_bn && (
            <div className="rounded-xl bg-[#f7faf8] border border-[#dce7e0] p-4 space-y-1.5">
              <p className="text-xs font-bold text-[#087653] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {lang === 'bn'
                    ? 'সংক্ষিপ্ত সারসংক্ষেপ (আল-মুখতাসার)'
                    : 'Concise Summary (Al-Mukhtasar)'}
                </span>
              </p>
              <p className="text-sm text-[#2d453b] leading-relaxed">
                {lang === 'bn'
                  ? tafsirData.short_tafsir_bn
                  : tafsirData.short_tafsir_en || tafsirData.short_tafsir_bn}
              </p>
            </div>
          )}

          <div className="rounded-xl bg-[#eef5f0]/55 border border-[#087653]/25 p-5 space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs font-bold text-[#064b37]">
              <span className="inline-flex items-center gap-1.5">
                <ScrollText className="w-4 h-4" />
                <span>{lang === 'bn' ? activeEdition.name_bn : activeEdition.name_en}</span>
              </span>
              <span className="inline-flex items-center gap-1 font-medium text-[#5a7066]">
                <BookOpen className="w-3.5 h-3.5" />
                <span>
                  {tafsirData.surah_number}:{tafsirData.ayah_number}
                </span>
              </span>
            </div>

            <p
              dir={activeEdition.language === 'ar' ? 'rtl' : 'ltr'}
              className={`text-sm sm:text-base text-[#183027] leading-relaxed whitespace-pre-line ${
                activeEdition.language === 'ar' ? 'font-arabic text-xl leading-loose' : ''
              }`}
            >
              {tafsirData.commentary}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );

  const renderCategorySection = (
    titleBn: string,
    titleEn: string,
    subtitleBn: string,
    subtitleEn: string,
    editions: TafsirEdition[],
    targetLangTab: TafsirViewTab
  ) => (
    <section
      key={targetLangTab}
      data-testid={`tafsir-category-${targetLangTab}`}
      className="bg-white rounded-2xl border border-[#dce7e0] p-5 sm:p-6 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#eef5f0]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#183027]">
              {lang === 'bn' ? titleBn : titleEn}
            </h2>
            <span className="px-2 py-0.5 rounded-md bg-[#eef5f0] text-[#087653] text-xs font-bold">
              {editions.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#5a7066] mt-0.5">
            {lang === 'bn' ? subtitleBn : subtitleEn}
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSelectTab(targetLangTab)}
          className="px-3 py-1.5 rounded-lg bg-[#faf7f0] border border-[#ebe6da] hover:border-[#087653] text-xs font-semibold text-[#087653] cursor-pointer"
        >
          {lang === 'bn' ? 'আলাদা ট্যাবে দেখুন →' : 'Open Section →'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {editions.map((ed) => {
          const isSelected = ed.id === selectedEditionId;
          return (
            <button
              key={ed.id}
              type="button"
              data-testid={`tafsir-edition-${ed.id}`}
              onClick={() => openEditionInReader(ed.id)}
              className={`text-left p-4 rounded-xl border transition-colors cursor-pointer flex flex-col justify-between gap-2.5 ${
                isSelected
                  ? 'bg-[#eef5f0] border-[#087653]'
                  : 'bg-[#faf7f0]/65 border-[#ebe6da] hover:border-[#b58328]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-[#8f6319]">
                    {langGroupBadge(ed.language)}
                  </span>
                  <span className="font-arabic text-base text-[#087653]">{ed.name_ar}</span>
                </div>
                <p className="text-sm font-bold text-[#183027] mt-1.5">
                  {lang === 'bn' ? ed.name_bn : ed.name_en}
                </p>
                <p className="text-xs text-[#5a7066] mt-0.5">
                  {lang === 'bn' ? ed.author_bn : ed.author_en}
                </p>
                <p className="text-xs text-[#494e45] mt-2 line-clamp-2">
                  {lang === 'bn' ? ed.methodology_bn : ed.methodology_en}
                </p>
              </div>
              <span className="text-xs font-semibold text-[#087653]">
                {isSelected
                  ? lang === 'bn'
                    ? 'নির্বাচিত · নিচে পড়ুন ↓'
                    : 'Selected · Read Below ↓'
                  : lang === 'bn'
                  ? 'তাফসির পড়ুন →'
                  : 'Select & Read →'}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#183027]">
          {lang === 'bn'
            ? 'বিশ্বকোষীয় তাফসির লাইব্রেরি (আরবি, বাংলা ও ইংরেজি)'
            : 'Encyclopedic Tafsir Hub (Arabic, Bengali & English)'}
        </h1>
        <p className="text-[#5a7066] mt-1">
          {lang === 'bn'
            ? 'তাফসির ইবনে কাসির, আত-তাবারি, কুরতুবি, বাগাভি, জালালাইন, ফি যিলালিল কুরআন, আহসানুল বায়ান, ফাতহুল মাজিদ, তাফহীমুল কুরআন, মারেফুল কুরআন, আস-সাদী ও দ্য ক্লিয়ার কুরআন।'
            : 'Explore structured Tafsir editions across Bengali, English, and Arabic — browse by Surah, inspect Ayah-by-Ayah, study Thematic Tafsirs, or search verses.'}
        </p>

        {/* 8 Structured Category Navigation Tabs */}
        <div
          role="tablist"
          aria-label={lang === 'bn' ? 'তাফসির বিভাগসমূহ' : 'Tafsir Categories'}
          className="mt-5 flex flex-wrap gap-1.5 bg-[#eef5f0] p-1.5 rounded-xl"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              data-testid={`tafsir-tab-${t.id}`}
              onClick={() => handleSelectTab(t.id)}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === t.id
                  ? 'bg-white text-[#087653] shadow-xs font-semibold'
                  : 'text-[#5a7066] hover:text-[#183027]'
              }`}
            >
              {t[lang]}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 1: ALL TAFSIRS (3 Organized Language Catalogs + Active Reader) */}
      {activeTab === 'all' && (
        <div className="space-y-6" data-testid="tafsir-section-all">
          {renderCategorySection(
            'বাংলা তাফসিরসমূহ',
            'Bengali Tafsirs',
            'সহিহ হাদিস ও আকীদাভিত্তিক প্রামাণ্য ৬টি বাংলা তাফসির গ্রন্থ।',
            '6 authentic Bengali commentaries from classical and contemporary scholars.',
            bnEditions,
            'bn'
          )}

          {renderCategorySection(
            'English Tafsirs',
            'English Tafsirs',
            'আন্তর্জাতিক পরিমণ্ডলে সর্বাধিক পঠিত ৫টি ইংরেজি তাফসির।',
            '5 renowned English translations & commentaries including Ibn Kathir, As-Sa’di, and The Clear Quran.',
            enEditions,
            'en'
          )}

          {renderCategorySection(
            'আরবি তাফসিরসমূহ (التفاسير العربية)',
            'Arabic Tafsirs',
            'মূল আরবি ভাষায় ৬টি ক্লাসিক্যাল ও আধুনিক বিশ্বকোষীয় তাফসির।',
            '6 foundational Arabic commentaries including Ibn Kathir, At-Tabari, Al-Qurtubi, Al-Baghawi, Al-Jalalayn, and Fi Zilal.',
            arEditions,
            'ar'
          )}

          {renderTafsirReader()}
        </div>
      )}

      {/* SECTION 2: BY SURAH (114-Surah Filterable Directory + Surah Overview & Tafsir Reader) */}
      {activeTab === 'by-surah' && (
        <div
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
          data-testid="tafsir-section-by-surah"
        >
          <aside className="lg:col-span-4 bg-white rounded-2xl border border-[#dce7e0] p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#eef5f0]">
              <h2 className="text-sm font-bold text-[#183027] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#087653]" />
                <span>
                  {lang === 'bn'
                    ? `সূরা তালিকা (${filteredSurahs.length})`
                    : `Surah Directory (${filteredSurahs.length})`}
                </span>
              </h2>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#5a7066] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={surahSearch}
                onChange={(e) => setSurahSearch(e.target.value)}
                placeholder={lang === 'bn' ? 'সূরা খুঁজুন (নাম বা নম্বর)...' : 'Filter Surah by name or #...'}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-[#dce7e0] bg-[#f7faf8] focus:outline-none focus:border-[#087653]"
              />
            </div>

            <div className="flex flex-wrap gap-1">
              {(
                [
                  { id: 'all', bn: 'সব', en: 'All' },
                  { id: 'makki', bn: 'মক্কী', en: 'Makki' },
                  { id: 'madani', bn: 'মাদানী', en: 'Madani' },
                  { id: 'short', bn: 'ছোট সূরা', en: 'Short' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSurahFilter(f.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                    surahFilter === f.id
                      ? 'bg-[#087653] text-white'
                      : 'bg-[#eef5f0] text-[#5a7066] hover:text-[#183027]'
                  }`}
                >
                  {f[lang]}
                </button>
              ))}
            </div>

            <div className="max-h-[520px] overflow-y-auto space-y-1.5 pr-1">
              {filteredSurahs.map((s) => {
                const active = s.surah_number === selectedSurahNum;
                return (
                  <button
                    key={s.surah_number}
                    type="button"
                    onClick={() => {
                      setSelectedSurahNum(s.surah_number);
                      setSelectedAyahNum(1);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                      active
                        ? 'bg-[#eef5f0] border-[#087653]'
                        : 'bg-[#faf7f0]/50 border-[#ebe6da] hover:border-[#b58328]'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#183027] truncate">
                        {s.surah_number}. {lang === 'bn' ? s.name_bn : s.name_en}
                      </p>
                      <p className="text-[11px] text-[#5a7066]">
                        {lang === 'bn'
                          ? s.revelation_type === 'Makki'
                            ? 'মক্কী'
                            : 'মাদানী'
                          : s.revelation_type}{' '}
                        · {s.total_ayahs} {lang === 'bn' ? 'আয়াত' : 'Ayahs'}
                      </p>
                    </div>
                    <span className="font-arabic text-base text-[#087653] shrink-0">
                      {s.name_ar}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="lg:col-span-8 space-y-5">
            {activeSurah && (
              <div className="bg-white rounded-2xl border border-[#dce7e0] p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-[#8f6319]">
                      {lang === 'bn'
                        ? `সূরা নং ${activeSurah.surah_number} · ${
                            activeSurah.revelation_type === 'Makki' ? 'মক্কী' : 'মাদানী'
                          }`
                        : `Surah ${activeSurah.surah_number} · ${activeSurah.revelation_type}`}
                    </span>
                    <h2 className="text-xl font-bold text-[#183027]">
                      {lang === 'bn' ? activeSurah.name_bn : activeSurah.name_en}{' '}
                      <span className="font-arabic text-[#087653] ml-1">{activeSurah.name_ar}</span>
                    </h2>
                  </div>

                  <select
                    aria-label={lang === 'bn' ? 'তাফসির সংস্করণ' : 'Tafsir Edition'}
                    value={selectedEditionId}
                    onChange={(e) => setSelectedEditionId(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#dce7e0] bg-[#f7faf8] text-xs font-semibold text-[#183027]"
                  >
                    {TAFSIR_EDITIONS.map((ed) => (
                      <option key={ed.id} value={ed.id}>
                        {lang === 'bn' ? ed.name_bn : ed.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#eef5f0]">
                  {Array.from({ length: Math.min(activeSurah.total_ayahs, 20) }).map((_, idx) => {
                    const aNum = idx + 1;
                    return (
                      <button
                        key={aNum}
                        type="button"
                        onClick={() => setSelectedAyahNum(aNum)}
                        className={`px-2.5 py-1 rounded-md font-mono-tabular text-xs font-semibold cursor-pointer ${
                          selectedAyahNum === aNum
                            ? 'bg-[#087653] text-white'
                            : 'bg-[#f7faf8] border border-[#dce7e0] text-[#5a7066] hover:text-[#183027]'
                        }`}
                      >
                        {aNum}
                      </button>
                    );
                  })}
                  {activeSurah.total_ayahs > 20 && (
                    <span className="text-[11px] text-[#5a7066] self-center ml-1">
                      {lang === 'bn'
                        ? `(+আরও আয়াত নিচের ড্রপডাউনে)`
                        : `(+more in Ayah selector)`}
                    </span>
                  )}
                </div>
              </div>
            )}

            {renderTafsirReader()}
          </div>
        </div>
      )}

      {/* SECTION 3: BY AYAH (Direct Surah:Ayah Jumper + Famous Verse Chips + Multi-Edition Side Selector) */}
      {activeTab === 'by-ayah' && (
        <div className="space-y-5" data-testid="tafsir-section-by-ayah">
          <div className="bg-white rounded-2xl border border-[#dce7e0] p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#183027] flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#087653]" />
                  <span>
                    {lang === 'bn'
                      ? 'নির্দিষ্ট আয়াত অনুযায়ী তাফসির অনুসন্ধান'
                      : 'Direct Ayah-by-Ayah Tafsir Lookup'}
                  </span>
                </h2>
                <p className="text-xs text-[#5a7066]">
                  {lang === 'bn'
                    ? 'সূরা:আয়াত নম্বর লিখে বা নিচের জনপ্রিয় আয়াতগুলো থেকে সরাসরি নির্বাচন করুন।'
                    : 'Jump straight to any Surah:Ayah coordinate or choose a highlighted verse below.'}
                </p>
              </div>

              <form onSubmit={handleAyahJumpSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={ayahJumpInput}
                  onChange={(e) => setAyahJumpInput(e.target.value)}
                  placeholder="2:255"
                  aria-label={lang === 'bn' ? 'সূরা:আয়াত নম্বর' : 'Surah:Ayah coordinate'}
                  className="w-24 px-3 py-1.5 rounded-lg border border-[#dce7e0] bg-[#f7faf8] font-mono-tabular text-sm font-semibold text-[#183027]"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-[#087653] text-white text-xs font-semibold cursor-pointer"
                >
                  {lang === 'bn' ? 'যান' : 'Jump'}
                </button>
              </form>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {FAMOUS_VERSE_CHIPS.map((chip) => {
                const isSelected =
                  selectedSurahNum === chip.surah && selectedAyahNum === chip.ayah;
                return (
                  <button
                    key={`${chip.surah}:${chip.ayah}`}
                    type="button"
                    onClick={() => {
                      setSelectedSurahNum(chip.surah);
                      setSelectedAyahNum(chip.ayah);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                      isSelected
                        ? 'bg-[#087653] border-[#087653] text-white'
                        : 'bg-[#faf7f0] border-[#ebe6da] text-[#183027] hover:border-[#b58328]'
                    }`}
                  >
                    {lang === 'bn' ? chip.bn : chip.en}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <aside className="lg:col-span-4 bg-white rounded-2xl border border-[#dce7e0] p-4 space-y-3">
              <h3 className="text-sm font-bold text-[#183027] pb-2 border-b border-[#eef5f0]">
                {lang === 'bn'
                  ? `তাফসির সংস্করণ তুলনা (${TAFSIR_EDITIONS.length})`
                  : `Compare Editions (${TAFSIR_EDITIONS.length})`}
              </h3>
              <div className="max-h-[540px] overflow-y-auto space-y-2 pr-1">
                {TAFSIR_EDITIONS.map((ed) => (
                  <button
                    key={ed.id}
                    type="button"
                    data-testid={`tafsir-edition-${ed.id}`}
                    onClick={() => setSelectedEditionId(ed.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                      ed.id === selectedEditionId
                        ? 'bg-[#eef5f0] border-[#087653]'
                        : 'bg-[#faf7f0]/60 border-[#ebe6da] hover:border-[#b58328]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
                      <span className="text-[#8f6319]">{langGroupBadge(ed.language)}</span>
                      <span className="font-arabic text-sm text-[#087653]">{ed.name_ar}</span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-[#183027] mt-1">
                      {lang === 'bn' ? ed.name_bn : ed.name_en}
                    </p>
                  </button>
                ))}
              </div>
            </aside>

            <div className="lg:col-span-8">{renderTafsirReader()}</div>
          </div>
        </div>
      )}

      {/* SECTIONS 4, 5, 6: LANGUAGE-FOCUSED STUDIOS (Bengali / English / Arabic Tafsirs) */}
      {(activeTab === 'bn' || activeTab === 'en' || activeTab === 'ar') && (
        <div
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
          data-testid={`tafsir-section-${activeTab}`}
        >
          <aside className="lg:col-span-4 bg-white rounded-2xl border border-[#dce7e0] p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#eef5f0]">
              <h2 className="text-sm font-bold text-[#183027] flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-[#087653]" />
                <span>
                  {activeTab === 'bn'
                    ? lang === 'bn'
                      ? `বাংলা তাফসির (${visibleLanguageEditions.length})`
                      : `Bengali Tafsirs (${visibleLanguageEditions.length})`
                    : activeTab === 'en'
                    ? `English Tafsirs (${visibleLanguageEditions.length})`
                    : lang === 'bn'
                    ? `আরবি তাফসির (${visibleLanguageEditions.length})`
                    : `Arabic Tafsirs (${visibleLanguageEditions.length})`}
                </span>
              </h2>
            </div>

            <div className="space-y-2">
              {visibleLanguageEditions.map((ed) => {
                const isSelected = ed.id === selectedEditionId;
                return (
                  <button
                    key={ed.id}
                    type="button"
                    data-testid={`tafsir-edition-${ed.id}`}
                    onClick={() => setSelectedEditionId(ed.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#eef5f0] border-[#087653]'
                        : 'bg-[#faf7f0]/60 border-[#ebe6da] hover:border-[#b58328]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
                      <span className="text-[#8f6319]">{langGroupBadge(ed.language)}</span>
                      <span className="font-arabic text-sm text-[#087653]">{ed.name_ar}</span>
                    </div>
                    <p className="text-sm font-bold text-[#183027] mt-1">
                      {lang === 'bn' ? ed.name_bn : ed.name_en}
                    </p>
                    <p className="text-xs text-[#5a7066] mt-0.5">
                      {lang === 'bn' ? ed.author_bn : ed.author_en}
                    </p>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="lg:col-span-8">{renderTafsirReader()}</div>
        </div>
      )}

      {/* SECTION 7: THEMATIC TAFSIRS */}
      {activeTab === 'thematic' && (
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
          data-testid="tafsir-section-thematic"
        >
          {THEMATIC_TAFSIR_TOPICS.map((topic) => (
            <section
              key={topic.id}
              className="bg-white rounded-2xl border border-[#dce7e0] p-6 space-y-4"
            >
              <div>
                <h2 className="text-lg font-bold text-[#183027]">
                  {lang === 'bn' ? topic.title_bn : topic.title_en}
                </h2>
                <p className="text-xs sm:text-sm text-[#5a7066] mt-1">
                  {lang === 'bn' ? topic.summary_bn : topic.summary_en}
                </p>
              </div>

              <div className="space-y-2.5">
                {topic.verses.map((v) => (
                  <div
                    key={`${v.surahNumber}:${v.ayahNumber}`}
                    className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-mono-tabular text-xs font-bold text-[#087653]">
                        {lang === 'bn'
                          ? `সূরা ${v.surahNumber}, আয়াত ${v.ayahNumber}`
                          : `Surah ${v.surahNumber}:${v.ayahNumber}`}
                      </p>
                      <p className="text-xs sm:text-sm text-[#183027] mt-0.5">
                        {lang === 'bn' ? v.note_bn : v.note_en}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSurahNum(v.surahNumber);
                        setSelectedAyahNum(v.ayahNumber);
                        setActiveTab('by-ayah');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#087653] text-white text-xs font-semibold shrink-0 cursor-pointer"
                    >
                      {lang === 'bn' ? 'তাফসির পড়ুন' : 'Read Tafsir'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* SECTION 8: SEARCH */}
      {activeTab === 'search' && (
        <div className="space-y-5" data-testid="tafsir-section-search">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSearchTafsir(tafsirSearchQuery);
            }}
            className="bg-white rounded-2xl border border-[#dce7e0] p-4 space-y-3"
          >
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-[#5a7066] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  data-testid="tafsir-search-input"
                  value={tafsirSearchQuery}
                  onChange={(e) => setTafsirSearchQuery(e.target.value)}
                  placeholder={
                    lang === 'bn'
                      ? 'তাফসির বা আয়াতের বিষয় লিখুন (যেমন: রহমত, রোজা, ধৈর্য, 2:255)...'
                      : 'Search across Tafsir & Ayahs (e.g., mercy, patience, fasting, 2:255)...'
                  }
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-[#dce7e0] bg-[#f7faf8] focus:outline-none focus:border-[#087653]"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#087653] text-white text-xs font-semibold cursor-pointer"
              >
                {lang === 'bn' ? 'তাফসির খুঁজুন' : 'Search Tafsir'}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-[#5a7066] mr-1">
                {lang === 'bn' ? 'জনপ্রিয় অনুসন্ধান:' : 'Quick queries:'}
              </span>
              {SEARCH_SUGGESTIONS.map((s) => (
                <button
                  key={s.q}
                  type="button"
                  onClick={() => {
                    setTafsirSearchQuery(s.q);
                    void handleSearchTafsir(s.q);
                  }}
                  className="px-2.5 py-1 rounded-md bg-[#faf7f0] border border-[#ebe6da] hover:border-[#087653] text-xs text-[#183027] cursor-pointer"
                >
                  {lang === 'bn' ? s.bn : s.en}
                </button>
              ))}
            </div>
          </form>

          {searchingTafsir ? (
            <div className="bg-white rounded-2xl border border-[#dce7e0] p-10 text-center text-sm text-[#5a7066]">
              {lang === 'bn' ? 'তাফসির অনুসন্ধান করা হচ্ছে...' : 'Searching commentaries...'}
            </div>
          ) : tafsirSearchResults.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#dce7e0] p-10 text-center text-sm text-[#5a7066]">
              {tafsirSearchQuery.trim()
                ? lang === 'bn'
                  ? 'কোনো মিল পাওয়া যায়নি।'
                  : 'No matching Tafsir passages found.'
                : lang === 'bn'
                ? 'যেকোনো শব্দ বা সূরা:আয়াত (যেমন 2:255) লিখে তাফসির সার্চ করুন।'
                : 'Enter a keyword or Surah:Ayah reference (e.g. 2:255) to search Tafsir.'}
            </div>
          ) : (
            <div className="space-y-4">
              {tafsirSearchResults.map((item) => (
                <article
                  key={`${item.surah_number}:${item.ayah_number}`}
                  className="bg-white rounded-2xl border border-[#dce7e0] p-6 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#087653]">
                      {lang === 'bn' ? item.surah_name_bn : item.surah_name_en} ·{' '}
                      {item.surah_number}:{item.ayah_number}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSurahNum(item.surah_number);
                        setSelectedAyahNum(item.ayah_number);
                        setActiveTab('by-ayah');
                      }}
                      className="text-xs font-semibold text-[#8f6319] hover:underline cursor-pointer"
                    >
                      {lang === 'bn' ? 'সকল তাফসিরে দেখুন →' : 'Compare Editions →'}
                    </button>
                  </div>
                  <p className="font-arabic text-2xl text-[#183027] text-right">{item.arabic}</p>
                  <p className="text-sm text-[#183027]">
                    {lang === 'bn' ? item.translation_bn : item.translation_en}
                  </p>
                  {(item.short_tafsir_bn || item.short_tafsir_en) && (
                    <p className="text-xs sm:text-sm text-[#5a7066] bg-[#faf7f0] rounded-xl p-3.5 border border-[#ebe6da]">
                      {lang === 'bn' ? item.short_tafsir_bn : item.short_tafsir_en}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
