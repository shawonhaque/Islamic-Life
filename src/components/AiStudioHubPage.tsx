import { useEffect, useRef, useState } from 'react';
import {
  BookMarked,
  BookOpen,
  Check,
  Copy,
  Download,
  Edit3,
  FileAudio,
  Film,
  GraduationCap,
  Languages,
  LogIn,
  MessageSquare,
  Mic,
  Music,
  Plus,
  RotateCcw,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
  Square,
  Trash2,
  Upload,
  UserCheck,
} from 'lucide-react';
import {
  useAuth,
  type AudioTranscriptRecord,
  type ChatMessageRecord,
  type ChatThreadRecord,
  type StudyNoteRecord,
} from '../contexts/AuthContext';
import type { Language } from '../types/islamic';
import {
  API_UNAVAILABLE_MESSAGE_BN,
  ApiUnavailableError,
  postJson,
  safeReadJson,
} from '../utils/safeFetch';

interface AiStudioHubPageProps {
  lang: Language;
  prefillChatPrompt?: { text: string; key: number } | null;
  onOpenAcademy?: () => void;
  onOpenQuran?: () => void;
}

type StudioTab = 'chat' | 'transcribe' | 'notes' | 'media' | 'academy' | 'settings';
type ChatModelId = 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-2.5-flash-lite';
type ThinkingDepth = 'low' | 'medium' | 'high';

interface LocalChatMsg {
  id: string;
  role: 'user' | 'model';
  text: string;
  model: string;
}

interface LocalMediaItem {
  id: string;
  name: string;
  kind: 'audio' | 'video';
  url: string;
  sizeLabel: string;
}

const LOCAL_NOTES_KEY = 'il_local_notes_v1';
const LOCAL_TRANSCRIPTS_KEY = 'il_local_transcripts_v1';

const PERSONA_OPTIONS = [
  {
    id: 'islamic-scholar',
    bn: 'ইসলামিক জ্ঞান সহায়ক',
    en: 'Islamic Scholar Guide',
    desc_bn: 'কুরআন ও সহিহ সুন্নাহ ভিত্তিক মার্জিত দিকনির্দেশনা',
    desc_en: 'Balanced Quran & Sunnah study guidance',
  },
  {
    id: 'quran-tafsir',
    bn: 'কুরআন ও তাফসির টিউটর',
    en: 'Quran & Tafsir Tutor',
    desc_bn: 'সূরার প্রেক্ষাপট, আরবি শব্দার্থ ও ব্যাখ্যা',
    desc_en: 'Surah context, Arabic roots & commentary',
  },
  {
    id: 'deep-reasoner',
    bn: 'গভীর বিশ্লেষণ ও গবেষণা',
    en: 'Deep Analytical Researcher',
    desc_bn: 'ইসলামিক ইতিহাস, ফিকহ ও নৈতিকতার বিস্তারিত বিশ্লেষণ',
    desc_en: 'Structured deep reasoning across theology & history',
  },
  {
    id: 'daily-companion',
    bn: 'দৈনন্দিন আমল ও পরিকল্পনা',
    en: 'Daily Practice Companion',
    desc_bn: 'দ্রুত দোয়া, রমজান প্ল্যান ও যাকাত সহায়তা',
    desc_en: 'Quick daily duas, planning & practical reminders',
  },
  {
    id: 'arabic-tutor',
    bn: 'আরবি ভাষা ও মাখরাজ টিউটর',
    en: 'Arabic & Makhraj Tutor',
    desc_bn: 'হরফ, ১৭ মাখরাজ ও আরবিতে কথোপকথন অনুশীলন',
    desc_en: 'Practice Arabic letters, Makharij & spoken dialogues',
  },
];

