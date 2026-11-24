import { useMemo, useState } from 'react';
import { Calendar as CalendarIcon, CheckSquare, ChevronLeft, ChevronRight, Square } from 'lucide-react';
import { ISLAMIC_EVENTS, RAMADAN_DUAS } from '../data/islamicSeed';
import type { CityLocation, Language } from '../types/islamic';
import {
  HIJRI_MONTHS,
  calculatePrayerTimes,
  getHijriMonthLength,
  gregorianToHijri,
} from '../utils/islamicMath';

interface RamadanPageProps {
  lang: Language;
  city: CityLocation;
}

const RAMADAN_CHECKLIST = [
  { id: 'fajr', bn: 'সেহরি ও ফজরের নামাজ জামাতে আদায়', en: 'Sehri & Fajr prayer on time' },
  { id: 'quran', bn: 'দৈনিক অন্তত ১ পারা বা নির্দিষ্ট অংশ কুরআন তিলাওয়াত', en: 'Daily Quran recitation' },
  { id: 'charity', bn: 'সামর্থ্য অনুযায়ী দান-সদকা করা', en: 'Daily charity (Sadaqah)' },
  { id: 'taraweeh', bn: 'এশা ও তারাবীহ নামাজ আদায়', en: 'Isha & Taraweeh prayers' },
  { id: 'istighfar', bn: 'ইফতারের আগে দোয়া ও ইস্তেগফার', en: 'Pre-Iftar Dua & Istighfar' },
];

