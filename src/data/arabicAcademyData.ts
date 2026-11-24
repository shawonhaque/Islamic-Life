export interface SifatRule {
  id: string;
  nameAr: string;
  nameBn: string;
  nameEn: string;
  oppositeAr?: string;
  oppositeBn?: string;
  oppositeEn?: string;
  letters: string[];
  descBn: string;
  descEn: string;
}

export interface TajweedLesson {
  id: string;
  categoryBn: string;
  categoryEn: string;
  titleAr: string;
  titleBn: string;
  titleEn: string;
  letters: string;
  ruleBn: string;
  ruleEn: string;
  examples: Array<{ ar: string; bnPron: string; refBn: string; refEn: string }>;
}

export interface GrammarLesson {
  id: string;
  titleAr: string;
  titleBn: string;
  titleEn: string;
  level: 'Beginner' | 'Intermediate';
  summaryBn: string;
  summaryEn: string;
  examples: Array<{ ar: string; pronBn: string; meaningBn: string; meaningEn: string }>;
}

export interface VocabFlashcard {
  id: string;
  category: 'daily' | 'family' | 'food' | 'travel' | 'islamic' | 'verbs';
  ar: string;
  pronBn: string;
  pronEn: string;
  bn: string;
  en: string;
}

export interface AcademyQuizQuestion {
  id: string;
  topic: 'letters' | 'tajweed' | 'grammar' | 'vocab';
  questionBn: string;
  questionEn: string;
  arabicPrompt?: string;
  options: Array<{ id: string; bn: string; en: string }>;
  correctId: string;
  explanationBn: string;
  explanationEn: string;
}

export interface RecitationPracticeVerse {
  id: string;
  surahNumber: number;
  ayahNumber: number;
  titleBn: string;
  titleEn: string;
  arabic: string;
  pronBn: string;
  translationBn: string;
  translationEn: string;
  focusRuleBn: string;
  focusRuleEn: string;
}

export interface JuzStartEntry {
  juz: number;
  nameAr: string;
  nameBn: string;
  nameEn: string;
  surahNumber: number;
  ayahNumber: number;
}

export const SIFAT_UL_HURUF: SifatRule[] = [
  {
    id: 'hams-jahr',
    nameAr: 'الهَمْس والجَهْر',
    nameBn: 'হামস (শ্বাস প্রবাহিত) বনাম জাহর (শ্বাস বদ্ধ)',
    nameEn: 'Hams (Whispered Breath) vs Jahr (Voiced)',
    oppositeAr: 'فَحَثَّهُ شَخْصٌ سَكَتَ',
    oppositeBn: 'হামস-এর ১০টি হরফ: ف ح ث ه ش خ ص س ك ت',
    oppositeEn: '10 Hams letters: ف ح ث ه ش خ ص س ك ت',
    letters: ['ف', 'ح', 'ث', 'ه', 'ش', 'خ', 'ص', 'س', 'ك', 'ت'],
    descBn: 'হামস হরফে উচ্চারণের সময় মুখ দিয়ে সূক্ষ্ম শ্বাস প্রবাহিত হয়; বাকি ১৯টি জাহর হরফে শ্বাস বদ্ধ থাকে ও কণ্ঠস্বর স্পষ্ট হয়।',
    descEn: 'Breath flows gently on Hams letters; vocal cords vibrate strongly without excess breath in the remaining 19 Jahr letters.',
  },
  {
    id: 'shiddah-rikhwah',
    nameAr: 'الشِّدَّة والتَّوَسُّط والرِّخَاوَة',
    nameBn: 'শিদ্দাহ, তাওয়াসসুত ও রিখাওয়াহ (আওয়াজের প্রবাহ)',
    nameEn: 'Shiddah (Stopped), Tawassut (Moderate) & Rikhawah (Flowing)',
    oppositeAr: 'أَجِدُ قَطٍ بَكَتْ · لِنْ عُمَر',
    oppositeBn: 'শিদ্দাহ (আওয়াজ থামে): أ ج د ق ط ب ك ت | মধ্যম: ل ن ع م ر',
    oppositeEn: 'Shiddah: أ ج د ق ط ب ك ت | Tawassut: ل ن ع م ر',
    letters: ['أ', 'ج', 'د', 'ق', 'ط', 'ب', 'ك', 'ت', 'ل', 'ن', 'ع', 'م', 'ر'],
    descBn: 'মাখরাজে চাপ পড়ে ধ্বনি থেমে যাওয়াকে শিদ্দাহ, মাঝারি প্রবাহকে তাওয়াসসুত (ل ن ع م ر) এবং দীর্ঘ প্রবাহকে রিখাওয়াহ বলে।',
    descEn: 'Sound stops completely in Shiddah, flows moderately in the 5 Tawassut letters (ل ن ع م ر), and flows freely in Rikhawah.',
  },
  {
    id: 'istila-istifal',
    nameAr: 'الاسْتِعْلَاء والاسْتِفَال',
    nameBn: 'ইস্তিলা (পোর/ভারী) বনাম ইস্তিফাল (বারিক/পাতলা)',
    nameEn: "Isti'la (Elevated / Heavy) vs Istifal (Lowered / Light)",
    oppositeAr: 'خُصَّ ضَغْطٍ قِظْ',
    oppositeBn: 'তাফখীম (ভারী উচ্চারণ) ৭টি হরফ: خ ص ض غ ط ق ظ',
    oppositeEn: '7 Heavy letters: خ ص ض غ ط ق ظ',
    letters: ['خ', 'ص', 'ض', 'غ', 'ط', 'ق', 'ظ'],
    descBn: 'ইস্তিলার ৭টি হরফ উচ্চারণে জিহ্বার গোড়া উপরের তালুর দিকে ওঠে, ফলে ধ্বনি মোটা ও গম্ভীর (পোর) হয়।',
    descEn: 'The back of the tongue rises toward the soft palate for these 7 letters, giving a full, heavy Tafkheem resonance.',
  },
  {
    id: 'itbaq-infitah',
    nameAr: 'الإِطْبَاق والانْفِتَاح',
    nameBn: 'ইতবাক (তালু-সংলগ্ন) বনাম ইনফিতাহ',
    nameEn: 'Itbaq (Covered / Adhering) vs Infitah (Open)',
    letters: ['ص', 'ض', 'ط', 'ظ'],
    descBn: 'ص ض ط ظ — এই ৪টি হরফ সবচেয়ে বেশি পোর হয়; জিহ্বা উপরের তালুর প্রায় সাথে লেগে আওয়াজ আটকে দেয়।',
    descEn: 'The four strongest heavy letters (ص ض ط ظ), where the tongue presses closely toward the upper palate.',
  },
  {
    id: 'qalqalah-sifat',
    nameAr: 'القَلْقَلَة',
    nameBn: 'ক্বলক্বলাহ (প্রতিধ্বনি)',
    nameEn: 'Qalqalah (Echoing Bounce)',
    letters: ['ق', 'ط', 'ب', 'ج', 'د'],
    descBn: 'ق ط ب ج د হরফগুলোতে সুকুন বা থামার চিহ্ন (ওয়াকফ) থাকলে ধ্বনি সামান্য প্রতিধ্বনিত হয়ে স্পষ্ট বের হয়।',
    descEn: 'When ق ط ب ج د carry a Sukun (or stop at the end of an Ayah), release the articulation point with a crisp echo.',
  },
  {
    id: 'safir-tafasshi',
    nameAr: 'الصَّفِير والتَّفَشِّي والاسْتِطَالَة',
    nameBn: 'সফীর (শিস), তাফাশশী (ছড়ানো) ও ইস্তিতালাহ',
    nameEn: 'Safir (Whistle), Tafasshi (Spreading) & Istitalah (Elongation)',
    letters: ['ص', 'ز', 'س', 'ش', 'ض'],
    descBn: 'সফীর (ص ز س): শিসের মতো তীক্ষ্ণ ধ্বনি। তাফাশশী (ش): মুখের ভেতর বাতাস ছড়িয়ে পড়া। ইস্তিতালাহ (ض): জিহ্বার পাশ বরাবর ধ্বনি প্রসারিত হওয়া।',
    descEn: 'Safir gives ص ز س a sharp whistling tone; Tafasshi spreads breath across ش; Istitalah elongates ض along the side molars.',
  },
];

