import { useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, Volume2, VolumeX } from 'lucide-react';
import type { Language } from '../types/islamic';
import { calculateZakat } from '../utils/islamicMath';

interface TasbihPageProps {
  lang: Language;
}

const DHIKR_PRESETS = [
  {
    id: 'subhanallah',
    ar: 'سُبْحَانَ اللَّهِ',
    bn: 'সুবহানাল্লাহ',
    en: 'SubhanAllah',
    meaning_bn: 'আল্লাহ পবিত্র ও মহান',
    meaning_en: 'Glory be to Allah',
  },
  {
    id: 'alhamdulillah',
    ar: 'الْحَمْدُ لِلَّهِ',
    bn: 'আলহামদুলিল্লাহ',
    en: 'Alhamdulillah',
    meaning_bn: 'সমস্ত প্রশংসা আল্লাহর',
    meaning_en: 'All praise is for Allah',
  },
  {
    id: 'allahuakbar',
    ar: 'اللَّهُ أَكْبَرُ',
    bn: 'আল্লাহু আকবার',
    en: 'Allahu Akbar',
    meaning_bn: 'আল্লাহ সর্বশ্রেষ্ঠ',
    meaning_en: 'Allah is the Greatest',
  },
  {
    id: 'astaghfirullah',
    ar: 'أَسْتَغْفِرُ اللَّهَ',
    bn: 'আস্তাগফিরুল্লাহ',
    en: 'Astaghfirullah',
    meaning_bn: 'আমি আল্লাহর কাছে ক্ষমা প্রার্থনা করছি',
    meaning_en: 'I seek forgiveness from Allah',
  },
  {
    id: 'lailaha',
    ar: 'لَا إِلَٰهَ إِلَّا اللَّهُ',
    bn: 'লা ইলাহা ইল্লাল্লাহ',
    en: 'La ilaha illallah',
    meaning_bn: 'আল্লাহ ছাড়া কোনো উপাস্য নেই',
    meaning_en: 'There is no deity except Allah',
  },
];

