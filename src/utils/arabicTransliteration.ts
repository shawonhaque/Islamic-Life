// Curated authentic Bangla & Latin pronunciations for Surah Al-Fatihah, Ayat al-Kursi, and all Short Surahs (93-114)
const CURATED_BN_PRONUNCIATION: Record<string, string> = {
  '1:1': 'বিসমিল্লা-হির রাহমা-নির রাহীম।',
  '1:2': 'আলহামদু লিল্লা-হি রাব্বিল আ-লামীন।',
  '1:3': 'আর-রাহমা-নির রাহীম।',
  '1:4': 'মা-লিকি ইয়াওমিদ্দীন।',
  '1:5': 'ইয়্যা-কা না’বুদু ওয়া ইয়্যা-কা নাসতাঈন।',
  '1:6': 'ইহদিনাস সিরা-তাল মুসতাকীম।',
  '1:7': 'সিরা-তাল্লাযীনা আন’আমতা আলাইহিম, গাইরিল মাগদূবি আলাইহিম ওয়ালাদ দা-ল্লীন।',
  '2:255':
    'আল্লা-হু লা ইলা-হা ইল্লা হুওয়াল হাইয়্যুল কাইয়্যূম; লা তা’খুযুহু সিনাতুওঁ ওয়া লা নাওম; লাহু মা- ফিস সামা-ওয়া-তি ওয়া মা- ফিল আরদ; মান যাল্লাযী ইয়াশফাউ ইনদাহু ইল্লা বিইযনিহ; ইয়া’লামু মা- বাইনা আইদীহিম ওয়া মা- খালফাহুম; ওয়া লা ইউহীতূনা বিশাইইম মিন ইলমিহী ইল্লা বিমা- শা-আ; ওয়াসিআ কুরসিয়্যুহুস সামা-ওয়া-তি ওয়াল আরদ; ওয়া লা ইয়াউদুহু হিফযুহুমা; ওয়া হুওয়াল আলিয়্যুল আযীম।',

  // Surah 93: Ad-Duha
  '93:1': 'ওয়াদ-দুহা।',
  '93:2': 'ওয়াল-লাইলি ইযা সাজা।',
  '93:3': 'মা ওয়াদ্দাআকা রাব্বুকা ওয়া মা কালা।',
  '93:4': 'ওয়ালাল-আ-খিরাতু খাইরুল লাকা মিনাল উলা।',
  '93:5': 'ওয়া লাসাওফা ইউ’তীকা রাব্বুকা ফাতারদা।',
  '93:6': 'আলাম ইয়াজিদকা ইয়াতীমান ফাআ-ওয়া।',
  '93:7': 'ওয়া ওয়াজাদাকা দা-ল্লান ফাহাদা।',
  '93:8': 'ওয়া ওয়াজাদাকা আ-ইলান ফাআগনা।',
  '93:9': 'ফাআম্মাল ইয়াতীমা ফালা তাকহার।',
  '93:10': 'ওয়া আম্মাস সা-ইলা ফালা তানহার।',
  '93:11': 'ওয়া আম্মা বিনি’মাতি রাব্বিকা ফাহাদ্দিস।',

  // Surah 94: Ash-Sharh
  '94:1': 'আলাম নাশরাহ লাকা সাদরাক।',
  '94:2': 'ওয়া ওয়াদা’না আনকা উইযরাক।',
  '94:3': 'আল্লাযী আনকাদা যাহরাক।',
  '94:4': 'ওয়া রাফা’না লাকা যিকরাক।',
  '94:5': 'ফাইন্না মাআল উসরি ইউসরা।',
  '94:6': 'ইন্না মাআল উসরি ইউসরা।',
  '94:7': 'ফাইযা ফারাগতা ফানসাব।',
  '94:8': 'ওয়া ইলা রাব্বিকা ফার্গাব।',

  // Surah 95: At-Tin
  '95:1': 'ওয়াত-তীনি ওয়ায-যাইতূন।',
  '95:2': 'ওয়া তূরি সীনীন।',
  '95:3': 'ওয়া হা-যাল বালাদিল আমীন।',
  '95:4': 'লাকাদ খালাকনাল ইনসা-না ফী আহসানি তাকওয়ীম।',
  '95:5': 'সুম্মা রাদাদনা-হু আসফালা সা-ফিলীন।',
  '95:6': 'ইল্লাল্লাযীনা আ-মানূ ওয়া আমিলুস সা-লিহা-তি ফালাহুম আজরুন গাইরু মামনূন।',
  '95:7': 'ফামা ইউকাযযিবুকা বা’দু বিদ্দীন।',
  '95:8': 'আলাইসাল্লা-হু বিআহকামিল হা-কিমীন।',

  // Surah 97: Al-Qadr
  '97:1': 'ইন্না আনযালনা-হু ফী লাইলাতিল কাদর।',
  '97:2': 'ওয়া মা আদরা-কা মা লাইলাতুল কাদর।',
  '97:3': 'লাইলাতুল কাদরি খাইরুম মিন আলফি শাহর।',
  '97:4': 'তানাযযালুল মালা-ইকাতু ওয়ার-রূহু ফীহা বিইযনি রাব্বিহিম মিন কুল্লি আমর।',
  '97:5': 'সালা-মুন হিয়া হাত্তা মাতলাইল ফাজর।',

  // Surah 99: Az-Zalzalah
  '99:1': 'ইযা যুলযিলাতিল আরদু যিলযা-লাহা।',
  '99:2': 'ওয়া আখরাজাতিল আরদু আসকা-লাহা।',
  '99:3': 'ওয়া কা-লাল ইনসা-নু মা লাহা।',
  '99:4': 'ইয়াওমায়িযিন তুহাদ্দিসু আখবা-রাহা।',
  '99:5': 'বিআন্না রাব্বাকা আওহা লাহা।',
  '99:6': 'ইয়াওমায়িযিঁ ইয়াসদুরুন না-সু আশতা-তাল লিইউরাও আ’মা-লাহুম।',
  '99:7': 'ফামাইঁ ইয়া’মাল মিসকা-লা যাররাতিন খাইরাইঁ ইয়ারাহ।',
  '99:8': 'ওয়া মাইঁ ইয়া’মাল মিসকা-লা যাররাতিন শাররাইঁ ইয়ারাহ।',

  // Surah 100: Al-Adiyat
  '100:1': 'ওয়াল-আ-দিয়া-তি দাবহা।',
  '100:2': 'ফাল-মূরিয়া-তি কাদহা।',
  '100:3': 'ফাল-মুগীরা-তি সুবহা।',
  '100:4': 'ফাআসারনা বিহী নাকআ।',
  '100:5': 'ফাওয়াসাতনা বিহী জামআ।',
  '100:6': 'ইন্নাল ইনসা-না লিরাব্বিহী লাকানূদ।',
  '100:7': 'ওয়া ইন্নাহু আলা যা-লিকা লাশাহীদ।',
  '100:8': 'ওয়া ইন্নাহু লিহুব্বিল খাইরি লাশাদীদ।',
  '100:9': 'আফালা ইয়া’লামু ইযা বু’সিরা মা ফিল কুবূর।',
  '100:10': 'ওয়া হুসসিলা মা ফিস সুদূর।',
  '100:11': 'ইন্না রাব্বাহুম বিহিম ইয়াওমায়িযিল লা-খাবীর।',

  // Surah 101: Al-Qari'ah
  '101:1': 'আল-কা-রিআহ।',
  '101:2': 'মাল-কা-রিআহ।',
  '101:3': 'ওয়া মা আদরা-কা মাল-কা-রিআহ।',
  '101:4': 'ইয়াওমা ইয়াকূনুন না-সু কাল-ফারা-শিল মাবসূস।',
  '101:5': 'ওয়া তাকূনুল জিবালু কাল-ইহনিল মানফূশ।',
  '101:6': 'ফাআম্মা মান সাকুলাত মাওয়া-যীনুহ।',
  '101:7': 'ফাহুওয়া ফী ঈশাতির রা-দিয়াহ।',
  '101:8': 'ওয়া আম্মা মান খাফফাত মাওয়া-যীনুহ।',
  '101:9': 'ফাউম্মুহু হা-ওয়িয়াহ।',
  '101:10': 'ওয়া মা আদরা-কা মা হিয়াহ।',
  '101:11': 'না-রুন হা-মিয়াহ।',

  // Surah 102: At-Takathur
  '102:1': 'আলহা-কুমুত তাকা-সুর।',
  '102:2': 'হাত্তা যুরতুমুল মাকা-বির।',
  '102:3': 'কাল্লা সাওফা তা’লামূন।',
  '102:4': 'সুম্মা কাল্লা সাওফা তা’লামূন।',
  '102:5': 'কাল্লা লাও তা’লামূনা ইলমাল ইয়াকীন।',
  '102:6': 'লাতারাউন্নাল জাহীম।',
  '102:7': 'সুম্মা লাতারাউন্নাহা আইনাল ইয়াকীন।',
  '102:8': 'সুম্মা লাতুসআলুন্না ইয়াওমায়িযিন আনিন নাঈম।',

  // Surah 103: Al-Asr
  '103:1': 'ওয়াল আসর।',
  '103:2': 'ইন্নাল ইনসা-না লাফী খুসর।',
  '103:3': 'ইল্লাল্লাযীনা আ-মানূ ওয়া আমিলুস সা-লিহা-তি ওয়া তাওয়া-সাও বিল হাক্কি ওয়া তাওয়া-সাও বিস সবর।',

  // Surah 104: Al-Humazah
  '104:1': 'ওয়াইলুল লিকুল্লি হুমাযাতিল লুমাযাহ।',
  '104:2': 'আল্লাযী জামাআ মা-লাওঁ ওয়া আদ্দাদাহ।',
  '104:3': 'ইয়াহসাবু আন্না মা-লাহু আখলাদাহ।',
  '104:4': 'কাল্লা লাইউম্বাযান্না ফিল হুতামাহ।',
  '104:5': 'ওয়া মা আদরা-কা মাল হুতামাহ।',
  '104:6': 'না-রুল্লা-হিল মূকাদাহ।',
  '104:7': 'আল্লাতী তাত্তালিউ আলাল আফইদাহ।',
  '104:8': 'ইন্নাহা আলাইহিম মু’সাদাহ।',
  '104:9': 'ফী আমাদিম মুমাদ্দাদাহ।',

  // Surah 105: Al-Fil
  '105:1': 'আলাম তারা কাইফা ফাআলা রাব্বুকা বিআসহা-বিল ফীল।',
  '105:2': 'আলাম ইয়াজ’আল কাইদাহুম ফী তাদলীল।',
  '105:3': 'ওয়া আরসালা আলাইহিম তাইরান আবা-বীল।',
  '105:4': 'তারমীহিম বিহিজা-রাতিম মিন সিজ্জীল।',
  '105:5': 'ফাজাআলাহুম কা’আসফিম মা’কূল।',

  // Surah 106: Quraysh
  '106:1': 'লিইলা-ফি কুরাইশ।',
  '106:2': 'ইলা-ফিহিম রিহলাতাশ শিতা-ই ওয়াস সাইফ।',
  '106:3': 'ফালইয়া’বুদূ রাব্বা হা-যাল বাইত।',
  '106:4': 'আল্লাযী আত’আমাহুম মিন জূ’ইওঁ ওয়া আ-মানাহুম মিন খাওফ।',

  // Surah 107: Al-Ma'un
  '107:1': 'আরাআইতাল্লাযী ইউকাযযিবু বিদ্দীন।',
  '107:2': 'ফাযা-লিকাল্লাযী ইয়াদু’উল ইয়াতীম।',
  '107:3': 'ওয়া লা ইয়াহুদ্দু আলা তাআ-মিল মিসকীন।',
  '107:4': 'ফাওয়াইলুল লিলমুসাল্লীন।',
  '107:5': 'আল্লাযীনা হুম আন সালা-তিহিম সা-হূন।',
  '107:6': 'আল্লাযীনা হুম ইউরা-উন।',
  '107:7': 'ওয়া ইয়ামনাউনাল মা-উন।',

  // Surah 108: Al-Kawthar
  '108:1': 'ইন্না আ’তাইনা-কাল কাউসার।',
  '108:2': 'ফাসাল্লি লিরাব্বিকা ওয়ানহার।',
  '108:3': 'ইন্না শা-নিআকা হুওয়াল আবতার।',

  // Surah 109: Al-Kafirun
  '109:1': 'কুল ইয়া আইয়্যুহাল কা-ফিরূন।',
  '109:2': 'লা আ’বুদু মা- তা’বুদূন।',
  '109:3': 'ওয়া লা আনতুম আ-বিদূনা মা- আ’বুদ।',
  '109:4': 'ওয়া লা আনা আ-বিদুম মা- আবাত্তুম।',
  '109:5': 'ওয়া লা আনতুম আ-বিদূনা মা- আ’বুদ।',
  '109:6': 'লাকুম দীনুকুম ওয়ালিয়া দীন।',

  // Surah 110: An-Nasr
  '110:1': 'ইযা জা-আ নাসরুল্লা-হি ওয়াল ফাতহ।',
  '110:2': 'ওয়া রাআইতান্না-সা ইয়াদখুলূনা ফী দীনিল্লা-হি আফওয়া-জা।',
  '110:3': 'ফাসাব্বিহ বিহামদি রাব্বিকা ওয়াসতাগফিরহু, ইন্নাহু কা-না তাওওয়া-বা।',

  // Surah 111: Al-Masad
  '111:1': 'তাব্বাত ইয়াদা আবী লাহাবিওঁ ওয়া তাব্ব।',
  '111:2': 'মা আগনা আনহু মা-লুহু ওয়া মা- কাসাব।',
  '111:3': 'সাইয়াসলা না-রান যা-তা লাহাব।',
  '111:4': 'ওয়ামরাআতুহু হাম্মা-লাতাল হাতাব।',
  '111:5': 'ফী জীদিহা হাবলুম মিম মাসাদ।',

  // Surah 112: Al-Ikhlas
  '112:1': 'কুল হুওয়াল্লা-হু আহাদ।',
  '112:2': 'আল্লা-হুস সামাদ।',
  '112:3': 'লাম ইয়ালিদ ওয়া লাম ইয়ূলাদ।',
  '112:4': 'ওয়া লাম ইয়াকুল্লাহু কুফুওয়ান আহাদ।',

  // Surah 113: Al-Falaq
  '113:1': 'কুল আউযু বিরাব্বিল ফালাক।',
  '113:2': 'মিন শাররি মা- খালাক।',
  '113:3': 'ওয়া মিন শাররি গা-সিকিন ইযা ওয়াকাব।',
  '113:4': 'ওয়া মিন শাররিন নাফফা-সা-তি ফিল উকাদ।',
  '113:5': 'ওয়া মিন শাররি হা-সিদিন ইযা হাসাদ।',

  // Surah 114: An-Nas
  '114:1': 'কুল আউযু বিরাব্বিন্নাস।',
  '114:2': 'মালিকিন্নাস।',
  '114:3': 'ইলা-হিন্নাস।',
  '114:4': 'মিন শাররিল ওয়াসওয়া-সিল খান্নাস।',
  '114:5': 'আল্লাযী ইউওয়াসউইসু ফী সুদূরিন্নাস।',
  '114:6': 'মিনাল জিন্নাতি ওয়ান্নাস।',
};