export const TAJWEED_COURSE_RULES: TajweedLesson[] = [
  {
    id: 'izhar-halqi',
    categoryBn: 'নুন সাকিন ও তানভিন',
    categoryEn: 'Noon Sakin & Tanween',
    titleAr: 'الإظهار الحلقي',
    titleBn: '১. ইজহারে হালক্বী (স্পষ্ট করে পড়া)',
    titleEn: '1. Izhar Halqi (Clear Pronunciation)',
    letters: 'أ ه ع ح غ خ',
    ruleBn: 'নুন সাকিন (نْ) বা তানভিনের (ً ٍ ٌ) পর কণ্ঠনালির ৬টি হরফ (أ ه ع ح غ خ) এর কোনোটি এলে গুন্নাহ ছাড়া নুন স্পষ্ট করে পড়তে হয়।',
    ruleEn: 'When Noon Sakin (نْ) or Tanween is followed by any of the 6 throat letters (أ ه ع ح غ خ), pronounce the N sound clearly without nasalization.',
    examples: [
      { ar: 'مَنْ آمَنَ', bnPron: 'মান আমানা', refBn: 'আল-বাকারা ২:৬২', refEn: 'Al-Baqarah 2:62' },
      { ar: 'سَمِيعٌ عَلِيمٌ', bnPron: 'সামিউন আলিম', refBn: 'আল-বাকারা ২:১৮১', refEn: 'Al-Baqarah 2:181' },
    ],
  },
  {
    id: 'idgham',
    categoryBn: 'নুন সাকিন ও তানভিন',
    categoryEn: 'Noon Sakin & Tanween',
    titleAr: 'الإدغام (بغنة وبغير غنة)',
    titleBn: '২. ইদগাম (মিলিয়ে পড়া: গুন্নাহসহ ও ছাড়া)',
    titleEn: '2. Idgham (Merging With & Without Ghunnah)',
    letters: 'ي ر م ل و ن (يرملون)',
    ruleBn: 'নুন সাকিন বা তানভিনের পর ي ن م و এলে ১ আলিফ গুন্নাহসহ মিলিয়ে পড়তে হয় (ইদগামে বা-গুন্নাহ)। আর ل বা ر এলে গুন্নাহ ছাড়া মিলিয়ে পড়তে হয় (ইদগামে বিলা-গুন্নাহ)।',
    ruleEn: 'Merge with 2-count nasalization before ي ن م و (Idgham bi-Ghunnah). Merge smoothly without Ghunnah before ل and ر.',
    examples: [
      { ar: 'مَن يَقُولُ', bnPron: 'মাইঁ-ইয়াকূলু (নাকের বাঁশি সহ)', refBn: 'আল-বাকারা ২:৮', refEn: 'Al-Baqarah 2:8' },
      { ar: 'مِن رَّبِّهِمْ', bnPron: 'মির-রব্বিহিম (গুন্নাহ ছাড়া)', refBn: 'আল-বাকারা ২:৫', refEn: 'Al-Baqarah 2:5' },
    ],
  },
  {
    id: 'iqlab',
    categoryBn: 'নুন সাকিন ও তানভিন',
    categoryEn: 'Noon Sakin & Tanween',
    titleAr: 'الإقلاب',
    titleBn: '৩. ইক্বলাব (নুনকে মীমে পরিবর্তন)',
    titleEn: '3. Iqlab (Converting Noon to Meem)',
    letters: 'ب',
    ruleBn: 'নুন সাকিন বা তানভিনের পর ب (বা) এলে নুন ধ্বনিকে মীম (م)-এ রূপান্তর করে ১ আলিফ গুন্নাহসহ পড়া। মুসহাফে উপরে ছোট্ট (م) চিহ্ন দেওয়া থাকে।',
    ruleEn: 'When Noon Sakin or Tanween precedes ب, transform the N sound into a lightly closed M with 2 counts of Ghunnah.',
    examples: [
      { ar: 'مِن بَعْدِ', bnPron: 'মিম্-বা‘দি', refBn: 'আল-বাকারা ২:২৭', refEn: 'Al-Baqarah 2:27' },
      { ar: 'سَمِيعٌ بَصِيرٌ', bnPron: 'সামিউম্-বাসীর', refBn: 'আল-ইসরা ১৭:১', refEn: 'Al-Isra 17:1' },
    ],
  },
  {
    id: 'ikhfa',
    categoryBn: 'নুন সাকিন ও তানভিন',
    categoryEn: 'Noon Sakin & Tanween',
    titleAr: 'الإخفاء الحقيقي',
    titleBn: '৪. ইখফা হাকীকী (গোপন গুন্নাহসহ)',
    titleEn: '4. Ikhfa Haqiqi (Hidden Nasalization)',
    letters: 'ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك',
    ruleBn: 'ইজহার, ইদগাম ও ইকলাবের হরফ বাদে বাকি ১৫টি হরফ নুন সাকিন বা তানভিনের পরে এলে নুনের ধ্বনি গোপন করে ১ আলিফ গুন্নাহসহ পড়তে হয়।',
    ruleEn: 'Before the remaining 15 letters, conceal the Noon sound slightly while holding nasalization (Ghunnah) for 2 beats toward the next letter.',
    examples: [
      { ar: 'مِن شَرِّ', bnPron: 'মিন্‌-শাররি (গুন্নাহসহ)', refBn: 'আল-ফালাক ১১৩:২', refEn: 'Al-Falaq 113:2' },
      { ar: 'كُنتُمْ', bnPron: 'কুন-তুম', refBn: 'আল-বাকারা ২:২৩', refEn: 'Al-Baqarah 2:23' },
    ],
  },
  {
    id: 'meem-sakin',
    categoryBn: 'মীম সাকিন ও গুন্নাহ',
    categoryEn: 'Meem Sakin & Ghunnah',
    titleAr: 'أحكام الميم الساكنة',
    titleBn: '৫. মীম সাকিনের ৩টি নিয়ম ও ওয়াজিব গুন্নাহ',
    titleEn: '5. Meem Sakin Rules & Obligatory Ghunnah',
    letters: 'م · ب · نّ · مّ',
    ruleBn: 'মীম সাকিন (مْ)-এর পর ب এলে ইখফায়ে শাফাবী (গুন্নাহ); م এলে ইদগামে শাফাবী (গুন্নাহসহ মীমে মিলানো); বাকি ২৬ হরফে ইজহারে শাফাবী। এছাড়া তাশদিদযুক্ত নুন (نّ) ও মীম (مّ)-এ সবসময় ১ আলিফ ওয়াজিব গুন্নাহ।',
    ruleEn: 'Meem Sakin + ب = Ikhfa Shafawi; Meem Sakin + م = Idgham Shafawi; all other letters = clear Izhar Shafawi. Doubled نّ or مّ always require 2-count Ghunnah.',
    examples: [
      { ar: 'تَرْمِيهِم بِحِجَارَةٍ', bnPron: 'তারমীহিম্ বিহিজারাতিম', refBn: 'আল-ফীল ১০৫:৪', refEn: 'Al-Fil 105:4' },
      { ar: 'مِنَ الْجِنَّةِ وَالنَّاسِ', bnPron: 'মিনাল জিন্নাতি ওয়ান্নাস', refBn: 'আন-নাস ১১৪:৬', refEn: 'An-Nas 114:6' },
    ],
  },
  {
    id: 'madd-rules',
    categoryBn: 'মদ্দ (দীর্ঘ স্বর)',
    categoryEn: 'Madd (Elongation)',
    titleAr: 'المد الطبيعي والفرعي',
    titleBn: '৬. মদ্দে আসলী (২ হরকত) ও মদ্দে ফারঈ (৪–৬ হরকত)',
    titleEn: '6. Madd Tabii (2 counts) & Derived Madd (4–6 counts)',
    letters: 'ا و ي + ء / ْ / ّ',
    ruleBn: 'মদ্দে তাবাঈ/আসলী ১ আলিফ (২ হরকত) টেনে পড়া; একই শব্দে হামযা থাকলে মদ্দে মুত্তাসিল (৪–৫ হরকত); পরের শব্দে হামযা থাকলে মদ্দে মুনফাসিল (৪–৫ হরকত); মদ্দের পর তাশদিদ/আসল সুকুন থাকলে মদ্দে লাজিম (৬ হরকত)।',
    ruleEn: 'Natural Madd lasts 2 beats. Mutassil (Hamzah same word) & Munfasil (Hamzah next word) extend 4–5 beats; Madd Lazim extends full 6 beats.',
    examples: [
      { ar: 'وَلَا الضَّالِّينَ', bnPron: 'ওয়া লাদ্ব-দ্বোয়াল্লী-ন (৬ হরকত)', refBn: 'আল-ফাতিহা ১:৭', refEn: 'Al-Fatihah 1:7' },
      { ar: 'إِذَا جَاءَ', bnPron: 'ইযা জা-আ (৪–৫ হরকত)', refBn: 'আন-নাসর ১১০:১', refEn: 'An-Nasr 110:1' },
    ],
  },
  {
    id: 'lam-ra-waqf',
    categoryBn: 'লাম, রা ও ওয়াকফ চিহ্ন',
    categoryEn: 'Lam, Ra & Waqf Stops',
    titleAr: 'تفخيم اللام والراء وعلامات الوقف',
    titleBn: '৭. আল্লাহ শব্দের লাম, রা-এর তাফখীম এবং ওয়াকফ (থামার) চিহ্ন',
    titleEn: '7. Heavy/Light Lam & Ra + Quranic Waqf Stop Signs',
    letters: 'مـ · لا · ج · صلى · قلى',
    ruleBn: 'আল্লাহ (اللّٰه) শব্দের লাম-এর আগে যবর/পেশ থাকলে পোর (মোটা) আর যের থাকলে বারিক (পাতলা) পড়তে হয়। ওয়াকফ চিহ্ন: مـ (অবশ্যই থামুন), لا (থামবেন না), ج (থামা জায়েজ), صلى (মিলিয়ে পড়া উত্তম), قلى (থামা উত্তম)।',
    ruleEn: 'Lam in Allah is heavy after Fatha/Damma and light after Kasra. Stops: مـ (Must stop), لا (Do not stop), ج (Permissible), صلى (Better continue), قلى (Better stop).',
    examples: [
      { ar: 'بِسْمِ اللَّهِ', bnPron: 'বিসমিল্লা-হ (পাতলা লাম)', refBn: 'আল-ফাতিহা ১:১', refEn: 'Al-Fatihah 1:1' },
      { ar: 'قُلْ هُوَ اللَّهُ أَحَدٌ', bnPron: 'কুল হুওয়াল্ল-হু আহাদ (মোটা লাম)', refBn: 'আল-ইখলাস ১১২:১', refEn: 'Al-Ikhlas 112:1' },
    ],
  },
];

