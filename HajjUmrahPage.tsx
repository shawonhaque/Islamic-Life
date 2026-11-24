import { useState } from 'react';
import { CheckCircle2, Circle, Compass, ShieldAlert } from 'lucide-react';
import { HAJJ_UMRAH_STEPS, TALBIYAH_DATA } from '../data/islamicModulesData';
import type { Language } from '../types/islamic';

interface HajjUmrahPageProps {
  lang: Language;
}

const CHECKLIST_KEY = 'il_hajj_umrah_checklist';

export function HajjUmrahPage({ lang }: HajjUmrahPageProps) {
  const [tab, setTab] = useState<'umrah' | 'hajj' | 'ihram'>('umrah');
  const [checkedSteps, setCheckedSteps] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(CHECKLIST_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const toggleStep = (key: string) => {
    setCheckedSteps((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      try {
        localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const umrahSteps = HAJJ_UMRAH_STEPS.filter((s) => s.type === 'umrah');
  const hajjSteps = HAJJ_UMRAH_STEPS.filter((s) => s.type === 'hajj');

  const ihramProhibitions = [
    {
      bn: 'সেলাইযুক্ত পোশাক পরিধান করা (পুরুষদের জন্য); মহিলারা স্বাভাবিক শালীন পোশাক ও হিজাব পরবেন তবে মুখাবরণ (নিকাব) ও হাতমোজা পরবেন না।',
      en: 'Men must not wear stitched/fitted garments; women wear normal modest attire without face veil (niqab) or gloves.',
    },
    {
      bn: 'শরীর বা কাপড়ে সুগন্ধি (আতর/পারফিউম) ব্যবহার করা।',
      en: 'Applying perfume or scented soaps/lotions to the body or Ihram cloth.',
    },
    {
      bn: 'চুল কাটা, মুণ্ডন করা বা নখ কাটা।',
      en: 'Cutting, shaving, or plucking hair and trimming fingernails or toenails.',
    },
    {
      bn: 'স্থলভাগের প্রাণী শিকার করা বা মক্কার হারাম শরীফের গাছপালা কাটা।',
      en: 'Hunting land animals or cutting plants/trees within the Sacred Haram boundaries.',
    },
    {
      bn: 'ঝগড়া-বিবাদ, অশ্লীল কথাবার্তা এবং দাম্পত্য মিলন থেকে বিরত থাকা।',
      en: 'Arguing, foul speech, and marital intimacy while in the state of Ihram.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#183027]">
            {lang === 'bn' ? 'হজ ও উমরাহ গাইড (ধারাবাহিক নিয়ম ও দোয়া)' : 'Hajj & Umrah Step-by-Step Guide'}
          </h1>
          <p className="text-[#5a7066] mt-1">
            {lang === 'bn'
              ? 'ইহরাম, তালবিয়া, তাওয়াফ, সায়ী, আরাফা, মুজদালিফা ও মিনার সম্পূর্ণ দিকনির্দেশনা।'
              : 'Complete guide to Ihram, Talbiyah, Tawaf, Sa’i, Arafah, Muzdalifah, and Mina.'}
          </p>
        </div>

        <div className="inline-flex p-1 bg-[#eef5f0] rounded-xl gap-1">
          {(
            [
              ['umrah', lang === 'bn' ? 'উমরাহ গাইড' : 'Umrah Guide'],
              ['hajj', lang === 'bn' ? 'হজের ৫ দিন' : '5 Days of Hajj'],
              ['ihram', lang === 'bn' ? 'ইহরামের নিয়ম' : 'Ihram Rules'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              data-testid={`hajj-tab-${id}`}
              onClick={() => setTab(id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                tab === id ? 'bg-white text-[#087653] shadow-xs' : 'text-[#5a7066]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Talbiyah Hero Banner */}
      <section className="rounded-2xl bg-[#0f3d2e] text-white p-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#d4a84f]">
          <Compass className="w-4 h-4" />
          <span>{lang === 'bn' ? 'পবিত্র তালবিয়া' : 'The Sacred Talbiyah'}</span>
        </div>
        <p className="font-arabic text-2xl sm:text-3xl text-[#d4a84f] text-right leading-loose">
          {TALBIYAH_DATA.arabic}
        </p>
        <p className="text-sm font-medium text-white">
          {lang === 'bn' ? TALBIYAH_DATA.pronunciation_bn : TALBIYAH_DATA.pronunciation_en}
        </p>
        <p className="text-xs sm:text-sm text-white/80">
          {lang === 'bn' ? TALBIYAH_DATA.meaning_bn : TALBIYAH_DATA.meaning_en}
        </p>
      </section>

      {tab !== 'ihram' ? (
        <div className="space-y-4">
          {(tab === 'umrah' ? umrahSteps : hajjSteps).map((item) => {
            const key = `${item.type}-${item.step}`;
            const done = checkedSteps.includes(key);
            return (
              <div
                key={key}
                className={`bg-white rounded-2xl border p-6 transition-colors ${
                  done ? 'border-[#087653]/50 bg-[#eef5f0]/30' : 'border-[#dce7e0]'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <span className="text-xs font-semibold text-[#8f6319]">
                      {lang === 'bn' ? item.day_bn : item.day_en}
                    </span>
                    <h2 className="text-lg font-bold text-[#183027]">
                      {lang === 'bn' ? item.title_bn : item.title_en}
                    </h2>
                    <p className="text-sm text-[#494e45] leading-relaxed">
                      {lang === 'bn' ? item.description_bn : item.description_en}
                    </p>

                    {item.dua_ar && (
                      <div className="mt-4 pt-4 border-t border-[#eef5f0] space-y-1.5">
                        <p className="font-arabic text-2xl text-[#087653] text-right">
                          {item.dua_ar}
                        </p>
                        {item.dua_pronunciation_bn && (
                          <p className="text-xs font-medium text-[#8f6319]">
                            {item.dua_pronunciation_bn}
                          </p>
                        )}
                        <p className="text-xs text-[#5a7066]">
                          {lang === 'bn' ? item.dua_meaning_bn : item.dua_meaning_en}
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleStep(key)}
                    aria-label={lang === 'bn' ? 'ধাপ সম্পন্ন চিহ্নিত করুন' : 'Toggle step completed'}
                    className="p-2 rounded-xl hover:bg-[#eef5f0] text-[#087653] cursor-pointer shrink-0"
                  >
                    {done ? (
                      <CheckCircle2 className="w-6 h-6 text-[#087653]" />
                    ) : (
                      <Circle className="w-6 h-6 text-[#8a8679]" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#dce7e0] p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#eef5f0]">
            <ShieldAlert className="w-5 h-5 text-[#b58328]" />
            <h2 className="text-lg font-bold text-[#183027]">
              {lang === 'bn' ? 'ইহরাম অবস্থায় নিষিদ্ধ কার্যাবলি' : 'Prohibitions During Ihram'}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ihramProhibitions.map((rule, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] p-4 flex items-start gap-3"
              >
                <span className="w-7 h-7 rounded-lg bg-[#b58328] text-white font-mono-tabular text-xs font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <p className="text-sm text-[#183027] leading-relaxed">{rule[lang]}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