const FATHA = '\u064e';
const DAMMA = '\u064f';
const KASRA = '\u0650';
const FATHATAN = '\u064b';
const DAMMATAN = '\u064c';
const KASRATAN = '\u064d';
const SHADDA = '\u0651';
const SUKUN = '\u0652';
const SUPERSCRIPT_ALIF = '\u0670';
const MADDAH = '\u0653';

const HARAKAT_SET = new Set([
  FATHA,
  DAMMA,
  KASRA,
  FATHATAN,
  DAMMATAN,
  KASRATAN,
  SHADDA,
  SUKUN,
  SUPERSCRIPT_ALIF,
  MADDAH,
]);

const SUN_LETTERS = new Set([
  'ت',
  'ث',
  'د',
  'ذ',
  'ر',
  'ز',
  'س',
  'ش',
  'ص',
  'ض',
  'ط',
  'ظ',
  'ل',
  'ن',
]);

const CONS_BN: Record<string, string> = {
  ب: 'ব',
  ت: 'ত',
  ث: 'স',
  ج: 'জ',
  ح: 'হ',
  خ: 'খ',
  د: 'দ',
  ذ: 'য',
  ر: 'র',
  ز: 'য',
  س: 'স',
  ش: 'শ',
  ص: 'স',
  ض: 'দ',
  ط: 'ত',
  ظ: 'য',
  غ: 'গ',
  ف: 'ফ',
  ق: 'ক',
  ك: 'ক',
  ل: 'ল',
  م: 'ম',
  ن: 'ন',
  ه: 'হ',
  ة: 'ত',
};