export const NAHW_SARF_LESSONS: GrammarLesson[] = [
  {
    id: 'kalimah',
    titleAr: 'أقسام الكلمة: اسم · فعل · حرف',
    titleBn: '১. আরবি শব্দের ৩ প্রকার (ইসম, ফেয়েল, হরফ)',
    titleEn: '1. Three Parts of Speech (Ism, Fi’l, Harf)',
    level: 'Beginner',
    summaryBn: 'ইসম = নাম/বিশেষ্য/বিশেষণ (কালহীন); ফেয়েল = ক্রিয়া (অতীত/বর্তমান/ভবিষ্যৎ কালযুক্ত); হরফ = অব্যয় বা সংযোজক শব্দ (في, على, من)।',
    summaryEn: 'Ism = Nouns/Adjectives/Pronouns (timeless); Fi’l = Verbs with tense; Harf = Prepositions & particles.',
    examples: [
      { ar: 'كِتَابٌ (اسم) · كَتَبَ (فعل) · فِي (حرف)', pronBn: 'কিতাবুন (ইসম) · কাতাবা (ফেয়েল) · ফী (হরফ)', meaningBn: 'বই · সে লিখেছে · মধ্যে', meaningEn: 'A book · He wrote · In' },
    ],
  },
  {
    id: 'nominal-sentence',
    titleAr: 'الجملة الاسمية (المبتدأ والخبر)',
    titleBn: '২. নামবাচক বাক্য (মুবতাদা ও খবর)',
    titleEn: '2. Nominal Sentence (Mubtada & Khabar)',
    level: 'Beginner',
    summaryBn: 'যেই বাক্য ইসম দিয়ে শুরু হয় তা জুমলা ইসমিয়া। প্রথম অংশ মারেফা (ال যুক্ত বা নির্দিষ্ট) হয়ে মুবতাদা হয়, আর দ্বিতীয় অংশ খবর হয়ে পেশ (رفْع) পায়।',
    summaryEn: 'Starts with a definite Subject (Mubtada) followed by an indefinite Predicate (Khabar) carrying Raf (Damma).',
    examples: [
      { ar: 'اللَّهُ رَبُّنَا', pronBn: 'আল্লা-হু রব্বুনা', meaningBn: 'আল্লাহ আমাদের রব', meaningEn: 'Allah is our Lord' },
      { ar: 'الْعِلْمُ نُورٌ', pronBn: 'আল-ইলমু নূরুন', meaningBn: 'জ্ঞান একটি আলো', meaningEn: 'Knowledge is light' },
    ],
  },
  {
    id: 'verbal-tenses',
    titleAr: 'الفعل الماضي والمضارع والأمر',
    titleBn: '৩. ক্রিয়ার ৩টি রূপ (মাযী, মুযারে, আমর - সরফ)',
    titleEn: '3. Sarf Verb Forms (Past, Present/Future, Command)',
    level: 'Beginner',
    summaryBn: 'আরবি অধিকাংশ ক্রিয়া ৩টি মূল হরফ (যেমন ك-ت-ب বা ع-ل-م) থেকে গঠিত হয়। মাযী = অতীত, মুযারে = বর্তমান/ভবিষ্যৎ (ي/ت/أ/ن শুরুতে), আমর = আদেশসূচক।',
    summaryEn: 'Most Arabic verbs stem from 3 root letters: Madi (past), Mudari (present/future), Amr (imperative).',
    examples: [
      { ar: 'قَرَأَ · يَقْرَأُ · اِقْرَأْ', pronBn: 'ক্বরাআ · ইয়াক্বরাউ · ইক্বরা’', meaningBn: 'সে পড়েছে · সে পড়ে · পড়ো!', meaningEn: 'He read · He reads · Read!' },
      { ar: 'عَلِمَ · يَعْلَمُ · اِعْلَمْ', pronBn: 'আলিমা · ইয়া‘লামু · ই‘লাম', meaningBn: 'সে জেনেছে · সে জানে · জেনে রাখো!', meaningEn: 'He knew · He knows · Know!' },
    ],
  },
  {
    id: 'irab-signs',
    titleAr: 'الإعراب: الرفع والنصب والجر',
    titleBn: '৪. ই‘রাব ও ক্রিয়াকারক (রাফ, নসব, জর)',
    titleEn: '4. Grammatical Cases (Raf, Nasb, Jarr)',
    level: 'Intermediate',
    summaryBn: 'কর্তা (ফা‘ইল)-এর শেষে পেশ/দাম্মাহ (Raf); কর্ম (মাফউল বিহি)-এর শেষে যবর/ফাতহাহ (Nasb); এবং হরফে জরের (মِن, إِلَى, فِي, بِ) পর যের/কাসরাহ (Jarr) হয়।',
    summaryEn: 'Subject takes Damma (Raf); Direct object takes Fatha (Nasb); Prepositions (في, من, بـ) put nouns in Kasra (Jarr).',
    examples: [
      { ar: 'قَرَأَ الطَّالِبُ الْقُرْآنَ فِي الْمَسْجِدِ', pronBn: 'ক্বরাআত্ ত্বা-লিবুল কুরআ-না ফিল মাসজিদি', meaningBn: 'ছাত্রটি মসজিদে কুরআন পড়েছে।', meaningEn: 'The student read the Quran in the mosque.' },
    ],
  },
];