export function TasbihPage({ lang }: TasbihPageProps) {
  const [selectedDhikrId, setSelectedDhikrId] = useState(DHIKR_PRESETS[0].id);
  const [count, setCount] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('il_tasbih_count')) || 0;
    } catch {
      return 0;
    }
  });
  const [lifetimeTotal, setLifetimeTotal] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('il_tasbih_total')) || 0;
    } catch {
      return 0;
    }
  });
  const [target, setTarget] = useState<number>(33);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('il_tasbih_count', String(count));
      localStorage.setItem('il_tasbih_total', String(lifetimeTotal));
    } catch {
      // ignore storage errors
    }
  }, [count, lifetimeTotal]);

  const playTone = (freq: number, durationSec: number) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durationSec);
    } catch {
      // ignore audio errors
    }
  };

  const handleIncrement = () => {
    const nextCount = count + 1;
    setCount(nextCount);
    setLifetimeTotal((t) => t + 1);
    if (target > 0 && nextCount % target === 0) {
      playTone(880, 0.18);
    } else {
      playTone(520, 0.05);
    }
  };

  const handleReset = () => {
    setCount(0);
  };

  const activeDhikr = DHIKR_PRESETS.find((d) => d.id === selectedDhikrId) ?? DHIKR_PRESETS[0];
  const progress = target > 0 ? Math.min(1, (count % target === 0 && count > 0 ? target : count % target) / target) : 0;
  const circumference = 2 * Math.PI * 86;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#183027]">
            {lang === 'bn' ? 'ডিজিটাল তাসবিহ কাউন্টার' : 'Digital Tasbih Counter'}
          </h1>
          <p className="text-[#5a7066] mt-1">
            {lang === 'bn'
              ? 'যিকির নির্বাচন করে তাসবিহ গণনা করুন। আপনার মোট গণনা স্বয়ংক্রিয়ভাবে সংরক্ষিত থাকবে।'
              : 'Tap to count your daily Dhikr with preset targets and automatic progress saving.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSoundEnabled((s) => !s)}
          aria-pressed={soundEnabled}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#dce7e0] bg-white text-sm font-medium text-[#183027] cursor-pointer"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-[#087653]" /> : <VolumeX className="w-4 h-4 text-[#5a7066]" />}
          <span>{soundEnabled ? (lang === 'bn' ? 'শব্দ চালু' : 'Sound On') : (lang === 'bn' ? 'শব্দ বন্ধ' : 'Muted')}</span>
        </button>
      </div>

      {/* Dhikr Selection */}
      <div className="flex flex-wrap gap-2 mb-6">
        {DHIKR_PRESETS.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setSelectedDhikrId(d.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
              selectedDhikrId === d.id
                ? 'bg-[#087653] text-white border-[#087653]'
                : 'bg-white text-[#183027] border-[#dce7e0] hover:border-[#087653]'
            }`}
          >
            {d[lang]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#dce7e0] p-8 text-center">
        <p className="font-arabic text-4xl text-[#087653] font-bold">{activeDhikr.ar}</p>
        <p className="text-lg font-semibold text-[#183027] mt-2">{activeDhikr[lang]}</p>
        <p className="text-sm text-[#5a7066]">
          {lang === 'bn' ? activeDhikr.meaning_bn : activeDhikr.meaning_en}
        </p>

        {/* Interactive Counter Ring */}
        <div className="my-8 flex flex-col items-center">
          <div className="relative w-52 h-52 flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
              <circle cx="100" cy="100" r="86" fill="none" stroke="#eef5f0" strokeWidth="10" />
              <circle
                cx="100"
                cy="100"
                r="86"
                fill="none"
                stroke="#087653"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                className="transition-all duration-150"
              />
            </svg>
            <button
              type="button"
              data-testid="tasbih-tap-btn"
              onClick={handleIncrement}
              aria-label={lang === 'bn' ? 'তাসবিহ গণনা করুন' : 'Increment Tasbih counter'}
              className="absolute inset-4 rounded-full bg-[#f7faf8] hover:bg-[#eef5f0] active:scale-95 border border-[#dce7e0] flex flex-col items-center justify-center transition-transform cursor-pointer select-none"
            >
              <span
                data-testid="tasbih-count-value"
                className="font-mono-tabular text-5xl font-bold text-[#183027]"
              >
                {count}
              </span>
              <span className="text-xs font-medium text-[#087653] mt-1">
                {lang === 'bn' ? 'ট্যাপ করুন' : 'TAP TO COUNT'}
              </span>
            </button>
          </div>
        </div>

        {/* Target Selector & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-[#eef5f0]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#5a7066]">
              {lang === 'bn' ? 'লক্ষ্যমাত্রা:' : 'Target:'}
            </span>
            {[33, 99, 100, 0].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTarget(t)}
                className={`px-3 py-1 rounded-md text-xs font-mono-tabular font-semibold cursor-pointer ${
                  target === t
                    ? 'bg-[#087653] text-white'
                    : 'bg-[#eef5f0] text-[#183027]'
                }`}
              >
                {t === 0 ? '∞' : t}
              </button>
            ))}
          </div>

          <div className="text-xs text-[#5a7066]">
            {lang === 'bn' ? 'সর্বমোট গণনা:' : 'Lifetime Total:'}{' '}
            <strong className="font-mono-tabular text-[#183027]">{lifetimeTotal}</strong>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#dce7e0] hover:border-[#087653] text-xs font-semibold text-[#183027] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'রিসেট' : 'Reset'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface ZakatPageProps {
  lang: Language;
}

export function ZakatPage({ lang }: ZakatPageProps) {
  const [currency, setCurrency] = useState<'BDT' | 'USD'>('BDT');
  const [nisabStandard, setNisabStandard] = useState<'silver' | 'gold'>('silver');
  const [cash, setCash] = useState<string>('150000');
  const [bankSavings, setBankSavings] = useState<string>('250000');
  const [goldValue, setGoldValue] = useState<string>('0');
  const [silverValue, setSilverValue] = useState<string>('0');
  const [investments, setInvestments] = useState<string>('0');
  const [businessInventory, setBusinessInventory] = useState<string>('0');
  const [receivables, setReceivables] = useState<string>('0');
  const [debts, setDebts] = useState<string>('50000');

  // Default Nisab market equivalents (612.36g silver / 87.48g gold)
  const defaultSilverNisab = currency === 'BDT' ? 105000 : 650;
  const defaultGoldNisab = currency === 'BDT' ? 980000 : 7200;

  const result = useMemo(
    () =>
      calculateZakat({
        cash: Number(cash) || 0,
        bankSavings: Number(bankSavings) || 0,
        goldValue: Number(goldValue) || 0,
        silverValue: Number(silverValue) || 0,
        investments: Number(investments) || 0,
        businessInventory: Number(businessInventory) || 0,
        receivables: Number(receivables) || 0,
        debts: Number(debts) || 0,
        nisabStandard,
        goldNisabValue: defaultGoldNisab,
        silverNisabValue: defaultSilverNisab,
      }),
    [
      cash,
      bankSavings,
      goldValue,
      silverValue,
      investments,
      businessInventory,
      receivables,
      debts,
      nisabStandard,
      defaultGoldNisab,
      defaultSilverNisab,
    ]
  );

  const sym = currency === 'BDT' ? '৳' : '$';

  const fields = [
    { label_bn: 'নগদ টাকা', label_en: 'Cash in Hand', value: cash, setter: setCash },
    { label_bn: 'ব্যাংক সঞ্চয়', label_en: 'Bank Savings', value: bankSavings, setter: setBankSavings },
    { label_bn: 'স্বর্ণের বাজারমূল্য', label_en: 'Gold Value', value: goldValue, setter: setGoldValue },
    { label_bn: 'রৌপ্যের বাজারমূল্য', label_en: 'Silver Value', value: silverValue, setter: setSilverValue },
    { label_bn: 'শেয়ার ও বিনিয়োগ', label_en: 'Investments & Shares', value: investments, setter: setInvestments },
    { label_bn: 'ব্যবসায়িক পণ্য', label_en: 'Business Inventory', value: businessInventory, setter: setBusinessInventory },
    { label_bn: 'পাওনা টাকা (নিশ্চিত)', label_en: 'Receivable Loans', value: receivables, setter: setReceivables },
    { label_bn: 'তাৎক্ষণিক ঋণ ও দেনা (বিয়োগ)', label_en: 'Short-Term Debts (Deducted)', value: debts, setter: setDebts },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#183027]">
            {lang === 'bn' ? 'যাকাত ক্যালকুলেটর (২.৫%)' : 'Zakat Calculator (2.5%)'}
          </h1>
          <p className="text-[#5a7066] mt-1">
            {lang === 'bn'
              ? 'আপনার এক বছরের সঞ্চিত সম্পদ ও দেনার হিসাব দিয়ে নিসাব ও যাকাতের পরিমাণ নির্ণয় করুন।'
              : 'Calculate your annual Zakat obligation against Gold or Silver Nisab thresholds.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex bg-[#eef5f0] p-1 rounded-lg text-xs">
            {(['BDT', 'USD'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer ${
                  currency === c ? 'bg-white text-[#087653]' : 'text-[#5a7066]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="inline-flex bg-[#eef5f0] p-1 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setNisabStandard('silver')}
              className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer ${
                nisabStandard === 'silver' ? 'bg-white text-[#087653]' : 'text-[#5a7066]'
              }`}
            >
              {lang === 'bn' ? 'রূপা নিসাব' : 'Silver Nisab'}
            </button>
            <button
              type="button"
              onClick={() => setNisabStandard('gold')}
              className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer ${
                nisabStandard === 'gold' ? 'bg-white text-[#087653]' : 'text-[#5a7066]'
              }`}
            >
              {lang === 'bn' ? 'স্বর্ণ নিসাব' : 'Gold Nisab'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#dce7e0] p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <label key={f.label_en} className="block text-sm font-medium text-[#183027]">
              <span>{lang === 'bn' ? f.label_bn : f.label_en}</span>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#5a7066] font-mono-tabular">
                  {sym}
                </span>
                <input
                  type="number"
                  min={0}
                  value={f.value}
                  onChange={(e) => f.setter(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#dce7e0] bg-[#f7faf8] font-mono-tabular text-sm text-[#183027] focus:outline-none focus:border-[#087653]"
                />
              </div>
            </label>
          ))}
        </div>

        {/* Summary Card */}
        <aside className="lg:col-span-5 bg-white rounded-2xl border border-[#dce7e0] p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#183027]">
            {lang === 'bn' ? 'যাকাতের সারসংক্ষেপ' : 'Zakat Calculation Summary'}
          </h2>

          <div className="space-y-3 text-sm divide-y divide-[#eef5f0]">
            <div className="flex justify-between pt-2">
              <span className="text-[#5a7066]">{lang === 'bn' ? 'মোট সম্পদ' : 'Total Assets'}</span>
              <span className="font-mono-tabular font-semibold">
                {sym}
                {result.totalAssets.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between pt-3">
              <span className="text-[#5a7066]">{lang === 'bn' ? 'মোট দেনা' : 'Less Debts'}</span>
              <span className="font-mono-tabular font-semibold">
                -{sym}
                {result.totalDebts.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between pt-3">
              <span className="text-[#5a7066]">
                {lang === 'bn' ? 'নিট যাকাতযোগ্য সম্পদ' : 'Net Zakatable Wealth'}
              </span>
              <span className="font-mono-tabular font-bold text-[#183027]">
                {sym}
                {result.netZakatableWealth.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between pt-3">
              <span className="text-[#5a7066]">
                {lang === 'bn' ? 'নিসাব সীমা' : 'Nisab Threshold'}
              </span>
              <span className="font-mono-tabular font-semibold">
                {sym}
                {result.nisabThreshold.toLocaleString()}
              </span>
            </div>
          </div>

          <div
            data-testid="zakat-result-box"
            className={`rounded-xl p-5 border ${
              result.isEligible
                ? 'bg-[#eef5f0] border-[#087653]'
                : 'bg-[#f7faf8] border-[#dce7e0]'
            }`}
          >
            <p className="text-xs font-semibold uppercase text-[#5a7066]">
              {result.isEligible
                ? lang === 'bn'
                  ? 'যাকাত ফরজ হয়েছে (২.৫%)'
                  : 'Zakat Eligible (2.5% Due)'
                : lang === 'bn'
                ? 'নিসাব পরিমাণ পূর্ণ হয়নি'
                : 'Below Nisab Threshold'}
            </p>
            <p className="font-mono-tabular text-3xl font-bold text-[#087653] mt-1">
              {sym}
              {result.zakatDue.toLocaleString()}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