const VOWEL_BASE_LETTERS = new Set(['ا', 'أ', 'إ', 'آ', 'ٱ', 'ع', 'ء', 'ؤ', 'ئ', 'ى']);

const CONS_EN: Record<string, string> = {
  ا: 'a',
  أ: 'a',
  إ: 'i',
  آ: 'aa',
  ٱ: '',
  ب: 'b',
  ت: 't',
  ث: 'th',
  ج: 'j',
  ح: 'h',
  خ: 'kh',
  د: 'd',
  ذ: 'dh',
  ر: 'r',
  ز: 'z',
  س: 's',
  ش: 'sh',
  ص: 's',
  ض: 'd',
  ط: 't',
  ظ: 'z',
  ع: '‘',
  غ: 'gh',
  ف: 'f',
  ق: 'q',
  ك: 'k',
  ل: 'l',
  م: 'm',
  ن: 'n',
  ه: 'h',
  ة: 'h',
  و: 'w',
  ي: 'y',
  ى: 'a',
  ئ: 'i',
  ؤ: 'u',
  ء: "'",
};

function stripNonArabicLetters(word: string): string {
  return word
    .replace(/[\u06D6-\u06ED\u0610-\u061A\u06E5\u06E6\u0640]/g, '')
    .replace(/[^\u0621-\u065F\u0670-\u0671]/g, '');
}

