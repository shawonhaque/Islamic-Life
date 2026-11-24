export interface CuratedDailyAyah {
  surahNumber: number;
  ayahNumber: number;
  surahNameEn: string;
  surahNameBn: string;
  surahNameAr: string;
  arabic: string;
  translationEn: string;
  translationBn: string;
}

export const DAILY_CURATED_AYAHS: CuratedDailyAyah[] = [
  {
    surahNumber: 25,
    ayahNumber: 74,
    surahNameEn: 'Al-Furqaan',
    surahNameBn: 'আল-ফুরকান',
    surahNameAr: 'الفرقان',
    arabic:
      'وَالَّذِينَ يَقُولُونَ رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا',
    translationEn:
      'And those who say, "Our Lord, grant us from among our wives and offspring comfort to our eyes and make us an example for the righteous."',
    translationBn:
      'এবং যারা বলে, ‘হে আমাদের রব, আমাদের স্ত্রী ও সন্তানদের পক্ষ থেকে আমাদের জন্য চোখের শীতলতা দান করুন এবং আমাদেরকে মুত্তাকীদের জন্য আদর্শ বানান।’',
  },
  {
    surahNumber: 94,
    ayahNumber: 5,
    surahNameEn: 'Ash-Sharh',
    surahNameBn: 'আল-ইনশিরাহ',
    surahNameAr: 'الشرح',
    arabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
    translationEn: 'For indeed, with hardship [will be] ease.',
    translationBn: 'নিশ্চয়ই কষ্টের সাথেই রয়েছে স্বস্তি।',
  },
  {
    surahNumber: 13,
    ayahNumber: 28,
    surahNameEn: "Ar-Ra'd",
    surahNameBn: 'আর-রা’দ',
    surahNameAr: 'الرعد',
    arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    translationEn: 'Unquestionably, by the remembrance of Allah hearts are assured.',
    translationBn: 'জেনে রেখো, আল্লাহর যিকিরেই অন্তরসমূহ প্রশান্ত হয়।',
  },
  {
    surahNumber: 2,
    ayahNumber: 152,
    surahNameEn: 'Al-Baqarah',
    surahNameBn: 'আল-বাকারা',
    surahNameAr: 'البقرة',
    arabic: 'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ',
    translationEn: 'So remember Me; I will remember you. And be grateful to Me and do not deny Me.',
    translationBn: 'অতএব তোমরা আমাকে স্মরণ করো, আমিও তোমাদের স্মরণ করব। আর আমার কৃতজ্ঞতা আদায় করো এবং অকৃতজ্ঞ হয়ো না।',
  },
  {
    surahNumber: 39,
    ayahNumber: 53,
    surahNameEn: 'Az-Zumar',
    surahNameBn: 'আয-যুমার',
    surahNameAr: 'الزمر',
    arabic: 'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ',
    translationEn:
      'Say, "O My servants who have transgressed against themselves, do not despair of the mercy of Allah."',
    translationBn:
      'বলুন, হে আমার বান্দারা! যারা নিজেদের প্রতি সীমালঙ্ঘন করেছ, তোমরা আল্লাহর রহমত থেকে নিরাশ হয়ো না।',
  },
  {
    surahNumber: 2,
    ayahNumber: 286,
    surahNameEn: 'Al-Baqarah',
    surahNameBn: 'আল-বাকারা',
    surahNameAr: 'البقرة',
    arabic: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
    translationEn: 'Allah does not charge a soul except [with that within] its capacity.',
    translationBn: 'আল্লাহ কাউকে তার সাধ্যের অতিরিক্ত দায়িত্ব অর্পণ করেন না।',
  },
];

export function getCuratedAyahOfTheDay(localDate: Date): CuratedDailyAyah {
  const startOfYear = new Date(localDate.getFullYear(), 0, 0);
  const diffDays = Math.floor((localDate.getTime() - startOfYear.getTime()) / 86_400_000);
  const idx = Math.abs(diffDays) % DAILY_CURATED_AYAHS.length;
  return DAILY_CURATED_AYAHS[idx] ?? DAILY_CURATED_AYAHS[0];
}
