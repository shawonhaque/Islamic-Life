import {
  Bell,
  BellOff,
  BookOpen,
  Bot,
  CalendarDays,
  Clock,
  Coins,
  Compass,
  Languages,
  Library,
  LogIn,
  LogOut,
  Menu,
  MoonStar,
  Plane,
  Repeat,
  ScrollText,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trees,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Language, SectionId } from '../types/islamic';
import crescentMark from '../assets/crescent-moon.svg';

interface SidebarNavProps {
  lang: Language;
  activeSection: SectionId;
  notificationsEnabled: boolean;
  onNavigate: (section: SectionId) => void;
  onToggleLanguage: () => void;
  onOpenNotifications: () => void;
}

interface SidebarItem {
  id: SectionId;
  bn: string;
  en: string;
  icon: typeof Clock;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'home', bn: 'আজকে (Today)', en: 'Today', icon: Clock },
  { id: 'search', bn: 'অনুসন্ধান (Search)', en: 'Search', icon: Search },
  { id: 'quran', bn: 'পবিত্র কুরআন', en: 'Quran', icon: BookOpen },
  { id: 'tafsir', bn: 'তাফসির হাব (১৭ সংস্করণ)', en: 'Tafsir Hub', icon: ScrollText },
  { id: 'arabic-learning', bn: 'আরবি ও কুরআন শিক্ষা', en: 'Arabic & Quran Academy', icon: Languages },
  { id: 'namaz', bn: 'নামাজ শিক্ষা', en: 'Namaz Guide', icon: Sparkles },
  { id: 'knowledge', bn: 'ইসলামিক জ্ঞানকোষ', en: 'Islamic Knowledge', icon: Library },
  { id: 'prayer-time', bn: 'নামাজের সময় ও আজান', en: 'Prayer & Adhan', icon: Clock },
  { id: 'qibla', bn: 'কিবলা ও মসজিদ', en: 'Qibla & Mosques', icon: Compass },
  { id: 'hadith', bn: 'হাদিস ও দোয়া', en: 'Hadith & Duas', icon: MoonStar },
  { id: 'tasbih', bn: 'ডিজিটাল তাসবিহ', en: 'Tasbih', icon: Repeat },
  { id: 'names-99', bn: 'আল্লাহর ৯৯ নাম', en: '99 Names of Allah', icon: Star },
  { id: 'hajj-umrah', bn: 'হজ ও উমরাহ গাইড', en: 'Hajj & Umrah', icon: Plane },
  { id: 'calendar', bn: 'হিজরি তারিখ', en: 'Islamic dates', icon: CalendarDays },
  { id: 'ramadan', bn: 'সেহরি, ইফতার ও রমজান', en: 'Ramadan & Sehri', icon: Clock },
  { id: 'zakat', bn: 'যাকাত হিসাব', en: 'Zakat', icon: Coins },
  { id: 'terrarium', bn: '৩ডি পৃথিবী গ্লোব', en: '3D Earth Globe', icon: Trees },
  { id: 'ai-studio', bn: 'এআই ও ক্লাউড স্টুডিও', en: 'AI & Cloud Hub', icon: Bot },
  { id: 'settings', bn: 'সেটিংস ও অ্যাকাউন্ট', en: 'Settings', icon: SlidersHorizontal },
];

