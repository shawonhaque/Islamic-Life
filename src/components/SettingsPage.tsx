import { useRef, useState } from 'react';
import {
  Activity,
  Bell,
  BookHeart,
  CalendarDays,
  Check,
  ChevronRight,
  Code2,
  Coins,
  Compass,
  Copy,
  Download,
  FileText,
  Globe,
  HeartHandshake,
  Info,
  Languages,
  Loader2,
  LocateFixed,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Moon,
  Palette,
  Plus,
  RefreshCw,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Sun,
  UserCheck,
  Users,
  Volume2,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  ACCENT_PALETTES,
  ADHAN_VOICES,
  useSettings,
} from '../contexts/SettingsContext';
import type {
  AccentColorId,
  AdhanVoiceId,
  CityLocation,
  Language,
  LanguagePref,
  PrayerMethodId,
  PrayerTimesResult,
  SectionId,
  ThemePref,
  TimeFormatPref,
} from '../types/islamic';
import {
  PRAYER_METHOD_META,
  PRESET_CITIES,
  getLocationClock,
} from '../utils/islamicMath';
import { safeReadJson } from '../utils/safeFetch';

interface SettingsPageProps {
  lang: Language;
  city: CityLocation;
  liveGpsCity: CityLocation | null;
  detectingLocation: boolean;
  prayerTimes: PrayerTimesResult;
  onSelectCity: (city: CityLocation) => void;
  onDetectLocation: () => void;
  onOpenNotifications: () => void;
  onNavigate: (section: SectionId) => void;
}

type SettingsModalType =
  | null
  | 'family'
  | 'location'
  | 'method'
  | 'adhan'
  | 'timeFormat'
  | 'language'
  | 'theme'
  | 'color'
  | 'sisters'
  | 'widget'
  | 'feedback'
  | 'credits'
  | 'privacy'
  | 'diagnostics';

export function SettingsPage({
  lang,
  city,
  liveGpsCity,
  detectingLocation,
  prayerTimes,
  onSelectCity,
  onDetectLocation,
  onOpenNotifications,
  onNavigate,
}: SettingsPageProps) {
  const { user, authBusy, signInWithGoogle, signOutUser, syncPreferences } = useAuth();
  const {
    settings,
    use24Hour,
    familyGoals,
    updateSettings,
    setLanguagePref,
    setPrayerMethod,
    setAdhanVoice,
    setTimeFormat,
    setTheme,
    setAccentColor,
    toggleTodayExcused,
    isDateExcused,
    updateFamilyGoals,
    incrementFamilyDhikr,
    incrementFamilyJuz,
    addFamilyMember,
    resetAllSettings,
  } = useSettings();

  const [modal, setModal] = useState<SettingsModalType>(null);
  const [syncNotice, setSyncNotice] = useState<string>('');
  const [newMemberName, setNewMemberName] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Feedback form state
  const [fbName, setFbName] = useState('');
  const [fbEmail, setFbEmail] = useState('');
  const [fbTopic, setFbTopic] = useState('Suggestion');
  const [fbMessage, setFbMessage] = useState('');
  const [fbBusy, setFbBusy] = useState(false);
  const [fbStatus, setFbStatus] = useState<{ ok: boolean; text: string } | null>(null);

  // Diagnostics state
  const [diagRunning, setDiagRunning] = useState(false);
  const [diagResults, setDiagResults] = useState<
    Array<{ label: string; status: 'ok' | 'warn' | 'err'; detail: string }>
  >([]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const todayKey = getLocationClock(Date.now(), city.tzOffset).dateKey;
  const todayExcused = isDateExcused(todayKey);

  const cityOptions = liveGpsCity
    ? [liveGpsCity, ...PRESET_CITIES.filter((c) => c.id !== liveGpsCity.id)]
    : PRESET_CITIES;

  const activeMethodMeta = PRAYER_METHOD_META[settings.prayerMethod];
  const activeVoiceMeta =
    ADHAN_VOICES.find((v) => v.id === settings.adhanVoice) ?? ADHAN_VOICES[0];
  const activePalette = ACCENT_PALETTES[settings.accentColor] ?? ACCENT_PALETTES.gold;

  const copyText = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((c) => (c === key ? null : c)), 1800);
    } catch {
      // ignore clipboard error
    }
  };

  const playAdhanPreview = (voiceId: AdhanVoiceId) => {
    try {
      const voice = ADHAN_VOICES.find((v) => v.id === voiceId) ?? ADHAN_VOICES[0];
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      [0, 0.28, 0.56].forEach((offset, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = voice.baseFreq * (idx === 1 ? 1.189 : idx === 2 ? 1.335 : 1);
        gain.gain.setValueAtTime(0.06, ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.36);
      });
    } catch {
      // ignore
    }
  };

  const handleManualSync = async () => {
    if (user && user.emailVerified) {
      await syncPreferences(lang, city.id);
      setSyncNotice(
        lang === 'bn'
          ? 'ক্লাউডে আপনার সেটিংস ও ইতিহাস সফলভাবে সিঙ্ক হয়েছে।'
          : 'Preferences & study history synced to your account.'
      );
      window.setTimeout(() => setSyncNotice(''), 3000);
    } else {
      await signInWithGoogle();
    }
  };

  const handleExportBackup = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      settings,
      familyGoals,
      city,
      lastRead: localStorage.getItem('il_last_read_quran'),
      academyProgress: localStorage.getItem('il_academy_progress_v1'),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `islamic-life-backup-${todayKey}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFbBusy(true);
    setFbStatus(null);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fbName.trim() || user?.displayName || 'Islamic Life Member',
          email: fbEmail.trim() || user?.email || '',
          topic: fbTopic,
          message: fbMessage.trim(),
        }),
      });
      await safeReadJson(res, 'Failed to submit feedback.');
      setFbMessage('');
      setFbStatus({
        ok: true,
        text:
          lang === 'bn'
            ? 'আপনার মূল্যবান মতামত সফলভাবে সংরক্ষিত হয়েছে। জাযাকাল্লাহু খাইরান!'
            : 'Your feedback was submitted successfully. JazakAllahu Khayran!',
      });
    } catch (err) {
      setFbStatus({
        ok: false,
        text: err instanceof Error ? err.message : 'Unable to send feedback.',
      });
    } finally {
      setFbBusy(false);
    }
  };

  const runDiagnostics = async () => {
    setDiagRunning(true);
    const checks: Array<{ label: string; status: 'ok' | 'warn' | 'err'; detail: string }> = [];

    // 1. Core API JSON health
    try {
      const t0 = performance.now();
      const res = await fetch('/api/content');
      const data = await safeReadJson<{ surahs?: unknown[] }>(res);
      const ms = Math.round(performance.now() - t0);
      checks.push({
        label: 'Core Quran/Hadith API (/api/content)',
        status: Array.isArray(data.surahs) ? 'ok' : 'warn',
        detail: `HTTP ${res.status} · ${ms}ms · ${Array.isArray(data.surahs) ? data.surahs.length : 0} Surahs`,
      });
    } catch (err) {
      checks.push({
        label: 'Core Quran/Hadith API (/api/content)',
        status: 'err',
        detail: err instanceof Error ? err.message : 'Request failed',
      });
    }

    // 2. AI Studio JSON endpoint health
    try {
      const res = await fetch('/api/ai/status');
      const ai = await safeReadJson<{
        ok?: boolean;
        geminiConfigured?: boolean;
        freeModels?: string[];
      }>(res);
      checks.push({
        label: 'Gemini AI Endpoint (/api/ai/status)',
        status: ai.geminiConfigured ? 'ok' : 'warn',
        detail: ai.geminiConfigured
          ? `JSON OK · Key Configured · Models: ${(ai.freeModels || []).join(', ')}`
          : 'JSON OK · Server GEMINI_API_KEY not set in Secrets yet',
      });
    } catch (err) {
      checks.push({
        label: 'Gemini AI Endpoint (/api/ai/status)',
        status: 'err',
        detail: err instanceof Error ? err.message : 'Endpoint error',
      });
    }

    // 3. Prayer Calculation Engine
    checks.push({
      label: 'Prayer Calculation Engine',
      status: prayerTimes.fajr && prayerTimes.maghrib ? 'ok' : 'err',
      detail: `${activeMethodMeta.labelEn} · Fajr ${prayerTimes.fajr} · Maghrib ${prayerTimes.maghrib}`,
    });

    // 4. Browser Capabilities
    const hasGeo = typeof navigator !== 'undefined' && 'geolocation' in navigator;
    const hasMic = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);
    const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;
    checks.push({
      label: 'Browser Sensors, Mic & Speech',
      status: hasGeo && hasMic ? 'ok' : 'warn',
      detail: `Geolocation: ${hasGeo ? 'Yes' : 'No'} · Mic: ${hasMic ? 'Yes' : 'No'} · SpeechTTS: ${
        hasSpeech ? 'Yes' : 'No'
      }`,
    });

    // 5. Auth & Storage
    let localKeys = 0;
    try {
      localKeys = Object.keys(localStorage).filter((k) => k.startsWith('il_')).length;
    } catch {
      localKeys = 0;
    }
    checks.push({
      label: 'Cloud Sync & Local Storage',
      status: user ? 'ok' : 'warn',
      detail: user
        ? `Signed in (${user.displayName || user.email}) · ${localKeys} local keys`
        : `Guest mode · ${localKeys} local state keys stored cleanly`,
    });

    setDiagResults(checks);
    setDiagRunning(false);
  };

  const widgetHtmlSnippet = `<div style="font-family:system-ui,sans-serif;max-width:340px;border:1px solid #ebe6da;border-radius:16px;padding:16px;background:#ffffff;color:#1f2421;">
  <div style="font-weight:700;font-size:15px;color:#0f5c43;margin-bottom:4px;">Prayer Times — ${city.name_en}</div>
  <div style="font-size:12px;color:#6e7268;margin-bottom:10px;">${activeMethodMeta.labelEn}</div>
  <table style="width:100%;font-size:13px;border-collapse:collapse;">
    <tr><td style="padding:4px 0;">Fajr</td><td style="text-align:right;font-weight:600;">${prayerTimes.fajr}</td></tr>
    <tr><td style="padding:4px 0;">Sunrise</td><td style="text-align:right;">${prayerTimes.sunrise}</td></tr>
    <tr><td style="padding:4px 0;">Dhuhr</td><td style="text-align:right;font-weight:600;">${prayerTimes.dhuhr}</td></tr>
    <tr><td style="padding:4px 0;">Asr</td><td style="text-align:right;font-weight:600;">${prayerTimes.asr}</td></tr>
    <tr><td style="padding:4px 0;">Maghrib</td><td style="text-align:right;font-weight:600;">${prayerTimes.maghrib}</td></tr>
    <tr><td style="padding:4px 0;">Isha</td><td style="text-align:right;font-weight:600;">${prayerTimes.isha}</td></tr>
  </table>
