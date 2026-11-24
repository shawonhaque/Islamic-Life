export interface KnowledgeArticle {
  id: string;
  title_bn: string;
  title_en: string;
  content_bn: string;
  content_en: string;
  reference: string;
  tags: string[];
}

export interface KnowledgeCategory {
  id: string;
  title_bn: string;
  title_en: string;
  summary_bn: string;
  summary_en: string;
  articles: KnowledgeArticle[];
}

export interface LectureVideo {
  id: string;
  youtubeId: string;
  title_bn: string;
  speaker_bn: string;
  topic_bn: string;
}

export const KNOWLEDGE_INTRO_BN =
  'এক কথায় ইসলাম হলো একটি পূর্ণাঙ্গ জীবনব্যবস্থা (Complete Code of Life), যা মানুষের জন্ম থেকে মৃত্যু এবং মৃত্যু-পরবর্তী অনন্ত জীবনের প্রতিটি দিক নির্দেশনা দেয়। নিচে ইসলামের সামগ্রিক চিত্র ৮টি প্রধান ভাগে সাজানো হলো।';

export const KNOWLEDGE_INTRO_EN =
  'Islam is a complete code of life, guiding every stage from birth to death and the eternal life after it. The eight sections below map the whole of Islam.';

export const KNOWLEDGE_CATEGORIES: KnowledgeCategory[] = [
  {
    id: 'aqeedah',
    title_bn: '১. আকীদা — ঈমানের ৬টি স্তম্ভ',
    title_en: '1. Aqeedah — The Six Pillars of Iman',
    summary_bn:
      'ইসলামের শুরুই হয় সঠিক বিশ্বাসের মাধ্যমে, যাকে ঈমানে মুফাসসাল বলা হয়। ছয়টি স্তম্ভ ছাড়া কোনো আমলই গ্রহণযোগ্য নয়।',
    summary_en: 'Islam begins with correct belief; without the six articles of faith no deed is accepted.',
    articles: [
      {
        id: 'aqeedah-allah',
        title_bn: 'আল্লাহর প্রতি বিশ্বাস (তাওহীদ)',
        title_en: 'Belief in Allah (Tawhid)',
        content_bn:
          'আল্লাহ এক ও অদ্বিতীয় সৃষ্টিকর্তা। তিনি অনাদি ও অনন্ত, কারও সন্তান নন, তাঁর কোনো শরিক নেই, তাঁর সমতুল্য কিছু নেই। সৃষ্টি, রিযিক, জীবন-মৃত্যু ও সর্বপ্রকার ইবাদত কেবল তাঁরই জন্য। এই একত্ববোধই তাওহীদ। আল্লাহর সঙ্গে কাউকে শরিক করা (শিরক) ইসলামের সবচেয়ে বড় গুনাহ, যা ক্ষমার অযোগ্য যদি তাওবা না করা হয়।',
        content_en:
          'Allah is the one and only Creator, without beginning or end, with no partner, no offspring and nothing comparable to Him. Creation, provision, life, death and all worship belong to Him alone. This oneness is Tawhid; associating partners with Him (shirk) is the gravest sin.',
        reference: 'সূরা আল-ইখলাস: ১-৪, সূরা আয-যারিয়াত: ৫৬, সূরা লুকমান: ১৩',
        tags: ['তাওহীদ', 'শিরক', 'আকীদা'],
      },
      {
        id: 'aqeedah-angels',
        title_bn: 'ফেরেশতাদের প্রতি বিশ্বাস',
        title_en: 'Belief in the Angels',
        content_bn:
          'ফেরেশতারা নূরের তৈরি আল্লাহর বিশেষ সৃষ্টি। তাঁরা নারী-পুরুষের পরিচয়বিহীন, খান না, পান করেন না, অবাধ্য হন না এবং আল্লাহর আদেশ অক্ষরে অক্ষরে পালন করেন। জিবরাইল (আ.) ওহী বহনকারী, মিকাইল (আ.) রিযিক সংক্রান্ত, ইসরাফিল (আ.) শিঙায় ফুৎকার দেবেন এবং মালাকুল মাউত প্রাণ হরণ করেন।',
        content_en:
          'Angels are created from light, free of gender and bodily needs, perfectly obedient to Allah. Jibril brought revelation, Mikail handles provision, Israfil will blow the trumpet, and the angel of death takes souls.',
        reference: 'সূরা আল-বাকারা: ২৮৫, সহীহ মুসলিম: ২৯৯৬',
        tags: ['ফেরেশতা', 'জিবরাইল', 'আকীদা'],
      },
      {
        id: 'aqeedah-books',
        title_bn: 'আসমানি কিতাবসমূহে বিশ্বাস',
        title_en: 'Belief in the Revealed Books',
        content_bn:
          'আল্লাহ যুগে যুগে নবী-রাসূলদের উপর কিতাব নাযিল করেছেন: মুসা (আ.)-এর তাওরাত, দাউদ (আ.)-এর যাবূর, ঈসা (আ.)-এর ইঞ্জিল এবং সর্বশেষ মুহাম্মদ (সা.)-এর উপর আল-কুরআন। কুরআনই একমাত্র কিতাব যা পরিবর্তনহীন অবস্থায় সংরক্ষিত; তা পূর্ববর্তী কিতাবগুলোর মূল শিক্ষার সত্যায়ন করে এবং তাদের স্থলাভিষিক্ত হয়।',
        content_en:
          'Allah revealed the Tawrah to Musa, the Zabur to Dawud, the Injil to Isa, and finally the Quran to Muhammad ﷺ. The Quran is the only preserved scripture; it confirms the original teaching of earlier books and supersedes their rulings.',
        reference: 'সূরা আল-মায়িদা: ৪৮, সূরা আল-হিজর: ৯',
        tags: ['কিতাব', 'কুরআন', 'ইঞ্জিল', 'তাওরাত'],
      },
      {
        id: 'aqeedah-prophets',
        title_bn: 'নবী ও রাসূলগণে বিশ্বাস',
        title_en: 'Belief in the Prophets and Messengers',
        content_bn:
          'হযরত আদম (আ.) থেকে হযরত মুহাম্মদ (সা.) পর্যন্ত সকল নবী সত্য। তাঁরা মানবজাতির মধ্যে নির্বাচিত, সত্যভাষী, আমানতদার ও নিষ্পাপ। কুরআনে ২৫ জন নবীর নাম উল্লিখিত। হযরত মুহাম্মদ (সা.) সর্বশেষ নবী (খাতামুন নাবিয়্যীন); তাঁর পরে কোনো নবী আসবেন না।',
        content_en:
          'All prophets from Adam to Muhammad ﷺ are true — chosen, truthful, trustworthy and protected from sin. Twenty-five are named in the Quran. Muhammad ﷺ is the final prophet; no prophet comes after him.',
        reference: 'সূরা আল-আহযাব: ৪০, সূরা আল-বাকারা: ২৮৫',
        tags: ['নবী', 'রাসূল', 'খাতামুন নাবিয়্যীন'],
      },
      {
        id: 'aqeedah-akhirah',
        title_bn: 'আখিরাত বা পরকালে বিশ্বাস',
        title_en: 'Belief in the Hereafter',
        content_bn:
          'মৃত্যুর পর প্রতিটি মানুষকে কবরে, তারপর কিয়ামতের দিন পুনরায় জীবিত করা হবে। আমলনামা হিসাব হবে, মীযানে নেকি-গুনাহ ওজন হবে, পুলসিরাত পার হতে হবে; ফলাফল হিসেবে জান্নাত অথবা জাহান্নাম। আখিরাতের বিশ্বাস মানুষকে দুনিয়ার লোভ থেকে সংযত ও দায়িত্বশীল করে।',
        content_en:
          'After death comes the grave, then resurrection on the Day of Judgement. Deeds are weighed, records are read, and the outcome is either Jannah or Jahannam. Belief in the Hereafter restrains greed and makes a person accountable.',
        reference: 'সূরা আল-কাহফ: ৪৭-৪৯, সূরা আল-কিয়ামাহ: ১-১৫',
        tags: ['আখিরাত', 'কিয়ামত', 'জান্নাত', 'জাহান্নাম'],
      },
      {
        id: 'aqeedah-qadar',
        title_bn: 'তাকদীর বা ভাগ্যে বিশ্বাস',
        title_en: 'Belief in Divine Decree (Qadar)',
        content_bn:
          'ভালো-মন্দ সবকিছুই আল্লাহর পূর্বনির্ধারিত জ্ঞান, লিখন ও অনুমতিক্রমে ঘটে। তবে আল্লাহ মানুষকে ইচ্ছা ও চেষ্টার স্বাধীনতা দিয়েছেন; তাই সুফল-কুফলের দায়িত্ব মানুষের নিজের। তাকদীরে বিশ্বাস মানে আল্লাহর সিদ্ধান্তে সন্তুষ্ট থাকা, বিপদে ধৈর্য ও নিয়ামতে কৃতজ্ঞতা।',
        content_en:
          "Everything, good and bad, happens within Allah's prior knowledge and decree. Yet Allah grants humans freedom to choose and strive, so responsibility remains with the person. Believing in qadar means contentment, patience in hardship and gratitude in ease.",
        reference: 'সূরা আল-হাদীদ: ২২-২৩, সহীহ মুসলিম: ৮',
        tags: ['তাকদীর', 'সবর', 'শোকর'],
      },
    ],
  },
  {
    id: 'ibadah',
    title_bn: '২. ইবাদত — ইসলামের ৫টি স্তম্ভ',
    title_en: '2. Ibadah — The Five Pillars of Islam',
    summary_bn:
      'কালিমা, সালাত, সাওম, যাকাত ও হজ — এই পাঁচ স্তম্ভের উপর ইসলামের আমলিক কাঠামো দাঁড়িয়ে আছে।',
    summary_en: 'Shahadah, Salah, Sawm, Zakat and Hajj form the practical structure of Islam.',
    articles: [
      {
        id: 'ibadah-kalima',
        title_bn: 'কালিমা (শাহাদাত)',
        title_en: 'The Shahadah',
        content_bn:
          'لَا إِلَهَ إِلَّا اللَّهُ مُحَمَّدٌ رَسُولُ اللَّهِ — আল্লাহ এক, মুহাম্মদ (সা.) তাঁর রাসূল। এই সাক্ষ্য অন্তরে বিশ্বাস, জিহ্বায় উচ্চারণ ও জীবনে বাস্তবায়ন করাই ইসলামে প্রবেশের সোপান। কালিমা কবুলের শর্ত: আল্লাহ ছাড়া সব মাবুদের অস্বীকার, নবীজির সুন্নাহর অনুসরণ এবং প্রিয়-অপ্রিয় সব অবস্থায় আল্লাহর হুকুম মেনে নেওয়া।',
        content_en:
          'La ilaha illallah, Muhammadur rasulullah — there is no god but Allah, and Muhammad ﷺ is His Messenger. Believing in the heart, declaring with the tongue and living by it is the entry into Islam.',
        reference: 'সহীহ বুখারী: ৮, সহীহ মুসলিম: ২২',
        tags: ['কালিমা', 'শাহাদাত', 'ঈমান'],
      },
      {
        id: 'ibadah-salah',
        title_bn: 'সালাত (নামাজ)',
        title_en: 'Salah (Prayer)',
        content_bn:
          'প্রাপ্তবয়স্ক, সুস্থ ও বিবেকবান প্রতিটি মুসলিমের উপর দিনে পাঁচ ওয়াক্ত ফরজ নামাজ আদায় করা আবশ্যক। নামাজ আল্লাহর সঙ্গে বান্দার সরাসরি সংযোগ, যা মানুষকে অশ্লীলতা ও অন্যায় থেকে বিরত রাখে। কিয়াম, কিরাত, রুকু, সিজদা ও বৈঠক — এই পাঁচটি মূল ভঙ্গিতে নামাজ সম্পন্ন হয়।',
        content_en:
          'Every sane, adult, healthy Muslim must pray five times daily. Salah connects the servant directly with Allah and restrains from indecency and wrongdoing. It comprises standing, recitation, bowing, prostration and sitting.',
        reference: 'সূরা আল-আনকাবুত: ৪৫, সহীহ বুখারী: ৫২৭',
        tags: ['নামাজ', 'সালাত', 'ফরজ'],
      },
      {
        id: 'ibadah-sawm',
        title_bn: 'সাওম (রোজা)',
        title_en: 'Sawm (Fasting)',
        content_bn:
          'রমজান মাসের প্রতিটি প্রাপ্তবয়স্ক মুসলিমের উপর সুবহে সাদিক থেকে সূর্যাস্ত পর্যন্ত পানাহার ও দাম্পত্য সম্পর্ক থেকে বিরত থাকা ফরজ। রোজা আত্মসংযম, তাকওয়া ও সহানুভূতি শেখায়। অসুস্থ, মুসাফির, গর্ভবতী ও দুগ্ধদানকারী মায়ের জন্য ছাড় রয়েছে — পরবর্তীতে কাজা বা ফিদইয়া দিয়ে তা পূরণ করতে হয়।',
        content_en:
          'Fasting the month of Ramadan from dawn to sunset is obligatory for adult Muslims. It builds taqwa, self-restraint and empathy. Exemptions exist for the ill, travellers, pregnant and nursing mothers, with make-up or fidyah as prescribed.',
        reference: 'সূরা আল-বাকারা: ১৮৩-১৮৫',
        tags: ['রোজা', 'রমজান', 'সাওম'],
      },
      {
        id: 'ibadah-zakat',
        title_bn: 'যাকাত',
        title_en: 'Zakat',
        content_bn:
          'নিসাব পরিমাণ সম্পদের উপর বছর পূর্ণ হলে ৪০ ভাগের ১ ভাগ (২.৫%) যাকাত ফরজ। যাকাত পরিশোধকারীর সম্পদ পবিত্র হয় এবং সমাজে সম্পদের প্রবাহ নিশ্চিত হয়। কুরআনে যাকাতের ৮টি নির্ধারিত খাত উল্লিখিত, যার মধ্যে ফকির, মিসকিন, ঋণগ্রস্ত ও যাকাত আদায়ে নিয়োজিত ব্যক্তিরা অন্যতম।',
        content_en:
          'Zakat is 2.5% of qualifying wealth held for a lunar year. It purifies wealth and circulates it in society. The Quran names eight categories of recipients, including the poor, the needy and those in debt.',
        reference: 'সূরা আত-তাওবা: ৬০, সূরা আল-বাকারা: ২৬৭',
        tags: ['যাকাত', 'নিসাব', 'ফকির'],
      },
      {
        id: 'ibadah-hajj',
        title_bn: 'হজ',
        title_en: 'Hajj',
        content_bn:
          'শারীরিক ও আর্থিক সামর্থ্য থাকলে জীবনে একবার হজ করা ফরজ। হজের মূল আনুষ্ঠানিকতা: ইহরাম, তাওয়াফে কাবা, সাঈ, আরাফাতে অবস্থান, মুজদালিফায় রাতযাপন, মিনায় কঙ্কর নিক্ষেপ, কুরবানি ও তাওয়াফে জিয়ারত। আরাফাতে অবস্থান হজের সবচেয়ে গুরুত্বপূর্ণ রুকন; তা ছুটে গেলে হজ হয় না।',
        content_en:
          "Hajj is obligatory once in a lifetime for those physically and financially able. Its rites include ihram, tawaf, sa'i, standing at Arafah, the night at Muzdalifah, stoning, sacrifice and tawaf al-ziyarah. Standing at Arafah is the essential pillar.",
        reference: 'সূরা আলে ইমরান: ৯৭, সহীহ মুসলিম: ১৩৩৭',
        tags: ['হজ', 'ইহরাম', 'আরাফাত'],
      },
    ],
  },
  {
    id: 'sources',
    title_bn: '৩. পবিত্র কুরআন ও সুন্নাহ',
    title_en: '3. The Quran and Sunnah',
    summary_bn:
      'কুরআন ও সহীহ হাদিস — ইসলামি জ্ঞানের দুই মূল উৎস। এদের বাইরের কোনো মতকে দ্বীনের প্রমাণ হিসেবে গ্রহণ করা যায় না।',
    summary_en: 'The Quran and authentic Sunnah are the two primary sources of Islamic knowledge.',
    articles: [
      {
        id: 'sources-quran',
        title_bn: 'আল-কুরআন',
        title_en: 'The Holy Quran',
        content_bn:
          'কুরআন আল্লাহর সর্বশেষ ও অপরিবর্তিত গ্রন্থ — ৩০ পারা, ১১৪ সূরা। নাযিলকাল ২৩ বছরব্যাপী, হেরা গুহায় প্রথম ওহী থেকে বিদায় হজের ভাষণ পর্যন্ত। কুরআন সংরক্ষণের তিন স্তর: হিফজ (মুখস্থ), কিতাবত (লিখন) ও তিলাওয়াত (পাঠ)। আল্লাহ নিজেই এর সংরক্ষণের দায়িত্ব নিয়েছেন।',
        content_en:
          "The Quran is Allah's final, unchanged revelation: 30 parts, 114 surahs, revealed over 23 years. Allah Himself guarantees its preservation.",
        reference: 'সূরা আল-হিজর: ৯, সূরা ফুসসিলাত: ৪২',
        tags: ['কুরআন', 'ওহী', 'হিফজ'],
      },
      {
        id: 'sources-hadith',
        title_bn: 'আল-হাদিস (সুন্নাহ)',
        title_en: 'Hadith and Sunnah',
        content_bn:
          'নবীজি (সা.)-এর বাণী (কওল), কর্ম (ফিল) ও মৌনসম্মতি (তাকরির) — এই তিনটির সমষ্টিই সুন্নাহ। প্রসিদ্ধ সংকলন: সহীহ বুখারী, সহীহ মুসলিম, সুনানে আবু দাউদ, তিরমিজি, নাসাঈ ও ইবনে মাজাহ। হাদিস গ্রহণের পূর্বে সনদ ও রাবীর নির্ভরযোগ্যতা যাচাই ফিকহশাস্ত্রের মৌলিক নীতি।',
        content_en:
          "Sunnah covers the Prophet's ﷺ words, actions and tacit approvals. The major collections include Sahih al-Bukhari and Sahih Muslim. Verification of the chain of narration is a core science.",
        reference: 'সূরা আল-হাশর: ৭, সহীহ মুসলিম: ১৫৯৮',
        tags: ['হাদিস', 'সুন্নাহ', 'বুখারী'],
      },
    ],
  },
  {
    id: 'history',
    title_bn: '৪. নবী-রাসূল ও ইসলামের ইতিহাস',
    title_en: '4. Prophets and Islamic History',
    summary_bn:
      'সৃষ্টিতত্ত্ব, কাসাসুল আম্বিয়া, সীরাতুন নবী (সা.), সাহাবা ও খেলাফতের সোনালী যুগ — ইতিহাস জানলে ঈমান গভীর হয়।',
    summary_en:
      'Creation, the prophets, the life of Muhammad ﷺ, the Companions and the golden age of the caliphate.',
    articles: [
      {
        id: 'history-creation',
        title_bn: 'আল্লাহ কেন মানুষ ও জিন সৃষ্টি করেছেন?',
        title_en: 'Why did Allah create mankind and jinn?',
        content_bn:
          'মহান আল্লাহ মানুষ ও জিন জাতিকে সৃষ্টি করেছেন একমাত্র তাঁর ইবাদত ও দাসত্ব করার জন্য। মানুষ সৃষ্টির পূর্বে আল্লাহ ফেরেশতাদের জানিয়েছিলেন যে তিনি পৃথিবীতে তাঁর প্রতিনিধি (খলিফা) সৃষ্টি করবেন। প্রথম মানব হযরত আদম (আ.)-কে মাটি থেকে সৃষ্টি করে আল্লাহ তাঁকে সকল কিছুর নাম ও জ্ঞান শিক্ষা দিয়েছিলেন।',
        content_en:
          'Allah created mankind and jinn solely to worship and serve Him. Before creating man He told the angels He would place a vicegerent on earth. He created Adam from clay and taught him the names of all things.',
        reference: 'সূরা আয-যারিয়াত: ৫৬, সূরা আল-বাকারা: ৩০-৩৩',
        tags: ['আদম (আ.)', 'সৃষ্টি', 'খলিফা', 'জিন'],
      },
      {
        id: 'history-seerah-birth',
        title_bn: 'নবীজি (সা.)-এর জন্ম ও শৈশব',
        title_en: 'Birth and childhood of the Prophet ﷺ',
        content_bn:
          'হযরত মুহাম্মদ (সা.) ৫৭০ খ্রিস্টাব্দে (হস্তী বাহিনীর ঘটনার বছর) মক্কার সম্ভ্রান্ত কুরাইশ বংশে জন্মগ্রহণ করেন। জন্মের পূর্বেই তাঁর পিতা আব্দুল্লাহ এবং ৬ বছর বয়সে মাতা আমিনা ইন্তেকাল করেন। এরপর দাদা আব্দুল মুত্তালিব ও চাচা আবু তালিবের তত্ত্বাবধানে তিনি বেড়ে ওঠেন এবং সত্যবাদিতার জন্য "আল-আমিন" উপাধি লাভ করেন।',
        content_en:
          'Muhammad ﷺ was born in 570 CE in the noble Quraysh clan of Makkah, the year of the Elephant. His father Abdullah died before his birth and his mother Aminah when he was six. Raised by his grandfather Abdul Muttalib and then his uncle Abu Talib, he earned the title al-Amin, the trustworthy.',
        reference: 'আর-রাহীকুল মাখতূম, সীরাতে ইবনে হিশাম',
        tags: ['সীরাত', 'জন্ম', 'আল-আমিন'],
      },
      {
        id: 'history-seerah-wahy',
        title_bn: 'হেরা গুহায় প্রথম ওহী নাযিল',
        title_en: 'The first revelation in the cave of Hira',
        content_bn:
          '৪০ বছর বয়সে নবুয়ত লাভের পূর্বে নবীজি (সা.) মক্কার অদূরে জাবালে নূরের হেরা গুহায় ধ্যানমগ্ন থাকতেন। রমজান মাসের এক রাতে ফেরেশতা জিবরাইল (আ.) এসে তাঁকে "ইকরা" (পড়ুন) বলে পবিত্র কুরআনের সূরা আলাকের প্রথম ৫টি আয়াত শোনান। এই ঘটনাই নবুয়তের সূচনা; এরপর ২৩ বছর ধরে ওহী নাযিল হতে থাকে।',
        content_en:
          'At forty, before prophethood, he would retreat to the cave of Hira on Jabal al-Nur. One night in Ramadan the angel Jibril came and said "Iqra" — recite — delivering the first five verses of Surah al-Alaq. This began the 23 years of revelation.',
        reference: 'সূরা আল-আলাক: ১-৫, সহীহ বুখারী: ৩',
        tags: ['হেরা', 'প্রথম ওহী', 'জিবরাইল', 'সীরাত'],
      },
      {
        id: 'history-sahaba-abubakr',
        title_bn: 'হযরত আবু বকর সিদ্দিক (রা.)',
        title_en: 'Abu Bakr as-Siddiq (RA)',
        content_bn:
          'ইসলামের প্রথম খলিফা এবং পুরুষদের মধ্যে সর্বপ্রথম ইসলাম গ্রহণকারী সাহাবি। মিরাজের ঘটনা শোনার সাথে সাথে বিনা দ্বিধায় বিশ্বাস স্থাপন করায় নবীজি (সা.) তাঁকে "সিদ্দিক" (সত্যবাদী) উপাধি দেন। হিজরতের সময় তিনি সাওর গুহায় নবীজির একমাত্র সাথী ছিলেন। তাঁর খিলাফতকালে কুরআন একত্রে সংকলিত হয়।',
        content_en:
          "The first caliph and the first man to accept Islam. For believing the night journey without hesitation he was named as-Siddiq, the truthful. He was the Prophet's ﷺ only companion in the cave of Sawr during the migration, and the Quran was first compiled during his caliphate.",
        reference: 'সহীহ বুখারী: ৩৬৫৩, আসহাবে রাসূলের জীবনকথা',
        tags: ['আবু বকর', 'খলিফা', 'সাহাবি'],
      },
      {
        id: 'history-sahaba-umar',
        title_bn: 'হযরত উমর ইবনুল খাত্তাব (রা.)',
        title_en: 'Umar ibn al-Khattab (RA)',
        content_bn:
          'ইসলামের দ্বিতীয় খলিফা এবং "ফারুক" (সত্য ও মিথ্যার পার্থক্যকারী) উপাধিপ্রাপ্ত মহান সাহাবি। তাঁর ইসলাম গ্রহণের মাধ্যমে মক্কায় মুসলিমরা প্রথম প্রকাশ্যে কাবাঘরে নামাজ আদায়ের সাহস পায়। তাঁর শাসনামলে ইনসাফ ও ন্যায়বিচারের এক অনন্য দৃষ্টান্ত স্থাপিত হয় এবং ইসলামি রাষ্ট্র মিসর, সিরিয়া ও পারস্য পর্যন্ত বিস্তৃত হয়।',
        content_en:
          "The second caliph, titled al-Faruq, the one who distinguishes truth from falsehood. After his acceptance of Islam the Muslims could pray openly at the Ka'bah. His rule is remembered as a model of justice, and the state expanded to Egypt, Syria and Persia.",
        reference: 'সীরাতে ইবনে হিশাম, আল-বিদায়া ওয়ান নিহায়া',
        tags: ['উমর', 'ফারুক', 'খলিফা', 'ন্যায়বিচার'],
      },
      {
        id: 'history-khulafa',
        title_bn: 'খুলাফায়ে রাশেদীন',
        title_en: 'The Rightly Guided Caliphs',
        content_bn:
          'নবীজি (সা.)-এর পরপর চারজন খলিফা ইসলাম পরিচালনা করেন: আবু বকর সিদ্দিক (রা.), উমর ইবনুল খাত্তাব (রা.), উসমান ইবনুল আফফান (রা.) ও আলী ইবনু আবি তালিব (রা.)। তাঁদের সমষ্টিগত শাসনামল (৬৩২-৬৬১ খ্রি.) ইসলামের সোনালী যুগ নামে পরিচিত — এ সময়ে কুরআনের প্রামাণ্য সংকলন, রাষ্ট্রীয় প্রশাসন ও ফিকহের ভিত্তি স্থাপিত হয়।',
        content_en:
          'After the Prophet ﷺ, four caliphs led the community: Abu Bakr, Umar, Uthman and Ali. Their era (632-661 CE) is known as the golden age, when the Quranic codex was standardised, state administration developed and the foundations of fiqh were laid.',
        reference: 'আল-বিদায়া ওয়ান নিহায়া, খিলাফত ও রাজনীতি',
        tags: ['খুলাফায়ে রাশেদীন', 'উসমান', 'আলী'],
      },
    ],
  },
  {
    id: 'muamalat',
    title_bn: '৫. মুয়ামালাত — সামাজিক ও অর্থনৈতিক বিধান',
    title_en: '5. Muamalat — Social and Economic Rulings',
    summary_bn:
      'হালাল-হারাম, ইসলামি অর্থনীতি ও পারিবারিক জীবন — দৈনন্দিন লেনদেন ও সম্পর্কের বিধান।',
    summary_en: 'Halal and haram, Islamic economics, and family life.',
    articles: [
      {
        id: 'muamalat-halal',
        title_bn: 'হালাল ও হারাম',
        title_en: 'Halal and Haram',
        content_bn:
          'মূলনীতি হলো: সবকিছু হালাল, যা আল্লাহ স্পষ্টভাবে হারাম করেননি। খাদ্যে মৃত জীব-জন্তু, রক্ত, শূকরের মাংস ও আল্লাহ ছাড়া অন্যের নামে উৎসর্গকৃত প্রাণী হারাম। উপার্জনে সুদ, ঘুষ, জুয়া, প্রতারণা ও ওজনে কম দেওয়া হারাম।',
        content_en:
          'The default is permissibility unless explicitly prohibited. Forbidden foods include carrion, blood, pork and animals dedicated to other than Allah. Forbidden earnings include interest, bribery, gambling, fraud and short measure.',
        reference: 'সূরা আল-বাকারা: ১৬৮, ১৭৩; সূরা আল-মায়িদা: ৩',
        tags: ['হালাল', 'হারাম', 'খাদ্য', 'উপার্জন'],
      },
      {
        id: 'muamalat-economy',
        title_bn: 'ইসলামিক অর্থনীতি',
        title_en: 'Islamic Economics',
        content_bn:
          'ইসলামি অর্থনীতির ভিত্তি: সুদ (রিবা) সম্পূর্ণ নিষিদ্ধ, ব্যবসায় সততা ও ওজনে পূর্ণতা আবশ্যক, যাকাত ও সাদাকাহ সম্পদের প্রবাহ নিশ্চিত করে, এবং উত্তরাধিকার (ফারায়েজ) আইনে সম্পদ নির্ধারিত অংশে বণ্টিত হয়। শরিয়াহসম্মত বিকল্প: মুদারাবা (লাভ-ক্ষতি ভাগাভাগি), মুশারাকা (অংশীদারত্ব) ও মুরাবাহা (নির্দিষ্ট মুনাফায় বিক্রয়)।',
        content_en:
          'Interest is prohibited, trade must be honest and full in measure, zakat and charity circulate wealth, and inheritance follows fixed shares (faraid). Shariah-compliant alternatives include mudarabah, musharakah and murabahah.',
        reference: 'সূরা আল-বাকারা: ২৭৫-২৭৯, সূরা আন-নিসা: ১১',
        tags: ['রিবা', 'যাকাত', 'ফারায়েজ', 'মুদারাবা'],
      },
      {
        id: 'muamalat-family',
        title_bn: 'পারিবারিক জীবন',
        title_en: 'Family Life',
        content_bn:
          'বিবাহ ইসলামে ইবাদত; উভয় পক্ষের সম্মতিতে চুক্তি সম্পন্ন হয় এবং মোহর নারীর অধিকার। স্বামী-স্ত্রীর পারস্পরিক অধিকার, সন্তানের লালন-পালন, মা-বাবার সেবা ও আত্মীয়তার সম্পর্ক রক্ষা ইসলামি পরিবার ব্যবস্থার মূল স্তম্ভ। তালাক অনুমোদিত হলেও আল্লাহর কাছে সবচেয়ে অপছন্দনীয় বৈধ কাজ; তা কেবল চূড়ান্ত প্রয়োজনে, ইদ্দত ও সমঝোতার শর্তসাপেক্ষে।',
        content_en:
          "Marriage is an act of worship, completed by mutual consent, with mahr as the woman's right. Mutual rights of spouses, raising children, caring for parents and maintaining kinship are central. Divorce is permitted but most disliked by Allah, allowed only as a last resort with waiting period and reconciliation.",
        reference: 'সূরা আর-রূম: ২১, সূরা আন-নিসা: ১৯, সুনানে আবু দাউদ: ২১৭৮',
        tags: ['বিবাহ', 'মোহর', 'তালাক', 'পরিবার'],
      },
    ],
  },
  {
    id: 'akhlaq',
    title_bn: '৬. আখলাক — নৈতিকতা ও শিষ্টাচার',
    title_en: '6. Akhlaq — Character and Manners',
    summary_bn:
      'নবীজি (সা.) বলেছেন, আমি প্রেরিত হয়েছি উত্তম চরিত্রকে পূর্ণতা দিতে। সত্যবাদিতা, আমানত ও ক্ষমাই মুমিনের অলংকার।',
    summary_en: 'The Prophet ﷺ said he was sent to perfect good character.',
    articles: [
      {
        id: 'akhlaq-virtues',
        title_bn: 'সত্যবাদিতা ও আমানতদারিতা',
        title_en: 'Truthfulness and Trustworthiness',
        content_bn:
          'সত্যবাদিতা মুমিনের মৌলিক গুণ; মিথ্যা মুনাফিকের আলামত। আমানতদারিতা অর্থ শুধু অর্থ-সম্পদ নয় — গোপন কথা, সময়, দায়িত্ব ও প্রতিশ্রুতিও আমানতের অন্তর্ভুক্ত। নবীজি (সা.) মক্কায় কাফিরদের সম্পদও আমানত হিসেবে রক্ষা করেছেন, যা ইসলামের চরিত্রগত প্রমাণ।',
        content_en:
          'Truthfulness is a core quality of the believer, while lying is a sign of hypocrisy. Trust covers wealth, secrets, time and responsibilities. The Prophet ﷺ safeguarded even the wealth of those who opposed him.',
        reference: 'সহীহ বুখারী: ৩৩, সূরা আন-নিসা: ৫৮',
        tags: ['সত্যবাদিতা', 'আমানত', 'মুনাফিক'],
      },
      {
        id: 'akhlaq-patience',
        title_bn: 'সবর ও শোকর',
        title_en: 'Patience and Gratitude',
        content_bn:
          'সবর তিন প্রকার: বিপদে ধৈর্য, গুনাহ থেকে বিরত থাকার ধৈর্য এবং ইবাদতে অবিচলতা। শোকর হলো নিয়ামতকে আল্লাহর পক্ষ থেকে জেনে মুখে স্বীকৃতি দেওয়া ও আমলে ব্যবহার করা। আল্লাহ বলেন, "যদি তোমরা শোকর করো, আমি তোমাদের আরও বাড়িয়ে দেব।" বিপদে ধৈর্য ও নিয়ামতে শোকর — এই দুই গুণেই মুমিনের জীবন ভারসাম্যপূর্ণ হয়।',
        content_en:
          'Patience has three forms: enduring hardship, refraining from sin, and persisting in worship. Gratitude means recognising blessings as from Allah, acknowledging them and using them rightly. Allah promises increase for the grateful.',
        reference: 'সূরা ইবরাহীম: ৭, সূরা আল-বাকারা: ১৫৫-১৫৭',
        tags: ['সবর', 'শোকর', 'নিয়ামত'],
      },
      {
        id: 'akhlaq-social',
        title_bn: 'প্রতিবেশীর হক ও গীবত-হিংসা বর্জন',
        title_en: 'Rights of Neighbours and Avoiding Backbiting',
        content_bn:
          'প্রতিবেশীর হক আদায় ইসলামি সমাজবোধের মাপকাঠি — নবীজি (সা.) বলেন, যে প্রতিবেশীর অনিষ্ট থেকে প্রতিবেশী নিরাপদ নয়, সে পূর্ণ মুমিন নয়। গীবত (অনুপস্থিত ব্যক্তির দোষ চর্চা) মৃত ভাইয়ের গোশত খাওয়ার সমতুল্য ঘৃণ্য কাজ। হিংসা নেকি নষ্ট করে, অহংকার সত্য প্রত্যাখ্যানের কারণ।',
        content_en:
          "Fulfilling a neighbour's rights is a measure of faith; the Prophet ﷺ said one whose neighbour is not safe from his harm is not a complete believer. Backbiting is likened to eating a dead brother's flesh. Envy destroys good deeds and arrogance leads to rejecting the truth.",
        reference: 'সহীহ বুখারী: ৬০১১, সূরা আল-হুজুরাত: ১২',
        tags: ['প্রতিবেশী', 'গীবত', 'হিংসা', 'অহংকার'],
      },
    ],
  },
  {
    id: 'dua',
    title_bn: '৭. দৈনন্দিন দোয়া ও জিকির',
    title_en: '7. Daily Duas and Dhikr',
    summary_bn:
      'ঘুম থেকে ওঠা থেকে রাতে ঘুমানো পর্যন্ত প্রতিটি কাজের জন্য নবীজি (সা.)-এর শেখানো বিশুদ্ধ দোয়া ও জিকির।',
    summary_en: 'Authentic daily supplications from waking to sleeping.',
    articles: [
      {
        id: 'dua-morning',
        title_bn: 'ঘুম থেকে ওঠার দোয়া',
        title_en: 'Dua on waking up',
        content_bn:
          'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ — উচ্চারণ: আলহামদু লিল্লাহিল্লাযী আহইয়ানা বা\'দা মা আমাতানা ওয়া ইলাইহিন নুশূর। অর্থ: সকল প্রশংসা আল্লাহর, যিনি মৃত্যুর (ঘুমের) পর আমাদের জীবন দান করেছেন এবং তাঁরই কাছে পুনরুত্থান।',
        content_en:
          "Alhamdulillahil-ladhi ahyana ba'da ma amatana wa ilayhin-nushur — All praise is for Allah who gave us life after death, and to Him is the return.",
        reference: 'সহীহ বুখারী: ৬৩১২',
        tags: ['ঘুম', 'সকাল', 'দোয়া'],
      },
      {
        id: 'dua-sleep',
        title_bn: 'ঘুমানোর দোয়া',
        title_en: 'Dua before sleeping',
        content_bn:
          'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا — উচ্চারণ: বিসমিকা আল্লাহুম্মা আমূতু ওয়া আহইয়া। অর্থ: হে আল্লাহ! আপনার নামেই আমি মরি ও জীবিত হই। রাতে ঘুমানোর পূর্বে আয়াতুল কুরসি ও তিন কুল পাঠ করে হাতে ফুঁ দিয়ে শরীরে মাসেহ করা সুন্নত।',
        content_en:
          'Bismika Allahumma amutu wa ahya — In Your name, O Allah, I die and I live. Reciting Ayat al-Kursi and the three Quls before sleep is Sunnah.',
        reference: 'সহীহ বুখারী: ৬৩২৪',
        tags: ['ঘুম', 'রাত', 'আয়াতুল কুরসি'],
      },
      {
        id: 'dua-distress',
        title_bn: 'বিপদ ও দুশ্চিন্তার দোয়া',
        title_en: 'Dua in distress and anxiety',
        content_bn:
          'لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ — উচ্চারণ: লা ইলাহা ইল্লাল্লাহুল আযীমুল হালীম, লা ইলাহা ইল্লাল্লাহু রাব্বুল আরশিল আযীম। অর্থ: মহান ও সহনশীল আল্লাহ ছাড়া কোনো উপাস্য নেই; মহান আরশের প্রতিপালক আল্লাহ ছাড়া কোনো উপাস্য নেই।',
        content_en:
          'La ilaha illallahul-Azimul-Halim, la ilaha illallahu Rabbul-Arshil-Azim — There is no god but Allah, the Mighty, the Forbearing; there is no god but Allah, Lord of the Mighty Throne.',
        reference: 'সহীহ বুখারী: ৬৩৪৬, সহীহ মুসলিম: ২৭৩০',
        tags: ['বিপদ', 'দুশ্চিন্তা', 'প্রশান্তি'],
      },
    ],
  },
  {
    id: 'science',
    title_bn: '৮. ইসলাম ও বিজ্ঞান',
    title_en: '8. Islam and Science',
    summary_bn:
      'কুরআনে মহাবিশ্ব সৃষ্টি, ভ্রূণতত্ত্ব ও সমুদ্রবিজ্ঞানের ইঙ্গিত এবং মুসলিম বিজ্ঞানীদের অবদান।',
    summary_en:
      'Quranic references to cosmology, embryology and oceans, and Muslim contributions to science.',
    articles: [
      {
        id: 'science-cosmos',
        title_bn: 'মহাবিশ্ব সৃষ্টি ও বিগ ব্যাং',
        title_en: 'Cosmology and the Big Bang',
        content_bn:
          'কুরআন বলে: "আকাশমণ্ডল ও পৃথিবী একসাথে মিলিত ছিল, তারপর আমি তাদের পৃথক করলাম।" (সূরা আল-আম্বিয়া: ৩০)। আধুনিক জ্যোতির্বিজ্ঞান বলছে, প্রায় ১৩.৮ বিলিয়ন বছর আগে একক বিন্দু থেকে মহাবিশ্ব বিস্তৃত হয়। কুরআনের "সাত আসমান" ধারণা স্তরবিন্যাসকেই ইঙ্গিত করে — "তিনি সাত আসমান স্তরে স্তরে সৃষ্টি করেছেন।" (সূরা আল-মুলক: ৩)',
        content_en:
          'The Quran states that the heavens and the earth were joined and then separated (21:30), and that He created seven heavens in layers (67:3). Modern cosmology describes the universe expanding from a singularity about 13.8 billion years ago.',
        reference: 'সূরা আল-আম্বিয়া: ৩০, সূরা আল-মুলক: ৩, সূরা ফুসসিলাত: ১১',
        tags: ['বিগ ব্যাং', 'মহাবিশ্ব', 'জ্যোতির্বিজ্ঞান'],
      },
      {
        id: 'science-embryo',
        title_bn: 'ভ্রূণতত্ত্ব',
        title_en: 'Embryology',
        content_bn:
          'সূরা আল-মুমিনুনে ভ্রূণের বিকাশের ধারাবাহিকতা বর্ণিত: নুতফা (শুক্রবিন্দু) → আলাকা (রক্তপিণ্ড/আটকে থাকা বস্তু) → মুদগা (চর্বিত মাংসপিণ্ড) → হাড় গঠন → মাংসে আবৃত করা। আধুনিক ভ্রূণতত্ত্ব একই ক্রম নিশ্চিত করে।',
        content_en:
          'Surah al-Muminun describes the stages: nutfah (drop), alaqah (clinging clot), mudghah (chewed lump), bone formation, then clothing with flesh. Modern embryology confirms the same sequence.',
        reference: 'সূরা আল-মুমিনুন: ১২-১৪, সূরা আল-হজ: ৫',
        tags: ['ভ্রূণ', 'নুতফা', 'আলাকা'],
      },
      {
        id: 'science-ocean',
        title_bn: 'সমুদ্রবিজ্ঞান',
        title_en: 'Oceanography',
        content_bn:
          'কুরআনে গভীর সমুদ্রের অন্ধকার বর্ণিত: "অথবা যেন সে গভীর সমুদ্রের অন্ধকারে আছে; তার উপর একটি তরঙ্গ, তার উপর আরেক তরঙ্গ, তার উপর মেঘ।" (সূরা আন-নূর: ৪০)। আধুনিক সমুদ্রবিজ্ঞান জানায়, ২০০ মিটার গভীরের পর আলো পৌঁছায় না — এ অঞ্চলে অন্তর্নিহিত তরঙ্গ সৃষ্টি হয়।',
        content_en:
          'The Quran mentions the darkness of the deep ocean with waves above waves and clouds above them (24:40). Oceanography confirms that below 200 metres light cannot reach and internal waves occur there.',
        reference: 'সূরা আন-নূর: ৪০, সূরা আর-রহমান: ১৯-২০',
        tags: ['সমুদ্র', 'তরঙ্গ', 'গভীরতা'],
      },
      {
        id: 'science-scholars',
        title_bn: 'মুসলিম বিজ্ঞানীদের অবদান',
        title_en: 'Contributions of Muslim Scientists',
        content_bn:
          'ইবনে সিনা (৯৮০-১০৩৭): "আল-কানুন ফিত তিব" — চিকিৎসাবিজ্ঞানের বিশ্বকোষ, ৬০০ বছর ইউরোপে পাঠ্য। আল-খোয়ারিজমি (৭৮০-৮৫০): বীজগণিতের (আলজেবরা) জনক। ইবনুল হাইসাম (৯৬৫-১০৪০): আধুনিক আলোকবিজ্ঞান ও বৈজ্ঞানিক পরীক্ষা পদ্ধতির প্রতিষ্ঠাতা। আল-বিরুনি, জাবির ইবনে হাইয়ান ও আল-রাজিও উল্লেখযোগ্য।',
        content_en:
          'Ibn Sina wrote the Canon of Medicine, a standard text in Europe for 600 years. Al-Khwarizmi founded algebra. Ibn al-Haytham established modern optics and the experimental method. Al-Biruni, Jabir ibn Hayyan and al-Razi are also prominent.',
        reference: 'তারিখুল হিকমা, মুসলিম বিজ্ঞানীদের অবদান',
        tags: ['ইবনে সিনা', 'আল-খোয়ারিজমি', 'ইবনুল হাইসাম'],
      },
    ],
  },
];

