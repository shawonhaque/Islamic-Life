import type {
  FardWajibSunnahItem,
  HajjUmrahStep,
  PrayerNiyyah,
  PrayerRuleDifference,
  PurificationGuide,
  TafsirEdition,
  ThematicTafsirTopic,
} from '../types/islamic';

export const NAMAZ_NIYYAHS: PrayerNiyyah[] = [
  {
    id: 'fajr',
    title_bn: 'ফজরের ২ রাকাত ফরজ নামাজের নিয়ত',
    title_en: 'Fajr 2 Rakat Fard Niyyah',
    rakat_note_bn: '২ রাকাত সুন্নত · ২ রাকাত ফরজ',
    rakat_note_en: '2 Sunnah · 2 Fard',
    arabic: 'نَوَيْتُ أَنْ أُصَلِّيَ لِلَّهِ تَعَالَى رَكْعَتَيْ صَلَاةِ الْفَجْرِ فَرْضَ اللَّهِ تَعَالَى مُتَوَجِّهًا إِلَى جِهَةِ الْكَعْبَةِ الشَّرِيفَةِ اللَّهُ أَكْبَرُ',
    pronunciation_bn:
      'নাওয়াইতু আন উসাল্লিয়া লিল্লাহি তাআলা রাকআতাই সালাতিল ফাজরি ফারদুল্লাহি তাআলা মুতাওয়াজ্জিহান ইলা জিহাতিল কা’বাতিশ শারীফাতি, আল্লাহু আকবার।',
    pronunciation_en:
      'Nawaytu an usalliya lillahi ta’ala rak’atay salatil-fajri fardullahi ta’ala mutawajjihan ila jihatil-ka’batish-sharifati, Allahu Akbar.',
    meaning_bn:
      'আমি আল্লাহর সন্তুষ্টির উদ্দেশ্যে পবিত্র কাবা শরীফের দিকে মুখ করে ফজরের দুই রাকাত ফরজ নামাজ আদায়ের নিয়ত করলাম, আল্লাহু আকবার।',
    meaning_en:
      'I intend to offer two rakats of Fard Fajr prayer for Allah Almighty, facing the Holy Kaaba, Allahu Akbar.',
  },
  {
    id: 'dhuhr',
    title_bn: 'যোহরের ৪ রাকাত ফরজ নামাজের নিয়ত',
    title_en: 'Dhuhr 4 Rakat Fard Niyyah',
    rakat_note_bn: '৪ সুন্নত · ৪ ফরজ · ২ সুন্নত · ২ নফল',
    rakat_note_en: '4 Sunnah · 4 Fard · 2 Sunnah · 2 Nafl',
    arabic: 'نَوَيْتُ أَنْ أُصَلِّيَ لِلَّهِ تَعَالَى أَرْبَعَ رَكَعَاتِ صَلَاةِ الظُّهْرِ فَرْضَ اللَّهِ تَعَالَى مُتَوَجِّهًا إِلَى جِهَةِ الْكَعْبَةِ الشَّرِيفَةِ اللَّهُ أَكْبَرُ',
    pronunciation_bn:
      'নাওয়াইতু আন উসাল্লিয়া লিল্লাহি তাআলা আরবাআ রাকাআতি সালাতিয যুহরি ফারদুল্লাহি তাআলা মুতাওয়াজ্জিহান ইলা জিহাতিল কা’বাতিশ শারীফাতি, আল্লাহু আকবার।',
    pronunciation_en:
      'Nawaytu an usalliya lillahi ta’ala arba’a raka’ati salatiz-zuhri fardullahi ta’ala mutawajjihan ila jihatil-ka’batish-sharifati, Allahu Akbar.',
    meaning_bn:
      'আমি আল্লাহর সন্তুষ্টির উদ্দেশ্যে কাবা শরীফের দিকে মুখ করে যোহরের চার রাকাত ফরজ নামাজ আদায়ের নিয়ত করলাম, আল্লাহু আকবার।',
    meaning_en:
      'I intend to offer four rakats of Fard Dhuhr prayer for Allah Almighty, facing the Holy Kaaba, Allahu Akbar.',
  },
  {
    id: 'asr',
    title_bn: 'আসরের ৪ রাকাত ফরজ নামাজের নিয়ত',
    title_en: 'Asr 4 Rakat Fard Niyyah',
    rakat_note_bn: '৪ সুন্নত · ৪ ফরজ',
    rakat_note_en: '4 Sunnah · 4 Fard',
    arabic: 'نَوَيْتُ أَنْ أُصَلِّيَ لِلَّهِ تَعَالَى أَرْبَعَ رَكَعَاتِ صَلَاةِ الْعَصْرِ فَرْضَ اللَّهِ تَعَالَى مُتَوَجِّهًا إِلَى جِهَةِ الْكَعْبَةِ الشَّرِيفَةِ اللَّهُ أَكْبَرُ',
    pronunciation_bn:
      'নাওয়াইতু আন উসাল্লিয়া লিল্লাহি তাআলা আরবাআ রাকাআতি সালাতিল আসরি ফারদুল্লাহি তাআলা মুতাওয়াজ্জিহান ইলা জিহাতিল কা’বাতিশ শারীফাতি, আল্লাহু আকবার।',
    pronunciation_en:
      'Nawaytu an usalliya lillahi ta’ala arba’a raka’ati salatil-asri fardullahi ta’ala mutawajjihan ila jihatil-ka’batish-sharifati, Allahu Akbar.',
    meaning_bn:
      'আমি কাবা শরীফের দিকে মুখ করে আল্লাহর উদ্দেশ্যে আসরের চার রাকাত ফরজ নামাজ আদায়ের নিয়ত করলাম, আল্লাহু আকবার।',
    meaning_en:
      'I intend to offer four rakats of Fard Asr prayer for Allah Almighty, facing the Holy Kaaba, Allahu Akbar.',
  },
  {
    id: 'maghrib',
    title_bn: 'মাগরিবের ৩ রাকাত ফরজ নামাজের নিয়ত',
    title_en: 'Maghrib 3 Rakat Fard Niyyah',
    rakat_note_bn: '৩ ফরজ · ২ সুন্নত · ২ নফল',
    rakat_note_en: '3 Fard · 2 Sunnah · 2 Nafl',
    arabic: 'نَوَيْتُ أَنْ أُصَلِّيَ لِلَّهِ تَعَالَى ثَلَاثَ رَكَعَاتِ صَلَاةِ الْمَغْرِبِ فَرْضَ اللَّهِ تَعَالَى مُتَوَجِّهًا إِلَى جِهَةِ الْكَعْبَةِ الشَّرِيفَةِ اللَّهُ أَكْبَرُ',
    pronunciation_bn:
      'নাওয়াইতু আন উসাল্লিয়া লিল্লাহি তাআলা সালাসা রাকাআতি সালাতিল মাগরিবি ফারদুল্লাহি তাআলা মুতাওয়াজ্জিহান ইলা জিহাতিল কা’বাতিশ শারীফাতি, আল্লাহু আকবার।',
    pronunciation_en:
      'Nawaytu an usalliya lillahi ta’ala thalatha raka’ati salatil-maghribi fardullahi ta’ala mutawajjihan ila jihatil-ka’batish-sharifati, Allahu Akbar.',
    meaning_bn:
      'আমি কাবা শরীফের দিকে মুখ করে আল্লাহর উদ্দেশ্যে মাগরিবের তিন রাকাত ফরজ নামাজ আদায়ের নিয়ত করলাম, আল্লাহু আকবার।',
    meaning_en:
      'I intend to offer three rakats of Fard Maghrib prayer for Allah Almighty, facing the Holy Kaaba, Allahu Akbar.',
  },
  {
    id: 'isha',
    title_bn: 'এশার ৪ রাকাত ফরজ ও ৩ রাকাত বিতর নিয়ত',
    title_en: 'Isha 4 Rakat Fard & 3 Witr Niyyah',
    rakat_note_bn: '৪ সুন্নত · ৪ ফরজ · ২ সুন্নত · ৩ বিতর',
    rakat_note_en: '4 Sunnah · 4 Fard · 2 Sunnah · 3 Witr',
    arabic: 'نَوَيْتُ أَنْ أُصَلِّيَ لِلَّهِ تَعَالَى أَرْبَعَ رَكَعَاتِ صَلَاةِ الْعِشَاءِ فَرْضَ اللَّهِ تَعَالَى مُتَوَجِّهًا إِلَى جِهَةِ الْكَعْبَةِ الشَّرِيفَةِ اللَّهُ أَكْبَرُ',
    pronunciation_bn:
      'নাওয়াইতু আন উসাল্লিয়া লিল্লাহি তাআলা আরবাআ রাকাআতি সালাতিল ইশা-ই ফারদুল্লাহি তাআলা মুতাওয়াজ্জিহান ইলা জিহাতিল কা’বাতিশ শারীফাতি, আল্লাহু আকবার।',
    pronunciation_en:
      'Nawaytu an usalliya lillahi ta’ala arba’a raka’ati salatil-isha’i fardullahi ta’ala mutawajjihan ila jihatil-ka’batish-sharifati, Allahu Akbar.',
    meaning_bn:
      'আমি কাবা শরীফের দিকে মুখ করে আল্লাহর উদ্দেশ্যে এশার চার রাকাত ফরজ নামাজ আদায়ের নিয়ত করলাম, আল্লাহু আকবার। (বিতরের ক্ষেত্রে "রাকাআতি সালাতিল বিতরি ওয়াজিবুল্লাহি তাআলা" পড়ুন; নিয়ত অন্তরের সংকল্পেই যথেষ্ট।)',
    meaning_en:
      'I intend to offer four rakats of Fard Isha prayer for Allah Almighty, facing the Holy Kaaba, Allahu Akbar. (Remember: intention is essentially a sincere resolve of the heart.)',
  },
];

