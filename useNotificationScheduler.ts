import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  AppNotificationItem,
  CityLocation,
  Dua,
  Hadith,
  Language,
  NotificationSettings,
  PrayerTimesResult,
  PrayerWaqtKey,
} from '../types/islamic';

const SETTINGS_KEY = 'il_notification_settings';
const HISTORY_KEY = 'il_notification_history';
const DISPATCHED_PREFIX = 'il_notification_dispatched_';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  useBrowserPush: true,
  soundEnabled: true,
  prayers: {
    enabled: true,
    leadMinutes: 0,
    waqts: {
      fajr: true,
      dhuhr: true,
      asr: true,
      maghrib: true,
      isha: true,
    },
  },
  dailyDua: {
    enabled: true,
    time: '07:30',
  },
  featuredHadith: {
    enabled: true,
    time: '13:00',
  },
};

function readSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<NotificationSettings>;
    return {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...parsed,
      prayers: {
        ...DEFAULT_NOTIFICATION_SETTINGS.prayers,
        ...(parsed.prayers ?? {}),
        waqts: {
          ...DEFAULT_NOTIFICATION_SETTINGS.prayers.waqts,
          ...(parsed.prayers?.waqts ?? {}),
        },
      },
      dailyDua: {
        ...DEFAULT_NOTIFICATION_SETTINGS.dailyDua,
        ...(parsed.dailyDua ?? {}),
      },
      featuredHadith: {
        ...DEFAULT_NOTIFICATION_SETTINGS.featuredHadith,
        ...(parsed.featuredHadith ?? {}),
      },
    };
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

function readHistory(): AppNotificationItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 15) : [];
  } catch {
    return [];
  }
}

