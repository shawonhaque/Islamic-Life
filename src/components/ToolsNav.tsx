import type { Language, SectionId } from '../types/islamic';

interface ToolsNavProps {
  lang: Language;
  activeSection: SectionId;
  onNavigate: (id: SectionId) => void;
}

const TOOL_TABS: Array<{ id: SectionId; bn: string; en: string }> = [
  { id: 'prayer-time', bn: 'নামাজের সময়', en: 'Prayer Times' },
  { id: 'qibla', bn: 'কিবলা কম্পাস', en: 'Qibla Compass' },
  { id: 'tasbih', bn: 'তাসবিহ', en: 'Tasbih' },
  { id: 'zakat', bn: 'যাকাত', en: 'Zakat' },
  { id: 'ramadan', bn: 'রমজান', en: 'Ramadan' },
  { id: 'calendar', bn: 'হিজরি ক্যালেন্ডার', en: 'Hijri Calendar' },
  { id: 'terrarium', bn: '৩ডি টেরারিয়াম', en: '3D Terrarium' },
  { id: 'admin', bn: 'অ্যাডমিন', en: 'Admin CMS' },
];

export function ToolsNav({ lang, activeSection, onNavigate }: ToolsNavProps) {
  return (
    <div className="bg-white border-b border-[#dce7e0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-1.5 overflow-x-auto">
        {TOOL_TABS.map((t) => {
          const active = activeSection === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onNavigate(t.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                active
                  ? 'bg-[#087653] text-white font-semibold'
                  : 'text-[#5a7066] hover:bg-[#eef5f0] hover:text-[#183027]'
              }`}
            >
              {t[lang]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