export const MEN_WOMEN_PRAYER_RULES: PrayerRuleDifference[] = [
  {
    posture_bn: 'তাকবীরে তাহরীমা ও হাত তোলা',
    posture_en: 'Takbir al-Ihram (Raising Hands)',
    men_bn: 'উভয় হাত কানের লতি পর্যন্ত তুলবেন এবং হাতের তালু কিবলামুখী রাখবেন।',
    men_en: 'Raise both hands up to the earlobes with palms facing Qibla.',
    women_bn: 'উভয় হাত কাঁধ বরাবর তুলবেন এবং চাদর/ওড়নার ভেতর হাত রাখবেন।',
    women_en: 'Raise both hands up to shoulder level while keeping arms modestly covered.',
    reference: 'সুনান আবু দাউদ ও ফিকহে হানাফি',
  },
  {
    posture_bn: 'কিয়ামে হাত বাঁধার নিয়ম',
    posture_en: 'Folding Hands in Qiyam',
    men_bn: 'নাভির নিচে বাম হাতের ওপর ডান হাত রাখবেন (ডান হাতের কনিষ্ঠা ও বৃদ্ধাঙ্গুল দিয়ে বাম কব্জি ধরবেন)।',
    men_en: 'Place right hand over left below the navel, clasping the left wrist lightly.',
    women_bn: 'বুকের ওপর বাম হাতের পিঠের ওপর ডান হাতের তালু স্বাভাবিকভাবে বিছিয়ে রাখবেন।',
    women_en: 'Place the right palm flat on the back of the left hand over the chest.',
    reference: 'মুসান্নাফ ইবনে আবী শায়বা',
  },
  {
    posture_bn: 'রুকু করার পদ্ধতি',
    posture_en: 'Posture in Ruku (Bowing)',
    men_bn: 'পিঠ ও মাথা সম্পূর্ণ সোজা সমান্তরাল রাখবেন, আঙুল ফাঁক করে হাঁটু মজবুতভাবে ধরবেন এবং কনুই পাঁজর থেকে দূরে রাখবেন।',
    men_en: 'Keep back flat and parallel to ground, grip knees firmly with fingers spread, elbows away from ribs.',
    women_bn: 'সামান্য ঝুঁকবেন যাতে হাত হাঁটু পর্যন্ত পৌঁছে, আঙুল মিলিয়ে হাঁটুর ওপর রাখবেন এবং বাহু শরীরের সাথে মিশিয়ে রাখবেন।',
    women_en: 'Bow just enough for hands to reach knees with fingers together and arms close to the sides.',
    reference: 'সুনান আল-বায়হাকী',
  },
  {
    posture_bn: 'সিজদা করার পদ্ধতি',
    posture_en: 'Posture in Sujud (Prostration)',
    men_bn: 'পেট উরু থেকে এবং কনুই জমিন ও পাঁজর থেকে আলাদা রেখে উঁচু করে সিজদা করবেন; পায়ের আঙুল কিবলামুখী থাকবে।',
    men_en: 'Keep stomach raised away from thighs, elbows lifted off the floor and away from sides, toes bent toward Qibla.',
    women_bn: 'শরীর গুটিয়ে, পেট উরুর সাথে এবং কনুই মাটির সাথে বিছিয়ে সিজদা করবেন (পর্দার অধিকতর রক্ষার জন্য)।',
    women_en: 'Draw body compactly together with stomach near thighs and forearms resting gently on the ground.',
    reference: 'মারাসীলে আবী দাউদ',
  },
  {
    posture_bn: 'বৈঠক (তাশাহহুদ ও তাওয়াররুক)',
    posture_en: 'Sitting Posture (Qa’dah)',
    men_bn: 'বাম পা বিছিয়ে তার ওপর বসবেন এবং ডান পা খাড়া রেখে আঙুলগুলো কিবলামুখী করবেন।',
    men_en: 'Sit on the flat left foot while keeping the right foot upright with toes pointing toward Qibla.',
    women_bn: 'বাম নিতম্বের ওপর বসে উভয় পা ডান দিকে বের করে দেবেন (তাওয়াররুক পদ্ধতিতে)।',
    women_en: 'Sit on the left hip with both feet emerging softly toward the right side.',
    reference: 'কিতাবুল আসার ও ফতোয়ায়ে শামী',
  },
  {
    posture_bn: 'আজান, ইকামত ও কিরাত',
    posture_en: 'Adhan, Iqamah & Voice',
    men_bn: 'জামাতে আজান-ইকামত পুরুষ দেবেন এবং মাগরিব, এশা ও ফজরের প্রথম ২ রাকাতে ইমাম উচ্চস্বরে কিরাত পড়বেন।',
    men_en: 'Men call Adhan and Iqamah; Imam recites aloud in Fajr and first two rakats of Maghrib & Isha.',
    women_bn: 'মহিলাদের জন্য আজান ও ইকামত নেই এবং তারা সর্বদা অনুচ্চ/নিরব স্বরে কিরাত পড়বেন।',
    women_en: 'Women do not call Adhan or Iqamah and always recite silently in all prayers.',
    reference: 'সহিহ ফিকহ ও হিদায়া',
  },
];