export function SidebarNav({
  lang,
  activeSection,
  notificationsEnabled,
  onNavigate,
  onToggleLanguage,
  onOpenNotifications,
}: SidebarNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, authBusy, signInWithGoogle, signOutUser } = useAuth();

  const handleSelect = (id: SectionId) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  const renderNavList = () => (
    <nav aria-label="Primary Navigation" className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
      {SIDEBAR_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.id === activeSection ||
          (item.id === 'hadith' && activeSection === 'dua') ||
          (item.id === 'home' && activeSection === 'prayer-time') ||
          (item.id === 'settings' && activeSection === 'admin');

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleSelect(item.id)}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-colors text-left cursor-pointer ${
              isActive
                ? 'bg-[#f5efe0] text-[#8f6319] font-semibold'
                : 'text-[#494e45] hover:bg-[#f8f5ec] hover:text-[#1f2421] font-medium'
            }`}
          >
            <Icon
              className={`w-[18px] h-[18px] shrink-0 ${
                isActive ? 'text-[#b58328]' : 'text-[#6e7268]'
              }`}
            />
            <span className="truncate">{item[lang]}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar (GetSunnah-style white rail) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[236px] lg:shrink-0 bg-white border-r border-[#ebe6da] min-h-screen sticky top-0 h-screen">
        {/* Brand Header */}
        <div className="px-4 pt-5 pb-4">
          <button
            type="button"
            onClick={() => handleSelect('home')}
            className="flex items-center gap-3 text-left w-full cursor-pointer group"
          >
            <img
              src={crescentMark}
              alt=""
              aria-hidden="true"
              width={40}
              height={40}
              className="w-10 h-10 rounded-xl shrink-0 shadow-xs"
            />
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-[#1f2421] leading-tight truncate">
                Islamic Life
              </p>
              <p className="text-[11px] text-[#6e7268] leading-tight mt-0.5 truncate">
                {lang === 'bn' ? 'আজ · কুরআন · কিবলা' : 'Today · Quran · Qibla'}
              </p>
            </div>
          </button>
        </div>

        {renderNavList()}

        {/* Sidebar Footer: Google Account + Reminders + Language Switch */}
        <div className="p-3 border-t border-[#f0ece1] space-y-2">
          {user ? (
            <div className="px-3 py-2 rounded-xl border border-[#ebe6da] bg-[#eef5f0] flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#183027] truncate">
                  {user.displayName || user.email}
                </p>
                <p className="text-[10px] text-[#087653] truncate">
                  {lang === 'bn' ? 'ক্লাউড সিঙ্ক সক্রিয়' : 'Account synced'}
                </p>
              </div>
              <button
                type="button"
                onClick={signOutUser}
                disabled={authBusy}
                aria-label={lang === 'bn' ? 'সাইন আউট' : 'Sign out'}
                className="p-1.5 rounded-lg text-[#494e45] hover:bg-white hover:text-[#991b1b] cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              data-testid="sidebar-google-signin"
              onClick={signInWithGoogle}
              disabled={authBusy}
              className="w-full py-2 px-3 rounded-xl bg-[#087653] hover:bg-[#065c40] text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'গুগল সাইন ইন' : 'Google Sign In'}</span>
            </button>
          )}

          <button
            type="button"
            data-testid="sidebar-notifications-btn"
            onClick={onOpenNotifications}
            className="w-full py-2 px-3 rounded-xl border border-[#ebe6da] bg-[#faf7f0] hover:bg-[#f5efe0] text-xs font-semibold text-[#1f2421] flex items-center justify-between transition-colors cursor-pointer"
          >
            <span className="inline-flex items-center gap-2 text-[#494e45]">
              {notificationsEnabled ? (
                <Bell className="w-3.5 h-3.5 text-[#087653]" />
              ) : (
                <BellOff className="w-3.5 h-3.5 text-[#8a8679]" />
              )}
              <span>{lang === 'bn' ? 'রিমাইন্ডার' : 'Reminders'}</span>
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                notificationsEnabled
                  ? 'bg-[#087653] text-white'
                  : 'bg-[#ebe6da] text-[#5a7066]'
              }`}
            >
              {notificationsEnabled ? (lang === 'bn' ? 'চালু' : 'ON') : lang === 'bn' ? 'বন্ধ' : 'OFF'}
            </span>
          </button>

          <button
            type="button"
            data-testid="lang-toggle"
            onClick={onToggleLanguage}
            className="w-full py-2 px-3 rounded-xl border border-[#ebe6da] bg-[#faf7f0] hover:bg-[#f5efe0] text-xs font-semibold text-[#1f2421] flex items-center justify-between transition-colors cursor-pointer"
          >
            <span className="text-[#6e7268]">
              {lang === 'bn' ? 'ভাষা / Language' : 'Language / ভাষা'}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#0f5c43] text-white">
              {lang === 'bn' ? 'English' : 'বাংলা'}
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar & Slide-out Drawer */}
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-[#ebe6da] px-4 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label={lang === 'bn' ? 'মেনু খুলুন' : 'Open menu'}
            className="p-2 -ml-2 rounded-lg text-[#1f2421] hover:bg-[#f5efe0] cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => handleSelect('home')}
            className="flex items-center gap-2 text-left cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0f3d2e] flex items-center justify-center text-[#d4a84f] shrink-0">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <path d="M12.5 2.5a9.5 9.5 0 1 0 8.7 13.3 7.8 7.8 0 0 1-8.7-13.3Z" />
              </svg>
            </div>
            <span className="font-bold text-base text-[#1f2421]">Islamic Life</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <button
              type="button"
              onClick={signOutUser}
              aria-label={lang === 'bn' ? 'সাইন আউট' : 'Sign out'}
              className="p-2 rounded-lg bg-[#eef5f0] border border-[#087653]/30 text-[#087653] cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={signInWithGoogle}
              aria-label={lang === 'bn' ? 'গুগল সাইন ইন' : 'Google Sign In'}
              className="p-2 rounded-lg bg-[#087653] text-white cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            data-testid="mobile-notifications-btn"
            onClick={onOpenNotifications}
            aria-label={lang === 'bn' ? 'রিমাইন্ডার সেটিংস' : 'Notification settings'}
            className={`p-2 rounded-lg border cursor-pointer ${
              notificationsEnabled
                ? 'bg-[#eef5f0] border-[#087653]/40 text-[#087653]'
                : 'bg-[#faf7f0] border-[#ebe6da] text-[#6e7268]'
            }`}
          >
            {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onToggleLanguage}
            className="px-3 py-1.5 rounded-lg bg-[#0f5c43] text-white text-xs font-semibold cursor-pointer"
          >
            {lang === 'bn' ? 'English' : 'বাংলা'}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col shadow-xl">
            <div className="px-4 py-4 border-b border-[#ebe6da] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0f3d2e] flex items-center justify-center text-[#d4a84f]">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                    <path d="M12.5 2.5a9.5 9.5 0 1 0 8.7 13.3 7.8 7.8 0 0 1-8.7-13.3Z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-sm text-[#1f2421]">Islamic Life</p>
                  <p className="text-[11px] text-[#6e7268]">
                    {lang === 'bn' ? 'আজ · কুরআন · কিবলা' : 'Today · Quran · Qibla'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label={lang === 'bn' ? 'মেনু বন্ধ করুন' : 'Close menu'}
                className="p-2 rounded-lg text-[#6e7268] hover:bg-[#f5efe0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderNavList()}
          </aside>
        </div>
      )}
    </>
  );
}