function stripDiacritics(text: string): string {
  return text.replace(/[\u064B-\u065F\u0670]/g, '');
}

function matchSacredAllahWordBn(cleaned: string): string | null {
  const bare = stripDiacritics(cleaned).replace(/^ٱ/, 'ا');
  const lastChar = cleaned[cleaned.length - 1];
  const caseVowel =
    lastChar === DAMMA ? 'হু' : lastChar === KASRA ? 'হি' : lastChar === FATHA ? 'হা' : 'হ';

  if (bare === 'الله' || bare === 'ٱلله') return `আল্লা-${caseVowel}`;
  if (bare === 'لله') return `লিল্লা-${caseVowel}`;
  if (bare === 'بالله') return `বিল্লা-${caseVowel}`;
  if (bare === 'والله') return `ওয়াল্লা-${caseVowel}`;
  if (bare === 'فالله') return `ফাল্লা-${caseVowel}`;
  if (bare === 'تالله') return `তাল্লা-${caseVowel}`;
  if (bare === 'اللهم') return 'আল্লা-হুম্মা';
  return null;
}

interface ParsedUnit {
  letter: string;
  marks: string[];
}

function parseArabicUnits(cleaned: string): ParsedUnit[] {
  const units: ParsedUnit[] = [];
  for (const ch of Array.from(cleaned)) {
    if (HARAKAT_SET.has(ch)) {
      if (units.length > 0) {
        units[units.length - 1].marks.push(ch);
      }
    } else {
      units.push({ letter: ch, marks: [] });
    }
  }
  return units;
}