export const ARABIC_VOCAB_CARDS: VocabFlashcard[] = [
  { id: 'v1', category: 'islamic', ar: 'السَّلَامُ عَلَيْكُمْ', pronBn: 'আস-সালা-মু আলাইকুম', pronEn: 'As-salamu alaykum', bn: 'আপনার ওপর শান্তি বর্ষিত হোক', en: 'Peace be upon you' },
  { id: 'v2', category: 'islamic', ar: 'بِسْمِ اللَّهِ', pronBn: 'বিসমিল্লা-হ', pronEn: 'Bismillah', bn: 'আল্লাহর নামে (শুরু করছি)', en: 'In the name of Allah' },
  { id: 'v3', category: 'islamic', ar: 'الْحَمْدُ لِلَّهِ', pronBn: 'আলহামদুলিল্লা-হ', pronEn: 'Alhamdulillah', bn: 'সকল প্রশংসা আল্লাহর জন্য', en: 'All praise is for Allah' },
  { id: 'v4', category: 'daily', ar: 'مَاءٌ بَارِدٌ', pronBn: 'মা-উন বা-রিদুন', pronEn: "Ma'un barid", bn: 'ঠান্ডা পানি', en: 'Cold water' },
  { id: 'v5', category: 'daily', ar: 'كَمِ السَّاعَةُ؟', pronBn: 'কামিস সা-আতু?', pronEn: 'Kamis-sa‘ah?', bn: 'কয়টা বাজে?', en: 'What time is it?' },
  { id: 'v6', category: 'daily', ar: 'أَيْنَ الْمَسْجِدُ؟', pronBn: 'আইনাল মাসজিদু?', pronEn: 'Aynal-masjid?', bn: 'মসজিদ কোথায়?', en: 'Where is the mosque?' },
  { id: 'v7', category: 'family', ar: 'أَبِي وَأُمِّي', pronBn: 'আবী ওয়া উম্মী', pronEn: 'Abi wa Ummi', bn: 'আমার বাবা ও মা', en: 'My father and mother' },
  { id: 'v8', category: 'family', ar: 'أَخِي وَأُخْتِي', pronBn: 'আখী ওয়া উখতী', pronEn: 'Akhi wa Ukhti', bn: 'আমার ভাই ও বোন', en: 'My brother and sister' },
  { id: 'v9', category: 'food', ar: 'خُبْزٌ وَتَمْرٌ', pronBn: 'খুবযুন ওয়া তামরুন', pronEn: 'Khubzun wa Tamr', bn: 'রুটি ও খেজুর', en: 'Bread and dates' },
  { id: 'v10', category: 'food', ar: 'طَعَامٌ حَلَالٌ', pronBn: 'ত্বাআ-মুন হালা-লুন', pronEn: "Ta'amun Halal", bn: 'হালাল খাবার', en: 'Halal food' },
  { id: 'v11', category: 'travel', ar: 'إِلَى الْمَطَارِ', pronBn: 'ইলাল মাত্বা-রি', pronEn: 'Ilal-matar', bn: 'বিমানবন্দরের দিকে', en: 'To the airport' },
  { id: 'v12', category: 'travel', ar: 'كَمْ ثَمَنُ هٰذَا؟', pronBn: 'কাম সামানু হা-যা?', pronEn: 'Kam thamanu hadha?', bn: 'এটার দাম কত?', en: 'How much is this?' },
  { id: 'v13', category: 'verbs', ar: 'يَقْرَأُ', pronBn: 'ইয়াক্বরাউ', pronEn: "Yaqra'u", bn: 'সে পড়ে / পড়ছে', en: 'He/she reads' },
  { id: 'v14', category: 'verbs', ar: 'يَكْتُبُ', pronBn: 'ইয়াকতুবু', pronEn: 'Yaktubu', bn: 'সে লিখে / লিখছে', en: 'He/she writes' },
  { id: 'v15', category: 'verbs', ar: 'يَسْمَعُ', pronBn: 'ইয়াসমাউ', pronEn: "Yasma'u", bn: 'সে শুনে / শুনছে', en: 'He/she listens' },
  { id: 'v16', category: 'verbs', ar: 'يَشْكُرُ', pronBn: 'ইয়াশকুরু', pronEn: 'Yashkuru', bn: 'সে কৃতজ্ঞতা জানায়', en: 'He/she thanks' },
];

