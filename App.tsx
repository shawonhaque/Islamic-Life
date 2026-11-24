import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, BellRing, X } from 'lucide-react';
import { AdminPage } from './components/AdminPage';
import { AiStudioHubPage } from './components/AiStudioHubPage';
import { ArabicLearningPage } from './components/ArabicLearningPage';
import { AsmaUlHusnaPage } from './components/AsmaUlHusnaPage';
import { GlobalSearchPage } from './components/GlobalSearchPage';
import { HadithDuaPage } from './components/HadithDuaPage';
import { HajjUmrahPage } from './components/HajjUmrahPage';
import { HomePage } from './components/HomePage';
import { LocationSelectorModal } from './components/LocationSelectorModal';
import { NamazPage } from './components/NamazPage';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { PrayerTimePage, QiblaPage } from './components/PrayerTimeQiblaPage';
import { QuranPage } from './components/QuranPage';
import { CalendarPage, RamadanPage } from './components/RamadanCalendarPage';
import { SettingsPage } from './components/SettingsPage';
import { SidebarNav } from './components/SidebarNav';
import { TafsirHubPage } from './components/TafsirHubPage';
import { TasbihPage, ZakatPage } from './components/TasbihZakatPage';
import { TerrariumViewport } from './components/TerrariumViewport';
import { useAuth } from './contexts/AuthContext';
import { useSettings } from './contexts/SettingsContext';
import { SEED_DUAS, SEED_HADITHS } from './data/islamicSeed';
import { SEED_AYAHS, SEED_SURAHS } from './data/surahs114';
import { useNotificationScheduler } from './hooks/useNotificationScheduler';
import type {
  Ayah,
  CityLocation,
  Dua,
  Hadith,
  IslamicContentBundle,
  LiveWeatherInfo,
  SectionId,
  Surah,
} from './types/islamic';
import { PRESET_CITIES, calculatePrayerTimes, getLocationClock } from './utils/islamicMath';
import {
  fetchLiveWeather,
  resolveApproximateIpLocation,
  resolveBrowserGeolocation,
} from './utils/locationWeather';
import { safeReadJson } from './utils/safeFetch';

const SELECTED_CITY_STORAGE_KEY = 'il_selected_city_v1';

