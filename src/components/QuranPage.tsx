import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Image as ImageIcon,
  Layers,
  Loader2,
  Pause,
  Play,
  Repeat,
  Search,
  ScrollText,
  Sparkles,
} from 'lucide-react';
import type {
  Ayah,
  AyahAudioTrack,
  AyahDetailResponse,
  Language,
  LastReadBookmark,
  Surah,
  SurahDetailResponse,
} from '../types/islamic';
import { useAuth } from '../contexts/AuthContext';
import {
  COMMON_QURAN_WORDS_DICT,
  QURAN_30_JUZ,
  segmentAyahForTajweed,
} from '../data/arabicAcademyData';
import { QuranAudioPlayer, type AudioRepeatMode } from './QuranAudioPlayer';
import { cleanAyahArabic, QuranTafsirModal, type TafsirModalState } from './QuranTafsirModal';
import { VerseImageModal, type VerseImageTarget } from './VerseImageModal';
import {
  getAyahPronunciation,
  SHORT_SURAH_NUMBERS,
  transliterateWordToBangla,
  transliterateWordToEnglish,
} from '../utils/arabicTransliteration';
import { safeReadJson } from '../utils/safeFetch';
import { loadStaticSurah } from '../utils/quranData';

interface QuranPageProps {
  lang: Language;
  surahs: Surah[];
  ayahs: Ayah[];
  jumpTo?: { surahNumber: number; ayahNumber: number; key: number } | null;
}

type TafsirMode = 'short' | 'full' | 'none';

const PAGE_SIZE = 25;
const LAST_READ_STORAGE_KEY = 'il_last_read_quran';

