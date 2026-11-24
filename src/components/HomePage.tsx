import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import {
  Bell,
  BellOff,
  BookOpen,
  BookmarkCheck,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Coins,
  Compass,
  Droplets,
  Image as ImageIcon,
  Languages,
  Loader2,
  LocateFixed,
  MapPin,
  Moon,
  Plane,
  RefreshCw,
  Repeat,
  ScrollText,
  Search,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  Sunrise,
  Sunset,
  Volume2,
  VolumeX,
  Wind,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { DAILY_CURATED_AYAHS } from '../data/dailyFeaturedData';
import type {
  CityLocation,
  Language,
  LastReadBookmark,
  LiveWeatherInfo,
  PrayerTimesResult,
  SectionId,
} from '../types/islamic';
import {
  PRAYER_METHOD_META,
  computeForbiddenPrayerTimes,
  formatUtcOffsetLabel,
  getLocationClock,
  getNextPrayerInfo,
  getUpcomingIslamicEvents,
  gregorianToHijri,
} from '../utils/islamicMath';
// three.js is ~600 kB and the globe sits below the fold, so it is fetched in
// its own chunk after first paint instead of blocking the landing page.
const EarthGlobe = lazy(() =>
  import('./EarthGlobe').then((m) => ({ default: m.EarthGlobe }))
);
import { VerseImageModal, type VerseImageTarget } from './VerseImageModal';

interface HomePageProps {
  lang: Language;
  city: CityLocation;
  liveGpsCity: CityLocation | null;
  weather: LiveWeatherInfo | null;
  detectingLocation: boolean;
  asrMethod: 'hanafi' | 'standard';
  prayerTimes: PrayerTimesResult;
  onSelectCity: (city: CityLocation) => void;
  onDetectLocation: () => void;
  onOpenLocationModal: () => void;
  onChangeAsrMethod: (method: 'hanafi' | 'standard') => void;
  onNavigate: (section: SectionId) => void;
  onOpenQuranVerse: (surahNumber: number, ayahNumber: number) => void;
  fullscreenTerrarium: boolean;
  onToggleFullscreenTerrarium: () => void;
  notificationsEnabled: boolean;
  onOpenNotifications: () => void;
  onSearchSubmit: (query: string) => void;
}

interface PrayerMeta {
  id: 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  bn: string;
  en: string;
  ar: string;
  time: string;
  minutes: number;
  trackable: boolean;
}

export function HomePage({
  lang,
  city,
  weather,
  detectingLocation,
  asrMethod,
  prayerTimes,
  onDetectLocation,
  onOpenLocationModal,
  onChangeAsrMethod,
  onNavigate,
  onOpenQuranVerse,
  fullscreenTerrarium,
  onToggleFullscreenTerrarium,
  notificationsEnabled,
  onOpenNotifications,
  onSearchSubmit,
}: HomePageProps) {
  const { user, profile, subscribePrayerLog, savePrayerLog } = useAuth();
  const { settings, use24Hour, isDateExcused, toggleTodayExcused } = useSettings();
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [quickQuery, setQuickQuery] = useState('');
  const clock = getLocationClock(nowMs, city.tzOffset, city.timeZoneId);
  const todayKey = clock.dateKey;
  const daySeed = Math.floor(clock.localDate.getTime() / (24 * 60 * 60 * 1000));
  const [featuredAyahIdx, setFeaturedAyahIdx] = useState<number>(
    () => Math.abs(daySeed) % DAILY_CURATED_AYAHS.length
  );
  const [reflectionIdx, setReflectionIdx] = useState<number>(
    () => Math.abs(daySeed + 3) % DAILY_CURATED_AYAHS.length
  );
  const [verseImageTarget, setVerseImageTarget] = useState<VerseImageTarget | null>(null);
  const [cloudTasbihTotal, setCloudTasbihTotal] = useState(0);

  const [prayedIds, setPrayedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(
        `il_prayed_${getLocationClock(Date.now(), city.tzOffset, city.timeZoneId).dateKey}`
      );
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [mutedPrayers, setMutedPrayers] = useState<string[]>([]);
  const [lastRead, setLastRead] = useState<LastReadBookmark>(() => {
    const fallback: LastReadBookmark = {
      surahNumber: 1,
      nameEn: 'Al-Fatihah',
      nameBn: 'আল-ফাতিহা',
      nameAr: 'الفاتحة',
      ayah: 1,
    };
    try {
      const raw = localStorage.getItem('il_last_read_quran');
      if (!raw) return fallback;
      const parsed = JSON.parse(raw) as Partial<LastReadBookmark>;
      if (typeof parsed.surahNumber === 'number' && typeof parsed.ayah === 'number') {
        return {
          surahNumber: parsed.surahNumber,
          nameEn: parsed.nameEn || `Surah ${parsed.surahNumber}`,
          nameBn: parsed.nameBn || `সূরা ${parsed.surahNumber}`,
          nameAr: parsed.nameAr,
          ayah: parsed.ayah,
          updatedAt: parsed.updatedAt,
        };
      }
      return fallback;
    } catch {
      return fallback;
    }
  });

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Sync last read bookmark from localStorage on mount and cross-tab updates
  useEffect(() => {
    const syncLastRead = () => {
      try {
        const raw = localStorage.getItem('il_last_read_quran');
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<LastReadBookmark>;
        if (typeof parsed.surahNumber === 'number' && typeof parsed.ayah === 'number') {
          setLastRead({
            surahNumber: parsed.surahNumber,
            nameEn: parsed.nameEn || `Surah ${parsed.surahNumber}`,
            nameBn: parsed.nameBn || `সূরা ${parsed.surahNumber}`,
            nameAr: parsed.nameAr,
            ayah: parsed.ayah,
            updatedAt: parsed.updatedAt,
          });
        }
      } catch {
        // ignore
      }
    };
    syncLastRead();
    window.addEventListener('storage', syncLastRead);
    return () => window.removeEventListener('storage', syncLastRead);
  }, []);

  // Hydrate prayer checklist & last-read bookmark from Firestore when signed in
  useEffect(() => {
    if (!user || !user.emailVerified) return;
    return subscribePrayerLog(todayKey, (cloudPrayed, tasbih) => {
      setCloudTasbihTotal(tasbih);
      if (cloudPrayed.length > 0) {
        setPrayedIds(cloudPrayed);
        try {
          localStorage.setItem(`il_prayed_${todayKey}`, JSON.stringify(cloudPrayed));
        } catch {
          // ignore
        }
      }
    });
  }, [user, todayKey, subscribePrayerLog]);

  useEffect(() => {
    if (profile?.lastReadSurah && profile?.lastReadAyah) {
      setLastRead({
        surahNumber: profile.lastReadSurah,
        nameEn: profile.lastReadNameEn || `Surah ${profile.lastReadSurah}`,
        nameBn: profile.lastReadNameBn || `সূরা ${profile.lastReadSurah}`,
        nameAr: profile.lastReadNameAr,
        ayah: profile.lastReadAyah,
      });
    }
  }, [profile]);

  // Live 1-second clock for exact HH:MM:SS location time & prayer countdown
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Auto-update bottom Daily Quran Reflection periodically while keeping Ayah of the day seeded by calendar day
  useEffect(() => {
    const id = window.setInterval(() => {
      setReflectionIdx((prev) => (prev + 1) % DAILY_CURATED_AYAHS.length);
    }, 45000);
    return () => window.clearInterval(id);
  }, []);

  const nowMinutesFloat = clock.nowMinutesFloat;
  const nowMinutes = clock.nowMinutes;
  const nextPrayer = getNextPrayerInfo(prayerTimes, nowMinutes);
  const hijriToday = gregorianToHijri(clock.localDate);
  const forbiddenWindows = computeForbiddenPrayerTimes(prayerTimes, nowMinutes);
  const upcomingEvents = getUpcomingIslamicEvents(clock.localDate, 2);
  const ayahOfDay =
    DAILY_CURATED_AYAHS[featuredAyahIdx % DAILY_CURATED_AYAHS.length] ?? DAILY_CURATED_AYAHS[0];
  const reflectionAyah =
    DAILY_CURATED_AYAHS[reflectionIdx % DAILY_CURATED_AYAHS.length] ?? DAILY_CURATED_AYAHS[0];
  const todayExcused = isDateExcused(todayKey);
  const methodMeta = PRAYER_METHOD_META[settings.prayerMethod] ?? PRAYER_METHOD_META.karachi;

  const prayerList: PrayerMeta[] = [
    {
      id: 'fajr',
      bn: 'ফজর',
      en: 'Fajr',
      ar: 'الفجر',
      time: prayerTimes.fajr,
      minutes: prayerTimes.minutesMap.fajr,
      trackable: true,
    },
    {
      id: 'sunrise',
      bn: 'সূর্যোদয়',
      en: 'Sunrise',
      ar: 'الشروق',
      time: prayerTimes.sunrise,
      minutes: prayerTimes.minutesMap.sunrise,
      trackable: false,
    },
    {
      id: 'dhuhr',
      bn: 'যোহর',
      en: 'Dhuhr',
      ar: 'الظهر',
      time: prayerTimes.dhuhr,
      minutes: prayerTimes.minutesMap.dhuhr,
      trackable: true,
    },
    {
      id: 'asr',
      bn: 'আসর',
      en: 'Asr',
      ar: 'العصر',
      time: prayerTimes.asr,
      minutes: prayerTimes.minutesMap.asr,
      trackable: true,
    },
    {
      id: 'maghrib',
      bn: 'মাগরিব',
      en: 'Maghrib',
      ar: 'المغرب',
      time: prayerTimes.maghrib,
      minutes: prayerTimes.minutesMap.maghrib,
      trackable: true,
    },
    {
      id: 'isha',
      bn: 'এশা',
      en: 'Isha',
      ar: 'العشاء',
      time: prayerTimes.isha,
      minutes: prayerTimes.minutesMap.isha,
      trackable: true,
    },
  ];

  // Exact HH:MM:SS countdown
  const nextMeta = prayerList.find((p) => p.id === nextPrayer.id) ?? prayerList[0];
  let diffSeconds = Math.round((nextMeta.minutes - nowMinutesFloat) * 60);
  if (diffSeconds < 0) diffSeconds += 24 * 3600;
  const cdHours = String(Math.floor(diffSeconds / 3600)).padStart(2, '0');
  const cdMins = String(Math.floor((diffSeconds % 3600) / 60)).padStart(2, '0');
  const cdSecs = String(diffSeconds % 60).padStart(2, '0');

  // Determine current active prayer window
  const nextIdx = prayerList.findIndex((p) => p.id === nextMeta.id);
  const prevIdx = (nextIdx - 1 + prayerList.length) % prayerList.length;
  const prevMeta = prayerList[prevIdx];

  // Dynamic Day & Night Sky Theme based on Sunrise, Maghrib, Fajr & Live Weather
  const sunriseMin = prayerTimes.minutesMap.sunrise;
  const dhuhrMin = prayerTimes.minutesMap.dhuhr;
  const asrMin = prayerTimes.minutesMap.asr;
  const maghribMin = prayerTimes.minutesMap.maghrib;
  const fajrMin = prayerTimes.minutesMap.fajr;
  const ishaMin = prayerTimes.minutesMap.isha;

  const isDawnTwilight = nowMinutesFloat >= fajrMin - 20 && nowMinutesFloat < sunriseMin + 35;
  const isSunsetTwilight =
    nowMinutesFloat >= maghribMin - 25 && nowMinutesFloat < maghribMin + 40;
  const isDaySolarArc = nowMinutesFloat >= sunriseMin && nowMinutesFloat <= maghribMin;
  const isCloudyOrRainy =
    weather?.iconKind === 'cloudy' ||
    weather?.iconKind === 'fog' ||
    weather?.iconKind === 'rain' ||
    weather?.iconKind === 'snow' ||
    weather?.iconKind === 'storm';

  const skyTheme = (() => {
    if (isDawnTwilight) {
      return {
        mode: 'dawn' as const,
        showStars: true,
        backgroundImage:
          'linear-gradient(155deg, #16244f 0%, #523b73 50%, #c86d4d 100%)',
        backgroundColor: '#1f2b5a',
      };
    }
    if (isSunsetTwilight) {
      return {
        mode: 'sunset' as const,
        showStars: true,
        backgroundImage:
          'linear-gradient(155deg, #1b2452 0%, #6d3a5e 48%, #d97a45 100%)',
        backgroundColor: '#2b2855',
      };
    }
    if (nowMinutesFloat >= sunriseMin + 35 && nowMinutesFloat < maghribMin - 25) {
      if (isCloudyOrRainy) {
        return {
          mode: 'day-cloudy' as const,
          showStars: false,
          backgroundImage:
            'linear-gradient(155deg, #354b63 0%, #4b6580 52%, #68829b 100%)',
          backgroundColor: '#455e78',
        };
      }
      return {
        mode: 'day-clear' as const,
        showStars: false,
        backgroundImage:
          'radial-gradient(circle at 82% 18%, rgba(255, 245, 200, 0.28) 0%, transparent 44%), linear-gradient(155deg, #0d4f9c 0%, #176ec4 52%, #3194e3 100%)',
        backgroundColor: '#1567ba',
      };
    }
    return {
      mode: 'night' as const,
      showStars: true,
      backgroundImage:
        'radial-gradient(1px 1px at 14% 22%, rgba(255, 255, 255, 0.48) 100%, transparent), radial-gradient(1.2px 1.2px at 36% 18%, rgba(255, 255, 255, 0.36) 100%, transparent), radial-gradient(1px 1px at 58% 34%, rgba(255, 255, 255, 0.42) 100%, transparent), radial-gradient(1.3px 1.3px at 78% 24%, rgba(212, 168, 79, 0.6) 100%, transparent), radial-gradient(1px 1px at 88% 58%, rgba(255, 255, 255, 0.38) 100%, transparent), radial-gradient(1px 1px at 26% 68%, rgba(255, 255, 255, 0.32) 100%, transparent), linear-gradient(155deg, #0a1536 0%, #112252 54%, #1a3370 100%)',
      backgroundColor: '#0f1f4a',
    };
  })();

  // Quadratic Bezier point helper for arc M 36 88 Q 180 4 324 88
  const bezierPoint = (u: number) => {
    const cu = Math.max(0, Math.min(1, u));
    const mu = 1 - cu;
    return {
      x: mu * mu * 36 + 2 * mu * cu * 180 + cu * cu * 324,
      y: mu * mu * 88 + 2 * mu * cu * 4 + cu * cu * 88,
    };
  };

  const buildBezierSegmentPath = (uStart: number, uEnd: number, steps = 28) => {
    const a = Math.max(0, Math.min(1, uStart));
    const b = Math.max(a, Math.min(1, uEnd));
    const pts: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const u = a + ((b - a) * i) / steps;
      const p = bezierPoint(u);
      pts.push(`${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`);
    }
    return pts.join(' ');
  };

  let arcProgress = 0.5;
  let arcLeftLabel = `${lang === 'bn' ? 'সূর্যোদয়' : 'Sunrise'} · ${prayerTimes.sunrise}`;
  let arcRightLabel = `${lang === 'bn' ? 'মাগরিব' : 'Maghrib'} · ${prayerTimes.maghrib}`;
  let markerOne = { u: 0.5, label: lang === 'bn' ? 'যোহর' : 'Dhuhr', time: prayerTimes.dhuhr };
  let markerTwo = { u: 0.78, label: lang === 'bn' ? 'আসর' : 'Asr', time: prayerTimes.asr };

  if (isDaySolarArc) {
    const daySpan = Math.max(60, maghribMin - sunriseMin);
    arcProgress = Math.max(0.02, Math.min(0.98, (nowMinutesFloat - sunriseMin) / daySpan));
    arcLeftLabel = `${lang === 'bn' ? 'সূর্যোদয়' : 'Sunrise'} · ${prayerTimes.sunrise}`;
    arcRightLabel = `${lang === 'bn' ? 'মাগরিব' : 'Maghrib'} · ${prayerTimes.maghrib}`;
    markerOne = {
      u: Math.max(0.32, Math.min(0.62, (dhuhrMin - sunriseMin) / daySpan)),
      label: lang === 'bn' ? 'যোহর' : 'Dhuhr',
      time: prayerTimes.dhuhr,
    };
    markerTwo = {
      u: Math.max(0.66, Math.min(0.92, (asrMin - sunriseMin) / daySpan)),
      label: lang === 'bn' ? 'আসর' : 'Asr',
      time: prayerTimes.asr,
    };
  } else {
    let nightSpan = fajrMin - maghribMin;
    if (nightSpan <= 0) nightSpan += 24 * 60;
    let elapsedNight = nowMinutesFloat - maghribMin;
    if (elapsedNight < 0) elapsedNight += 24 * 60;
    arcProgress = Math.max(0.02, Math.min(0.98, elapsedNight / nightSpan));
    arcLeftLabel = `${lang === 'bn' ? 'মাগরিব' : 'Maghrib'} · ${prayerTimes.maghrib}`;
    arcRightLabel = `${lang === 'bn' ? 'ফজর' : 'Fajr'} · ${prayerTimes.fajr}`;

    let ishaElapsed = ishaMin - maghribMin;
    if (ishaElapsed < 0) ishaElapsed += 24 * 60;
    markerOne = {
      u: Math.max(0.12, Math.min(0.35, ishaElapsed / nightSpan)),
      label: lang === 'bn' ? 'এশা' : 'Isha',
      time: prayerTimes.isha,
    };
    markerTwo = {
      u: 0.67,
      label: lang === 'bn' ? 'শেষ তৃতীয়াংশ' : 'Last third',
      time: '',
    };
  }

  const orbPos = bezierPoint(arcProgress);
  const markerOnePos = bezierPoint(markerOne.u);
  const markerTwoPos = bezierPoint(markerTwo.u);
  const passedArcPath = buildBezierSegmentPath(0, arcProgress);
  const remainingArcPath = buildBezierSegmentPath(arcProgress, 1);

  const togglePrayed = (id: string) => {
    setPrayedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(`il_prayed_${todayKey}`, JSON.stringify(next));
      } catch {
        // ignore
      }
      if (user && user.emailVerified) {
        void savePrayerLog(todayKey, next, cloudTasbihTotal);
      }
      return next;
    });
  };

  const playAdhanChime = (id: string) => {
    if (mutedPrayers.includes(id)) {
      setMutedPrayers((m) => m.filter((x) => x !== id));
      return;
    }
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
        const ctx = audioCtxRef.current;
        const freqs = [440, 554.37, 659.25];
        freqs.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          const startAt = ctx.currentTime + i * 0.12;
          gain.gain.setValueAtTime(0.06, startAt);
          gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.38);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startAt);
          osc.stop(startAt + 0.4);
        });
      }
    } catch {
      // ignore audio context failures
    }
  };

  const formattedGregorian = clock.localDate.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const renderPrayerIcon = (id: PrayerMeta['id']) => {
    if (id === 'fajr') return <Moon className="w-4 h-4" />;
    if (id === 'sunrise') return <Sunrise className="w-4 h-4" />;
    if (id === 'dhuhr' || id === 'asr') return <Sun className="w-4 h-4" />;
    if (id === 'maghrib') return <Sunset className="w-4 h-4" />;
    return <Moon className="w-4 h-4" />;
  };

  const renderWeatherIcon = (kind: LiveWeatherInfo['iconKind']) => {
    if (kind === 'clear-day') return <Sun className="w-5 h-5 text-[#f6d37b]" />;
    if (kind === 'clear-night') return <Moon className="w-5 h-5 text-[#d4e2ff]" />;
    if (kind === 'partly-cloudy') return <CloudSun className="w-5 h-5 text-[#f6d37b]" />;
    if (kind === 'cloudy') return <Cloud className="w-5 h-5 text-white/90" />;
    if (kind === 'fog') return <CloudFog className="w-5 h-5 text-white/85" />;
    if (kind === 'rain') return <CloudRain className="w-5 h-5 text-[#93c5fd]" />;
    if (kind === 'snow') return <Snowflake className="w-5 h-5 text-[#bae6fd]" />;
    return <CloudLightning className="w-5 h-5 text-[#fde68a]" />;
  };

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Top Location & Date Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="home-open-location-modal"
              onClick={onOpenLocationModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#ebe6da] hover:border-[#b58328] transition-colors cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-[#b58328] shrink-0" />
              <span className="font-display text-base sm:text-lg font-bold text-[#1f2421]">
                {lang === 'bn' ? city.name_bn : city.name_en}
              </span>
              {city.isLiveGps && (
                <span className="text-xs font-semibold text-[#087653]">
                  ({lang === 'bn' ? 'লাইভ GPS' : 'Live GPS'})
                </span>
              )}
              <ChevronDown className="w-4 h-4 text-[#6e7268]" />
            </button>

            <button
              type="button"
              data-testid="home-detect-gps-btn"
              onClick={onDetectLocation}
              disabled={detectingLocation}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#eef5f0] hover:bg-[#dce7e0] border border-[#087653]/25 text-xs font-semibold text-[#087653] transition-colors cursor-pointer disabled:opacity-60"
            >
              {detectingLocation ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LocateFixed className="w-3.5 h-3.5" />
              )}
              <span>
                {detectingLocation
                  ? lang === 'bn'
                    ? 'অবস্থান খুঁজছে...'
                    : 'Locating...'
                  : lang === 'bn'
                  ? 'লাইভ লোকেশন (GPS)'
                  : 'Use Live Location'}
              </span>
            </button>
          </div>

          <p className="text-sm text-[#6e7268] mt-1">
            {formattedGregorian} · {hijriToday.day}{' '}
            {lang === 'bn' ? hijriToday.monthNameBn : hijriToday.monthNameEn} {hijriToday.year}
            {lang === 'bn' ? ' হিজরি' : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="home-notifications-btn"
            onClick={onOpenNotifications}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
              notificationsEnabled
                ? 'bg-[#eef5f0] border-[#087653]/40 text-[#087653] hover:border-[#087653]'
                : 'bg-white border-[#ebe6da] text-[#1f2421] hover:border-[#b58328]'
            }`}
          >
            {notificationsEnabled ? (
              <Bell className="w-3.5 h-3.5 text-[#087653]" />
            ) : (
              <BellOff className="w-3.5 h-3.5 text-[#b58328]" />
            )}
            <span>
              {notificationsEnabled
                ? lang === 'bn'
                  ? 'রিমাইন্ডার চালু'
                  : 'Reminders On'
                : lang === 'bn'
                ? 'রিমাইন্ডার সেট করুন'
                : 'Daily Reminders'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('ai-studio')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#ebe6da] hover:border-[#b58328] text-xs font-semibold text-[#1f2421] transition-colors cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5 text-[#087653]" />
            <span>{lang === 'bn' ? 'এআই ও ক্লাউড স্টুডিও' : 'AI & Cloud Hub'}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('terrarium')}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#ebe6da] hover:border-[#b58328] text-xs font-semibold text-[#1f2421] transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#b58328]" />
            <span>{lang === 'bn' ? '৩ডি পৃথিবী গ্লোব' : '3D Earth Globe'}</span>
          </button>
        </div>
      </div>

      {/* Quick Global Search Bar (Quran, Hadiths, Duas) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearchSubmit(quickQuery.trim());
        }}
        className="bg-white rounded-2xl border border-[#ebe6da] p-2 sm:p-2.5 flex items-center gap-2 shadow-xs"
      >
        <Search className="w-4 h-4 text-[#6e7268] ml-2 shrink-0" />
        <input
          type="search"
          data-testid="home-search-input"
          value={quickQuery}
          onChange={(e) => setQuickQuery(e.target.value)}
          aria-label={
            lang === 'bn'
              ? 'কুরআন, হাদিস ও দোয়া খুঁজুন'
              : 'Search Quran verses, hadiths, and duas'
          }
          placeholder={
            lang === 'bn'
              ? 'কুরআনের আয়াত (যেমন 2:255), হাদিস বা দোয়া খুঁজুন...'
              : 'Search Quran verses (e.g. 2:255), Sahih Hadiths, or Duas...'
          }
          className="flex-1 min-w-0 bg-transparent px-2 py-1.5 text-sm text-[#1f2421] placeholder:text-[#8a8679] focus:outline-none"
        />
        <button
          type="submit"
          data-testid="home-search-submit"
          className="px-4 py-2 rounded-xl bg-[#087653] hover:bg-[#065c40] text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
        >
          {lang === 'bn' ? 'অনুসন্ধান' : 'Search'}
        </button>
      </form>

      {/* Primary 2-Column Hero Grid: Celestial Countdown (Left) + Prayer Checklist (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* Left: Dynamic Day / Twilight / Night Sky Card */}
        <div className="xl:col-span-7 flex flex-col">
          <div
            data-testid="home-dynamic-sky-card"
            data-sky-mode={skyTheme.mode}
            style={{
              backgroundColor: skyTheme.backgroundColor,
              backgroundImage: skyTheme.backgroundImage,
            }}
            className="relative overflow-hidden rounded-2xl p-6 sm:p-7 text-white flex-1 flex flex-col justify-between shadow-sm transition-all duration-700"
          >
            {/* Soft moonlight wash behind the card content */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-16 -right-16 w-72 h-72 rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(246,211,123,0.30) 0%, rgba(246,211,123,0.10) 45%, transparent 70%)',
              }}
            />

            {/* Card Header Row */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-white/90">
                <span className="font-medium">
                  {lang === 'bn' ? 'লাইভ সময়' : 'Live time'}
                </span>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  data-testid="sky-card-location-btn"
                  onClick={onOpenLocationModal}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/14 hover:bg-white/22 border border-white/20 text-xs font-semibold text-[#fef3c7] transition-colors cursor-pointer"
                >
                  <MapPin className="w-3 h-3" />
                  <span>
                    {lang === 'bn' ? city.name_bn : city.name_en}
                    {city.isLiveGps ? (lang === 'bn' ? ' (লাইভ GPS)' : ' (Live GPS)') : ''}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                </button>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/12 border border-white/15 text-xs text-white/95">
                <span>
                  {prevMeta[lang]} ·{' '}
                  {lang === 'bn' ? `চলবে ${nextMeta.time} পর্যন্ত` : `until ${nextMeta.time}`}
                </span>
              </div>
            </div>

            {/* Live Current Clock + Next Prayer Countdown + Live Weather Panel */}
            <div className="my-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <svg
                    data-testid="home-hero-crescent"
                    aria-hidden="true"
                    viewBox="0 0 100 100"
                    className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 drop-shadow-[0_0_14px_rgba(246,211,123,0.55)]"
                  >
                    <defs>
                      <linearGradient id="heroMoonBody" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#fff8e3" />
                        <stop offset="60%" stopColor="#f6d37b" />
                        <stop offset="100%" stopColor="#d4a84f" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M64 6a46 46 0 1 0 25 76A50 50 0 0 1 64 6Z"
                      fill="url(#heroMoonBody)"
                    />
                  </svg>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    {nextMeta[lang]}
                  </h1>
                  <span className="font-arabic text-2xl sm:text-3xl text-[#f6d37b]">
                    {nextMeta.ar}
                  </span>
                </div>

                <p
                  data-testid="home-live-local-clock"
                  className="font-mono-tabular text-4xl sm:text-5xl font-light tracking-tight text-white mt-1.5"
                >
                  {use24Hour ? clock.formattedTime24 : clock.formattedTime12}
                </p>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm font-medium text-white/90 mt-2 font-mono-tabular">
                  <span>
                    {lang === 'bn' ? `শুরু ${nextMeta.time}` : `Starts ${nextMeta.time}`}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span data-testid="live-prayer-countdown" className="text-[#fef08a] font-semibold">
                    {lang === 'bn' ? 'বাকি' : 'In'} {cdHours}:{cdMins}:{cdSecs}
                  </span>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={onOpenLocationModal}
                    className="inline-flex items-center gap-1 underline decoration-white/40 underline-offset-4 hover:text-[#fef08a] cursor-pointer"
                  >
                    <span>{lang === 'bn' ? city.country_bn : city.country_en}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Live Weather Telemetry Box */}
              <div
                data-testid="home-live-weather"
                className="rounded-xl bg-white/12 border border-white/20 px-4 py-3 sm:min-w-[200px] backdrop-blur-xs"
              >
                {weather ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {renderWeatherIcon(weather.iconKind)}
                        <span className="font-mono-tabular text-2xl font-bold text-white">
                          {weather.temperatureC}°C
                        </span>
                      </div>
                      <span className="text-xs font-medium text-[#fef08a]">
                        {lang === 'bn' ? weather.conditionBn : weather.conditionEn}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/85 font-mono-tabular pt-1 border-t border-white/15">
                      <span>
                        {lang === 'bn' ? 'অনুভূত' : 'Feels'} {weather.feelsLikeC}°
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-[#bae6fd]" />
                        {weather.humidity}%
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Wind className="w-3 h-3 text-white/85" />
                        {weather.windKmh} km/h
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-white/80 py-1">
                    <CloudSun className="w-4 h-4 text-[#fef08a]" />
                    <span>
                      {lang === 'bn'
                        ? `${city.name_bn}-এর লাইভ আবহাওয়া...`
                        : `Loading ${city.name_en} weather...`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* SVG Sun & Moon Celestial Arc Trajectory */}
            <div className="mt-2">
              <svg
                viewBox="0 0 360 116"
                className="w-full max-w-[460px] mx-auto overflow-visible"
                aria-hidden="true"
              >
                <defs>
                  <radialGradient id="celestialSunGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                    <stop offset="45%" stopColor="#fde68a" stopOpacity="0.65" />
                    <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="celestialMoonGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.95" />
                    <stop offset="50%" stopColor="#bfdbfe" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#93c5fd" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Horizon Baseline */}
                <line
                  x1="28"
                  y1="88"
                  x2="332"
                  y2="88"
                  stroke="rgba(255,255,255,0.22)"
                  strokeWidth="1.2"
                />

                {/* Remaining Ahead Path (Dashed) */}
                <path
                  d={remainingArcPath}
                  fill="none"
                  stroke="rgba(255,255,255,0.44)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                />

                {/* Passed Path Up to Orb (Solid Thick White Line) */}
                <path
                  d={passedArcPath}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="3.4"
                  strokeLinecap="round"
                />

                {/* Start & End Horizon Dots */}
                <circle cx="36" cy="88" r="3" fill="#ffffff" />
                <circle cx="324" cy="88" r="3" fill="rgba(255,255,255,0.55)" />

                {/* Marker 1 (Dhuhr / Isha) */}
                <circle
                  cx={markerOnePos.x}
                  cy={markerOnePos.y}
                  r="3.2"
                  fill={arcProgress >= markerOne.u ? '#ffffff' : 'rgba(255,255,255,0.7)'}
                />
                <text
                  x={markerOnePos.x}
                  y={markerOnePos.y - 9}
                  textAnchor="middle"
                  fontSize="9.5"
                  fill="rgba(255,255,255,0.92)"
                  fontWeight="600"
                >
                  {markerOne.label}
                </text>

                {/* Marker 2 (Asr / Last Third) */}
                <circle
                  cx={markerTwoPos.x}
                  cy={markerTwoPos.y}
                  r="3.2"
                  fill={arcProgress >= markerTwo.u ? '#ffffff' : 'rgba(255,255,255,0.7)'}
                />
                <text
                  x={markerTwoPos.x + 6}
                  y={markerTwoPos.y - 7}
                  textAnchor="start"
                  fontSize="9.5"
                  fill="rgba(255,255,255,0.88)"
                  fontWeight="600"
                >
                  {markerTwo.label}
                </text>

                {/* Active Sun or Crescent Moon Orb */}
                {isDaySolarArc ? (
                  <g>
                    <circle cx={orbPos.x} cy={orbPos.y} r="16" fill="url(#celestialSunGlow)" />
                    <circle
                      cx={orbPos.x}
                      cy={orbPos.y}
                      r="6.5"
                      fill="#fffbeb"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  </g>
                ) : (
                  <g>
                    <circle cx={orbPos.x} cy={orbPos.y} r="15" fill="url(#celestialMoonGlow)" />
                    <circle cx={orbPos.x} cy={orbPos.y} r="6.2" fill="#f8fafc" />
                    <circle
                      cx={orbPos.x + 2.7}
                      cy={orbPos.y - 1.8}
                      r="5.2"
                      fill={skyTheme.backgroundColor}
                    />
                  </g>
                )}

                {/* Left & Right Arc Endpoint Labels (Sunrise->Maghrib or Maghrib->Fajr) */}
                <text x="16" y="108" fontSize="10" fill="rgba(255,255,255,0.86)" fontWeight="500">
                  {arcLeftLabel}
                </text>
                <text
                  x="344"
                  y="108"
                  textAnchor="end"
                  fontSize="10"
                  fill="rgba(255,255,255,0.86)"
                  fontWeight="500"
                >
                  {arcRightLabel}
                </text>
              </svg>
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-[#6e7268]">
            <span>
              {lang === 'bn' ? methodMeta.labelBn : methodMeta.labelEn} ·{' '}
              {lang === 'bn'
                ? asrMethod === 'hanafi'
                  ? 'হানাফি'
                  : 'শাফিঈ'
                : asrMethod === 'hanafi'
                ? 'Hanafi'
                : 'Standard'}{' '}
              · {formatUtcOffsetLabel(clock.effectiveTzOffset)}
            </span>
            <button
              type="button"
              onClick={() => onChangeAsrMethod(asrMethod === 'hanafi' ? 'standard' : 'hanafi')}
              className="text-[#8f6319] hover:underline font-medium cursor-pointer"
            >
              {lang === 'bn'
                ? asrMethod === 'hanafi'
                  ? 'শাফিঈ আসর দেখুন'
                  : 'হানাফি আসর দেখুন'
                : asrMethod === 'hanafi'
                ? 'Switch to Standard Asr'
                : 'Switch to Hanafi Asr'}
            </button>
          </div>
        </div>

        {/* Right: Clean White Prayer Times Schedule + Trackable Prayer Icons */}
        <div className="xl:col-span-5 flex flex-col">
          <div className="bg-white rounded-2xl border border-[#ebe6da] divide-y divide-[#f2eee4] overflow-hidden flex-1 flex flex-col justify-between">
            {prayerList.map((p) => {
              const isHighlighted = prevMeta.id === p.id;
              const isPrayed = prayedIds.includes(p.id);
              const isMuted = mutedPrayers.includes(p.id);

              return (
                <div
                  key={p.id}
                  className={`px-4 py-3.5 flex items-center justify-between gap-3 transition-colors ${
                    isHighlighted ? 'bg-[#f6efe0]' : 'bg-white hover:bg-[#fcfaf5]'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <button
                      type="button"
                      disabled={!p.trackable}
                      onClick={() => p.trackable && togglePrayed(p.id)}
                      aria-label={
                        p.trackable
                          ? lang === 'bn'
                            ? `${p.bn} আদায় হয়েছে চিহ্নিত করুন`
                            : `Mark ${p.en} as prayed`
                          : p[lang]
                      }
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        !p.trackable
                          ? 'bg-[#f4f1e8] text-[#9b9687] cursor-default'
                          : isPrayed
                          ? 'bg-[#0f5c43] text-white cursor-pointer'
                          : isHighlighted
                          ? 'bg-[#b58328] text-white cursor-pointer'
                          : 'bg-[#f4f1e8] text-[#7a7669] hover:bg-[#ebe3cf] cursor-pointer'
                      }`}
                    >
                      {isPrayed ? <Check className="w-4 h-4" /> : renderPrayerIcon(p.id)}
                    </button>

                    <div className="min-w-0">
                      <p
                        className={`text-sm font-semibold truncate ${
                          isHighlighted ? 'text-[#1f2421]' : 'text-[#2b302a]'
                        }`}
                      >
                        {p[lang]}
                      </p>
                      <p className="font-arabic text-xs text-[#8a8679] leading-none mt-0.5">
                        {p.ar}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`font-mono-tabular text-sm ${
                        isHighlighted
                          ? 'font-bold text-[#1f2421]'
                          : 'font-medium text-[#3c413b]'
                      }`}
                    >
                      {p.time}
                    </span>

                    {p.trackable ? (
                      <button
                        type="button"
                        onClick={() => playAdhanChime(p.id)}
                        aria-label={
                          lang === 'bn' ? `${p.bn} আযান শব্দ` : `Play ${p.en} chime`
                        }
                        className="w-8 h-8 rounded-full bg-[#faf6eb] hover:bg-[#efe4c9] text-[#b58328] flex items-center justify-center transition-colors cursor-pointer"
                      >
                        {isMuted ? (
                          <VolumeX className="w-3.5 h-3.5" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    ) : (
                      <div className="w-8 h-8" aria-hidden="true" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-2.5 px-1 flex flex-wrap items-center justify-between gap-2 text-xs text-[#6e7268]">
            <p className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[#8f6319]" />
              <span>
                {todayExcused
                  ? lang === 'bn'
                    ? 'আজ মওকুফ দিন (হায়েয/নিফাস) হিসেবে চিহ্নিত — সালাত আদায়ের দায়িত্ব মওকুফ রয়েছে।'
                    : 'Marked as excused day (ḥayḍ / nifās) — daily prayers are excused with peace of mind.'
                  : lang === 'bn'
                  ? 'নামাজ আদায়ের পর বাম পাশের আইকনে ট্যাপ করে হিসাব রাখুন।'
                  : "Tap a prayer's icon once you've prayed it to keep track."}
              </span>
            </p>
            {settings.sistersExcusedFeature && (
              <button
                type="button"
                data-testid="home-excused-day-toggle"
                onClick={() => toggleTodayExcused(todayKey)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                  todayExcused
                    ? 'bg-[#9d174d] text-white border-[#9d174d]'
                    : 'bg-[#fdf2f8] text-[#9d174d] border-[#fbcfe8] hover:bg-[#fce7f3]'
                }`}
              >
                {todayExcused
                  ? lang === 'bn'
                    ? 'মওকুফ দিন চালু ✓'
                    : 'Excused today ✓'
                  : lang === 'bn'
                  ? 'মওকুফ দিন (বোনেরা)'
                  : 'Excused day'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Last Read Bookmark / Continue Reading Bar */}
      <button
        type="button"
        data-testid="home-last-read-card"
        onClick={() => onNavigate('quran')}
        className="w-full bg-white rounded-2xl border border-[#ebe6da] hover:border-[#b58328] px-5 py-4 flex items-center justify-between gap-4 text-left transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#f5efe0] text-[#b58328] flex items-center justify-center shrink-0">
            <BookmarkCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-[#6e7268] flex items-center gap-1.5">
              <span>{lang === 'bn' ? 'সর্বশেষ পাঠ · পড়া চালিয়ে যান' : 'Last Read · Continue reading'}</span>
              <span className="font-mono-tabular text-[11px] font-semibold text-[#087653]">
                {lastRead.surahNumber}:{lastRead.ayah}
              </span>
            </p>
            <p className="text-sm sm:text-base font-bold text-[#1f2421] truncate flex items-center gap-2 mt-0.5">
              <span className="truncate">
                {lang === 'bn' ? lastRead.nameBn : lastRead.nameEn} ·{' '}
                {lang === 'bn' ? `আয়াত ${lastRead.ayah}` : `Ayah ${lastRead.ayah}`}
              </span>
              {lastRead.nameAr && (
                <span className="font-arabic text-base font-normal text-[#087653] shrink-0">
                  {lastRead.nameAr}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#faf7f0] border border-[#ebe6da] text-xs font-semibold text-[#087653]">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'খুলুন' : 'Resume'}</span>
          </span>
          <ChevronRight className="w-5 h-5 text-[#6e7268]" />
        </div>
      </button>

      {/* Ayah of the Day Card */}
      <section
        data-testid="home-ayah-of-day-card"
        className="bg-white rounded-2xl border border-[#ebe6da] p-5 sm:p-7 space-y-5 shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#8d671b]">
            <Sparkles className="w-4 h-4 text-[#b58328]" />
            <span>{lang === 'bn' ? 'আজকের আয়াত (Ayah of the day)' : 'Ayah of the day'}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#6e7268]">
              {lang === 'bn'
                ? `${ayahOfDay.surahNameBn} ${ayahOfDay.surahNumber}:${ayahOfDay.ayahNumber}`
                : `${ayahOfDay.surahNameEn} ${ayahOfDay.surahNumber}:${ayahOfDay.ayahNumber}`}
            </span>
            <button
              type="button"
              onClick={() => setFeaturedAyahIdx((i) => (i + 1) % DAILY_CURATED_AYAHS.length)}
              aria-label={lang === 'bn' ? 'অন্য আয়াত দেখুন' : 'Next featured ayah'}
              className="p-1.5 rounded-lg bg-[#faf7f0] hover:bg-[#efe6d2] text-[#8d671b] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <p
          dir="rtl"
          className="font-arabic text-2xl sm:text-3xl text-[#1f2421] text-center leading-loose px-2"
        >
          {ayahOfDay.arabic}
        </p>

        <p className="text-sm sm:text-base text-[#4c5450] text-center max-w-3xl mx-auto leading-relaxed">
          {lang === 'bn' ? ayahOfDay.translationBn : ayahOfDay.translationEn}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            data-testid="ayah-of-day-read-btn"
            onClick={() => onOpenQuranVerse(ayahOfDay.surahNumber, ayahOfDay.ayahNumber)}
            className="py-3 px-4 rounded-xl bg-[#f3ede0] hover:bg-[#eae1ce] text-[#1f2421] text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-[#8d671b]" />
            <span>{lang === 'bn' ? 'প্রেক্ষাপটে পড়ুন (কুরআন)' : 'Read in context'}</span>
          </button>

          <button
            type="button"
            data-testid="ayah-of-day-make-image-btn"
            onClick={() =>
              setVerseImageTarget({
                surahNumber: ayahOfDay.surahNumber,
                ayahNumber: ayahOfDay.ayahNumber,
                surahNameEn: ayahOfDay.surahNameEn,
                surahNameBn: ayahOfDay.surahNameBn,
                surahNameAr: ayahOfDay.surahNameAr,
                initialArabic: ayahOfDay.arabic,
                initialTranslationEn: ayahOfDay.translationEn,
                initialTranslationBn: ayahOfDay.translationBn,
              })
            }
            className="py-3 px-4 rounded-xl bg-[#8d671b] hover:bg-[#755413] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ImageIcon className="w-4 h-4" />
            <span>{lang === 'bn' ? 'আয়াত কার্ড বানান ✨' : 'Make image ✨'}</span>
          </button>
        </div>
      </section>

      {/* Two-Column Row: Forbidden Prayer Times + Coming Up Islamic Dates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Left: Forbidden Prayer Times */}
        <section
          data-testid="home-forbidden-times-card"
          className="bg-white rounded-2xl border border-[#ebe6da] p-5 sm:p-6 flex flex-col justify-between space-y-4"
        >
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-[#1f2421]">
                {lang === 'bn' ? 'নামাজের নিষিদ্ধ সময়' : 'Forbidden prayer times'}
              </h2>
              <p className="text-xs text-[#6e7268] mt-0.5">
                {lang === 'bn'
                  ? 'এই সময়গুলোতে নফল নামাজ পড়া মাকরূহ/নিষিদ্ধ'
                  : 'When voluntary prayer is not offered'}
              </p>
            </div>

            <div className="space-y-3">
              {forbiddenWindows.map((win) => {
                const highlight = win.isActiveNow || win.isNextUpcoming;
                return (
                  <div
                    key={win.id}
                    className={`flex items-center justify-between gap-3 text-sm ${
                      highlight ? 'text-[#1f2421] font-semibold' : 'text-[#8a8d86]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {win.id === 'sunrise' ? (
                        <Sunrise className="w-4 h-4 shrink-0" />
                      ) : win.id === 'zawal' ? (
                        <Sun className="w-4 h-4 shrink-0" />
                      ) : (
                        <Sunset className="w-4 h-4 shrink-0" />
                      )}
                      <span>{lang === 'bn' ? win.labelBn : win.labelEn}</span>
                    </div>
                    <span className="font-mono-tabular">{win.rangeText}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[#f2eee4] space-y-1.5 text-xs text-[#6e7268] leading-relaxed">
            <p>
              {lang === 'bn'
                ? 'এই সময়গুলো নফল নামাজের জন্য নিষিদ্ধ। এছাড়া ফজরের পর সূর্যোদয় পর্যন্ত এবং আসরের পর সূর্যাস্ত পর্যন্ত নফল নামাজ পড়া থেকে বিরত থাকুন।'
                : 'These apply to voluntary (nafl) prayers. Also avoid voluntary prayer after praying Fajr until sunrise, and after praying Asr until sunset. Schools differ on making up missed obligatory prayers at these times.'}
            </p>
            <p className="text-[11px] font-medium text-[#7a7d75]">
              {lang === 'bn' ? 'সহিহ মুসলিম ৮৩১ · সহিহ বুখারী ৫৮৬' : 'Muslim 831 · Bukhārī 586'}
            </p>
          </div>
        </section>

        {/* Right: Coming Up Islamic Dates */}
        <section
          data-testid="home-coming-up-card"
          className="bg-white rounded-2xl border border-[#ebe6da] p-5 sm:p-6 flex flex-col justify-between"
        >
          <div>
            <h2 className="font-display text-base sm:text-lg font-bold text-[#1f2421] mb-3">
              {lang === 'bn' ? 'আসন্ন ইসলামিক দিনসমূহ' : 'Coming up'}
            </h2>

            <div className="divide-y divide-[#f2eee4]">
              {upcomingEvents.map((ev) => {
                const dateFmt = ev.gregorianDate.toLocaleDateString(
                  lang === 'bn' ? 'bn-BD' : 'en-US',
                  { weekday: 'short', month: 'short', day: 'numeric' }
                );
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => onNavigate('calendar')}
                    className="w-full py-3.5 flex items-center justify-between gap-3 text-left hover:bg-[#fcfaf5] rounded-xl px-2 -mx-2 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#f3ede0] text-[#8d671b] flex items-center justify-center shrink-0">
                        <Star className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#1f2421] truncate">
                          {lang === 'bn' ? ev.titleBn : ev.titleEn}
                        </p>
                        <p className="text-xs text-[#6e7268] mt-0.5">
                          {ev.daysRemaining === 0
                            ? lang === 'bn'
                              ? `আজ · ${dateFmt}`
                              : `Today · ${dateFmt}`
                            : lang === 'bn'
                            ? `${ev.daysRemaining} দিন বাকি · ${dateFmt}`
                            : `in ${ev.daysRemaining} days · ${dateFmt}`}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#6e7268] shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('calendar')}
            className="mt-3 pt-3 border-t border-[#f2eee4] text-xs font-semibold text-[#087653] hover:underline flex items-center justify-between w-full cursor-pointer"
          >
            <span>{lang === 'bn' ? 'সম্পূর্ণ হিজরি ক্যালেন্ডার দেখুন' : 'View full Hijri calendar'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </section>
      </div>

      {/* Quick Utility Cards Row (9 balanced cards in 3 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {[
          {
            id: 'arabic-learning' as SectionId,
            icon: Languages,
            bn: 'আরবি হরফ, মাখরাজ ও কথা',
            en: 'Arabic Letters & Spoken',
            sub_bn: '২৯ হরফ, ১৭ মাখরাজ ও কথোপকথন',
            sub_en: 'Alphabet, 17 Makharij & dialogues',
          },
          {
            id: 'qibla' as SectionId,
            icon: Compass,
            bn: 'কিবলা ও নিকটস্থ মসজিদ',
            en: 'Qibla & Nearby Mosques',
            sub_bn: 'লাইভ কম্পাস ও মসজিদ ম্যাপ',
            sub_en: '2D Compass & OpenFreeMap',
          },
          {
            id: 'tafsir' as SectionId,
            icon: ScrollText,
            bn: 'বিস্তারিত তাফসির হাব',
            en: 'Tafsir Hub',
            sub_bn: 'আরবি, বাংলা ও ইংরেজি',
            sub_en: '17 Scholar Editions',
          },
          {
            id: 'namaz' as SectionId,
            icon: Clock,
            bn: 'নামাজ ও পবিত্রতা',
            en: 'Namaz & Purification',
            sub_bn: 'নিয়ত, অজু, গোসল ও তায়াম্মুম',
            sub_en: '5 prayers & rules',
          },
          {
            id: 'hajj-umrah' as SectionId,
            icon: Plane,
            bn: 'হজ ও উমরাহ গাইড',
            en: 'Hajj & Umrah',
            sub_bn: 'তাওয়াফ, সায়ী ও তালবিয়া',
            sub_en: 'Step-by-step guide',
          },
          {
            id: 'names-99' as SectionId,
            icon: Star,
            bn: 'আল্লাহর ৯৯টি নাম',
            en: '99 Names of Allah',
            sub_bn: 'আরবি, উচ্চারণ ও অর্থ',
            sub_en: 'Asma ul-Husna',
          },
          {
            id: 'tasbih' as SectionId,
            icon: Repeat,
            bn: 'ডিজিটাল তাসবিহ',
            en: 'Digital Tasbih',
            sub_bn: 'যিকির ও ৩৩/৯৯ গণনা',
            sub_en: 'Dhikr counter',
          },
          {
            id: 'ramadan' as SectionId,
            icon: Moon,
            bn: 'রমজান ও সেহরি-ইফতার',
            en: 'Ramadan & Sehri',
            sub_bn: 'সময়সূচি ও রোজার নিয়ত',
            sub_en: 'Timetable & Niyyah',
          },
          {
            id: 'zakat' as SectionId,
            icon: Coins,
            bn: 'যাকাত ক্যালকুলেটর',
            en: 'Zakat Calculator',
            sub_bn: 'নিসাব ও ২.৫% হিসাব',
            sub_en: '2.5% calculation',
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onNavigate(card.id)}
              className="bg-white rounded-2xl border border-[#ebe6da] hover:border-[#b58328] p-4 text-left transition-colors cursor-pointer flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-[#f5efe0] text-[#b58328] flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1f2421] truncate">{card[lang]}</p>
                <p className="text-xs text-[#6e7268] truncate">
                  {lang === 'bn' ? card.sub_bn : card.sub_en}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Earth globe section */}
      <section className="bg-white rounded-2xl border border-[#ebe6da] p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#1f2421]">
              {lang === 'bn' ? 'পৃথিবী — ইন্টারেক্টিভ ৩ডি গ্লোব' : 'Earth — Interactive 3D Globe'}
            </h2>
            <p className="text-xs sm:text-sm text-[#6e7268]">
              {lang === 'bn'
                ? 'মহাকাশ থেকে পৃথিবী দেখুন, ড্র্যাগ করে ঘোরান এবং আপনার শহরের অবস্থান খুঁজে নিন।'
                : 'View the planet from orbit, drag to spin it, and locate your city on the globe.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('qibla')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#dce7e0] text-xs font-semibold text-[#087653] hover:bg-[#eef5f0] cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            {lang === 'bn' ? 'কিবলা কম্পাস' : 'Qibla compass'}
          </button>
        </div>

        <Suspense
          fallback={
            <div className="rounded-2xl border border-[#dce7e0] bg-[#f7faf8] h-[420px] animate-pulse" />
          }
        >
          <EarthGlobe
            lang={lang}
            city={city}
            fullscreen={fullscreenTerrarium}
            onToggleFullscreen={onToggleFullscreenTerrarium}
          />
        </Suspense>
      </section>

      {/* Auto-Updating Daily Quran Reflection */}
      <section
        data-testid="home-auto-quran-reflection"
        className="bg-[#0f3d2e] text-white rounded-2xl p-6 sm:p-8 text-center space-y-3"
      >
        <div className="flex items-center justify-between gap-2 text-xs text-white/75">
          <span className="inline-flex items-center gap-1.5 font-medium text-[#d4a84f]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {lang === 'bn'
                ? 'দৈনিক কুরআন প্রতিফলন (স্বয়ংক্রিয়ভাবে আপডেট হয়)'
                : 'Daily Quran Reflection (Auto-updated)'}
            </span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenQuranVerse(reflectionAyah.surahNumber, reflectionAyah.ayahNumber)}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold cursor-pointer"
            >
              {lang === 'bn' ? 'কুরআনে পড়ুন' : 'Open in Quran'}
            </button>
            <button
              type="button"
              onClick={() =>
                setReflectionIdx((prev) => (prev + 1) % DAILY_CURATED_AYAHS.length)
              }
              aria-label={lang === 'bn' ? 'পরবর্তী প্রতিফলন' : 'Next reflection'}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#d4a84f] cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <p dir="rtl" className="font-arabic text-2xl sm:text-3xl text-[#d4a84f] leading-loose">
          {reflectionAyah.arabic}
        </p>
        <p className="text-base sm:text-lg font-medium max-w-2xl mx-auto leading-relaxed">
          {lang === 'bn' ? reflectionAyah.translationBn : reflectionAyah.translationEn}
        </p>
        <p className="text-xs text-white/75">
          {lang === 'bn'
            ? `${reflectionAyah.surahNameBn}, ${reflectionAyah.surahNumber}:${reflectionAyah.ayahNumber}`
            : `${reflectionAyah.surahNameEn}, ${reflectionAyah.surahNumber}:${reflectionAyah.ayahNumber}`}
        </p>
      </section>

      <VerseImageModal
        open={Boolean(verseImageTarget)}
        lang={lang}
        target={verseImageTarget}
        onClose={() => setVerseImageTarget(null)}
      />
    </div>
  );
}