export const ACADEMY_QUIZ_QUESTIONS: AcademyQuizQuestion[] = [
  {
    id: 'q1',
    topic: 'letters',
    arabicPrompt: 'ح · ع',
    questionBn: 'আরবি ح (হা) এবং ع (আইন) হরফ দুটি শরীরের কোন মাখরাজ থেকে উচ্চারিত হয়?',
    questionEn: 'From which articulation area are ح (Ha) and ع (Ayn) pronounced?',
    options: [
      { id: 'a', bn: 'দুই ঠোঁট থেকে', en: 'From both lips' },
      { id: 'b', bn: 'কণ্ঠনালির মধ্যভাগ থেকে', en: 'Middle of the throat (Wasat al-Halq)' },
      { id: 'c', bn: 'জিহ্বার ডগা থেকে', en: 'Tip of the tongue' },
    ],
    correctId: 'b',
    explanationBn: 'ح এবং ع কণ্ঠনালির মধ্যভাগ (ওসাতুল হালক) থেকে উচ্চারিত হয়।',
    explanationEn: 'ح and ع originate from the middle throat (Wasat al-Halq).',
  },
  {
    id: 'q2',
    topic: 'letters',
    arabicPrompt: 'ق ط ب ج د',
    questionBn: 'সুকুন অবস্থায় নিচের কোন ৫টি হরফে ক্বলক্বলাহ (প্রতিধ্বনি) করতে হয়?',
    questionEn: 'Which 5 letters produce a Qalqalah echo when carrying a Sukun?',
    options: [
      { id: 'a', bn: 'ق ط ب ج د', en: 'ق ط ب ج د' },
      { id: 'b', bn: 'أ ه ع ح غ', en: 'أ ه ع ح غ' },
      { id: 'c', bn: 'ي ر م ل و', en: 'ي ر م ل و' },
    ],
    correctId: 'a',
    explanationBn: 'কুতবু জাদ্দিন (ق ط ب ج د) হলো ৫টি ক্বলক্বলাহ হরফ।',
    explanationEn: 'Qutbu Jaddin (ق ط ب ج د) are the 5 Qalqalah letters.',
  },
  {
    id: 'q3',
    topic: 'tajweed',
    arabicPrompt: 'مِن بَعْدِ',
    questionBn: 'নুন সাকিনের পর ب (বা) আসার কারণে এখানে কোন তাজবিদ নিয়ম প্রযোজ্য হবে?',
    questionEn: 'Which Tajweed rule applies when Noon Sakin is followed by ب in مِن بَعْدِ?',
    options: [
      { id: 'a', bn: 'ইজহারে হালক্বী', en: 'Izhar Halqi' },
      { id: 'b', bn: 'ইক্বলাব (নুনকে মীমে রূপান্তর করে গুন্নাহ)', en: 'Iqlab (Convert N to M with Ghunnah)' },
      { id: 'c', bn: 'ইদগামে বিলা-গুন্নাহ', en: 'Idgham without Ghunnah' },
    ],
    correctId: 'b',
    explanationBn: 'নুন সাকিন বা তানভিনের পর ب এলে নুনকে মীমে পরিবর্তন করে ১ আলিফ গুন্নাহসহ পড়াকে ইক্বলাব বলে।',
    explanationEn: 'Iqlab transforms Noon Sakin or Tanween into a light Meem sound before ب with 2 counts of Ghunnah.',
  },
  {
    id: 'q4',
    topic: 'tajweed',
    arabicPrompt: 'وَلَا الضَّالِّينَ',
    questionBn: 'মদ্দের হরফ ا-এর পরে তাশদিদ থাকায় الضَّالِّينَ শব্দে মদ্দ কত হরকত টানতে হয়?',
    questionEn: 'How many counts is the Madd held in الضَّالِّينَ (Madd Lazim)?',
    options: [
      { id: 'a', bn: '২ হরকত (১ আলিফ)', en: '2 counts' },
      { id: 'b', bn: '৬ হরকত (৩ আলিফ)', en: '6 counts (full Madd Lazim)' },
      { id: 'c', bn: 'কোনো টান নেই', en: 'No elongation' },
    ],
    correctId: 'b',
    explanationBn: 'মদ্দের হরফের পর মূল তাশদিদ এলে মদ্দে লাজিম কালিমী মুসাক্কাল হয় — যা ৬ হরকত (৩ আলিফ) টেনে পড়া ওয়াজিব।',
    explanationEn: 'Madd Lazim Kalimi Muthaqqal is elongated for 6 counts.',
  },
  {
    id: 'q5',
    topic: 'grammar',
    arabicPrompt: 'الْمَسْجِدِ · فِي',
    questionBn: 'ফী (فِي) হরফে জর-এর পর আসার কারণে الْمَسْجِدِ শব্দের শেষে কোন চিহ্ন হয়েছে?',
    questionEn: 'Why does الْمَسْجِدِ end with a Kasra after فِي?',
    options: [
      { id: 'a', bn: 'জর / কাসরাহ (অব্যয়ের পরের নিয়ম)', en: 'Jarr / Kasra (governed by preposition)' },
      { id: 'b', bn: 'নসব / ফাতহাহ', en: 'Nasb / Fatha' },
      { id: 'c', bn: 'সুকুন', en: 'Sukun' },
    ],
    correctId: 'a',
    explanationBn: 'আরবি ব্যাকরণে হরফে জর (যেমন فِي, مِنْ, إِلَى)-এর পরের ইসম মাজরুর হয় এবং শেষে যের/কাসরাহ পায়।',
    explanationEn: 'Nouns following a preposition (Harf al-Jarr) enter the genitive case (Jarr / Kasra).',
  },
  {
    id: 'q6',
    topic: 'vocab',
    arabicPrompt: 'أَيْنَ الْمَسْجِدُ؟',
    questionBn: 'দৈনন্দিন আরবিতে "أَيْنَ الْمَسْجِدُ؟" বাক্যের বাংলা অর্থ কী?',
    questionEn: 'What does "أَيْنَ الْمَسْجِدُ؟" mean in English?',
    options: [
      { id: 'a', bn: 'এখন কয়টা বাজে?', en: 'What time is it?' },
      { id: 'b', bn: 'মসজিদ কোথায়?', en: 'Where is the mosque?' },
      { id: 'c', bn: 'আমাকে পানি দিন', en: 'Give me water' },
    ],
    correctId: 'b',
    explanationBn: 'أَيْنَ অর্থ "কোথায়" এবং الْمَسْجِدُ অর্থ "মসজিদ"।',
    explanationEn: 'أَيْنَ means "where" and الْمَسْجِدُ means "the mosque".',
  },
];