function formatDuration(sec: number): string {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export function AiStudioHubPage({
  lang,
  prefillChatPrompt,
  onOpenAcademy,
  onOpenQuran,
}: AiStudioHubPageProps) {
  const {
    user,
    authBusy,
    signInWithGoogle,
    subscribeChatThreads,
    createChatThread,
    subscribeChatMessages,
    appendChatExchange,
    deleteChatThread,
    subscribeAudioTranscripts,
    saveAudioTranscript,
    deleteAudioTranscript,
    subscribeStudyNotes,
    createStudyNote,
    updateStudyNote,
    deleteStudyNote,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<StudioTab>('chat');
  const [aiStatusInfo, setAiStatusInfo] = useState<{ ok: boolean; geminiConfigured: boolean } | null>(
    null
  );

  // --- Multi-Turn Chat State ---
  const [threads, setThreads] = useState<ChatThreadRecord[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [threadSearch, setThreadSearch] = useState('');
  const [threadAliases, setThreadAliases] = useState<Record<string, string>>({});
  const [renamingThreadId, setRenamingThreadId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [voiceListening, setVoiceListening] = useState(false);

  const [cloudMessages, setCloudMessages] = useState<ChatMessageRecord[]>([]);
  const [localMessages, setLocalMessages] = useState<LocalChatMsg[]>([]);
  const [chatModel, setChatModel] = useState<ChatModelId>('gemini-2.5-flash');
  const [personaId, setPersonaId] = useState<string>('islamic-scholar');
  const [thinkingDepth, setThinkingDepth] = useState<ThinkingDepth>('medium');
  const [customInstruction, setCustomInstruction] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // --- Audio Transcription State ---
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioMime, setAudioMime] = useState<string>('audio/webm');
  const [audioLabel, setAudioLabel] = useState<string>('');
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [languageHint, setLanguageHint] = useState<'auto' | 'Bengali' | 'English' | 'Arabic'>('auto');
  const [transcribeLoading, setTranscribeLoading] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [savedTranscripts, setSavedTranscripts] = useState<AudioTranscriptRecord[]>([]);
  const [localTranscripts, setLocalTranscripts] = useState<AudioTranscriptRecord[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_TRANSCRIPTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);

  // --- Study Notes State (Firestore + Guest Local Fallback) ---
  const [notes, setNotes] = useState<StudyNoteRecord[]>([]);
  const [localNotes, setLocalNotes] = useState<StudyNoteRecord[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_NOTES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [noteSearch, setNoteSearch] = useState('');
  const [noteCatFilter, setNoteCatFilter] = useState<'all' | StudyNoteRecord['category']>('all');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteCategory, setNoteCategory] = useState<StudyNoteRecord['category']>('quran');
  const [noteSurahRef, setNoteSurahRef] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  // --- Creative Media Studio & Local Study Media Library ---
  const [mediaKind, setMediaKind] = useState<'music' | 'video'>('music');
  const [localMediaLibrary, setLocalMediaLibrary] = useState<LocalMediaItem[]>([]);
  const [musicPrompt, setMusicPrompt] = useState(
    'Peaceful acoustic oud and gentle ambient wind chimes for Fajr morning reflection'
  );
  const [musicModel, setMusicModel] = useState<'lyria-3-clip-preview' | 'lyria-3-pro-preview'>(
    'lyria-3-clip-preview'
  );
  const [musicLoading, setMusicLoading] = useState(false);
  const [musicResult, setMusicResult] = useState<{ audioDataUrl: string; lyrics: string } | null>(null);
  const [musicError, setMusicError] = useState<string | null>(null);

  const [videoPrompt, setVideoPrompt] = useState(
    'Gentle golden sunlight filtering into an Islamic courtyard with a stone water fountain and swaying palm leaves'
  );
  const [videoAspect, setVideoAspect] = useState<'16:9' | '9:16'>('16:9');
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoResultUrl, setVideoResultUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Verify live AI JSON health on mount
  useEffect(() => {
    fetch('/api/ai/status')
      .then((res) => (res.ok ? safeReadJson<{ ok?: boolean; geminiConfigured?: boolean }>(res) : null))
      .then((data) => {
        if (data && typeof data.geminiConfigured === 'boolean') {
          setAiStatusInfo({ ok: Boolean(data.ok), geminiConfigured: data.geminiConfigured });
        }
      })
      .catch(() => {
        // leave null on offline
      });
  }, []);

  // Subscribe to Firestore collections when signed in
  useEffect(() => {
    const unsubThreads = subscribeChatThreads((rows) => {
      setThreads(rows);
    });
    const unsubTranscripts = subscribeAudioTranscripts((rows) => {
      setSavedTranscripts(rows);
    });
    const unsubNotes = subscribeStudyNotes((rows) => {
      setNotes(rows);
    });
    return () => {
      unsubThreads();
      unsubTranscripts();
      unsubNotes();
    };
  }, [subscribeChatThreads, subscribeAudioTranscripts, subscribeStudyNotes]);

  useEffect(() => {
    if (!user || !activeThreadId) {
      setCloudMessages([]);
      return;
    }
    return subscribeChatMessages(activeThreadId, (msgs) => {
      setCloudMessages(msgs);
    });
  }, [user, activeThreadId, subscribeChatMessages]);

  const displayedMessages: LocalChatMsg[] =
    user && activeThreadId
      ? cloudMessages.map((m) => ({ id: m.id, role: m.role, text: m.text, model: m.model }))
      : localMessages;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedMessages.length, chatLoading]);

  useEffect(() => {
    return () => {
      if (recordTimerRef.current) window.clearInterval(recordTimerRef.current);
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    };
  }, [audioPreviewUrl]);

  useEffect(() => {
    if (prefillChatPrompt?.text) {
      setActiveTab('chat');
      setPersonaId('arabic-tutor');
      setChatInput(prefillChatPrompt.text);
      setChatError(null);
    }
  }, [prefillChatPrompt]);

  const handlePersonaChange = (nextPersona: string) => {
    setPersonaId(nextPersona);
    if (nextPersona === 'deep-reasoner') {
      setChatModel('gemini-2.5-flash');
      setThinkingDepth('high');
    } else if (nextPersona === 'daily-companion') {
      setChatModel('gemini-2.5-flash-lite');
    } else {
      setChatModel('gemini-2.5-flash');
      setThinkingDepth('medium');
    }
  };

  const handleStartNewThread = () => {
    setActiveThreadId(null);
    setLocalMessages([]);
    setChatError(null);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    setChatError(null);
    setChatInput('');
    setChatLoading(true);

    const historySnapshot = displayedMessages.map((m) => ({
      role: m.role,
      text: m.text,
    }));

    // Optimistic local append when not inside a cloud thread yet
    const tempUserId = `u_${Date.now()}`;
    if (!user || !activeThreadId) {
      setLocalMessages((prev) => [
        ...prev,
        { id: tempUserId, role: 'user', text, model: chatModel },
      ]);
    }

    try {
      const data = await postJson<{ text?: string; error?: string }>(
        '/api/ai/chat',
        {
          model: chatModel,
          personaId,
          customSystemInstruction: customInstruction.trim(),
          thinkingDepth,
          history: historySnapshot,
          message: text,
        },
        'Chat request failed.'
      );
      const replyText = String(data.text || '').trim();
      if (!replyText) {
        throw new Error('Model returned an empty response.');
      }

      if (user && user.emailVerified) {
        let targetThreadId = activeThreadId;
        if (!targetThreadId) {
          targetThreadId = await createChatThread({
            title: text.slice(0, 80),
            model: chatModel,
            personaId,
          });
          setActiveThreadId(targetThreadId);
        }
        await appendChatExchange({
          threadId: targetThreadId,
          model: chatModel,
          personaId,
          userText: text,
          modelText: replyText,
          nextMessageCount: historySnapshot.length + 2,
        });
        setLocalMessages([]);
      } else {
        setLocalMessages((prev) => [
          ...prev,
          { id: `m_${Date.now()}`, role: 'model', text: replyText, model: chatModel },
        ]);
      }
    } catch (err) {
      if (err instanceof ApiUnavailableError) {
        setChatError(lang === 'bn' ? API_UNAVAILABLE_MESSAGE_BN : err.message);
      } else {
        setChatError(err instanceof Error ? err.message : 'Unable to complete chat request.');
      }
    } finally {
      setChatLoading(false);
    }
  };

  // --- Audio Recording & Upload Handlers ---
  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        const commaIdx = result.indexOf(',');
        resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
      };
      reader.onerror = () => reject(new Error('Failed to read audio file.'));
      reader.readAsDataURL(blob);
    });

  const startRecording = async () => {
    setTranscribeError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType: preferredMime });
      audioChunksRef.current = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (recordTimerRef.current) {
          window.clearInterval(recordTimerRef.current);
          recordTimerRef.current = null;
        }
        const rawMime = recorder.mimeType || 'audio/webm';
        const cleanMime = rawMime.split(';')[0];
        const blob = new Blob(audioChunksRef.current, { type: cleanMime });
        if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
        setAudioPreviewUrl(URL.createObjectURL(blob));
        setAudioMime(cleanMime);
        setAudioLabel(
          lang === 'bn'
            ? `মাইক্রোফোন রেকর্ডিং (${formatDuration(recordSeconds)})`
            : `Mic Recording (${formatDuration(recordSeconds)})`
        );
        const b64 = await blobToBase64(blob);
        setAudioBase64(b64);
      };

      setRecordSeconds(0);
      recorder.start();
      setIsRecording(true);
      recordTimerRef.current = window.setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      setTranscribeError(
        err instanceof Error
          ? err.message
          : lang === 'bn'
          ? 'মাইক্রোফোন অ্যাক্সেস পাওয়া যায়নি।'
          : 'Microphone permission denied or unavailable.'
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTranscribeError(null);
    if (file.size > 12 * 1024 * 1024) {
      setTranscribeError(
        lang === 'bn'
          ? 'অনুগ্রহ করে ১২ মেগাবাইটের কম আকারের অডিও ফাইল নির্বাচন করুন।'
          : 'Please select an audio file smaller than 12 MB.'
      );
      return;
    }
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioPreviewUrl(URL.createObjectURL(file));
    setAudioMime((file.type || 'audio/mp3').split(';')[0]);
    setAudioLabel(file.name);
    const b64 = await blobToBase64(file);
    setAudioBase64(b64);
  };

  const handleTranscribe = async () => {
    if (!audioBase64 || transcribeLoading) return;
    setTranscribeLoading(true);
    setTranscribeError(null);
    try {
      const res = await fetch('/api/ai/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType: audioMime,
          languageHint,
        }),
      });
      const data = await safeReadJson<{ transcript?: string; error?: string }>(
        res,
        'Audio transcription failed.'
      );
      const text = String(data.transcript || '').trim();
      setTranscriptText(text);
      if (text) {
        if (user && user.emailVerified) {
          await saveAudioTranscript({
            title: audioLabel || 'Voice Transcription',
            transcript: text,
            languageHint,
            mimeType: audioMime,
          });
        } else {
          const item: AudioTranscriptRecord = {
            id: `lt_${Date.now()}`,
            uid: 'guest',
            title: audioLabel || 'Voice Transcription',
            transcript: text,
            languageHint,
            mimeType: audioMime,
          };
          setLocalTranscripts((prev) => {
            const next = [item, ...prev].slice(0, 25);
            try {
              localStorage.setItem(LOCAL_TRANSCRIPTS_KEY, JSON.stringify(next));
            } catch {
              // ignore
            }
            return next;
          });
        }
      }
    } catch (err) {
      setTranscribeError(err instanceof Error ? err.message : 'Transcription error.');
    } finally {
      setTranscribeLoading(false);
    }
  };

  const handleSaveTranscriptToNotebook = async (textToSave: string, titlePrefix?: string) => {
    const cleanContent = textToSave.trim();
    if (!cleanContent) return;
    const title = titlePrefix || (lang === 'bn' ? 'অডিও ট্রান্সক্রিপ্ট নোট' : 'Audio Transcript Note');
    if (user && user.emailVerified) {
      await createStudyNote({
        title,
        content: cleanContent,
        category: 'reflection',
        surahRef: '',
      });
    } else {
      const nextNote: StudyNoteRecord = {
        id: `ln_${Date.now()}`,
        uid: 'guest',
        title,
        content: cleanContent,
        category: 'reflection',
        surahRef: '',
      };
      setLocalNotes((prev) => {
        const next = [nextNote, ...prev];
        try {
          localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    }
    setActiveTab('notes');
  };

  const handleVoiceToChat = () => {
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;

    if (!SpeechRec) {
      setChatError(
        lang === 'bn'
          ? 'এই ব্রাউজারে সরাসরি ভয়েস-টু-টেক্সট সমর্থিত নয় — অডিও ট্রান্সক্রিপশন ট্যাব ব্যবহার করুন।'
          : 'Browser SpeechRecognition unavailable — please use the Transcribe Audio tab.'
      );
      return;
    }

    try {
      const rec = new (SpeechRec as unknown as new () => {
        lang: string;
        interimResults: boolean;
        onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      })();
      rec.lang = lang === 'bn' ? 'bn-BD' : 'en-US';
      rec.interimResults = false;
      setVoiceListening(true);
      rec.onresult = (event) => {
        const spoken = event.results?.[0]?.[0]?.transcript || '';
        if (spoken) setChatInput((prev) => (prev ? `${prev} ${spoken}` : spoken));
      };
      rec.onerror = () => setVoiceListening(false);
      rec.onend = () => setVoiceListening(false);
      rec.start();
    } catch {
      setVoiceListening(false);
    }
  };

  // --- Study Notes Handlers (Firestore when signed in, LocalStorage fallback for Guests) ---
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setNoteError(null);
    setNoteSaving(true);
    try {
      if (user && user.emailVerified) {
        if (editingNoteId) {
          await updateStudyNote(editingNoteId, {
            title: noteTitle,
            content: noteContent,
            surahRef: noteSurahRef,
            category: noteCategory,
          });
        } else {
          await createStudyNote({
            title: noteTitle,
            content: noteContent,
            surahRef: noteSurahRef,
            category: noteCategory,
          });
        }
      } else {
        setLocalNotes((prev) => {
          const next = editingNoteId
            ? prev.map((n) =>
                n.id === editingNoteId
                  ? {
                      ...n,
                      title: noteTitle.trim(),
                      content: noteContent.trim(),
                      surahRef: noteSurahRef.trim(),
                      category: noteCategory,
                    }
                  : n
              )
            : [
                {
                  id: `ln_${Date.now()}`,
                  uid: 'guest',
                  title: noteTitle.trim(),
                  content: noteContent.trim(),
                  surahRef: noteSurahRef.trim(),
                  category: noteCategory,
                },
                ...prev,
              ];
          try {
            localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(next));
          } catch {
            // ignore
          }
          return next;
        });
      }
      setEditingNoteId(null);
      setNoteTitle('');
      setNoteSurahRef('');
      setNoteContent('');
    } catch (err) {
      setNoteError(err instanceof Error ? err.message : 'Failed to save study note.');
    } finally {
      setNoteSaving(false);
    }
  };

  const handleDeleteNoteUnified = async (id: string) => {
    if (user && user.emailVerified && !id.startsWith('ln_')) {
      await deleteStudyNote(id);
    } else {
      setLocalNotes((prev) => {
        const next = prev.filter((n) => n.id !== id);
        try {
          localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    }
  };

  // --- Media Studio Handlers ---
  const handleGenerateMusic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!musicPrompt.trim() || musicLoading) return;
    setMusicLoading(true);
    setMusicError(null);
    setMusicResult(null);
    try {
      const res = await fetch('/api/ai/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: musicPrompt.trim(),
          model: musicModel,
        }),
      });
      const data = await safeReadJson<{ audioDataUrl?: string; lyrics?: string; error?: string }>(
        res,
        'Music generation failed.'
      );
      setMusicResult({
        audioDataUrl: data.audioDataUrl || '',
        lyrics: data.lyrics || '',
      });
    } catch (err) {
      setMusicError(err instanceof Error ? err.message : 'Music generation request failed.');
    } finally {
      setMusicLoading(false);
    }
  };

  const handleGenerateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoPrompt.trim() || videoLoading) return;
    setVideoLoading(true);
    setVideoError(null);
    setVideoResultUrl(null);
    try {
      const res = await fetch('/api/ai/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt.trim(),
          aspectRatio: videoAspect,
          duration: '8s',
        }),
      });
      const data = await safeReadJson<{ videoDataUrl?: string; error?: string }>(
        res,
        'Video generation failed.'
      );
      setVideoResultUrl(data.videoDataUrl || null);
    } catch (err) {
      setVideoError(err instanceof Error ? err.message : 'Video generation request failed.');
    } finally {
      setVideoLoading(false);
    }
  };

  const tabs: Array<{ id: StudioTab; bn: string; en: string; icon: typeof Sparkles }> = [
    { id: 'chat', bn: 'এআই চ্যাটবট', en: 'AI Chat', icon: MessageSquare },
    { id: 'transcribe', bn: 'অডিও ট্রান্সক্রিপশন', en: 'Transcribe Audio', icon: Mic },
    { id: 'notes', bn: 'ক্লাউড নোটবুক', en: 'Cloud Notes', icon: BookMarked },
    { id: 'media', bn: 'মিডিয়া স্টুডিও', en: 'Media Studio', icon: Film },
    { id: 'academy', bn: 'আরবি ও কুরআন শিক্ষা', en: 'Arabic & Quran Academy', icon: GraduationCap },
    { id: 'settings', bn: 'মডেল ও পার্সোনা সেটিংস', en: 'Model & Persona', icon: SlidersHorizontal },
  ];

  const effectiveNotes = user && user.emailVerified ? notes : localNotes;
  const visibleNotes = effectiveNotes.filter((n) => {
    if (noteCatFilter !== 'all' && n.category !== noteCatFilter) return false;
    const q = noteSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      (n.surahRef || '').toLowerCase().includes(q)
    );
  });

  const effectiveTranscripts = user && user.emailVerified ? savedTranscripts : localTranscripts;
  const visibleThreads = threads.filter((t) => {
    const label = (threadAliases[t.id] || t.title).toLowerCase();
    return !threadSearch.trim() || label.includes(threadSearch.trim().toLowerCase());
  });

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header & Account Banner */}
      <div className="bg-white rounded-2xl border border-[#ebe6da] p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#8f6319] mb-1">
            <Sparkles className="w-4 h-4 text-[#b58328]" />
            <span>{lang === 'bn' ? 'এআই ও ক্লাউড স্টুডিও' : 'AI & Cloud Studio'}</span>
            {aiStatusInfo && (
              <span className="text-[11px] font-medium text-[#087653]">
                ·{' '}
                {aiStatusInfo.geminiConfigured
                  ? lang === 'bn'
                    ? 'ফ্রি-টিয়ার AI সংযুক্ত'
                    : 'Free-Tier AI Connected'
                  : lang === 'bn'
                  ? 'সার্ভার কী প্রয়োজন (Secrets)'
                  : 'Server Key Needed'}
              </span>
            )}
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1f2421]">
            {lang === 'bn'
              ? 'ইসলামিক গবেষণা, ভয়েস ট্রান্সক্রিপশন ও ক্লাউড নোটস'
              : 'Islamic AI Assistant, Audio Transcription & Cloud Notes'}
          </h1>
          <p className="text-sm text-[#6e7268] mt-1">
            {lang === 'bn'
              ? 'জেমিনি ৪ হাইড্রোজেন ও ৩.১ ফ্ল্যাশ লাইটে মাল্টি-টার্ন কথোপকথন এবং জেমিনি ৩.৫-এ অডিও থেকে টেক্সট।'
              : 'Multi-turn conversations with Gemini 4 Hydrogen & 3.1 Flash Lite, audio transcription, and study notes.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#eef5f0] border border-[#087653]/30 text-xs font-semibold text-[#087653]">
              <UserCheck className="w-4 h-4 shrink-0" />
              <span className="max-w-[160px] truncate">{user.displayName || user.email}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={authBusy}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#087653] hover:bg-[#065c40] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
            >
              <LogIn className="w-4 h-4" />
              <span>
                {lang === 'bn' ? 'গুগল দিয়ে ক্লাউড সিঙ্ক চালু করুন' : 'Sign in with Google'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-testid={`ai-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-colors cursor-pointer ${
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

      {/* TAB 1: Multi-Turn Gemini Chatbot */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Settings & Saved Threads */}
          <aside className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-[#ebe6da] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm font-bold text-[#1f2421]">
                  {lang === 'bn' ? 'মডেল ও পার্সোনা সেটিংস' : 'Model & Persona'}
                </h2>
                <button
                  type="button"
                  onClick={handleStartNewThread}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#faf7f0] border border-[#ebe6da] hover:border-[#b58328] text-xs font-semibold text-[#1f2421] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'নতুন চ্যাট' : 'New Chat'}</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#494e45] mb-1">
                  {lang === 'bn' ? 'সহায়ক পার্সোনা' : 'Assistant Persona'}
                </label>
                <select
                  value={personaId}
                  onChange={(e) => handlePersonaChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebe6da] bg-[#faf7f0] text-xs font-medium text-[#1f2421] focus:outline-none focus:border-[#087653]"
                >
                  {PERSONA_OPTIONS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {lang === 'bn' ? p.bn : p.en}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#6e7268] mt-1">
                  {lang === 'bn'
                    ? PERSONA_OPTIONS.find((p) => p.id === personaId)?.desc_bn
                    : PERSONA_OPTIONS.find((p) => p.id === personaId)?.desc_en}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[#494e45] mb-1">
                    {lang === 'bn' ? 'জেমিনি মডেল' : 'Gemini Model'}
                  </label>
                  <select
                    value={chatModel}
                    onChange={(e) => setChatModel(e.target.value as ChatModelId)}
                    className="w-full px-2.5 py-2 rounded-xl border border-[#ebe6da] bg-[#faf7f0] text-xs font-medium text-[#1f2421] focus:outline-none focus:border-[#087653]"
                  >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                    <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#494e45] mb-1">
                    {lang === 'bn' ? 'চিন্তন গভীরতা' : 'Thinking Depth'}
                  </label>
                  <select
                    value={thinkingDepth}
                    disabled={chatModel === 'gemini-2.5-flash-lite'}
                    onChange={(e) => setThinkingDepth(e.target.value as ThinkingDepth)}
                    className="w-full px-2.5 py-2 rounded-xl border border-[#ebe6da] bg-[#faf7f0] text-xs font-medium text-[#1f2421] focus:outline-none focus:border-[#087653] disabled:opacity-50"
                  >
                    <option value="low">{lang === 'bn' ? 'দ্রুত (Low)' : 'Fast (Low)'}</option>
                    <option value="medium">{lang === 'bn' ? 'সুষম (Medium)' : 'Balanced'}</option>
                    <option value="high">{lang === 'bn' ? 'গভীর (High)' : 'Deep (High)'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#494e45] mb-1">
                  {lang === 'bn' ? 'অতিরিক্ত নির্দেশনা (ঐচ্ছিক)' : 'Custom Guidance (Optional)'}
                </label>
                <textarea
                  rows={2}
                  value={customInstruction}
                  onChange={(e) => setCustomInstruction(e.target.value)}
                  placeholder={
                    lang === 'bn'
                      ? 'যেমন: বাংলায় সংক্ষিপ্ত উত্তর দিন ও আয়াত নম্বর উল্লেখ করুন...'
                      : 'e.g., Answer concisely with bullet points...'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#ebe6da] bg-[#faf7f0] text-xs text-[#1f2421] focus:outline-none focus:border-[#087653]"
                />
              </div>
            </div>

            {/* Cloud Conversation History with Search & Rename */}
            <div className="bg-white rounded-2xl border border-[#ebe6da] p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-sm font-bold text-[#1f2421]">
                  {lang === 'bn' ? 'সংরক্ষিত কথোপকথন' : 'Saved Conversations'}
                </h2>
              </div>
              {user && threads.length > 0 && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#8a8679] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={threadSearch}
                    onChange={(e) => setThreadSearch(e.target.value)}
                    placeholder={lang === 'bn' ? 'চ্যাট খুঁজুন...' : 'Search threads...'}
                    className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-[#ebe6da] bg-[#faf7f0] text-xs"
                  />
                </div>
              )}
              {!user ? (
                <p className="text-xs text-[#6e7268]">
                  {lang === 'bn'
                    ? 'চ্যাট হিস্ট্রি ক্লাউডে সংরক্ষণ করতে গুগল দিয়ে সাইন ইন করুন।'
                    : 'Sign in with Google to save and resume multi-turn conversations across sessions.'}
                </p>
              ) : visibleThreads.length === 0 ? (
                <p className="text-xs text-[#6e7268]">
                  {lang === 'bn'
                    ? 'কোনো সংরক্ষিত চ্যাট পাওয়া যায়নি।'
                    : 'No saved conversations found.'}
                </p>
              ) : (
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {visibleThreads.map((thr) => (
                    <div
                      key={thr.id}
                      className={`flex items-center justify-between gap-1.5 px-3 py-2 rounded-xl border text-xs ${
                        activeThreadId === thr.id
                          ? 'bg-[#f5efe0] border-[#b58328]/50 text-[#1f2421] font-semibold'
                          : 'bg-[#faf7f0] border-[#ebe6da] text-[#494e45]'
                      }`}
                    >
                      {renamingThreadId === thr.id ? (
                        <input
                          type="text"
                          value={renameDraft}
                          autoFocus
                          onChange={(e) => setRenameDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (renameDraft.trim()) {
                                setThreadAliases((prev) => ({
                                  ...prev,
                                  [thr.id]: renameDraft.trim(),
                                }));
                              }
                              setRenamingThreadId(null);
                            }
                          }}
                          onBlur={() => {
                            if (renameDraft.trim()) {
                              setThreadAliases((prev) => ({
                                ...prev,
                                [thr.id]: renameDraft.trim(),
                              }));
                            }
                            setRenamingThreadId(null);
                          }}
                          className="flex-1 px-1.5 py-0.5 rounded border border-[#087653] bg-white text-xs"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveThreadId(thr.id)}
                          className="flex-1 text-left truncate cursor-pointer"
                        >
                          {threadAliases[thr.id] || thr.title}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setRenamingThreadId(thr.id);
                          setRenameDraft(threadAliases[thr.id] || thr.title);
                        }}
                        aria-label="Rename thread"
                        className="p-1 text-[#8a8679] hover:text-[#087653] cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (activeThreadId === thr.id) setActiveThreadId(null);
                          void deleteChatThread(thr.id);
                        }}
                        aria-label="Delete thread"
                        className="p-1 text-[#8a8679] hover:text-[#991b1b] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* Right Scrollable Message Thread */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-[#ebe6da] flex flex-col h-[580px]">
            <div className="px-5 py-3.5 border-b border-[#ebe6da] flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#1f2421] truncate">
                  {lang === 'bn'
                    ? PERSONA_OPTIONS.find((p) => p.id === personaId)?.bn
                    : PERSONA_OPTIONS.find((p) => p.id === personaId)?.en}
                </p>
                <p className="text-[11px] font-mono-tabular text-[#6e7268]">
                  {chatModel} {chatModel !== 'gemini-2.5-flash-lite' ? `· thinking: ${thinkingDepth}` : ''}
                </p>
              </div>
              {displayedMessages.length > 0 && (
                <button
                  type="button"
                  onClick={handleStartNewThread}
                  className="text-xs font-semibold text-[#8f6319] hover:underline cursor-pointer"
                >
                  {lang === 'bn' ? 'পরিষ্কার করুন' : 'Clear'}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {displayedMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#f5efe0] text-[#b58328] flex items-center justify-center">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-[#1f2421]">
                    {lang === 'bn'
                      ? 'কুরআন, হাদিস, নামাজ বা দৈনন্দিন ইসলামিক বিষয়ে প্রশ্ন করুন'
                      : 'Ask a question about Quran, Tafsir, Hadith, or daily practice'}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {(lang === 'bn'
                      ? [
                          'সূরা আল-আসর এর সংক্ষিপ্ত তাফসির বলো',
                          'সকাল-সন্ধ্যার ৩টি মাসনুন দোয়া দাও',
                          'খুশু-খুযুসহ নামাজ পড়ার উপায় কী?',
                        ]
                      : [
                          'Summarize the themes of Surah Al-Asr',
                          'Share 3 authentic morning & evening duas',
                          'How can I improve focus (khushu) in prayer?',
                        ]
                    ).map((sample) => (
                      <button
                        key={sample}
                        type="button"
                        onClick={() => setChatInput(sample)}
                        className="px-3 py-1.5 rounded-xl bg-[#faf7f0] border border-[#ebe6da] hover:border-[#b58328] text-xs text-[#494e45] cursor-pointer"
                      >
                        {sample}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                displayedMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap relative group ${
                        msg.role === 'user'
                          ? 'bg-[#087653] text-white'
                          : 'bg-[#faf7f0] border border-[#ebe6da] text-[#1f2421]'
                      }`}
                    >
                      {msg.text}
                      {msg.role === 'model' && (
                        <div className="mt-2 pt-1.5 border-t border-[#ebe6da] flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              void navigator.clipboard.writeText(msg.text);
                              setCopiedMsgId(msg.id);
                              setTimeout(() => setCopiedMsgId(null), 1500);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5a7066] hover:text-[#087653] cursor-pointer"
                          >
                            {copiedMsgId === msg.id ? (
                              <Check className="w-3 h-3 text-[#087653]" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{copiedMsgId === msg.id ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied') : lang === 'bn' ? 'কপি' : 'Copy'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {chatLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-4 py-3 bg-[#faf7f0] border border-[#ebe6da] text-xs text-[#6e7268]">
                    {lang === 'bn' ? 'উত্তর তৈরি হচ্ছে...' : 'Thinking...'}
                  </div>
                </div>
              )}

              {chatError && (
                <div className="rounded-xl bg-[#fef2f2] border border-[#fecaca] px-4 py-3 text-xs text-[#991b1b]">
                  {chatError}
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            <form
              onSubmit={handleSendMessage}
              className="p-3 sm:p-4 border-t border-[#ebe6da] flex items-center gap-2"
            >
              <button
                type="button"
                onClick={handleVoiceToChat}
                aria-label={lang === 'bn' ? 'ভয়েস ইনপুট' : 'Voice input'}
                className={`p-2.5 rounded-xl border transition-colors cursor-pointer shrink-0 ${
                  voiceListening
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-[#faf7f0] border-[#ebe6da] text-[#087653] hover:border-[#087653]'
                }`}
              >
                <Mic className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={
                  lang === 'bn'
                    ? 'আপনার প্রশ্ন লিখুন...'
                    : 'Type your message...'
                }
                className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-[#ebe6da] bg-[#faf7f0] text-sm text-[#1f2421] focus:outline-none focus:border-[#087653]"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#087653] hover:bg-[#065c40] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{lang === 'bn' ? 'পাঠান' : 'Send'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: Audio Transcription (gemini-2.5-flash) */}
      {activeTab === 'transcribe' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#ebe6da] p-5 space-y-5">
            <div>
              <h2 className="font-display text-lg font-bold text-[#1f2421]">
                {lang === 'bn'
                  ? 'ভয়েস রেকর্ডিং ও অডিও ট্রান্সক্রিপশন'
                  : 'Voice Recording & Audio Transcription'}
              </h2>
              <p className="text-xs text-[#6e7268] mt-0.5">
                {lang === 'bn'
                  ? 'মাইক্রোফোনে রেকর্ড করুন অথবা অডিও ফাইল আপলোড করে সরাসরি টেক্সটে রূপান্তর করুন (gemini-2.5-flash)।'
                  : 'Record directly with your microphone or upload an audio clip to transcribe with Gemini 2.5 Flash.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#087653] hover:bg-[#065c40] text-white text-xs font-semibold cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'রেকর্ডিং শুরু করুন' : 'Start Mic Recording'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#991b1b] text-white text-xs font-semibold cursor-pointer"
                >
                  <Square className="w-4 h-4" />
                  <span>
                    {lang === 'bn'
                      ? `থামুন (${formatDuration(recordSeconds)})`
                      : `Stop (${formatDuration(recordSeconds)})`}
                  </span>
                </button>
              )}

              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#faf7f0] border border-[#ebe6da] hover:border-[#b58328] text-xs font-semibold text-[#1f2421] cursor-pointer">
                <Upload className="w-4 h-4 text-[#b58328]" />
                <span>{lang === 'bn' ? 'অডিও আপলোড (.mp3/.wav/.webm)' : 'Upload Audio'}</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioFileUpload}
                  className="hidden"
                />
              </label>

              <select
                value={languageHint}
                onChange={(e) =>
                  setLanguageHint(e.target.value as 'auto' | 'Bengali' | 'English' | 'Arabic')
                }
                aria-label="Language focus"
                className="px-3 py-2.5 rounded-xl border border-[#ebe6da] bg-[#faf7f0] text-xs font-medium text-[#1f2421]"
              >
                <option value="auto">{lang === 'bn' ? 'ভাষা: স্বয়ংক্রিয়' : 'Language: Auto'}</option>
                <option value="Bengali">বাংলা (Bengali)</option>
                <option value="English">English</option>
                <option value="Arabic">العربية (Arabic)</option>
              </select>
            </div>

            {audioPreviewUrl && (
              <div className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#1f2421]">
                  <span className="inline-flex items-center gap-2 truncate">
                    <FileAudio className="w-4 h-4 text-[#087653] shrink-0" />
                    <span className="truncate">{audioLabel}</span>
                  </span>
                  <span className="font-mono-tabular text-[#6e7268]">{audioMime}</span>
                </div>
                <audio controls src={audioPreviewUrl} className="w-full" />
                <button
                  type="button"
                  onClick={handleTranscribe}
                  disabled={transcribeLoading || !audioBase64}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#087653] hover:bg-[#065c40] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {transcribeLoading
                    ? lang === 'bn'
                      ? 'ট্রান্সক্রাইব করা হচ্ছে...'
                      : 'Transcribing audio...'
                    : lang === 'bn'
                    ? 'টেক্সটে রূপান্তর করুন'
                    : 'Transcribe Audio'}
                </button>
              </div>
            )}

            {transcribeError && (
              <div className="rounded-xl bg-[#fef2f2] border border-[#fecaca] px-4 py-3 text-xs text-[#991b1b]">
                {transcribeError}
              </div>
            )}

            {transcriptText && (
              <div className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#1f2421]">
                    {lang === 'bn' ? 'ট্রান্সক্রিপ্ট ফলাফল' : 'Transcript Result'}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(transcriptText);
                        setCopiedTranscript(true);
                        setTimeout(() => setCopiedTranscript(false), 1800);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#ebe6da] text-xs font-semibold text-[#494e45] cursor-pointer"
                    >
                      {copiedTranscript ? (
                        <Check className="w-3.5 h-3.5 text-[#087653]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{lang === 'bn' ? 'কপি' : 'Copy'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const blob = new Blob([transcriptText], { type: 'text/plain;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `transcript-${new Date().toISOString().slice(0, 10)}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#ebe6da] text-xs font-semibold text-[#1f2421] cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>.txt</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSaveTranscriptToNotebook(transcriptText, audioLabel)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#f5efe0] border border-[#b58328]/40 text-xs font-semibold text-[#8f6319] cursor-pointer"
                    >
                      <BookMarked className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'নোটবুকে সেভ' : 'Save Note'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setChatInput(transcriptText);
                        setActiveTab('chat');
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#087653] text-white text-xs font-semibold cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'চ্যাটে নিন' : 'Ask in Chat'}</span>
                    </button>
                  </div>
                </div>
                <p className="text-sm text-[#1f2421] whitespace-pre-wrap leading-relaxed">
                  {transcriptText}
                </p>
              </div>
            )}
          </div>

          {/* Saved Transcripts History (Cloud or Local fallback) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#ebe6da] p-5 space-y-3">
            <h3 className="font-display text-sm font-bold text-[#1f2421]">
              {lang === 'bn' ? 'সংরক্ষিত ট্রান্সক্রিপ্ট' : 'Saved Transcripts'} ({effectiveTranscripts.length})
            </h3>
            {effectiveTranscripts.length === 0 ? (
              <p className="text-xs text-[#6e7268]">
                {lang === 'bn'
                  ? 'এখনও কোনো ট্রান্সক্রিপ্ট নেই — অডিও রূপান্তর করলে এখানে সংরক্ষিত হবে।'
                  : 'No transcripts yet — transcribe audio to archive it automatically.'}
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {effectiveTranscripts.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-[#1f2421] truncate">{item.title}</p>
                      <button
                        type="button"
                        onClick={() => {
                          if (user && user.emailVerified && !item.id.startsWith('lt_')) {
                            void deleteAudioTranscript(item.id);
                          } else {
                            setLocalTranscripts((prev) => {
                              const next = prev.filter((x) => x.id !== item.id);
                              try {
                                localStorage.setItem(LOCAL_TRANSCRIPTS_KEY, JSON.stringify(next));
                              } catch {
                                // ignore
                              }
                              return next;
                            });
                          }
                        }}
                        aria-label="Delete transcript"
                        className="p-1 text-[#8a8679] hover:text-[#991b1b] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-[#494e45] line-clamp-3 whitespace-pre-wrap">
                      {item.transcript}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Cloud & Local Study Notes */}
      {activeTab === 'notes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#ebe6da] p-5 space-y-4">
            {!user && (
              <div className="rounded-xl bg-[#eef5f0] border border-[#087653]/25 p-3 flex items-center justify-between gap-2">
                <p className="text-[11px] text-[#087653] font-medium">
                  {lang === 'bn'
                    ? 'গেস্ট মোডে ব্রাউজারে সেভ হচ্ছে। ক্লাউড সিঙ্কের জন্য সাইন ইন করুন।'
                    : 'Saving locally on this device. Sign in to sync with Firestore.'}
                </p>
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  className="px-2.5 py-1.5 rounded-lg bg-[#087653] text-white text-[11px] font-semibold shrink-0 cursor-pointer"
                >
                  {lang === 'bn' ? 'সাইন ইন' : 'Sign In'}
                </button>
              </div>
            )}

            <form onSubmit={handleSaveNote} className="space-y-3.5">
              <h2 className="font-display text-base font-bold text-[#1f2421]">
                {editingNoteId
                  ? lang === 'bn'
                    ? 'নোট সম্পাদনা করুন'
                    : 'Edit Study Note'
                  : lang === 'bn'
                  ? 'নতুন স্টাডি নোট লিখুন'
                  : 'New Study Note'}
              </h2>

              <div>
                <label className="block text-xs font-semibold text-[#494e45] mb-1">
                  {lang === 'bn' ? 'শিরোনাম' : 'Title'}
                </label>
                <input
                  type="text"
                  required
                  maxLength={180}
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder={
                    lang === 'bn' ? 'যেমন: সূরা মূলক তাফসির নোট' : 'e.g., Reflection on Surah Al-Mulk'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#ebe6da] bg-[#faf7f0] text-sm text-[#1f2421]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[#494e45] mb-1">
                    {lang === 'bn' ? 'বিভাগ' : 'Category'}
                  </label>
                  <select
                    value={noteCategory}
                    onChange={(e) =>
                      setNoteCategory(e.target.value as StudyNoteRecord['category'])
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#ebe6da] bg-[#faf7f0] text-xs font-medium text-[#1f2421]"
                  >
                    <option value="quran">{lang === 'bn' ? 'কুরআন' : 'Quran'}</option>
                    <option value="tafsir">{lang === 'bn' ? 'তাফসির' : 'Tafsir'}</option>
                    <option value="hadith">{lang === 'bn' ? 'হাদিস' : 'Hadith'}</option>
                    <option value="dua">{lang === 'bn' ? 'দোয়া' : 'Dua'}</option>
                    <option value="reflection">{lang === 'bn' ? 'ভাবনা' : 'Reflection'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#494e45] mb-1">
                    {lang === 'bn' ? 'সূত্র (ঐচ্ছিক)' : 'Reference (Optional)'}
                  </label>
                  <input
                    type="text"
                    maxLength={40}
                    value={noteSurahRef}
                    onChange={(e) => setNoteSurahRef(e.target.value)}
                    placeholder="e.g. 2:255"
                    className="w-full px-3 py-2 rounded-xl border border-[#ebe6da] bg-[#faf7f0] text-xs text-[#1f2421]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#494e45] mb-1">
                  {lang === 'bn' ? 'নোটের বিবরণ' : 'Content'}
                </label>
                <textarea
                  required
                  rows={5}
                  maxLength={6000}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder={
                    lang === 'bn'
                      ? 'আপনার মূল শিক্ষা বা ব্যাখ্যা লিখে রাখুন...'
                      : 'Write your takeaways and reflection...'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#ebe6da] bg-[#faf7f0] text-sm text-[#1f2421]"
                />
              </div>

              {noteError && (
                <p className="text-xs text-[#991b1b] bg-[#fef2f2] px-3 py-2 rounded-lg">
                  {noteError}
                </p>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={noteSaving}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#087653] hover:bg-[#065c40] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {noteSaving
                    ? lang === 'bn'
                      ? 'সংরক্ষণ হচ্ছে...'
                      : 'Saving...'
                    : editingNoteId
                    ? lang === 'bn'
                      ? 'আপডেট করুন'
                      : 'Update Note'
                    : user
                    ? lang === 'bn'
                      ? 'ক্লাউডে সংরক্ষণ করুন'
                      : 'Save to Cloud'
                    : lang === 'bn'
                    ? 'ব্রাউজারে সংরক্ষণ করুন'
                    : 'Save Note Locally'}
                </button>
                {editingNoteId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingNoteId(null);
                      setNoteTitle('');
                      setNoteSurahRef('');
                      setNoteContent('');
                    }}
                    className="px-3 py-2.5 rounded-xl border border-[#ebe6da] text-xs font-semibold text-[#494e45] cursor-pointer"
                  >
                    {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#ebe6da] p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-base font-bold text-[#1f2421]">
                {lang === 'bn' ? 'সংরক্ষিত স্টাডি নোটসমূহ' : 'Saved Study Notes'} ({visibleNotes.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                <input
                  type="search"
                  value={noteSearch}
                  onChange={(e) => setNoteSearch(e.target.value)}
                  placeholder={lang === 'bn' ? 'নোট খুঁজুন...' : 'Search notes...'}
                  className="px-3 py-1.5 rounded-lg border border-[#ebe6da] bg-[#faf7f0] text-xs"
                />
                <select
                  value={noteCatFilter}
                  onChange={(e) =>
                    setNoteCatFilter(e.target.value as 'all' | StudyNoteRecord['category'])
                  }
                  className="px-2.5 py-1.5 rounded-lg border border-[#ebe6da] bg-[#faf7f0] text-xs"
                >
                  <option value="all">{lang === 'bn' ? 'সব বিভাগ' : 'All Categories'}</option>
                  <option value="quran">{lang === 'bn' ? 'কুরআন' : 'Quran'}</option>
                  <option value="tafsir">{lang === 'bn' ? 'তাফসির' : 'Tafsir'}</option>
                  <option value="hadith">{lang === 'bn' ? 'হাদিস' : 'Hadith'}</option>
                  <option value="dua">{lang === 'bn' ? 'দোয়া' : 'Dua'}</option>
                  <option value="reflection">{lang === 'bn' ? 'ভাবনা' : 'Reflection'}</option>
                </select>
              </div>
            </div>
            {visibleNotes.length === 0 ? (
              <p className="text-xs text-[#6e7268]">
                {lang === 'bn'
                  ? 'এখনও কোনো নোট পাওয়া যায়নি।'
                  : 'No study notes found.'}
              </p>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {visibleNotes.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-[#1f2421]">{n.title}</p>
                        <p className="text-[11px] font-mono-tabular text-[#8f6319]">
                          {n.category.toUpperCase()} {n.surahRef ? `· ${n.surahRef}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNoteId(n.id);
                            setNoteTitle(n.title);
                            setNoteCategory(n.category);
                            setNoteSurahRef(n.surahRef || '');
                            setNoteContent(n.content);
                          }}
                          aria-label="Edit note"
                          className="p-1.5 rounded-lg text-[#494e45] hover:bg-white cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteNoteUnified(n.id)}
                          aria-label="Delete note"
                          className="p-1.5 rounded-lg text-[#8a8679] hover:text-[#991b1b] hover:bg-white cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-[#3c413b] whitespace-pre-wrap leading-relaxed">
                      {n.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Media Studio (Local Study Library + Lyria Music & Omni Video) */}
      {activeTab === 'media' && (
        <div className="space-y-5">
          {/* Free Local Audio/Video Study Media Player */}
          <div className="bg-white rounded-2xl border border-[#ebe6da] p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-[#1f2421]">
                  {lang === 'bn'
                    ? 'ব্যক্তিগত অডিও ও ভিডিও লেকচার প্লেয়ার (ফ্রি)'
                    : 'Personal Study Audio & Video Library (Offline/Local)'}
                </h2>
                <p className="text-xs text-[#6e7268] mt-0.5">
                  {lang === 'bn'
                    ? 'আপনার ডিভাইস থেকে কুরআন তেলাওয়াত, দারস বা ইসলামিক লেকচার অডিও/ভিডিও ফাইল চালান ও পর্যালোচনা করুন।'
                    : 'Play and review local Quran recitations, Tajweed lessons, or lecture audio/video clips cleanly without billing.'}
                </p>
              </div>
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#087653] hover:bg-[#065c40] text-white text-xs font-semibold cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>{lang === 'bn' ? 'অডিও / ভিডিও যোগ করুন' : 'Add Audio / Video'}</span>
                <input
                  type="file"
                  accept="audio/*,video/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const kind = f.type.startsWith('video/') ? 'video' : 'audio';
                    const url = URL.createObjectURL(f);
                    const mb = (f.size / (1024 * 1024)).toFixed(2);
                    setLocalMediaLibrary((prev) => [
                      { id: `med_${Date.now()}`, name: f.name, kind, url, sizeLabel: `${mb} MB` },
                      ...prev,
                    ]);
                  }}
                />
              </label>
            </div>

            {localMediaLibrary.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {localMediaLibrary.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-[#1f2421] truncate">{item.name}</span>
                      <span className="font-mono-tabular text-[#6e7268] shrink-0">
                        {item.sizeLabel}
                      </span>
                    </div>
                    {item.kind === 'video' ? (
                      <video controls src={item.url} className="w-full max-h-56 rounded-lg" />
                    ) : (
                      <audio controls src={item.url} className="w-full" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#ebe6da] p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-[#1f2421]">
                  {lang === 'bn' ? 'AI অ্যাম্বিয়েন্ট মিউজিক ও ভিডিও ল্যাব' : 'AI Ambient Audio & Video Lab'}
                </h2>
              <p className="text-xs text-[#6e7268] mt-0.5">
                {lang === 'bn'
                  ? 'লিরিয়া ৩ (সঙ্গীত/অ্যাম্বিয়েন্ট) ও অমনি ১.২ ফ্ল্যাশ (১৬:৯ এবং ৯:১৬ ভিডিও) ব্যবহার করতে Settings > Secrets থেকে বিলিং-সক্রিয় কী প্রয়োজন।'
                  : 'Lyria 3 music generation and Gemini Omni 1.2 Flash video generation require a billing-enabled API key in Settings > Secrets.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMediaKind('music')}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                  mediaKind === 'music'
                    ? 'bg-[#087653] text-white border-[#087653]'
                    : 'bg-[#faf7f0] text-[#494e45] border-[#ebe6da]'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'লিরিয়া অডিও' : 'Lyria Music'}</span>
              </button>
              <button
                type="button"
                onClick={() => setMediaKind('video')}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                  mediaKind === 'video'
                    ? 'bg-[#087653] text-white border-[#087653]'
                    : 'bg-[#faf7f0] text-[#494e45] border-[#ebe6da]'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'অমনি ভিডিও' : 'Omni Video'}</span>
              </button>
            </div>
          </div>

          {mediaKind === 'music' ? (
            <form onSubmit={handleGenerateMusic} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-[#494e45] mb-1">
                    {lang === 'bn' ? 'অডিও বা নাশিদ সুরের বিবরণ' : 'Music Prompt'}
                  </label>
                  <input
                    type="text"
                    value={musicPrompt}
                    onChange={(e) => setMusicPrompt(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#ebe6da] bg-[#faf7f0] text-sm text-[#1f2421]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#494e45] mb-1">
                    {lang === 'bn' ? 'দৈর্ঘ্য / মডেল' : 'Track Model'}
                  </label>
                  <select
                    value={musicModel}
                    onChange={(e) =>
                      setMusicModel(
                        e.target.value as 'lyria-3-clip-preview' | 'lyria-3-pro-preview'
                      )
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-[#ebe6da] bg-[#faf7f0] text-xs font-medium text-[#1f2421]"
                  >
                    <option value="lyria-3-clip-preview">Lyria Clip (30s)</option>
                    <option value="lyria-3-pro-preview">Lyria Pro (Full)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={musicLoading || !musicPrompt.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#087653] hover:bg-[#065c40] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                <Music className="w-4 h-4" />
                <span>
                  {musicLoading
                    ? lang === 'bn'
                      ? 'তৈরি হচ্ছে...'
                      : 'Generating audio...'
                    : lang === 'bn'
                    ? 'অডিও তৈরি করুন'
                    : 'Generate Music'}
                </span>
              </button>

              {musicError && (
                <div className="rounded-xl bg-[#fef2f2] border border-[#fecaca] px-4 py-3 text-xs text-[#991b1b]">
                  {musicError}
                </div>
              )}

              {musicResult && (
                <div className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] p-4 space-y-3">
                  <audio controls src={musicResult.audioDataUrl} className="w-full" />
                  {musicResult.lyrics && (
                    <p className="text-xs text-[#494e45] whitespace-pre-wrap">{musicResult.lyrics}</p>
                  )}
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handleGenerateVideo} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-[#494e45] mb-1">
                    {lang === 'bn' ? 'দৃশ্যের বিবরণ (Text-to-Video)' : 'Video Scene Prompt'}
                  </label>
                  <input
                    type="text"
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#ebe6da] bg-[#faf7f0] text-sm text-[#1f2421]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#494e45] mb-1">
                    {lang === 'bn' ? 'অ্যাস্পেক্ট রেশিও' : 'Aspect Ratio'}
                  </label>
                  <select
                    value={videoAspect}
                    onChange={(e) => setVideoAspect(e.target.value as '16:9' | '9:16')}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#ebe6da] bg-[#faf7f0] text-xs font-medium text-[#1f2421]"
                  >
                    <option value="16:9">16:9 Landscape</option>
                    <option value="9:16">9:16 Portrait</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={videoLoading || !videoPrompt.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#087653] hover:bg-[#065c40] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                <Film className="w-4 h-4" />
                <span>
                  {videoLoading
                    ? lang === 'bn'
                      ? 'ভিডিও তৈরি হচ্ছে...'
                      : 'Generating video...'
                    : lang === 'bn'
                    ? 'ভিডিও তৈরি করুন'
                    : 'Generate Video'}
                </span>
              </button>

              {videoError && (
                <div className="rounded-xl bg-[#fef2f2] border border-[#fecaca] px-4 py-3 text-xs text-[#991b1b]">
                  {videoError}
                </div>
              )}

              {videoResultUrl && (
                <div className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] p-4">
                  <video controls src={videoResultUrl} className="w-full max-h-[420px] rounded-xl" />
                </div>
              )}
            </form>
          )}
          </div>
        </div>
      )}

      {/* TAB 5: Arabic & Quran Academy Quick Hub */}
      {activeTab === 'academy' && (
        <div className="bg-white rounded-2xl border border-[#ebe6da] p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-[#1f2421]">
                {lang === 'bn'
                  ? 'আরবি ও কুরআন শিক্ষা একাডেমি (হাব)'
                  : 'Arabic & Quran Academy Hub'}
              </h2>
              <p className="text-xs text-[#6e7268] mt-0.5">
                {lang === 'bn'
                  ? '২৯ হরফ, ১৭ মাখরাজ, সিফাতুল হুরুফ, তাজবিদ, কথোপকথন ও AI কেরাত শিক্ষক একসাথে।'
                  : 'Quick launch into all Arabic Alphabet, Makharij, Tajweed, Grammar, Writing, and AI Recitation tools.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {onOpenAcademy && (
                <button
                  type="button"
                  onClick={onOpenAcademy}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#087653] hover:bg-[#065c40] text-white text-xs font-semibold cursor-pointer"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'সম্পূর্ণ একাডেমি খুলুন' : 'Open Full Academy'}</span>
                </button>
              )}
              {onOpenQuran && (
                <button
                  type="button"
                  onClick={onOpenQuran}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#f5efe0] border border-[#b58328]/40 text-[#8f6319] text-xs font-semibold cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'পবিত্র কুরআন ও তাজবিদ' : 'Open Quran Reader'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {[
              {
                bn: '২৯ আরবি হরফ ও হরকত কুইজ',
                en: '29 Arabic Letters & Harakat Quiz',
                subBn: 'শুরু, মধ্য ও শেষের রূপ + ইন্টারেক্টিভ কুইজ',
                subEn: 'Positional forms + recognition quiz',
                icon: Languages,
              },
              {
                bn: '১৭ মাখরাজ, ডায়াগ্রাম ও সিফাত',
                en: '17 Makharij Diagram & Sifatul Huruf',
                subBn: 'অ্যানাটমিক্যাল উচ্চারণস্থল ও সিফাত',
                subEn: 'Vocal tract map & letter qualities',
                icon: Sparkles,
              },
              {
                bn: 'সম্পূর্ণ তাজবিদ ও AI কেরাত শিক্ষক',
                en: 'Complete Tajweed & AI Recitation Check',
                subBn: 'তেলাওয়াত রেকর্ড করে উচ্চারণ তুলনা করুন',
                subEn: 'Record recitation & get pronunciation tips',
                icon: Mic,
              },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => (onOpenAcademy ? onOpenAcademy() : setActiveTab('chat'))}
                  className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] hover:border-[#b58328] p-4 text-left flex items-start gap-3 cursor-pointer transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#087653]/10 text-[#087653] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1f2421]">{card[lang]}</p>
                    <p className="text-xs text-[#6e7268] mt-0.5">
                      {lang === 'bn' ? card.subBn : card.subEn}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 6: Model & Persona Settings Panel */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-[#ebe6da] p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-[#1f2421]">
                {lang === 'bn' ? 'মডেল, পার্সোনা ও সিস্টেম নির্দেশনা সেটিংস' : 'AI Model & Persona Settings'}
              </h2>
              <p className="text-xs text-[#6e7268] mt-0.5">
                {lang === 'bn'
                  ? 'চ্যাটবটের ডিফল্ট ফ্রি জেমিনি মডেল, চিন্তন গভীরতা এবং পার্সোনা কনফিগার করুন।'
                  : 'Configure default free-tier Gemini model, reasoning depth, assistant persona, and system instructions.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setChatModel('gemini-2.5-flash');
                setPersonaId('islamic-scholar');
                setThinkingDepth('medium');
                setCustomInstruction('');
                setLanguageHint('auto');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#ebe6da] hover:border-[#b58328] text-xs font-semibold text-[#494e45] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'ডিফল্টে রিসেট' : 'Reset Defaults'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block text-xs font-semibold text-[#494e45]">
              {lang === 'bn' ? 'চ্যাটবট পার্সোনা' : 'Assistant Persona'}
              <select
                value={personaId}
                onChange={(e) => handlePersonaChange(e.target.value)}
                className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-[#ebe6da] bg-[#faf7f0] text-xs font-medium text-[#1f2421]"
              >
                {PERSONA_OPTIONS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {lang === 'bn' ? p.bn : p.en}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-semibold text-[#494e45]">
              {lang === 'bn' ? 'ফ্রি-টিয়ার জেমিনি মডেল' : 'Free-Tier Gemini Model'}
              <select
                value={chatModel}
                onChange={(e) => setChatModel(e.target.value as ChatModelId)}
                className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-[#ebe6da] bg-[#faf7f0] text-xs font-medium text-[#1f2421]"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Reasoning)</option>
                <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (Fast)</option>
              </select>
            </label>

            <label className="block text-xs font-semibold text-[#494e45]">
              {lang === 'bn' ? 'চিন্তন গভীরতা (Thinking Depth)' : 'Thinking Depth'}
              <select
                value={thinkingDepth}
                disabled={chatModel === 'gemini-2.5-flash-lite'}
                onChange={(e) => setThinkingDepth(e.target.value as ThinkingDepth)}
                className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-[#ebe6da] bg-[#faf7f0] text-xs font-medium text-[#1f2421] disabled:opacity-50"
              >
                <option value="low">{lang === 'bn' ? 'দ্রুত (Low)' : 'Fast (Low)'}</option>
                <option value="medium">{lang === 'bn' ? 'সুষম (Medium)' : 'Balanced (Medium)'}</option>
                <option value="high">{lang === 'bn' ? 'গভীর (High)' : 'Deep (High)'}</option>
              </select>
            </label>
          </div>

          <label className="block text-xs font-semibold text-[#494e45]">
            {lang === 'bn' ? 'কাস্টম সিস্টেম নির্দেশনা (System Instruction)' : 'Custom System Guidance'}
            <textarea
              rows={3}
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder={
                lang === 'bn'
                  ? 'যেমন: প্রতিটি উত্তরে কুরআন-হাদিসের সূত্র সহ সংক্ষিপ্ত পয়েন্টে লিখুন...'
                  : 'e.g., Always include Surah:Ayah citations and concise bullet summaries...'
              }
              className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-[#ebe6da] bg-[#faf7f0] text-sm text-[#1f2421]"
            />
          </label>
        </div>
      )}
    </div>
  );
}
