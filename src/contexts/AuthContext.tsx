import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Timestamp,
} from 'firebase/firestore';
import {
  OperationType,
  auth,
  db,
  googleAuthProvider,
  handleFirestoreError,
} from '../lib/firebase';
import type { Language, LastReadBookmark } from '../types/islamic';

export interface CloudUserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  preferredLang: Language;
  cityId?: string;
  lastReadSurah?: number;
  lastReadAyah?: number;
  lastReadNameEn?: string;
  lastReadNameBn?: string;
  lastReadNameAr?: string;
}

export interface StudyNoteRecord {
  id: string;
  uid: string;
  title: string;
  content: string;
  surahRef?: string;
  category: 'quran' | 'tafsir' | 'hadith' | 'dua' | 'reflection';
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface ChatThreadRecord {
  id: string;
  uid: string;
  title: string;
  model: 'gemini-4-hydrogen' | 'gemini-3.1-flash-lite';
  personaId: string;
  messageCount: number;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface ChatMessageRecord {
  id: string;
  uid: string;
  threadId: string;
  role: 'user' | 'model';
  text: string;
  model: string;
  createdAt?: Timestamp | null;
}

export interface AudioTranscriptRecord {
  id: string;
  uid: string;
  title: string;
  transcript: string;
  languageHint: string;
  mimeType: string;
  createdAt?: Timestamp | null;
}

interface AuthContextValue {
  user: User | null;
  authReady: boolean;
  authBusy: boolean;
  authError: string | null;
  profile: CloudUserProfile | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  getMemoryIdToken: () => Promise<string | null>;
  syncPreferences: (lang: Language, cityId: string) => Promise<void>;
  syncLastReadBookmark: (bookmark: LastReadBookmark) => Promise<void>;
  savePrayerLog: (dateKey: string, prayedIds: string[], tasbihTotal: number) => Promise<void>;
  subscribePrayerLog: (
    dateKey: string,
    onUpdate: (prayedIds: string[], tasbihTotal: number) => void
  ) => () => void;
  subscribeStudyNotes: (onUpdate: (notes: StudyNoteRecord[]) => void) => () => void;
  createStudyNote: (input: {
    title: string;
    content: string;
    surahRef?: string;
    category: StudyNoteRecord['category'];
  }) => Promise<void>;
  updateStudyNote: (
    noteId: string,
    input: {
      title: string;
      content: string;
      surahRef?: string;
      category: StudyNoteRecord['category'];
    }
  ) => Promise<void>;
  deleteStudyNote: (noteId: string) => Promise<void>;
  subscribeChatThreads: (onUpdate: (threads: ChatThreadRecord[]) => void) => () => void;
  createChatThread: (input: {
    title: string;
    model: ChatThreadRecord['model'];
    personaId: string;
  }) => Promise<string>;
  subscribeChatMessages: (
    threadId: string,
    onUpdate: (messages: ChatMessageRecord[]) => void
  ) => () => void;
  appendChatExchange: (input: {
    threadId: string;
    model: ChatThreadRecord['model'];
    personaId: string;
    userText: string;
    modelText: string;
    nextMessageCount: number;
  }) => Promise<void>;
  deleteChatThread: (threadId: string) => Promise<void>;
  subscribeAudioTranscripts: (onUpdate: (items: AudioTranscriptRecord[]) => void) => () => void;
  saveAudioTranscript: (input: {
    title: string;
    transcript: string;
    languageHint: string;
    mimeType: string;
  }) => Promise<void>;
  deleteAudioTranscript: (transcriptId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function makeValidDocId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/[^a-zA-Z0-9_-]/g, '')
      : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${rand}`.slice(0, 120);
}

function clampStr(val: string | undefined | null, maxLen: number): string {
  return (val ?? '').trim().slice(0, maxLen);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [profile, setProfile] = useState<CloudUserProfile | null>(null);
  const idTokenRef = useRef<string | null>(null);

  const ensureUserDocuments = useCallback(async (firebaseUser: User) => {
    const uid = firebaseUser.uid;
    const profilePath = `users/${uid}`;
    const privatePath = `users/${uid}/private/info`;

    const profileRef = doc(db, 'users', uid);
    const displayName = clampStr(firebaseUser.displayName || 'Islamic Life Member', 120);
    const photoURL = clampStr(firebaseUser.photoURL || '', 500);

    try {
      const snap = await getDoc(profileRef);
      if (!snap.exists()) {
        await setDoc(profileRef, {
          uid,
          displayName,
          photoURL,
          preferredLang: 'bn',
          cityId: 'dhaka',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(profileRef, {
          displayName,
          photoURL,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, profilePath);
    }

    if (firebaseUser.email) {
      const privateRef = doc(db, 'users', uid, 'private', 'info');
      const email = clampStr(firebaseUser.email, 254);
      try {
        const pSnap = await getDoc(privateRef);
        if (!pSnap.exists()) {
          await setDoc(privateRef, {
            uid,
            email,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await updateDoc(privateRef, {
            email,
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, privatePath);
      }
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        try {
          idTokenRef.current = await nextUser.getIdToken();
          if (nextUser.emailVerified) {
            await ensureUserDocuments(nextUser);
          }
        } catch (err) {
          console.error('Auth initialization warning:', err);
        }
      } else {
        idTokenRef.current = null;
        setProfile(null);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, [ensureUserDocuments]);

  // Listen to user's non-PII profile document only when authReady & verified
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) {
      setProfile(null);
      return;
    }
    const path = `users/${user.uid}`;
    const ref = doc(db, 'users', user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as CloudUserProfile);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, path);
      }
    );
    return () => unsub();
  }, [authReady, user]);

  const signInWithGoogle = useCallback(async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      idTokenRef.current = await result.user.getIdToken();
      if (result.user.emailVerified) {
        await ensureUserDocuments(result.user);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
      setAuthError(msg);
    } finally {
      setAuthBusy(false);
    }
  }, [ensureUserDocuments]);

  const signOutUser = useCallback(async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await signOut(auth);
      idTokenRef.current = null;
      setProfile(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-out failed.';
      setAuthError(msg);
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const getMemoryIdToken = useCallback(async () => {
    if (!auth.currentUser) return null;
    const token = await auth.currentUser.getIdToken();
    idTokenRef.current = token;
    return token;
  }, []);

  const syncPreferences = useCallback(
    async (lang: Language, cityId: string) => {
      if (!authReady || !user || !user.emailVerified) return;
      const path = `users/${user.uid}`;
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          displayName: clampStr(user.displayName || 'Islamic Life Member', 120),
          photoURL: clampStr(user.photoURL || '', 500),
          preferredLang: lang,
          cityId: clampStr(cityId, 64),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [authReady, user]
  );

  const syncLastReadBookmark = useCallback(
    async (bookmark: LastReadBookmark) => {
      if (!authReady || !user || !user.emailVerified) return;
      const path = `users/${user.uid}`;
      const surah = Math.max(1, Math.min(114, Math.trunc(bookmark.surahNumber)));
      const ayah = Math.max(1, Math.min(300, Math.trunc(bookmark.ayah)));
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          lastReadSurah: surah,
          lastReadAyah: ayah,
          lastReadNameEn: clampStr(bookmark.nameEn, 100),
          lastReadNameBn: clampStr(bookmark.nameBn, 100),
          lastReadNameAr: clampStr(bookmark.nameAr || '', 100),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [authReady, user]
  );

  const savePrayerLog = useCallback(
    async (dateKey: string, prayedIds: string[], tasbihTotal: number) => {
      if (!authReady || !user || !user.emailVerified) return;
      if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dateKey)) return;
      const allowedPrayers = new Set(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']);
      const sanitizedPrayers = Array.from(
        new Set(prayedIds.filter((id) => allowedPrayers.has(id)))
      ).slice(0, 10);
      const safeTasbih = Math.max(0, Math.min(1000000, Math.trunc(tasbihTotal)));
      const path = `users/${user.uid}/prayerLogs/${dateKey}`;
      const ref = doc(db, 'users', user.uid, 'prayerLogs', dateKey);

      try {
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, {
            uid: user.uid,
            dateKey,
            prayedIds: sanitizedPrayers,
            tasbihTotal: safeTasbih,
            updatedAt: serverTimestamp(),
          });
        } else {
          await updateDoc(ref, {
            prayedIds: sanitizedPrayers,
            tasbihTotal: safeTasbih,
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    },
    [authReady, user]
  );

  const subscribePrayerLog = useCallback(
    (dateKey: string, onUpdate: (prayedIds: string[], tasbihTotal: number) => void) => {
      if (!authReady || !user || !user.emailVerified) return () => {};
      if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dateKey)) return () => {};
      const path = `users/${user.uid}/prayerLogs/${dateKey}`;
      return onSnapshot(
        doc(db, 'users', user.uid, 'prayerLogs', dateKey),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as { prayedIds?: string[]; tasbihTotal?: number };
            onUpdate(
              Array.isArray(data.prayedIds) ? data.prayedIds : [],
              typeof data.tasbihTotal === 'number' ? data.tasbihTotal : 0
            );
          }
        },
        (err) => {
          handleFirestoreError(err, OperationType.GET, path);
        }
      );
    },
    [authReady, user]
  );

  const subscribeStudyNotes = useCallback(
    (onUpdate: (notes: StudyNoteRecord[]) => void) => {
      if (!authReady || !user || !user.emailVerified) {
        onUpdate([]);
        return () => {};
      }
      const path = `users/${user.uid}/studyNotes`;
      const q = query(
        collection(db, 'users', user.uid, 'studyNotes'),
        where('uid', '==', user.uid),
        orderBy('updatedAt', 'desc'),
        limit(50)
      );
      return onSnapshot(
        q,
        (snap) => {
          const rows = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<StudyNoteRecord, 'id'>),
          }));
          onUpdate(rows);
        },
        (err) => {
          handleFirestoreError(err, OperationType.LIST, path);
        }
      );
    },
    [authReady, user]
  );

  const createStudyNote = useCallback(
    async (input: {
      title: string;
      content: string;
      surahRef?: string;
      category: StudyNoteRecord['category'];
    }) => {
      if (!user || !user.emailVerified) throw new Error('Sign in required');
      const noteId = makeValidDocId('note');
      const path = `users/${user.uid}/studyNotes/${noteId}`;
      const title = clampStr(input.title, 180);
      const content = clampStr(input.content, 6000);
      const surahRef = clampStr(input.surahRef, 40);
      if (!title || !content) throw new Error('Title and note content are required.');

      try {
        await setDoc(doc(db, 'users', user.uid, 'studyNotes', noteId), {
          uid: user.uid,
          title,
          content,
          surahRef,
          category: input.category,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    [user]
  );

  const updateStudyNote = useCallback(
    async (
      noteId: string,
      input: {
        title: string;
        content: string;
        surahRef?: string;
        category: StudyNoteRecord['category'];
      }
    ) => {
      if (!user || !user.emailVerified) throw new Error('Sign in required');
      const path = `users/${user.uid}/studyNotes/${noteId}`;
      const title = clampStr(input.title, 180);
      const content = clampStr(input.content, 6000);
      const surahRef = clampStr(input.surahRef, 40);
      if (!title || !content) throw new Error('Title and note content are required.');

      try {
        await updateDoc(doc(db, 'users', user.uid, 'studyNotes', noteId), {
          title,
          content,
          surahRef,
          category: input.category,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [user]
  );

  const deleteStudyNote = useCallback(
    async (noteId: string) => {
      if (!user || !user.emailVerified) throw new Error('Sign in required');
      const path = `users/${user.uid}/studyNotes/${noteId}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'studyNotes', noteId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    },
    [user]
  );