// Verified Quranic verses matching bundled surahs114.ts dataset (never AI-generated)
export const RECITATION_PRACTICE_AYAHS: RecitationPracticeVerse[] = [
  {
    id: '1:1',
    surahNumber: 1,
    ayahNumber: 1,
    titleBn: 'সূরা আল-ফাতিহা ১:১',
    titleEn: 'Surah Al-Fatihah 1:1',
    arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    pronBn: 'বিসমিল্লা-হির রহমা-নির রহীম',
    translationBn: 'পরম করুণাময় অসীম দয়ালু আল্লাহর নামে শুরু করছি।',
    translationEn: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
    focusRuleBn: 'বিসমিল্লায় বারিক (পাতলা) লাম এবং الرَّحْمَٰنِ ও الرَّحِيمِ-এ খাঁটি কণ্ঠনালির ح মাখরাজ।',
    focusRuleEn: 'Light Lam in Bismillāh and crisp middle-throat ح in ar-Raḥmān & ar-Raḥīm.',
  },
  {
    id: '1:7',
    surahNumber: 1,
    ayahNumber: 7,
    titleBn: 'সূরা আল-ফাতিহা ১:৭',
    titleEn: 'Surah Al-Fatihah 1:7',
    arabic: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
    pronBn: 'সিরাত্বল লাযীনা আন‘আমতা আলাইহিম গইরিল মাগদূবি আলাইহিম ওয়ালাদ্ব-দ্বোয়াল্লীন',
    translationBn: 'তাদের পথ, যাদেরকে আপনি নিয়ামত দান করেছেন; যাদের ওপর গযব পড়েনি এবং যারা পথভ্রষ্ট হয়নি।',
    translationEn: 'The path of those upon whom You have bestowed favor, not of those who have evoked anger or of those who are astray.',
    focusRuleBn: 'أَنْعَمْتَ-এ ইজহারে হালক্বী, ض-এর ইস্তিতালাহ এবং الضَّالِّينَ-এ ৬ হরকত মদ্দে লাজিম।',
    focusRuleEn: 'Clear Izhar on أَنْعَمْتَ, deep ض articulation, and 6-count Madd Lazim in الضَّالِّينَ.',
  },
  {
    id: '112:1',
    surahNumber: 112,
    ayahNumber: 1,
    titleBn: 'সূরা আল-ইখলাস ১১২:১',
    titleEn: 'Surah Al-Ikhlas 112:1',
    arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ',
    pronBn: 'কুল হুওয়াল্লা-হু আহাদ',
    translationBn: 'বলুন, তিনিই আল্লাহ, এক ও অদ্বিতীয়।',
    translationEn: 'Say, "He is Allah, [who is] One,"',
    focusRuleBn: 'ق-এর গভীর মাখরাজ, মোটা লাম (اللَّهُ) এবং থামার সময় د-এ ক্বলক্বলাহ (আহাদ্)।',
    focusRuleEn: 'Deep ق, heavy Lam in Allāh, and crisp Qalqalah bounce when stopping on د.',
  },
  {
    id: '103:1',
    surahNumber: 103,
    ayahNumber: 1,
    titleBn: 'সূরা আল-আসর ১০৩:১–৩',
    titleEn: 'Surah Al-Asr 103:1–3',
    arabic: 'وَالْعَصْرِ إِنَّ الْإِنسَانَ لَفِي خُسْرٍ',
    pronBn: 'ওয়াল আসরি ইন্নাল ইনসা-না লাফী খুসর',
    translationBn: 'সময়ের শপথ! নিশ্চয় মানুষ ক্ষতিগ্রস্ততার মধ্যে রয়েছে।',
    translationEn: 'By time, indeed mankind is in loss.',
    focusRuleBn: 'ع-এর মধ্য-কণ্ঠ উচ্চারণ, إِنَّ-এ ওয়াজিব গুন্নাহ এবং الْإِنسَانَ-এ ইখফা।',
    focusRuleEn: 'Crisp ع from middle throat, 2-count Ghunnah on إِنَّ, and Ikhfa on الْإِنسَانَ.',
  },
  {
    id: '114:1',
    surahNumber: 114,
    ayahNumber: 1,
    titleBn: 'সূরা আন-নাস ১১৪:১–৩',
    titleEn: 'Surah An-Nas 114:1–3',
    arabic: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ مَلِكِ النَّاسِ إِلَٰهِ النَّاسِ',
    pronBn: 'কুল আ‘উযু বিরব্বিন্নাস মালিকিন্নাস ইলা-হিন্নাস',
    translationBn: 'বলুন, আমি আশ্রয় চাই মানুষের রব, মানুষের অধিপতি ও মানুষের উপাস্যের কাছে।',
    translationEn: 'Say, "I seek refuge in the Lord of mankind, the Sovereign of mankind, the God of mankind."',
    focusRuleBn: 'ذ (যাল) জিহ্বার ডগা ও উপরের দাঁতের আগায় এবং النَّاسِ-এ ২ হরকত ওয়াজিব গুন্নাহ।',
    focusRuleEn: 'Soft interdental ذ and steady 2-count Ghunnah on the doubled نّ in النَّاسِ.',
  },
];

