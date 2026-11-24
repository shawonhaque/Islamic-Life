import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import {
  Check,
  Clock,
  Compass,
  Info,
  Loader2,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { ADHAN_DATA } from '../data/islamicModulesData';
import type { CityLocation, Language, PrayerTimesResult } from '../types/islamic';
import {
  PRESET_CITIES,
  calculateDistanceToKaabaKm,
  calculateQiblaBearing,
  getCardinalDirection,
  getLocationClock,
  getNextPrayerInfo,
} from '../utils/islamicMath';
import { NearbyMosquesPanel } from './NearbyMosquesPanel';

// The map tab pulls in the Google Maps SDK and is only opened on demand.
const QiblaGoogleMap = lazy(() =>
  import('./QiblaGoogleMap').then((m) => ({ default: m.QiblaGoogleMap }))
);

interface PrayerTimePageProps {
  lang: Language;
  city: CityLocation;
  liveGpsCity?: CityLocation | null;
  detectingLocation?: boolean;
  asrMethod: 'hanafi' | 'standard';
  prayerTimes: PrayerTimesResult;
  onSelectCity: (city: CityLocation) => void;
  onDetectLocation?: () => void;
  onOpenLocationModal?: () => void;
  onChangeAsrMethod: (method: 'hanafi' | 'standard') => void;
}

export function PrayerTimePage({
  lang,
  city,
  liveGpsCity,
  detectingLocation,
  asrMethod,
  prayerTimes,
  onSelectCity,
  onDetectLocation,
  onOpenLocationModal,
  onChangeAsrMethod,
}: PrayerTimePageProps) {
  const [adhanPlaying, setAdhanPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const locationClock = getLocationClock(Date.now(), city.tzOffset, city.timeZoneId);
  const nowMinutes = locationClock.nowMinutes;
  const nextPrayer = getNextPrayerInfo(prayerTimes, nowMinutes);
  const remH = Math.floor(nextPrayer.remainingMinutes / 60);
  const remM = nextPrayer.remainingMinutes % 60;
  const cityOptions = liveGpsCity
    ? [liveGpsCity, ...PRESET_CITIES.filter((c) => c.id !== liveGpsCity.id)]
    : PRESET_CITIES;

  const waqts: Array<{ id: string; bn: string; en: string; time: string }> = [
    { id: 'fajr', bn: 'ফজর', en: 'Fajr', time: prayerTimes.fajr },
    { id: 'sunrise', bn: 'সূর্যোদয়', en: 'Sunrise', time: prayerTimes.sunrise },
    { id: 'dhuhr', bn: 'যোহর', en: 'Dhuhr', time: prayerTimes.dhuhr },
    { id: 'asr', bn: 'আসর', en: 'Asr', time: prayerTimes.asr },
    { id: 'maghrib', bn: 'মাগরিব', en: 'Maghrib', time: prayerTimes.maghrib },
    { id: 'isha', bn: 'এশা', en: 'Isha', time: prayerTimes.isha },
  ];

  const nextLabel = waqts.find((w) => w.id === nextPrayer.id);

  const toggleAdhanPreview = () => {
    if (adhanPlaying) {
      setAdhanPlaying(false);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    setAdhanPlaying(true);
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
        const ctx = audioCtxRef.current;
        const notes = [392.0, 440.0, 493.88, 523.25, 440.0];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          const start = ctx.currentTime + i * 0.28;
          gain.gain.setValueAtTime(0.06, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.55);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.58);
        });
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(
          'Allahu Akbar, Allahu Akbar. Ashhadu an la ilaha illallah. Ashhadu anna Muhammadar Rasulullah. Hayya alas salah. Hayya alal falah.'
        );
        utter.rate = 0.85;
        utter.onend = () => setAdhanPlaying(false);
        utter.onerror = () => setAdhanPlaying(false);
        window.speechSynthesis.speak(utter);
      } else {
        globalThis.setTimeout(() => setAdhanPlaying(false), 1800);
      }
    } catch {
      setAdhanPlaying(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#183027]">
            {lang === 'bn' ? 'দৈনিক নামাজের সময়সূচি ও আজান' : 'Daily Prayer Times & Adhan'}
          </h1>
          <p className="text-[#5a7066] mt-1">
            {lang === 'bn'
              ? 'অক্ষাংশ ও দ্রাঘিমাংশ অনুযায়ী নির্ভুল নামাজ, সেহরি ও ইফতারের সময় এবং আজানের দোয়া।'
              : 'Astronomically calculated prayer schedule, Sehri end, Iftar time, and Adhan guide.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onOpenLocationModal ? (
            <button
              type="button"
              onClick={onOpenLocationModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#dce7e0] bg-white hover:border-[#087653] text-sm font-medium text-[#183027] cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-[#087653]" />
              <span>
                {lang === 'bn'
                  ? `${city.name_bn}, ${city.country_bn}`
                  : `${city.name_en}, ${city.country_en}`}
              </span>
            </button>
          ) : (
            <label className="flex items-center gap-2 text-sm text-[#183027]">
              <MapPin className="w-4 h-4 text-[#087653]" />
              <span className="sr-only">{lang === 'bn' ? 'শহর নির্বাচন' : 'Select City'}</span>
              <select
                value={city.id}
                aria-label={lang === 'bn' ? 'শহর নির্বাচন করুন' : 'Select City'}
                onChange={(e) => {
                  const found = cityOptions.find((c) => c.id === e.target.value);
                  if (found) onSelectCity(found);
                }}
                className="px-3 py-2 rounded-lg border border-[#dce7e0] bg-white text-sm font-medium focus:outline-none focus:border-[#087653]"
              >
                {cityOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {lang === 'bn'
                      ? `${c.name_bn}, ${c.country_bn}`
                      : `${c.name_en}, ${c.country_en}`}
                  </option>
                ))}
              </select>
            </label>
          )}

          {onDetectLocation && (
            <button
              type="button"
              onClick={onDetectLocation}
              disabled={detectingLocation}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#dce7e0] bg-white hover:border-[#087653] text-xs font-semibold text-[#087653] cursor-pointer disabled:opacity-60"
            >
              {detectingLocation ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LocateFixed className="w-3.5 h-3.5" />
              )}
              <span>{lang === 'bn' ? 'লাইভ GPS' : 'Live GPS'}</span>
            </button>
          )}

          <div className="inline-flex bg-[#eef5f0] p-1 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => onChangeAsrMethod('hanafi')}
              className={`px-3 py-1.5 rounded-md font-medium cursor-pointer ${
                asrMethod === 'hanafi' ? 'bg-white text-[#087653] font-semibold' : 'text-[#5a7066]'
              }`}
            >
              {lang === 'bn' ? 'হানাফি (আসর)' : 'Hanafi Asr'}
            </button>
            <button
              type="button"
              onClick={() => onChangeAsrMethod('standard')}
              className={`px-3 py-1.5 rounded-md font-medium cursor-pointer ${
                asrMethod === 'standard'
                  ? 'bg-white text-[#087653] font-semibold'
                  : 'text-[#5a7066]'
              }`}
            >
              {lang === 'bn' ? 'শাফিঈ / সাধারণ' : 'Standard Asr'}
            </button>
          </div>
        </div>
      </div>

      {/* Next Prayer Hero Card */}
      <div className="bg-gradient-to-r from-[#064b37] to-[#087653] text-white rounded-2xl p-6 sm:p-8 flex flex-wrap items-center justify-between gap-6">
        <div>
          <p className="text-xs font-semibold tracking-wider text-[#d5ad59] uppercase">
            {lang === 'bn' ? 'পরবর্তী ওয়াক্ত' : 'Upcoming Prayer'}
          </p>
          <h2 className="text-3xl font-bold mt-1">
            {nextLabel ? nextLabel[lang] : nextPrayer.id} —{' '}
            <span className="font-mono-tabular">{nextPrayer.time}</span>
          </h2>
          <p className="text-sm text-white/80 mt-1">
            {lang === 'bn' ? city.name_bn : city.name_en} ·{' '}
            {lang === 'bn' ? 'বাকি সময়:' : 'Starts in'}{' '}
            <span className="font-mono-tabular font-semibold text-white">
              {remH}h {remM}m
            </span>
          </p>
        </div>

        <div className="flex items-center gap-6 bg-white/10 rounded-xl px-5 py-3.5">
          <div>
            <p className="text-xs text-white/75">
              {lang === 'bn' ? 'সেহরির শেষ সময়' : 'Sehri Ends'}
            </p>
            <p className="font-mono-tabular text-lg font-bold text-[#d5ad59]">
              {prayerTimes.sehriEnd}
            </p>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div>
            <p className="text-xs text-white/75">{lang === 'bn' ? 'ইফতার' : 'Iftar'}</p>
            <p className="font-mono-tabular text-lg font-bold text-[#d5ad59]">
              {prayerTimes.iftar}
            </p>
          </div>
        </div>
      </div>

      {/* 6 Prayer Times Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {waqts.map((w) => {
          const isNext = nextPrayer.id === w.id;
          return (
            <div
              key={w.id}
              className={`bg-white rounded-2xl p-5 border flex items-center justify-between ${
                isNext ? 'border-[#087653] bg-[#eef5f0]/40' : 'border-[#dce7e0]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isNext ? 'bg-[#087653] text-white' : 'bg-[#eef5f0] text-[#087653]'
                  }`}
                >
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-[#183027]">{w[lang]}</p>
                  <p className="text-xs text-[#5a7066]">
                    {isNext
                      ? lang === 'bn'
                        ? 'আসন্ন ওয়াক্ত'
                        : 'Next Prayer'
                      : lang === 'bn'
                      ? 'দৈনিক সময়'
                      : 'Daily Time'}
                  </p>
                </div>
              </div>
              <p className="font-mono-tabular text-xl font-bold text-[#183027]">{w.time}</p>
            </div>
          );
        })}
      </div>

      {/* Adhan & Post-Adhan Dua Section */}
      <section className="bg-white rounded-2xl border border-[#dce7e0] p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#eef5f0]">
          <div>
            <h2 className="text-xl font-bold text-[#183027]">
              {lang === 'bn' ? 'আজানের বাক্যসমূহ ও আজানের দোয়া' : 'Adhan Calls & Post-Adhan Dua'}
            </h2>
            <p className="text-xs sm:text-sm text-[#5a7066] mt-0.5">
              {lang === 'bn'
                ? 'আজান শুনে মুয়াজ্জিনের সাথে জবাব দিন এবং শেষে দরুদ ও আজানের দোয়া পড়ুন।'
                : 'Respond silently along with the Muadhdhin and recite the Dua after Adhan.'}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleAdhanPreview}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              adhanPlaying
                ? 'bg-[#b58328] text-white'
                : 'bg-[#087653] hover:bg-[#065c40] text-white'
            }`}
          >
            {adhanPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>
              {adhanPlaying
                ? lang === 'bn'
                  ? 'থামান'
                  : 'Stop Adhan Audio'
                : lang === 'bn'
                ? 'আজান শুনুন'
                : 'Play Adhan Preview'}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ADHAN_DATA.lines.map((line, i) => (
            <div key={i} className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] p-4">
              <p className="font-arabic text-xl text-[#087653] text-right">{line.ar}</p>
              <p className="text-xs sm:text-sm text-[#183027] font-medium mt-2">{line[lang]}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-[#eef5f0]/60 border border-[#087653]/25 p-5">
          <p className="text-xs font-bold text-[#087653] mb-2">
            {lang === 'bn' ? 'আজানের পরের মাসনূন দোয়া' : 'Dua After Hearing the Adhan'}
          </p>
          <p className="font-arabic text-2xl text-[#183027] text-right leading-loose">
            {ADHAN_DATA.duaArabic}
          </p>
          <p className="text-sm font-medium text-[#183027] mt-3">
            {ADHAN_DATA.duaPronunciationBn}
          </p>
          <p className="text-sm text-[#5a7066] mt-1.5">
            {lang === 'bn' ? ADHAN_DATA.duaMeaningBn : ADHAN_DATA.duaMeaningEn}
          </p>
        </div>
      </section>
    </div>
  );
}

interface QiblaPageProps {
  lang: Language;
  city: CityLocation;
  onSelectCity: (city: CityLocation) => void;
  onDetectLocation?: () => void;
  onOpenLocationModal?: () => void;
}

export function QiblaPage({
  lang,
  city,
  onSelectCity,
  onDetectLocation,
  onOpenLocationModal,
}: QiblaPageProps) {
  const [activeTab, setActiveTab] = useState<'qibla' | 'mosques' | 'kaaba-map'>('qibla');
  const [showTutorial, setShowTutorial] = useState(true);
  const [heading, setHeading] = useState<number | null>(null);
  const [needsPermission, setNeedsPermission] = useState(false);
  const [mockDemoAngle, setMockDemoAngle] = useState(62);
  const [mapPinCoords, setMapPinCoords] = useState<{ lat: number; lng: number } | null>(null);
  const hasBuzzedRef = useRef(false);

  const activeLat = mapPinCoords ? mapPinCoords.lat : city.lat;
  const activeLng = mapPinCoords ? mapPinCoords.lng : city.lng;

  useEffect(() => {
    setMapPinCoords(null);
  }, [city.id, city.lat, city.lng]);

  const bearingRaw = calculateQiblaBearing(activeLat, activeLng);
  const bearing = Number(bearingRaw.toFixed(1));
  const distanceKm = Math.round(calculateDistanceToKaabaKm(activeLat, activeLng));
  const distanceMi = Math.round(distanceKm * 0.621371);
  const cardinal = getCardinalDirection(bearing);

  // Animate tutorial phone mockup smoothly
  useEffect(() => {
    const interval = window.setInterval(() => {
      setMockDemoAngle((prev) => (prev === 62 ? 0 : 62));
    }, 2200);
    return () => window.clearInterval(interval);
  }, []);

  // Device Orientation / Compass Sensor Listener
  useEffect(() => {
    const orientationCtor = window.DeviceOrientationEvent as unknown as
      | { requestPermission?: () => Promise<string> }
      | undefined;
    if (orientationCtor && typeof orientationCtor.requestPermission === 'function') {
      setNeedsPermission(true);
    }

    const handleOrientation = (
      event: DeviceOrientationEvent & { webkitCompassHeading?: number }
    ) => {
      let currentHeading: number | null = null;
      if (typeof event.webkitCompassHeading === 'number') {
        currentHeading = event.webkitCompassHeading;
      } else if (typeof event.alpha === 'number') {
        currentHeading = (360 - event.alpha) % 360;
      }

      if (currentHeading !== null && !Number.isNaN(currentHeading)) {
        setHeading(currentHeading);
        setNeedsPermission(false);
      }
    };

    window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
    window.addEventListener('deviceorientation', handleOrientation as EventListener, true);

    return () => {
      window.removeEventListener(
        'deviceorientationabsolute',
        handleOrientation as EventListener,
        true
      );
      window.removeEventListener('deviceorientation', handleOrientation as EventListener, true);
    };
  }, []);

  const requestIOSCompass = async () => {
    try {
      const orientationCtor = window.DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>;
      };
      if (orientationCtor && typeof orientationCtor.requestPermission === 'function') {
        const response = await orientationCtor.requestPermission();
        if (response === 'granted') {
          setNeedsPermission(false);
        }
      }
    } catch {
      // Ignore permission rejection cleanly
    }
  };

  let relativeAngle = 0;
  let isAligned = false;

  if (heading !== null) {
    relativeAngle = (bearing - heading + 360) % 360;
    if (relativeAngle > 180) relativeAngle -= 360;
    isAligned = Math.abs(relativeAngle) <= 4;

    if (isAligned && !hasBuzzedRef.current) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(100);
      }
      hasBuzzedRef.current = true;
    } else if (!isAligned) {
      hasBuzzedRef.current = false;
    }
  }

  const cityDisplay = lang === 'bn' ? city.name_bn : city.name_en;

  return (
    <div className="min-h-full bg-[#F7F5F0] text-[#1C1B18] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Minimal Light-Cream Header + Clean Tab Switch */}
        <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#1C1B18]">
              {lang === 'bn' ? 'কিবলা (Qibla)' : 'Qibla'}
            </h1>
            <button
              type="button"
              onClick={onOpenLocationModal}
              className="text-sm text-[#6E6A63] hover:text-[#8C6218] mt-0.5 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>{cityDisplay}</span>
              {city.isLiveGps && (
                <span className="text-xs font-medium text-[#16A34A]">· Live GPS</span>
              )}
            </button>
          </div>

          <div className="inline-flex items-center bg-white p-1 rounded-xl border border-[#E6E2D8] gap-1">
            <button
              type="button"
              data-testid="qibla-tab-compass"
              onClick={() => setActiveTab('qibla')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1.5 ${
                activeTab === 'qibla'
                  ? 'bg-[#8C6218] text-white'
                  : 'text-[#6E6A63] hover:text-[#1C1B18]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'কিবলা কম্পাস' : 'Qibla Compass'}</span>
            </button>

            <button
              type="button"
              data-testid="qibla-tab-mosques"
              onClick={() => setActiveTab('mosques')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1.5 ${
                activeTab === 'mosques'
                  ? 'bg-[#8C6218] text-white'
                  : 'text-[#6E6A63] hover:text-[#1C1B18]'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'নিকটস্থ মসজিদ' : 'Live Mosques'}</span>
            </button>

            <button
              type="button"
              data-testid="qibla-tab-google-map"
              onClick={() => setActiveTab('kaaba-map')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1.5 ${
                activeTab === 'kaaba-map'
                  ? 'bg-[#8C6218] text-white'
                  : 'text-[#6E6A63] hover:text-[#1C1B18]'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'কাবা ম্যাপ লাইন' : 'Kaaba Map'}</span>
            </button>
          </div>
        </header>

        {/* TAB 1: MINIMAL 2D LIVE QIBLA COMPASS */}
        {activeTab === 'qibla' && (
          <div data-testid="qibla-minimal-view">
            {/* Collapsible "Finding the Qibla" Tutorial Banner */}
            {showTutorial && (
              <section
                data-testid="qibla-tutorial-card"
                className="bg-white rounded-2xl border border-[#E6E2D8] shadow-sm p-6 sm:p-8 mb-10"
              >
                <h2 className="text-center text-lg font-bold text-[#1C1B18] mb-6">
                  {lang === 'bn' ? 'কিবলা নির্ণয়ের নিয়ম (Finding the Qibla)' : 'Finding the Qibla'}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  {/* Left Illustration: Posture Icons + Animated Phone Mockup */}
                  <div className="md:col-span-5 flex items-center justify-center gap-5">
                    <div className="flex flex-col gap-7 items-center">
                      <div className="flex items-center gap-2.5">
                        <div className="w-11 h-2 bg-[#2B303A] rounded-full border-t-2 border-teal-400" />
                        <Check className="w-4 h-4 text-[#16A34A] stroke-[3]" />
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-11 bg-gray-400 rounded-full" />
                        <X className="w-4 h-4 text-red-500 stroke-[3]" />
                      </div>
                    </div>

                    <div className="w-40 h-56 bg-[#F3EFE6] border-2 border-[#D5CFC2] rounded-3xl p-3 flex flex-col items-center justify-between shadow-inner">
                      <div className="w-9 h-1 bg-[#B8B2A6] rounded-full" />

                      <div className="w-28 h-28 bg-white rounded-full border border-[#D5CFC2] relative flex items-center justify-center">
                        <span className="absolute top-1 text-[9px] font-bold text-red-600">N</span>
                        <span className="absolute bottom-1 text-[9px] font-bold text-gray-400">
                          S
                        </span>
                        <span className="absolute right-1.5 text-[9px] font-bold text-gray-400">
                          E
                        </span>
                        <span className="absolute left-1.5 text-[9px] font-bold text-gray-400">
                          W
                        </span>

                        <div
                          className="w-full h-full absolute inset-0 transition-transform duration-1000 ease-in-out"
                          style={{ transform: `rotate(${mockDemoAngle}deg)` }}
                        >
                          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 text-xs select-none">
                            🕋
                          </div>
                          <div
                            className={`w-1 h-11 mx-auto mt-6 rounded-full transition-colors duration-500 ${
                              mockDemoAngle === 0 ? 'bg-[#16A34A]' : 'bg-[#8C6218]'
                            }`}
                          />
                        </div>
                      </div>

                      <span className="text-[11px] font-semibold text-[#1C1B18]">
                        {mockDemoAngle === 0
                          ? "You're facing Qibla"
                          : `Turn right ${mockDemoAngle}°`}
                      </span>
                    </div>
                  </div>

                  {/* Right 3 Numbered Steps + Figure-8 Calibration Tip + Got It CTA */}
                  <div className="md:col-span-7 flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#F3EDE2] text-[#8C6218] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <p className="text-sm text-[#3D3A35] leading-relaxed">
                        Hold your phone flat in front of you, screen up, like a tray. Keep it away
                        from metal, magnets and magnetic cases.
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#F3EDE2] text-[#8C6218] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <p className="text-sm text-[#3D3A35] leading-relaxed">
                        The gold arrow always points to the Kaaba. Turn your whole body slowly, the
                        way the screen tells you.
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#F3EDE2] text-[#8C6218] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <p className="text-sm text-[#3D3A35] leading-relaxed">
                        When the arrow points straight up to the top of your phone, it turns green
                        and the phone buzzes. You&apos;re facing the Qibla.
                      </p>
                    </div>

                    <div className="bg-[#F7F5F0] rounded-xl px-4 py-3 flex items-center gap-3 text-xs text-[#6E6A63] mt-1">
                      <span className="text-xl font-bold text-[#8C6218] leading-none">∞</span>
                      <span>
                        Arrow jumping around? Step away from metal and move your phone in a figure-8
                        a few times.
                      </span>
                    </div>

                    <div className="mt-2 flex justify-center md:justify-start">
                      <button
                        type="button"
                        data-testid="qibla-got-it-btn"
                        onClick={() => setShowTutorial(false)}
                        className="bg-[#8C6218] hover:bg-[#734F12] text-white font-semibold text-sm px-14 py-3 rounded-full transition-colors cursor-pointer"
                      >
                        Got it
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Main 2-Column Compass & Status Metrics */}
            <main className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
              {/* Left Column: Clean White 2D Live Interactive Compass Dial */}
              <div className="md:col-span-5 flex justify-center">
                <div
                  data-testid="qibla-2d-compass"
                  className="w-72 h-72 bg-white rounded-full border border-[#DCD7CC] shadow-sm relative flex items-center justify-center"
                >
                  <div
                    className="w-full h-full relative transition-transform duration-150 ease-out"
                    style={{
                      transform:
                        heading !== null ? `rotate(${-heading}deg)` : 'rotate(0deg)',
                    }}
                  >
                    {/* 36 Degree Tick Marks */}
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute inset-0"
                        style={{ transform: `rotate(${i * 10}deg)` }}
                      >
                        <div
                          className={`mx-auto ${
                            i % 9 === 0
                              ? 'w-0.5 h-2.5 bg-gray-400'
                              : 'w-[1px] h-1.5 bg-gray-300'
                          }`}
                        />
                      </div>
                    ))}

                    {/* Cardinal N (with Red Triangle), E, S, W */}
                    <div className="absolute top-2.5 left-1/2 -translate-x-1/2 flex flex-col items-center leading-none">
                      <span
                        className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-red-600 mb-0.5"
                        aria-hidden="true"
                      />
                      <span className="text-xs font-bold text-red-600">N</span>
                    </div>
                    <span className="absolute bottom-3.5 left-1/2 -translate-x-1/2 text-xs font-bold text-[#6E6A63]">
                      S
                    </span>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#6E6A63]">
                      E
                    </span>
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#6E6A63]">
                      W
                    </span>

                    {/* Dashed North Reference Line */}
                    <div className="absolute top-9 bottom-1/2 left-1/2 -translate-x-1/2 border-l border-dashed border-gray-300" />

                    {/* Rotating Gold Arrow (#8C6218) / Aligned Green (#16A34A) + Kaaba Icon */}
                    <div
                      className="w-full h-full absolute inset-0 transition-transform duration-200"
                      style={{ transform: `rotate(${bearing}deg)` }}
                    >
                      <div className="absolute top-5 left-1/2 -translate-x-1/2 text-lg select-none">
                        🕋
                      </div>

                      <div
                        className={`w-0 h-0 mx-auto mt-11 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[20px] transition-colors duration-300 ${
                          isAligned ? 'border-b-[#16A34A]' : 'border-b-[#8C6218]'
                        }`}
                      />

                      <div
                        className={`w-2 h-20 mx-auto -mt-0.5 rounded-b-full transition-colors duration-300 ${
                          isAligned ? 'bg-[#16A34A]' : 'bg-[#8C6218]'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Center Pivot */}
                  <div
                    className={`w-3.5 h-3.5 rounded-full z-10 transition-colors duration-300 ${
                      isAligned ? 'bg-[#16A34A]' : 'bg-[#8C6218]'
                    }`}
                  />
                </div>
              </div>

              {/* Right Column: Live Guidance Status, Controls & 2 Metric Cards */}
              <div className="md:col-span-7 text-center md:text-left">
                {heading === null ? (
                  <h2
                    data-testid="qibla-status-text"
                    className="text-xl sm:text-2xl font-bold text-[#1C1B18] leading-snug mb-4"
                  >
                    Live compass is not available on this device. Face {bearing}° ({cardinal.en})
                    clockwise from true North.
                  </h2>
                ) : isAligned ? (
                  <h2
                    data-testid="qibla-status-text"
                    className="text-2xl font-bold text-[#16A34A] leading-snug mb-4"
                  >
                    You&apos;re facing the Qibla
                  </h2>
                ) : (
                  <h2
                    data-testid="qibla-status-text"
                    className="text-2xl font-bold text-[#1C1B18] leading-snug mb-4"
                  >
                    {relativeAngle > 0
                      ? `Turn right ${Math.round(Math.abs(relativeAngle))}°`
                      : `Turn left ${Math.round(Math.abs(relativeAngle))}°`}
                  </h2>
                )}

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-4">
                  <button
                    type="button"
                    data-testid="qibla-how-to-use-btn"
                    onClick={() => setShowTutorial(true)}
                    className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 text-[#1C1B18] border border-[#E6E2D8] rounded-full px-4 py-1.5 text-xs font-semibold shadow-2xs cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5 text-[#8C6218]" />
                    <span>How to use</span>
                  </button>

                  {needsPermission && (
                    <button
                      type="button"
                      onClick={requestIOSCompass}
                      className="inline-flex items-center gap-1.5 bg-[#8C6218] text-white rounded-full px-4 py-1.5 text-xs font-semibold shadow-2xs cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Enable Live Compass</span>
                    </button>
                  )}

                  {onDetectLocation && (
                    <button
                      type="button"
                      onClick={onDetectLocation}
                      className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 text-[#1C1B18] border border-[#E6E2D8] rounded-full px-4 py-1.5 text-xs font-semibold shadow-2xs cursor-pointer"
                    >
                      <LocateFixed className="w-3.5 h-3.5 text-[#8C6218]" />
                      <span>{lang === 'bn' ? 'লাইভ GPS' : 'Detect GPS'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveTab('mosques')}
                    className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 text-[#1C1B18] border border-[#E6E2D8] rounded-full px-4 py-1.5 text-xs font-semibold shadow-2xs cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#8C6218]" />
                    <span>{lang === 'bn' ? 'নিকটস্থ মসজিদ' : 'Nearby Mosques'}</span>
                  </button>
                </div>

                <p className="text-xs text-[#6E6A63] mb-6">
                  {heading === null
                    ? 'Open this page on your phone for a live compass, or use the angle above.'
                    : 'Hold phone flat. The arrow turns green and buzzes when aligned with the Kaaba.'}
                </p>

                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="bg-white rounded-xl border border-[#E6E2D8] p-4 sm:p-5">
                    <div className="text-xs text-[#6E6A63] mb-1">Qibla direction</div>
                    <div className="text-2xl font-bold text-[#1C1B18] font-mono-tabular">
                      {bearing}°
                    </div>
                    <div className="text-[11px] text-[#6E6A63] mt-0.5">
                      {cardinal.en} · clockwise from true north
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-[#E6E2D8] p-4 sm:p-5">
                    <div className="text-xs text-[#6E6A63] mb-1">Distance to the Kaaba</div>
                    <div className="text-2xl font-bold text-[#1C1B18] font-mono-tabular">
                      {distanceKm.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-[#6E6A63] mt-0.5">
                      km · {distanceMi.toLocaleString()} mi
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        )}

        {/* TAB 2: LIVE NEARBY MOSQUES (OpenStreetMap Overpass + OpenFreeMap / Earth Satellite) */}
        {activeTab === 'mosques' && (
          <NearbyMosquesPanel
            lang={lang}
            city={city}
            onDetectGps={onDetectLocation}
            onOpenLocationModal={onOpenLocationModal}
          />
        )}

        {/* TAB 3: INTERACTIVE GOOGLE MAPS KAABA LINE */}
        {activeTab === 'kaaba-map' && (
          <div data-testid="qibla-google-map-view">
            <Suspense
              fallback={
                <div className="rounded-2xl border border-[#dce7e0] bg-[#f7faf8] h-[360px] animate-pulse" />
              }
            >
              <QiblaGoogleMap
              lang={lang}
              userLat={activeLat}
              userLng={activeLng}
              locationLabel={cityDisplay}
              bearing={bearing}
              cardinalLabel={cardinal[lang]}
              distanceKm={distanceKm}
              onSelectMapPoint={(lat, lng) => {
                setMapPinCoords({ lat, lng });
                const matched = PRESET_CITIES.find(
                  (c) => Math.abs(c.lat - lat) < 0.05 && Math.abs(c.lng - lng) < 0.05
                );
                if (matched) onSelectCity(matched);
              }}
              />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}