export const FARD_WAJIB_SUNNAH_ITEMS: FardWajibSunnahItem[] = [
  {
    category: 'fard-outside',
    title_bn: '১. শরীর পাক হওয়া',
    title_en: '1. Purity of Body',
    detail_bn: 'হদসে আকবর ও হদসে আসগর (অজু ও গোসলের প্রয়োজনীয় অপবিত্রতা) থেকে পবিত্র থাকা।',
    detail_en: 'Being in a state of ritual purity (Wudu and Ghusl when required).',
  },
  {
    category: 'fard-outside',
    title_bn: '২. কাপড় পাক হওয়া',
    title_en: '2. Purity of Clothing',
    detail_bn: 'পরিহিত পোশাক সকল প্রকার নাজাসাত (অপবিত্রতা) থেকে পবিত্র থাকা।',
    detail_en: 'Garments worn during Salah must be free of physical impurities.',
  },
  {
    category: 'fard-outside',
    title_bn: '৩. নামাজের জায়গা পাক হওয়া',
    title_en: '3. Purity of Prayer Place',
    detail_bn: 'পা, হাঁটু, হাত ও সিজদার স্থান পরিষ্কার ও পাক-পবিত্র হওয়া।',
    detail_en: 'The spot where feet, knees, hands, and forehead touch must be clean.',
  },
  {
    category: 'fard-outside',
    title_bn: '৪. সতর ঢাকা',
    title_en: '4. Covering the Awrah (Satr)',
    detail_bn: 'পুরুষের জন্য নাভি থেকে হাঁটুর নিচ পর্যন্ত এবং মহিলাদের জন্য মুখমণ্ডল, হাতের কব্জি ও পায়ের পাতা ব্যতীত সম্পূর্ণ শরীর ঢাকা।',
    detail_en: 'Men: navel to below knees. Women: entire body except face, hands up to wrists, and feet.',
  },
  {
    category: 'fard-outside',
    title_bn: '৫. কিবলামুখী হওয়া',
    title_en: '5. Facing the Qibla',
    detail_bn: 'পবিত্র কাবা শরীফের দিকে বুক ও মুখ ফিরিয়ে দাঁড়ানো।',
    detail_en: 'Orienting oneself toward the Holy Kaaba in Makkah.',
  },
  {
    category: 'fard-outside',
    title_bn: '৬. ওয়াক্ত হওয়া ও ৭. নিয়ত করা',
    title_en: '6. Proper Time & 7. Intention (Niyyah)',
    detail_bn: 'নির্ধারিত ওয়াক্ত প্রবেশের পর নির্দিষ্ট ওয়াক্তের নামাজের আন্তরিক নিয়ত করা।',
    detail_en: 'Performing the prayer within its prescribed time with sincere intention.',
  },
  {
    category: 'fard-inside',
    title_bn: 'তাকবীরে তাহরীমা ও কিয়াম',
    title_en: 'Takbir al-Ihram & Standing (Qiyam)',
    detail_bn: '"আল্লাহু আকবার" বলে নামাজ শুরু করা এবং সক্ষম হলে দাঁড়িয়ে নামাজ পড়া।',
    detail_en: 'Opening Salah with "Allahu Akbar" and standing upright if physically able.',
  },
  {
    category: 'fard-inside',
    title_bn: 'কিরাত (কুরআন পাঠ), রুকু ও সিজদা',
    title_en: 'Quran Recitation, Ruku & Sujud',
    detail_bn: 'ফরজ নামাজের প্রথম দুই রাকাতে কুরআন পাঠ, প্রতি রাকাতে একবার রুকু এবং দুইবার সিজদা করা।',
    detail_en: 'Reciting Quran in initial rakats, bowing once (Ruku), and prostrating twice (Sujud) per rakat.',
  },
  {
    category: 'fard-inside',
    title_bn: 'শেষ বৈঠক',
    title_en: 'Final Sitting (Qa’dah Akhirah)',
    detail_bn: 'তাশাহহুদ পরিমাণ সময় শেষ রাকাতে বসা (এগুলোর কোনো একটি ছুটে গেলে নামাজ বাতিল হয়)।',
    detail_en: 'Sitting at the end of prayer for the duration of Tashahhud; omitting a Fard invalidates prayer.',
  },
  {
    category: 'wajib',
    title_bn: 'সূরা ফাতিহা পাঠ ও সূরা মিলানো',
    title_en: 'Reciting Surah Al-Fatihah & Another Surah',
    detail_bn: 'প্রতি রাকাতে সূরা ফাতিহা পড়া এবং ফরজের প্রথম ২ রাকাত ও সুন্নত-নফলের সব রাকাতে ফাতিহার পর অন্য সূরা/৩ আয়াত পড়া।',
    detail_en: 'Reciting Al-Fatihah and joining another Surah (in first 2 Fard rakats & all Sunnah/Nafl).',
  },
  {
    category: 'wajib',
    title_bn: 'তা’দীলে আরকান ও প্রথম বৈঠক',
    title_en: 'Composure (Ta’dil al-Arkan) & First Sitting',
    detail_bn: 'রুকু, কাওমা, সিজদা ও জলসায় ধীরস্থিরভাবে বিরতি নেওয়া এবং ৩/৪ রাকাতবিশিষ্ট নামাজে ২ রাকাত পর বসা।',
    detail_en: 'Pausing calmly in every posture and sitting after the 2nd rakat in 3/4 rakat prayers.',
  },
  {
    category: 'wajib',
    title_bn: 'তাশাহহুদ পাঠ, দোয়া কুনুত ও সালাম',
    title_en: 'Tashahhud, Qunut in Witr & Ending Salam',
    detail_bn: 'উভয় বৈঠকে তাশাহহুদ পড়া, বিতরে দোয়া কুনুত পড়া এবং "আসসালামু আলাইকুম" বলে নামাজ শেষ করা। (ভুল হলে সাহু সিজদা ওয়াজিব।)',
    detail_en: 'Reciting Tashahhud, Dua Qunut in Witr, and concluding with Salam. (Unintentional omission requires Sahw Sujud.)',
  },
  {
    category: 'sunnah',
    title_bn: 'হাত তোলা, সানা, আউযুবিল্লাহ ও বিসমিল্লাহ',
    title_en: 'Raising Hands, Sana, Ta’awwudh & Tasmiyah',
    detail_bn: 'তাকবীরে তাহরীমায় হাত তোলা, সানা পাঠ করা ও সূরা ফাতিহার আগে আউযুবিল্লাহ-বিসমিল্লাহ বলা।',
    detail_en: 'Raising hands at Takbir, reciting Sana, and saying A’udhu billah & Bismillah silently.',
  },
  {
    category: 'sunnah',
    title_bn: 'রুকু-সিজদার তাসবিহ ও দোয়া মাসূরা',
    title_en: 'Tasbihat in Ruku/Sujud, Durood & Dua Masura',
    detail_bn: 'রুকু-সিজদায় ৩ বার করে তাসবিহ পড়া, দরূদে ইবরাহীম ও দোয়া মাসূরা পাঠ করা এবং ডান ও বাম দিকে তাকিয়ে সালাম ফিরানো।',
    detail_en: 'Saying Ruku/Sujud tasbih 3x, Durood Ibrahim, Dua Masura, and turning face right/left on Salam.',
  },
];