export const QURAN_30_JUZ: JuzStartEntry[] = [
  { juz: 1, nameAr: 'الم', nameBn: '১. আলিফ লাম মীম', nameEn: '1. Alif Lam Meem', surahNumber: 1, ayahNumber: 1 },
  { juz: 2, nameAr: 'سَيَقُولُ', nameBn: '২. সায়াকূলু', nameEn: '2. Sayaqool', surahNumber: 2, ayahNumber: 142 },
  { juz: 3, nameAr: 'تِلْكَ الرُّسُلُ', nameBn: '৩. তিলকার রুসুলু', nameEn: '3. Tilkar Rusul', surahNumber: 2, ayahNumber: 253 },
  { juz: 4, nameAr: 'لَنْ تَنَالُوا', nameBn: '৪. লান তানালু', nameEn: '4. Lan Tanaloo', surahNumber: 3, ayahNumber: 93 },
  { juz: 5, nameAr: 'وَالْمُحْصَنَاتُ', nameBn: '৫. ওয়াল মুহসানাত', nameEn: '5. Wal Muhsanat', surahNumber: 4, ayahNumber: 24 },
  { juz: 6, nameAr: 'لَا يُحِبُّ اللَّهُ', nameBn: '৬. লা ইউহিব্বুল্লাহ', nameEn: '6. La Yuhibbullah', surahNumber: 4, ayahNumber: 148 },
  { juz: 7, nameAr: 'وَإِذَا سَمِعُوا', nameBn: '৭. ওয়া ইযা সামিউ', nameEn: '7. Wa Idha Samiu', surahNumber: 5, ayahNumber: 82 },
  { juz: 8, nameAr: 'وَلَوْ أَنَّنَا', nameBn: '৮. ওয়া লাও আন্নানা', nameEn: '8. Wa Law Annana', surahNumber: 6, ayahNumber: 111 },
  { juz: 9, nameAr: 'قَالَ الْمَلَأُ', nameBn: '৯. ক্বালাল মালাউ', nameEn: '9. Qalal Malao', surahNumber: 7, ayahNumber: 88 },
  { juz: 10, nameAr: 'وَاعْلَمُوا', nameBn: '১০. ওয়া‘লামূ', nameEn: "10. Wa'lamoo", surahNumber: 8, ayahNumber: 41 },
  { juz: 11, nameAr: 'يَعْتَذِرُونَ', nameBn: '১১. ইয়া‘তাযিরূন', nameEn: "11. Ya'tadhiroon", surahNumber: 9, ayahNumber: 93 },
  { juz: 12, nameAr: 'وَمَا مِنْ دَابَّةٍ', nameBn: '১২. ওয়ামা মিন দাব্বাহ', nameEn: '12. Wa Ma Min Dabbah', surahNumber: 11, ayahNumber: 6 },
  { juz: 13, nameAr: 'وَمَا أُبَرِّئُ', nameBn: '১৩. ওয়ামা উবাররিউ', nameEn: '13. Wa Ma Ubarrio', surahNumber: 12, ayahNumber: 53 },
  { juz: 14, nameAr: 'رُبَمَا', nameBn: '১৪. রুবামা', nameEn: '14. Rubama', surahNumber: 15, ayahNumber: 1 },
  { juz: 15, nameAr: 'سُبْحَانَ الَّذِي', nameBn: '১৫. সুবহানাল্লাযী', nameEn: '15. Subhanalladhi', surahNumber: 17, ayahNumber: 1 },
  { juz: 16, nameAr: 'قَالَ أَلَمْ', nameBn: '১৬. ক্বালা আলাম', nameEn: '16. Qala Alam', surahNumber: 18, ayahNumber: 75 },
  { juz: 17, nameAr: 'اقْتَرَبَ', nameBn: '১৭. ইক্বতারাবা', nameEn: '17. Iqtaraba', surahNumber: 21, ayahNumber: 1 },
  { juz: 18, nameAr: 'قَدْ أَفْلَحَ', nameBn: '১৮. ক্বদ আফলাহা', nameEn: '18. Qad Aflaha', surahNumber: 23, ayahNumber: 1 },
  { juz: 19, nameAr: 'وَقَالَ الَّذِينَ', nameBn: '১৯. ওয়া ক্বালাল্লাযীনা', nameEn: '19. Wa Qalalladhina', surahNumber: 25, ayahNumber: 21 },
  { juz: 20, nameAr: 'أَمَّنْ خَلَقَ', nameBn: '২০. আম্মান খালাক্বা', nameEn: '20. Amman Khalaqa', surahNumber: 27, ayahNumber: 56 },
  { juz: 21, nameAr: 'اتْلُ مَا أُوحِيَ', nameBn: '২১. উতলু মা উহিয়া', nameEn: '21. Utlu Ma Oohiya', surahNumber: 29, ayahNumber: 46 },
  { juz: 22, nameAr: 'وَمَنْ يَقْنُتْ', nameBn: '২২. ওয়ামাইঁ ইয়াক্বনুত', nameEn: '22. Wa Man Yaqnut', surahNumber: 33, ayahNumber: 31 },
  { juz: 23, nameAr: 'وَمَا لِيَ', nameBn: '২৩. ওয়ামা লিয়া', nameEn: '23. Wa Maliya', surahNumber: 36, ayahNumber: 28 },
  { juz: 24, nameAr: 'فَمَنْ أَظْلَمُ', nameBn: '২৪. ফামান আজলামু', nameEn: '24. Faman Azlamu', surahNumber: 39, ayahNumber: 32 },
  { juz: 25, nameAr: 'إِلَيْهِ يُرَدُّ', nameBn: '২৫. ইলাইহি ইউরদ্দু', nameEn: '25. Ilaihi Yuraddu', surahNumber: 41, ayahNumber: 47 },
  { juz: 26, nameAr: 'حم', nameBn: '২৬. হা-মীম', nameEn: '26. Ha Meem', surahNumber: 46, ayahNumber: 1 },
  { juz: 27, nameAr: 'قَالَ فَمَا خَطْبُكُمْ', nameBn: '২৭. ক্বালা ফামা খাতবুকুম', nameEn: '27. Qala Fama Khatbukum', surahNumber: 51, ayahNumber: 31 },
  { juz: 28, nameAr: 'قَدْ سَمِعَ اللَّهُ', nameBn: '২৮. ক্বদ সামিআল্লাহু', nameEn: '28. Qad Sami Allah', surahNumber: 58, ayahNumber: 1 },
  { juz: 29, nameAr: 'تَبَارَكَ الَّذِي', nameBn: '২৯. তাবারাকাল্লাযী', nameEn: '29. Tabarakalladhi', surahNumber: 67, ayahNumber: 1 },
  { juz: 30, nameAr: 'عَمَّ', nameBn: '৩০. আম্মা (আম্মাপারা)', nameEn: '30. Amma', surahNumber: 78, ayahNumber: 1 },
];