function readStoredCity(): CityLocation | null {
  try {
    const raw = localStorage.getItem(SELECTED_CITY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CityLocation>;
    if (
      typeof parsed.id === 'string' &&
      typeof parsed.lat === 'number' &&
      typeof parsed.lng === 'number' &&
      typeof parsed.tzOffset === 'number'
    ) {
      return parsed as CityLocation;
    }
    return null;
  } catch {
    return null;
  }
}

export default function App() {
  const { settings, resolvedLang: lang, use24Hour, toggleLanguageQuick } = useSettings();
  const [activeSection, setActiveSection] = useState<SectionId>('home');
  const [fullscreenTerrarium, setFullscreenTerrarium] = useState<boolean>(false);
  const [notifModalOpen, setNotifModalOpen] = useState<boolean>(false);
  const [locationModalOpen, setLocationModalOpen] = useState<boolean>(false);
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quranJumpTarget, setQuranJumpTarget] = useState<{
    surahNumber: number;
    ayahNumber: number;
    key: number;
  } | null>(null);
  const [hadithDuaFocus, setHadithDuaFocus] = useState<{ query: string; key: number }>({
    query: '',
    key: 0,
  });
  const [prefillAiPrompt, setPrefillAiPrompt] = useState<{ text: string; key: number } | null>(
    null
  );

  const [city, setCity] = useState<CityLocation>(() => readStoredCity() ?? PRESET_CITIES[0]);
  const [liveGpsCity, setLiveGpsCity] = useState<CityLocation | null>(() => {
    const saved = readStoredCity();
    return saved?.isLiveGps ? saved : null;
  });
  const [detectingLocation, setDetectingLocation] = useState<boolean>(false);
  const [weather, setWeather] = useState<LiveWeatherInfo | null>(null);
  const [asrMethod, setAsrMethod] = useState<'hanafi' | 'standard'>('hanafi');

  const { user, syncPreferences } = useAuth();
  const [surahs, setSurahs] = useState<Surah[]>(SEED_SURAHS);
  const [ayahs, setAyahs] = useState<Ayah[]>(SEED_AYAHS);
  const [hadiths, setHadiths] = useState<Hadith[]>(SEED_HADITHS);
  const [duas, setDuas] = useState<Dua[]>(SEED_DUAS);

  const handleSelectCity = useCallback((nextCity: CityLocation) => {
    setCity(nextCity);
    if (nextCity.isLiveGps) {
      setLiveGpsCity(nextCity);
    }
    try {
      localStorage.setItem(SELECTED_CITY_STORAGE_KEY, JSON.stringify(nextCity));
    } catch {
      // ignore storage errors
    }
  }, []);

  const detectMyLocation = useCallback(
    async (manual = false) => {
      setDetectingLocation(true);
      try {
        let detected = await resolveBrowserGeolocation(lang);
        if (!detected && !manual) {
          detected = await resolveApproximateIpLocation();
        }
        if (detected) {
          setLiveGpsCity(detected);
          handleSelectCity(detected);
        }
      } finally {
        setDetectingLocation(false);
      }
    },
    [lang, handleSelectCity]
  );

  // Auto-detect real-time location on initial launch if user hasn't manually pinned a preset city
  useEffect(() => {
    const saved = readStoredCity();
    if (!saved || saved.isLiveGps) {
      void detectMyLocation(false);
    }
    // Run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh live weather whenever active coordinates change, plus every 15 minutes
  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      const info = await fetchLiveWeather(city.lat, city.lng);
      if (cancelled || !info) return;
      setWeather(info);
      if (
        city.isLiveGps &&
        typeof info.tzOffsetHours === 'number' &&
        Math.abs(info.tzOffsetHours - city.tzOffset) > 0.01
      ) {
        const updated = { ...city, tzOffset: info.tzOffsetHours };
        setCity(updated);
        setLiveGpsCity(updated);
      }
    };
    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, 15 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [city.lat, city.lng, city.isLiveGps, city.tzOffset]);

  const fetchContent = useCallback(async () => {
    try {
      const res = await fetch('/api/content');
      if (!res.ok) return;
      const data = await safeReadJson<Partial<IslamicContentBundle>>(res);
      if (Array.isArray(data.surahs)) setSurahs(data.surahs);
      if (Array.isArray(data.ayahs)) setAyahs(data.ayahs);
      if (Array.isArray(data.hadiths)) setHadiths(data.hadiths);
      if (Array.isArray(data.duas)) setDuas(data.duas);
    } catch {
      // Fallback gracefully to bundled seed data if offline
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (user && user.emailVerified) {
      void syncPreferences(lang, city.id);
    }
  }, [user, lang, city.id, syncPreferences]);

  useEffect(() => {
    const onQuotaExceeded = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  const activeClock = getLocationClock(Date.now(), city.tzOffset, city.timeZoneId);
  const activeLocalDate = activeClock.localDate;
  const effectiveTz = activeClock.effectiveTzOffset;
  const prayerTimes = useMemo(
    () =>
      calculatePrayerTimes(
        activeLocalDate,
        city.lat,
        city.lng,
        effectiveTz,
        asrMethod,
        settings.prayerMethod,
        use24Hour
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      activeLocalDate.getFullYear(),
      activeLocalDate.getMonth(),
      activeLocalDate.getDate(),
      city.lat,
      city.lng,
      effectiveTz,
      asrMethod,
      settings.prayerMethod,
      use24Hour,
    ]
  );

  const scheduler = useNotificationScheduler({
    lang,
    city,
    prayerTimes,
    duas,
    hadiths,
  });

  const handleNavigate = (section: SectionId) => {
    setActiveSection(section);
    setFullscreenTerrarium(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenSearch = (query: string) => {
    setSearchQuery(query);
    handleNavigate('search');
  };

  const handleOpenQuranVerse = (surahNumber: number, ayahNumber: number) => {
    setQuranJumpTarget({ surahNumber, ayahNumber, key: Date.now() });
    handleNavigate('quran');
  };

  const handleOpenHadithFromSearch = (hadith: Hadith) => {
    setHadithDuaFocus({
      query: lang === 'bn' ? hadith.title_bn : hadith.title_en,
      key: Date.now(),
    });
    handleNavigate('hadith');
  };

  const handleOpenDuaFromSearch = (dua: Dua) => {
    setHadithDuaFocus({
      query: lang === 'bn' ? dua.title_bn : dua.title_en,
      key: Date.now(),
    });
    handleNavigate('dua');
  };

  const handlePracticeArabicInAi = (promptText: string) => {
    setPrefillAiPrompt({ text: promptText, key: Date.now() });
    handleNavigate('ai-studio');
  };

  const toast = scheduler.activeToast;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#faf7f0] text-[#1f2421]">
      <SidebarNav
        lang={lang}
        activeSection={activeSection}
        notificationsEnabled={scheduler.settings.enabled}
        onNavigate={handleNavigate}
        onToggleLanguage={toggleLanguageQuick}
        onOpenNotifications={() => setNotifModalOpen(true)}
      />

      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {gmpQuotaExceeded && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
            <span>
              Google Maps Platform quota reached. If you are the app owner, visit{' '}
              <a
                href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-amber-950 hover:text-amber-800"
              >
                maps developer site
              </a>{' '}
              for instructions to update your account.
            </span>
          </div>
        )}

        <main className="flex-1">
          {activeSection === 'home' && (
            <HomePage
              lang={lang}
              city={city}
              liveGpsCity={liveGpsCity}
              weather={weather}
              detectingLocation={detectingLocation}
              asrMethod={asrMethod}
              prayerTimes={prayerTimes}
              onSelectCity={handleSelectCity}
              onDetectLocation={() => void detectMyLocation(true)}
              onOpenLocationModal={() => setLocationModalOpen(true)}
              onChangeAsrMethod={setAsrMethod}
              onNavigate={handleNavigate}
              onOpenQuranVerse={handleOpenQuranVerse}
              fullscreenTerrarium={fullscreenTerrarium}
              onToggleFullscreenTerrarium={() => setFullscreenTerrarium((f) => !f)}
              notificationsEnabled={scheduler.settings.enabled}
              onOpenNotifications={() => setNotifModalOpen(true)}
              onSearchSubmit={handleOpenSearch}
            />
          )}

          {activeSection === 'search' && (
            <GlobalSearchPage
              lang={lang}
              initialQuery={searchQuery}
              onOpenQuranVerse={handleOpenQuranVerse}
              onOpenHadith={handleOpenHadithFromSearch}
              onOpenDua={handleOpenDuaFromSearch}
            />
          )}

          {activeSection === 'namaz' && <NamazPage lang={lang} />}

          {activeSection === 'arabic-learning' && (
            <ArabicLearningPage
              lang={lang}
              onPracticeInAi={handlePracticeArabicInAi}
              onOpenQuranVerse={handleOpenQuranVerse}
            />
          )}

          {activeSection === 'quran' && (
            <QuranPage
              lang={lang}
              surahs={surahs}
              ayahs={ayahs}
              jumpTo={quranJumpTarget}
            />
          )}

          {activeSection === 'tafsir' && (
            <TafsirHubPage
              lang={lang}
              surahs={surahs}
              onOpenInQuran={handleOpenQuranVerse}
            />
          )}

          {(activeSection === 'hadith' || activeSection === 'dua') && (
            <HadithDuaPage
              lang={lang}
              initialTab={activeSection}
              hadiths={hadiths}
              duas={duas}
              onSwitchTab={(tab) => setActiveSection(tab)}
              initialSearch={hadithDuaFocus.query}
              searchTriggerKey={hadithDuaFocus.key}
              onOpenTasbih={() => handleNavigate('tasbih')}
            />
          )}

          {activeSection === 'prayer-time' && (
            <PrayerTimePage
              lang={lang}
              city={city}
              liveGpsCity={liveGpsCity}
              detectingLocation={detectingLocation}
              asrMethod={asrMethod}
              prayerTimes={prayerTimes}
              onSelectCity={handleSelectCity}
              onDetectLocation={() => void detectMyLocation(true)}
              onOpenLocationModal={() => setLocationModalOpen(true)}
              onChangeAsrMethod={setAsrMethod}
            />
          )}

          {activeSection === 'qibla' && (
            <QiblaPage
              lang={lang}
              city={city}
              onSelectCity={handleSelectCity}
              onDetectLocation={() => void detectMyLocation(true)}
              onOpenLocationModal={() => setLocationModalOpen(true)}
            />
          )}

          {activeSection === 'tasbih' && <TasbihPage lang={lang} />}

          {activeSection === 'zakat' && <ZakatPage lang={lang} />}

          {activeSection === 'ramadan' && <RamadanPage lang={lang} city={city} />}

          {activeSection === 'calendar' && <CalendarPage lang={lang} />}

          {activeSection === 'hajj-umrah' && <HajjUmrahPage lang={lang} />}

          {activeSection === 'names-99' && <AsmaUlHusnaPage lang={lang} />}

          {activeSection === 'terrarium' && (
            <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="mb-5">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1f2421]">
                  {lang === 'bn'
                    ? 'ইন্টারেক্টিভ ৩ডি বোটানিক্যাল গ্লাস টেরারিয়াম'
                    : 'Interactive 3D Botanical Glass Terrarium'}
                </h1>
                <p className="text-[#6e7268] mt-1">
                  {lang === 'bn'
                    ? 'মাউস দিয়ে ঘোরান ও জুম করুন। নিচের ডক থেকে নামাজের ওয়াক্ত অনুযায়ী আলো ও আবহাওয়া পরিবর্তন করুন।'
                    : 'Drag to orbit and scroll to zoom. Adjust prayer-time lighting, weather modes, and camera angles from the bottom dock.'}
                </p>
              </div>
              <TerrariumViewport
                lang={lang}
                city={city}
                fullscreen={fullscreenTerrarium}
                onToggleFullscreen={() => setFullscreenTerrarium((f) => !f)}
              />
            </div>
          )}

          {activeSection === 'ai-studio' && (
            <AiStudioHubPage
              lang={lang}
              prefillChatPrompt={prefillAiPrompt}
              onOpenAcademy={() => handleNavigate('arabic-learning')}
              onOpenQuran={() => handleNavigate('quran')}
            />
          )}

          {activeSection === 'settings' && (
            <SettingsPage
              lang={lang}
              city={city}
              liveGpsCity={liveGpsCity}
              detectingLocation={detectingLocation}
              prayerTimes={prayerTimes}
              onSelectCity={handleSelectCity}
              onDetectLocation={() => void detectMyLocation(true)}
              onOpenNotifications={() => setNotifModalOpen(true)}
              onNavigate={handleNavigate}
            />
          )}

          {activeSection === 'admin' && (
            <AdminPage
              lang={lang}
              surahs={surahs}
              ayahs={ayahs}
              hadiths={hadiths}
              duas={duas}
              onContentMutated={fetchContent}
            />
          )}
        </main>

        <footer className="border-t border-[#ebe6da] bg-white/60 mt-10">
          <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6e7268]">
            <span>
              <strong className="text-[#1f2421]">Islamic Life</strong> ·{' '}
              {lang === 'bn'
                ? 'কুরআন · হাদিস · নামাজ · দোয়া · কিবলা ও যাকাত'
                : 'Quran · Hadith · Namaz · Dua · Qibla & Zakat'}
            </span>
            <span>© {new Date().getFullYear()} Islamic Life</span>
          </div>
        </footer>
      </div>

      {/* Opt-In Daily Reminder Notification Modal */}
      <NotificationCenterModal
        open={notifModalOpen}
        lang={lang}
        settings={scheduler.settings}
        permission={scheduler.permission}
        history={scheduler.history}
        onClose={() => setNotifModalOpen(false)}
        onUpdateSettings={scheduler.updateSettings}
        onTurnOffAll={scheduler.turnOffAllNotifications}
        onRequestPermission={scheduler.requestBrowserPermission}
        onTriggerTest={scheduler.triggerTestReminder}
        onClearHistory={scheduler.clearHistory}
        onNavigate={handleNavigate}
      />

      {/* Searchable Global City & World Timezone Location Selector Modal */}
      <LocationSelectorModal
        open={locationModalOpen}
        lang={lang}
        currentCity={city}
        liveGpsCity={liveGpsCity}
        use24Hour={use24Hour}
        detectingLocation={detectingLocation}
        onClose={() => setLocationModalOpen(false)}
        onSelectCity={handleSelectCity}
        onUseCurrentLocation={() => detectMyLocation(true)}
      />

      {/* In-App Reminder Toast Banner */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          data-testid="notification-toast"
          className="fixed bottom-5 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-sm bg-white rounded-2xl border border-[#b58328]/50 shadow-xl p-4 space-y-2.5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#087653] text-white flex items-center justify-center shrink-0">
                <BellRing className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#183027]">
                  {lang === 'bn' ? toast.titleBn : toast.titleEn}
                </p>
                {toast.meta && (
                  <p className="text-[11px] font-mono-tabular text-[#8f6319]">{toast.meta}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={scheduler.dismissToast}
              aria-label={lang === 'bn' ? 'বন্ধ করুন' : 'Dismiss'}
              className="p-1 rounded-lg text-[#6e7268] hover:bg-[#f5efe0] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {toast.arabic && (
            <p className="font-arabic text-lg text-[#087653] text-right leading-relaxed">
              {toast.arabic}
            </p>
          )}

          <p className="text-xs text-[#494e45] leading-relaxed">
            {lang === 'bn' ? toast.bodyBn : toast.bodyEn}
          </p>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#f2eee4]">
            <button
              type="button"
              onClick={() => {
                handleNavigate(toast.targetSection);
                scheduler.dismissToast();
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#087653] hover:underline cursor-pointer"
            >
              <span>{lang === 'bn' ? 'বিস্তারিত দেখুন' : 'Open Section'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={scheduler.turnOffAllNotifications}
              className="text-[11px] font-medium text-[#6e7268] hover:text-[#991b1b] cursor-pointer"
            >
              {lang === 'bn' ? 'রিমাইন্ডার বন্ধ করুন' : 'Turn off alerts'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
