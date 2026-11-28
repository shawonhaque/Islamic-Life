import type { SectionId } from '../types/islamic';

/** Sections that have their own URL. Kept in sync with the SectionId union. */
export const SECTION_IDS: readonly SectionId[] = [
  'home',
  'search',
  'namaz',
  'quran',
  'tafsir',
  'hadith',
  'dua',
  'prayer-time',
  'qibla',
  'tasbih',
  'zakat',
  'ramadan',
  'calendar',
  'hajj-umrah',
  'names-99',
  'terrarium',
  'knowledge',
  'mosque-finder',
  'arabic-learning',
  'ai-studio',
  'settings',
  'admin',
];

const BASE = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

const SURAH_COUNT = 114;

export interface AppRoute {
  section: SectionId;
  surah?: number;
}

/**
 * Reads the section (and, for the reader, the surah) out of a pathname.
 *
 * Unknown paths fall back to the home section so the 404 shell — which Pages
 * serves for anything unlisted — still opens a usable page.
 */
export function parseRoute(pathname: string): AppRoute {
  const rest = pathname.startsWith(BASE)
    ? pathname.slice(BASE.length)
    : pathname.replace(/^\/+/, '');
  const [first, second] = rest.split('/').filter(Boolean);

  const section = SECTION_IDS.find((id) => id === first);
  if (!section) return { section: 'home' };
  if (section !== 'quran' || !second) return { section };

  const surah = Number(second);
  return Number.isInteger(surah) && surah >= 1 && surah <= SURAH_COUNT
    ? { section, surah }
    : { section };
}

/** The URL a section lives at, in the trailing-slash form GitHub Pages serves. */
export function routePath(section: SectionId, surah?: number): string {
  if (section === 'home') return BASE;
  return surah ? `${BASE}${section}/${surah}/` : `${BASE}${section}/`;
}