export function RamadanPage({ lang, city }: RamadanPageProps) {
  const [checked, setChecked] = useState<string[]>(['fajr']);

  const schedule = useMemo(() => {
    // Generate 30-day Sehri/Iftar schedule starting from a clean spring Ramadan reference window
    const start = new Date(2026, 1, 19); // Feb 19, 2026 (~Ramadan 1 1447)
    return Array.from({ length: 30 }).map((_, idx) => {
      const d = new Date(start);
      d.setDate(start.getDate() + idx);
      const times = calculatePrayerTimes(d, city.lat, city.lng, city.tzOffset, 'hanafi');
      return {
        ramadanDay: idx + 1,
        gregorian: d.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
          month: 'short',
          day: 'numeric',
        }),
        sehriEnd: times.sehriEnd,
        fajr: times.fajr,
        iftar: times.iftar,
      };
    });
  }, [city, lang]);

  const toggleItem = (id: string) => {
    setChecked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#183027]">
          {lang === 'bn'
            ? `রমজান ক্যালেন্ডার (সেহরি ও ইফতার) — ${city.name_bn}`
            : `Ramadan Sehri & Iftar Schedule — ${city.name_en}`}
        </h1>
        <p className="text-[#5a7066] mt-1">
          {lang === 'bn'
            ? '৩০ দিনের সেহরির শেষ সময়, ফজর ও ইফতারের সময়সূচি এবং রোজার প্রয়োজনীয় দোয়া।'
            : '30-day Sehri end, Fajr, and Iftar timetable alongside authentic fasting supplications.'}
        </p>
      </div>

      {/* Sehri & Iftar Duas + Daily Ibadah Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          {RAMADAN_DUAS.map((dua) => (
            <div key={dua.id} className="bg-white rounded-2xl border border-[#dce7e0] p-6">
              <h2 className="text-lg font-bold text-[#183027]">
                {lang === 'bn' ? dua.title_bn : dua.title_en}
              </h2>
              <p className="font-arabic text-2xl text-[#087653] text-right mt-3">{dua.arabic}</p>
              <p className="text-sm font-medium text-[#183027] mt-2">
                {lang === 'bn' ? dua.pronunciation_bn : dua.pronunciation_en}
              </p>
              <p className="text-sm text-[#5a7066] mt-1">
                {lang === 'bn' ? dua.meaning_bn : dua.meaning_en}
              </p>
            </div>
          ))}
        </div>

        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#dce7e0] p-6">
          <h2 className="text-lg font-bold text-[#183027] mb-4">
            {lang === 'bn' ? 'দৈনিক রমজান ইবাদত চেকলিস্ট' : 'Daily Ramadan Checklist'}
          </h2>
          <div className="space-y-2.5">
            {RAMADAN_CHECKLIST.map((item) => {
              const isDone = checked.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className={`w-full text-left p-3 rounded-xl border flex items-center gap-3 transition-colors cursor-pointer ${
                    isDone ? 'bg-[#eef5f0] border-[#087653]' : 'bg-[#f7faf8] border-[#dce7e0]'
                  }`}
                >
                  {isDone ? (
                    <CheckSquare className="w-5 h-5 text-[#087653] shrink-0" />
                  ) : (
                    <Square className="w-5 h-5 text-[#5a7066] shrink-0" />
                  )}
                  <span className="text-sm font-medium text-[#183027]">{item[lang]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 30-Day Timetable */}
      <div className="bg-white rounded-2xl border border-[#dce7e0] overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#eef5f0] text-xs font-semibold text-[#183027] uppercase">
              <th className="py-3 px-4">{lang === 'bn' ? 'রমজান' : 'Ramadan'}</th>
              <th className="py-3 px-4">{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
              <th className="py-3 px-4">{lang === 'bn' ? 'সেহরির শেষ সময়' : 'Sehri Ends'}</th>
              <th className="py-3 px-4">{lang === 'bn' ? 'ফজর' : 'Fajr'}</th>
              <th className="py-3 px-4">{lang === 'bn' ? 'ইফতার' : 'Iftar'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eef5f0] text-sm tabular-nums">
            {schedule.map((row) => (
              <tr key={row.ramadanDay} className="hover:bg-[#f7faf8]">
                <td className="py-3 px-4 font-semibold text-[#087653]">
                  {lang === 'bn' ? `রমজান ${row.ramadanDay}` : `Day ${row.ramadanDay}`}
                </td>
                <td className="py-3 px-4 text-[#5a7066]">{row.gregorian}</td>
                <td className="py-3 px-4 font-mono-tabular font-semibold">{row.sehriEnd}</td>
                <td className="py-3 px-4 font-mono-tabular">{row.fajr}</td>
                <td className="py-3 px-4 font-mono-tabular font-semibold text-[#9c7524]">
                  {row.iftar}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface CalendarPageProps {
  lang: Language;
}

export function CalendarPage({ lang }: CalendarPageProps) {
  const todayHijri = useMemo(() => gregorianToHijri(new Date()), []);
  const [viewYear, setViewYear] = useState<number>(todayHijri.year);
  const [viewMonth, setViewMonth] = useState<number>(todayHijri.month);
  const [converterDate, setConverterDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  const monthMeta = HIJRI_MONTHS[viewMonth - 1];
  const monthDays = getHijriMonthLength(viewYear, viewMonth);

  const convertedHijri = useMemo(() => {
    const parsed = new Date(converterDate + 'T12:00:00');
    return Number.isNaN(parsed.getTime()) ? todayHijri : gregorianToHijri(parsed);
  }, [converterDate, todayHijri]);

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#183027]">
            {lang === 'bn' ? 'ইসলামিক হিজরি ক্যালেন্ডার' : 'Islamic Hijri Calendar'}
          </h1>
          <p className="text-[#5a7066] mt-1">
            {lang === 'bn'
              ? 'হিজরি মাস, তারিখ রূপান্তরক এবং গুরুত্বপূর্ণ ইসলামিক দিবসসমূহ।'
              : 'Monthly Hijri grid, Gregorian-to-Hijri date converter, and annual Islamic observances.'}
          </p>
        </div>

        <div className="bg-white border border-[#dce7e0] rounded-xl px-4 py-2.5 text-sm">
          <span className="text-[#5a7066]">{lang === 'bn' ? 'আজ:' : 'Today:'}</span>{' '}
          <strong className="text-[#087653]">
            {todayHijri.day} {lang === 'bn' ? todayHijri.monthNameBn : todayHijri.monthNameEn}{' '}
            {todayHijri.year} AH
          </strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Monthly Hijri Grid */}
        <section className="lg:col-span-8 bg-white rounded-2xl border border-[#dce7e0] p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#eef5f0]">
            <div>
              <h2 className="text-xl font-bold text-[#183027]">
                {lang === 'bn' ? monthMeta.bn : monthMeta.en} {viewYear}{' '}
                <span className="font-arabic text-[#087653] ml-2">{monthMeta.ar}</span>
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label={lang === 'bn' ? 'পূর্ববর্তী মাস' : 'Previous month'}
                className="p-2 rounded-lg border border-[#dce7e0] hover:bg-[#eef5f0] cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label={lang === 'bn' ? 'পরবর্তী মাস' : 'Next month'}
                className="p-2 rounded-lg border border-[#dce7e0] hover:bg-[#eef5f0] cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-6 gap-2.5 mt-5">
            {Array.from({ length: monthDays }).map((_, i) => {
              const day = i + 1;
              const isToday =
                viewYear === todayHijri.year &&
                viewMonth === todayHijri.month &&
                day === todayHijri.day;
              const event = ISLAMIC_EVENTS.find((ev) => ev.month === viewMonth && ev.day === day);
              return (
                <div
                  key={day}
                  className={`rounded-xl p-3 border min-h-[76px] flex flex-col justify-between ${
                    isToday
                      ? 'bg-[#087653] text-white border-[#087653]'
                      : event
                      ? 'bg-[#eef5f0] border-[#087653]/40 text-[#183027]'
                      : 'bg-[#f7faf8] border-[#dce7e0] text-[#183027]'
                  }`}
                >
                  <span className="font-mono-tabular text-base font-bold">{day}</span>
                  {event && (
                    <span
                      className={`text-[11px] leading-tight font-medium ${
                        isToday ? 'text-[#d5ad59]' : 'text-[#087653]'
                      }`}
                    >
                      {lang === 'bn' ? event.title_bn : event.title_en}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Converter + Key Islamic Dates */}
        <aside className="lg:col-span-4 space-y-5">
          <div className="bg-white rounded-2xl border border-[#dce7e0] p-6">
            <h2 className="text-base font-bold text-[#183027] flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#087653]" />
              <span>{lang === 'bn' ? 'তারিখ রূপান্তরক' : 'Gregorian to Hijri Converter'}</span>
            </h2>
            <label className="block mt-3 text-xs text-[#5a7066]">
              <span>{lang === 'bn' ? 'ইংরেজি তারিখ নির্বাচন করুন' : 'Select Gregorian Date'}</span>
              <input
                type="date"
                value={converterDate}
                onChange={(e) => setConverterDate(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#dce7e0] bg-[#f7faf8] text-sm text-[#183027]"
              />
            </label>
            <div className="mt-4 p-4 rounded-xl bg-[#eef5f0]">
              <p className="text-xs text-[#5a7066]">{lang === 'bn' ? 'হিজরি তারিখ:' : 'Hijri Date:'}</p>
              <p className="text-lg font-bold text-[#087653] mt-0.5">
                {convertedHijri.day}{' '}
                {lang === 'bn' ? convertedHijri.monthNameBn : convertedHijri.monthNameEn}{' '}
                {convertedHijri.year} AH
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#dce7e0] p-6">
            <h2 className="text-base font-bold text-[#183027] mb-3">
              {lang === 'bn' ? 'গুরুত্বপূর্ণ ইসলামিক দিবস' : 'Key Islamic Dates'}
            </h2>
            <ul className="divide-y divide-[#eef5f0] text-sm">
              {ISLAMIC_EVENTS.map((ev) => {
                const m = HIJRI_MONTHS[ev.month - 1];
                return (
                  <li key={`${ev.month}-${ev.day}`} className="py-2.5 flex justify-between gap-2">
                    <span className="font-medium text-[#183027]">
                      {lang === 'bn' ? ev.title_bn : ev.title_en}
                    </span>
                    <span className="text-xs text-[#5a7066] whitespace-nowrap">
                      {ev.day} {lang === 'bn' ? m.bn : m.en}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
