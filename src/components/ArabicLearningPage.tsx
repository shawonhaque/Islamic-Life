import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
  Copy,
  Ear,
  Eraser,
  FileAudio,
  GraduationCap,
  Languages,
  Loader2,
  MessageCircle,
  Mic,
  PenTool,
  Printer,
  RotateCw,
  Search,
  Sparkles,
  Square,
  Star,
  Trophy,
  Upload,
  Volume2,
} from 'lucide-react';
import {
  ACADEMY_QUIZ_QUESTIONS,
  ARABIC_VOCAB_CARDS,
  NAHW_SARF_LESSONS,
  RECITATION_PRACTICE_AYAHS,
  SIFAT_UL_HURUF,
  TAJWEED_COURSE_RULES,
  type AcademyQuizQuestion,
} from '../data/arabicAcademyData';
import {
  ARABIC_LETTERS,
  CONVERSATION_CATEGORIES,
  HARAKAT_RULES,
  SEVENTEEN_MAKHARIJ,
  SPOKEN_ARABIC_PHRASES,
  type ArabicLetterItem,
  type MakhrajItem,
  type SpokenArabicPhrase,
} from '../data/arabicLearningData';
import type { Language } from '../types/islamic';
import { safeReadJson } from '../utils/safeFetch';

interface ArabicLearningPageProps {
  lang: Language;
  onPracticeInAi?: (promptText: string) => void;
  onOpenQuranVerse?: (surahNumber: number, ayahNumber: number) => void;
}

type AcademyTab =
  | 'letters'
  | 'makharij'
  | 'tajweed'
  | 'conversation'
  | 'grammar-writing'
  | 'recitation-ai'
  | 'dashboard';

type ZoneFilter = 'all' | MakhrajItem['zoneId'];

interface AcademyProgressState {
  completedLevels: number[];
  completedLessons: string[];
  bookmarkedItems: string[];
  quizScores: Record<string, { score: number; total: number }>;
  studyStreakDays: number;
  lastStudyDate: string;
  personalNotes: string;
  studentName: string;
}

const ACADEMY_PROGRESS_KEY = 'il_arabic_academy_progress_v1';

const ACADEMY_LEVELS = [
  { level: 1, id: 'l1', bn: 'লেভেল ১: ২৯ আরবি হরফ ও ৪টি রূপ', en: 'Level 1: 29 Arabic Letters & Forms' },
  { level: 2, id: 'l2', idTab: 'letters', bn: 'লেভেল ২: হরকত, তানভিন, সুকুন ও মদ্দ', en: 'Level 2: Harakat, Tanween, Sukun & Madd' },
  { level: 3, id: 'l3', bn: 'লেভেল ৩: ১৭ মাখরাজ ও সিফাতুল হুরুফ', en: 'Level 3: 17 Makharij & Sifatul Huruf' },
  { level: 4, id: 'l4', bn: 'লেভেল ৪: সম্পূর্ণ তাজবিদ কোর্স', en: 'Level 4: Complete Tajweed Rules' },
  { level: 5, id: 'l5', bn: 'লেভেল ৫: আরবি কথোপকথন ও শব্দভাণ্ডার', en: 'Level 5: Spoken Arabic & Vocabulary' },
  { level: 6, id: 'l6', bn: 'লেভেল ৬: নাহু ও সরফ (আরবি ব্যাকরণ) এবং লেখা', en: 'Level 6: Nahw & Sarf Grammar & Writing' },
  { level: 7, id: 'l7', bn: 'লেভেল ৭: AI কেরাত ও কুরআন তেলাওয়াত অনুশীলন', en: 'Level 7: AI Quran Recitation Practice' },
];

const ZONE_OPTIONS: Array<{ id: ZoneFilter; bn: string; en: string; ar: string }> = [
  { id: 'all', bn: 'সব ১৭টি মাখরাজ', en: 'All 17 Makharij', ar: 'الكل' },
  { id: 'jawf', bn: 'আল-জাওফ (১)', en: 'Al-Jawf (1)', ar: 'الجوف' },
  { id: 'halq', bn: 'আল-হালক / কণ্ঠনালি (২–৪)', en: 'Al-Halq / Throat (2–4)', ar: 'الحلق' },
  { id: 'lisan', bn: 'আল-লিসান / জিহ্বা (৫–১৪)', en: 'Al-Lisan / Tongue (5–14)', ar: 'اللسان' },
  { id: 'shafatan', bn: 'আশ-শাফাতান / ঠোঁট (১৫–১৬)', en: 'Ash-Shafatan / Lips (15–16)', ar: 'الشفتان' },
  { id: 'khayshum', bn: 'আল-খাইশুম / নাসিকা (১৭)', en: 'Al-Khayshum / Nasal (17)', ar: 'الخيشوم' },
];