export const LECTURE_VIDEOS: LectureVideo[] = [
  {
    id: 'v-jahangir-1',
    youtubeId: 'GDGasMbuuM4',
    title_bn: 'আল্লাহ তায়ালার আকার আছে কি?',
    speaker_bn: 'ড. খোন্দকার আব্দুল্লাহ জাহাঙ্গীর (রাহ.)',
    topic_bn: 'আকীদা',
  },
  {
    id: 'v-jahangir-2',
    youtubeId: 'E6TbUh20zcs',
    title_bn: 'রাসূলুল্লাহ (সা.) ফকির ছিলেন না?',
    speaker_bn: 'ড. খোন্দকার আব্দুল্লাহ জাহাঙ্গীর (রাহ.)',
    topic_bn: 'সীরাত',
  },
  {
    id: 'v-azhari-1',
    youtubeId: 'kXny7cqAxDU',
    title_bn: 'সূরা হাশরের তাফসীর',
    speaker_bn: 'মিজানুর রহমান আজহারী',
    topic_bn: 'তাফসীর',
  },
  {
    id: 'v-azhari-2',
    youtubeId: 'SPcsRnKKngE',
    title_bn: 'জাহান্নামের বয়ান',
    speaker_bn: 'মিজানুর রহমান আজহারী',
    topic_bn: 'আখিরাত',
  },
  {
    id: 'v-ahmadullah-1',
    youtubeId: 'TlMNXvVn0ds',
    title_bn: 'হিংসা এবং রাগ এক ভয়ানক পাপ',
    speaker_bn: 'শায়খ আহমাদুল্লাহ',
    topic_bn: 'আখলাক',
  },
  {
    id: 'v-ahmadullah-2',
    youtubeId: 'YSbI8OMPi9M',
    title_bn: 'জীবনে হতাশ হলে এই আলোচনাটি শুনুন',
    speaker_bn: 'শায়খ আহমাদুল্লাহ',
    topic_bn: 'আখলাক',
  },
  {
    id: 'v-ahmadullah-3',
    youtubeId: 'd1WW1NCce8o',
    title_bn: 'শীতকালের স্পেশাল ৬টি আমল',
    speaker_bn: 'শায়খ আহমাদুল্লাহ',
    topic_bn: 'আমল',
  },
  {
    id: 'v-gunobi-1',
    youtubeId: 'jnbsgcCWR8E',
    title_bn: 'প্রতিটি কথায় হুংকার কেন?',
    speaker_bn: 'মুফতি মাহমুদুল হাসান গুনবী',
    topic_bn: 'আখলাক',
  },
  {
    id: 'v-gunobi-2',
    youtubeId: 'YaeuzPv0LBQ',
    title_bn: 'যারা এখনো বিয়ে করেননি',
    speaker_bn: 'মুফতি মাহমুদুল হাসান গুনবী',
    topic_bn: 'পরিবার',
  },
];