export const COMMON_QURAN_WORDS_DICT: Record<string, { bn: string; en: string }> = {
  'بِسْمِ': { bn: 'নামে', en: 'In the name of' },
  'اللَّهِ': { bn: 'আল্লাহর', en: 'Allah' },
  'اللَّهُ': { bn: 'আল্লাহ', en: 'Allah' },
  'الرَّحْمَٰنِ': { bn: 'পরম করুণাময়', en: 'The Most Gracious' },
  'الرَّحِيمِ': { bn: 'অসীম দয়ালু', en: 'The Most Merciful' },
  'الْحَمْدُ': { bn: 'সমস্ত প্রশংসা', en: 'All praise' },
  'لِلَّهِ': { bn: 'আল্লাহরই জন্য', en: 'belongs to Allah' },
  'رَبِّ': { bn: 'রব / প্রতিপালক', en: 'Lord' },
  'الْعَالَمِينَ': { bn: 'সকল সৃষ্টিকুলের', en: 'of the worlds' },
  'مَالِكِ': { bn: 'মালিক / অধিপতি', en: 'Sovereign / Master' },
  'يَوْمِ': { bn: 'দিনের', en: 'Day' },
  'الدِّينِ': { bn: 'প্রতিদান / বিচার', en: 'Judgment' },
  'إِيَّاكَ': { bn: 'একমাত্র আপনারই', en: 'You alone' },
  'نَعْبُدُ': { bn: 'আমরা ইবাদত করি', en: 'we worship' },
  'نَسْتَعِينُ': { bn: 'আমরা সাহায্য চাই', en: 'we ask for help' },
  'اهْدِنَا': { bn: 'আমাদের পথ দেখান', en: 'Guide us' },
  'الصِّرَاطَ': { bn: 'পথ', en: 'the path' },
  'الْمُسْتَقِيمَ': { bn: 'সরল ও সঠিক', en: 'the straight' },
  'قُلْ': { bn: 'বলুন', en: 'Say' },
  'هُوَ': { bn: 'তিনি', en: 'He' },
  'أَحَدٌ': { bn: 'এক ও অদ্বিতীয়', en: 'One' },
  'الصَّمَدُ': { bn: 'অমুখাপেক্ষী', en: 'Self-Sufficient' },
  'النَّاسِ': { bn: 'মানুষের', en: 'mankind' },
  'أَعُوذُ': { bn: 'আমি আশ্রয় চাই', en: 'I seek refuge' },
  'بِرَبِّ': { bn: 'রবের কাছে', en: 'in the Lord' },
  'إِنَّ': { bn: 'নিশ্চয়ই', en: 'Indeed' },
  'الَّذِينَ': { bn: 'যারা', en: 'those who' },
  'آمَنُوا': { bn: 'ঈমান এনেছে', en: 'believed' },
  'وَعَمِلُوا': { bn: 'এবং আমল করেছে', en: 'and did' },
  'الصَّالِحَاتِ': { bn: 'সৎকর্মসমূহ', en: 'righteous deeds' },
  'وَالْعَصْرِ': { bn: 'সময়ের শপথ', en: 'By time' },
  'خُسْرٍ': { bn: 'ক্ষতিগ্রস্ততায়', en: 'in loss' },
  'رَبَّنَا': { bn: 'হে আমাদের রব', en: 'Our Lord' },
  'فِي': { bn: 'মধ্যে', en: 'in' },
  'مِن': { bn: 'থেকে', en: 'from' },
  'عَلَىٰ': { bn: 'উপর', en: 'upon' },
};

export interface TajweedSegment {
  text: string;
  rule: 'normal' | 'ghunnah' | 'qalqalah' | 'madd' | 'heavy';
}

const QALQALAH_SET = new Set(['ق', 'ط', 'ب', 'ج', 'د']);
const HEAVY_SET = new Set(['خ', 'ص', 'ض', 'غ', 'ط', 'ق', 'ظ']);
const SUKUN = '\u0652';
const SHADDA = '\u0651';
const DAGGER_ALIF = '\u0670';
const MADD_MARK = '\u0653';

// Non-destructive display segmenter for Tajweed color coding (never modifies original string)
export function segmentAyahForTajweed(arabic: string): TajweedSegment[] {
  const clusters: string[] = [];
  for (const ch of arabic) {
    const code = ch.charCodeAt(0);
    const isDiacritic =
      (code >= 0x064b && code <= 0x065f) || code === 0x0670 || (code >= 0x06d6 && code <= 0x06ed);
    if (isDiacritic && clusters.length > 0) {
      clusters[clusters.length - 1] += ch;
    } else {
      clusters.push(ch);
    }
  }

  return clusters.map((cluster, idx) => {
    const base = cluster[0] ?? '';
    const nextCluster = clusters[idx + 1] ?? '';
    if ((base === 'ن' || base === 'م') && cluster.includes(SHADDA)) {
      return { text: cluster, rule: 'ghunnah' };
    }
    if (base === 'ن' && cluster.includes(SUKUN) && nextCluster && !'أإآءهعحغخ'.includes(nextCluster[0])) {
      return { text: cluster, rule: 'ghunnah' };
    }
    if (QALQALAH_SET.has(base) && cluster.includes(SUKUN)) {
      return { text: cluster, rule: 'qalqalah' };
    }
    if (cluster.includes(MADD_MARK) || cluster.includes(DAGGER_ALIF)) {
      return { text: cluster, rule: 'madd' };
    }
    if (HEAVY_SET.has(base)) {
      return { text: cluster, rule: 'heavy' };
    }
    return { text: cluster, rule: 'normal' };
  });
}