  const subscribeChatThreads = useCallback(
    (onUpdate: (threads: ChatThreadRecord[]) => void) => {
      if (!authReady || !user || !user.emailVerified) {
        onUpdate([]);
        return () => {};
      }
      const path = `users/${user.uid}/chatThreads`;
      const q = query(
        collection(db, 'users', user.uid, 'chatThreads'),
        where('uid', '==', user.uid),
        orderBy('updatedAt', 'desc'),
        limit(30)
      );
      return onSnapshot(
        q,
        (snap) => {
          onUpdate(
            snap.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<ChatThreadRecord, 'id'>),
            }))
          );
        },
        (err) => {
          handleFirestoreError(err, OperationType.LIST, path);
        }
      );
    },
    [authReady, user]
  );

  const createChatThread = useCallback(
    async (input: {
      title: string;
      model: ChatThreadRecord['model'];
      personaId: string;
    }) => {
      if (!user || !user.emailVerified) throw new Error('Sign in required');
      const threadId = makeValidDocId('thr');
      const path = `users/${user.uid}/chatThreads/${threadId}`;
      const title = clampStr(input.title, 140) || 'Islamic Reflection';
      const personaId = clampStr(input.personaId, 40) || 'islamic-scholar';

      try {
        await setDoc(doc(db, 'users', user.uid, 'chatThreads', threadId), {
          uid: user.uid,
          title,
          model: input.model,
          personaId,
          messageCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return threadId;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    [user]
  );

  const subscribeChatMessages = useCallback(
    (threadId: string, onUpdate: (messages: ChatMessageRecord[]) => void) => {
      if (!authReady || !user || !user.emailVerified || !threadId) {
        onUpdate([]);
        return () => {};
      }
      const path = `users/${user.uid}/chatThreads/${threadId}/messages`;
      const q = query(
        collection(db, 'users', user.uid, 'chatThreads', threadId, 'messages'),
        where('uid', '==', user.uid),
        orderBy('createdAt', 'asc'),
        limit(100)
      );
      return onSnapshot(
        q,
        (snap) => {
          onUpdate(
            snap.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<ChatMessageRecord, 'id'>),
            }))
          );
        },
        (err) => {
          handleFirestoreError(err, OperationType.LIST, path);
        }
      );
    },
    [authReady, user]
  );

  const appendChatExchange = useCallback(
    async (input: {
      threadId: string;
      model: ChatThreadRecord['model'];
      personaId: string;
      userText: string;
      modelText: string;
      nextMessageCount: number;
    }) => {
      if (!user || !user.emailVerified) return;
      const path = `users/${user.uid}/chatThreads/${input.threadId}/messages`;
      const uMsgId = makeValidDocId('msg_u');
      const mMsgId = makeValidDocId('msg_m');
      const safeUserText = clampStr(input.userText, 16000);
      const safeModelText = clampStr(input.modelText, 16000);
      if (!safeUserText || !safeModelText) return;

      try {
        const threadRef = doc(db, 'users', user.uid, 'chatThreads', input.threadId);
        const batch = writeBatch(db);
        batch.set(doc(db, 'users', user.uid, 'chatThreads', input.threadId, 'messages', uMsgId), {
          uid: user.uid,
          threadId: input.threadId,
          role: 'user',
          text: safeUserText,
          model: input.model,
          createdAt: serverTimestamp(),
        });
        batch.set(doc(db, 'users', user.uid, 'chatThreads', input.threadId, 'messages', mMsgId), {
          uid: user.uid,
          threadId: input.threadId,
          role: 'model',
          text: safeModelText,
          model: input.model,
          createdAt: serverTimestamp(),
        });
        batch.update(threadRef, {
          messageCount: Math.max(0, Math.min(1000, Math.trunc(input.nextMessageCount))),
          updatedAt: serverTimestamp(),
        });
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    },
    [user]
  );

  const deleteChatThread = useCallback(
    async (threadId: string) => {
      if (!user || !user.emailVerified) throw new Error('Sign in required');
      const path = `users/${user.uid}/chatThreads/${threadId}`;
      try {
        const msgsSnap = await getDocs(
          query(
            collection(db, 'users', user.uid, 'chatThreads', threadId, 'messages'),
            where('uid', '==', user.uid),
            limit(100)
          )
        );
        const batch = writeBatch(db);
        for (const m of msgsSnap.docs) {
          batch.delete(m.ref);
        }
        batch.delete(doc(db, 'users', user.uid, 'chatThreads', threadId));
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    },
    [user]
  );

  const subscribeAudioTranscripts = useCallback(
    (onUpdate: (items: AudioTranscriptRecord[]) => void) => {
      if (!authReady || !user || !user.emailVerified) {
        onUpdate([]);
        return () => {};
      }
      const path = `users/${user.uid}/audioTranscripts`;
      const q = query(
        collection(db, 'users', user.uid, 'audioTranscripts'),
        where('uid', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(30)
      );
      return onSnapshot(
        q,
        (snap) => {
          onUpdate(
            snap.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<AudioTranscriptRecord, 'id'>),
            }))
          );
        },
        (err) => {
          handleFirestoreError(err, OperationType.LIST, path);
        }
      );
    },
    [authReady, user]
  );

  const saveAudioTranscript = useCallback(
    async (input: {
      title: string;
      transcript: string;
      languageHint: string;
      mimeType: string;
    }) => {
      if (!user || !user.emailVerified) throw new Error('Sign in required');
      const transcriptId = makeValidDocId('tr');
      const path = `users/${user.uid}/audioTranscripts/${transcriptId}`;
      const title = clampStr(input.title, 180) || 'Audio Transcript';
      const transcript = clampStr(input.transcript, 16000);
      const languageHint = clampStr(input.languageHint, 20) || 'auto';
      const mimeType = clampStr(input.mimeType, 60) || 'audio/webm';
      if (!transcript) throw new Error('Transcript text is empty.');

      try {
        await setDoc(doc(db, 'users', user.uid, 'audioTranscripts', transcriptId), {
          uid: user.uid,
          title,
          transcript,
          languageHint,
          mimeType,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    [user]
  );

  const deleteAudioTranscript = useCallback(
    async (transcriptId: string) => {
      if (!user || !user.emailVerified) throw new Error('Sign in required');
      const path = `users/${user.uid}/audioTranscripts/${transcriptId}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'audioTranscripts', transcriptId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        authReady,
        authBusy,
        authError,
        profile,
        signInWithGoogle,
        signOutUser,
        getMemoryIdToken,
        syncPreferences,
        syncLastReadBookmark,
        savePrayerLog,
        subscribePrayerLog,
        subscribeStudyNotes,
        createStudyNote,
        updateStudyNote,
        deleteStudyNote,
        subscribeChatThreads,
        createChatThread,
        subscribeChatMessages,
        appendChatExchange,
        deleteChatThread,
        subscribeAudioTranscripts,
        saveAudioTranscript,
        deleteAudioTranscript,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