function emitVowelSignBn(
  vowel: 'a' | 'aa' | 'i' | 'ii' | 'u' | 'uu' | 'an' | 'in' | 'un' | 'none',
  asIndependent: boolean
): string {
  if (vowel === 'none') return '';
  if (asIndependent) {
    switch (vowel) {
      case 'a':
        return 'আ';
      case 'aa':
        return 'আ-';
      case 'i':
        return 'ই';
      case 'ii':
        return 'ঈ';
      case 'u':
        return 'উ';
      case 'uu':
        return 'ঊ';
      case 'an':
        return 'আন';
      case 'in':
        return 'ইন';
      case 'un':
        return 'উন';
    }
  }
  switch (vowel) {
    case 'a':
      return 'া';
    case 'aa':
      return 'া-';
    case 'i':
      return 'ি';
    case 'ii':
      return 'ী';
    case 'u':
      return 'ু';
    case 'uu':
      return 'ূ';
    case 'an':
      return 'ান';
    case 'in':
      return 'িন';
    case 'un':
      return 'ুন';
  }
}

function extractUnitVowel(
  unit: ParsedUnit,
  nextUnit: ParsedUnit | undefined,
  nextNextUnit: ParsedUnit | undefined
): { vowel: 'a' | 'aa' | 'i' | 'ii' | 'u' | 'uu' | 'an' | 'in' | 'un' | 'none'; consumeNext: boolean } {
  const hasSukun = unit.marks.includes(SUKUN);
  const hasFatha = unit.marks.includes(FATHA);
  const hasSuperAlif = unit.marks.includes(SUPERSCRIPT_ALIF);
  const hasKasra = unit.marks.includes(KASRA);
  const hasDamma = unit.marks.includes(DAMMA);
  const hasFathatan = unit.marks.includes(FATHATAN);
  const hasKasratan = unit.marks.includes(KASRATAN);
  const hasDammatan = unit.marks.includes(DAMMATAN);

  if (hasFathatan) {
    const consumeAlif = nextUnit?.letter === 'ا' && nextUnit.marks.length === 0;
    return { vowel: 'an', consumeNext: consumeAlif };
  }
  if (hasKasratan) return { vowel: 'in', consumeNext: false };
  if (hasDammatan) return { vowel: 'un', consumeNext: false };
  if (hasSukun) return { vowel: 'none', consumeNext: false };

  if (hasSuperAlif) {
    return { vowel: 'aa', consumeNext: false };
  }

  if (hasFatha) {
    if (
      nextUnit &&
      (nextUnit.letter === 'ا' || nextUnit.letter === 'ى') &&
      nextUnit.marks.every((m) => m === MADDAH || m === SUPERSCRIPT_ALIF)
    ) {
      return { vowel: 'aa', consumeNext: true };
    }
    return { vowel: 'a', consumeNext: false };
  }

  if (hasKasra) {
    if (
      nextUnit &&
      nextUnit.letter === 'ي' &&
      (nextUnit.marks.length === 0 || nextUnit.marks.includes(SUKUN)) &&
      !nextUnit.marks.includes(FATHA) &&
      !nextUnit.marks.includes(DAMMA) &&
      !nextUnit.marks.includes(SHADDA)
    ) {
      // Avoid swallowing y if next-next has shadda-independent vowel? Only madd when y has no vowel
      if (!nextNextUnit || nextUnit.marks.length === 0 || nextUnit.marks.includes(SUKUN)) {
        return { vowel: 'ii', consumeNext: true };
      }
    }
    return { vowel: 'i', consumeNext: false };
  }

  if (hasDamma) {
    if (
      nextUnit &&
      nextUnit.letter === 'و' &&
      (nextUnit.marks.length === 0 || nextUnit.marks.includes(SUKUN)) &&
      !nextUnit.marks.includes(FATHA) &&
      !nextUnit.marks.includes(KASRA) &&
      !nextUnit.marks.includes(SHADDA)
    ) {
      return { vowel: 'uu', consumeNext: true };
    }
    return { vowel: 'u', consumeNext: false };
  }

  return { vowel: 'none', consumeNext: false };
}