function readProgress(): AcademyProgressState {
  const today = new Date().toISOString().slice(0, 10);
  const fallback: AcademyProgressState = {
    completedLevels: [1],
    completedLessons: [],
    bookmarkedItems: [],
    quizScores: {},
    studyStreakDays: 1,
    lastStudyDate: today,
    personalNotes: '',
    studentName: 'Islamic Life Learner',
  };
  try {
    const raw = localStorage.getItem(ACADEMY_PROGRESS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<AcademyProgressState>;
    const streak =
      parsed.lastStudyDate === today
        ? parsed.studyStreakDays || 1
        : (parsed.studyStreakDays || 1) + 1;
    return {
      ...fallback,
      ...parsed,
      completedLevels: Array.isArray(parsed.completedLevels) ? parsed.completedLevels : [1],
      completedLessons: Array.isArray(parsed.completedLessons) ? parsed.completedLessons : [],
      bookmarkedItems: Array.isArray(parsed.bookmarkedItems) ? parsed.bookmarkedItems : [],
      quizScores: parsed.quizScores && typeof parsed.quizScores === 'object' ? parsed.quizScores : {},
      studyStreakDays: streak,
      lastStudyDate: today,
    };
  } catch {
    return fallback;
  }
}

export function ArabicLearningPage({
  lang,
  onPracticeInAi,
  onOpenQuranVerse,
}: ArabicLearningPageProps) {
  const [activeTab, setActiveTab] = useState<AcademyTab>('letters');
  const [progress, setProgress] = useState<AcademyProgressState>(() => readProgress());

  // Tab 1: Letters & Harakat + Letter Quiz
  const [letterSearch, setLetterSearch] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<ArabicLetterItem>(ARABIC_LETTERS[0]);
  const [selectedVowelIdx, setSelectedVowelIdx] = useState<number>(0);

  // Tab 2: Makharij & Sifat
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>('all');
  const [highlightedMakhraj, setHighlightedMakhraj] = useState<number | null>(null);

  // Tab 3 & Quiz shared state
  const [quizTopicFilter, setQuizTopicFilter] = useState<'all' | AcademyQuizQuestion['topic']>('all');
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});

  // Tab 4: Spoken Arabic & Vocab Flashcards
  const [convCategory, setConvCategory] = useState<'all' | SpokenArabicPhrase['category']>('all');
  const [convSearch, setConvSearch] = useState('');
  const [slowMode, setSlowMode] = useState(false);
  const [vocabFilter, setVocabFilter] = useState<'all' | 'daily' | 'family' | 'food' | 'travel' | 'islamic' | 'verbs'>('all');
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  // Tab 5: Grammar & Canvas Writing Pad
  const [writingLetter, setWritingLetter] = useState<ArabicLetterItem>(ARABIC_LETTERS[0]);
  const [brushWidth, setBrushWidth] = useState<number>(6);
  const [showTraceGuide, setShowTraceGuide] = useState<boolean>(true);
  const [wordBuilder, setWordBuilder] = useState<string>('كتب');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);

  // Tab 6: AI Recitation Teacher
  const [selectedPracticeId, setSelectedPracticeId] = useState<string>(RECITATION_PRACTICE_AYAHS[0].id);
  const [reciting, setReciting] = useState(false);
  const [reciteSec, setReciteSec] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [checkingRecitation, setCheckingRecitation] = useState(false);
  const [recitationResult, setRecitationResult] = useState<{
    transcript: string;
    feedback: string;
    model: string;
  } | null>(null);
  const [recitationError, setRecitationError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<BlobPart[]>([]);
  const reciteTimerRef = useRef<number | null>(null);

  // Tab 7: Certificate print view toggle
  const [showCertificatePreview, setShowCertificatePreview] = useState(false);

  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(ACADEMY_PROGRESS_KEY, JSON.stringify(progress));
    } catch {
      // ignore storage errors
    }
  }, [progress]);

  useEffect(() => {
    return () => {
      if (reciteTimerRef.current) window.clearInterval(reciteTimerRef.current);
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    };
  }, [recordedAudioUrl]);

  const toggleLevelDone = (lvl: number) => {
    setProgress((prev) => ({
      ...prev,
      completedLevels: prev.completedLevels.includes(lvl)
        ? prev.completedLevels.filter((x) => x !== lvl)
        : [...prev.completedLevels, lvl].sort((a, b) => a - b),
    }));
  };

  const toggleBookmarkItem = (itemKey: string) => {
    setProgress((prev) => ({
      ...prev,
      bookmarkedItems: prev.bookmarkedItems.includes(itemKey)
        ? prev.bookmarkedItems.filter((x) => x !== itemKey)
        : [...prev.bookmarkedItems, itemKey],
    }));
  };

  const playChimeFallback = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 528;
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.26);
    } catch {
      // ignore
    }
  };

  const speakArabic = (text: string, itemId: string, customRate?: number) => {
    setSpeakingId(itemId);
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'ar-SA';
        utter.rate = customRate ?? (slowMode ? 0.72 : 0.95);
        const voices = window.speechSynthesis.getVoices();
        const arVoice = voices.find((v) => v.lang.toLowerCase().startsWith('ar'));
        if (arVoice) utter.voice = arVoice;
        utter.onend = () => setSpeakingId((cur) => (cur === itemId ? null : cur));
        utter.onerror = () => {
          setSpeakingId((cur) => (cur === itemId ? null : cur));
          playChimeFallback();
        };
        window.speechSynthesis.speak(utter);
        globalThis.setTimeout(() => {
          setSpeakingId((cur) => (cur === itemId ? null : cur));
        }, 4500);
        return;
      }
    } catch {
      // fallback
    }
    playChimeFallback();
    globalThis.setTimeout(() => setSpeakingId((cur) => (cur === itemId ? null : cur)), 800);
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      globalThis.setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1600);
    } catch {
      // ignore
    }
  };

  const filteredLetters = useMemo(() => {
    const q = letterSearch.trim().toLowerCase();
    if (!q) return ARABIC_LETTERS;
    return ARABIC_LETTERS.filter(
      (item) =>
        item.letter.includes(q) ||
        item.nameAr.includes(q) ||
        item.nameBn.toLowerCase().includes(q) ||
        item.nameEn.toLowerCase().includes(q) ||
        item.phoneticBn.toLowerCase().includes(q) ||
        item.phoneticEn.toLowerCase().includes(q)
    );
  }, [letterSearch]);

  const vowelSamples = useMemo(() => {
    const ch = selectedLetter.letter;
    if (ch === 'ا') {
      return [
        { ar: 'أَ', labelBn: 'যবর (আ)', labelEn: 'Fatha (a)' },
        { ar: 'إِ', labelBn: 'যের (ই)', labelEn: 'Kasra (i)' },
        { ar: 'أُ', labelBn: 'পেশ (উ)', labelEn: 'Damma (u)' },
        { ar: 'آ', labelBn: 'মদ্দ (আ-)', labelEn: 'Madd (aa)' },
      ];
    }
    return [
      { ar: `${ch}َ`, labelBn: 'যবর', labelEn: 'Fatha' },
      { ar: `${ch}ِ`, labelBn: 'যের', labelEn: 'Kasra' },
      { ar: `${ch}ُ`, labelBn: 'পেশ', labelEn: 'Damma' },
      { ar: `أَ${ch}ْ`, labelBn: 'সুকুন', labelEn: 'Sukun' },
      { ar: `${ch}َا`, labelBn: 'আলিফ মদ্দ', labelEn: 'Madd aa' },
      { ar: `${ch}ِي`, labelBn: 'ইয়া মদ্দ', labelEn: 'Madd ee' },
      { ar: `${ch}ُو`, labelBn: 'ওয়াও মদ্দ', labelEn: 'Madd oo' },
      { ar: `${ch}ً`, labelBn: 'তানভিন', labelEn: 'Tanween' },
    ];
  }, [selectedLetter]);

  const activeMakhraj = useMemo(
    () =>
      SEVENTEEN_MAKHARIJ.find((m) => m.number === selectedLetter.makhrajNo) ??
      SEVENTEEN_MAKHARIJ[0],
    [selectedLetter.makhrajNo]
  );

  const visibleMakharij = useMemo(() => {
    if (zoneFilter === 'all') return SEVENTEEN_MAKHARIJ;
    return SEVENTEEN_MAKHARIJ.filter((m) => m.zoneId === zoneFilter);
  }, [zoneFilter]);

  const filteredPhrases = useMemo(() => {
    const q = convSearch.trim().toLowerCase();
    return SPOKEN_ARABIC_PHRASES.filter((p) => {
      if (convCategory !== 'all' && p.category !== convCategory) return false;
      if (!q) return true;
      return (
        p.arabic.includes(q) ||
        p.pronunciationBn.toLowerCase().includes(q) ||
        p.pronunciationEn.toLowerCase().includes(q) ||
        p.meaningBn.toLowerCase().includes(q) ||
        p.meaningEn.toLowerCase().includes(q)
      );
    });
  }, [convCategory, convSearch]);

  const filteredVocab = useMemo(() => {
    if (vocabFilter === 'all') return ARABIC_VOCAB_CARDS;
    return ARABIC_VOCAB_CARDS.filter((c) => c.category === vocabFilter);
  }, [vocabFilter]);

  const jumpToMakhraj = (makhrajNo: number) => {
    const target = SEVENTEEN_MAKHARIJ.find((m) => m.number === makhrajNo);
    if (target) {
      setZoneFilter('all');
      setHighlightedMakhraj(makhrajNo);
      setActiveTab('makharij');
    }
  };

  // --- Quiz handling ---
  const handleSelectQuizAnswer = (q: AcademyQuizQuestion, optionId: string) => {
    setQuizAnswers((prev) => {
      const next = { ...prev, [q.id]: optionId };
      const topicQuestions = ACADEMY_QUIZ_QUESTIONS.filter((item) => item.topic === q.topic);
      const correctCount = topicQuestions.filter((item) => next[item.id] === item.correctId).length;
      setProgress((p) => ({
        ...p,
        quizScores: {
          ...p.quizScores,
          [q.topic]: { score: correctCount, total: topicQuestions.length },
        },
      }));
      return next;
    });
  };

  const visibleQuizQuestions = useMemo(() => {
    if (quizTopicFilter === 'all') return ACADEMY_QUIZ_QUESTIONS;
    return ACADEMY_QUIZ_QUESTIONS.filter((q) => q.topic === quizTopicFilter);
  }, [quizTopicFilter]);

  // --- Canvas Drawing Pad handlers ---
  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawingRef.current = true;
    const pt = getCanvasPoint(e);
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f3d2e';
    ctx.lineWidth = brushWidth;
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const pt = getCanvasPoint(e);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  };

  const handleCanvasPointerUp = () => {
    drawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // --- AI Recitation Teacher Microphone & Upload handlers ---
  const activePracticeVerse =
    RECITATION_PRACTICE_AYAHS.find((v) => v.id === selectedPracticeId) ?? RECITATION_PRACTICE_AYAHS[0];

  const startRecitationRecording = async () => {
    setRecitationError(null);
    setRecitationResult(null);
    setUploadedFileName(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaChunksRef.current = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) mediaChunksRef.current.push(ev.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(mediaChunksRef.current, { type: mimeType });
        if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
        setRecordedBlob(blob);
        setRecordedAudioUrl(URL.createObjectURL(blob));
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setReciting(true);
      setReciteSec(0);
      reciteTimerRef.current = window.setInterval(() => setReciteSec((s) => s + 1), 1000);
    } catch {
      setRecitationError(
        lang === 'bn'
          ? 'মাইক্রোফোন অ্যাক্সেস পাওয়া যায়নি। ব্রাউজারে অনুমতি দিন অথবা অডিও ফাইল আপলোড করুন।'
          : 'Microphone access denied. Please allow microphone permissions or upload an audio file.'
      );
    }
  };

  const stopRecitationRecording = () => {
    if (reciteTimerRef.current) {
      window.clearInterval(reciteTimerRef.current);
      reciteTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setReciting(false);
  };

  const handleUploadRecitationAudio = (file: File | null) => {
    if (!file) return;
    setRecitationError(null);
    setRecitationResult(null);
    if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    setRecordedBlob(file);
    setUploadedFileName(file.name);
    setRecordedAudioUrl(URL.createObjectURL(file));
  };

  const runRecitationCheck = async () => {
    if (!recordedBlob) return;
    setCheckingRecitation(true);
    setRecitationError(null);
    try {
      const buffer = await recordedBlob.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const audioBase64 = btoa(binary);

      const res = await fetch('/api/ai/recitation-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType: recordedBlob.type || 'audio/webm',
          referenceArabic: activePracticeVerse.arabic,
          referenceLabel: lang === 'bn' ? activePracticeVerse.titleBn : activePracticeVerse.titleEn,
          lang,
        }),
      });
      const data = await safeReadJson<{
        transcript?: string;
        feedback?: string;
        model?: string;
        error?: string;
      }>(res, `HTTP ${res.status}`);

      if (!res.ok) {
        throw new Error(data.error || 'Recitation analysis failed.');
      }

      setRecitationResult({
        transcript: data.transcript || '',
        feedback: data.feedback || '',
        model: data.model || 'gemini-2.5-flash',
      });
      setProgress((prev) => ({
        ...prev,
        completedLevels: prev.completedLevels.includes(7)
          ? prev.completedLevels
          : [...prev.completedLevels, 7].sort((a, b) => a - b),
      }));
    } catch (err) {
      setRecitationError(
        err instanceof Error
          ? err.message
          : lang === 'bn'
          ? 'কেরাত বিশ্লেষণে সমস্যা হয়েছে।'
          : 'Failed to analyze recitation audio.'
      );
    } finally {
      setCheckingRecitation(false);
    }
  };

  const overallPercent = Math.round((progress.completedLevels.length / ACADEMY_LEVELS.length) * 100);

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#ebe6da] p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#8f6319] flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-[#b58328]" />
            <span>
              {lang === 'bn'
                ? 'আরবি ও কুরআন শিক্ষা একাডেমি (Arabic & Quran Academy)'
                : 'Arabic & Quran Academy'}
            </span>
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1f2421] mt-1">
            {lang === 'bn'
              ? 'হরফ, ১৭ মাখরাজ, তাজবিদ, ব্যাকরণ ও AI কেরাত শিক্ষক'
              : 'Arabic Letters, Makharij, Tajweed, Grammar & AI Recitation Teacher'}
          </h1>
          <p className="text-sm text-[#6e7268] mt-1">
            {lang === 'bn'
              ? '২৯টি হরফ, হরকত, ১৭টি মাখরাজ ও সিফাত, সম্পূর্ণ তাজবিদ, নাহু-সরফ ব্যাকরণ, লেখা অনুশীলন এবং যাচাইকৃত কুরআন তেলাওয়াত।'
              : 'Complete 29 Arabic letters, Harakat, 17 Makharij & Sifatul Huruf, Tajweed course, Nahw/Sarf grammar, writing pad, and AI recitation feedback.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#faf7f0] border border-[#ebe6da] hover:border-[#b58328] text-xs font-semibold text-[#1f2421] cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-[#b58328]" />
            <span>
              {lang === 'bn' ? `অগ্রগতি ${overallPercent}%` : `Progress ${overallPercent}%`}
            </span>
          </button>

          {onPracticeInAi && (
            <button
              type="button"
              onClick={() =>
                onPracticeInAi(
                  lang === 'bn'
                    ? 'আসসালামু আলাইকুম! আমাকে সহজ আরবি কথোপকথন ও ১৭টি মাখরাজের শুদ্ধ উচ্চারণ ধাপে ধাপে অনুশীলন করান (বাংলা অর্থ ও উচ্চারণসহ)।'
                    : 'As-salamu alaykum! Let us practice beginner spoken Arabic dialogue and proper Makharij pronunciation step by step.'
                )
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#087653] hover:bg-[#065c40] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              <span>
                {lang === 'bn' ? 'AI টিউটরের সাথে আরবি' : 'AI Arabic Tutor'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Academy Module Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'letters' as AcademyTab, icon: BookOpen, bn: '২৯ হরফ, হরকত ও কুইজ', en: 'Letters & Quiz' },
          { id: 'makharij' as AcademyTab, icon: Ear, bn: '১৭ মাখরাজ ও সিফাত', en: 'Makharij & Sifat' },
          { id: 'tajweed' as AcademyTab, icon: Sparkles, bn: 'সম্পূর্ণ তাজবিদ কোর্স', en: 'Tajweed Course' },
          { id: 'conversation' as AcademyTab, icon: MessageCircle, bn: 'কথোপকথন ও ফ্ল্যাশকার্ড', en: 'Spoken & Flashcards' },
          { id: 'grammar-writing' as AcademyTab, icon: PenTool, bn: 'ব্যাকরণ (নাহু-সরফ) ও লেখা', en: 'Grammar & Writing' },
          { id: 'recitation-ai' as AcademyTab, icon: Mic, bn: 'AI কেরাত শিক্ষক', en: 'AI Recitation Teacher' },
          { id: 'dashboard' as AcademyTab, icon: Trophy, bn: 'শিক্ষার্থী ড্যাশবোর্ড', en: 'Progress Dashboard' },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-testid={`arabic-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-[#087653] text-white border-[#087653]'
                  : 'bg-white text-[#494e45] border-[#ebe6da] hover:border-[#b58328]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab[lang]}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: 29 Letters + Interactive Letter Studio + 8 Harakat Rules + Quiz */}
      {activeTab === 'letters' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#ebe6da] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-base font-bold text-[#1f2421]">
                    {lang === 'bn'
                      ? 'আরবি ২৯টি মূল হরফ (ডান থেকে বামে)'
                      : 'All 29 Arabic Letters'}
                  </h2>
                  <p className="text-xs text-[#6e7268]">
                    {lang === 'bn'
                      ? 'যেকোনো হরফে ক্লিক করে উচ্চারণ, মাখরাজ ও ৪টি অবস্থানগত রূপ দেখুন'
                      : 'Select any letter to hear it, inspect positional forms, and drill vowels'}
                  </p>
                </div>

                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-[#8a8679] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={letterSearch}
                    onChange={(e) => setLetterSearch(e.target.value)}
                    placeholder={lang === 'bn' ? 'হরফ খুঁজুন (যেমন কাফ)...' : 'Search letter...'}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#ebe6da] bg-[#faf7f0] text-xs text-[#1f2421] focus:outline-none focus:border-[#087653]"
                  />
                </div>
              </div>

              <div dir="rtl" className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                {filteredLetters.map((item) => {
                  const isSelected = selectedLetter.number === item.number;
                  return (
                    <button
                      key={item.number}
                      type="button"
                      onClick={() => {
                        setSelectedLetter(item);
                        setSelectedVowelIdx(0);
                        speakArabic(item.nameAr, `letter-${item.number}`);
                      }}
                      className={`rounded-xl border p-2.5 text-center transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#087653] text-white border-[#087653]'
                          : 'bg-[#faf7f0] text-[#1f2421] border-[#ebe6da] hover:border-[#b58328]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] opacity-75 font-mono-tabular">
                        <span>{item.number}</span>
                        <span>M{item.makhrajNo}</span>
                      </div>
                      <p className="font-arabic text-3xl leading-snug my-1">{item.letter}</p>
                      <p className="text-[11px] font-semibold truncate">
                        {lang === 'bn' ? item.nameBn.split(' ')[0] : item.nameEn.split(' ')[0]}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <aside className="lg:col-span-5 bg-white rounded-2xl border border-[#ebe6da] p-5 space-y-4">
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#f0ece1]">
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 rounded-2xl bg-[#0f3d2e] text-[#d4a84f] flex items-center justify-center font-arabic text-4xl shrink-0">
                    {selectedLetter.letter}
                  </div>
                  <div>
                    <p className="text-xs text-[#8f6319] font-semibold">
                      {lang === 'bn'
                        ? `হরফ #${selectedLetter.number} · মাখরাজ #${selectedLetter.makhrajNo}`
                        : `Letter #${selectedLetter.number} · Makhraj #${selectedLetter.makhrajNo}`}
                    </p>
                    <h3 className="font-display text-xl font-bold text-[#1f2421]">
                      {lang === 'bn' ? selectedLetter.nameBn : selectedLetter.nameEn}{' '}
                      <span className="font-arabic text-[#087653] font-normal">
                        ({selectedLetter.nameAr})
                      </span>
                    </h3>
                    <p className="text-xs text-[#5a7066] mt-0.5">
                      {lang === 'bn' ? selectedLetter.phoneticBn : selectedLetter.phoneticEn}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleBookmarkItem(`letter:${selectedLetter.nameEn}`)}
                    aria-label="Bookmark letter"
                    className={`p-2 rounded-xl border cursor-pointer ${
                      progress.bookmarkedItems.includes(`letter:${selectedLetter.nameEn}`)
                        ? 'bg-[#f5efe0] border-[#b58328] text-[#b58328]'
                        : 'bg-[#faf7f0] border-[#ebe6da] text-[#6e7268]'
                    }`}
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => speakArabic(selectedLetter.nameAr, 'inspector-letter')}
                    aria-label="Listen to letter"
                    className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                      speakingId === 'inspector-letter'
                        ? 'bg-[#087653] text-white border-[#087653]'
                        : 'bg-[#faf7f0] text-[#087653] border-[#ebe6da] hover:border-[#087653]'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-[#494e45] mb-2">
                  {lang === 'bn' ? 'শব্দে হরফের ৪টি রূপ' : 'Positional Writing Forms'}
                </p>
                <div dir="rtl" className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { key: 'isolated', bn: 'পৃথক', en: 'Isolated', val: selectedLetter.forms.isolated },
                    { key: 'initial', bn: 'শুরুতে', en: 'Initial', val: selectedLetter.forms.initial },
                    { key: 'medial', bn: 'মাঝে', en: 'Medial', val: selectedLetter.forms.medial },
                    { key: 'final', bn: 'শেষে', en: 'Final', val: selectedLetter.forms.final },
                  ].map((f) => (
                    <div
                      key={f.key}
                      className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] py-2 px-1"
                    >
                      <p className="font-arabic text-2xl text-[#1f2421]">{f.val}</p>
                      <p className="text-[10px] text-[#6e7268] mt-1">{lang === 'bn' ? f.bn : f.en}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-[#494e45] mb-2">
                  {lang === 'bn'
                    ? 'হরকত ও মদ্দ অনুশীলন (ট্যাপ করে শুনুন)'
                    : 'Tap Harakat & Madd Practice'}
                </p>
                <div dir="rtl" className="grid grid-cols-4 gap-2">
                  {vowelSamples.map((v, idx) => {
                    const active = selectedVowelIdx === idx;
                    return (
                      <button
                        key={v.ar}
                        type="button"
                        onClick={() => {
                          setSelectedVowelIdx(idx);
                          speakArabic(v.ar, `vowel-${idx}`, 0.85);
                        }}
                        className={`rounded-xl border py-2 px-1.5 text-center transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#eef5f0] border-[#087653] text-[#087653]'
                            : 'bg-[#faf7f0] border-[#ebe6da] text-[#1f2421] hover:border-[#b58328]'
                        }`}
                      >
                        <p className="font-arabic text-2xl leading-tight">{v.ar}</p>
                        <p className="text-[10px] text-[#5a7066] mt-0.5 truncate">
                          {lang === 'bn' ? v.labelBn : v.labelEn}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#1f2421]">
                    {lang === 'bn' ? 'শুদ্ধ উচ্চারণ ও মাখরাজ টিপস' : 'Pronunciation & Makhraj'}
                  </span>
                  <button
                    type="button"
                    onClick={() => jumpToMakhraj(selectedLetter.makhrajNo)}
                    className="text-xs font-semibold text-[#087653] hover:underline cursor-pointer"
                  >
                    {lang === 'bn'
                      ? `মাখরাজ #${selectedLetter.makhrajNo} দেখুন →`
                      : `View Makhraj #${selectedLetter.makhrajNo} →`}
                  </button>
                </div>
                <p className="text-xs text-[#494e45] leading-relaxed">
                  {lang === 'bn' ? selectedLetter.tipBn : selectedLetter.tipEn}
                </p>
                <p className="text-[11px] text-[#6e7268]">
                  {lang === 'bn' ? activeMakhraj.zoneBn : activeMakhraj.zoneEn}
                </p>
              </div>

              <div className="rounded-xl bg-[#eef5f0]/70 border border-[#087653]/25 p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-[#087653]">
                    {lang === 'bn' ? 'উদাহরণ শব্দ' : 'Sample Word'}
                  </p>
                  <p className="font-arabic text-2xl text-[#1f2421] leading-snug">
                    {selectedLetter.sampleWord.ar}
                  </p>
                  <p className="text-xs text-[#494e45] mt-0.5">
                    <span className="font-semibold">{selectedLetter.sampleWord.bnPron}</span> ·{' '}
                    {lang === 'bn'
                      ? selectedLetter.sampleWord.meaningBn
                      : selectedLetter.sampleWord.meaningEn}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => speakArabic(selectedLetter.sampleWord.ar, 'sample-word')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#087653] hover:bg-[#065c40] text-white text-xs font-semibold cursor-pointer shrink-0"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'শুনুন' : 'Listen'}</span>
                </button>
              </div>
            </aside>
          </div>

          {/* 8 Essential Harakat Rules */}
          <section className="bg-white rounded-2xl border border-[#ebe6da] p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-bold text-[#1f2421]">
                  {lang === 'bn'
                    ? 'হরকত, তানভিন, তাশদিদ, মদ্দ ও ক্বলক্বলাহ নিয়মাবলি'
                    : 'Essential Harakat, Tanween, Shadda, Madd & Qalqalah Rules'}
                </h2>
                <p className="text-xs sm:text-sm text-[#6e7268] mt-0.5">
                  {lang === 'bn'
                    ? 'আরবি হরফ চেনার পর কুরআন ও কথোপকথন পড়তে এই ৮টি মৌলিক চিহ্ন জানা জরুরি।'
                    : 'These 8 core marks unlock fluent Arabic reading across the Quran and spoken text.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleLevelDone(2)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                  progress.completedLevels.includes(2)
                    ? 'bg-[#087653] text-white border-[#087653]'
                    : 'bg-[#faf7f0] text-[#494e45] border-[#ebe6da]'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {progress.completedLevels.includes(2)
                    ? lang === 'bn'
                      ? 'লেভেল ২ সম্পন্ন ✓'
                      : 'Level 2 Completed ✓'
                    : lang === 'bn'
                    ? 'সম্পন্ন হিসেবে চিহ্নিত করুন'
                    : 'Mark Level 2 Done'}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {HARAKAT_RULES.map((rule) => (
                <div
                  key={rule.id}
                  className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] p-4 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#8f6319]">
                        {lang === 'bn' ? rule.nameBn : rule.nameEn}
                      </span>
                      <span className="font-arabic text-xl text-[#087653]">{rule.symbol}</span>
                    </div>
                    <p className="font-arabic text-2xl text-[#1f2421] text-right mt-2">
                      {rule.exampleAr}
                    </p>
                    <p className="text-xs font-semibold text-[#087653] mt-1">
                      {rule.examplePronBn}
                    </p>
                    <p className="text-xs text-[#494e45] mt-2 leading-relaxed">
                      {lang === 'bn' ? rule.ruleBn : rule.ruleEn}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => speakArabic(rule.exampleAr, `rule-${rule.id}`, 0.8)}
                    className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-white border border-[#ebe6da] hover:border-[#087653] text-xs font-semibold text-[#087653] cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'উদাহরণ শুনুন' : 'Listen Example'}</span>
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Interactive Recognition Quiz */}
          <section className="bg-white rounded-2xl border border-[#ebe6da] p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-[#1f2421]">
                  {lang === 'bn' ? 'ইন্টারেক্টিভ আরবি ও তাজবিদ কুইজ' : 'Interactive Arabic & Tajweed Quiz'}
                </h2>
                <p className="text-xs text-[#6e7268]">
                  {lang === 'bn'
                    ? 'সঠিক উত্তর নির্বাচন করে আপনার শেখা যাচাই করুন (স্বয়ংক্রিয়ভাবে ড্যাশবোর্ডে স্কোর সংরক্ষণ হয়)।'
                    : 'Test your recognition across letters, Tajweed, grammar, and vocabulary.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(['all', 'letters', 'tajweed', 'grammar', 'vocab'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setQuizTopicFilter(t)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                      quizTopicFilter === t
                        ? 'bg-[#087653] text-white border-[#087653]'
                        : 'bg-[#faf7f0] text-[#494e45] border-[#ebe6da]'
                    }`}
                  >
                    {t === 'all'
                      ? lang === 'bn'
                        ? 'সব'
                        : 'All'
                      : t === 'letters'
                      ? lang === 'bn'
                        ? 'হরফ/মাখরাজ'
                        : 'Letters'
                      : t === 'tajweed'
                      ? lang === 'bn'
                        ? 'তাজবিদ'
                        : 'Tajweed'
                      : t === 'grammar'
                      ? lang === 'bn'
                        ? 'ব্যাকরণ'
                        : 'Grammar'
                      : lang === 'bn'
                      ? 'শব্দার্থ'
                      : 'Vocab'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleQuizQuestions.map((q) => {
                const chosen = quizAnswers[q.id];
                const isCorrect = chosen === q.correctId;
                return (
                  <div
                    key={q.id}
                    className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] p-4 space-y-3"
                  >
                    {q.arabicPrompt && (
                      <p dir="rtl" className="font-arabic text-2xl text-[#087653] text-right">
                        {q.arabicPrompt}
                      </p>
                    )}
                    <p className="text-sm font-semibold text-[#1f2421]">
                      {lang === 'bn' ? q.questionBn : q.questionEn}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((opt) => {
                        const selected = chosen === opt.id;
                        const rightOpt = chosen && opt.id === q.correctId;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSelectQuizAnswer(q, opt.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                              rightOpt
                                ? 'bg-[#eef5f0] border-[#087653] text-[#087653] font-semibold'
                                : selected
                                ? 'bg-red-50 border-red-300 text-red-700'
                                : 'bg-white border-[#ebe6da] hover:border-[#b58328] text-[#3c413b]'
                            }`}
                          >
                            {lang === 'bn' ? opt.bn : opt.en}
                          </button>
                        );
                      })}
                    </div>
                    {chosen && (
                      <p
                        className={`text-xs leading-relaxed ${
                          isCorrect ? 'text-[#087653]' : 'text-[#8f6319]'
                        }`}
                      >
                        {lang === 'bn' ? q.explanationBn : q.explanationEn}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: 17 Classical Makharij + Visual Interactive SVG Diagram + Sifatul Huruf */}
      {activeTab === 'makharij' && (
        <div className="space-y-6">
          {/* Interactive Visual Vocal Tract Zone Diagram + Selector */}
          <div className="bg-white rounded-2xl border border-[#ebe6da] p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            <div className="lg:col-span-5">
              <svg
                viewBox="0 0 340 240"
                className="w-full max-w-[340px] mx-auto bg-[#faf7f0] rounded-2xl border border-[#ebe6da] p-2"
                role="img"
                aria-label={lang === 'bn' ? 'মাখরাজ উচ্চারণস্থল মানচিত্র' : 'Arabic Makharij Articulation Diagram'}
              >
                <path
                  d="M 110 220 C 110 175, 115 150, 125 130 C 135 110, 130 70, 165 48 C 205 25, 275 45, 285 95 C 292 125, 270 132, 260 135 L 265 150 L 250 155 L 260 170 C 245 185, 225 182, 212 178 C 195 174, 185 190, 182 220"
                  fill="#eef5f0"
                  stroke="#087653"
                  strokeWidth="2.5"
                />
                {/* Zone 5: Al-Khayshum (Nasal cavity) */}
                <g onClick={() => setZoneFilter('khayshum')} className="cursor-pointer">
                  <ellipse
                    cx="236"
                    cy="92"
                    rx="28"
                    ry="14"
                    fill={zoneFilter === 'khayshum' ? '#b58328' : '#d4a84f'}
                    fillOpacity="0.45"
                    stroke="#8f6319"
                    strokeWidth="1.5"
                  />
                  <text x="236" y="95" textAnchor="middle" fontSize="9.5" fill="#1f2421" fontWeight="700">
                    {lang === 'bn' ? '৫. নাসিকা (১৭)' : '5. Nasal (17)'}
                  </text>
                </g>
                {/* Zone 1: Al-Jawf (Oral empty cavity) */}
                <g onClick={() => setZoneFilter('jawf')} className="cursor-pointer">
                  <ellipse
                    cx="205"
                    cy="132"
                    rx="32"
                    ry="14"
                    fill={zoneFilter === 'jawf' ? '#087653' : '#6ee7b7'}
                    fillOpacity="0.4"
                    stroke="#087653"
                    strokeWidth="1.5"
                  />
                  <text x="205" y="135" textAnchor="middle" fontSize="9.5" fill="#1f2421" fontWeight="700">
                    {lang === 'bn' ? '১. জাওফ (১)' : '1. Jawf (1)'}
                  </text>
                </g>
                {/* Zone 3: Al-Lisan (Tongue) */}
                <g onClick={() => setZoneFilter('lisan')} className="cursor-pointer">
                  <path
                    d="M 162 152 Q 208 142 246 154 Q 208 170 162 162 Z"
                    fill={zoneFilter === 'lisan' ? '#087653' : '#93c5fd'}
                    fillOpacity="0.55"
                    stroke="#1d4ed8"
                    strokeWidth="1.5"
                  />
                  <text x="204" y="160" textAnchor="middle" fontSize="9.5" fill="#1f2421" fontWeight="700">
                    {lang === 'bn' ? '৩. জিহ্বা (৫-১৪)' : '3. Tongue (5-14)'}
                  </text>
                </g>
                {/* Zone 4: Ash-Shafatan (Lips) */}
                <g onClick={() => setZoneFilter('shafatan')} className="cursor-pointer">
                  <circle
                    cx="263"
                    cy="152"
                    r="16"
                    fill={zoneFilter === 'shafatan' ? '#b58328' : '#fde68a'}
                    fillOpacity="0.65"
                    stroke="#b58328"
                    strokeWidth="1.5"
                  />
                  <text x="263" y="155" textAnchor="middle" fontSize="9" fill="#1f2421" fontWeight="700">
                    {lang === 'bn' ? '৪. ঠোঁট' : '4. Lips'}
                  </text>
                </g>
                {/* Zone 2: Al-Halq (Throat) */}
                <g onClick={() => setZoneFilter('halq')} className="cursor-pointer">
                  <rect
                    x="128"
                    y="165"
                    width="42"
                    height="46"
                    rx="10"
                    fill={zoneFilter === 'halq' ? '#087653' : '#cbd5e1'}
                    fillOpacity="0.65"
                    stroke="#475569"
                    strokeWidth="1.5"
                  />
                  <text x="149" y="191" textAnchor="middle" fontSize="9.5" fill="#1f2421" fontWeight="700">
                    {lang === 'bn' ? '২. কণ্ঠ (২-৪)' : '2. Throat'}
                  </text>
                </g>
              </svg>
            </div>

            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-bold text-[#1f2421]">
                  {lang === 'bn'
                    ? '১৭টি মাখরাজ (৫টি প্রধান উচ্চারণ অঙ্গ)'
                    : '17 Makharij across 5 Articulation Organs'}
                </h2>
                <button
                  type="button"
                  onClick={() => toggleLevelDone(3)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                    progress.completedLevels.includes(3)
                      ? 'bg-[#087653] text-white border-[#087653]'
                      : 'bg-[#faf7f0] text-[#494e45] border-[#ebe6da]'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {progress.completedLevels.includes(3)
                      ? lang === 'bn'
                        ? 'লেভেল ৩ সম্পন্ন ✓'
                        : 'Level 3 Done ✓'
                      : lang === 'bn'
                      ? 'লেভেল ৩ সম্পন্ন করুন'
                      : 'Mark Level 3 Done'}
                  </span>
                </button>
              </div>
              <p className="text-xs sm:text-sm text-[#6e7268]">
                {lang === 'bn'
                  ? 'ডায়াগ্রামের যেকোনো অংশে অথবা নিচের বাটনে ক্লিক করে ঐ স্থানের নির্দিষ্ট মাখরাজ ও হরফ শুনুন।'
                  : 'Click any anatomical zone in the diagram or below to isolate those articulation points.'}
              </p>
              <div className="flex flex-wrap gap-2">
                {ZONE_OPTIONS.map((zone) => {
                  const active = zoneFilter === zone.id;
                  return (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => {
                        setZoneFilter(zone.id);
                        setHighlightedMakhraj(null);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-[#087653] text-white border-[#087653]'
                          : 'bg-[#faf7f0] text-[#494e45] border-[#ebe6da] hover:border-[#b58328]'
                      }`}
                    >
                      {lang === 'bn' ? zone.bn : zone.en}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 17 Makharij Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleMakharij.map((m) => {
              const isHighlighted = highlightedMakhraj === m.number;
              return (
                <article
                  key={m.number}
                  className={`bg-white rounded-2xl border p-5 space-y-3 transition-colors ${
                    isHighlighted ? 'border-[#087653] bg-[#f8fbf9]' : 'border-[#ebe6da]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold text-[#8f6319]">
                        {lang === 'bn' ? m.zoneBn : m.zoneEn} ·{' '}
                        <span className="font-arabic">{m.zoneAr}</span>
                      </p>
                      <h3 className="font-display text-base font-bold text-[#1f2421] mt-0.5">
                        {lang === 'bn' ? m.titleBn : m.titleEn}
                      </h3>
                    </div>

                    <div dir="rtl" className="flex flex-wrap gap-1.5 shrink-0">
                      {m.letters.map((ltr) => (
                        <button
                          key={ltr}
                          type="button"
                          onClick={() => speakArabic(ltr, `m-${m.number}-${ltr}`, 0.8)}
                          className="w-9 h-9 rounded-lg bg-[#0f3d2e] hover:bg-[#087653] text-[#d4a84f] font-arabic text-xl flex items-center justify-center transition-colors cursor-pointer"
                          title={lang === 'bn' ? 'শুনতে ক্লিক করুন' : 'Click to hear'}
                        >
                          {ltr}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-[#3c413b] leading-relaxed">
                    {lang === 'bn' ? m.descriptionBn : m.descriptionEn}
                  </p>

                  <div className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] p-3 text-xs text-[#5a7066]">
                    <span className="font-semibold text-[#8f6319]">
                      {lang === 'bn' ? 'সতর্কতা / সংশোধন: ' : 'Common Mistake Fix: '}
                    </span>
                    {lang === 'bn' ? m.mistakeFixBn : m.mistakeFixEn}
                  </div>

                  <div className="pt-2 border-t border-[#f0ece1] flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-arabic text-xl text-[#087653] truncate">{m.sampleAr}</p>
                      <p className="text-xs text-[#494e45]">{m.samplePronBn}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => speakArabic(m.sampleAr, `m-sample-${m.number}`, 0.85)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#eef5f0] hover:bg-[#087653] hover:text-white text-[#087653] text-xs font-semibold transition-colors cursor-pointer shrink-0"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'শুনুন' : 'Listen'}</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Sifatul Huruf Section */}
          <section className="bg-white rounded-2xl border border-[#ebe6da] p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="font-display text-lg font-bold text-[#1f2421]">
                {lang === 'bn'
                  ? 'সিফাতুল হুরুফ (আরবি হরফের গুণাবলি ও বৈশিষ্ট্য)'
                  : 'Sifatul Huruf (Characteristics of Arabic Letters)'}
              </h2>
              <p className="text-xs sm:text-sm text-[#6e7268] mt-0.5">
                {lang === 'bn'
                  ? 'একই মাখরাজের একাধিক হরফ (যেমন ت ও ط কিংবা ذ ও ظ) সঠিকভাবে আলাদা করতে সিফাত জানা আবশ্যক।'
                  : 'Sifat distinguish letters sharing the same articulation point, such as light ت vs heavy ط.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SIFAT_UL_HURUF.map((rule) => (
                <div
                  key={rule.id}
                  className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] p-4 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-arabic text-lg text-[#087653]">{rule.nameAr}</p>
                      <h3 className="text-sm font-bold text-[#1f2421]">
                        {lang === 'bn' ? rule.nameBn : rule.nameEn}
                      </h3>
                    </div>
                  </div>
                  {rule.oppositeBn && (
                    <p className="text-xs font-semibold text-[#8f6319]">
                      {lang === 'bn' ? rule.oppositeBn : rule.oppositeEn}
                    </p>
                  )}
                  <p className="text-xs text-[#494e45] leading-relaxed">
                    {lang === 'bn' ? rule.descBn : rule.descEn}
                  </p>
                  <div dir="rtl" className="flex flex-wrap gap-1.5 pt-1">
                    {rule.letters.map((ltr) => (
                      <button
                        key={ltr}
                        type="button"
                        onClick={() => speakArabic(ltr, `sifat-${rule.id}-${ltr}`, 0.8)}
                        className="w-8 h-8 rounded-lg bg-white border border-[#ebe6da] hover:border-[#087653] font-arabic text-lg text-[#0f3d2e] cursor-pointer"
                      >
                        {ltr}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* TAB 3: Complete Tajweed Course */}
      {activeTab === 'tajweed' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-[#ebe6da] p-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-[#1f2421]">
                {lang === 'bn'
                  ? 'সম্পূর্ণ তাজবিদ কোর্স (৭ অধ্যায় ও কুরআনিক উদাহরণ)'
                  : 'Complete Tajweed Course (7 Core Chapters & Audio Examples)'}
              </h2>
              <p className="text-xs text-[#6e7268] mt-0.5">
                {lang === 'bn'
                  ? 'নুন সাকিন ও তানভিন (ইজহার, ইদগাম, ইকলাব, ইখফা), মীম সাকিন, গুন্নাহ, মদ্দ এবং ওয়াকফ চিহ্ন।'
                  : 'Noon Sakin & Tanween, Meem Sakin, Ghunnah, Madd elongation rules, Heavy/Light Lam & Ra, and Stop marks.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleLevelDone(4)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                progress.completedLevels.includes(4)
                  ? 'bg-[#087653] text-white border-[#087653]'
                  : 'bg-[#faf7f0] text-[#494e45] border-[#ebe6da]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {progress.completedLevels.includes(4)
                  ? lang === 'bn'
                    ? 'তাজবিদ কোর্স সম্পন্ন ✓'
                    : 'Tajweed Completed ✓'
                  : lang === 'bn'
                  ? 'কোর্স সম্পন্ন চিহ্নিত করুন'
                  : 'Mark Tajweed Done'}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TAJWEED_COURSE_RULES.map((lesson) => (
              <article
                key={lesson.id}
                className="bg-white rounded-2xl border border-[#ebe6da] p-5 space-y-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-semibold text-[#8f6319]">
                      {lang === 'bn' ? lesson.categoryBn : lesson.categoryEn}
                    </p>
                    <h3 className="font-display text-base font-bold text-[#1f2421] mt-0.5">
                      {lang === 'bn' ? lesson.titleBn : lesson.titleEn}
                    </h3>
                  </div>
                  <span className="font-arabic text-lg text-[#087653] shrink-0">
                    {lesson.titleAr}
                  </span>
                </div>

                <div className="px-3 py-2 rounded-xl bg-[#faf7f0] border border-[#ebe6da] text-xs font-semibold text-[#1f2421] flex items-center justify-between gap-2">
                  <span>{lang === 'bn' ? 'সংশ্লিষ্ট হরফ/চিহ্ন:' : 'Letters / Signs:'}</span>
                  <span dir="rtl" className="font-arabic text-base text-[#087653]">
                    {lesson.letters}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#3c413b] leading-relaxed">
                  {lang === 'bn' ? lesson.ruleBn : lesson.ruleEn}
                </p>

                <div className="space-y-2 pt-2 border-t border-[#f0ece1]">
                  {lesson.examples.map((ex, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 rounded-xl bg-[#f7faf8] border border-[#dce7e0] px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p dir="rtl" className="font-arabic text-xl text-[#0f3d2e] text-right">
                          {ex.ar}
                        </p>
                        <p className="text-[11px] text-[#087653] font-semibold">
                          {ex.bnPron} ·{' '}
                          <span className="text-[#6e7268] font-normal">
                            {lang === 'bn' ? ex.refBn : ex.refEn}
                          </span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => speakArabic(ex.ar, `taj-${lesson.id}-${i}`, 0.78)}
                        className="p-2 rounded-lg bg-[#087653] text-white cursor-pointer shrink-0"
                        aria-label="Listen Tajweed Example"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Spoken Arabic Conversation Phrases + Categorized Vocabulary Flashcards */}
      {activeTab === 'conversation' && (
        <div className="space-y-6">
          {/* Interactive Vocabulary Flashcards Section */}
          <section className="bg-white rounded-2xl border border-[#ebe6da] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-[#1f2421]">
                  {lang === 'bn'
                    ? 'ইন্টারঅ্যাক্টিভ আরবি শব্দভাণ্ডার ফ্ল্যাশকার্ড'
                    : 'Arabic Vocabulary Flashcards (Tap to Flip)'}
                </h2>
                <p className="text-xs text-[#6e7268]">
                  {lang === 'bn'
                    ? 'কার্ডে ক্লিক করে বাংলা-ইংরেজি অর্থ দেখুন এবং উচ্চারণ শুনুন।'
                    : 'Click any flashcard to flip meaning and practice pronunciation.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ['all', 'সব', 'All'],
                    ['islamic', 'ইসলামিক', 'Islamic'],
                    ['daily', 'দৈনন্দিন', 'Daily'],
                    ['family', 'পরিবার', 'Family'],
                    ['food', 'খাবার', 'Food'],
                    ['travel', 'ভ্রমণ', 'Travel'],
                    ['verbs', 'ক্রিয়া', 'Verbs'],
                  ] as const
                ).map(([id, bn, en]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setVocabFilter(id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                      vocabFilter === id
                        ? 'bg-[#087653] text-white border-[#087653]'
                        : 'bg-[#faf7f0] text-[#494e45] border-[#ebe6da]'
                    }`}
                  >
                    {lang === 'bn' ? bn : en}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {filteredVocab.map((card) => {
                const flipped = Boolean(flippedCards[card.id]);
                return (
                  <div
                    key={card.id}
                    onClick={() =>
                      setFlippedCards((prev) => ({ ...prev, [card.id]: !prev[card.id] }))
                    }
                    className={`rounded-xl border p-4 cursor-pointer transition-colors min-h-[130px] flex flex-col justify-between ${
                      flipped
                        ? 'bg-[#0f3d2e] text-white border-[#0f3d2e]'
                        : 'bg-[#faf7f0] text-[#1f2421] border-[#ebe6da] hover:border-[#b58328]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-semibold ${
                          flipped ? 'text-[#d4a84f]' : 'text-[#8f6319]'
                        }`}
                      >
                        {flipped ? (lang === 'bn' ? 'অর্থ' : 'Meaning') : lang === 'bn' ? 'আরবি' : 'Arabic'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          speakArabic(card.ar, `fc-${card.id}`);
                        }}
                        className={`p-1.5 rounded-lg cursor-pointer ${
                          flipped ? 'bg-white/10 text-white' : 'bg-white border border-[#ebe6da] text-[#087653]'
                        }`}
                        aria-label="Hear flashcard"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {flipped ? (
                      <div className="my-2">
                        <p className="text-sm font-bold">{lang === 'bn' ? card.bn : card.en}</p>
                        <p className="text-[11px] text-white/75 mt-1">{card.pronBn}</p>
                      </div>
                    ) : (
                      <div className="my-2 text-center">
                        <p dir="rtl" className="font-arabic text-2xl text-[#087653]">
                          {card.ar}
                        </p>
                        <p className="text-xs font-medium text-[#5a7066] mt-1">
                          {lang === 'bn' ? card.pronBn : card.pronEn}
                        </p>
                      </div>
                    )}

                    <p className={`text-[10px] ${flipped ? 'text-white/60' : 'text-[#8a8679]'}`}>
                      {lang === 'bn' ? 'উল্টাতে ট্যাপ করুন' : 'Tap card to flip'}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Spoken Dialogue Controls & Cards */}
          <div className="bg-white rounded-2xl border border-[#ebe6da] p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-[#8a8679] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={convSearch}
                  onChange={(e) => setConvSearch(e.target.value)}
                  placeholder={
                    lang === 'bn'
                      ? 'আরবি কথোপকথন বা বাংলা অর্থ খুঁজুন (যেমন সালাম, পানি, মসজিদ)...'
                      : 'Search phrases (e.g. Salam, mosque, water, help)...'
                  }
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#ebe6da] bg-[#faf7f0] text-sm text-[#1f2421] focus:outline-none focus:border-[#087653]"
                />
              </div>

              <button
                type="button"
                onClick={() => setSlowMode((s) => !s)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  slowMode
                    ? 'bg-[#f5efe0] border-[#b58328] text-[#8f6319]'
                    : 'bg-[#faf7f0] border-[#ebe6da] text-[#494e45]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {slowMode
                    ? lang === 'bn'
                      ? 'গতি: ধীর (০.৭২x)'
                      : 'Speed: Slow (0.72x)'
                    : lang === 'bn'
                    ? 'গতি: স্বাভাবিক (১.০x)'
                    : 'Speed: Natural (1.0x)'}
                </span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setConvCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                  convCategory === 'all'
                    ? 'bg-[#087653] text-white border-[#087653]'
                    : 'bg-[#faf7f0] text-[#494e45] border-[#ebe6da] hover:border-[#b58328]'
                }`}
              >
                {lang === 'bn'
                  ? `সবগুলো (${SPOKEN_ARABIC_PHRASES.length})`
                  : `All (${SPOKEN_ARABIC_PHRASES.length})`}
              </button>
              {CONVERSATION_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setConvCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                    convCategory === cat.id
                      ? 'bg-[#087653] text-white border-[#087653]'
                      : 'bg-[#faf7f0] text-[#494e45] border-[#ebe6da] hover:border-[#b58328]'
                  }`}
                >
                  {cat[lang]}
                </button>
              ))}
            </div>
          </div>

          {filteredPhrases.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#ebe6da] p-8 text-center text-sm text-[#6e7268]">
              {lang === 'bn'
                ? 'এই অনুসন্ধানে কোনো আরবি বাক্য পাওয়া যায়নি।'
                : 'No matching spoken Arabic phrases found.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPhrases.map((phrase) => {
                const isSpeaking = speakingId === phrase.id;
                const catMeta = CONVERSATION_CATEGORIES.find((c) => c.id === phrase.category);
                return (
                  <article
                    key={phrase.id}
                    className="bg-white rounded-2xl border border-[#ebe6da] p-5 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-[#8f6319]">
                          {catMeta ? catMeta[lang] : phrase.category}
                          {phrase.speaker
                            ? ` · ${lang === 'bn' ? 'বক্তা' : 'Speaker'} ${phrase.speaker}`
                            : ''}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              void handleCopy(
                                phrase.id,
                                `${phrase.arabic}\n${phrase.pronunciationBn}\n${phrase.meaningBn}`
                              )
                            }
                            aria-label="Copy phrase"
                            className="p-1.5 rounded-lg bg-[#faf7f0] border border-[#ebe6da] text-[#5a7066] hover:text-[#1f2421] cursor-pointer"
                          >
                            {copiedId === phrase.id ? (
                              <Check className="w-3.5 h-3.5 text-[#087653]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => speakArabic(phrase.arabic, phrase.id)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                              isSpeaking
                                ? 'bg-[#087653] text-white border-[#087653]'
                                : 'bg-[#eef5f0] text-[#087653] border-[#087653]/25 hover:bg-[#087653] hover:text-white'
                            }`}
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>{lang === 'bn' ? 'শুনুন' : 'Play'}</span>
                          </button>
                        </div>
                      </div>

                      <p
                        dir="rtl"
                        className="font-arabic text-2xl sm:text-[26px] text-[#0f3d2e] leading-loose text-right"
                      >
                        {phrase.arabic}
                      </p>

                      <div className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] p-3 space-y-1">
                        <p className="text-xs sm:text-sm font-semibold text-[#087653]">
                          {phrase.pronunciationBn}
                        </p>
                        <p className="text-[11px] font-mono-tabular text-[#6e7268]">
                          {phrase.pronunciationEn}
                        </p>
                      </div>

                      <p className="text-sm font-medium text-[#1f2421]">
                        {lang === 'bn' ? phrase.meaningBn : phrase.meaningEn}
                      </p>
                    </div>

                    {onPracticeInAi && (
                      <div className="pt-2 border-t border-[#f0ece1] flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            onPracticeInAi(
                              lang === 'bn'
                                ? `এই আরবি বাক্যটির শব্দার্থ, গ্রামার ও কথোপকথনে পরবর্তী উত্তর শেখান: "${phrase.arabic}" (${phrase.meaningBn})`
                                : `Teach me the vocabulary, grammar, and natural reply for this Arabic phrase: "${phrase.arabic}" (${phrase.meaningEn})`
                            )
                          }
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#087653] hover:underline cursor-pointer"
                        >
                          <Bot className="w-3.5 h-3.5" />
                          <span>
                            {lang === 'bn' ? 'AI টিউটরের সাথে অনুশীলন' : 'Practice in AI Tutor'}
                          </span>
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Nahw & Sarf Grammar + Interactive Arabic Writing Pad & Word Builder */}
      {activeTab === 'grammar-writing' && (
        <div className="space-y-6">
          {/* Interactive Arabic Handwriting Canvas */}
          <section className="bg-white rounded-2xl border border-[#ebe6da] p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-[#1f2421]">
                  {lang === 'bn'
                    ? 'ইন্টারেক্টিভ আরবি লেখা ও ট্রেসিং প্যাড (Writing Pad)'
                    : 'Interactive Arabic Writing & Tracing Pad'}
                </h2>
                <p className="text-xs text-[#6e7268]">
                  {lang === 'bn'
                    ? 'মাউস বা আঙুল দিয়ে হালকা অক্ষরের উপর আরবি হরফ লেখার অনুশীলন করুন।'
                    : 'Trace over the guide outline with mouse or touch to practice Arabic letter strokes.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleLevelDone(6)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                  progress.completedLevels.includes(6)
                    ? 'bg-[#087653] text-white border-[#087653]'
                    : 'bg-[#faf7f0] text-[#494e45] border-[#ebe6da]'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {progress.completedLevels.includes(6)
                    ? lang === 'bn'
                      ? 'লেভেল ৬ সম্পন্ন ✓'
                      : 'Level 6 Done ✓'
                    : lang === 'bn'
                    ? 'লেভেল ৬ সম্পন্ন করুন'
                    : 'Mark Level 6 Done'}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <div className="lg:col-span-7 space-y-3">
                <div className="relative rounded-2xl border-2 border-dashed border-[#b58328]/40 bg-[#faf7f0] overflow-hidden">
                  {showTraceGuide && (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 flex items-center justify-center pointer-events-none select-none font-arabic text-[180px] text-[#087653]/12"
                    >
                      {writingLetter.letter}
                    </div>
                  )}
                  <canvas
                    ref={canvasRef}
                    width={520}
                    height={260}
                    onPointerDown={handleCanvasPointerDown}
                    onPointerMove={handleCanvasPointerMove}
                    onPointerUp={handleCanvasPointerUp}
                    onPointerLeave={handleCanvasPointerUp}
                    className="w-full h-[260px] touch-none cursor-crosshair relative z-10"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowTraceGuide((v) => !v)}
                      className="px-3 py-1.5 rounded-lg border border-[#ebe6da] bg-[#faf7f0] text-xs font-semibold text-[#1f2421] cursor-pointer"
                    >
                      {showTraceGuide
                        ? lang === 'bn'
                          ? 'ট্রেস গাইড লুকান'
                          : 'Hide Guide'
                        : lang === 'bn'
                        ? 'ট্রেস গাইড দেখান'
                        : 'Show Guide'}
                    </button>
                    <label className="text-xs text-[#6e7268] flex items-center gap-1.5">
                      <span>{lang === 'bn' ? 'কলম:' : 'Pen:'}</span>
                      <input
                        type="range"
                        min={2}
                        max={14}
                        value={brushWidth}
                        onChange={(e) => setBrushWidth(Number(e.target.value))}
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#ebe6da] hover:border-red-400 text-xs font-semibold text-[#494e45] cursor-pointer"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'মুছে ফেলুন' : 'Clear Pad'}</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <div className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] p-4 space-y-2.5">
                  <p className="text-xs font-bold text-[#1f2421]">
                    {lang === 'bn' ? 'ট্রেসিং হরফ বেছে নিন' : 'Choose Letter to Trace'}
                  </p>
                  <div dir="rtl" className="grid grid-cols-6 gap-1.5">
                    {ARABIC_LETTERS.map((ltr) => (
                      <button
                        key={ltr.number}
                        type="button"
                        onClick={() => {
                          setWritingLetter(ltr);
                          clearCanvas();
                        }}
                        className={`py-1.5 rounded-lg font-arabic text-xl border cursor-pointer ${
                          writingLetter.number === ltr.number
                            ? 'bg-[#087653] text-white border-[#087653]'
                            : 'bg-white text-[#1f2421] border-[#ebe6da]'
                        }`}
                      >
                        {ltr.letter}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-[#eef5f0]/70 border border-[#087653]/25 p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-[#087653]">
                      {lang === 'bn'
                        ? 'যুক্ত শব্দ গঠন অনুশীলন (Word Builder)'
                        : 'Joined Word Formation Practice'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setWordBuilder('')}
                      className="text-[11px] text-[#6e7268] hover:underline cursor-pointer"
                    >
                      {lang === 'bn' ? 'রিসেট' : 'Reset'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      dir="rtl"
                      value={wordBuilder}
                      onChange={(e) => setWordBuilder(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-[#dce7e0] bg-white font-arabic text-2xl text-[#1f2421]"
                    />
                    <button
                      type="button"
                      onClick={() => wordBuilder.trim() && speakArabic(wordBuilder, 'wb-speak')}
                      className="p-2.5 rounded-xl bg-[#087653] text-white cursor-pointer"
                      aria-label="Speak built word"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div dir="rtl" className="flex flex-wrap gap-1">
                    {['ب', 'ت', 'ج', 'ح', 'د', 'ر', 'س', 'ع', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي', 'َ', 'ِ', 'ُ'].map(
                      (ch) => (
                        <button
                          key={ch}
                          type="button"
                          onClick={() => setWordBuilder((prev) => `${prev}${ch}`)}
                          className="w-7 h-7 rounded bg-white border border-[#dce7e0] font-arabic text-base cursor-pointer hover:bg-[#faf7f0]"
                        >
                          {ch}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Nahw & Sarf Grammar Cards */}
          <section className="space-y-4">
            <h2 className="font-display text-lg font-bold text-[#1f2421]">
              {lang === 'bn'
                ? 'আরবি ব্যাকরণ (নাহু ও সরফ — মূল পাঠ)'
                : 'Arabic Grammar (Nahw & Sarf Core Lessons)'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {NAHW_SARF_LESSONS.map((g) => (
                <article
                  key={g.id}
                  className="bg-white rounded-2xl border border-[#ebe6da] p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8f6319]">
                        {g.level}
                      </span>
                      <h3 className="font-display text-base font-bold text-[#1f2421] mt-0.5">
                        {lang === 'bn' ? g.titleBn : g.titleEn}
                      </h3>
                    </div>
                    <span dir="rtl" className="font-arabic text-base text-[#087653]">
                      {g.titleAr}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#3c413b] leading-relaxed">
                    {lang === 'bn' ? g.summaryBn : g.summaryEn}
                  </p>
                  <div className="space-y-2 pt-2 border-t border-[#f0ece1]">
                    {g.examples.map((ex, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] p-3 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p dir="rtl" className="font-arabic text-xl text-[#0f3d2e] text-right">
                            {ex.ar}
                          </p>
                          <p className="text-xs font-semibold text-[#087653] mt-0.5">{ex.pronBn}</p>
                          <p className="text-xs text-[#6e7268]">
                            {lang === 'bn' ? ex.meaningBn : ex.meaningEn}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => speakArabic(ex.ar, `g-${g.id}-${idx}`)}
                          className="p-2 rounded-lg bg-[#087653] text-white cursor-pointer shrink-0"
                          aria-label="Hear grammar example"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* TAB 6: AI Quran Recitation Teacher */}
      {activeTab === 'recitation-ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#ebe6da] p-5 space-y-3">
            <h2 className="font-display text-base font-bold text-[#1f2421]">
              {lang === 'bn'
                ? 'অনুশীলনের জন্য যাচাইকৃত আয়াত বেছে নিন'
                : 'Select Verified Quran Passage to Recite'}
            </h2>
            <p className="text-xs text-[#6e7268]">
              {lang === 'bn'
                ? 'সকল আরবি পাঠ সরাসরি যাচাইকৃত মুসহাফ ডেটাসেট থেকে প্রদর্শিত (AI দ্বারা তৈরি নয়)।'
                : 'All Quranic Arabic passages come strictly from the verified Quran dataset (never AI-generated).'}
            </p>

            <div className="space-y-2">
              {RECITATION_PRACTICE_AYAHS.map((v) => {
                const active = activePracticeVerse.id === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setSelectedPracticeId(v.id);
                      setRecitationResult(null);
                      setRecitationError(null);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#eef5f0] border-[#087653]'
                        : 'bg-[#faf7f0] border-[#ebe6da] hover:border-[#b58328]'
                    }`}
                  >
                    <p className="text-xs font-bold text-[#087653]">
                      {lang === 'bn' ? v.titleBn : v.titleEn}
                    </p>
                    <p dir="rtl" className="font-arabic text-xl text-[#1f2421] text-right mt-1 truncate">
                      {v.arabic}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <section className="lg:col-span-7 bg-white rounded-2xl border border-[#ebe6da] p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-[#8f6319]">
                  {lang === 'bn' ? activePracticeVerse.titleBn : activePracticeVerse.titleEn}
                </p>
                <h3 className="font-display text-lg font-bold text-[#1f2421]">
                  {lang === 'bn' ? 'AI কুরআন তেলাওয়াত ও উচ্চারণ সহায়ক' : 'AI Quran Recitation Teacher'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => speakArabic(activePracticeVerse.arabic, 'practice-model', 0.78)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#eef5f0] text-[#087653] text-xs font-semibold cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'নমুনা শুনুন' : 'Listen Model'}</span>
                </button>
                {onOpenQuranVerse && (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenQuranVerse(
                        activePracticeVerse.surahNumber,
                        activePracticeVerse.ayahNumber
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#ebe6da] text-xs font-semibold text-[#1f2421] hover:border-[#b58328] cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'কুরআনে খুলুন' : 'Open in Quran'}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-[#faf7f0] border border-[#ebe6da] p-4 space-y-2">
              <p dir="rtl" className="font-arabic text-2xl sm:text-3xl text-[#0f3d2e] text-right leading-loose">
                {activePracticeVerse.arabic}
              </p>
              <p className="text-xs font-semibold text-[#8f6319]">{activePracticeVerse.pronBn}</p>
              <p className="text-xs text-[#494e45]">
                {lang === 'bn' ? activePracticeVerse.translationBn : activePracticeVerse.translationEn}
              </p>
              <p className="text-[11px] text-[#087653] pt-1 border-t border-[#ebe6da]">
                <strong>{lang === 'bn' ? 'তাজবিদ লক্ষ্য: ' : 'Tajweed Focus: '}</strong>
                {lang === 'bn' ? activePracticeVerse.focusRuleBn : activePracticeVerse.focusRuleEn}
              </p>
            </div>

            {/* Recording & Upload Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {reciting ? (
                <button
                  type="button"
                  onClick={stopRecitationRecording}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-xs sm:text-sm font-semibold cursor-pointer"
                >
                  <Square className="w-4 h-4" />
                  <span>
                    {lang === 'bn'
                      ? `রেকর্ড থামান (${reciteSec}s)`
                      : `Stop Recording (${reciteSec}s)`}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void startRecitationRecording()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#087653] hover:bg-[#065c40] text-white text-xs sm:text-sm font-semibold cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'তেলাওয়াত রেকর্ড করুন' : 'Record Recitation'}</span>
                </button>
              )}

              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#ebe6da] hover:border-[#b58328] text-xs sm:text-sm font-semibold text-[#1f2421] cursor-pointer">
                <Upload className="w-4 h-4 text-[#b58328]" />
                <span>{lang === 'bn' ? 'অডিও আপলোড' : 'Upload Audio'}</span>
                <input
                  type="file"
                  accept="audio/*"
                  className="sr-only"
                  onChange={(e) => handleUploadRecitationAudio(e.target.files?.[0] ?? null)}
                />
              </label>

              {recordedBlob && (
                <button
                  type="button"
                  disabled={checkingRecitation}
                  onClick={() => void runRecitationCheck()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#b58328] hover:bg-[#956a1e] text-white text-xs sm:text-sm font-semibold cursor-pointer disabled:opacity-60"
                >
                  {checkingRecitation ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>
                    {checkingRecitation
                      ? lang === 'bn'
                        ? 'বিশ্লেষণ চলছে...'
                        : 'Checking Recitation...'
                      : lang === 'bn'
                      ? 'উচ্চারণ যাচাই করুন'
                      : 'Analyze Recitation'}
                  </span>
                </button>
              )}
            </div>

            {recordedAudioUrl && (
              <div className="rounded-xl bg-[#f7faf8] border border-[#dce7e0] p-3 flex flex-wrap items-center gap-3">
                <FileAudio className="w-4 h-4 text-[#087653]" />
                <span className="text-xs font-medium text-[#1f2421] truncate max-w-[200px]">
                  {uploadedFileName || (lang === 'bn' ? 'রেকর্ডকৃত তেলাওয়াত' : 'Recorded audio')}
                </span>
                <audio controls src={recordedAudioUrl} className="h-8 flex-1 min-w-[180px]" />
              </div>
            )}

            {recitationError && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-700">
                {recitationError}
              </div>
            )}

            {recitationResult && (
              <div className="rounded-2xl bg-[#eef5f0]/75 border border-[#087653]/30 p-4 space-y-3">
                <div>
                  <p className="text-[11px] font-bold text-[#087653]">
                    {lang === 'bn' ? 'আপনার কণ্ঠ থেকে প্রাপ্ত আরবি:' : 'Transcribed Arabic Speech:'}
                  </p>
                  <p dir="rtl" className="font-arabic text-xl text-[#1f2421] text-right mt-1">
                    {recitationResult.transcript || '—'}
                  </p>
                </div>
                <div className="pt-2 border-t border-[#087653]/20">
                  <p className="text-[11px] font-bold text-[#8f6319] mb-1">
                    {lang === 'bn' ? 'AI শিক্ষকের পরামর্শ ও তুলনা:' : 'Teacher Comparison & Tips:'}
                  </p>
                  <p className="text-xs sm:text-sm text-[#1f2421] leading-relaxed whitespace-pre-line">
                    {recitationResult.feedback}
                  </p>
                </div>
              </div>
            )}

            <p className="text-[11px] text-[#6e7268] leading-relaxed">
              {lang === 'bn'
                ? 'দ্রষ্টব্য: স্বয়ংক্রিয় AI উচ্চারণ বিশ্লেষণ প্রাথমিক অনুশীলনের সহায়ক মাত্র; সূক্ষ্ম মাখরাজ ও সনদভিত্তিক কেরাত বিশুদ্ধ করার জন্য অভিজ্ঞ কারী/আলেমের সরাসরি তত্ত্বাবধানে অনুশীলন করুন।'
                : 'Note: AI speech transcription feedback is a helpful practice aid; always verify fine Tajweed and Qira’at mastery directly with a qualified Quran teacher.'}
            </p>
          </section>
        </div>
      )}

      {/* TAB 7: Student Progress Dashboard, Personal Notes & Certificate */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              {
                label: lang === 'bn' ? 'মোট অগ্রগতি' : 'Overall Progress',
                value: `${overallPercent}%`,
                icon: Trophy,
              },
              {
                label: lang === 'bn' ? 'সম্পন্ন ধাপ' : 'Levels Completed',
                value: `${progress.completedLevels.length} / ${ACADEMY_LEVELS.length}`,
                icon: CheckCircle2,
              },
              {
                label: lang === 'bn' ? 'স্টাডি স্ট্রিক' : 'Study Streak',
                value: `${progress.studyStreakDays} ${lang === 'bn' ? 'দিন' : 'days'}`,
                icon: Sparkles,
              },
              {
                label: lang === 'bn' ? 'বুকমার্ক' : 'Saved Items',
                value: String(progress.bookmarkedItems.length),
                icon: Star,
              },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-[#ebe6da] p-4 flex items-center gap-3.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#f5efe0] text-[#b58328] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-[#6e7268]">{stat.label}</p>
                    <p className="font-mono-tabular text-xl font-bold text-[#1f2421]">
                      {stat.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Level Roadmap */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#ebe6da] p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-base font-bold text-[#1f2421]">
                  {lang === 'bn'
                    ? 'একাডেমি লার্নিং রোডম্যাপ (লেভেল ১–৭)'
                    : 'Academy Curriculum Roadmap (Levels 1–7)'}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowCertificatePreview((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0f3d2e] text-[#d4a84f] text-xs font-semibold cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'সার্টিফিকেট প্রিভিউ' : 'Certificate'}</span>
                </button>
              </div>

              <div className="w-full h-2.5 rounded-full bg-[#faf7f0] overflow-hidden border border-[#ebe6da]">
                <div
                  className="h-full bg-[#087653] transition-all"
                  style={{ width: `${overallPercent}%` }}
                />
              </div>

              <div className="space-y-2 pt-1">
                {ACADEMY_LEVELS.map((lvl) => {
                  const done = progress.completedLevels.includes(lvl.level);
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => toggleLevelDone(lvl.level)}
                      className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                        done
                          ? 'bg-[#eef5f0] border-[#087653]/40 text-[#0f3d2e]'
                          : 'bg-[#faf7f0] border-[#ebe6da] text-[#494e45]'
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-semibold">{lvl[lang]}</span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                          done ? 'bg-[#087653] text-white' : 'bg-white border border-[#ebe6da]'
                        }`}
                      >
                        {done
                          ? lang === 'bn'
                            ? 'সম্পন্ন'
                            : 'Done'
                          : lang === 'bn'
                          ? 'বাকি'
                          : 'Pending'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Personal Study Notes & Quiz Summary */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-white rounded-2xl border border-[#ebe6da] p-5 space-y-3">
                <h3 className="font-display text-base font-bold text-[#1f2421]">
                  {lang === 'bn' ? 'ব্যক্তিগত অধ্যয়ন নোটস' : 'Personal Academy Notes'}
                </h3>
                <label className="block text-xs text-[#6e7268]">
                  {lang === 'bn' ? 'শিক্ষার্থীর নাম (সার্টিফিকেটের জন্য)' : 'Student Name (for Certificate)'}
                  <input
                    type="text"
                    value={progress.studentName}
                    onChange={(e) =>
                      setProgress((prev) => ({ ...prev, studentName: e.target.value }))
                    }
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-[#ebe6da] bg-[#faf7f0] text-sm text-[#1f2421]"
                  />
                </label>
                <textarea
                  rows={4}
                  value={progress.personalNotes}
                  onChange={(e) =>
                    setProgress((prev) => ({ ...prev, personalNotes: e.target.value }))
                  }
                  placeholder={
                    lang === 'bn'
                      ? 'এখানে আপনার মাখরাজ, তাজবিদ বা আরবি শব্দার্থের নোট লিখে রাখুন...'
                      : 'Write your Makharij, Tajweed, or vocabulary notes here...'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#ebe6da] bg-[#faf7f0] text-xs sm:text-sm text-[#1f2421]"
                />
              </div>

              <div className="bg-white rounded-2xl border border-[#ebe6da] p-5 space-y-2.5">
                <h3 className="font-display text-base font-bold text-[#1f2421]">
                  {lang === 'bn' ? 'কুইজ ফলাফল' : 'Quiz Scores'}
                </h3>
                {Object.keys(progress.quizScores).length === 0 ? (
                  <p className="text-xs text-[#6e7268]">
                    {lang === 'bn'
                      ? 'এখনো কোনো কুইজ সম্পন্ন হয়নি — প্রথম ট্যাব থেকে কুইজ দিন।'
                      : 'Complete quiz questions in the Letters tab to record scores.'}
                  </p>
                ) : (
                  Object.entries(progress.quizScores).map(([topic, s]) => (
                    <div
                      key={topic}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#faf7f0] border border-[#ebe6da] text-xs"
                    >
                      <span className="font-semibold uppercase text-[#8f6319]">{topic}</span>
                      <span className="font-mono-tabular font-bold text-[#087653]">
                        {s.score} / {s.total}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {showCertificatePreview && (
            <div className="bg-white rounded-2xl border-4 border-[#d4a84f] p-8 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0f3d2e] text-[#d4a84f]">
                <Award className="w-8 h-8" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#8f6319]">
                Arabic & Quran Academy · Islamic Life
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1f2421]">
                {lang === 'bn'
                  ? 'অধ্যয়ন সমাপনী সনদপত্র (প্রিভিউ)'
                  : 'Certificate of Arabic & Quran Study'}
              </h2>
              <p className="text-sm text-[#494e45]">
                {lang === 'bn' ? 'প্রদত্ত হলো:' : 'Awarded to:'}{' '}
                <strong className="text-lg text-[#087653]">
                  {progress.studentName || 'Learner'}
                </strong>
              </p>
              <p className="text-xs text-[#6e7268] max-w-xl mx-auto">
                {lang === 'bn'
                  ? `সফলভাবে ${progress.completedLevels.length}টি একাডেমি ধাপ (${overallPercent}%) সম্পন্ন করার স্বীকৃতিস্বরূপ।`
                  : `For completing ${progress.completedLevels.length} of ${ACADEMY_LEVELS.length} core Arabic, Makharij, and Tajweed modules (${overallPercent}%).`}
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#087653] text-white text-xs font-semibold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'প্রিন্ট / PDF সংরক্ষণ' : 'Print / Save PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCertificatePreview(false)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#ebe6da] text-xs font-semibold text-[#494e45] cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'বন্ধ করুন' : 'Close'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
