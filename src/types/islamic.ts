export type Language = 'bn' | 'en';

export type SectionId =
  | 'home'
  | 'search'
  | 'namaz'
  | 'quran'
  | 'tafsir'
  | 'hadith'
  | 'dua'
  | 'prayer-time'
  | 'qibla'
  | 'tasbih'
  | 'zakat'
  | 'ramadan'
  | 'calendar'
  | 'hajj-umrah'
  | 'names-99'
  | 'terrarium'
  | 'knowledge'
  | 'arabic-learning'
  | 'ai-studio'
  | 'settings'
  | 'admin';

export interface Surah {
  id: number;
  surah_number: number;
  name_ar: string;
  name_bn: string;
  name_en: string;
  meaning_bn: string;
  meaning_en: string;
  revelation_type: 'Makki' | 'Madani';
  total_ayahs: number;
}

export interface Ayah {
  id: number;
  surah_id: number;
  ayah_number: number;
  arabic: string;
  translation_bn: string;
  translation_en: string;
  transliteration_bn?: string;
  transliteration_en?: string;
  short_tafsir_bn?: string;
  short_tafsir_en?: string;
  tafsir_bn?: string;
  tafsir_en?: string;
}

export interface SurahDetailResponse {
  surah_number: number;
  total_ayahs: number;
  ayahs: Ayah[];
}

export interface AyahDetailResponse {
  surah_number: number;
  total_ayahs: number;
  ayah: Ayah;
}

export interface QuranReciter {
  id: string;
  name_en: string;
  name_bn: string;
  style: string;
}

export interface AyahAudioTrack {
  number: number;
  numberInSurah: number;
  audio: string;
  audioSecondary?: string[];
}

export interface LastReadBookmark {
  surahNumber: number;
  nameEn: string;
  nameBn: string;
  nameAr?: string;
  ayah: number;
  updatedAt?: string;
}

export interface Hadith {
  id: number;
  title_bn: string;
  title_en: string;
  category: string;
  arabic: string;
  translation_bn: string;
  translation_en: string;
  source: string;
  hadith_number: string;
}

export interface Dua {
  id: number;
  category: string;
  title_bn: string;
  title_en: string;
  arabic: string;
  pronunciation_bn: string;
  pronunciation_en: string;
  meaning_bn: string;
  meaning_en: string;
  reference: string;
}

export interface NamazWaqt {
  id: string;
  name_bn: string;
  name_en: string;
  time_hint_bn: string;
  time_hint_en: string;
  sunnah_before: number;
  fard: number;
  sunnah_after: number;
  nafl: number;
  witr: number;
  total: number;
}

export interface NamazStep {
  step: number;
  title_bn: string;
  title_en: string;
  description_bn: string;
  description_en: string;
  arabic?: string;
  pronunciation?: string;
  meaning_bn?: string;
  meaning_en?: string;
}

export interface PrayerNiyyah {
  id: string;
  title_bn: string;
  title_en: string;
  rakat_note_bn: string;
  rakat_note_en: string;
  arabic: string;
  pronunciation_bn: string;
  pronunciation_en: string;
  meaning_bn: string;
  meaning_en: string;
}

export interface PrayerRuleDifference {
  posture_bn: string;
  posture_en: string;
  men_bn: string;
  men_en: string;
  women_bn: string;
  women_en: string;
  reference: string;
}

export interface FardWajibSunnahItem {
  category: 'fard-outside' | 'fard-inside' | 'wajib' | 'sunnah';
  title_bn: string;
  title_en: string;
  detail_bn: string;
  detail_en: string;
}

export interface PurificationGuide {
  id: 'ghusl' | 'tayammum';
  title_bn: string;
  title_en: string;
  subtitle_bn: string;
  subtitle_en: string;
  fard_bn: string[];
  fard_en: string[];
  steps_bn: string[];
  steps_en: string[];
}

export interface AllahName {
  number: number;
  arabic: string;
  transliteration_bn: string;
  transliteration_en: string;
  meaning_bn: string;
  meaning_en: string;
  reflection_bn: string;
  reflection_en: string;
}

export interface HajjUmrahStep {
  step: number;
  type: 'umrah' | 'hajj';
  day_bn: string;
  day_en: string;
  title_bn: string;
  title_en: string;
  description_bn: string;
  description_en: string;
  dua_ar?: string;
  dua_pronunciation_bn?: string;
  dua_meaning_bn?: string;
  dua_meaning_en?: string;
}

export type TafsirEditionLanguage = 'ar' | 'bn' | 'en';

export type TafsirViewTab =
  | 'all'
  | 'by-surah'
  | 'by-ayah'
  | 'bn'
  | 'en'
  | 'ar'
  | 'thematic'
  | 'search';

export interface TafsirEdition {
  id: string;
  language: TafsirEditionLanguage;
  name_bn: string;
  name_en: string;
  name_ar: string;
  author_bn: string;
  author_en: string;
  methodology_bn: string;
  methodology_en: string;
  apiSlug?: string;
}

export interface ThematicTafsirTopic {
  id: string;
  title_bn: string;
  title_en: string;
  summary_bn: string;
  summary_en: string;
  verses: Array<{
    surahNumber: number;
    ayahNumber: number;
    note_bn: string;
    note_en: string;
  }>;
}

export interface TafsirReadResponse {
  edition: TafsirEdition;
  surah_number: number;
  ayah_number: number;
  arabic: string;
  translation_bn: string;
  translation_en: string;
  commentary: string;
  sourceMode: 'live-api' | 'local-scholar';
  short_tafsir_bn?: string;
  short_tafsir_en?: string;
}

