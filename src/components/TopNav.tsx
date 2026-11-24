import type { Language, SectionId } from '../types/islamic';
import crescentMark from '../assets/crescent-moon.svg';

interface TopNavProps {
  lang: Language;
  activeSection: SectionId;
  onNavigate: (section: SectionId) => void;
  onToggleLanguage: () => void;
}

const NAV_ITEMS: Array<{ id: SectionId; bn: string; en: string }> = [
  { id: 'home', bn: 'হোম', en: 'Home' },
  { id: 'quran', bn: 'কুরআন', en: 'Quran' },
  { id: 'namaz', bn: 'নামাজ', en: 'Namaz' },
  { id: 'knowledge', bn: 'জ্ঞানকোষ', en: 'Knowledge' },
  { id: 'mosque-finder', bn: 'মসজিদ', en: 'Mosques' },
  { id: 'hadith', bn: 'হাদিস ও দোয়া', en: 'Hadith & Dua' },
  { id: 'prayer-time', bn: 'ইসলামিক টুলস', en: 'Tools' },
];

export function TopNav({ lang, activeSection, onNavigate, onToggleLanguage }: TopNavProps) {
  const isToolsGroup = [
    'prayer-time',
    'qibla',
    'tasbih',
    'zakat',
    'ramadan',
    'calendar',
    'terrarium',
    'admin',
  ].includes(activeSection);
  const isHadithDuaGroup = activeSection === 'hadith' || activeSection === 'dua';

  return (
    <header className="sticky top-0 z-40 bg-white/95 border-b border-[#dce7e0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-2.5 text-xl font-bold tracking-tight text-[#087653] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#087653] rounded"
        >
          <img
            src={crescentMark}
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
            className="w-6 h-6 rounded-md shrink-0"
          />
          <span>Islamic Life</span>
        </button>

        {/* Zone 2: 5 Concise Single-Line Navigation Links */}
        <nav aria-label="Primary Navigation" className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.id === activeSection ||
              (item.id === 'hadith' && isHadithDuaGroup) ||
              (item.id === 'prayer-time' && isToolsGroup);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'text-[#087653] font-semibold'
                    : 'text-[#183027] hover:text-[#087653]'
                }`}
              >
                {item[lang]}
                {isActive && (
                  <span className="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-[#087653] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Language Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onToggleLanguage}
            data-testid="lang-toggle"
            className="px-4 py-2 text-sm font-semibold text-white bg-[#087653] hover:bg-[#064b37] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {lang === 'bn' ? 'English' : 'বাংলা'}
          </button>
        </div>
      </div>

      {/* Compact single-row mobile nav bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden border-t border-[#eef5f0] px-4 py-2 flex items-center gap-4 overflow-x-auto"
      >
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.id === activeSection ||
            (item.id === 'hadith' && isHadithDuaGroup) ||
            (item.id === 'prayer-time' && isToolsGroup);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`text-xs font-medium whitespace-nowrap shrink-0 py-1 cursor-pointer ${
                isActive ? 'text-[#087653] font-semibold underline underline-offset-4' : 'text-[#5a7066]'
              }`}
            >
              {item[lang]}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
