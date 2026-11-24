import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  AccentColorId,
  AdhanVoiceId,
  AppSettings,
  FamilyGoalState,
  Language,
  LanguagePref,
  PrayerMethodId,
  ThemePref,
  TimeFormatPref,
} from '../types/islamic';

const SETTINGS_STORAGE_KEY = 'il_app_settings_v1';
const FAMILY_STORAGE_KEY = 'il_family_goals_v1';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  prayerMethod: 'karachi',
  adhanVoice: 'islam-sobhi',
  timeFormat: 'device',
  languagePref: 'bn',
  theme: 'light',
  accentColor: 'gold',
  sistersExcusedFeature: true,
  excusedDates: [],
};

export const DEFAULT_FAMILY_GOALS: FamilyGoalState = {
  circleName: 'My Family Circle',
  inviteCode: 'NOOR-2026',
  khatmJuzCompleted: 4,
  dailyDhikrTarget: 300,
  dailyDhikrCompleted: 99,
  sharedReminderNote: 'SubhanAllah x33, Alhamdulillah x33, Allahu Akbar x34 after every Salah',
  members: [
    { id: 'm1', name: 'Me (Host)', role: 'Coordinator', juzDone: 2, dhikrDone: 66 },
    { id: 'm2', name: 'Family Member', role: 'Participant', juzDone: 2, dhikrDone: 33 },
  ],
};

export const ADHAN_VOICES: Array<{
  id: AdhanVoiceId;
  nameEn: string;
  nameBn: string;
  baseFreq: number;
}> = [
  { id: 'islam-sobhi', nameEn: 'Islam Sobhi', nameBn: 'ইসলাম সুবহী', baseFreq: 440 },
  { id: 'mishary', nameEn: 'Mishary Rashid Alafasy', nameBn: 'মিশারি রাশিদ আল-আফাসি', baseFreq: 493.88 },
  { id: 'abdul-basit', nameEn: 'Abdul Basit Abdus Samad', nameBn: 'আব্দুল বাসিত আব্দুস সামাদ', baseFreq: 392 },
  { id: 'makkah', nameEn: 'Masjid al-Haram (Makkah)', nameBn: 'মসজিদুল হারাম (মক্কা)', baseFreq: 523.25 },
];

export const ACCENT_PALETTES: Record<
  AccentColorId,
  { nameEn: string; nameBn: string; swatch: string; primary: string; gold: string; goldBright: string }
> = {
  gold: {
    nameEn: 'Gold',
    nameBn: 'সোনালি (Gold)',
    swatch: '#b58328',
    primary: '#0f5c43',
    gold: '#b58328',
    goldBright: '#d4a84f',
  },
  emerald: {
    nameEn: 'Emerald',
    nameBn: 'সবুজ পান্না (Emerald)',
    swatch: '#087653',
    primary: '#087653',
    gold: '#0f766e',
    goldBright: '#2dd4bf',
  },
  sapphire: {
    nameEn: 'Sapphire',
    nameBn: 'নীলকান্তমণি (Sapphire)',
    swatch: '#1d4ed8',
    primary: '#1e3a8a',
    gold: '#1d4ed8',
    goldBright: '#60a5fa',
  },
  rose: {
    nameEn: 'Rose Amber',
    nameBn: 'গোলাপি (Rose)',
    swatch: '#be123c',
    primary: '#881337',
    gold: '#be123c',
    goldBright: '#fb7185',
  },
};

function readStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_APP_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...DEFAULT_APP_SETTINGS,
      ...parsed,
      excusedDates: Array.isArray(parsed.excusedDates)
        ? parsed.excusedDates.filter((d): d is string => typeof d === 'string').slice(-90)
        : [],
    };
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

function readStoredFamilyGoals(): FamilyGoalState {
  try {
    const raw = localStorage.getItem(FAMILY_STORAGE_KEY);
    if (!raw) return DEFAULT_FAMILY_GOALS;
    const parsed = JSON.parse(raw) as Partial<FamilyGoalState>;
    return {
      ...DEFAULT_FAMILY_GOALS,
      ...parsed,
      members: Array.isArray(parsed.members) && parsed.members.length > 0
        ? parsed.members
        : DEFAULT_FAMILY_GOALS.members,
    };
  } catch {
    return DEFAULT_FAMILY_GOALS;
  }
}

function detectDevice24Hour(): boolean {
  try {
    const resolved = new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions();
    return resolved.hourCycle === 'h23' || resolved.hourCycle === 'h24';
  } catch {
    return false;
  }
}

function resolveAutoLanguage(): Language {
  try {
    const navLang = (navigator.language || 'bn').toLowerCase();
    return navLang.startsWith('bn') ? 'bn' : 'en';
  } catch {
    return 'bn';
  }
}

