import { useMemo, useState } from 'react';
import { Search, Sparkles, Volume2 } from 'lucide-react';
import { ASMA_UL_HUSNA } from '../data/asmaUlHusna';
import type { Language } from '../types/islamic';

interface AsmaUlHusnaPageProps {
  lang: Language;
}

export function AsmaUlHusnaPage({ lang }: AsmaUlHusnaPageProps) {
  const [search, setSearch] = useState('');
  const [speakingNumber, setSpeakingNumber] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ASMA_UL_HUSNA;
    return ASMA_UL_HUSNA.filter(
      (n) =>
        String(n.number) === q ||
        n.arabic.includes(q) ||
        n.transliteration_bn.toLowerCase().includes(q) ||
        n.transliteration_en.toLowerCase().includes(q) ||
        n.meaning_bn.toLowerCase().includes(q) ||
        n.meaning_en.toLowerCase().includes(q)
    );
  }, [search]);

  const speakName = (num: number, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.85;
    utter.onstart = () => setSpeakingNumber(num);
    utter.onend = () => setSpeakingNumber(null);
    utter.onerror = () => setSpeakingNumber(null);
    window.speechSynthesis.speak(utter);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#183027]">
            {lang === 'bn' ? 'আল্লাহর ৯৯টি গুণবাচক নাম (আসমাউল হুসনা)' : '99 Names of Allah (Asma ul-Husna)'}
          </h1>
          <p className="text-[#5a7066] mt-1">
            {lang === 'bn'
              ? 'আরবি, বাংলা উচ্চারণ, অর্থ ও তাৎপর্যসহ মহান আল্লাহর ৯৯টি পবিত্র নাম।'
              : 'All 99 Beautiful Names of Allah with Arabic calligraphy, pronunciation, and reflections.'}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0f3d2e] text-[#d4a84f] text-xs font-semibold">
          <Sparkles className="w-4 h-4" />
          <span>
            {lang === 'bn' ? 'সহিহ বুখারি: যে ব্যক্তি এগুলো মুখস্থ করবে সে জান্নাতে প্রবেশ করবে' : 'Sahih al-Bukhari 2736'}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-[#dce7e0] p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 text-[#5a7066] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            data-testid="names-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={lang === 'bn' ? 'নাম খুঁজুন' : 'Search 99 Names'}
            placeholder={
              lang === 'bn'
                ? 'নম্বর, বাংলা উচ্চারণ বা অর্থ দিয়ে খুঁজুন...'
                : 'Search by number, transliteration, or meaning...'
            }
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#dce7e0] bg-[#f7faf8] focus:outline-none focus:border-[#087653]"
          />
        </div>
        <span className="text-xs font-mono-tabular text-[#5a7066]">
          {filtered.length} / 99
        </span>
      </div>

      {/* 99 Names Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <article
            key={item.number}
            data-testid={`allah-name-${item.number}`}
            className="bg-white rounded-2xl border border-[#dce7e0] hover:border-[#b58328] p-5 flex flex-col justify-between transition-colors"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="w-8 h-8 rounded-lg bg-[#f5efe0] text-[#8f6319] font-mono-tabular text-xs font-bold flex items-center justify-center">
                  {item.number}
                </span>
                <button
                  type="button"
                  onClick={() => speakName(item.number, item.transliteration_en)}
                  aria-label={
                    lang === 'bn'
                      ? `${item.transliteration_bn} শুনুন`
                      : `Listen to ${item.transliteration_en}`
                  }
                  className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                    speakingNumber === item.number
                      ? 'bg-[#087653] border-[#087653] text-white'
                      : 'border-[#ebe6da] text-[#5a7066] hover:border-[#087653] hover:text-[#087653]'
                  }`}
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <p className="font-arabic text-3xl text-[#087653] text-center my-3">
                {item.arabic}
              </p>

              <h2 className="text-lg font-bold text-[#183027] text-center">
                {lang === 'bn' ? item.transliteration_bn : item.transliteration_en}
              </h2>
              <p className="text-sm font-medium text-[#8f6319] text-center mt-0.5">
                {lang === 'bn' ? item.meaning_bn : item.meaning_en}
              </p>
            </div>

            <p className="text-xs text-[#5a7066] mt-4 pt-3 border-t border-[#f2eee4] leading-relaxed">
              {lang === 'bn' ? item.reflection_bn : item.reflection_en}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