export const PURIFICATION_GUIDES: PurificationGuide[] = [
  {
    id: 'ghusl',
    title_bn: 'ফরজ ও সুন্নত গোসলের নিয়ম',
    title_en: 'Complete Ghusl (Ritual Bath) Guide',
    subtitle_bn: 'গোসলের ৩টি ফরজ ও সুন্নত পদ্ধতি',
    subtitle_en: '3 Fard acts & Sunnah sequence of Ghusl',
    fard_bn: [
      '১. গড়গড়াসহ ভালোভাবে কুলি করা (রোজা অবস্থায় গড়গড়া করবেন না)।',
      '২. নাকে নরম হাড় পর্যন্ত পানি পৌঁছানো।',
      '৩. সমস্ত শরীর এমনভাবে ধৌত করা যেন একটি পশম পরিমাণ জায়গাও শুকনো না থাকে।',
    ],
    fard_en: [
      '1. Rinsing the mouth thoroughly (avoid deep gargling while fasting).',
      '2. Sniffing water into the nostrils up to the soft bone.',
      '3. Pouring water over the entire body leaving not a single dry spot.',
    ],
    steps_bn: [
      'নিয়ত করে বিসমিল্লাহ বলুন এবং উভয় হাত কব্জি পর্যন্ত ধুয়ে নিন।',
      'শরীরের যেকোনো অংশে বা কাপড়ে নাপাকি থাকলে তা ধুয়ে পরিষ্কার করুন।',
      'নামাজের অজুর মতো সম্পূর্ণ অজু করুন (পায়ের নিচে পানি জমলে শেষে পা ধোবেন)।',
      'প্রথমে মাথায় ৩ বার পানি ঢেলে চুলের গোড়া পর্যন্ত ভিজিয়ে নিন।',
      'অতঃপর ডান কাঁধে ৩ বার এবং বাম কাঁধে ৩ বার পানি ঢেলে সম্পূর্ণ শরীর ভালোভাবে ঘষে ধৌত করুন।',
    ],
    steps_en: [
      'Make intention, say Bismillah, and wash both hands up to the wrists.',
      'Wash the private parts and clean any physical impurity from the body.',
      'Perform a complete Wudu just as for prayer (feet may be washed last if standing in water).',
      'Pour water over the head three times, rubbing to wet all hair roots.',
      'Pour water over the right shoulder three times, then left shoulder three times, washing the whole body thoroughly.',
    ],
  },
  {
    id: 'tayammum',
    title_bn: 'তায়াম্মুমের নিয়ম ও হুকুম',
    title_en: 'Tayammum (Dry Purification) Guide',
    subtitle_bn: 'পানি না পেলে বা ব্যবহারে অক্ষম হলে পবিত্র মাটি দ্বারা পবিত্রতা অর্জন',
    subtitle_en: 'Alternative purification using clean earth when water is unavailable or harmful',
    fard_bn: [
      '১. পবিত্রতা অর্জনের আন্তরিক নিয়ত করা।',
      '২. পবিত্র মাটি বা মাটিজাতীয় বস্তুতে (পাথর, বালি, ধুলাবালি) উভয় হাত রেখে সম্পূর্ণ মুখমণ্ডল মাসেহ করা।',
      '৩. দ্বিতীয়বার হাত রেখে কনুইসহ উভয় হাত মাসেহ করা।',
    ],
    fard_en: [
      '1. Making a clear intention for purification from minor or major impurity.',
      '2. Striking pure earth/stone/dust lightly with both palms and wiping the entire face.',
      '3. Striking a second time and wiping both arms up to and including the elbows.',
    ],
    steps_bn: [
      'কখন তায়াম্মুম বৈধ: এক মাইল (প্রায় ১.৬ কিমি) দূরত্বের মধ্যে পানি না পাওয়া গেলে, অথবা অসুস্থতার কারণে পানি ব্যবহারে ক্ষতির আশঙ্কা থাকলে।',
      'ধাপ ১: বিসমিল্লাহ বলে পবিত্র মাটিতে উভয় হাতের তালু রাখুন এবং অতিরিক্ত ধুলা ঝেড়ে ফেলে মুখমণ্ডল একবার মাসেহ করুন।',
      'ধাপ ২: পুনরায় মাটিতে হাত রেখে ঝেড়ে নিন, তারপর বাম হাত দিয়ে ডান হাত কনুইসহ এবং ডান হাত দিয়ে বাম হাত কনুইসহ মাসেহ করুন।',
      'অজু ভঙ্গের যেকোনো কারণ ঘটলে কিংবা পর্যাপ্ত পানি পাওয়া গেলে তায়াম্মুম ভেঙে যায়।',
    ],
    steps_en: [
      'When permitted: When water is unavailable within ~1.6 km, or when a medical condition prevents water use.',
      'Step 1: Say Bismillah, place both palms gently on pure earth/stone, shake excess dust, and wipe the whole face once.',
      'Step 2: Strike pure earth again, shake off dust, and wipe the right forearm/elbow with the left hand, then left with right.',
      'Tayammum is nullified by anything that breaks Wudu or as soon as usable water becomes available.',
    ],
  },
];

export const ADHAN_DATA = {
  lines: [
    { ar: 'اللَّهُ أَكْبَرُ اللَّهُ أَكْبَرُ', bn: 'আল্লাহু আকবার, আল্লাহু আকবার (২ বার)', en: 'Allah is the Greatest (x2)' },
    { ar: 'أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ', bn: 'আশহাদু আল্লা ইলাহা ইল্লাল্লাহ (২ বার)', en: 'I bear witness none has the right to be worshipped except Allah (x2)' },
    { ar: 'أَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ', bn: 'আশহাদু আন্না মুহাম্মাদার রাসূলুল্লাহ (২ বার)', en: 'I bear witness Muhammad is the Messenger of Allah (x2)' },
    { ar: 'حَيَّ عَلَى الصَّلَاةِ', bn: 'হাইয়্যা আলাস সালাহ (২ বার)', en: 'Come to prayer (x2)' },
    { ar: 'حَيَّ عَلَى الْفَلَاحِ', bn: 'হাইয়্যা আলাল ফালাহ (২ বার)', en: 'Come to success (x2)' },
    { ar: 'اللَّهُ أَكْبَرُ اللَّهُ أَكْبَرُ ۝ لَا إِلَهَ إِلَّا اللَّهُ', bn: 'আল্লাহু আকবার, আল্লাহু আকবার — লা ইলাহা ইল্লাল্লাহ', en: 'Allah is the Greatest — None has the right to be worshipped except Allah' },
  ],
  duaArabic:
    'اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ',
  duaPronunciationBn:
    'আল্লাহুম্মা রাব্বা হাযিহিদ দা’ওয়াতিত তা-ম্মাহ, ওয়াস সালাতিল কা-ইমাহ, আ-তি মুহাম্মাদানিল ওয়াসীলাতা ওয়াল ফাদীলাহ, ওয়াবআসহু মাকামাম মাহমূদানিল্লাযী ওয়াআদতাহ।',
  duaMeaningBn:
    'হে আল্লাহ! এই পরিপূর্ণ আহ্বান এবং আসন্ন নামাজের প্রভু! মুহাম্মাদ (সা.)-কে দান করুন ওয়াসীলা ও সর্বোচ্চ মর্যাদা, এবং তাঁকে অধিষ্ঠিত করুন সেই প্রশংসিত স্থানে (মাকামে মাহমূদে) যার প্রতিশ্রুতি আপনি তাঁকে দিয়েছেন।',
  duaMeaningEn:
    'O Allah, Lord of this perfect call and established prayer, grant Muhammad Al-Wasilah and excellence, and raise him to the praised station You have promised him.',
};