export interface CityLocation {
  id: string;
  name_bn: string;
  name_en: string;
  country_bn: string;
  country_en: string;
  countryCode?: string;
  region_bn?: string;
  region_en?: string;
  timeZoneId?: string;
  lat: number;
  lng: number;
  tzOffset: number; // hours from UTC
  isLiveGps?: boolean;
}

export interface LiveWeatherInfo {
  temperatureC: number;
  feelsLikeC: number;
  humidity: number;
  windKmh: number;
  weatherCode: number;
  isDay: boolean;
  conditionBn: string;
  conditionEn: string;
  iconKind: 'clear-day' | 'clear-night' | 'partly-cloudy' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'storm';
  timezoneName?: string;
  tzOffsetHours?: number;
  updatedAt: string;
}

export interface PrayerTimesResult {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  sehriEnd: string;
  iftar: string;
  minutesMap: {
    fajr: number;
    sunrise: number;
    dhuhr: number;
    asr: number;
    maghrib: number;
    isha: number;
  };
}

export interface ZakatInput {
  cash: number;
  bankSavings: number;
  goldValue: number;
  silverValue: number;
  investments: number;
  businessInventory: number;
  receivables: number;
  debts: number;
  nisabStandard: 'silver' | 'gold';
  goldNisabValue: number;
  silverNisabValue: number;
}

export interface ZakatResult {
  totalAssets: number;
  totalDebts: number;
  netZakatableWealth: number;
  nisabThreshold: number;
  isEligible: boolean;
  zakatDue: number;
}

export interface HijriDateInfo {
  year: number;
  month: number;
  day: number;
  monthNameEn: string;
  monthNameBn: string;
  monthNameAr: string;
}

export type WeatherMode = 'clear' | 'rain' | 'mist';
export type LightingPreset = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export type CameraPreset = 'overview' | 'flora' | 'soil' | 'fountain' | 'lantern' | 'canopy';

export interface TerrariumPinTelemetry {
  id: 'palm' | 'fountain' | 'soil' | 'lantern' | 'ferns';
  labelBn: string;
  labelEn: string;
  descBn: string;
  descEn: string;
  moisture: string;
  lux: string;
  temp: string;
  roleBn: string;
  roleEn: string;
  cameraPreset: CameraPreset;
}

export interface TerrariumLightingState {
  sunElevation: number;
  sunAzimuth: number;
  sunColorHex: number;
  sunIntensity: number;
  hemiSkyHex: number;
  hemiGroundHex: number;
  hemiIntensity: number;
  bgHex: number;
  fogHex: number;
  starOpacity: number;
  lanternIntensity: number;
  isNight: boolean;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
}

export interface IslamicContentBundle {
  surahs: Surah[];
  ayahs: Ayah[];
  hadiths: Hadith[];
  duas: Dua[];
}

export interface QuranSearchResult {
  surah_number: number;
  surah_name_bn: string;
  surah_name_en: string;
  surah_name_ar: string;
  ayah_number: number;
  arabic: string;
  translation_bn: string;
  translation_en: string;
  short_tafsir_bn?: string;
  short_tafsir_en?: string;
}

export interface GlobalSearchResponse {
  query: string;
  scope: 'all' | 'quran' | 'hadith' | 'dua';
  counts: {
    all: number;
    quran: number;
    hadith: number;
    dua: number;
  };
  surahMatches: Surah[];
  quranResults: QuranSearchResult[];
  hadithResults: Hadith[];
  duaResults: Dua[];
}

export type PrayerWaqtKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface NotificationSettings {
  enabled: boolean;
  useBrowserPush: boolean;
  soundEnabled: boolean;
  prayers: {
    enabled: boolean;
    leadMinutes: 0 | 5 | 10 | 15;
    waqts: Record<PrayerWaqtKey, boolean>;
  };
  dailyDua: {
    enabled: boolean;
    time: string; // HH:MM (24h)
  };
  featuredHadith: {
    enabled: boolean;
    time: string; // HH:MM (24h)
  };
}

export interface AppNotificationItem {
  id: string;
  type: 'prayer' | 'dua' | 'hadith';
  titleBn: string;
  titleEn: string;
  bodyBn: string;
  bodyEn: string;
  arabic?: string;
  meta?: string;
  targetSection: SectionId;
  createdAt: string;
}

export type PrayerMethodId =
  | 'karachi'
  | 'mwl'
  | 'isna'
  | 'umm-al-qura'
  | 'egyptian'
  | 'tehran';

export type TimeFormatPref = 'device' | '12h' | '24h';
export type ThemePref = 'system' | 'light' | 'dark';
export type AccentColorId = 'gold' | 'emerald' | 'sapphire' | 'rose';
export type LanguagePref = 'auto' | 'bn' | 'en';
export type AdhanVoiceId = 'islam-sobhi' | 'mishary' | 'abdul-basit' | 'makkah';

export interface AppSettings {
  prayerMethod: PrayerMethodId;
  adhanVoice: AdhanVoiceId;
  timeFormat: TimeFormatPref;
  languagePref: LanguagePref;
  theme: ThemePref;
  accentColor: AccentColorId;
  sistersExcusedFeature: boolean;
  excusedDates: string[]; // YYYY-MM-DD dates marked as excused (hayd / nifas)
}

export interface FamilyGoalState {
  circleName: string;
  inviteCode: string;
  khatmJuzCompleted: number; // 0..30
  dailyDhikrTarget: number;
  dailyDhikrCompleted: number;
  sharedReminderNote: string;
  members: Array<{
    id: string;
    name: string;
    role: string;
    juzDone: number;
    dhikrDone: number;
  }>;
}