function getPermissionState(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

function getDayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function parseTimeToMinutes(hhmm: string): number {
  const parts = hhmm.split(':').map(Number);
  if (parts.length !== 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) {
    return -1;
  }
  return parts[0] * 60 + parts[1];
}

const WAQT_LABELS: Record<PrayerWaqtKey, { bn: string; en: string; ar: string }> = {
  fajr: { bn: 'ফজর', en: 'Fajr', ar: 'الفجر' },
  dhuhr: { bn: 'যোহর', en: 'Dhuhr', ar: 'الظهر' },
  asr: { bn: 'আসর', en: 'Asr', ar: 'العصر' },
  maghrib: { bn: 'মাগরিব', en: 'Maghrib', ar: 'المغرب' },
  isha: { bn: 'এশা', en: 'Isha', ar: 'العشاء' },
};

interface UseNotificationSchedulerArgs {
  lang: Language;
  city: CityLocation;
  prayerTimes: PrayerTimesResult;
  duas: Dua[];
  hadiths: Hadith[];
}

export function useNotificationScheduler({
  lang,
  city,
  prayerTimes,
  duas,
  hadiths,
}: UseNotificationSchedulerArgs) {
  const [settings, setSettings] = useState<NotificationSettings>(readSettings);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    getPermissionState
  );
  const [activeToast, setActiveToast] = useState<AppNotificationItem | null>(null);
  const [history, setHistory] = useState<AppNotificationItem[]>(readHistory);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const persistSettings = useCallback((next: NotificationSettings) => {
    setSettings(next);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }, []);

  const updateSettings = useCallback(
    (updater: (prev: NotificationSettings) => NotificationSettings) => {
      setSettings((prev) => {
        const next = updater(prev);
        try {
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    []
  );

  const turnOffAllNotifications = useCallback(() => {
    updateSettings((prev) => ({ ...prev, enabled: false }));
    setActiveToast(null);
  }, [updateSettings]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // ignore
    }
  }, []);

  const requestBrowserPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return 'unsupported' as const;
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        updateSettings((prev) => ({ ...prev, enabled: true, useBrowserPush: true }));
      }
      return result;
    } catch {
      return getPermissionState();
    }
  }, [updateSettings]);

  const playReminderTone = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      [523.25, 659.25].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const startAt = ctx.currentTime + i * 0.14;
        gain.gain.setValueAtTime(0.05, startAt);
        gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startAt);
        osc.stop(startAt + 0.36);
      });
    } catch {
      // ignore audio context errors
    }
  }, []);

  const dispatchNotification = useCallback(
    (item: AppNotificationItem, isTest = false) => {
      setActiveToast(item);
      setHistory((prev) => {
        const next = [item, ...prev].slice(0, 15);
        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });

      if (settings.soundEnabled) {
        playReminderTone();
      }

      if (
        (settings.useBrowserPush || isTest) &&
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        try {
          new Notification(lang === 'bn' ? item.titleBn : item.titleEn, {
            body: lang === 'bn' ? item.bodyBn : item.bodyEn,
          });
        } catch {
          // ignore browser notification failures
        }
      }
    },
    [lang, playReminderTone, settings.soundEnabled, settings.useBrowserPush]
  );

  const triggerTestReminder = useCallback(
    (kind: 'prayer' | 'dua' | 'hadith') => {
      const now = new Date();
      const dayIdx = getDayOfYear(now);
      const id = `preview-${kind}-${Date.now()}`;
      if (kind === 'prayer') {
        const leadTextBn =
          settings.prayers.leadMinutes > 0
            ? `${settings.prayers.leadMinutes} মিনিট পূর্বে`
            : 'সঠিক সময়ে';
        const leadTextEn =
          settings.prayers.leadMinutes > 0
            ? `${settings.prayers.leadMinutes} min before`
            : 'at prayer time';
        dispatchNotification(
          {
            id,
            type: 'prayer',
            titleBn: `নামাজের রিমাইন্ডার · ${city.name_bn}`,
            titleEn: `Prayer Reminder · ${city.name_en}`,
            bodyBn: `পরবর্তী ওয়াক্ত: আসর (${prayerTimes.asr}) — ${leadTextBn} সতর্কতা চালু রয়েছে।`,
            bodyEn: `Upcoming prayer: Asr (${prayerTimes.asr}) — alert active (${leadTextEn}).`,
            meta: `${city.name_en} · ${prayerTimes.asr}`,
            targetSection: 'prayer-time',
            createdAt: now.toISOString(),
          },
          true
        );
        return;
      }
      if (kind === 'dua') {
        const dua = duas[dayIdx % Math.max(1, duas.length)];
        dispatchNotification(
          {
            id,
            type: 'dua',
            titleBn: `আজকের দোয়া · ${dua?.title_bn || 'সকাল-সন্ধ্যা যিকির'}`,
            titleEn: `Daily Dua · ${dua?.title_en || 'Morning Remembrance'}`,
            bodyBn: dua?.meaning_bn || 'আল্লাহর স্মরণে অন্তর প্রশান্ত হয়।',
            bodyEn: dua?.meaning_en || 'In the remembrance of Allah do hearts find peace.',
            arabic: dua?.arabic,
            meta: dua?.reference,
            targetSection: 'dua',
            createdAt: now.toISOString(),
          },
          true
        );
        return;
      }
      const hadith = hadiths[dayIdx % Math.max(1, hadiths.length)];
      dispatchNotification(
        {
          id,
          type: 'hadith',
          titleBn: `আজকের নির্বাচিত হাদিস · ${hadith?.title_bn || 'সহিহ হাদিস'}`,
          titleEn: `Featured Hadith · ${hadith?.title_en || 'Sahih Narration'}`,
          bodyBn: hadith?.translation_bn || 'সর্বোত্তম আমল হলো নিয়মিত সৎকাজ করা।',
          bodyEn: hadith?.translation_en || 'The most beloved deeds to Allah are those done consistently.',
          arabic: hadith?.arabic,
          meta: hadith ? `${hadith.source} #${hadith.hadith_number}` : undefined,
          targetSection: 'hadith',
          createdAt: now.toISOString(),
        },
        true
      );
    },
    [city, dispatchNotification, duas, hadiths, prayerTimes.asr, settings.prayers.leadMinutes]
  );

  // Live scheduler polling every 15 seconds while notifications are enabled
  useEffect(() => {
    if (!settings.enabled) return;

    const checkSchedule = () => {
      const now = new Date();
      const dateKey = now.toISOString().slice(0, 10);
      const storageKey = `${DISPATCHED_PREFIX}${dateKey}`;
      let sentToday: string[] = [];
      try {
        const raw = localStorage.getItem(storageKey);
        sentToday = raw ? JSON.parse(raw) : [];
      } catch {
        sentToday = [];
      }

      const markSent = (tag: string) => {
        if (!sentToday.includes(tag)) {
          sentToday.push(tag);
          try {
            localStorage.setItem(storageKey, JSON.stringify(sentToday));
          } catch {
            // ignore
          }
        }
      };

      const nowMinute = now.getHours() * 60 + now.getMinutes();
      const dayIdx = getDayOfYear(now);

      // 1. Check Prayer Time Reminders
      if (settings.prayers.enabled) {
        const waqts: PrayerWaqtKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        for (const key of waqts) {
          if (!settings.prayers.waqts[key]) continue;
          const tag = `prayer-${key}`;
          if (sentToday.includes(tag)) continue;

          const baseMinute = prayerTimes.minutesMap[key];
          const triggerMinute = (baseMinute - settings.prayers.leadMinutes + 1440) % 1440;
          if (nowMinute === triggerMinute) {
            markSent(tag);
            const label = WAQT_LABELS[key];
            const timeFormatted = prayerTimes[key];
            dispatchNotification({
              id: `${tag}-${dateKey}`,
              type: 'prayer',
              titleBn: `${label.bn} নামাজের সময় · ${city.name_bn}`,
              titleEn: `${label.en} Prayer Reminder · ${city.name_en}`,
              bodyBn:
                settings.prayers.leadMinutes > 0
                  ? `${settings.prayers.leadMinutes} মিনিট পর ${label.bn} (${timeFormatted}) শুরু হবে।`
                  : `${label.bn} ওয়াক্ত (${timeFormatted}) শুরু হয়েছে।`,
              bodyEn:
                settings.prayers.leadMinutes > 0
                  ? `${label.en} (${timeFormatted}) begins in ${settings.prayers.leadMinutes} minutes.`
                  : `It is now time for ${label.en} prayer (${timeFormatted}).`,
              meta: `${label.ar} · ${timeFormatted}`,
              targetSection: 'prayer-time',
              createdAt: now.toISOString(),
            });
          }
        }
      }

      // 2. Check Daily Dua Reminder
      if (settings.dailyDua.enabled && !sentToday.includes('daily-dua') && duas.length > 0) {
        const targetMin = parseTimeToMinutes(settings.dailyDua.time);
        if (targetMin === nowMinute) {
          markSent('daily-dua');
          const dua = duas[dayIdx % duas.length];
          dispatchNotification({
            id: `daily-dua-${dateKey}`,
            type: 'dua',
            titleBn: `আজকের দোয়া · ${dua.title_bn}`,
            titleEn: `Daily Dua · ${dua.title_en}`,
            bodyBn: dua.meaning_bn,
            bodyEn: dua.meaning_en,
            arabic: dua.arabic,
            meta: dua.reference,
            targetSection: 'dua',
            createdAt: now.toISOString(),
          });
        }
      }

      // 3. Check Featured Hadith Reminder
      if (
        settings.featuredHadith.enabled &&
        !sentToday.includes('featured-hadith') &&
        hadiths.length > 0
      ) {
        const targetMin = parseTimeToMinutes(settings.featuredHadith.time);
        if (targetMin === nowMinute) {
          markSent('featured-hadith');
          const hadith = hadiths[dayIdx % hadiths.length];
          dispatchNotification({
            id: `featured-hadith-${dateKey}`,
            type: 'hadith',
            titleBn: `আজকের হাদিস · ${hadith.title_bn}`,
            titleEn: `Featured Hadith · ${hadith.title_en}`,
            bodyBn: hadith.translation_bn,
            bodyEn: hadith.translation_en,
            arabic: hadith.arabic,
            meta: `${hadith.source} #${hadith.hadith_number}`,
            targetSection: 'hadith',
            createdAt: now.toISOString(),
          });
        }
      }
    };

    checkSchedule();
    const timer = window.setInterval(checkSchedule, 15000);
    return () => window.clearInterval(timer);
  }, [city.name_bn, city.name_en, dispatchNotification, duas, hadiths, prayerTimes, settings]);

  return {
    settings,
    permission,
    activeToast,
    history,
    persistSettings,
    updateSettings,
    turnOffAllNotifications,
    clearHistory,
    dismissToast: () => setActiveToast(null),
    requestBrowserPermission,
    triggerTestReminder,
  };
}