export const TALBIYAH_DATA = {
  arabic: 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ',
  pronunciation_bn:
    'লাব্বাইক আল্লাহুম্মা লাব্বাইক, লাব্বাইকা লা শারীকা লাকা লাব্বাইক। ইন্নাল হামদা ওয়ান নি’মাতা লাকা ওয়াল মুলক, লা শারীকা লাক।',
  pronunciation_en:
    'Labbayk Allahumma labbayk, labbayka la sharika laka labbayk. Innal-hamda wan-ni’mata laka wal-mulk, la sharika lak.',
  meaning_bn:
    'আমি হাজির হে আল্লাহ, আমি হাজির! আপনার কোনো শরীক নেই, আমি হাজির! নিশ্চয়ই সমস্ত প্রশংসা, নেয়ামত ও রাজত্ব আপনারই; আপনার কোনো শরীক নেই।',
  meaning_en:
    'Here I am, O Allah, here I am! Here I am, You have no partner, here I am! Verily all praise, grace, and sovereignty belong to You; You have no partner.',
};

export const HAJJ_UMRAH_STEPS: HajjUmrahStep[] = [
  {
    step: 1,
    type: 'umrah',
    day_bn: 'উমরাহ ধাপ ১',
    day_en: 'Umrah Step 1',
    title_bn: 'মীকাত থেকে ইহরাম ও তালবিয়া পাঠ',
    title_en: 'Ihram at Miqat & Talbiyah',
    description_bn:
      'গোসল ও পরিচ্ছন্ন হয়ে পুরুষগণ সেলাইবিহীন দুই টুকরা সাদা কাপড় এবং মহিলাগণ শালীন পোশাক পরিধান করবেন। দুই রাকাত নফল পড়ে "আল্লাহুম্মা ইন্নী উরীদুল উমরাতা" নিয়ত করে তালবিয়া পড়া শুরু করবেন।',
    description_en:
      'Perform Ghusl, wear Ihram garments before crossing Miqat, pray 2 rakats, make the intention for Umrah, and begin reciting Talbiyah frequently.',
  },
  {
    step: 2,
    type: 'umrah',
    day_bn: 'উমরাহ ধাপ ২',
    day_en: 'Umrah Step 2',
    title_bn: 'তাওয়াফ (কাবা শরীফ ৭ চক্কর প্রদক্ষিণ)',
    title_en: 'Tawaf (7 Circuits around the Kaaba)',
    description_bn:
      'অজু অবস্থায় হাজরে আসওয়াদ (কালো পাথর) বরাবর থেকে বিসমিল্লাহি আল্লাহু আকবার বলে তাওয়াফ শুরু করে কাবা বাম পাশে রেখে ৭ চক্কর সম্পন্ন করুন। এরপর মাকামে ইবরাহীমের পেছনে ২ রাকাত তাওয়াফের নামাজ পড়ুন ও জমজমের পানি পান করুন।',
    description_en:
      'With Wudu, start at the Black Stone (Hajar al-Aswad) keeping the Kaaba on your left, complete 7 anti-clockwise circuits, pray 2 rakats behind Maqam Ibrahim, and drink Zamzam water.',
    dua_ar: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    dua_pronunciation_bn: 'রাব্বানা আতিনা ফিদ-দুনিয়া হাসানাতাও ওয়া ফিল আখিরাতি হাসানাতাও ওয়াকিনা আযাবান-নার।',
    dua_meaning_bn: 'হে আমাদের রব! আমাদের দুনিয়া ও আখিরাতে কল্যাণ দান করুন এবং জাহান্নামের আজাব থেকে রক্ষা করুন।',
    dua_meaning_en: 'Our Lord, grant us good in this world and good in the Hereafter, and protect us from the torment of the Fire.',
  },
  {
    step: 3,
    type: 'umrah',
    day_bn: 'উমরাহ ধাপ ৩',
    day_en: 'Umrah Step 3',
    title_bn: 'সাফা ও মারওয়ার মাঝে সায়ী (৭ বার)',
    title_en: 'Sa’i Between Safa and Marwah (7 Laps)',
    description_bn:
      'সাফা পাহাড়ে উঠে কাবার দিকে ফিরে দোয়া করে মারওয়ার উদ্দেশ্যে হাঁটা শুরু করুন। সবুজ আলোর অংশে পুরুষগণ হালকা দৌড়াবেন (রমল)। সাফা থেকে মারওয়া ১ম চক্কর এবং মারওয়া থেকে সাফায় ৭ম চক্কর শেষ হবে।',
    description_en:
      'Begin at Mount Safa facing the Kaaba and walk to Marwah (Lap 1), returning to Safa (Lap 2) until finishing Lap 7 at Marwah. Men briskly jog between the green markers.',
  },
  {
    step: 4,
    type: 'umrah',
    day_bn: 'উমরাহ ধাপ ৪',
    day_en: 'Umrah Step 4',
    title_bn: 'হলক বা কসর (চুল মুণ্ডন/ছাঁটা)',
    title_en: 'Halq or Taqsir (Shaving/Trimming Hair)',
    description_bn:
      'সায়ী শেষে পুরুষগণ সম্পূর্ণ মাথা মুণ্ডন (হলক — অধিক উত্তম) অথবা সব চুল সমানভাবে ছোট করবেন (কসর)। মহিলাগণ আঙুলের এক কর পরিমাণ চুলের আগা কাটবেন। এর মাধ্যমে উমরাহ সম্পন্ন হয়ে হালাল হবেন।',
    description_en:
      'Men shave the head (Halq, preferred) or trim evenly (Taqsir); women trim about a fingertip length from the ends of their hair. Ihram restrictions then end.',
  },
  {
    step: 1,
    type: 'hajj',
    day_bn: 'হজ — ৮ জিলহজ (তারউইয়াহ)',
    day_en: 'Hajj Day 1 — 8 Dhul Hijjah',
    title_bn: 'ইহরাম ও মিনায় গমন',
    title_en: 'Ihram & Stay in Mina',
    description_bn:
      'হজের নিয়তে ইহরাম বেঁধে মিনার উদ্দেশ্যে রওনা হন। মিনায় যোহর, আসর, মাগরিব, এশা এবং ৯ জিলহজের ফজরের নামাজ আদায় ও রাত্রিযাপন করুন।',
    description_en:
      'Enter Ihram for Hajj and travel to Mina. Pray Dhuhr, Asr, Maghrib, Isha, and Fajr (of 9th) in Mina with shortened 4-rakat prayers.',
  },
  {
    step: 2,
    type: 'hajj',
    day_bn: 'হজ — ৯ জিলহজ (আরাফার দিন)',
    day_en: 'Hajj Day 2 — 9 Dhul Hijjah (Arafah)',
    title_bn: 'আরাফাতের ময়দানে অবস্থান ও মুজদালিফায় রাত্রিযাপন',
    title_en: 'Standing at Arafah & Night at Muzdalifah',
    description_bn:
      'হজের মূল রোকন উকুফে আরাফা। সূর্যাস্ত পর্যন্ত আরাফাতে দোয়া, তওবা ও জিকিরে মশগুল থাকুন। সূর্যাস্তের পর মুজদালিফায় গিয়ে মাগরিব ও এশা একত্রে পড়ে খোলা আকাশের নিচে রাত্রিযাপন করুন এবং পাথর (৭০টি কঙ্কর) সংগ্রহ করুন।',
    description_en:
      'Spend the afternoon in Arafah in earnest Dua & Istighfar (the pinnacle of Hajj). After sunset proceed to Muzdalifah, combine Maghrib & Isha, rest overnight, and collect pebbles.',
  },
  {
    step: 3,
    type: 'hajj',
    day_bn: 'হজ — ১০ জিলহজ (ইয়াওমুন নাহর / ঈদ)',
    day_en: 'Hajj Day 3 — 10 Dhul Hijjah (Eid Day)',
    title_bn: 'রামী, কুরবানি, হলক ও তাওয়াফে ইফাদা (ফরজ তাওয়াফ)',
    title_en: 'Rami al-Aqabah, Qurbani, Halq & Tawaf al-Ifadah',
    description_bn:
      'মিনায় ফিরে বড় জামারায় (জামারাতুল আকাবা) ৭টি কঙ্কর নিক্ষেপ করুন, দমে শোকর (কুরবানি) আদায় করুন, মাথা মুণ্ডন/চুল ছাঁটুন এবং মক্কায় গিয়ে ফরজ তাওয়াফে ইফাদা ও হজের সায়ী সম্পন্ন করুন।',
    description_en:
      'Throw 7 pebbles at Jamarat al-Aqabah, offer Qurbani (Hady), shave/trim hair (first release from Ihram), and perform Tawaf al-Ifadah and Sa’i.',
  },
  {
    step: 4,
    type: 'hajj',
    day_bn: 'হজ — ১১–১২/১৩ জিলহজ (আইয়ামে তাশরীক)',
    day_en: 'Hajj Days 4–5 — 11–13 Dhul Hijjah',
    title_bn: 'তিন জামারায় কঙ্কর নিক্ষেপ ও বিদায়ী তাওয়াফ',
    title_en: 'Stoning All 3 Jamarat & Farewell Tawaf',
    description_bn:
      'মিনায় অবস্থান করে ১১ ও ১২ (ঐচ্ছিক ১৩) জিলহজ যোহরের পর ছোট, মাঝারি ও বড় জামারায় ৭টি করে মোট ২১টি কঙ্কর নিক্ষেপ করুন। মক্কা ত্যাগের পূর্বে তাওয়াফে বিদা (বিদায়ী তাওয়াফ) আদায় করুন।',
    description_en:
      'Stay in Mina and stone all three Jamarat (Small, Medium, Large with 7 pebbles each) after Dhuhr on 11th & 12th (optionally 13th). Conclude with Farewell Tawaf before departing Makkah.',
  },
];