function readStoredLastRead(): LastReadBookmark | null {
  try {
    const raw = localStorage.getItem(LAST_READ_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LastReadBookmark>;
    if (
      typeof parsed.surahNumber === 'number' &&
      parsed.surahNumber >= 1 &&
      parsed.surahNumber <= 114 &&
      typeof parsed.ayah === 'number' &&
      parsed.ayah >= 1
    ) {
      return {
        surahNumber: parsed.surahNumber,
        nameEn: parsed.nameEn || `Surah ${parsed.surahNumber}`,
        nameBn: parsed.nameBn || `সূরা ${parsed.surahNumber}`,
        nameAr: parsed.nameAr,
        ayah: parsed.ayah,
        updatedAt: parsed.updatedAt,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function QuranPage({ lang, surahs, ayahs, jumpTo }: QuranPageProps) {
  const { user, syncLastReadBookmark } = useAuth();
  const [search, setSearch] = useState('');
  const [revelationFilter, setRevelationFilter] = useState<'all' | 'short' | 'Makki' | 'Madani'>('all');
  const [showPronunciation, setShowPronunciation] = useState<boolean>(true);
  const [lastReadBookmark, setLastReadBookmark] = useState<LastReadBookmark | null>(() =>
    readStoredLastRead()
  );
  const [selectedSurahId, setSelectedSurahId] = useState<number>(
    () => jumpTo?.surahNumber ?? readStoredLastRead()?.surahNumber ?? 1
  );
  const [arabicSize, setArabicSize] = useState<'md' | 'lg' | 'xl'>('lg');
  const [tafsirMode, setTafsirMode] = useState<TafsirMode>('short');
  const [tajweedColorEnabled, setTajweedColorEnabled] = useState<boolean>(false);
  const [selectedJuz, setSelectedJuz] = useState<number>(0);
  const [expandedWordsAyahs, setExpandedWordsAyahs] = useState<Record<string, boolean>>({});
  const [expandedFullAyahs, setExpandedFullAyahs] = useState<Record<string, boolean>>({});
  const [fetchedSurahAyahs, setFetchedSurahAyahs] = useState<Ayah[]>([]);
  const [loadingSurah, setLoadingSurah] = useState<boolean>(false);
  const [ayahPage, setAyahPage] = useState<number>(1);
  const [showAllAyahs, setShowAllAyahs] = useState<boolean>(false);
  const [jumpAyahInput, setJumpAyahInput] = useState<string>('');
  const [highlightedAyah, setHighlightedAyah] = useState<number | null>(null);

  const [tafsirModal, setTafsirModal] = useState<TafsirModalState | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSurahAyahs, setModalSurahAyahs] = useState<Ayah[]>([]);
  const [modalActiveAyah, setModalActiveAyah] = useState<Ayah | null>(null);
  const [verseImageTarget, setVerseImageTarget] = useState<VerseImageTarget | null>(null);

  // Audio player state (external AlQuran Cloud recitation API)
  const [reciterId, setReciterId] = useState<string>('ar.alafasy');
  const [audioSurahNumber, setAudioSurahNumber] = useState<number | null>(null);
  const [audioAyahNumber, setAudioAyahNumber] = useState<number | null>(null);
  const [audioPlayMode, setAudioPlayMode] = useState<'surah' | 'ayah'>('surah');
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [repeatMode, setRepeatMode] = useState<AudioRepeatMode>('off');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const surahCacheRef = useRef<Map<number, Ayah[]>>(new Map());
  const inFlightSurahRef = useRef<Map<number, Promise<Ayah[] | null>>>(new Map());
  const ayahCacheRef = useRef<Map<string, Ayah>>(new Map());
  const modalRequestIdRef = useRef<number>(0);
  const lastJumpKeyRef = useRef<number | null>(null);
  const pendingResumeRef = useRef<{ surahNumber: number; ayahNumber: number } | null>(
    (() => {
      if (jumpTo) return { surahNumber: jumpTo.surahNumber, ayahNumber: jumpTo.ayahNumber };
      const saved = readStoredLastRead();
      return saved ? { surahNumber: saved.surahNumber, ayahNumber: saved.ayah } : null;
    })()
  );

  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioTracksCacheRef = useRef<Map<string, AyahAudioTrack[]>>(new Map());
  const audioTracksInFlightRef = useRef<Map<string, Promise<AyahAudioTrack[]>>>(new Map());
  const audioQueueRef = useRef<AyahAudioTrack[]>([]);
  const audioRequestIdRef = useRef<number>(0);
  const audioMetaRef = useRef({
    surahNumber: null as number | null,
    ayahNumber: null as number | null,
    playMode: 'surah' as 'surah' | 'ayah',
    repeatMode: 'off' as AudioRepeatMode,
    reciterId: 'ar.alafasy',
    playbackRate: 1,
    isMuted: false,
  });

  audioMetaRef.current = {
    surahNumber: audioSurahNumber,
    ayahNumber: audioAyahNumber,
    playMode: audioPlayMode,
    repeatMode,
    reciterId,
    playbackRate,
    isMuted,
  };

  const [bookmarks, setBookmarks] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem('il_bookmarked_surahs');
      return raw ? JSON.parse(raw) : [1, 112];
    } catch {
      return [1, 112];
    }
  });

  const loadSurahFromApi = useCallback(async (surahNumber: number): Promise<Ayah[] | null> => {
    const existingPromise = inFlightSurahRef.current.get(surahNumber);
    if (existingPromise) return existingPromise;

    const promise = fetch(`/api/surahs/${surahNumber}`)
      .then((res) => (res.ok ? safeReadJson<SurahDetailResponse>(res).catch(() => null) : null))
      .then(async (data: SurahDetailResponse | null) => {
        const ayahs = Array.isArray(data?.ayahs) && data.ayahs.length
          ? data.ayahs
          : await loadStaticSurah(surahNumber);
        if (!ayahs) return null;
        surahCacheRef.current.set(surahNumber, ayahs);
        for (const a of ayahs) {
          ayahCacheRef.current.set(`${surahNumber}:${a.ayah_number}`, a);
        }
        return ayahs;
      })
      .finally(() => {
        inFlightSurahRef.current.delete(surahNumber);
      });

    inFlightSurahRef.current.set(surahNumber, promise);
    return promise;
  }, []);

  // Load complete ayahs + short & full tafsir for the selected Surah
  useEffect(() => {
    let cancelled = false;
    setAyahPage(1);
    setShowAllAyahs(false);
    setJumpAyahInput('');
    setHighlightedAyah(null);

    const cached = surahCacheRef.current.get(selectedSurahId);
    if (cached) {
      setFetchedSurahAyahs(cached);
    } else {
      setLoadingSurah(true);
    }

    loadSurahFromApi(selectedSurahId)
      .then((loaded) => {
        if (cancelled || !loaded) return;
        setFetchedSurahAyahs(loaded);
      })
      .catch(() => {
        // Fallback to preloaded ayahs prop if offline
      })
      .finally(() => {
        if (!cancelled) setLoadingSurah(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSurahId, loadSurahFromApi]);

  const filteredSurahs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return surahs.filter((s) => {
      if (revelationFilter === 'short' && !SHORT_SURAH_NUMBERS.includes(s.surah_number)) return false;
      if (
        (revelationFilter === 'Makki' || revelationFilter === 'Madani') &&
        s.revelation_type !== revelationFilter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        String(s.surah_number) === q ||
        s.name_en.toLowerCase().includes(q) ||
        s.name_bn.toLowerCase().includes(q) ||
        s.name_ar.includes(q) ||
        s.meaning_en.toLowerCase().includes(q) ||
        s.meaning_bn.toLowerCase().includes(q)
      );
    });
  }, [surahs, search, revelationFilter]);

  const activeSurah = useMemo(
    () => surahs.find((s) => s.surah_number === selectedSurahId) ?? surahs[0] ?? null,
    [surahs, selectedSurahId]
  );

  const saveLastReadPosition = useCallback(
    (surah: Surah, ayahNumber: number) => {
      const bookmark: LastReadBookmark = {
        surahNumber: surah.surah_number,
        nameEn: surah.name_en,
        nameBn: surah.name_bn,
        nameAr: surah.name_ar,
        ayah: Math.max(1, ayahNumber),
        updatedAt: new Date().toISOString(),
      };
      setLastReadBookmark(bookmark);
      try {
        localStorage.setItem(LAST_READ_STORAGE_KEY, JSON.stringify(bookmark));
      } catch {
        // ignore storage errors
      }
      if (user && user.emailVerified) {
        void syncLastReadBookmark(bookmark);
      }
    },
    [user, syncLastReadBookmark]
  );

  // Merge complete Surah ayahs from /api/surahs/:id with any live admin-added ayahs from props
  const surahAyahs = useMemo(() => {
    if (!activeSurah) return [];
    const byNum = new Map<number, Ayah>();
    for (const a of fetchedSurahAyahs) {
      if (a.surah_id === activeSurah.surah_number) {
        byNum.set(a.ayah_number, a);
      }
    }
    for (const a of ayahs) {
      if (a.surah_id === activeSurah.surah_number) {
        const existing = byNum.get(a.ayah_number);
        byNum.set(a.ayah_number, {
          ...existing,
          ...a,
          short_tafsir_bn: a.short_tafsir_bn || existing?.short_tafsir_bn || '',
          short_tafsir_en: a.short_tafsir_en || existing?.short_tafsir_en || '',
          tafsir_bn: a.tafsir_bn || existing?.tafsir_bn || '',
          tafsir_en: a.tafsir_en || existing?.tafsir_en || '',
        });
      }
    }
    return Array.from(byNum.values()).sort((a, b) => a.ayah_number - b.ayah_number);
  }, [fetchedSurahAyahs, ayahs, activeSurah]);

  const totalPages = Math.max(1, Math.ceil(surahAyahs.length / PAGE_SIZE));
  const displayedAyahs = useMemo(() => {
    if (showAllAyahs || surahAyahs.length <= PAGE_SIZE) return surahAyahs;
    const start = (ayahPage - 1) * PAGE_SIZE;
    return surahAyahs.slice(start, start + PAGE_SIZE);
  }, [surahAyahs, ayahPage, showAllAyahs]);

  // Resume scroll & highlight for saved Last Read or Search Jump once full Surah verses load
  useEffect(() => {
    const pending = pendingResumeRef.current;
    if (!pending || pending.surahNumber !== selectedSurahId || surahAyahs.length === 0) return;
    if (!surahCacheRef.current.has(selectedSurahId)) return;

    const idx = surahAyahs.findIndex((a) => a.ayah_number === pending.ayahNumber);
    if (idx === -1) {
      pendingResumeRef.current = null;
      return;
    }

    pendingResumeRef.current = null;
    if (!showAllAyahs) {
      const targetPage = Math.floor(idx / PAGE_SIZE) + 1;
      setAyahPage(targetPage);
    }
    setHighlightedAyah(pending.ayahNumber);

    if (pending.ayahNumber > 1) {
      window.setTimeout(() => {
        document
          .getElementById(`ayah-${pending.surahNumber}-${pending.ayahNumber}`)
          ?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
      }, 90);
    }
  }, [selectedSurahId, surahAyahs, showAllAyahs, loadingSurah]);

  // Handle explicit Surah:Ayah jump requests from Global Search
  useEffect(() => {
    if (!jumpTo || jumpTo.key === lastJumpKeyRef.current) return;
    lastJumpKeyRef.current = jumpTo.key;
    pendingResumeRef.current = {
      surahNumber: jumpTo.surahNumber,
      ayahNumber: jumpTo.ayahNumber,
    };
    if (selectedSurahId !== jumpTo.surahNumber) {
      setSelectedSurahId(jumpTo.surahNumber);
    } else if (surahCacheRef.current.has(selectedSurahId) && surahAyahs.length > 0) {
      const idx = surahAyahs.findIndex((a) => a.ayah_number === jumpTo.ayahNumber);
      if (idx !== -1) {
        pendingResumeRef.current = null;
        if (!showAllAyahs) {
          setAyahPage(Math.floor(idx / PAGE_SIZE) + 1);
        }
        setHighlightedAyah(jumpTo.ayahNumber);
        window.setTimeout(() => {
          document
            .getElementById(`ayah-${jumpTo.surahNumber}-${jumpTo.ayahNumber}`)
            ?.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
        }, 90);
      }
    }
  }, [jumpTo, selectedSurahId, showAllAyahs, surahAyahs, loadingSurah]);

  const handleJumpToAyah = () => {
    const num = Number(jumpAyahInput.trim());
    if (!Number.isInteger(num) || num < 1) return;
    const idx = surahAyahs.findIndex((a) => a.ayah_number === num);
    if (idx === -1) return;
    if (!showAllAyahs) {
      setAyahPage(Math.floor(idx / PAGE_SIZE) + 1);
    }
    setHighlightedAyah(num);
    if (activeSurah) {
      saveLastReadPosition(activeSurah, num);
    }
    window.setTimeout(() => {
      document.getElementById(`ayah-${selectedSurahId}-${num}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 60);
  };

  const handleSelectSurah = (surah: Surah) => {
    setSelectedSurahId(surah.surah_number);
    if (lastReadBookmark?.surahNumber === surah.surah_number) {
      pendingResumeRef.current = {
        surahNumber: surah.surah_number,
        ayahNumber: lastReadBookmark.ayah,
      };
    } else {
      saveLastReadPosition(surah, 1);
    }
  };

  const handleJumpToLastRead = () => {
    if (!lastReadBookmark) return;
    pendingResumeRef.current = {
      surahNumber: lastReadBookmark.surahNumber,
      ayahNumber: lastReadBookmark.ayah,
    };
    if (selectedSurahId !== lastReadBookmark.surahNumber) {
      setSelectedSurahId(lastReadBookmark.surahNumber);
    } else {
      const idx = surahAyahs.findIndex((a) => a.ayah_number === lastReadBookmark.ayah);
      if (idx !== -1) {
        if (!showAllAyahs) {
          setAyahPage(Math.floor(idx / PAGE_SIZE) + 1);
        }
        setHighlightedAyah(lastReadBookmark.ayah);
        window.setTimeout(() => {
          document
            .getElementById(`ayah-${lastReadBookmark.surahNumber}-${lastReadBookmark.ayah}`)
            ?.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
        }, 60);
      }
    }
  };

  const toggleBookmark = (surahNum: number) => {
    setBookmarks((prev) => {
      const next = prev.includes(surahNum)
        ? prev.filter((id) => id !== surahNum)
        : [...prev, surahNum];
      try {
        localStorage.setItem('il_bookmarked_surahs', JSON.stringify(next));
      } catch {
        // ignore storage quota errors
      }
      return next;
    });
  };

  const toggleAyahFullTafsir = (surahNum: number, ayahNum: number) => {
    const key = `${surahNum}:${ayahNum}`;
    setExpandedFullAyahs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const fetchAndOpenSurahModal = useCallback(
    async (surah: Surah) => {
      const reqId = ++modalRequestIdRef.current;
      setSelectedSurahId(surah.surah_number);
      setTafsirModal({ mode: 'surah', surah });
      setModalError(null);
      setModalActiveAyah(null);

      const cached = surahCacheRef.current.get(surah.surah_number);
      if (cached && cached.length > 0) {
        setModalSurahAyahs(cached);
        setModalLoading(false);
      } else {
        setModalSurahAyahs([]);
        setModalLoading(true);
      }

      try {
        const loaded = await loadSurahFromApi(surah.surah_number);
        if (modalRequestIdRef.current !== reqId) return;
        if (!loaded) throw new Error('Empty response');
        setModalSurahAyahs(loaded);
        setFetchedSurahAyahs(loaded);
      } catch {
        if (modalRequestIdRef.current !== reqId) return;
        if (!cached || cached.length === 0) {
          setModalError(
            lang === 'bn'
              ? 'সূরার তাফসির লোড করা যায়নি। আবার চেষ্টা করুন।'
              : 'Failed to load Surah Tafsir. Please try again.'
          );
        }
      } finally {
        if (modalRequestIdRef.current === reqId) {
          setModalLoading(false);
        }
      }
    },
    [lang, loadSurahFromApi]
  );

  const fetchAndOpenAyahModal = useCallback(
    async (surah: Surah, ayahNumber: number, returnToSurah = false, fallbackAyah?: Ayah) => {
      const reqId = ++modalRequestIdRef.current;
      const cacheKey = `${surah.surah_number}:${ayahNumber}`;
      setTafsirModal({ mode: 'ayah', surah, ayahNumber, returnToSurah });
      setModalError(null);

      saveLastReadPosition(surah, ayahNumber);

      const cachedAyah = ayahCacheRef.current.get(cacheKey) ?? fallbackAyah ?? null;
      if (cachedAyah) {
        setModalActiveAyah(cachedAyah);
        setModalLoading(false);
      } else {
        setModalActiveAyah(null);
        setModalLoading(true);
      }

      try {
        const res = await fetch(`/api/surahs/${surah.surah_number}/ayahs/${ayahNumber}`);
        const data = await safeReadJson<AyahDetailResponse>(res, `HTTP ${res.status}`);
        if (modalRequestIdRef.current !== reqId) return;
        if (data?.ayah) {
          ayahCacheRef.current.set(cacheKey, data.ayah);
          setModalActiveAyah(data.ayah);
        }
      } catch {
        if (modalRequestIdRef.current !== reqId) return;
        if (!cachedAyah) {
          setModalError(
            lang === 'bn'
              ? 'আয়াতের তাফসির লোড করা যায়নি। আবার চেষ্টা করুন।'
              : 'Failed to load Ayah Tafsir. Please try again.'
          );
        }
    } finally {
        if (modalRequestIdRef.current === reqId) {
          setModalLoading(false);
        }
      }
    },
    [lang, saveLastReadPosition]
  );

  const stopAudioPlayback = useCallback(() => {
    audioRequestIdRef.current += 1;
    const audio = audioElementRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    setIsAudioPlaying(false);
    setIsAudioLoading(false);
    setAudioAyahNumber(null);
    setAudioSurahNumber(null);
    setAudioCurrentTime(0);
    setAudioDuration(0);
    setAudioError(null);
  }, []);

  const fetchAudioTracks = useCallback(
    async (surahNumber: number, edition: string): Promise<AyahAudioTrack[]> => {
      const cacheKey = `${surahNumber}:${edition}`;
      const cached = audioTracksCacheRef.current.get(cacheKey);
      if (cached && cached.length > 0) return cached;

      const existing = audioTracksInFlightRef.current.get(cacheKey);
      if (existing) return existing;

      const promise = fetch(
        `https://api.alquran.cloud/v1/surah/${surahNumber}/${encodeURIComponent(edition)}`
      )
        .then(async (res) => {
          const json = await safeReadJson<{
            code?: number;
            data?: { ayahs?: AyahAudioTrack[] };
          }>(res, `HTTP ${res.status}`);
          const tracks = json?.data?.ayahs;
          if (!Array.isArray(tracks) || tracks.length === 0) {
            throw new Error('No recitation audio tracks found');
          }
          audioTracksCacheRef.current.set(cacheKey, tracks);
          return tracks;
        })
        .finally(() => {
          audioTracksInFlightRef.current.delete(cacheKey);
        });

      audioTracksInFlightRef.current.set(cacheKey, promise);
      return promise;
    },
    []
  );

  const playTrackAtAyah = useCallback(
    async (
      surahNumber: number,
      ayahNumber: number,
      mode: 'surah' | 'ayah',
      editionOverride?: string
    ) => {
      const reqId = ++audioRequestIdRef.current;
      const edition = editionOverride ?? audioMetaRef.current.reciterId;

      setAudioError(null);
      setIsAudioLoading(true);
      setAudioSurahNumber(surahNumber);
      setAudioAyahNumber(ayahNumber);
      setAudioPlayMode(mode);
      setAudioCurrentTime(0);
      setAudioDuration(0);

      if (surahNumber === selectedSurahId && !showAllAyahs) {
        const targetPage = Math.floor((ayahNumber - 1) / PAGE_SIZE) + 1;
        setAyahPage((prev) => (prev === targetPage ? prev : targetPage));
      }

      try {
        const tracks = await fetchAudioTracks(surahNumber, edition);
        if (audioRequestIdRef.current !== reqId) return;

        audioQueueRef.current = tracks;
        const track = tracks.find((t) => t.numberInSurah === ayahNumber) ?? tracks[0];
        if (!track || !track.audio) {
          throw new Error('Track URL unavailable');
        }

        let audio = audioElementRef.current;
        if (!audio) {
          audio = new Audio();
          audio.preload = 'auto';
          audioElementRef.current = audio;
        }

        let usedSecondary = false;
        audio.ontimeupdate = () => {
          setAudioCurrentTime(audio?.currentTime ?? 0);
        };
        audio.onloadedmetadata = () => {
          setAudioDuration(audio?.duration ?? 0);
        };
        audio.onplay = () => {
          setIsAudioPlaying(true);
          setIsAudioLoading(false);
        };
        audio.onpause = () => {
          setIsAudioPlaying(false);
        };
        audio.onerror = () => {
          if (!usedSecondary && track.audioSecondary && track.audioSecondary[0] && audio) {
            usedSecondary = true;
            audio.src = track.audioSecondary[0];
            audio.playbackRate = audioMetaRef.current.playbackRate;
            audio.muted = audioMetaRef.current.isMuted;
            audio.play().catch(() => {});
            return;
          }
          setIsAudioLoading(false);
          setIsAudioPlaying(false);
          setAudioError(
            lang === 'bn'
              ? 'অডিও চালানো সম্ভব হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।'
              : 'Unable to play recitation audio. Please try again.'
          );
        };
        audio.onended = () => {
          const meta = audioMetaRef.current;
          if (meta.repeatMode === 'ayah' && audio) {
            audio.currentTime = 0;
            audio.play().catch(() => {});
            return;
          }
          if (meta.playMode === 'ayah') {
            setIsAudioPlaying(false);
            setAudioCurrentTime(0);
            return;
          }
          const nextNum = (meta.ayahNumber ?? ayahNumber) + 1;
          const hasNext = audioQueueRef.current.some((t) => t.numberInSurah === nextNum);
          if (hasNext) {
            void playTrackAtAyah(surahNumber, nextNum, 'surah', meta.reciterId);
          } else if (meta.repeatMode === 'surah') {
            void playTrackAtAyah(surahNumber, 1, 'surah', meta.reciterId);
          } else {
            setIsAudioPlaying(false);
            setAudioAyahNumber(null);
            setAudioCurrentTime(0);
            setAudioDuration(0);
          }
        };

        audio.src = track.audio;
        audio.playbackRate = audioMetaRef.current.playbackRate;
        audio.muted = audioMetaRef.current.isMuted;
        await audio.play();
      } catch (err) {
        if (audioRequestIdRef.current !== reqId) return;
        const msg = err instanceof Error ? err.message : '';
        if (msg.toLowerCase().includes('abort')) return;
        setIsAudioLoading(false);
        setIsAudioPlaying(false);
        setAudioError(
          lang === 'bn'
            ? 'তেলাওয়াত অডিও লোড করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।'
            : 'Failed to load recitation from audio service. Please try again.'
        );
      }
    },
    [fetchAudioTracks, lang, selectedSurahId, showAllAyahs]
  );

  const handleTogglePlaySurah = useCallback(() => {
    if (!activeSurah) return;
    const audio = audioElementRef.current;
    if (audioSurahNumber === activeSurah.surah_number && audioAyahNumber !== null && audio?.src) {
      if (isAudioPlaying) {
        audio.pause();
      } else {
        setAudioPlayMode('surah');
        audio.play().catch(() => {
          void playTrackAtAyah(activeSurah.surah_number, audioAyahNumber, 'surah');
        });
      }
      return;
    }
    void playTrackAtAyah(activeSurah.surah_number, 1, 'surah');
  }, [activeSurah, audioAyahNumber, audioSurahNumber, isAudioPlaying, playTrackAtAyah]);

  const handleTogglePlayAyah = useCallback(
    (surahNumber: number, ayahNumber: number) => {
      const audio = audioElementRef.current;
      if (
        audioSurahNumber === surahNumber &&
        audioAyahNumber === ayahNumber &&
        audio?.src
      ) {
        if (isAudioPlaying) {
          audio.pause();
        } else {
          audio.play().catch(() => {
            void playTrackAtAyah(surahNumber, ayahNumber, 'ayah');
          });
        }
        return;
      }
      void playTrackAtAyah(surahNumber, ayahNumber, 'ayah');
    },
    [audioAyahNumber, audioSurahNumber, isAudioPlaying, playTrackAtAyah]
  );

  const handleChangeReciter = useCallback(
    (nextReciterId: string) => {
      setReciterId(nextReciterId);
      if (audioSurahNumber !== null && audioAyahNumber !== null && (isAudioPlaying || isAudioLoading)) {
        void playTrackAtAyah(audioSurahNumber, audioAyahNumber, audioPlayMode, nextReciterId);
      }
    },
    [audioAyahNumber, audioPlayMode, audioSurahNumber, isAudioLoading, isAudioPlaying, playTrackAtAyah]
  );

  useEffect(() => {
    if (audioSurahNumber !== null && audioSurahNumber !== selectedSurahId) {
      stopAudioPlayback();
    }
  }, [audioSurahNumber, selectedSurahId, stopAudioPlayback]);

  useEffect(() => {
    return () => {
      const audio = audioElementRef.current;
      if (audio) {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      }
    };
  }, []);

  const closeTafsirModal = useCallback(() => {
    modalRequestIdRef.current += 1;
    setTafsirModal(null);
    setModalError(null);
  }, []);

  const arabicTextSizeClass =
    arabicSize === 'xl' ? 'text-4xl' : arabicSize === 'lg' ? 'text-3xl' : 'text-2xl';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#183027]">
            {lang === 'bn'
              ? 'পবিত্র কুরআনুল কারীম (১১৪টি সূরা ও তাফসির)'
              : 'Holy Quran (All 114 Surahs & Tafsir)'}
          </h1>
          <p className="text-[#5a7066] mt-1">
            {lang === 'bn'
              ? 'সম্পূর্ণ ১১৪টি সূরা, আরবি তিলাওয়াত, বাংলা-ইংরেজি অনুবাদ এবং সংক্ষিপ্ত ও বিস্তারিত তাফসির।'
              : 'All 114 Surahs with Arabic script, Bengali/English translations, Short Tafsir, and Detailed Tafsir.'}
          </p>
        </div>

        {lastReadBookmark && (
          <button
            type="button"
            data-testid="quran-last-read-chip"
            onClick={handleJumpToLastRead}
            className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white border border-[#ebe6da] hover:border-[#b58328] text-left shadow-xs transition-colors cursor-pointer"
          >
            <span className="w-8 h-8 rounded-lg bg-[#f5efe0] text-[#b58328] flex items-center justify-center shrink-0">
              <BookmarkCheck className="w-4 h-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-medium text-[#6e7268]">
                {lang === 'bn' ? 'সর্বশেষ পাঠ' : 'Last Read Bookmark'}
              </span>
              <span className="block text-xs font-bold text-[#183027] truncate">
                {lang === 'bn' ? lastReadBookmark.nameBn : lastReadBookmark.nameEn} ·{' '}
                {lastReadBookmark.surahNumber}:{lastReadBookmark.ayah}
              </span>
            </span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Directory: 114 Surahs */}
        <aside className="lg:col-span-4 bg-white rounded-2xl border border-[#ebe6da] p-4 lg:sticky lg:top-6">
          <div className="space-y-3 pb-3 border-b border-[#eef5f0]">
            <div className="relative">
              <Search className="w-4 h-4 text-[#5a7066] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label={lang === 'bn' ? 'সূরা খুঁজুন' : 'Search Surah'}
                placeholder={
                  lang === 'bn'
                    ? 'সূরার নাম বা নম্বর লিখুন...'
                    : 'Search by Surah name or number...'
                }
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#dce7e0] bg-[#f7faf8] focus:outline-none focus:border-[#087653]"
              />
            </div>

            <div className="grid grid-cols-4 gap-1 bg-[#eef5f0] p-1 rounded-lg">
              {(['all', 'short', 'Makki', 'Madani'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  data-testid={`surah-filter-${f}`}
                  onClick={() => setRevelationFilter(f)}
                  className={`py-1.5 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                    revelationFilter === f
                      ? 'bg-white text-[#087653] shadow-sm font-semibold'
                      : 'text-[#5a7066]'
                  }`}
                >
                  {f === 'all'
                    ? lang === 'bn'
                      ? 'সকল'
                      : 'All'
                    : f === 'short'
                    ? lang === 'bn'
                      ? 'ছোট সূরা'
                      : 'Short'
                    : f === 'Makki'
                    ? lang === 'bn'
                      ? 'মাক্কী'
                      : 'Makki'
                    : lang === 'bn'
                    ? 'মাদানী'
                    : 'Madani'}
                </button>
              ))}
            </div>

            {/* 30 Juz (Para) Quick Jump Selector */}
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#087653] shrink-0" />
              <select
                data-testid="quran-juz-select"
                value={selectedJuz}
                onChange={(e) => {
                  const j = Number(e.target.value);
                  setSelectedJuz(j);
                  const entry = QURAN_30_JUZ.find((x) => x.juz === j);
                  if (entry) {
                    pendingResumeRef.current = {
                      surahNumber: entry.surahNumber,
                      ayahNumber: entry.ayahNumber,
                    };
                    setSelectedSurahId(entry.surahNumber);
                  }
                }}
                aria-label={lang === 'bn' ? 'পারা (জুজ) নির্বাচন করুন' : 'Select Juz (Para)'}
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-[#dce7e0] bg-[#f7faf8] text-xs font-medium text-[#183027] focus:outline-none focus:border-[#087653]"
              >
                <option value={0}>
                  {lang === 'bn' ? '৩০ পারা (জুজ) — পারা বেছে নিন' : '30 Juz (Para) — Jump to Juz'}
                </option>
                {QURAN_30_JUZ.map((j) => (
                  <option key={j.juz} value={j.juz}>
                    {lang === 'bn' ? `পারা ${j.nameBn}` : `Juz ${j.nameEn}`} ({j.surahNumber}:{j.ayahNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 max-h-[600px] overflow-y-auto divide-y divide-[#eef5f0] pr-1">
            {filteredSurahs.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#5a7066]">
                {lang === 'bn' ? 'কোনো সূরা পাওয়া যায়নি।' : 'No matching Surahs found.'}
              </p>
            ) : (
              filteredSurahs.map((surah) => {
                const isSelected = activeSurah?.surah_number === surah.surah_number;
                const isBookmarked = bookmarks.includes(surah.surah_number);
                return (
                  <div
                    key={surah.surah_number}
                    className={`flex items-center gap-1 rounded-lg transition-colors ${
                      isSelected ? 'bg-[#eef5f0]' : 'hover:bg-[#f7faf8]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectSurah(surah)}
                      className="flex-1 min-w-0 text-left px-3 py-3 flex items-center justify-between gap-2.5 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-8 h-8 rounded-lg font-mono-tabular text-xs font-bold flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-[#087653] text-white'
                              : 'bg-[#f7faf8] text-[#183027] border border-[#dce7e0]'
                          }`}
                        >
                          {surah.surah_number}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#183027] truncate">
                            {lang === 'bn' ? surah.name_bn : surah.name_en}
                            {isBookmarked && (
                              <span className="ml-1.5 text-[#d5ad59]" aria-label="Bookmarked">
                                ★
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-[#5a7066] truncate">
                            {lang === 'bn' ? surah.meaning_bn : surah.meaning_en} · {surah.total_ayahs}{' '}
                            {lang === 'bn' ? 'আয়াত' : 'Ayahs'}
                          </p>
                        </div>
                      </div>
                      <span className="font-arabic text-lg text-[#087653] shrink-0">
                        {surah.name_ar}
                      </span>
                    </button>

                    <button
                      type="button"
                      data-testid={`surah-tafsir-btn-${surah.surah_number}`}
                      onClick={() => fetchAndOpenSurahModal(surah)}
                      title={lang === 'bn' ? 'সূরা তাফসির দেখুন' : 'Open Surah Tafsir'}
                      aria-label={
                        lang === 'bn'
                          ? `${surah.name_bn} তাফসির দেখুন`
                          : `Open Tafsir for ${surah.name_en}`
                      }
                      className="mr-2 px-2 py-1.5 rounded-md border border-[#ebe6da] bg-white text-[11px] font-medium text-[#087653] hover:bg-[#087653] hover:text-white hover:border-[#087653] transition-colors shrink-0 cursor-pointer"
                    >
                      {lang === 'bn' ? 'তাফসির' : 'Tafsir'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Reader: Selected Surah Ayahs & Tafsir */}
        <section className="lg:col-span-8 bg-white rounded-2xl border border-[#dce7e0] p-6">
          {activeSurah ? (
            <div>
              <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-[#eef5f0]">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#5a7066]">
                    <span>
                      {lang === 'bn'
                        ? `সূরা নং ${activeSurah.surah_number}`
                        : `Surah ${activeSurah.surah_number}`}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{activeSurah.revelation_type}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {activeSurah.total_ayahs} {lang === 'bn' ? 'আয়াত' : 'Ayahs'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-[#183027] mt-1">
                    {lang === 'bn' ? activeSurah.name_bn : activeSurah.name_en}{' '}
                    <span className="font-arabic text-[#087653] ml-2">{activeSurah.name_ar}</span>
                  </h2>
                  <p className="text-xs text-[#5a7066] mt-0.5">
                    {lang === 'bn' ? activeSurah.meaning_bn : activeSurah.meaning_en}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Sura-level Tafsir Modal Trigger */}
                  <button
                    type="button"
                    data-testid="open-surah-tafsir-btn"
                    onClick={() => fetchAndOpenSurahModal(activeSurah)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#faf7f0] border border-[#b58328]/40 text-[#8a6017] hover:bg-[#f5efe0] text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <ScrollText className="w-3.5 h-3.5 text-[#b58328]" />
                    <span>{lang === 'bn' ? 'সূরা তাফসির' : 'Surah Tafsir'}</span>
                  </button>

                  {/* Tafsir Mode Switcher */}
                  <div
                    role="group"
                    aria-label={lang === 'bn' ? 'তাফসির নির্বাচন' : 'Tafsir Mode'}
                    className="inline-flex bg-[#eef5f0] rounded-lg p-0.5 text-xs"
                  >
                    {(
                      [
                        ['short', lang === 'bn' ? 'সংক্ষিপ্ত তাফসির' : 'Short Tafsir'],
                        ['full', lang === 'bn' ? 'বিস্তারিত তাফসির' : 'Full Tafsir'],
                        ['none', lang === 'bn' ? 'শুধু অনুবাদ' : 'No Tafsir'],
                      ] as const
                    ).map(([mode, label]) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setTafsirMode(mode)}
                        className={`px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                          tafsirMode === mode
                            ? 'bg-[#087653] text-white font-semibold'
                            : 'text-[#5a7066] hover:text-[#183027]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    data-testid="toggle-pronunciation-btn"
                    onClick={() => setShowPronunciation((p) => !p)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                      showPronunciation
                        ? 'bg-[#eef5f0] border-[#087653]/40 text-[#087653] font-semibold'
                        : 'bg-white border-[#dce7e0] text-[#5a7066]'
                    }`}
                  >
                    {lang === 'bn' ? 'বাংলা উচ্চারণ' : 'Transliteration'}
                  </button>

                  <button
                    type="button"
                    data-testid="toggle-tajweed-color-btn"
                    onClick={() => setTajweedColorEnabled((v) => !v)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                      tajweedColorEnabled
                        ? 'bg-[#f5efe0] border-[#b58328] text-[#8f6319] font-semibold'
                        : 'bg-white border-[#dce7e0] text-[#5a7066]'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'তাজবিদ রঙ' : 'Tajweed Colors'}</span>
                  </button>

                  <div className="inline-flex bg-[#eef5f0] rounded-lg p-0.5 text-xs">
                    {(['md', 'lg', 'xl'] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setArabicSize(sz)}
                        aria-label={`Arabic font size ${sz}`}
                        className={`px-2.5 py-1.5 rounded-md font-medium cursor-pointer ${
                          arabicSize === sz ? 'bg-white text-[#087653] font-semibold' : 'text-[#5a7066]'
                        }`}
                      >
                        {sz.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleBookmark(activeSurah.surah_number)}
                    aria-label={lang === 'bn' ? 'বুকমার্ক করুন' : 'Bookmark Surah'}
                    className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                      bookmarks.includes(activeSurah.surah_number)
                        ? 'bg-[#eef5f0] border-[#087653] text-[#087653]'
                        : 'border-[#dce7e0] text-[#5a7066] hover:border-[#087653]'
                    }`}
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {tajweedColorEnabled && (
                <div className="mt-3 px-3.5 py-2 rounded-xl bg-[#faf7f0] border border-[#ebe6da] flex flex-wrap items-center gap-3 text-[11px]">
                  <span className="font-semibold text-[#183027]">
                    {lang === 'bn' ? 'তাজবিদ রঙ নির্দেশিকা:' : 'Tajweed Color Guide:'}
                  </span>
                  <span className="text-[#059669] font-semibold">
                    ● {lang === 'bn' ? 'গুন্নাহ / ইখফা (নাকের বাঁশি)' : 'Ghunnah / Ikhfa'}
                  </span>
                  <span className="text-[#2563eb] font-semibold">
                    ● {lang === 'bn' ? 'ক্বলক্বলাহ (প্রতিধ্বনি)' : 'Qalqalah Echo'}
                  </span>
                  <span className="text-[#d97706] font-semibold">
                    ● {lang === 'bn' ? 'মদ্দ (দীর্ঘ স্বর)' : 'Madd Elongation'}
                  </span>
                  <span className="text-[#9333ea] font-semibold">
                    ● {lang === 'bn' ? 'তাফখীম (ভারী হরফ)' : 'Heavy Tafkheem'}
                  </span>
                </div>
              )}

              {/* Audio Recitation Player for Selected Surah & Ayahs */}
              <QuranAudioPlayer
                lang={lang}
                surah={activeSurah}
                reciterId={reciterId}
                isPlaying={isAudioPlaying && audioSurahNumber === activeSurah.surah_number}
                isLoading={isAudioLoading && audioSurahNumber === activeSurah.surah_number}
                activeAyahNumber={
                  audioSurahNumber === activeSurah.surah_number ? audioAyahNumber : null
                }
                playMode={audioPlayMode}
                currentTime={audioCurrentTime}
                duration={audioDuration}
                playbackRate={playbackRate}
                repeatMode={repeatMode}
                isMuted={isMuted}
                error={audioError}
                onTogglePlaySurah={handleTogglePlaySurah}
                onStop={stopAudioPlayback}
                onPrevAyah={() => {
                  if (audioAyahNumber && audioAyahNumber > 1) {
                    void playTrackAtAyah(activeSurah.surah_number, audioAyahNumber - 1, audioPlayMode);
                  }
                }}
                onNextAyah={() => {
                  if (audioAyahNumber && audioAyahNumber < activeSurah.total_ayahs) {
                    void playTrackAtAyah(activeSurah.surah_number, audioAyahNumber + 1, audioPlayMode);
                  }
                }}
                onSeek={(time) => {
                  if (audioElementRef.current) {
                    audioElementRef.current.currentTime = time;
                    setAudioCurrentTime(time);
                  }
                }}
                onChangeReciter={handleChangeReciter}
                onCycleRepeat={() =>
                  setRepeatMode((prev) =>
                    prev === 'off' ? 'ayah' : prev === 'ayah' ? 'surah' : 'off'
                  )
                }
                onCycleSpeed={() => {
                  const speeds = [0.75, 1, 1.25, 1.5];
                  const idx = speeds.indexOf(playbackRate);
                  const next = speeds[(idx + 1) % speeds.length];
                  setPlaybackRate(next);
                  if (audioElementRef.current) {
                    audioElementRef.current.playbackRate = next;
                  }
                }}
                onToggleMute={() => {
                  setIsMuted((prev) => {
                    const next = !prev;
                    if (audioElementRef.current) {
                      audioElementRef.current.muted = next;
                    }
                    return next;
                  });
                }}
                onRetry={() => {
                  const targetAyah = audioAyahNumber ?? 1;
                  void playTrackAtAyah(activeSurah.surah_number, targetAyah, audioPlayMode);
                }}
              />

              {/* Bismillah Banner (except Surah 9 At-Tawbah and Surah 1 where Bismillah is Ayah 1) */}
              {activeSurah.surah_number !== 9 && activeSurah.surah_number !== 1 && (
                <p className="font-arabic text-2xl text-center text-[#087653] py-5 border-b border-[#eef5f0]">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </p>
              )}

              {/* Ayah Jump & Pagination Controls for Multi-Page Surahs */}
              {surahAyahs.length > PAGE_SIZE && (
                <div className="py-3 px-4 mt-4 rounded-xl bg-[#f7faf8] border border-[#dce7e0] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={activeSurah.total_ayahs}
                      value={jumpAyahInput}
                      onChange={(e) => setJumpAyahInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleJumpToAyah();
                      }}
                      placeholder={lang === 'bn' ? 'আয়াত নং...' : 'Ayah #...'}
                      aria-label={lang === 'bn' ? 'আয়াত নম্বরে যান' : 'Jump to Ayah number'}
                      className="w-24 px-2.5 py-1.5 rounded-lg border border-[#dce7e0] bg-white font-mono-tabular text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleJumpToAyah}
                      className="px-3 py-1.5 rounded-lg bg-[#087653] text-white font-medium cursor-pointer"
                    >
                      {lang === 'bn' ? 'যান' : 'Go'}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {!showAllAyahs && (
                      <>
                        <button
                          type="button"
                          disabled={ayahPage <= 1}
                          onClick={() => setAyahPage((p) => Math.max(1, p - 1))}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#dce7e0] bg-white disabled:opacity-40 cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>{lang === 'bn' ? 'পূর্ববর্তী' : 'Prev'}</span>
                        </button>
                        <span className="font-mono-tabular text-[#183027] font-medium px-1">
                          {ayahPage} / {totalPages}
                        </span>
                        <button
                          type="button"
                          disabled={ayahPage >= totalPages}
                          onClick={() => setAyahPage((p) => Math.min(totalPages, p + 1))}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#dce7e0] bg-white disabled:opacity-40 cursor-pointer"
                        >
                          <span>{lang === 'bn' ? 'পরবর্তী' : 'Next'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowAllAyahs((s) => !s)}
                      className="px-3 py-1.5 rounded-lg border border-[#087653] text-[#087653] font-medium bg-white hover:bg-[#eef5f0] cursor-pointer"
                    >
                      {showAllAyahs
                        ? lang === 'bn'
                          ? 'পৃষ্ঠা অনুযায়ী দেখুন'
                          : 'Paginate (25)'
                        : lang === 'bn'
                        ? `সব আয়াত (${surahAyahs.length})`
                        : `Show All (${surahAyahs.length})`}
                    </button>
                  </div>
                </div>
              )}

              {loadingSurah && surahAyahs.length === 0 ? (
                <div className="py-16 text-center text-sm text-[#5a7066]">
                  {lang === 'bn'
                    ? 'সূরা ও তাফসির লোড হচ্ছে...'
                    : 'Loading Surah verses and Tafsir...'}
                </div>
              ) : displayedAyahs.length > 0 ? (
                <div className="divide-y divide-[#eef5f0]">
                  {displayedAyahs.map((ayah) => {
                    const key = `${activeSurah.surah_number}:${ayah.ayah_number}`;
                    const shortText =
                      lang === 'bn'
                        ? ayah.short_tafsir_bn || ayah.short_tafsir_en
                        : ayah.short_tafsir_en || ayah.short_tafsir_bn;
                    const fullText =
                      lang === 'bn'
                        ? ayah.tafsir_bn || ayah.tafsir_en
                        : ayah.tafsir_en || ayah.tafsir_bn;
                    const isExpandedFull = Boolean(expandedFullAyahs[key]);
                    const showFullPanel =
                      (tafsirMode === 'full' && Boolean(fullText)) ||
                      (tafsirMode === 'short' && isExpandedFull && Boolean(fullText));
                    const showShortPanel =
                      tafsirMode === 'short' && !isExpandedFull && Boolean(shortText);
                    const isHighlighted = highlightedAyah === ayah.ayah_number;
                    const isThisAyahPlaying =
                      isAudioPlaying &&
                      audioSurahNumber === activeSurah.surah_number &&
                      audioAyahNumber === ayah.ayah_number;
                    const isThisAyahLoading =
                      isAudioLoading &&
                      audioSurahNumber === activeSurah.surah_number &&
                      audioAyahNumber === ayah.ayah_number;
                    const isThisAyahActive =
                      audioSurahNumber === activeSurah.surah_number &&
                      audioAyahNumber === ayah.ayah_number;
                    const isThisAyahLastRead =
                      lastReadBookmark?.surahNumber === activeSurah.surah_number &&
                      lastReadBookmark?.ayah === ayah.ayah_number;

                    return (
                      <article
                        key={`${ayah.id}-${ayah.ayah_number}`}
                        id={`ayah-${activeSurah.surah_number}-${ayah.ayah_number}`}
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest('button')) return;
                          const selection = window.getSelection()?.toString();
                          if (selection && selection.length > 0) return;
                          fetchAndOpenAyahModal(activeSurah, ayah.ayah_number, false, ayah);
                        }}
                        className={`py-6 px-3 -mx-3 rounded-xl transition-colors cursor-pointer hover:bg-[#faf7f0]/80 ${
                          isThisAyahActive
                            ? 'bg-[#eef5f0]/75 ring-1 ring-[#087653]/35'
                            : isHighlighted
                            ? 'bg-[#eef5f0]/60'
                            : ''
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono-tabular text-xs font-semibold px-2 py-0.5 rounded-md bg-[#eef5f0] text-[#087653]">
                              {activeSurah.surah_number}:{ayah.ayah_number}
                            </span>
                            <button
                              type="button"
                              data-testid={`ayah-play-btn-${ayah.ayah_number}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePlayAyah(activeSurah.surah_number, ayah.ayah_number);
                              }}
                              aria-label={
                                isThisAyahPlaying
                                  ? lang === 'bn'
                                    ? `আয়াত ${ayah.ayah_number} বিরতি দিন`
                                    : `Pause Ayah ${ayah.ayah_number}`
                                  : lang === 'bn'
                                  ? `আয়াত ${ayah.ayah_number} তেলাওয়াত শুনুন`
                                  : `Play Ayah ${ayah.ayah_number}`
                              }
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold transition-colors cursor-pointer ${
                                isThisAyahActive
                                  ? 'bg-[#087653] border-[#087653] text-white'
                                  : 'bg-white border-[#ebe6da] text-[#087653] hover:border-[#087653] hover:bg-[#eef5f0]'
                              }`}
                            >
                              {isThisAyahLoading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : isThisAyahPlaying ? (
                                <Pause className="w-3 h-3" />
                              ) : (
                                <Play className="w-3 h-3" />
                              )}
                              <span>
                                {isThisAyahPlaying
                                  ? lang === 'bn'
                                    ? 'বিরতি'
                                    : 'Pause'
                                  : lang === 'bn'
                                  ? 'শুনুন'
                                  : 'Play'}
                              </span>
                            </button>
                            <button
                              type="button"
                              data-testid={`ayah-repeat-btn-${ayah.ayah_number}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setRepeatMode('ayah');
                                void playTrackAtAyah(
                                  activeSurah.surah_number,
                                  ayah.ayah_number,
                                  'ayah'
                                );
                              }}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium transition-colors cursor-pointer ${
                                repeatMode === 'ayah' && isThisAyahActive
                                  ? 'bg-[#087653] border-[#087653] text-white'
                                  : 'bg-white border-[#ebe6da] text-[#5a7066] hover:border-[#087653] hover:text-[#087653]'
                              }`}
                            >
                              <Repeat className="w-3 h-3" />
                              <span>{lang === 'bn' ? 'রিপিট' : 'Repeat'}</span>
                            </button>
                            <button
                              type="button"
                              data-testid={`ayah-words-btn-${ayah.ayah_number}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedWordsAyahs((prev) => ({
                                  ...prev,
                                  [key]: !prev[key],
                                }));
                              }}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium transition-colors cursor-pointer ${
                                expandedWordsAyahs[key]
                                  ? 'bg-[#eef5f0] border-[#087653] text-[#087653]'
                                  : 'bg-white border-[#ebe6da] text-[#5a7066] hover:border-[#087653]'
                              }`}
                            >
                              <BookOpen className="w-3 h-3" />
                              <span>{lang === 'bn' ? 'শব্দার্থ' : 'Word-by-Word'}</span>
                            </button>
                            <button
                              type="button"
                              data-testid={`ayah-tafsir-btn-${ayah.ayah_number}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                fetchAndOpenAyahModal(activeSurah, ayah.ayah_number, false, ayah);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-[#ebe6da] bg-white text-[11px] font-medium text-[#b58328] hover:border-[#b58328] hover:bg-[#faf7f0] transition-colors cursor-pointer"
                            >
                              <ScrollText className="w-3 h-3" />
                              <span>
                                {lang === 'bn'
                                  ? 'সংক্ষিপ্ত ও বিস্তারিত তাফসির'
                                  : 'Tafsir (Short & Full)'}
                              </span>
                            </button>
                            <button
                              type="button"
                              data-testid={`ayah-last-read-btn-${ayah.ayah_number}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                saveLastReadPosition(activeSurah, ayah.ayah_number);
                                setHighlightedAyah(ayah.ayah_number);
                              }}
                              aria-pressed={isThisAyahLastRead}
                              aria-label={
                                isThisAyahLastRead
                                  ? lang === 'bn'
                                    ? `আয়াত ${ayah.ayah_number} সর্বশেষ পাঠ হিসেবে সংরক্ষিত`
                                    : `Ayah ${ayah.ayah_number} saved as Last Read`
                                  : lang === 'bn'
                                  ? `আয়াত ${ayah.ayah_number} সর্বশেষ পাঠ হিসেবে সেভ করুন`
                                  : `Save Ayah ${ayah.ayah_number} as Last Read`
                              }
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold transition-colors cursor-pointer ${
                                isThisAyahLastRead
                                  ? 'bg-[#b58328] border-[#b58328] text-white'
                                  : 'bg-white border-[#ebe6da] text-[#5a7066] hover:border-[#b58328] hover:text-[#8a6017] hover:bg-[#faf7f0]'
                              }`}
                            >
                              <BookmarkCheck className="w-3 h-3" />
                              <span>
                                {isThisAyahLastRead
                                  ? lang === 'bn'
                                    ? 'সর্বশেষ পাঠ'
                                    : 'Last Read'
                                  : lang === 'bn'
                                  ? 'বুকমার্ক'
                                  : 'Save Last Read'}
                              </span>
                            </button>
                            <button
                              type="button"
                              data-testid={`ayah-image-btn-${ayah.ayah_number}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setVerseImageTarget({
                                  surahNumber: activeSurah.surah_number,
                                  ayahNumber: ayah.ayah_number,
                                  surahNameEn: activeSurah.name_en,
                                  surahNameBn: activeSurah.name_bn,
                                  surahNameAr: activeSurah.name_ar,
                                  totalAyahs: activeSurah.total_ayahs,
                                  initialArabic: ayah.arabic,
                                  initialTranslationEn: ayah.translation_en,
                                  initialTranslationBn: ayah.translation_bn,
                                });
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-[#ebe6da] bg-white text-[11px] font-medium text-[#8a6017] hover:border-[#b58328] hover:bg-[#faf7f0] transition-colors cursor-pointer"
                            >
                              <ImageIcon className="w-3 h-3" />
                              <span>{lang === 'bn' ? 'কার্ড বানান' : 'Verse Image'}</span>
                            </button>
                          </div>

                          {fullText && tafsirMode !== 'full' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAyahFullTafsir(activeSurah.surah_number, ayah.ayah_number);
                              }}
                              className="inline-flex items-center gap-1 text-xs font-medium text-[#087653] hover:text-[#064b37] cursor-pointer"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>
                                {isExpandedFull
                                  ? lang === 'bn'
                                    ? 'সংক্ষিপ্ত তাফসিরে ফিরুন'
                                    : 'Back to Short Tafsir'
                                  : lang === 'bn'
                                  ? 'বিস্তারিত তাফসির'
                                  : 'Full Tafsir'}
                              </span>
                              {isExpandedFull ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>

                        {(() => {
                          const cleanedAr = cleanAyahArabic(
                            ayah.arabic,
                            activeSurah.surah_number,
                            ayah.ayah_number
                          );
                          return (
                            <>
                              <p
                                dir="rtl"
                                className={`font-arabic ${arabicTextSizeClass} text-[#183027] text-right leading-loose`}
                              >
                                {tajweedColorEnabled
                                  ? segmentAyahForTajweed(cleanedAr).map((seg, segIdx) => (
                                      <span
                                        key={segIdx}
                                        className={
                                          seg.rule === 'ghunnah'
                                            ? 'text-[#059669]'
                                            : seg.rule === 'qalqalah'
                                            ? 'text-[#2563eb]'
                                            : seg.rule === 'madd'
                                            ? 'text-[#d97706]'
                                            : seg.rule === 'heavy'
                                            ? 'text-[#9333ea]'
                                            : ''
                                        }
                                      >
                                        {seg.text}
                                      </span>
                                    ))
                                  : cleanedAr}
                              </p>

                              {expandedWordsAyahs[key] && (
                                <div
                                  dir="rtl"
                                  className="mt-3 p-3 rounded-xl bg-[#faf7f0] border border-[#ebe6da] flex flex-wrap gap-2"
                                >
                                  {cleanedAr
                                    .split(/\s+/)
                                    .filter(Boolean)
                                    .map((word, wIdx) => {
                                      const dict = COMMON_QURAN_WORDS_DICT[word];
                                      const pronBn = transliterateWordToBangla(word);
                                      const pronEn = transliterateWordToEnglish(word);
                                      return (
                                        <div
                                          key={`${word}-${wIdx}`}
                                          dir="ltr"
                                          className="px-2.5 py-2 rounded-lg bg-white border border-[#ebe6da] text-center min-w-[72px]"
                                        >
                                          <p dir="rtl" className="font-arabic text-xl text-[#183027]">
                                            {word}
                                          </p>
                                          <p className="text-[11px] font-semibold text-[#8f6319] mt-0.5">
                                            {lang === 'bn' ? pronBn : pronEn}
                                          </p>
                                          {dict && (
                                            <p className="text-[10px] text-[#087653] mt-0.5">
                                              {lang === 'bn' ? dict.bn : dict.en}
                                            </p>
                                          )}
                                        </div>
                                      );
                                    })}
                                </div>
                              )}
                            </>
                          );
                        })()}
                        {showPronunciation && (() => {
                          const cleaned = cleanAyahArabic(
                            ayah.arabic,
                            activeSurah.surah_number,
                            ayah.ayah_number
                          );
                          const pron = getAyahPronunciation(
                            cleaned,
                            activeSurah.surah_number,
                            ayah.ayah_number,
                            ayah.transliteration_bn,
                            ayah.transliteration_en
                          );
                          return (
                            <p
                              data-testid={`ayah-pronunciation-${ayah.ayah_number}`}
                              className="text-sm text-[#8f6319] mt-3 leading-relaxed"
                            >
                              <span className="font-semibold">
                                {lang === 'bn' ? 'উচ্চারণ:' : 'Pronunciation:'}
                              </span>{' '}
                              {lang === 'bn' ? pron.bn : pron.en}
                            </p>
                          );
                        })()}
                        <p className="text-base text-[#183027] mt-3 font-medium">
                          {lang === 'bn' ? ayah.translation_bn : ayah.translation_en}
                        </p>
                        <p className="text-xs text-[#5a7066] mt-1.5">
                          {lang === 'bn' ? ayah.translation_en : ayah.translation_bn}
                        </p>

                        {showShortPanel && (
                          <div className="mt-4 rounded-xl bg-[#f7faf8] border border-[#dce7e0] p-4">
                            <p className="text-xs font-semibold text-[#087653] mb-1.5">
                              {lang === 'bn'
                                ? 'সংক্ষিপ্ত তাফসির (আল-মুখতাসার)'
                                : 'Short Tafsir (Al-Mukhtasar)'}
                            </p>
                            <p className="text-sm text-[#2d453b] leading-relaxed whitespace-pre-line">
                              {shortText}
                            </p>
                          </div>
                        )}

                        {showFullPanel && (
                          <div className="mt-4 rounded-xl bg-[#eef5f0]/75 border border-[#087653]/25 p-4">
                            <p className="text-xs font-semibold text-[#064b37] mb-1.5">
                              {lang === 'bn'
                                ? 'বিস্তারিত তাফসির (তাফসীরে ইবনে কাসীর)'
                                : 'Detailed Tafsir (Tafsir Ibn Kathir)'}
                            </p>
                            <p className="text-sm text-[#183027] leading-relaxed whitespace-pre-line">
                              {fullText}
                            </p>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-[#5a7066]">
                  {lang === 'bn' ? 'আয়াত পাওয়া যায়নি।' : 'No verses found for this Surah.'}
                </div>
              )}

              {/* Bottom Pagination Bar for Long Surahs */}
              {surahAyahs.length > PAGE_SIZE && !showAllAyahs && (
                <div className="pt-5 border-t border-[#eef5f0] flex items-center justify-between text-xs">
                  <button
                    type="button"
                    disabled={ayahPage <= 1}
                    onClick={() => {
                      setAyahPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 120, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-[#dce7e0] bg-white disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'পূর্ববর্তী পৃষ্ঠা' : 'Previous Page'}</span>
                  </button>
                  <span className="font-mono-tabular text-[#5a7066]">
                    {lang === 'bn'
                      ? `পৃষ্ঠা ${ayahPage} / ${totalPages}`
                      : `Page ${ayahPage} of ${totalPages}`}
                  </span>
                  <button
                    type="button"
                    disabled={ayahPage >= totalPages}
                    onClick={() => {
                      setAyahPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 120, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-[#dce7e0] bg-white disabled:opacity-40 cursor-pointer"
                  >
                    <span>{lang === 'bn' ? 'পরবর্তী পৃষ্ঠা' : 'Next Page'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </section>
      </div>

      <QuranTafsirModal
        modal={tafsirModal}
        lang={lang}
        loading={modalLoading}
        error={modalError}
        surahAyahs={modalSurahAyahs}
        activeAyah={modalActiveAyah}
        onClose={closeTafsirModal}
        onRetry={() => {
          if (!tafsirModal) return;
          if (tafsirModal.mode === 'surah') {
            fetchAndOpenSurahModal(tafsirModal.surah);
          } else if (tafsirModal.ayahNumber) {
            fetchAndOpenAyahModal(
              tafsirModal.surah,
              tafsirModal.ayahNumber,
              tafsirModal.returnToSurah
            );
          }
        }}
        onSelectAyah={(ayahNumber, fromSurahModal) => {
          if (!tafsirModal) return;
          const fallback = modalSurahAyahs.find((a) => a.ayah_number === ayahNumber);
          fetchAndOpenAyahModal(
            tafsirModal.surah,
            ayahNumber,
            fromSurahModal ?? tafsirModal.returnToSurah,
            fallback
          );
        }}
        onBackToSurah={() => {
          if (!tafsirModal) return;
          fetchAndOpenSurahModal(tafsirModal.surah);
        }}
        playingAyahNumber={
          tafsirModal && isAudioPlaying && audioSurahNumber === tafsirModal.surah.surah_number
            ? audioAyahNumber
            : null
        }
        loadingAudioAyahNumber={
          tafsirModal && isAudioLoading && audioSurahNumber === tafsirModal.surah.surah_number
            ? audioAyahNumber
            : null
        }
        onPlayAyah={(sNum, aNum) => handleTogglePlayAyah(sNum, aNum)}
      />

      <VerseImageModal
        open={Boolean(verseImageTarget)}
        lang={lang}
        target={verseImageTarget}
        onClose={() => setVerseImageTarget(null)}
      />
    </div>
  );
}