interface SettingsContextValue {
  settings: AppSettings;
  resolvedLang: Language;
  use24Hour: boolean;
  resolvedTheme: 'light' | 'dark';
  familyGoals: FamilyGoalState;
  updateSettings: (patch: Partial<AppSettings>) => void;
  setLanguagePref: (pref: LanguagePref) => void;
  toggleLanguageQuick: () => void;
  setPrayerMethod: (method: PrayerMethodId) => void;
  setAdhanVoice: (voice: AdhanVoiceId) => void;
  setTimeFormat: (fmt: TimeFormatPref) => void;
  setTheme: (theme: ThemePref) => void;
  setAccentColor: (color: AccentColorId) => void;
  toggleTodayExcused: (dateKey: string) => void;
  isDateExcused: (dateKey: string) => boolean;
  updateFamilyGoals: (patch: Partial<FamilyGoalState>) => void;
  incrementFamilyDhikr: (delta: number) => void;
  incrementFamilyJuz: (delta: number) => void;
  addFamilyMember: (name: string, role?: string) => void;
  resetAllSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => readStoredSettings());
  const [familyGoals, setFamilyGoals] = useState<FamilyGoalState>(() => readStoredFamilyGoals());
  const [systemDark, setSystemDark] = useState<boolean>(() => {
    try {
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      const mql = window.matchMedia?.('(prefers-color-scheme: dark)');
      if (!mql) return;
      const listener = (e: MediaQueryListEvent) => setSystemDark(e.matches);
      mql.addEventListener('change', listener);
      return () => mql.removeEventListener('change', listener);
    } catch {
      return undefined;
    }
  }, []);

  const persistSettings = useCallback((next: AppSettings) => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const persistFamily = useCallback((next: FamilyGoalState) => {
    try {
      localStorage.setItem(FAMILY_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        persistSettings(next);
        return next;
      });
    },
    [persistSettings]
  );

  const resolvedLang: Language = useMemo(() => {
    if (settings.languagePref === 'auto') return resolveAutoLanguage();
    return settings.languagePref;
  }, [settings.languagePref]);

  const use24Hour = useMemo(() => {
    if (settings.timeFormat === '24h') return true;
    if (settings.timeFormat === '12h') return false;
    return detectDevice24Hour();
  }, [settings.timeFormat]);

  const resolvedTheme: 'light' | 'dark' = useMemo(() => {
    if (settings.theme === 'system') return systemDark ? 'dark' : 'light';
    return settings.theme;
  }, [settings.theme, systemDark]);

  // Apply root CSS variables & dark theme class dynamically
  useEffect(() => {
    const root = document.documentElement;
    const palette = ACCENT_PALETTES[settings.accentColor] ?? ACCENT_PALETTES.gold;
    root.style.setProperty('--primary', palette.primary);
    root.style.setProperty('--gold', palette.gold);
    root.style.setProperty('--gold-bright', palette.goldBright);
    root.dataset.theme = resolvedTheme;
    root.dataset.accent = settings.accentColor;
    if (resolvedTheme === 'dark') {
      root.classList.add('theme-dark');
    } else {
      root.classList.remove('theme-dark');
    }
  }, [resolvedTheme, settings.accentColor]);

  const toggleTodayExcused = useCallback(
    (dateKey: string) => {
      setSettings((prev) => {
        const exists = prev.excusedDates.includes(dateKey);
        const nextDates = exists
          ? prev.excusedDates.filter((d) => d !== dateKey)
          : [...prev.excusedDates, dateKey].slice(-90);
        const next = { ...prev, excusedDates: nextDates };
        persistSettings(next);
        return next;
      });
    },
    [persistSettings]
  );

  const isDateExcused = useCallback(
    (dateKey: string) =>
      settings.sistersExcusedFeature && settings.excusedDates.includes(dateKey),
    [settings.sistersExcusedFeature, settings.excusedDates]
  );

  const updateFamilyGoals = useCallback(
    (patch: Partial<FamilyGoalState>) => {
      setFamilyGoals((prev) => {
        const next = { ...prev, ...patch };
        persistFamily(next);
        return next;
      });
    },
    [persistFamily]
  );

  const incrementFamilyDhikr = useCallback(
    (delta: number) => {
      setFamilyGoals((prev) => {
        const nextVal = Math.max(0, prev.dailyDhikrCompleted + delta);
        const next = { ...prev, dailyDhikrCompleted: nextVal };
        persistFamily(next);
        return next;
      });
    },
    [persistFamily]
  );

  const incrementFamilyJuz = useCallback(
    (delta: number) => {
      setFamilyGoals((prev) => {
        const nextVal = Math.max(0, Math.min(30, prev.khatmJuzCompleted + delta));
        const next = { ...prev, khatmJuzCompleted: nextVal };
        persistFamily(next);
        return next;
      });
    },
    [persistFamily]
  );

  const addFamilyMember = useCallback(
    (name: string, role = 'Family Member') => {
      const trimmed = name.trim().slice(0, 60);
      if (!trimmed) return;
      setFamilyGoals((prev) => {
        const next = {
          ...prev,
          members: [
            ...prev.members,
            {
              id: `m_${Date.now()}`,
              name: trimmed,
              role: role.trim().slice(0, 40) || 'Member',
              juzDone: 0,
              dhikrDone: 0,
            },
          ].slice(0, 16),
        };
        persistFamily(next);
        return next;
      });
    },
    [persistFamily]
  );

  const resetAllSettings = useCallback(() => {
    setSettings(DEFAULT_APP_SETTINGS);
    persistSettings(DEFAULT_APP_SETTINGS);
  }, [persistSettings]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        resolvedLang,
        use24Hour,
        resolvedTheme,
        familyGoals,
        updateSettings,
        setLanguagePref: (languagePref) => updateSettings({ languagePref }),
        toggleLanguageQuick: () =>
          updateSettings({ languagePref: resolvedLang === 'bn' ? 'en' : 'bn' }),
        setPrayerMethod: (prayerMethod) => updateSettings({ prayerMethod }),
        setAdhanVoice: (adhanVoice) => updateSettings({ adhanVoice }),
        setTimeFormat: (timeFormat) => updateSettings({ timeFormat }),
        setTheme: (theme) => updateSettings({ theme }),
        setAccentColor: (accentColor) => updateSettings({ accentColor }),
        toggleTodayExcused,
        isDateExcused,
        updateFamilyGoals,
        incrementFamilyDhikr,
        incrementFamilyJuz,
        addFamilyMember,
        resetAllSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used inside SettingsProvider');
  }
  return ctx;
}