export const TAFSIR_EDITIONS: TafsirEdition[] = [
  // ১. আরবি তাফসির (Arabic Tafsirs)
  {
    id: 'ar-ibn-kathir',
    language: 'ar',
    name_bn: 'তাফসির ইবনে কাসির (আরবি)',
    name_en: 'Tafsir Ibn Kathir (Arabic)',
    name_ar: 'تفسير ابن كثير',
    author_bn: 'ইমাম ইসমাইল ইবনে কাসির (রহ.)',
    author_en: 'Imam Ismail ibn Kathir',
    methodology_bn: 'কুরআন ও সহিহ হাদিস ভিত্তিক প্রামাণ্য তাফসির বিল মা’সূর।',
    methodology_en: 'Classical Tafsir bil-Ma’thur explaining the Quran via Quran, Hadith, and Sahaba narrations.',
    apiSlug: 'ar-tafsir-ibn-kathir',
  },
  {
    id: 'ar-tabari',
    language: 'ar',
    name_bn: 'তাফসির আত-তাবারি (আরবি)',
    name_en: 'Tafsir at-Tabari (Arabic)',
    name_ar: 'تفسير الطبري (جامع البيان)',
    author_bn: 'ইমাম মুহাম্মাদ ইবনে জারির আত-তাবারি (রহ.)',
    author_en: 'Imam Muhammad ibn Jarir at-Tabari',
    methodology_bn: 'সালাফে সালেহীনের সনদসহ সর্বপ্রাচীন ও বৃহত্তম বিশ্বকোষীয় তাফসির।',
    methodology_en: 'Foundational encyclopedic commentary compiling early scholarly isnad-backed interpretations.',
    apiSlug: 'ar-tafsir-al-tabari',
  },
  {
    id: 'ar-qurtubi',
    language: 'ar',
    name_bn: 'তাফসির আল-কুরতুবি (আরবি)',
    name_en: 'Tafsir al-Qurtubi (Arabic)',
    name_ar: 'تفسير القرطبي (الجامع لأحكام القرآن)',
    author_bn: 'ইমাম মুহাম্মাদ ইবনে আহমাদ আল-কুরতুবি (রহ.)',
    author_en: 'Imam Abu Abdullah al-Qurtubi',
    methodology_bn: 'কুরআনের ফিকহি বিধান, আহকাম ও ভাষাগত ব্যাখ্যার অনন্য গ্রন্থ।',
    methodology_en: 'Masterpiece focusing on legal rulings (Ahkam), juristic consensus, and Arabic philology.',
    apiSlug: 'ar-tafseer-al-qurtubi',
  },
  {
    id: 'ar-baghawi',
    language: 'ar',
    name_bn: 'তাফসির আল-বাগাভি (আরবি)',
    name_en: 'Tafsir al-Baghawi (Arabic)',
    name_ar: 'تفسير البغوي (معالم التنزيل)',
    author_bn: 'ইমাম হুসাইন ইবনে মাসউদ আল-বাগাভি (রহ.)',
    author_en: 'Imam al-Husayn al-Baghawi',
    methodology_bn: 'ইসরাঈলী বর্ণনামুক্ত প্রাঞ্জল ও নির্ভরযোগ্য মধ্যম পরিসরের তাফসির।',
    methodology_en: 'Concise, authentic classical commentary filtered of weak narrations.',
    apiSlug: 'ar-tafsir-al-baghawi',
  },
  {
    id: 'ar-jalalayn',
    language: 'ar',
    name_bn: 'তাফসির আল-জালালাইন (আরবি)',
    name_en: 'Tafsir al-Jalalayn (Arabic)',
    name_ar: 'تفسير الجلالين',
    author_bn: 'জালালুদ্দীন আল-মাহাল্লী ও আস-সুয়ূতী (রহ.)',
    author_en: 'Jalal ad-Din al-Mahalli & as-Suyuti',
    methodology_bn: 'শব্দ-থেকে-শব্দ সংক্ষিপ্ত ও প্রাঞ্জল আরবি তাফসির।',
    methodology_en: 'Renowned concise word-by-word linguistic commentary ideal for study.',
    apiSlug: 'ar-tafseer-al-saddi',
  },
  {
    id: 'ar-zilal',
    language: 'ar',
    name_bn: 'তাফসির ফি যিলালিল কুরআন (আরবি)',
    name_en: 'Fi Zilalil Quran (Arabic)',
    name_ar: 'في ظلال القرآن',
    author_bn: 'সাইয়্যেদ কুতুব শহীদ (রহ.)',
    author_en: 'Sayyid Qutb',
    methodology_bn: 'কুরআনের সাহিত্যিক সৌন্দর্য, সামগ্রিক বার্তা ও দাওয়াতি চিন্তার ব্যাখ্যা।',
    methodology_en: 'Literary, thematic, and socio-spiritual reflection in the shade of the Quran.',
  },

  // ২. বাংলা তাফসির (Bangla Tafsirs)
  {
    id: 'bn-ibn-kathir',
    language: 'bn',
    name_bn: 'তাফসির ইবনে কাসির (বাংলা অনুবাদ)',
    name_en: 'Tafsir Ibn Kathir (Bangla)',
    name_ar: 'تفسير ابن كثير - بنغالية',
    author_bn: 'ইমাম ইবনে কাসির (রহ.) · বাংলা অনুবাদ',
    author_en: 'Imam Ibn Kathir (Bangla Edition)',
    methodology_bn: 'সহিহ হাদিস ও তাফসীরে বিল মা’সূরের পূর্ণাঙ্গ বাংলা ভাষ্য।',
    methodology_en: 'Complete Bangla rendering of Imam Ibn Kathir grounded in authentic Hadith.',
    apiSlug: 'bn-tafseer-ibn-e-kaseer',
  },
  {
    id: 'bn-ahsanul-bayan',
    language: 'bn',
    name_bn: 'তাফসির আহসানুল বায়ান',
    name_en: 'Tafsir Ahsanul Bayan (Bangla)',
    name_ar: 'تفسير أحسن البيان',
    author_bn: 'হাফিজ সালাহুদ্দিন ইউসুফ (রহ.)',
    author_en: 'Hafiz Salahuddin Yusuf',
    methodology_bn: 'আকীদা বিশুদ্ধ ও সংক্ষিপ্ত আধুনিক বাংলা ব্যাখ্যা।',
    methodology_en: 'Concise, creed-aligned Bangla commentary beloved across South Asia.',
    apiSlug: 'bn-tafsir-ahsanul-bayaan',
  },
  {
    id: 'bn-fathul-majid',
    language: 'bn',
    name_bn: 'তাফসির ফাতহুল মাজিদ',
    name_en: 'Tafsir Fathul Majid (Bangla)',
    name_ar: 'تفسير فتح المجيد',
    author_bn: 'ইমাম শাওকানী (রহ.) অনুসরণে বাংলা সংস্করণ',
    author_en: 'Based on Imam Shawkani Fath al-Qadir',
    methodology_bn: 'তাওহীদ, ফিকহ ও হাদিসভিত্তিক নির্ভরযোগ্য বাংলা ব্যাখ্যা।',
    methodology_en: 'Detailed Tawhid and narration-focused Quranic commentary.',
  },
  {
    id: 'bn-tafheem',
    language: 'bn',
    name_bn: 'তাফসির তাফহীমুল কুরআন',
    name_en: 'Tafheem-ul-Quran (Bangla)',
    name_ar: 'تفهيم القرآن',
    author_bn: 'মাওলানা আবুল আ’লা মওদূদী (রহ.)',
    author_en: 'Maulana Abul A’la Maududi',
    methodology_bn: 'আধুনিক সমাজ, ইতিহাস ও ইসলামী জীবনদর্শনের আলোকে সমৃদ্ধ বাংলা তাফসির।',
    methodology_en: 'Comprehensive contextual commentary connecting revelation to modern society.',
  },
  {
    id: 'bn-zakariya',
    language: 'bn',
    name_bn: 'তাফসির আবু বকর যাকারিয়া',
    name_en: 'Tafsir Abu Bakr Zakariya (Bangla)',
    name_ar: 'تفسير أبو بكر زكريا',
    author_bn: 'ড. আবু বকর মুহাম্মাদ যাকারিয়া',
    author_en: 'Dr. Abu Bakr Muhammad Zakariya',
    methodology_bn: 'কিং ফাহাদ কুরআন কমপ্লেক্স প্রকাশিত প্রামাণ্য ও সাবলীল বাংলা তাফসির।',
    methodology_en: 'Scholarly King Fahd Complex Bangla translation and Tafsir notes.',
    apiSlug: 'bn-tafsir-abu-bakr-zakaria',
  },
  {
    id: 'bn-maariful-quran',
    language: 'bn',
    name_bn: 'তাফসির মারেফুল কুরআন (বাংলা)',
    name_en: 'Tafsir Ma’ariful Quran (Bangla)',
    name_ar: 'معارف القرآن',
    author_bn: 'মুফতি মুহাম্মাদ শফী (রহ.) · অনুবাদ: মাওলানা মুহিউদ্দীন খান (রহ.)',
    author_en: 'Mufti Muhammad Shafi (Tr. Maulana Muhiuddin Khan)',
    methodology_bn: 'বাংলা ভাষার অন্যতম জনপ্রিয় ফিকহ, আধ্যাত্মিকতা ও হাদিসসমৃদ্ধ তাফসির।',
    methodology_en: 'Classic Hanafi juristic & spiritual commentary widely studied in Bengali.',
  },

  // ৩. ইংরেজি তাফসির (English Tafsirs)
  {
    id: 'en-ibn-kathir',
    language: 'en',
    name_bn: 'তাফসির ইবনে কাসির (English)',
    name_en: 'Tafsir Ibn Kathir',
    name_ar: 'تفسير ابن كثير - إنجليزي',
    author_bn: 'ইমাম ইবনে কাসির (রহ.)',
    author_en: 'Imam Ibn Kathir (Abridged English)',
    methodology_bn: 'ইংরেজি ভাষায় সর্বাধিক পঠিত প্রামাণ্য তাফসির।',
    methodology_en: 'Most widely read classical English Tafsir rooted in Prophetic traditions.',
    apiSlug: 'en-tafisr-ibn-kathir',
  },
  {
    id: 'en-as-sadi',
    language: 'en',
    name_bn: 'তাফসির আস-সাদী (English)',
    name_en: "Tafsir As-Sa'di",
    name_ar: 'تفسير السعدي',
    author_bn: 'শায়খ আবদুর রহমান আস-সাদী (রহ.)',
    author_en: "Shaykh Abdur-Rahman as-Sa'di",
    methodology_bn: 'সহজবোধ্য, হৃদয়স্পর্শী ও শিক্ষণীয় আধ্যাত্মিক তাফসির।',
    methodology_en: 'Clear, uplifting commentary focusing on practical spiritual lessons and Allah’s Names.',
    apiSlug: 'en-tafsir-al-tustari',
  },
  {
    id: 'en-maariful-quran',
    language: 'en',
    name_bn: 'মারেফুল কুরআন (English)',
    name_en: "Ma'ariful Quran",
    name_ar: 'معارف القرآن - إنجليزي',
    author_bn: 'মুফতি মুহাম্মাদ শফী (রহ.)',
    author_en: 'Mufti Muhammad Shafi',
    methodology_bn: 'বিস্তারিত ফিকহি ও সামাজিক নির্দেশনা সম্বলিত ইংরেজি তাফসির।',
    methodology_en: 'Comprehensive English commentary covering jurisprudence, ethics, and context.',
    apiSlug: 'en-tafsir-maarif-ul-quran',
  },
  {
    id: 'en-tafheem',
    language: 'en',
    name_bn: 'তাফহীমুল কুরআন (English)',
    name_en: 'Tafheem-ul-Quran',
    name_ar: 'تفهيم القرآن - إنجليزي',
    author_bn: 'মাওলানা আবুল আ’লা মওদূদী (রহ.)',
    author_en: "Sayyid Abul A'la Maududi",
    methodology_bn: 'সূরার ঐতিহাসিক পটভূমি ও সামগ্রিক কাঠামো বিশ্লেষণকারী ইংরেজি তাফসির।',
    methodology_en: 'Thematic and historical guidance explaining each Surah’s revelation context.',
  },
  {
    id: 'en-clear-quran',
    language: 'en',
    name_bn: 'দ্য ক্লিয়ার কুরআন (Translation & Commentary)',
    name_en: 'The Clear Quran (Translation and commentary)',
    name_ar: 'القرآن المبين',
    author_bn: 'ড. মুস্তাফা খাত্তাব',
    author_en: 'Dr. Mustafa Khattab',
    methodology_bn: 'আধুনিক ও প্রাঞ্জল ইংরেজি অনুবাদ ও প্রাসঙ্গিক সংক্ষিপ্ত টীকা।',
    methodology_en: 'Contemporary thematic translation with concise scholarly footnotes and clarity.',
  },
];