export function transliterateWordToBangla(word: string): string {
  const cleaned = stripNonArabicLetters(word);
  if (!cleaned) return '';

  const sacred = matchSacredAllahWordBn(cleaned);
  if (sacred) return sacred;

  const units = parseArabicUnits(cleaned);
  if (units.length === 0) return '';

  let out = '';
  let idx = 0;

  // Handle prefixed + definite article: (ب/و/ف/ك/ل)? + (ا/ٱ) + ل + (sun/moon letter)
  const prefixMatch = (() => {
    if (
      units.length >= 3 &&
      (units[0].letter === 'ا' || units[0].letter === 'ٱ') &&
      units[1].letter === 'ل'
    ) {
      return { prefixBn: '', alIndex: 0 };
    }
    if (
      units.length >= 4 &&
      ['ب', 'و', 'ف', 'ك', 'ل'].includes(units[0].letter) &&
      (units[1].letter === 'ا' || units[1].letter === 'ٱ') &&
      units[2].letter === 'ل'
    ) {
      const pMap: Record<string, string> = {
        ب: 'বি',
        و: 'ওয়া',
        ف: 'ফা',
        ك: 'কা',
        ل: 'লি',
      };
      return { prefixBn: pMap[units[0].letter] || '', alIndex: 1 };
    }
    return null;
  })();

  if (prefixMatch) {
    const afterLam = units[prefixMatch.alIndex + 2];
    const lamUnit = units[prefixMatch.alIndex + 1];
    if (
      afterLam &&
      SUN_LETTERS.has(afterLam.letter) &&
      (afterLam.marks.includes(SHADDA) || lamUnit.marks.length === 0)
    ) {
      const sunCons = CONS_BN[afterLam.letter] || '';
      out += prefixMatch.prefixBn
        ? `${prefixMatch.prefixBn}${sunCons}-`
        : `আ${sunCons}-`;
      idx = prefixMatch.alIndex + 2;
    } else if (lamUnit.marks.length === 0 || lamUnit.marks.includes(SUKUN)) {
      out += prefixMatch.prefixBn ? `${prefixMatch.prefixBn}ল-` : 'আল-';
      idx = prefixMatch.alIndex + 2;
    }
  }

  while (idx < units.length) {
    const unit = units[idx];
    const nextUnit = units[idx + 1];
    const nextNextUnit = units[idx + 2];
    const hasShadda = unit.marks.includes(SHADDA);
    const { vowel, consumeNext } = extractUnitVowel(unit, nextUnit, nextNextUnit);

    // Final unvoweled silent Alif after Waw jama'a (e.g., آمنوا)
    if (
      unit.letter === 'ا' &&
      idx === units.length - 1 &&
      vowel === 'none' &&
      idx > 0 &&
      units[idx - 1].letter === 'و'
    ) {
      idx++;
      continue;
    }

    // Madda Alif آ at start or mid-word
    if (unit.letter === 'آ') {
      out += idx === 0 ? 'আ-' : 'আ-';
      idx++;
      continue;
    }

    // Word-initial bare Alif / Wasla without diacritics
    if ((unit.letter === 'ا' || unit.letter === 'ٱ') && vowel === 'none' && !unit.marks.includes(SUKUN)) {
      if (idx === 0) {
        out += 'আ';
      } else if (unit.letter === 'ا') {
        out += 'া';
      }
      idx++;
      continue;
    }

    // Semi-vowel Waw (و)
    if (unit.letter === 'و') {
      if (vowel === 'none') {
        out += hasShadda ? 'উউ' : 'ও';
      } else if (vowel === 'u') {
        out += hasShadda ? 'উউ' : 'উ';
      } else if (vowel === 'uu') {
        out += 'ঊ';
      } else {
        out += (hasShadda ? 'ওয়' : 'ওয়') + emitVowelSignBn(vowel, false);
      }
      idx += consumeNext ? 2 : 1;
      continue;
    }

    // Semi-vowel Ya (ي)
    if (unit.letter === 'ي') {
      if (vowel === 'none') {
        out += hasShadda ? 'ইয়্য' : idx === 0 ? 'ই' : 'ই';
      } else if (vowel === 'u' || vowel === 'uu') {
        out += hasShadda ? `ইয়্য${emitVowelSignBn(vowel, false)}` : vowel === 'uu' ? 'ইয়ূ' : 'ইউ';
      } else if (vowel === 'ii') {
        out += hasShadda ? 'ইয়্যী' : 'ইয়ী';
      } else {
        out += (hasShadda ? 'ইয়্য' : 'ইয়') + emitVowelSignBn(vowel, false);
      }
      idx += consumeNext ? 2 : 1;
      continue;
    }

    // Taa Marbutah at word end
    if (unit.letter === 'ة') {
      if (vowel === 'none' && idx === units.length - 1) {
        out += 'হ';
      } else {
        out += 'ত' + emitVowelSignBn(vowel, false);
      }
      idx += consumeNext ? 2 : 1;
      continue;
    }

    // Vowel base letters: أ إ ء ع ؤ ئ ى ا
    if (VOWEL_BASE_LETTERS.has(unit.letter)) {
      if (unit.letter === 'ع' && vowel === 'none') {
        out += '’';
      } else if (unit.letter === 'ء' && vowel === 'none') {
        out += idx === 0 ? '' : '’';
      } else if (unit.letter === 'ى' && vowel === 'none') {
        out += 'া';
      } else if (unit.letter === 'إ' && vowel === 'none') {
        out += 'ই';
      } else if (vowel !== 'none') {
        out += emitVowelSignBn(vowel, true);
      } else if (idx === 0) {
        out += 'আ';
      }
      idx += consumeNext ? 2 : 1;
      continue;
    }

    // Standard Consonants
    const baseBn = CONS_BN[unit.letter] || '';
    if (baseBn) {
      const doubled = hasShadda ? baseBn + baseBn : baseBn;
      out += doubled + emitVowelSignBn(vowel, false);
    }

    idx += consumeNext ? 2 : 1;
  }

  return out
    .replace(/--+/g, '-')
    .replace(/াা+/g, 'া')
    .replace(/া-া+/g, 'া-')
    .replace(/িী+/g, 'ী')
    .replace(/ুূ+/g, 'ূ');
}

