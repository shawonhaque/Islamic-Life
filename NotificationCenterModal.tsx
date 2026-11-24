import { useEffect } from 'react';
import {
  Bell,
  BellOff,
  BellRing,
  BookOpen,
  Clock,
  MoonStar,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type {
  AppNotificationItem,
  Language,
  NotificationSettings,
  PrayerWaqtKey,
  SectionId,
} from '../types/islamic';

interface NotificationCenterModalProps {
  open: boolean;
  lang: Language;
  settings: NotificationSettings;
  permission: NotificationPermission | 'unsupported';
  history: AppNotificationItem[];
  onClose: () => void;
  onUpdateSettings: (updater: (prev: NotificationSettings) => NotificationSettings) => void;
  onTurnOffAll: () => void;
  onRequestPermission: () => Promise<NotificationPermission | 'unsupported'>;
  onTriggerTest: (kind: 'prayer' | 'dua' | 'hadith') => void;
  onClearHistory: () => void;
  onNavigate: (section: SectionId) => void;
}

const WAQT_OPTIONS: { key: PrayerWaqtKey; bn: string; en: string }[] = [
  { key: 'fajr', bn: 'ফজর', en: 'Fajr' },
  { key: 'dhuhr', bn: 'যোহর', en: 'Dhuhr' },
  { key: 'asr', bn: 'আসর', en: 'Asr' },
  { key: 'maghrib', bn: 'মাগরিব', en: 'Maghrib' },
  { key: 'isha', bn: 'এশা', en: 'Isha' },
];

const LEAD_MINUTES: Array<0 | 5 | 10 | 15> = [0, 5, 10, 15];

export function NotificationCenterModal({
  open,
  lang,
  settings,
  permission,
  history,
  onClose,
  onUpdateSettings,
  onTurnOffAll,
  onRequestPermission,
  onTriggerTest,
  onClearHistory,
  onNavigate,
}: NotificationCenterModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const toggleMaster = () => {
    onUpdateSettings((prev) => ({ ...prev, enabled: !prev.enabled }));
  };

  const toggleSound = () => {
    onUpdateSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  const toggleBrowserPush = async () => {
    if (permission !== 'granted') {
      await onRequestPermission();
      return;
    }
    onUpdateSettings((prev) => ({ ...prev, useBrowserPush: !prev.useBrowserPush }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="notif-modal-title"
        data-testid="notification-modal"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] bg-[#faf7f0] rounded-2xl border border-[#ebe6da] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-white border-b border-[#ebe6da] px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                settings.enabled
                  ? 'bg-[#087653] text-white'
                  : 'bg-[#f5efe0] text-[#8f6319]'
              }`}
            >
              {settings.enabled ? <BellRing className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h2
                id="notif-modal-title"
                className="font-display text-lg sm:text-xl font-bold text-[#183027] truncate"
              >
                {lang === 'bn'
                  ? 'দৈনিক রিমাইন্ডার ও নোটিফিকেশন'
                  : 'Daily Reminders & Notifications'}
              </h2>
              <p className="text-xs text-[#5a7066] truncate">
                {lang === 'bn'
                  ? 'নামাজের ওয়াক্ত, দৈনন্দিন দোয়া এবং নির্বাচিত হাদিসের সময় নির্ধারণ করুন।'
                  : 'Customize opt-in reminders for prayer times, daily duas, and featured hadiths.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={lang === 'bn' ? 'বন্ধ করুন' : 'Close dialog'}
            className="p-2 rounded-lg text-[#5a7066] hover:bg-[#f5efe0] hover:text-[#183027] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Master Opt-in & Easy Turn-Off Bar */}
          <div
            className={`rounded-2xl border p-4 transition-colors ${
              settings.enabled
                ? 'bg-[#eef5f0] border-[#087653]/30'
                : 'bg-white border-[#ebe6da]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#183027]">
                    {lang === 'bn' ? 'রিমাইন্ডার সার্ভিস' : 'Reminder Notifications'}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                      settings.enabled
                        ? 'bg-[#087653] text-white'
                        : 'bg-[#ebe6da] text-[#5a7066]'
                    }`}
                  >
                    {settings.enabled
                      ? lang === 'bn'
                        ? 'চালু'
                        : 'Active'
                      : lang === 'bn'
                      ? 'বন্ধ'
                      : 'Off'}
                  </span>
                </div>
                <p className="text-xs text-[#5a7066]">
                  {settings.enabled
                    ? lang === 'bn'
                      ? 'আপনার নির্ধারিত সময় অনুযায়ী রিমাইন্ডার পাঠানো হবে। যেকোনো সময় বন্ধ করতে পারবেন।'
                      : 'Your customized schedule is active. You can pause or turn off all alerts anytime.'
                    : lang === 'bn'
                    ? 'নামাজ, দোয়া ও হাদিসের দৈনিক রিমাইন্ডার পেতে চালু করুন।'
                    : 'Opt in to receive gentle daily reminders for prayers, dua, and hadith.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.enabled}
                  data-testid="notif-master-toggle"
                  onClick={toggleMaster}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    settings.enabled
                      ? 'bg-[#087653] text-white hover:bg-[#065c40]'
                      : 'bg-[#087653] text-white hover:bg-[#065c40]'
                  }`}
                >
                  {settings.enabled
                    ? lang === 'bn'
                      ? 'চালু আছে'
                      : 'Opted In'
                    : lang === 'bn'
                    ? 'রিমাইন্ডার চালু করুন'
                    : 'Enable Reminders'}
                </button>

                {settings.enabled && (
                  <button
                    type="button"
                    data-testid="notif-turn-off-all"
                    onClick={onTurnOffAll}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#d6cfc0] bg-white hover:bg-[#fef2f2] hover:border-[#dc2626]/40 text-xs font-semibold text-[#991b1b] transition-colors cursor-pointer"
                  >
                    <BellOff className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'সব বন্ধ করুন' : 'Turn Off All'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Browser Permission + Sound Controls */}
            <div className="mt-3 pt-3 border-t border-[#dce7e0] flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  data-testid="notif-browser-push-btn"
                  onClick={toggleBrowserPush}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                    permission === 'granted' && settings.useBrowserPush
                      ? 'bg-white border-[#087653] text-[#087653] font-semibold'
                      : 'bg-white border-[#dce7e0] text-[#494e45] hover:border-[#087653]'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>
                    {permission === 'unsupported'
                      ? lang === 'bn'
                        ? 'ইন-অ্যাপ অ্যালার্ট চালু'
                        : 'In-App Alerts Only'
                      : permission === 'denied'
                      ? lang === 'bn'
                        ? 'ব্রাউজার অনুমতি ব্লক (ইন-অ্যাপ সক্রিয়)'
                        : 'Browser Blocked (In-App Active)'
                      : permission === 'granted'
                      ? settings.useBrowserPush
                        ? lang === 'bn'
                          ? 'ব্রাউজার নোটিফিকেশন: চালু'
                          : 'Browser Push: On'
                        : lang === 'bn'
                        ? 'ব্রাউজার নোটিফিকেশন: বন্ধ'
                        : 'Browser Push: Paused'
                      : lang === 'bn'
                      ? 'ব্রাউজার পুশ অনুমতি দিন'
                      : 'Allow Browser Push'}
                  </span>
                </button>

                <button
                  type="button"
                  data-testid="notif-sound-toggle"
                  onClick={toggleSound}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                    settings.soundEnabled
                      ? 'bg-white border-[#b58328] text-[#8f6319] font-semibold'
                      : 'bg-white border-[#dce7e0] text-[#6e7268]'
                  }`}
                >
                  {settings.soundEnabled ? (
                    <Volume2 className="w-3.5 h-3.5" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {lang === 'bn'
                      ? settings.soundEnabled
                        ? 'মৃদু ধ্বনি: চালু'
                        : 'মৃদু ধ্বনি: নিঃশব্দ'
                      : settings.soundEnabled
                      ? 'Chime: On'
                      : 'Chime: Muted'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* 1. Prayer Times Card */}
          <section className="bg-white rounded-2xl border border-[#ebe6da] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#f5efe0] text-[#b58328] flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#183027]">
                    {lang === 'bn' ? 'নামাজের ওয়াক্তের রিমাইন্ডার' : 'Prayer Times Reminders'}
                  </h3>
                  <p className="text-xs text-[#6e7268]">
                    {lang === 'bn'
                      ? 'কোন ওয়াক্তে এবং কত মিনিট আগে সতর্কতা চান নির্বাচন করুন'
                      : 'Choose which prayers notify you and how early'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-testid="notif-test-prayer"
                  onClick={() => onTriggerTest('prayer')}
                  className="px-2.5 py-1 rounded-lg border border-[#ebe6da] bg-[#faf7f0] hover:border-[#b58328] text-xs font-medium text-[#8f6319] cursor-pointer"
                >
                  {lang === 'bn' ? 'টেস্ট অ্যালার্ট' : 'Test Alert'}
                </button>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.prayers.enabled}
                  data-testid="notif-prayers-toggle"
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      enabled: true,
                      prayers: { ...prev.prayers, enabled: !prev.prayers.enabled },
                    }))
                  }
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    settings.prayers.enabled
                      ? 'bg-[#087653] text-white'
                      : 'bg-[#eef5f0] text-[#5a7066]'
                  }`}
                >
                  {settings.prayers.enabled
                    ? lang === 'bn'
                      ? 'চালু'
                      : 'On'
                    : lang === 'bn'
                    ? 'বন্ধ'
                    : 'Off'}
                </button>
              </div>
            </div>

            {settings.prayers.enabled && (
              <div className="pt-2 border-t border-[#f2eee4] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[#494e45]">
                    {lang === 'bn' ? 'রিমাইন্ডারের সময়:' : 'Notify before prayer:'}
                  </span>
                  <div className="inline-flex bg-[#f5efe0] p-0.5 rounded-lg gap-0.5">
                    {LEAD_MINUTES.map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        data-testid={`notif-lead-${mins}`}
                        onClick={() =>
                          onUpdateSettings((prev) => ({
                            ...prev,
                            enabled: true,
                            prayers: { ...prev.prayers, leadMinutes: mins },
                          }))
                        }
                        className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                          settings.prayers.leadMinutes === mins
                            ? 'bg-white text-[#8f6319] font-semibold shadow-xs'
                            : 'text-[#6e7268]'
                        }`}
                      >
                        {mins === 0
                          ? lang === 'bn'
                            ? 'সঠিক সময়ে'
                            : 'At time'
                          : lang === 'bn'
                          ? `${mins} মি. আগে`
                          : `${mins}m early`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  {WAQT_OPTIONS.map((w) => {
                    const active = settings.prayers.waqts[w.key];
                    return (
                      <button
                        key={w.key}
                        type="button"
                        data-testid={`notif-waqt-${w.key}`}
                        onClick={() =>
                          onUpdateSettings((prev) => ({
                            ...prev,
                            enabled: true,
                            prayers: {
                              ...prev.prayers,
                              waqts: {
                                ...prev.prayers.waqts,
                                [w.key]: !prev.prayers.waqts[w.key],
                              },
                            },
                          }))
                        }
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#eef5f0] border-[#087653] text-[#087653]'
                            : 'bg-[#faf7f0] border-[#ebe6da] text-[#8a8679]'
                        }`}
                      >
                        {w[lang]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* 2. Daily Dua + 3. Featured Hadith Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Daily Dua */}
            <section className="bg-white rounded-2xl border border-[#ebe6da] p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#eef5f0] text-[#087653] flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#183027]">
                      {lang === 'bn' ? 'দৈনিক দোয়া' : 'Daily Dua'}
                    </h3>
                    <p className="text-[11px] text-[#6e7268]">
                      {lang === 'bn' ? 'প্রতিদিন একটি মাসনূন দোয়া' : 'One authentic dua daily'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.dailyDua.enabled}
                  data-testid="notif-dua-toggle"
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      enabled: true,
                      dailyDua: { ...prev.dailyDua, enabled: !prev.dailyDua.enabled },
                    }))
                  }
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    settings.dailyDua.enabled
                      ? 'bg-[#087653] text-white'
                      : 'bg-[#eef5f0] text-[#5a7066]'
                  }`}
                >
                  {settings.dailyDua.enabled
                    ? lang === 'bn'
                      ? 'চালু'
                      : 'On'
                    : lang === 'bn'
                    ? 'বন্ধ'
                    : 'Off'}
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#f2eee4]">
                <label
                  htmlFor="notif-dua-time-input"
                  className="text-xs font-medium text-[#494e45]"
                >
                  {lang === 'bn' ? 'সময়:' : 'Time:'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="notif-dua-time-input"
                    data-testid="notif-dua-time"
                    type="time"
                    value={settings.dailyDua.time}
                    disabled={!settings.dailyDua.enabled}
                    onChange={(e) =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        enabled: true,
                        dailyDua: { ...prev.dailyDua, time: e.target.value || '07:30' },
                      }))
                    }
                    className="px-2 py-1 rounded-lg border border-[#dce7e0] bg-[#faf7f0] text-xs font-mono-tabular disabled:opacity-50"
                  />
                  <button
                    type="button"
                    data-testid="notif-test-dua"
                    onClick={() => onTriggerTest('dua')}
                    className="px-2.5 py-1 rounded-lg border border-[#ebe6da] bg-[#faf7f0] hover:border-[#087653] text-xs font-medium text-[#087653] cursor-pointer"
                  >
                    {lang === 'bn' ? 'প্রিভিউ' : 'Test'}
                  </button>
                </div>
              </div>
            </section>

            {/* Featured Hadith */}
            <section className="bg-white rounded-2xl border border-[#ebe6da] p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#f5efe0] text-[#b58328] flex items-center justify-center shrink-0">
                    <MoonStar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#183027]">
                      {lang === 'bn' ? 'নির্বাচিত হাদিস' : 'Featured Hadith'}
                    </h3>
                    <p className="text-[11px] text-[#6e7268]">
                      {lang === 'bn' ? 'প্রতিদিন একটি সহিহ হাদিস' : 'One Sahih narration daily'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.featuredHadith.enabled}
                  data-testid="notif-hadith-toggle"
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      enabled: true,
                      featuredHadith: {
                        ...prev.featuredHadith,
                        enabled: !prev.featuredHadith.enabled,
                      },
                    }))
                  }
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    settings.featuredHadith.enabled
                      ? 'bg-[#087653] text-white'
                      : 'bg-[#eef5f0] text-[#5a7066]'
                  }`}
                >
                  {settings.featuredHadith.enabled
                    ? lang === 'bn'
                      ? 'চালু'
                      : 'On'
                    : lang === 'bn'
                    ? 'বন্ধ'
                    : 'Off'}
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#f2eee4]">
                <label
                  htmlFor="notif-hadith-time-input"
                  className="text-xs font-medium text-[#494e45]"
                >
                  {lang === 'bn' ? 'সময়:' : 'Time:'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="notif-hadith-time-input"
                    data-testid="notif-hadith-time"
                    type="time"
                    value={settings.featuredHadith.time}
                    disabled={!settings.featuredHadith.enabled}
                    onChange={(e) =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        enabled: true,
                        featuredHadith: {
                          ...prev.featuredHadith,
                          time: e.target.value || '13:00',
                        },
                      }))
                    }
                    className="px-2 py-1 rounded-lg border border-[#dce7e0] bg-[#faf7f0] text-xs font-mono-tabular disabled:opacity-50"
                  />
                  <button
                    type="button"
                    data-testid="notif-test-hadith"
                    onClick={() => onTriggerTest('hadith')}
                    className="px-2.5 py-1 rounded-lg border border-[#ebe6da] bg-[#faf7f0] hover:border-[#b58328] text-xs font-medium text-[#8f6319] cursor-pointer"
                  >
                    {lang === 'bn' ? 'প্রিভিউ' : 'Test'}
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Recent Reminders Feed */}
          <section className="bg-white rounded-2xl border border-[#ebe6da] p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#087653]" />
                <h3 className="text-sm font-bold text-[#183027]">
                  {lang === 'bn' ? 'সাম্প্রতিক রিমাইন্ডার' : 'Recent Reminders'}
                </h3>
              </div>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="inline-flex items-center gap-1 text-xs text-[#6e7268] hover:text-[#991b1b] cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'মুছুন' : 'Clear'}</span>
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <p className="text-xs text-[#6e7268] py-3 text-center">
                {lang === 'bn'
                  ? 'এখনো কোনো রিমাইন্ডার আসেনি। উপরের "টেস্ট অ্যালার্ট" দিয়ে দেখতে পারেন।'
                  : 'No reminders triggered yet. Use "Test Alert" above to preview any reminder.'}
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {history.slice(0, 6).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onNavigate(item.targetSection);
                      onClose();
                    }}
                    className="w-full text-left p-3 rounded-xl bg-[#faf7f0] hover:bg-[#f5efe0] border border-[#ebe6da] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#183027]">
                        {lang === 'bn' ? item.titleBn : item.titleEn}
                      </span>
                      {item.meta && (
                        <span className="text-[11px] font-mono-tabular text-[#8f6319]">
                          {item.meta}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#5a7066] mt-1 line-clamp-2">
                      {lang === 'bn' ? item.bodyBn : item.bodyEn}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
