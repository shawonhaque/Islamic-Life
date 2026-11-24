import { useEffect, useMemo, useState } from 'react';
import { BookMarked, Check, Copy, Search, Sparkles } from 'lucide-react';
import type { Dua, Hadith, Language } from '../types/islamic';

interface HadithDuaPageProps {
  lang: Language;
  initialTab: 'hadith' | 'dua';
  hadiths: Hadith[];
  duas: Dua[];
  onSwitchTab: (tab: 'hadith' | 'dua') => void;
  initialSearch?: string;
  searchTriggerKey?: number;
  onOpenTasbih?: () => void;
}

export function HadithDuaPage({
  lang,
  initialTab,
  hadiths,
  duas,
  onSwitchTab,
  initialSearch = '',
  searchTriggerKey = 0,
  onOpenTasbih,
}: HadithDuaPageProps) {
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (searchTriggerKey > 0) {
      setSearch(initialSearch);
      setSelectedCategory('all');
      setSelectedSource('all');
    }
  }, [initialSearch, searchTriggerKey]);

  const categories = useMemo(() => {
    const list =
      initialTab === 'hadith'
        ? hadiths.map((h) => h.category)
        : duas.map((d) => d.category);
    return ['all', ...Array.from(new Set(list))];
  }, [initialTab, hadiths, duas]);

  const hadithSources = useMemo(() => {
    const srcs = Array.from(new Set(hadiths.map((h) => h.source)));
    return ['all', ...srcs];
  }, [hadiths]);

  // Deterministic Daily Hadith spotlight rotating by day of year
  const dailyHadith = useMemo(() => {
    if (hadiths.length === 0) return null;
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
    return hadiths[dayOfYear % hadiths.length];
  }, [hadiths]);

  const filteredHadiths = useMemo(() => {
    const q = search.trim().toLowerCase();
    return hadiths.filter((h) => {
      if (selectedCategory !== 'all' && h.category !== selectedCategory) return false;
      if (selectedSource !== 'all' && h.source !== selectedSource) return false;
      if (!q) return true;
      return (
        h.title_bn.toLowerCase().includes(q) ||
        h.title_en.toLowerCase().includes(q) ||
        h.translation_bn.toLowerCase().includes(q) ||
        h.translation_en.toLowerCase().includes(q) ||
        h.source.toLowerCase().includes(q) ||
        h.category.toLowerCase().includes(q)
      );
    });
  }, [hadiths, search, selectedCategory, selectedSource]);

  const filteredDuas = useMemo(() => {
    const q = search.trim().toLowerCase();
    return duas.filter((d) => {
      if (selectedCategory !== 'all' && d.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        d.title_bn.toLowerCase().includes(q) ||
        d.title_en.toLowerCase().includes(q) ||
        d.pronunciation_bn.toLowerCase().includes(q) ||
        d.meaning_bn.toLowerCase().includes(q) ||
        d.meaning_en.toLowerCase().includes(q) ||
        d.reference.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
      );
    });
  }, [duas, search, selectedCategory]);

  const sourceLabel = (src: string) => {
    if (src === 'all') return lang === 'bn' ? 'সকল কিতাব' : 'All Sources';
    if (lang === 'bn') {
      if (src.includes('Bukhari')) return 'সহিহ বুখারি';
      if (src.includes('Muslim')) return 'সহিহ মুসলিম';
      if (src.includes('Tirmidhi')) return 'জামে তিরমিযী';
    }
    return src;
  };

  const categoryLabel = (cat: string) => {
    if (cat === 'all') return lang === 'bn' ? 'সবগুলো' : 'All';
    if (lang !== 'bn') return cat;
    const map: Record<string, string> = {
      'Morning & Evening': 'সকাল-সন্ধ্যার দোয়া',
      'Before Sleeping': 'ঘুমানোর দোয়া',
      'Food & Eating': 'খাবারের দোয়া',
      'Durood & Dhikr': 'দরুদ ও জিকির',
      'Ramadan & Fasting': 'রোজা ও ইফতার',
      'Mosque & Home': 'মসজিদ ও ঘর',
      'Parents & Knowledge': 'পিতা-মাতা ও জ্ঞান',
      'Faith & Intention': 'ঈমান ও নিয়ত',
      'Purification & Prayer': 'পবিত্রতা ও নামাজ',
      'Quran & Knowledge': 'কুরআন ও ইলম',
      'Character & Ethics': 'আখলাক ও চরিত্র',
      'Charity & Zakat': 'দান ও যাকাত',
      'Dhikr & Dua': 'জিকির ও দোয়া',
    };
    return map[cat] ?? cat;
  };

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#183027]">
            {initialTab === 'hadith'
              ? lang === 'bn'
                ? 'সহিহ হাদিস — বুখারি, মুসলিম, বিষয়ভিত্তিক ও দৈনিক হাদিস'
                : 'Sahih Hadith — Bukhari, Muslim, Topics & Daily Hadith'
              : lang === 'bn'
              ? 'দোয়া ও আমল — সকাল-সন্ধ্যা, ঘুম, খাবার, দরুদ ও রোজার নিয়ত'
              : 'Duas & Adhkar — Morning/Evening, Sleep, Food, Durood & Fasting'}
          </h1>
          <p className="text-[#5a7066] mt-1">
            {initialTab === 'hadith'
              ? lang === 'bn'
                ? 'সহিহ বুখারি, সহিহ মুসলিম ও বিষয়ভিত্তিক নির্ভরযোগ্য হাদিস সংগ্রহ।'
                : 'Verified narrations from Sahih al-Bukhari, Sahih Muslim, and thematic collections.'
              : lang === 'bn'
              ? 'সকাল-সন্ধ্যা, ঘুমানো, খাবার, দরুদ ও জিকির এবং রোজার নিয়ত আরবি ও বাংলা উচ্চারণসহ।'
              : 'Authentic daily supplications, Durood, and fasting Niyyah with Arabic, pronunciation, and meaning.'}
          </p>
        </div>

        {/* Section Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 bg-[#eef5f0] rounded-xl gap-1">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSelectedSource('all');
                onSwitchTab('hadith');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                initialTab === 'hadith'
                  ? 'bg-white text-[#087653] shadow-sm font-semibold'
                  : 'text-[#5a7066]'
              }`}
            >
              {lang === 'bn' ? 'সহিহ হাদিস' : 'Sahih Hadith'}
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSelectedSource('all');
                onSwitchTab('dua');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                initialTab === 'dua'
                  ? 'bg-white text-[#087653] shadow-sm font-semibold'
                  : 'text-[#5a7066]'
              }`}
            >
              {lang === 'bn' ? 'দোয়া ও আমল' : 'Duas & Adhkar'}
            </button>
          </div>

          {onOpenTasbih && (
            <button
              type="button"
              onClick={onOpenTasbih}
              className="px-3.5 py-2 rounded-xl border border-[#b58328]/40 bg-[#faf7f0] hover:bg-[#f5efe0] text-xs font-semibold text-[#8f6319] cursor-pointer"
            >
              {lang === 'bn' ? 'তাসবিহ কাউন্টার' : 'Tasbih Counter'}
            </button>
          )}
        </div>
      </div>

      {/* Daily Hadith Spotlight Card */}
      {initialTab === 'hadith' && dailyHadith && (
        <section
          data-testid="daily-hadith-card"
          className="rounded-2xl bg-[#0f3d2e] text-white p-6 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#d4a84f] font-semibold">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>{lang === 'bn' ? 'আজকের দৈনিক হাদিস' : 'Hadith of the Day'}</span>
            </span>
            <span>
              {sourceLabel(dailyHadith.source)} #{dailyHadith.hadith_number}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white">
            {lang === 'bn' ? dailyHadith.title_bn : dailyHadith.title_en}
          </h2>
          {dailyHadith.arabic && (
            <p className="font-arabic text-2xl text-[#d4a84f] text-right leading-loose">
              {dailyHadith.arabic}
            </p>
          )}
          <p className="text-sm sm:text-base text-white/90 leading-relaxed">
            {lang === 'bn' ? dailyHadith.translation_bn : dailyHadith.translation_en}
          </p>
        </section>
      )}

      {/* Search, Source & Topic Filters */}
      <div className="bg-white rounded-2xl border border-[#dce7e0] p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#5a7066] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={lang === 'bn' ? 'খুঁজুন' : 'Search collection'}
              placeholder={
                lang === 'bn'
                  ? 'শিরোনাম, আরবি, উচ্চারণ বা রেফারেন্স দিয়ে খুঁজুন...'
                  : 'Search by title, text, or reference...'
              }
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#dce7e0] bg-[#f7faf8] focus:outline-none focus:border-[#087653]"
            />
          </div>

          {initialTab === 'hadith' && (
            <div className="flex flex-wrap items-center gap-1.5">
              <BookMarked className="w-4 h-4 text-[#b58328] mr-1" />
              {hadithSources.map((src) => (
                <button
                  key={src}
                  type="button"
                  data-testid={`hadith-source-${src}`}
                  onClick={() => setSelectedSource(src)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    selectedSource === src
                      ? 'bg-[#b58328] text-white'
                      : 'bg-[#faf7f0] border border-[#ebe6da] text-[#494e45] hover:border-[#b58328]'
                  }`}
                >
                  {sourceLabel(src)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#f2eee4]">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#087653] text-white'
                  : 'bg-[#eef5f0] text-[#183027] hover:bg-[#dce7e0]'
              }`}
            >
              {categoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      {initialTab === 'hadith' ? (
        <div className="grid grid-cols-1 gap-5">
          {filteredHadiths.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#dce7e0] p-10 text-center text-[#5a7066]">
              {lang === 'bn' ? 'কোনো হাদিস পাওয়া যায়নি।' : 'No matching Hadiths found.'}
            </div>
          ) : (
            filteredHadiths.map((h) => {
              const copyId = `h-${h.id}`;
              return (
                <article key={h.id} className="bg-white rounded-2xl border border-[#dce7e0] p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-[#5a7066] flex items-center gap-2">
                      <span>{categoryLabel(h.category)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-[#8f6319]">
                        {sourceLabel(h.source)} #{h.hadith_number}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          copyId,
                          `${h.arabic}\n${lang === 'bn' ? h.translation_bn : h.translation_en} (${h.source} #${h.hadith_number})`
                        )
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#087653] hover:underline cursor-pointer"
                    >
                      {copiedKey === copyId ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{lang === 'bn' ? 'কপি হয়েছে' : 'Copied'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{lang === 'bn' ? 'কপি' : 'Copy'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <h2 className="text-xl font-bold text-[#183027] mt-2">
                    {lang === 'bn' ? h.title_bn : h.title_en}
                  </h2>

                  {h.arabic && (
                    <p className="font-arabic text-2xl text-[#087653] text-right mt-4 leading-loose">
                      {h.arabic}
                    </p>
                  )}

                  <p className="text-base text-[#183027] mt-4">
                    {lang === 'bn' ? h.translation_bn : h.translation_en}
                  </p>
                  <p className="text-xs text-[#5a7066] mt-1.5">
                    {lang === 'bn' ? h.translation_en : h.translation_bn}
                  </p>
                </article>
              );
            })
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredDuas.length === 0 ? (
            <div className="md:col-span-2 bg-white rounded-2xl border border-[#dce7e0] p-10 text-center text-[#5a7066]">
              {lang === 'bn' ? 'কোনো দোয়া পাওয়া যায়নি।' : 'No matching Duas found.'}
            </div>
          ) : (
            filteredDuas.map((d) => {
              const copyId = `d-${d.id}`;
              return (
                <article
                  key={d.id}
                  className="bg-white rounded-2xl border border-[#dce7e0] p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs text-[#5a7066]">
                      <span>
                        {categoryLabel(d.category)} · {d.reference}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            copyId,
                            `${d.arabic}\n${d.pronunciation_bn}\n${lang === 'bn' ? d.meaning_bn : d.meaning_en}`
                          )
                        }
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#087653] hover:underline cursor-pointer"
                      >
                        {copiedKey === copyId ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>{lang === 'bn' ? 'কপি হয়েছে' : 'Copied'}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>{lang === 'bn' ? 'কপি' : 'Copy'}</span>
                          </>
                        )}
                      </button>
                    </div>

                    <h2 className="text-lg font-bold text-[#183027] mt-2">
                      {lang === 'bn' ? d.title_bn : d.title_en}
                    </h2>

                    <p className="font-arabic text-2xl text-[#087653] text-right mt-4 leading-loose">
                      {d.arabic}
                    </p>

                    <p className="text-sm font-medium text-[#8f6319] mt-3 leading-relaxed">
                      {lang === 'bn' ? d.pronunciation_bn : d.pronunciation_en}
                    </p>
                    <p className="text-sm text-[#5a7066] mt-1.5 leading-relaxed">
                      {lang === 'bn' ? d.meaning_bn : d.meaning_en}
                    </p>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