export function transliterateWordToEnglish(word: string): string {
  const cleaned = stripNonArabicLetters(word);
  if (!cleaned) return '';

  const bare = stripDiacritics(cleaned).replace(/^ٱ/, 'ا');
  if (bare === 'الله' || bare === 'ٱلله') return 'Allahu';
  if (bare === 'لله') return 'lillahi';
  if (bare === 'بالله') return 'billahi';
  if (bare === 'والله') return 'wallahi';

  let out = '';
  const chars = Array.from(cleaned);
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === SHADDA) {
      const prevCons = chars[i - 1];
      if (prevCons && CONS_EN[prevCons]) {
        out += CONS_EN[prevCons];
      }
      continue;
    }
    if (ch === FATHA || ch === SUPERSCRIPT_ALIF) {
      out += 'a';
      continue;
    }
    if (ch === KASRA) {
      out += 'i';
      continue;
    }
    if (ch === DAMMA) {
      out += 'u';
      continue;
    }
    if (ch === FATHATAN) {
      out += 'an';
      continue;
    }
    if (ch === DAMMATAN) {
      out += 'un';
      continue;
    }
    if (ch === KASRATAN) {
      out += 'in';
      continue;
    }
    if (ch === SUKUN || ch === MADDAH) continue;
    const mapped = CONS_EN[ch];
    if (mapped) out += mapped;
  }
  return out.replace(/aaa+/g, 'aa');
}

export function getAyahPronunciation(
  arabicText: string,
  surahNumber?: number,
  ayahNumber?: number,
  explicitBn?: string,
  explicitEn?: string
): { bn: string; en: string } {
  const key = surahNumber && ayahNumber ? `${surahNumber}:${ayahNumber}` : '';
  if (explicitBn && explicitEn) {
    return { bn: explicitBn, en: explicitEn };
  }
  if (key && CURATED_BN_PRONUNCIATION[key]) {
    const words = arabicText.trim().split(/\s+/).filter(Boolean);
    const enAuto = explicitEn || words.map(transliterateWordToEnglish).filter(Boolean).join(' ');
    return {
      bn: explicitBn || CURATED_BN_PRONUNCIATION[key],
      en: enAuto,
    };
  }

  const words = arabicText.trim().split(/\s+/).filter(Boolean);
  const bnAuto = explicitBn || words.map(transliterateWordToBangla).filter(Boolean).join(' ');
  const enAuto = explicitEn || words.map(transliterateWordToEnglish).filter(Boolean).join(' ');
  return {
    bn: bnAuto ? `${bnAuto}।` : '',
    en: enAuto,
  };
}

export const SHORT_SURAH_NUMBERS: number[] = [
  1, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112,
  113, 114,
];
