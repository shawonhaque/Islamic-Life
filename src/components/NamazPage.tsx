import { useState } from 'react';
import { CheckCircle2, Droplets, Scale, ScrollText, Users } from 'lucide-react';
import {
  FARD_WAJIB_SUNNAH_ITEMS,
  MEN_WOMEN_PRAYER_RULES,
  NAMAZ_NIYYAHS,
  PURIFICATION_GUIDES,
} from '../data/islamicModulesData';
import { NAMAZ_STEPS, NAMAZ_WAQTS, WUDU_STEPS } from '../data/islamicSeed';
import type { Language } from '../types/islamic';

interface NamazPageProps {
  lang: Language;
}

type NamazTab = 'rakats' | 'men-women' | 'niyyah' | 'fard-wajib' | 'purification' | 'steps';

export function NamazPage({ lang }: NamazPageProps) {
  const [tab, setTab] = useState<NamazTab>('rakats');
  const [selectedWaqtId, setSelectedWaqtId] = useState<string>('fajr');
  const [purificationSub, setPurificationSub] = useState<'wudu' | 'ghusl' | 'tayammum'>('wudu');

  const selectedWaqt = NAMAZ_WAQTS.find((w) => w.id === selectedWaqtId) ?? NAMAZ_WAQTS[0];

  const tabs: Array<{ id: NamazTab; bn: string; en: string }> = [
    { id: 'rakats', bn: 'পাঁচ ওয়াক্ত নামাজ', en: '5 Daily Prayers' },
    { id: 'men-women', bn: 'পুরুষ ও মহিলাদের নামাজ', en: 'Men & Women' },
    { id: 'niyyah', bn: 'নামাজের নিয়ত ও নিয়ম', en: 'Niyyah & Rules' },
    { id: 'fard-wajib', bn: 'ফরজ, ওয়াজিব ও সুন্নত', en: 'Fard, Wajib & Sunnah' },
    { id: 'purification', bn: 'অজু, গোসল ও তায়াম্মুম', en: 'Wudu, Ghusl & Tayammum' },
    { id: 'steps', bn: 'নামাজের ধাপ ও দোয়া', en: 'Prayer Steps & Duas' },
  ];

  const activePurification =
    PURIFICATION_GUIDES.find((g) => g.id === purificationSub) ?? PURIFICATION_GUIDES[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#183027]">
          {lang === 'bn'
            ? 'নামাজ শিক্ষা — পাঁচ ওয়াক্ত, নিয়ত, ফরজ-ওয়াজিব ও পবিত্রতা'
            : 'Complete Namaz & Purification Learning Guide'}
        </h1>
        <p className="text-[#5a7066] mt-1">
          {lang === 'bn'
            ? 'পাঁচ ওয়াক্ত নামাজের রাকাত, পুরুষ ও মহিলাদের নামাজের নিয়ম, নিয়ত, ফরজ-ওয়াজিব-সুন্নত এবং অজু, গোসল ও তায়াম্মুম।'
            : 'Five daily prayers, Men & Women posture differences, Niyyahs, Fard/Wajib/Sunnah rules, and Wudu, Ghusl & Tayammum.'}
        </p>

        {/* Sub-navigation Tabs */}
        <div className="mt-5 flex flex-wrap p-1.5 bg-[#eef5f0] rounded-xl gap-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              data-testid={`namaz-tab-${item.id}`}
              onClick={() => setTab(item.id)}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                tab === item.id
                  ? 'bg-white text-[#087653] shadow-xs font-semibold'
                  : 'text-[#5a7066] hover:text-[#183027]'
              }`}
            >
              {item[lang]}
            </button>
          ))}
        </div>
      </div>

      {/* 1. 5 Daily Prayers & Rakats */}
      {tab === 'rakats' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {NAMAZ_WAQTS.map((waqt) => (
              <button
                key={waqt.id}
                type="button"
                onClick={() => setSelectedWaqtId(waqt.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                  selectedWaqtId === waqt.id
                    ? 'bg-[#087653] text-white border-[#087653]'
                    : 'bg-white text-[#183027] border-[#dce7e0] hover:border-[#087653]'
                }`}
              >
                {lang === 'bn' ? waqt.name_bn : waqt.name_en} ({waqt.total}{' '}
                {lang === 'bn' ? 'রাকাত' : 'Rakats'})
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-[#dce7e0] p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4 border-b border-[#eef5f0]">
              <div>
                <h2 className="text-xl font-bold text-[#183027]">
                  {lang === 'bn'
                    ? `${selectedWaqt.name_bn} নামাজের রাকাত বিন্যাস`
                    : `${selectedWaqt.name_en} Prayer Breakdown`}
                </h2>
                <p className="text-sm text-[#5a7066] mt-0.5">
                  {lang === 'bn' ? selectedWaqt.time_hint_bn : selectedWaqt.time_hint_en}
                </p>
              </div>
              <span className="font-mono-tabular text-lg font-bold text-[#087653]">
                {lang === 'bn' ? 'মোট:' : 'Total:'} {selectedWaqt.total}{' '}
                {lang === 'bn' ? 'রাকাত' : 'Rakats'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-5">
              {[
                { label: lang === 'bn' ? 'সুন্নত (পূর্বে)' : 'Sunnah Before', val: selectedWaqt.sunnah_before },
                { label: lang === 'bn' ? 'ফরজ' : 'Fard (Obligatory)', val: selectedWaqt.fard },
                { label: lang === 'bn' ? 'সুন্নত (পরে)' : 'Sunnah After', val: selectedWaqt.sunnah_after },
                { label: lang === 'bn' ? 'নফল' : 'Nafl', val: selectedWaqt.nafl },
                { label: lang === 'bn' ? 'বিতর' : 'Witr', val: selectedWaqt.witr },
              ].map((col) => (
                <div key={col.label} className="bg-[#f7faf8] rounded-xl p-4 border border-[#dce7e0]">
                  <p className="text-xs text-[#5a7066] font-medium">{col.label}</p>
                  <p className="font-mono-tabular text-2xl font-bold text-[#183027] mt-1">
                    {col.val}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#dce7e0] overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#eef5f0] text-[#183027] text-xs font-semibold uppercase">
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'ওয়াক্ত' : 'Prayer'}</th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'সুন্নত (পূর্ব)' : 'Sunnah (Pre)'}</th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'ফরজ' : 'Fard'}</th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'সুন্নত (পর)' : 'Sunnah (Post)'}</th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'নফল' : 'Nafl'}</th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'বিতর' : 'Witr'}</th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'মোট' : 'Total'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef5f0] text-sm tabular-nums">
                {NAMAZ_WAQTS.map((w) => (
                  <tr key={w.id} className="hover:bg-[#f7faf8]">
                    <td className="py-3.5 px-4 font-semibold text-[#087653]">
                      {lang === 'bn' ? w.name_bn : w.name_en}
                    </td>
                    <td className="py-3.5 px-4">{w.sunnah_before}</td>
                    <td className="py-3.5 px-4 font-semibold">{w.fard}</td>
                    <td className="py-3.5 px-4">{w.sunnah_after}</td>
                    <td className="py-3.5 px-4">{w.nafl}</td>
                    <td className="py-3.5 px-4">{w.witr}</td>
                    <td className="py-3.5 px-4 font-bold">{w.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Men & Women Prayer Rules */}
      {tab === 'men-women' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-[#dce7e0] p-6">
            <div className="flex items-center gap-2.5 mb-2">
              <Users className="w-5 h-5 text-[#087653]" />
              <h2 className="text-xl font-bold text-[#183027]">
                {lang === 'bn'
                  ? 'পুরুষ ও মহিলাদের নামাজের আদায় পদ্ধতির পার্থক্য'
                  : 'Men & Women Prayer Posture Guidelines'}
              </h2>
            </div>
            <p className="text-sm text-[#5a7066]">
              {lang === 'bn'
                ? 'নামাজের মূল ফরজ, ওয়াজিব ও কিরাত উভয়ের জন্যই সমান; তবে পর্দা ও শালীনতার কারণে কিছু ভঙ্গিতে হানাফি ফিকহ ও হাদিস অনুযায়ী পার্থক্য রয়েছে।'
                : 'Core obligations and recitations are identical; certain postures differ for modesty and composure.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {MEN_WOMEN_PRAYER_RULES.map((rule, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-[#dce7e0] p-6 space-y-4">
                <div className="flex items-baseline justify-between gap-2 pb-3 border-b border-[#eef5f0]">
                  <h3 className="text-base font-bold text-[#183027]">
                    {lang === 'bn' ? rule.posture_bn : rule.posture_en}
                  </h3>
                  <span className="text-[11px] text-[#8f6319] font-medium shrink-0">
                    {rule.reference}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl bg-[#f7faf8] border border-[#dce7e0] p-3.5">
                    <p className="text-xs font-bold text-[#087653] mb-1">
                      {lang === 'bn' ? 'পুরুষদের নিয়ম' : 'For Men'}
                    </p>
                    <p className="text-sm text-[#183027]">
                      {lang === 'bn' ? rule.men_bn : rule.men_en}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] p-3.5">
                    <p className="text-xs font-bold text-[#8f6319] mb-1">
                      {lang === 'bn' ? 'মহিলাদের নিয়ম' : 'For Women'}
                    </p>
                    <p className="text-sm text-[#183027]">
                      {lang === 'bn' ? rule.women_bn : rule.women_en}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Prayer Niyyahs & Rules */}
      {tab === 'niyyah' && (
        <div className="space-y-5">
          <div className="bg-[#eef5f0]/70 rounded-2xl border border-[#dce7e0] p-5 flex items-start gap-3">
            <ScrollText className="w-5 h-5 text-[#087653] shrink-0 mt-0.5" />
            <p className="text-sm text-[#183027] leading-relaxed">
              {lang === 'bn'
                ? 'নিয়ত শব্দের অর্থ অন্তরের সংকল্প। কোন ওয়াক্তের কত রাকাত ফরজ বা সুন্নত নামাজ পড়ছেন—তা মনে মনে স্থির করাই মূল নিয়ত; তবে আরবি বা বাংলায় উচ্চারণ করে নিলে মনোযোগ স্থির করতে সহায়তা হয়।'
                : 'Niyyah means sincere intention of the heart before Takbir al-Ihram. Below are traditional Arabic & transliterated verbal expressions for each daily prayer.'}
            </p>
          </div>

          <div className="space-y-4">
            {NAMAZ_NIYYAHS.map((n) => (
              <div key={n.id} className="bg-white rounded-2xl border border-[#dce7e0] p-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#eef5f0]">
                  <h3 className="text-lg font-bold text-[#183027]">
                    {lang === 'bn' ? n.title_bn : n.title_en}
                  </h3>
                  <span className="text-xs font-semibold text-[#087653] bg-[#eef5f0] px-2.5 py-1 rounded-md">
                    {lang === 'bn' ? n.rakat_note_bn : n.rakat_note_en}
                  </span>
                </div>

                <p className="font-arabic text-2xl text-[#087653] text-right leading-loose">
                  {n.arabic}
                </p>

                <p className="text-sm font-semibold text-[#183027]">
                  {lang === 'bn' ? 'উচ্চারণ:' : 'Pronunciation:'}{' '}
                  <span className="font-normal">
                    {lang === 'bn' ? n.pronunciation_bn : n.pronunciation_en}
                  </span>
                </p>

                <p className="text-sm text-[#5a7066]">
                  {lang === 'bn' ? n.meaning_bn : n.meaning_en}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Fard, Wajib & Sunnah */}
      {tab === 'fard-wajib' && (
        <div className="space-y-6">
          {(
            [
              {
                key: 'fard-outside' as const,
                titleBn: 'নামাজের বাইরের ৭ ফরজ (আহকাম / শর্তাবলি)',
                titleEn: '7 Fard Conditions Outside Prayer (Shurut)',
                badgeBn: 'ফরজ · শর্ত',
                badgeEn: 'Fard Condition',
              },
              {
                key: 'fard-inside' as const,
                titleBn: 'নামাজের ভেতরের ফরজ (আরকান)',
                titleEn: 'Fard Pillars Inside Prayer (Arkan)',
                badgeBn: 'ফরজ · রোকন',
                badgeEn: 'Fard Pillar',
              },
              {
                key: 'wajib' as const,
                titleBn: 'নামাজের ওয়াজিবসমূহ (ভুল হলে সাহু সিজদা দিতে হয়)',
                titleEn: 'Wajib Acts of Prayer (Sahu Sujud applies if missed unintentionally)',
                badgeBn: 'ওয়াজিব',
                badgeEn: 'Wajib',
              },
              {
                key: 'sunnah' as const,
                titleBn: 'নামাজের প্রধান সুন্নতসমূহ',
                titleEn: 'Key Sunnah Acts in Prayer',
                badgeBn: 'সুন্নত',
                badgeEn: 'Sunnah',
              },
            ] as const
          ).map((group) => {
            const list = FARD_WAJIB_SUNNAH_ITEMS.filter((i) => i.category === group.key);
            return (
              <section key={group.key} className="bg-white rounded-2xl border border-[#dce7e0] p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#eef5f0]">
                  <h2 className="text-lg font-bold text-[#183027] flex items-center gap-2">
                    <Scale className="w-5 h-5 text-[#087653]" />
                    <span>{lang === 'bn' ? group.titleBn : group.titleEn}</span>
                  </h2>
                  <span className="text-xs font-semibold text-[#8f6319]">
                    {lang === 'bn' ? group.badgeBn : group.badgeEn}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {list.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] p-4 space-y-1.5"
                    >
                      <h3 className="text-sm font-bold text-[#183027]">
                        {lang === 'bn' ? item.title_bn : item.title_en}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#5a7066] leading-relaxed">
                        {lang === 'bn' ? item.detail_bn : item.detail_en}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* 5. Wudu, Ghusl & Tayammum */}
      {tab === 'purification' && (
        <div className="space-y-6">
          <div className="inline-flex p-1 bg-[#eef5f0] rounded-xl gap-1">
            {(
              [
                ['wudu', lang === 'bn' ? 'অজুর নিয়ম (৭ ধাপ)' : 'Wudu (7 Steps)'],
                ['ghusl', lang === 'bn' ? 'গোসলের নিয়ম' : 'Ghusl (Bath)'],
                ['tayammum', lang === 'bn' ? 'তায়াম্মুমের নিয়ম' : 'Tayammum (Dry)'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                data-testid={`purification-sub-${id}`}
                onClick={() => setPurificationSub(id)}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold cursor-pointer ${
                  purificationSub === id
                    ? 'bg-white text-[#087653] shadow-xs'
                    : 'text-[#5a7066]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {purificationSub === 'wudu' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {WUDU_STEPS.map((s) => (
                <div key={s.step} className="bg-white rounded-2xl border border-[#dce7e0] p-6">
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-lg bg-[#eef5f0] text-[#087653] font-mono-tabular font-bold text-sm flex items-center justify-center shrink-0">
                      {s.step}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-[#183027]">
                        {lang === 'bn' ? s.title_bn : s.title_en}
                      </h3>
                      <p className="text-sm text-[#5a7066] mt-1.5">
                        {lang === 'bn' ? s.description_bn : s.description_en}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#dce7e0] p-6 space-y-6">
              <div className="flex items-start gap-3 pb-4 border-b border-[#eef5f0]">
                <div className="w-10 h-10 rounded-xl bg-[#eef5f0] text-[#087653] flex items-center justify-center shrink-0">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#183027]">
                    {lang === 'bn' ? activePurification.title_bn : activePurification.title_en}
                  </h2>
                  <p className="text-sm text-[#5a7066] mt-0.5">
                    {lang === 'bn'
                      ? activePurification.subtitle_bn
                      : activePurification.subtitle_en}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-[#eef5f0]/60 border border-[#087653]/25 p-5 space-y-2">
                <h3 className="text-sm font-bold text-[#087653]">
                  {lang === 'bn' ? 'অবশ্য পালনীয় ৩টি ফরজ' : '3 Obligatory Fard Elements'}
                </h3>
                <ul className="space-y-1.5 text-sm text-[#183027]">
                  {(lang === 'bn' ? activePurification.fard_bn : activePurification.fard_en).map(
                    (f, i) => (
                      <li key={i}>{f}</li>
                    )
                  )}
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[#183027]">
                  {lang === 'bn' ? 'ধারাবাহিক নিয়ম ও পদ্ধতি' : 'Step-by-Step Procedure'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {(lang === 'bn' ? activePurification.steps_bn : activePurification.steps_en).map(
                    (st, i) => (
                      <div
                        key={i}
                        className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] p-4 flex items-start gap-3"
                      >
                        <span className="w-7 h-7 rounded-lg bg-[#087653] text-white font-mono-tabular text-xs font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <p className="text-sm text-[#183027] leading-relaxed">{st}</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. Prayer Steps & Duas */}
      {tab === 'steps' && (
        <div className="space-y-5">
          {NAMAZ_STEPS.map((s) => (
            <div key={s.step} className="bg-white rounded-2xl border border-[#dce7e0] p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#087653] shrink-0 mt-0.5" />
                <div className="w-full">
                  <p className="text-xs font-medium text-[#9c7524]">
                    {lang === 'bn' ? `ধাপ ${s.step}` : `Step ${s.step}`}
                  </p>
                  <h3 className="text-lg font-bold text-[#183027]">
                    {lang === 'bn' ? s.title_bn : s.title_en}
                  </h3>
                  <p className="text-sm text-[#5a7066] mt-1">
                    {lang === 'bn' ? s.description_bn : s.description_en}
                  </p>

                  {s.arabic && (
                    <div className="mt-4 pt-4 border-t border-[#eef5f0]">
                      <p className="font-arabic text-2xl text-[#087653] text-right">{s.arabic}</p>
                      {s.pronunciation && (
                        <p className="text-sm font-medium text-[#183027] mt-2">
                          {s.pronunciation}
                        </p>
                      )}
                      <p className="text-sm text-[#5a7066] mt-1">
                        {lang === 'bn' ? s.meaning_bn : s.meaning_en}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