export const THEMATIC_TAFSIR_TOPICS: ThematicTafsirTopic[] = [
  {
    id: 'tawheed',
    title_bn: 'তাওহীদ, আল্লাহর একত্ব ও সর্বশক্তি',
    title_en: 'Tawheed, Allah’s Oneness & Majesty',
    summary_bn: 'কুরআনের মৌলিক আকীদা, আয়াতুল কুরসি ও সূরা ইখলাসের তাফসির।',
    summary_en: 'Core verses establishing pure monotheism, Ayat al-Kursi, and Surah Al-Ikhlas.',
    verses: [
      { surahNumber: 2, ayahNumber: 255, note_bn: 'আয়াতুল কুরসি — কুরআনের সর্বশ্রেষ্ঠ আয়াত', note_en: 'Ayat al-Kursi — Verse of the Throne' },
      { surahNumber: 112, ayahNumber: 1, note_bn: 'তাওহীদের বিশুদ্ধ ঘোষণা', note_en: 'Pure declaration of Allah’s Oneness' },
      { surahNumber: 59, ayahNumber: 22, note_bn: 'আল্লাহর গুণবাচক নামসমূহ', note_en: 'Allah’s Beautiful Names & Attributes' },
    ],
  },
  {
    id: 'salah-worship',
    title_bn: 'নামাজ, খুশু-খুযু ও ইবাদতের তাৎপর্য',
    title_en: 'Salah, Humility & Purpose of Worship',
    summary_bn: 'নামাজ কায়েম করা, যিকির ও সফল মুমিনের বৈশিষ্ট্য।',
    summary_en: 'Establishing prayer, remembrance, and the traits of successful believers.',
    verses: [
      { surahNumber: 1, ayahNumber: 5, note_bn: 'ইবাদত ও সাহায্য প্রার্থনার অঙ্গীকার', note_en: 'Covenant of exclusive worship & help' },
      { surahNumber: 23, ayahNumber: 2, note_bn: 'নামাজে বিনয় ও একাগ্রতা', note_en: 'Khushu (humble focus) in prayer' },
      { surahNumber: 29, ayahNumber: 45, note_bn: 'নামাজ অশ্লীল ও মন্দ কাজ থেকে বিরত রাখে', note_en: 'Salah restrains from immorality & wrongdoing' },
    ],
  },
  {
    id: 'dua-tawakkul',
    title_bn: 'দোয়া, তাওয়াক্কুল ও আল্লাহর নৈকট্য',
    title_en: 'Dua, Trust in Allah & Divine Nearness',
    summary_bn: 'আল্লাহর নিকট চাওয়া, ভরসা রাখা ও ক্ষমা প্রার্থনার আয়াত।',
    summary_en: 'Verses on supplication, reliance on Allah, and seeking mercy.',
    verses: [
      { surahNumber: 2, ayahNumber: 186, note_bn: 'বান্দা ডাকলে আল্লাহ অতি নিকটে থাকেন', note_en: 'Allah is near and answers the caller' },
      { surahNumber: 2, ayahNumber: 152, note_bn: 'আল্লাহর স্মরণ ও কৃতজ্ঞতা', note_en: 'Remember Me and I will remember you' },
      { surahNumber: 65, ayahNumber: 3, note_bn: 'তাওয়াক্কুলের বিস্ময়কর প্রতিদান', note_en: 'Allah suffices whoever relies upon Him' },
    ],
  },
  {
    id: 'ramadan-taqwa',
    title_bn: 'সিয়াম, রমজান ও তাকওয়া অর্জন',
    title_en: 'Fasting, Ramadan & Attaining Taqwa',
    summary_bn: 'রোজা ফরজ হওয়ার উদ্দেশ্য, কুরআন নাজিল ও শবে কদরের মর্যাদা।',
    summary_en: 'Wisdom behind fasting, revelation of the Quran, and Laylatul Qadr.',
    verses: [
      { surahNumber: 2, ayahNumber: 183, note_bn: 'তাকওয়া অর্জনের জন্য রোজা', note_en: 'Fasting prescribed so you may attain Taqwa' },
      { surahNumber: 2, ayahNumber: 185, note_bn: 'রমজান কুরআন নাজিলের মাস', note_en: 'Ramadan — month in which the Quran was revealed' },
      { surahNumber: 97, ayahNumber: 1, note_bn: 'লাইলাতুল কদরের শ্রেষ্ঠত্ব', note_en: 'The Night of Decree is better than 1000 months' },
    ],
  },
  {
    id: 'patience-ease',
    title_bn: 'ধৈর্য, পরীক্ষা ও কষ্টের পরে স্বস্তি',
    title_en: 'Patience, Trials & Relief After Hardship',
    summary_bn: 'মানুষকে আশাবাদ ও দৃঢ়তা দানকারী কুরআনের বাণী।',
    summary_en: 'Comforting verses reminding believers that ease accompanies every hardship.',
    verses: [
      { surahNumber: 94, ayahNumber: 5, note_bn: 'নিশ্চয়ই কষ্টের সাথেই রয়েছে স্বস্তি', note_en: 'Verily, with hardship comes ease' },
      { surahNumber: 2, ayahNumber: 286, note_bn: 'আল্লাহ সাধ্যের অতিরিক্ত বোঝা দেন না', note_en: 'Allah does not burden a soul beyond capacity' },
      { surahNumber: 103, ayahNumber: 2, note_bn: 'সময়ের শপথ ও মুক্তির ৪ শর্ত', note_en: 'Surah Al-Asr — 4 keys to salvation' },
    ],
  },
  {
    id: 'parents-ethics',
    title_bn: 'পিতা-মাতার অধিকার ও উত্তম চরিত্র',
    title_en: 'Rights of Parents & Noble Character',
    summary_bn: 'মা-বাবার প্রতি সদাচরণ, নম্রতা ও সামাজিক ন্যায়বিচার।',
    summary_en: 'Honoring parents, humility, kindness, and social ethics.',
    verses: [
      { surahNumber: 17, ayahNumber: 23, note_bn: 'পিতা-মাতার প্রতি ইহসান ও শ্রদ্ধা', note_en: 'Excellence and gentleness toward parents' },
      { surahNumber: 17, ayahNumber: 24, note_bn: 'মা-বাবার জন্য কুরআনি দোয়া', note_en: 'Quranic prayer for mercy upon parents' },
      { surahNumber: 49, ayahNumber: 13, note_bn: 'তাকওয়াই মর্যাদার একমাত্র মাপকাঠি', note_en: 'Most noble in Allah’s sight is most righteous' },
    ],
  },
];