</div>`;

  return (
    <div className="max-w-[920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1f2421]">
            {lang === 'bn' ? 'সেটিংস' : 'Settings'}
          </h1>
          <p className="text-xs sm:text-sm text-[#6e7268] mt-0.5">
            {lang === 'bn'
              ? 'অ্যাকাউন্ট সিঙ্ক, পরিবারের আমল গোল, নামাজের পদ্ধতি, থিম ও অ্যাপ ডায়াগনস্টিকস'
              : 'Account sync, family goals, prayer calculation method, theme, and tools'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('admin')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#ebe6da] hover:border-[#b58328] text-xs font-semibold text-[#494e45] cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#b58328]" />
          <span>{lang === 'bn' ? 'অ্যাডমিন সিএমএস' : 'Admin CMS'}</span>
        </button>
      </div>

      {syncNotice && (
        <div
          role="status"
          className="rounded-xl bg-[#eef5f0] border border-[#087653]/30 px-4 py-2.5 text-xs font-semibold text-[#087653]"
        >
          {syncNotice}
        </div>
      )}

      {/* 1. ACCOUNT */}
      <section className="space-y-2">
        <p className="px-1 text-xs font-bold uppercase tracking-wider text-[#6e7268]">
          {lang === 'bn' ? 'অ্যাকাউন্ট (Account)' : 'Account'}
        </p>
        <div className="bg-white rounded-2xl border border-[#ebe6da] divide-y divide-[#f2eee4] overflow-hidden">
          <div className="p-4 sm:px-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#f5efe0] text-[#b58328] flex items-center justify-center shrink-0">
                {user ? <UserCheck className="w-5 h-5 text-[#087653]" /> : <LogIn className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#1f2421]">
                  {user
                    ? user.displayName || user.email
                    : lang === 'bn'
                    ? 'সাইন ইন · ব্যাকআপ ও সিঙ্ক'
                    : 'Sign in · Back up & sync'}
                </p>
                <p className="text-xs text-[#6e7268] mt-0.5">
                  {user
                    ? lang === 'bn'
                      ? 'আপনার বুকমার্ক, নামাজ ট্র্যাকার ও নোট ক্লাউডে সিঙ্ক হচ্ছে'
                      : 'Cloud backup active across your signed-in devices'
                    : lang === 'bn'
                    ? 'ঐচ্ছিক: সব ডিভাইসে আপনার ইতিহাস নিরাপদে সংরক্ষণ করুন'
                    : 'Optional: keep your history safe on all your devices'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => void handleManualSync()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#eef5f0] text-[#087653] text-xs font-semibold cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'সিঙ্ক' : 'Sync'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={signOutUser}
                    disabled={authBusy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#ebe6da] text-xs font-semibold text-[#991b1b] cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'লগআউট' : 'Sign out'}</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  disabled={authBusy}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#087653] hover:bg-[#065c40] text-white text-xs font-semibold cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'গুগল সাইন ইন' : 'Sign in'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleExportBackup}
                title={lang === 'bn' ? 'ব্যাকআপ JSON ডাউনলোড' : 'Export JSON Backup'}
                className="p-2 rounded-xl border border-[#ebe6da] hover:border-[#b58328] text-[#494e45] cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FAMILY */}
      <section className="space-y-2">
        <p className="px-1 text-xs font-bold uppercase tracking-wider text-[#6e7268]">
          {lang === 'bn' ? 'পরিবার ও জামাত (Family)' : 'Family'}
        </p>
        <div className="bg-white rounded-2xl border border-[#ebe6da] overflow-hidden">
          <button
            type="button"
            data-testid="settings-family-btn"
            onClick={() => setModal('family')}
            className="w-full p-4 sm:px-5 flex items-center justify-between gap-3 text-left hover:bg-[#fcfaf5] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#f5efe0] text-[#b58328] flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#1f2421]">
                  {familyGoals.circleName} ·{' '}
                  <span className="font-mono-tabular text-[#087653]">
                    {familyGoals.khatmJuzCompleted}/30 Juz
                  </span>
                </p>
                <p className="text-xs text-[#6e7268] mt-0.5">
                  {lang === 'bn'
                    ? 'একসাথে খতম, জিকির লক্ষ্য ও রিমাইন্ডার পরিচালনা করুন'
                    : 'Khatm, dhikr goals and reminders together'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono-tabular text-xs font-semibold text-[#8f6319]">
                {familyGoals.dailyDhikrCompleted}/{familyGoals.dailyDhikrTarget}
              </span>
              <ChevronRight className="w-4 h-4 text-[#6e7268]" />
            </div>
          </button>
        </div>
      </section>

      {/* 3. PRAYER TIMES */}
      <section className="space-y-2">
        <p className="px-1 text-xs font-bold uppercase tracking-wider text-[#6e7268]">
          {lang === 'bn' ? 'নামাজের সময়সূচি (Prayer times)' : 'Prayer times'}
        </p>
        <div className="bg-white rounded-2xl border border-[#ebe6da] divide-y divide-[#f2eee4] overflow-hidden">
          <button
            type="button"
            onClick={() => setModal('location')}
            className="w-full p-4 sm:px-5 flex items-center justify-between gap-3 text-left hover:bg-[#fcfaf5] cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <MapPin className="w-5 h-5 text-[#b58328] shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#1f2421]">
                  {lang === 'bn' ? city.name_bn : city.name_en}
                </p>
                <p className="text-xs text-[#6e7268] truncate">
                  {lang === 'bn' ? city.country_bn : city.country_en} · UTC
                  {city.tzOffset >= 0 ? `+${city.tzOffset}` : city.tzOffset}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6e7268] shrink-0" />
          </button>

          <button
            type="button"
            data-testid="settings-method-btn"
            onClick={() => setModal('method')}
            className="w-full p-4 sm:px-5 flex items-center justify-between gap-3 text-left hover:bg-[#fcfaf5] cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <Compass className="w-5 h-5 text-[#087653] shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#1f2421]">
                  {lang === 'bn' ? 'হিসাব পদ্ধতি (Method)' : 'Method'}
                </p>
                <p className="text-xs text-[#6e7268] truncate">
                  {settings.prayerMethod === 'karachi'
                    ? lang === 'bn'
                      ? `স্বয়ংক্রিয় — ${activeMethodMeta.labelBn}`
                      : `Automatic — ${activeMethodMeta.labelEn}`
                    : lang === 'bn'
                    ? activeMethodMeta.labelBn
                    : activeMethodMeta.labelEn}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6e7268] shrink-0" />
          </button>

          <button
            type="button"
            data-testid="settings-adhan-btn"
            onClick={() => setModal('adhan')}
            className="w-full p-4 sm:px-5 flex items-center justify-between gap-3 text-left hover:bg-[#fcfaf5] cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <Volume2 className="w-5 h-5 text-[#b58328] shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#1f2421]">
                  {lang === 'bn' ? 'আযান ও অ্যালার্ট (Adhan & alerts)' : 'Adhan & alerts'}
                </p>
                <p className="text-xs text-[#6e7268] truncate">
                  {lang === 'bn' ? activeVoiceMeta.nameBn : activeVoiceMeta.nameEn}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6e7268] shrink-0" />
          </button>

          <button
            type="button"
            data-testid="settings-timeformat-btn"
            onClick={() => setModal('timeFormat')}
            className="w-full p-4 sm:px-5 flex items-center justify-between gap-3 text-left hover:bg-[#fcfaf5] cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <Sparkles className="w-5 h-5 text-[#087653] shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#1f2421]">
                  {lang === 'bn' ? 'সময়ের ফরম্যাট (Time format)' : 'Time format'}
                </p>
                <p className="text-xs text-[#6e7268]">
                  {settings.timeFormat === 'device'
                    ? lang === 'bn'
                      ? `ডিভাইস ডিফল্ট (${use24Hour ? '২৪-ঘণ্টা' : '১২-ঘণ্টা'})`
                      : `Device default (${use24Hour ? '24h' : '12h'})`
                    : settings.timeFormat === '24h'
                    ? lang === 'bn'
                      ? '২৪-ঘণ্টা (24-hour)'
                      : '24-hour'
                    : lang === 'bn'
                    ? '১২-ঘণ্টা (AM/PM)'
                    : '12-hour (AM/PM)'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6e7268] shrink-0" />
          </button>
        </div>
      </section>

      {/* 4. LANGUAGE & APPEARANCE */}
      <section className="space-y-2">
        <p className="px-1 text-xs font-bold uppercase tracking-wider text-[#6e7268]">
          {lang === 'bn' ? 'ভাষা ও দৃশ্যপট (Language & appearance)' : 'Language & appearance'}
        </p>
        <div className="bg-white rounded-2xl border border-[#ebe6da] divide-y divide-[#f2eee4] overflow-hidden">
          <button
            type="button"
            onClick={() => setModal('language')}
            className="w-full p-4 sm:px-5 flex items-center justify-between gap-3 text-left hover:bg-[#fcfaf5] cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <Languages className="w-5 h-5 text-[#087653]" />
              <div>
                <p className="text-sm font-bold text-[#1f2421]">
                  {lang === 'bn' ? 'ভাষা (Language)' : 'Language'}
                </p>
                <p className="text-xs text-[#6e7268]">
                  {settings.languagePref === 'auto'
                    ? `Automatic (${lang === 'bn' ? 'বাংলা' : 'English'})`
                    : settings.languagePref === 'bn'
                    ? 'বাংলা (Bengali)'
                    : 'English'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6e7268]" />
          </button>

          <button
            type="button"
            data-testid="settings-theme-btn"
            onClick={() => setModal('theme')}
            className="w-full p-4 sm:px-5 flex items-center justify-between gap-3 text-left hover:bg-[#fcfaf5] cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              {settings.theme === 'dark' ? (
                <Moon className="w-5 h-5 text-[#b58328]" />
              ) : (
                <Sun className="w-5 h-5 text-[#b58328]" />
              )}
              <div>
                <p className="text-sm font-bold text-[#1f2421]">
                  {lang === 'bn' ? 'থিম (Theme)' : 'Theme'}
                </p>
                <p className="text-xs text-[#6e7268] capitalize">{settings.theme}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6e7268]" />
          </button>

          <button
            type="button"
            data-testid="settings-color-btn"
            onClick={() => setModal('color')}
            className="w-full p-4 sm:px-5 flex items-center justify-between gap-3 text-left hover:bg-[#fcfaf5] cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <Palette className="w-5 h-5 text-[#087653]" />
              <div>
                <p className="text-sm font-bold text-[#1f2421]">
                  {lang === 'bn' ? 'রঙ (Colour)' : 'Colour'}
                </p>
                <p className="text-xs text-[#6e7268] flex items-center gap-1.5">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: activePalette.swatch }}
                  />
                  <span>{lang === 'bn' ? activePalette.nameBn : activePalette.nameEn}</span>
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6e7268]" />
          </button>
        </div>
      </section>

      {/* 5. FEATURES FOR SISTERS */}
      <section className="space-y-2">
        <p className="px-1 text-xs font-bold uppercase tracking-wider text-[#6e7268]">
          {lang === 'bn' ? 'বোনদের জন্য বিশেষ সুবিধা (Features for sisters)' : 'Features for sisters'}
        </p>
        <div className="bg-white rounded-2xl border border-[#ebe6da] divide-y divide-[#f2eee4] overflow-hidden">
          <div className="p-4 sm:px-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setModal('sisters')}
              className="flex items-center gap-3.5 text-left flex-1 min-w-0 cursor-pointer"
            >
              <HeartHandshake className="w-5 h-5 text-[#b58328] shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#1f2421]">
                  {lang === 'bn'
                    ? 'নামাজ ট্র্যাকারে মওকুফ দিন (হায়েয / নিফাস)'
                    : 'Excused days (ḥayḍ / nifās) in the prayer tracker'}
                </p>
                <p className="text-xs text-[#6e7268]">
                  {todayExcused
                    ? lang === 'bn'
                      ? 'আজকের দিন মওকুফ হিসেবে চিহ্নিত আছে'
                      : 'Today is marked as an excused day'
                    : lang === 'bn'
                    ? 'ট্র্যাকার স্ট্রিক ঠিক রেখে মওকুফ দিন সংরক্ষণ করুন'
                    : 'Pause prayer accountability gently without breaking streaks'}
                </p>
              </div>
            </button>

            <label className="inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={settings.sistersExcusedFeature}
                onChange={(e) =>
                  updateSettings({ sistersExcusedFeature: e.target.checked })
                }
                aria-label="Enable excused days feature for sisters"
                className="sr-only peer"
              />
              <span className="w-11 h-6 bg-[#dcd6c6] peer-checked:bg-[#087653] rounded-full relative transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
            </label>
          </div>

          {settings.sistersExcusedFeature && (
            <div className="px-5 py-3 bg-[#faf7f0] flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-[#494e45]">
                {lang === 'bn'
                  ? `মোট চিহ্নিত দিন: ${settings.excusedDates.length}`
                  : `Recorded excused dates: ${settings.excusedDates.length}`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleTodayExcused(todayKey)}
                  className={`px-3 py-1.5 rounded-lg font-semibold border cursor-pointer ${
                    todayExcused
                      ? 'bg-[#087653] text-white border-[#087653]'
                      : 'bg-white text-[#1f2421] border-[#ebe6da]'
                  }`}
                >
                  {todayExcused
                    ? lang === 'bn'
                      ? 'আজ মওকুফ বাতিল করুন'
                      : 'Unmark Today'
                    : lang === 'bn'
                    ? 'আজ মওকুফ হিসেবে চিহ্নিত করুন'
                    : 'Mark Today Excused'}
                </button>
                <button
                  type="button"
                  onClick={() => setModal('sisters')}
                  className="text-[#087653] font-semibold hover:underline cursor-pointer"
                >
                  {lang === 'bn' ? 'তালিকা দেখুন' : 'Manage'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 6. MORE ON ISLAMIC LIFE */}
      <section className="space-y-2">
        <p className="px-1 text-xs font-bold uppercase tracking-wider text-[#6e7268]">
          {lang === 'bn' ? 'ইসলামিক লাইফের আরও সেবা (More on Islamic life)' : 'More on Islamic life'}
        </p>
        <div className="bg-white rounded-2xl border border-[#ebe6da] divide-y divide-[#f2eee4] overflow-hidden">
          {[
            {
              icon: BookHeart,
              bn: 'সূত্রসহ মাসনুন দোয়া',
              en: 'Duas with sources',
              onClick: () => onNavigate('dua'),
            },
            {
              icon: CalendarDays,
              bn: 'ইসলামিক দিবস ও হিজরি তারিখ',
              en: 'Islamic events and dates',
              onClick: () => onNavigate('calendar'),
            },
            {
              icon: Coins,
              bn: 'যাকাত ক্যালকুলেটর',
              en: 'Zakat calculator',
              onClick: () => onNavigate('zakat'),
            },
            {
              icon: Code2,
              bn: 'আপনার ওয়েবসাইটের জন্য নামাজের সময় উইজেট',
              en: 'Prayer times widget for your website',
              onClick: () => setModal('widget'),
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.en}
                type="button"
                onClick={item.onClick}
                className="w-full p-4 sm:px-5 flex items-center justify-between gap-3 text-left hover:bg-[#fcfaf5] cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <Icon className="w-5 h-5 text-[#b58328]" />
                  <span className="text-sm font-semibold text-[#1f2421]">
                    {lang === 'bn' ? item.bn : item.en}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#6e7268]" />
              </button>
            );
          })}
        </div>
      </section>

      {/* 7. ABOUT */}
      <section className="space-y-2">
        <p className="px-1 text-xs font-bold uppercase tracking-wider text-[#6e7268]">
          {lang === 'bn' ? 'সম্পর্কে (About)' : 'About'}
        </p>
        <div className="bg-white rounded-2xl border border-[#ebe6da] divide-y divide-[#f2eee4] overflow-hidden">
          {[
            {
              icon: Mail,
              bn: 'যোগাযোগ ও মতামত (Contact & feedback)',
              en: 'Contact & feedback',
              action: () => setModal('feedback'),
            },
            {
              icon: FileText,
              bn: 'কৃতজ্ঞতা ও লাইসেন্স (Credits & licences)',
              en: 'Credits & licences',
              action: () => setModal('credits'),
            },
            {
              icon: Shield,
              bn: 'গোপনীয়তা নীতি (Privacy policy)',
              en: 'Privacy policy',
              action: () => setModal('privacy'),
            },
            {
              icon: Activity,
              bn: 'ডায়াগনস্টিকস (Diagnostics)',
              en: 'Diagnostics',
              action: () => {
                setModal('diagnostics');
                void runDiagnostics();
              },
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.en}
                type="button"
                onClick={item.action}
                className="w-full p-4 sm:px-5 flex items-center justify-between gap-3 text-left hover:bg-[#fcfaf5] cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <Icon className="w-5 h-5 text-[#087653]" />
                  <span className="text-sm font-semibold text-[#1f2421]">
                    {lang === 'bn' ? item.bn : item.en}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#6e7268]" />
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={resetAllSettings}
          className="text-xs font-semibold text-[#6e7268] hover:text-[#991b1b] cursor-pointer"
        >
          {lang === 'bn' ? 'ডিফল্ট সেটিংস রিসেট করুন' : 'Reset settings to default'}
        </button>
      </div>

      {/* MODALS */}
      {modal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl border border-[#ebe6da] shadow-2xl w-full max-w-xl max-h-[88vh] overflow-y-auto p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#f2eee4]">
              <h2 className="font-display text-lg font-bold text-[#1f2421]">
                {modal === 'family' &&
                  (lang === 'bn' ? 'পরিবার ও জামাত লক্ষ্য' : 'Family Khatm & Dhikr Goals')}
                {modal === 'location' && (lang === 'bn' ? 'শহর বা জিপিএস অবস্থান' : 'Prayer Location')}
                {modal === 'method' && (lang === 'bn' ? 'নামাজের হিসাব পদ্ধতি' : 'Calculation Method')}
                {modal === 'adhan' && (lang === 'bn' ? 'আযান কণ্ঠ ও অ্যালার্ট' : 'Adhan & Alerts')}
                {modal === 'timeFormat' && (lang === 'bn' ? 'সময়ের ফরম্যাট' : 'Time Format')}
                {modal === 'language' && (lang === 'bn' ? 'অ্যাপের ভাষা' : 'Language')}
                {modal === 'theme' && (lang === 'bn' ? 'থিম নির্বাচন' : 'Theme')}
                {modal === 'color' && (lang === 'bn' ? 'অ্যাকসেন্ট রঙ' : 'Accent Colour')}
                {modal === 'sisters' &&
                  (lang === 'bn' ? 'বোনদের মওকুফ দিন ব্যবস্থাপনা' : 'Excused Days (ḥayḍ / nifās)')}
                {modal === 'widget' &&
                  (lang === 'bn' ? 'ওয়েবসাইটের জন্য নামাজ উইজেট' : 'Prayer Times Website Widget')}
                {modal === 'feedback' &&
                  (lang === 'bn' ? 'যোগাযোগ ও মতামত' : 'Contact & Feedback')}
                {modal === 'credits' &&
                  (lang === 'bn' ? 'কৃতজ্ঞতা ও লাইসেন্স' : 'Credits & Licences')}
                {modal === 'privacy' && (lang === 'bn' ? 'গোপনীয়তা নীতি' : 'Privacy Policy')}
                {modal === 'diagnostics' && (lang === 'bn' ? 'সিস্টেম ডায়াগনস্টিকস' : 'Diagnostics')}
              </h2>
              <button
                type="button"
                onClick={() => setModal(null)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-[#6e7268] hover:bg-[#f5efe0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Family Modal */}
            {modal === 'family' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block text-xs font-semibold text-[#494e45]">
                    <span>{lang === 'bn' ? 'সার্কেলের নাম' : 'Circle Name'}</span>
                    <input
                      type="text"
                      value={familyGoals.circleName}
                      onChange={(e) => updateFamilyGoals({ circleName: e.target.value })}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-[#ebe6da] bg-[#faf7f0] text-sm"
                    />
                  </label>
                  <div className="text-xs font-semibold text-[#494e45]">
                    <span>{lang === 'bn' ? 'শেয়ার কোড' : 'Invite Code'}</span>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={familyGoals.inviteCode}
                        onChange={(e) => updateFamilyGoals({ inviteCode: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-xl border border-[#ebe6da] bg-[#faf7f0] font-mono-tabular text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => void copyText('invite', familyGoals.inviteCode)}
                        className="px-3 py-2 rounded-xl bg-[#087653] text-white text-xs font-semibold cursor-pointer"
                      >
                        {copiedKey === 'invite' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Khatm Progress */}
                <div className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-[#1f2421]">
                    <span>{lang === 'bn' ? 'যৌথ কুরআন খতম (৩০ পারা)' : 'Shared Quran Khatm (30 Juz)'}</span>
                    <span className="font-mono-tabular text-[#087653]">
                      {familyGoals.khatmJuzCompleted} / 30 Juz
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#e6e0d2] overflow-hidden">
                    <div
                      className="h-full bg-[#087653] transition-all"
                      style={{ width: `${Math.round((familyGoals.khatmJuzCompleted / 30) * 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => incrementFamilyJuz(-1)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-[#ebe6da] text-xs font-semibold cursor-pointer"
                    >
                      -1 Juz
                    </button>
                    <button
                      type="button"
                      onClick={() => incrementFamilyJuz(1)}
                      className="px-3 py-1.5 rounded-lg bg-[#087653] text-white text-xs font-semibold cursor-pointer"
                    >
                      +1 Juz Completed
                    </button>
                  </div>
                </div>

                {/* Daily Dhikr Goal */}
                <div className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-[#1f2421]">
                    <span>{lang === 'bn' ? 'দৈনিক জিকির লক্ষ্য' : 'Daily Family Dhikr Goal'}</span>
                    <span className="font-mono-tabular text-[#8f6319]">
                      {familyGoals.dailyDhikrCompleted} / {familyGoals.dailyDhikrTarget}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => incrementFamilyDhikr(33)}
                      className="px-3 py-1.5 rounded-lg bg-[#b58328] text-white text-xs font-semibold cursor-pointer"
                    >
                      +33 Tasbih
                    </button>
                    <button
                      type="button"
                      onClick={() => incrementFamilyDhikr(100)}
                      className="px-3 py-1.5 rounded-lg bg-[#087653] text-white text-xs font-semibold cursor-pointer"
                    >
                      +100 Istighfar
                    </button>
                    <button
                      type="button"
                      onClick={() => updateFamilyGoals({ dailyDhikrCompleted: 0 })}
                      className="px-3 py-1.5 rounded-lg bg-white border border-[#ebe6da] text-xs font-semibold text-[#6e7268] cursor-pointer"
                    >
                      Reset Today
                    </button>
                  </div>
                </div>

                {/* Members */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-[#494e45]">
                    {lang === 'bn' ? 'সদস্যগণ' : 'Family Members'} ({familyGoals.members.length})
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder={lang === 'bn' ? 'নতুন সদস্যের নাম...' : 'Add member name...'}
                      className="flex-1 px-3 py-2 rounded-xl border border-[#ebe6da] bg-[#faf7f0] text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        addFamilyMember(newMemberName);
                        setNewMemberName('');
                      }}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#087653] text-white text-xs font-semibold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'যোগ' : 'Add'}</span>
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {familyGoals.members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#faf7f0] border border-[#ebe6da] text-xs"
                      >
                        <span className="font-semibold text-[#1f2421]">{m.name}</span>
                        <span className="text-[#6e7268]">{m.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Location Modal */}
            {modal === 'location' && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={onDetectLocation}
                  disabled={detectingLocation}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#087653] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  {detectingLocation ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LocateFixed className="w-4 h-4" />
                  )}
                  <span>{lang === 'bn' ? 'লাইভ GPS লোকেশন ব্যবহার করুন' : 'Use Live GPS Location'}</span>
                </button>
                <div className="divide-y divide-[#f2eee4] border border-[#ebe6da] rounded-xl overflow-hidden">
                  {cityOptions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onSelectCity(c);
                        setModal(null);
                      }}
                      className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#faf7f0] cursor-pointer"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#1f2421]">
                          {lang === 'bn' ? c.name_bn : c.name_en}
                        </p>
                        <p className="text-xs text-[#6e7268]">
                          {lang === 'bn' ? c.country_bn : c.country_en} · UTC
                          {c.tzOffset >= 0 ? `+${c.tzOffset}` : c.tzOffset}
                        </p>
                      </div>
                      {city.id === c.id && <Check className="w-4 h-4 text-[#087653]" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Method Modal */}
            {modal === 'method' && (
              <div className="divide-y divide-[#f2eee4] border border-[#ebe6da] rounded-xl overflow-hidden">
                {(Object.keys(PRAYER_METHOD_META) as PrayerMethodId[]).map((mId) => {
                  const meta = PRAYER_METHOD_META[mId];
                  const active = settings.prayerMethod === mId;
                  return (
                    <button
                      key={mId}
                      type="button"
                      onClick={() => {
                        setPrayerMethod(mId);
                        setModal(null);
                      }}
                      className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#faf7f0] cursor-pointer"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#1f2421]">
                          {lang === 'bn' ? meta.labelBn : meta.labelEn}
                        </p>
                        <p className="text-xs text-[#6e7268]">
                          Fajr {meta.fajrAngle}° ·{' '}
                          {meta.ishaOffsetMin ? `Isha +${meta.ishaOffsetMin}m` : `Isha ${meta.ishaAngle}°`}
                        </p>
                      </div>
                      {active && <Check className="w-4 h-4 text-[#087653]" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Adhan Voice & Alerts Modal */}
            {modal === 'adhan' && (
              <div className="space-y-4">
                <div className="divide-y divide-[#f2eee4] border border-[#ebe6da] rounded-xl overflow-hidden">
                  {ADHAN_VOICES.map((v) => {
                    const active = settings.adhanVoice === v.id;
                    return (
                      <div
                        key={v.id}
                        className="px-4 py-3 flex items-center justify-between gap-2 hover:bg-[#faf7f0]"
                      >
                        <button
                          type="button"
                          onClick={() => setAdhanVoice(v.id)}
                          className="flex-1 text-left cursor-pointer"
                        >
                          <p className="text-sm font-semibold text-[#1f2421]">
                            {lang === 'bn' ? v.nameBn : v.nameEn}
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => playAdhanPreview(v.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#f5efe0] text-[#8f6319] text-xs font-semibold cursor-pointer"
                        >
                          {lang === 'bn' ? 'শুনুন' : 'Preview'}
                        </button>
                        {active && <Check className="w-4 h-4 text-[#087653]" />}
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setModal(null);
                    onOpenNotifications();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#087653] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  <span>
                    {lang === 'bn'
                      ? 'নামাজ ও দৈনিক দোয়ার অ্যালার্ট সেট করুন'
                      : 'Configure Notification & Adhan Reminders'}
                  </span>
                </button>
              </div>
            )}

            {/* Time Format Modal */}
            {modal === 'timeFormat' && (
              <div className="space-y-2">
                {(
                  [
                    ['device', lang === 'bn' ? 'ডিভাইস ডিফল্ট (Automatic)' : 'Device default'],
                    ['12h', lang === 'bn' ? '১২-ঘণ্টা (03:35 PM)' : '12-hour (03:35 PM)'],
                    ['24h', lang === 'bn' ? '২৪-ঘণ্টা (15:35)' : '24-hour (15:35)'],
                  ] as Array<[TimeFormatPref, string]>
                ).map(([fmt, label]) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => {
                      setTimeFormat(fmt);
                      setModal(null);
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-[#ebe6da] flex items-center justify-between text-sm font-semibold hover:bg-[#faf7f0] cursor-pointer"
                  >
                    <span>{label}</span>
                    {settings.timeFormat === fmt && <Check className="w-4 h-4 text-[#087653]" />}
                  </button>
                ))}
              </div>
            )}

            {/* Language Modal */}
            {modal === 'language' && (
              <div className="space-y-2">
                {(
                  [
                    ['auto', lang === 'bn' ? 'স্বয়ংক্রিয় (Automatic)' : 'Automatic'],
                    ['bn', 'বাংলা (Bengali)'],
                    ['en', 'English'],
                  ] as Array<[LanguagePref, string]>
                ).map(([pref, label]) => (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => {
                      setLanguagePref(pref);
                      setModal(null);
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-[#ebe6da] flex items-center justify-between text-sm font-semibold hover:bg-[#faf7f0] cursor-pointer"
                  >
                    <span>{label}</span>
                    {settings.languagePref === pref && <Check className="w-4 h-4 text-[#087653]" />}
                  </button>
                ))}
              </div>
            )}

            {/* Theme Modal */}
            {modal === 'theme' && (
              <div className="space-y-2">
                {(
                  [
                    ['system', lang === 'bn' ? 'সিস্টেম (System)' : 'System'],
                    ['light', lang === 'bn' ? 'আলো / লাইট (Light)' : 'Light'],
                    ['dark', lang === 'bn' ? 'অন্ধকার / ডার্ক (Dark)' : 'Dark'],
                  ] as Array<[ThemePref, string]>
                ).map(([th, label]) => (
                  <button
                    key={th}
                    type="button"
                    onClick={() => {
                      setTheme(th);
                      setModal(null);
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-[#ebe6da] flex items-center justify-between text-sm font-semibold hover:bg-[#faf7f0] cursor-pointer"
                  >
                    <span>{label}</span>
                    {settings.theme === th && <Check className="w-4 h-4 text-[#087653]" />}
                  </button>
                ))}
              </div>
            )}

            {/* Accent Color Modal */}
            {modal === 'color' && (
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(ACCENT_PALETTES) as AccentColorId[]).map((cid) => {
                  const p = ACCENT_PALETTES[cid];
                  return (
                    <button
                      key={cid}
                      type="button"
                      onClick={() => {
                        setAccentColor(cid);
                        setModal(null);
                      }}
                      className={`p-3.5 rounded-xl border flex items-center justify-between text-sm font-semibold cursor-pointer ${
                        settings.accentColor === cid
                          ? 'border-[#087653] bg-[#eef5f0]'
                          : 'border-[#ebe6da] bg-[#faf7f0]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: p.swatch }}
                        />
                        <span>{lang === 'bn' ? p.nameBn : p.nameEn}</span>
                      </span>
                      {settings.accentColor === cid && <Check className="w-4 h-4 text-[#087653]" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Sisters Excused Days Modal */}
            {modal === 'sisters' && (
              <div className="space-y-4">
                <p className="text-xs text-[#494e45] leading-relaxed">
                  {lang === 'bn'
                    ? 'হায়েয বা নিফাস অবস্থায় নামাজ মওকুফ থাকে। এই অপশন চালু থাকলে নামাজ ট্র্যাকারে সেসব দিন “মওকুফ” হিসেবে গণনা করা হয় যাতে আপনার দৈনিক ধারাবাহিকতা নষ্ট না হয়।'
                    : 'During excused days (ḥayḍ / nifās), obligatory prayers are paused. Mark days below so your Home prayer tracker gently reflects excused status.'}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleTodayExcused(todayKey)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                      todayExcused
                        ? 'bg-[#087653] text-white'
                        : 'bg-[#f5efe0] text-[#8f6319] border border-[#b58328]/40'
                    }`}
                  >
                    {todayExcused
                      ? `${lang === 'bn' ? 'আজ মওকুফ (সরান)' : 'Today Excused (Remove)'} · ${todayKey}`
                      : `${lang === 'bn' ? 'আজকের দিন যোগ করুন' : 'Mark Today Excused'} · ${todayKey}`}
                  </button>
                </div>
                {settings.excusedDates.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-[#1f2421]">
                      {lang === 'bn' ? 'সংরক্ষিত মওকুফ তারিখ' : 'Saved Excused Dates'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {settings.excusedDates.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleTodayExcused(d)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#faf7f0] border border-[#ebe6da] font-mono-tabular text-xs cursor-pointer"
                        >
                          <span>{d}</span>
                          <X className="w-3 h-3 text-[#991b1b]" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Website Widget Generator Modal */}
            {modal === 'widget' && (
              <div className="space-y-4">
                <p className="text-xs text-[#6e7268]">
                  {lang === 'bn'
                    ? 'আপনার ব্লগ বা মসজিদ ওয়েবসাইটে নামাজের সময়সূচি দেখাতে নিচের HTML কোডটি কপি করুন:'
                    : 'Copy this lightweight HTML widget to embed live calculated prayer times on your site:'}
                </p>
                <div className="rounded-xl border border-[#ebe6da] bg-[#faf7f0] p-4">
                  <p className="text-sm font-bold text-[#087653]">
                    Prayer Times — {lang === 'bn' ? city.name_bn : city.name_en}
                  </p>
                  <p className="text-[11px] text-[#6e7268] mb-2">{activeMethodMeta.labelEn}</p>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <span>Fajr</span>
                    <span className="text-right font-mono-tabular font-semibold">{prayerTimes.fajr}</span>
                    <span>Dhuhr</span>
                    <span className="text-right font-mono-tabular font-semibold">{prayerTimes.dhuhr}</span>
                    <span>Asr</span>
                    <span className="text-right font-mono-tabular font-semibold">{prayerTimes.asr}</span>
                    <span>Maghrib</span>
                    <span className="text-right font-mono-tabular font-semibold">{prayerTimes.maghrib}</span>
                    <span>Isha</span>
                    <span className="text-right font-mono-tabular font-semibold">{prayerTimes.isha}</span>
                  </div>
                </div>
                <textarea
                  readOnly
                  rows={6}
                  value={widgetHtmlSnippet}
                  className="w-full p-3 rounded-xl border border-[#ebe6da] bg-[#faf7f0] font-mono-tabular text-[11px] text-[#1f2421]"
                />
                <button
                  type="button"
                  onClick={() => void copyText('widget', widgetHtmlSnippet)}
                  className="w-full py-2.5 rounded-xl bg-[#087653] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedKey === 'widget' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>
                    {copiedKey === 'widget'
                      ? lang === 'bn'
                        ? 'কোড কপি হয়েছে!'
                        : 'Copied HTML Snippet!'
                      : lang === 'bn'
                      ? 'উইজেট কোড কপি করুন'
                      : 'Copy Embed HTML'}
                  </span>
                </button>
              </div>
            )}

            {/* Feedback Modal */}
            {modal === 'feedback' && (
              <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={fbName}
                    onChange={(e) => setFbName(e.target.value)}
                    placeholder={lang === 'bn' ? 'আপনার নাম (ঐচ্ছিক)' : 'Your name (optional)'}
                    className="px-3 py-2 rounded-xl border border-[#ebe6da] bg-[#faf7f0] text-xs"
                  />
                  <select
                    value={fbTopic}
                    onChange={(e) => setFbTopic(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-[#ebe6da] bg-[#faf7f0] text-xs"
                  >
                    <option value="Suggestion">{lang === 'bn' ? 'পরামর্শ' : 'Feature Suggestion'}</option>
                    <option value="Bug Report">{lang === 'bn' ? 'ত্রুটি প্রতিবেদন' : 'Bug Report'}</option>
                    <option value="Quran/Tafsir">{lang === 'bn' ? 'কুরআন ও তাফসির' : 'Quran / Tafsir'}</option>
                  </select>
                </div>
                <input
                  type="email"
                  value={fbEmail}
                  onChange={(e) => setFbEmail(e.target.value)}
                  placeholder={lang === 'bn' ? 'ইমেইল (ঐচ্ছিক)' : 'Email (optional)'}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebe6da] bg-[#faf7f0] text-xs"
                />
                <textarea
                  required
                  rows={4}
                  value={fbMessage}
                  onChange={(e) => setFbMessage(e.target.value)}
                  placeholder={
                    lang === 'bn'
                      ? 'আপনার মতামত বা পরামর্শ লিখুন...'
                      : 'Share your feedback or bug report...'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#ebe6da] bg-[#faf7f0] text-sm"
                />
                {fbStatus && (
                  <p
                    className={`text-xs px-3 py-2 rounded-lg ${
                      fbStatus.ok ? 'bg-[#eef5f0] text-[#087653]' : 'bg-[#fef2f2] text-[#991b1b]'
                    }`}
                  >
                    {fbStatus.text}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={fbBusy || !fbMessage.trim()}
                  className="w-full py-2.5 rounded-xl bg-[#087653] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {fbBusy
                    ? lang === 'bn'
                      ? 'পাঠানো হচ্ছে...'
                      : 'Sending...'
                    : lang === 'bn'
                    ? 'মতামত পাঠান'
                    : 'Send Feedback'}
                </button>
              </form>
            )}

            {/* Credits Modal */}
            {modal === 'credits' && (
              <div className="space-y-3 text-xs text-[#494e45] leading-relaxed">
                <div className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] p-3.5 space-y-1">
                  <p className="font-bold text-[#1f2421]">Quranic Text, Translations & Recitations</p>
                  <p>Verified Uthmani Quran scripts, Bangla & Sahih International translations, and AlQuran Cloud audio recitations.</p>
                </div>
                <div className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] p-3.5 space-y-1">
                  <p className="font-bold text-[#1f2421]">Tafsir & Hadith Collections</p>
                  <p>Classical Tafsir attributions (Ibn Kathir, Tabari, Qurtubi, Jalalayn, Baghawi) and Sahih al-Bukhari / Sahih Muslim references.</p>
                </div>
                <div className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] p-3.5 space-y-1">
                  <p className="font-bold text-[#1f2421]">Maps, Weather & 3D Graphics</p>
                  <p>Google Maps Platform (Qibla Geodesic Line), Open-Meteo (Live Weather & Timezone), and Three.js (3D Qibla Compass & Botanical Sanctuary).</p>
                </div>
              </div>
            )}

            {/* Privacy Modal */}
            {modal === 'privacy' && (
              <div className="space-y-3 text-xs text-[#494e45] leading-relaxed">
                <p className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-[#087653] shrink-0 mt-0.5" />
                  <span>
                    {lang === 'bn'
                      ? 'আপনার নামাজ ট্র্যাকার, সেটিংস ও একাডেমি প্রগতি প্রাথমিকভাবে আপনার ব্রাউজারেই সংরক্ষিত থাকে। গুগল অ্যাকাউন্টে সাইন ইন করলে কেবল আপনার নিজস্ব Firestore রেকর্ডে নিরাপদভাবে ব্যাকআপ রাখা হয়।'
                      : 'Your prayer tracker, preferences, and learning progress are stored locally on your device by default. When you optionally sign in with Google, your history syncs privately to your own isolated Firestore user space.'}
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <Globe className="w-4 h-4 text-[#b58328] shrink-0 mt-0.5" />
                  <span>
                    {lang === 'bn'
                      ? 'লাইভ জিপিএস বা আবহাওয়ার তথ্য কেবল আপনার শহরের নামাজের সময়, কিবলা দিক ও আবহাওয়া দেখানোর জন্যই ব্যবহৃত হয়।'
                      : 'Location coordinates are used solely to calculate accurate prayer times, live weather, and Qibla direction.'}
                  </span>
                </p>
              </div>
            )}

            {/* Diagnostics Modal */}
            {modal === 'diagnostics' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#6e7268]">
                    {lang === 'bn'
                      ? 'এপিআই, নামাজ গণনা ইঞ্জিন ও সেন্সরের তাৎক্ষণিক অবস্থা'
                      : 'Live verification of JSON endpoints, prayer math, sensors, and sync'}
                  </p>
                  <button
                    type="button"
                    onClick={() => void runDiagnostics()}
                    disabled={diagRunning}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#087653] text-white text-xs font-semibold cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${diagRunning ? 'animate-spin' : ''}`} />
                    <span>{lang === 'bn' ? 'পুনরায় পরীক্ষা' : 'Re-run'}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {diagResults.map((row) => (
                    <div
                      key={row.label}
                      className="rounded-xl border border-[#ebe6da] bg-[#faf7f0] p-3 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1f2421]">{row.label}</p>
                        <p className="text-[11px] font-mono-tabular text-[#5a7066] mt-0.5 break-all">
                          {row.detail}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase shrink-0 ${
                          row.status === 'ok'
                            ? 'bg-[#eef5f0] text-[#087653]'
                            : row.status === 'warn'
                            ? 'bg-[#f5efe0] text-[#8f6319]'
                            : 'bg-[#fef2f2] text-[#991b1b]'
                        }`}
                      >
                        {row.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
