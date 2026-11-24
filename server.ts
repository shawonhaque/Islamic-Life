import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { SEED_AYAHS, SEED_SURAHS } from './src/data/surahs114.ts';
import { resolvePersonaInstruction } from './src/data/aiPersonas.ts';
import { SEED_DUAS, SEED_HADITHS } from './src/data/islamicSeed.ts';
import { TAFSIR_EDITIONS } from './src/data/islamicModulesData.ts';
import type { Ayah, Dua, Hadith, Surah } from './src/types/islamic.ts';

interface AdminRecord {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
}

interface DatabaseSchema {
  admins: AdminRecord[];
  surahs: Surah[];
  ayahs: Ayah[];
  hadiths: Hadith[];
  duas: Dua[];
  nextIds: {
    ayah: number;
    hadith: number;
    dua: number;
  };
}

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const QURAN_DIR = path.join(DATA_DIR, 'quran');
const DB_PATH = path.join(DATA_DIR, 'islamic_life.json');
const SESSION_COOKIE = 'il_session';
// A predictable fallback would let anyone forge session cookies, so a missing
// secret is fatal in production and only tolerated for local development.
const SESSION_SECRET = (() => {
  const fromEnv = process.env.SESSION_SECRET?.trim();
  if (fromEnv && fromEnv.length >= 32) return fromEnv;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'SESSION_SECRET is required in production (minimum 32 characters). Generate one with: openssl rand -hex 32'
    );
  }
  console.warn(
    '[security] SESSION_SECRET missing or too short; using an ephemeral dev secret. Sessions will not survive a restart.'
  );
  return crypto.randomBytes(48).toString('hex');
})();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

/**
 * Builds the initial admin account from the environment. No default password
 * is baked in: a hardcoded one would be published with the source and would
 * let anyone sign in to the CMS on a deployed instance.
 */
function seedAdmins(): AdminRecord[] {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn(
      '[security] ADMIN_EMAIL / ADMIN_PASSWORD are not set, so no admin account was created. ' +
        'Set both to provision one, then restart the server.'
    );
    return [];
  }
  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters long.');
  }
  return [
    {
      id: 1,
      name: process.env.ADMIN_NAME?.trim() || 'Administrator',
      email,
      passwordHash: hashPassword(password),
    },
  ];
}

function createInitialDb(): DatabaseSchema {
  return {
    admins: seedAdmins(),
    surahs: SEED_SURAHS,
    ayahs: SEED_AYAHS,
    hadiths: SEED_HADITHS,
    duas: SEED_DUAS,
    nextIds: {
      ayah: Math.max(...SEED_AYAHS.map((a) => a.id), 0) + 1,
      hadith: Math.max(...SEED_HADITHS.map((h) => h.id), 0) + 1,
      dua: Math.max(...SEED_DUAS.map((d) => d.id), 0) + 1,
    },
  };
}

function loadDb(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const initial = createInitialDb();
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw) as DatabaseSchema;
    if (!Array.isArray(parsed.surahs) || parsed.surahs.length === 0) {
      return createInitialDb();
    }
    // Merge any newly introduced seed hadiths & duas not yet present in persisted JSON
    let mutated = false;
    const existingHadithIds = new Set(parsed.hadiths.map((h) => h.id));
    for (const sh of SEED_HADITHS) {
      if (!existingHadithIds.has(sh.id)) {
        parsed.hadiths.push(sh);
        mutated = true;
      }
    }
    const existingDuaMap = new Map(parsed.duas.map((d) => [d.title_en, d]));
    for (const sd of SEED_DUAS) {
      const existing = existingDuaMap.get(sd.title_en);
      if (!existing) {
        parsed.duas.push({
          ...sd,
          id: Math.max(...parsed.duas.map((x) => x.id), 0) + 1,
        });
        mutated = true;
      } else if (
        existing.pronunciation_bn !== sd.pronunciation_bn ||
        existing.pronunciation_en !== sd.pronunciation_en ||
        existing.meaning_bn !== sd.meaning_bn ||
        existing.arabic !== sd.arabic
      ) {
        existing.arabic = sd.arabic;
        existing.pronunciation_bn = sd.pronunciation_bn;
        existing.pronunciation_en = sd.pronunciation_en;
        existing.meaning_bn = sd.meaning_bn;
        existing.meaning_en = sd.meaning_en;
        mutated = true;
      }
    }
    if (mutated) {
      parsed.nextIds.hadith = Math.max(...parsed.hadiths.map((h) => h.id), 0) + 1;
      parsed.nextIds.dua = Math.max(...parsed.duas.map((d) => d.id), 0) + 1;
      fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), 'utf8');
    }
    return parsed;
  } catch {
    const fallback = createInitialDb();
    fs.writeFileSync(DB_PATH, JSON.stringify(fallback, null, 2), 'utf8');
    return fallback;
  }
}

let db = loadDb();

function saveDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

interface SessionPayload {
  uid: number;
  email: string;
  name: string;
  csrf: string;
  exp: number;
}

function signSession(payload: SessionPayload): string {
  const b64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(b64).digest('base64url');
  return `${b64}.${sig}`;
}

function verifySession(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [b64, sig] = parts;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(b64).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const decoded = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8')) as SessionPayload;
    if (!decoded.exp || Date.now() > decoded.exp) return null;
    return decoded;
  } catch {
    return null;
  }
}

function parseCookies(header: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!header) return result;
  for (const pair of header.split(';')) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const val = decodeURIComponent(pair.slice(idx + 1).trim());
    result[key] = val;
  }
  return result;
}

interface AuthedRequest extends Request {
  sessionUser?: SessionPayload;
}

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  const cookies = parseCookies(req.headers.cookie);
  const session = verifySession(cookies[SESSION_COOKIE]);
  if (!session) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const csrfHeader = req.headers['x-csrf-token'];
  if (req.method !== 'GET' && csrfHeader !== session.csrf) {
    res.status(403).json({ error: 'Invalid CSRF token' });
    return;
  }
  req.sessionUser = session;
  next();
}

function cleanText(val: unknown, maxLen = 4000): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  app.use(express.json({ limit: '20mb' }));
  app.use('/api', (err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof SyntaxError) {
      res.status(400).json({ error: 'Invalid JSON request payload.' });
      return;
    }
    next(err);
  });

  // Public content API
  // Cheap capability probe used by the client to detect a static host.
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'islamic-life' });
  });

  app.get('/api/content', (_req, res) => {
    res.json({
      surahs: db.surahs,
      ayahs: db.ayahs,
      hadiths: db.hadiths,
      duas: db.duas,
    });
  });

  function loadSurahAyahs(surahNumber: number): Ayah[] {
    let baseAyahs: Ayah[] = [];
    const surahFile = path.join(QURAN_DIR, `${surahNumber}.json`);
    if (fs.existsSync(surahFile)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(surahFile, 'utf8')) as { ayahs?: Ayah[] };
        if (Array.isArray(parsed.ayahs)) {
          baseAyahs = parsed.ayahs;
        }
      } catch {
        baseAyahs = [];
      }
    }

    const byNum = new Map<number, Ayah>();
    for (const a of baseAyahs) {
      byNum.set(a.ayah_number, a);
    }
    for (const custom of db.ayahs.filter((a) => a.surah_id === surahNumber)) {
      const existing = byNum.get(custom.ayah_number);
      byNum.set(custom.ayah_number, {
        ...existing,
        ...custom,
        short_tafsir_bn: custom.short_tafsir_bn || existing?.short_tafsir_bn || '',
        short_tafsir_en: custom.short_tafsir_en || existing?.short_tafsir_en || '',
        tafsir_bn: custom.tafsir_bn || existing?.tafsir_bn || '',
        tafsir_en: custom.tafsir_en || existing?.tafsir_en || '',
      });
    }

    return Array.from(byNum.values()).sort((a, b) => a.ayah_number - b.ayah_number);
  }

  // Complete Surah + Short Tafsir + Detailed Tafsir endpoint for all 114 Surahs
  app.get('/api/surahs/:surahNumber', (req, res) => {
    const surahNumber = Number(req.params.surahNumber);
    if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
      res.status(400).json({ error: 'Invalid surah number (1-114)' });
      return;
    }

    const merged = loadSurahAyahs(surahNumber);
    res.json({
      surah_number: surahNumber,
      total_ayahs: merged.length,
      ayahs: merged,
    });
  });

  // Individual Ayah + Short & Detailed Tafsir endpoint
  app.get('/api/surahs/:surahNumber/ayahs/:ayahNumber', (req, res) => {
    const surahNumber = Number(req.params.surahNumber);
    const ayahNumber = Number(req.params.ayahNumber);
    if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
      res.status(400).json({ error: 'Invalid surah number (1-114)' });
      return;
    }
    if (!Number.isInteger(ayahNumber) || ayahNumber < 1) {
      res.status(400).json({ error: 'Invalid ayah number' });
      return;
    }

    const ayahsForSurah = loadSurahAyahs(surahNumber);
    const ayah = ayahsForSurah.find((a) => a.ayah_number === ayahNumber);
    if (!ayah) {
      res.status(404).json({ error: 'Ayah not found' });
      return;
    }

    res.json({
      surah_number: surahNumber,
      total_ayahs: ayahsForSurah.length,
      ayah,
    });
  });

  const externalTafsirCache = new Map<string, string>();

  function stripHtmlTags(raw: string): string {
    return raw
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function buildFallbackCommentary(
    edition: (typeof TAFSIR_EDITIONS)[number],
    surahNumber: number,
    ayah: Ayah
  ): string {
    const arabicClean = ayah.arabic.replace(/^\uFEFF/, '');
    if (edition.language === 'ar') {
      return `﴿${arabicClean}﴾\n\n[${edition.name_ar} — ${edition.author_en}]\n${edition.methodology_en}\n\n${
        ayah.short_tafsir_en || ayah.translation_en
      }`;
    }
    if (edition.language === 'bn') {
      const coreBn = ayah.tafsir_bn || ayah.short_tafsir_bn || ayah.translation_bn;
      return `[${edition.name_bn} · ${edition.author_bn}]\n${edition.methodology_bn}\n\nসূরা ${surahNumber}, আয়াত ${ayah.ayah_number}-এর তাফসির:\n${coreBn}`;
    }
    const coreEn = ayah.tafsir_en || ayah.short_tafsir_en || ayah.translation_en;
    return `[${edition.name_en} · ${edition.author_en}]\n${edition.methodology_en}\n\nCommentary on ${surahNumber}:${ayah.ayah_number}:\n${coreEn}`;
  }

  // Multi-edition Tafsir reader endpoint (Arabic, Bangla, English)
  app.get('/api/tafsir/read', async (req, res) => {
    const editionId = cleanText(req.query.edition, 80) || 'bn-ibn-kathir';
    const surahNumber = Number(req.query.surah) || 1;
    const ayahNumber = Number(req.query.ayah) || 1;

    if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
      res.status(400).json({ error: 'Invalid surah number' });
      return;
    }

    const edition = TAFSIR_EDITIONS.find((e) => e.id === editionId) ?? TAFSIR_EDITIONS[0];
    const ayahsForSurah = loadSurahAyahs(surahNumber);
    const ayah = ayahsForSurah.find((a) => a.ayah_number === ayahNumber) ?? ayahsForSurah[0];
    if (!ayah) {
      res.status(404).json({ error: 'Ayah not found' });
      return;
    }

    let commentary = '';
    let sourceMode: 'live-api' | 'local-scholar' = 'local-scholar';

    if (edition.apiSlug) {
      const cacheKey = `${edition.apiSlug}:${surahNumber}:${ayah.ayah_number}`;
      const cached = externalTafsirCache.get(cacheKey);
      if (cached) {
        commentary = cached;
        sourceMode = 'live-api';
      } else {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3200);
          const upstream = await fetch(
            `https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir/${encodeURIComponent(
              edition.apiSlug
            )}/${surahNumber}/${ayah.ayah_number}.json`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);
          if (upstream.ok) {
            const payload = (await upstream.json()) as { text?: string };
            if (typeof payload?.text === 'string' && payload.text.trim().length > 10) {
              commentary = stripHtmlTags(payload.text);
              externalTafsirCache.set(cacheKey, commentary);
              sourceMode = 'live-api';
            }
          }
        } catch {
          // Graceful fallback to bundled scholar commentary below
        }
      }
    }

    if (!commentary) {
      commentary = buildFallbackCommentary(edition, surahNumber, ayah);
      sourceMode = 'local-scholar';
    }

    res.json({
      edition,
      surah_number: surahNumber,
      ayah_number: ayah.ayah_number,
      arabic: ayah.arabic.replace(/^\uFEFF/, ''),
      translation_bn: ayah.translation_bn,
      translation_en: ayah.translation_en,
      short_tafsir_bn: ayah.short_tafsir_bn,
      short_tafsir_en: ayah.short_tafsir_en,
      commentary,
      sourceMode,
    });
  });

  function normalizeArabicForSearch(text: string): string {
    return text
      .replace(/^\uFEFF/, '')
      .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .toLowerCase();
  }

  interface IndexedAyah {
    surah_number: number;
    surah_name_bn: string;
    surah_name_en: string;
    surah_name_ar: string;
    ayah_number: number;
    arabic: string;
    arabicNorm: string;
    translation_bn: string;
    translation_en: string;
    short_tafsir_bn: string;
    short_tafsir_en: string;
    searchBlobLower: string;
  }

  let cachedQuranIndex: IndexedAyah[] | null = null;

  function getQuranSearchIndex(): IndexedAyah[] {
    if (cachedQuranIndex) return cachedQuranIndex;
    const surahMap = new Map<number, Surah>(db.surahs.map((s) => [s.surah_number, s]));
    const indexed: IndexedAyah[] = [];
    for (let sNum = 1; sNum <= 114; sNum++) {
      const meta = surahMap.get(sNum);
      const ayahsList = loadSurahAyahs(sNum);
      for (const a of ayahsList) {
        const arabicClean = a.arabic.replace(/^\uFEFF/, '');
        const arabicNorm = normalizeArabicForSearch(arabicClean);
        const sBn = meta?.name_bn || '';
        const sEn = meta?.name_en || '';
        const shortBn = a.short_tafsir_bn || '';
        const shortEn = a.short_tafsir_en || '';
        indexed.push({
          surah_number: sNum,
          surah_name_bn: sBn,
          surah_name_en: sEn,
          surah_name_ar: meta?.name_ar || '',
          ayah_number: a.ayah_number,
          arabic: arabicClean,
          arabicNorm,
          translation_bn: a.translation_bn || '',
          translation_en: a.translation_en || '',
          short_tafsir_bn: shortBn,
          short_tafsir_en: shortEn,
          searchBlobLower: `${sNum}:${a.ayah_number} ${sBn} ${sEn} ${a.translation_bn} ${a.translation_en} ${shortBn} ${shortEn}`.toLowerCase(),
        });
      }
    }
    cachedQuranIndex = indexed;
    return indexed;
  }

  // Global search across all Quran verses (114 Surahs), Hadiths, and Duas
  app.get('/api/search', (req, res) => {
    const rawQuery = cleanText(req.query.q, 200);
    const scopeParam = cleanText(req.query.scope, 20);
    const scope: 'all' | 'quran' | 'hadith' | 'dua' =
      scopeParam === 'quran' || scopeParam === 'hadith' || scopeParam === 'dua' ? scopeParam : 'all';
    const rawLimit = Number(req.query.limit);
    const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 80) : 30;

    if (!rawQuery) {
      res.json({
        query: '',
        scope,
        counts: { all: 0, quran: 0, hadith: 0, dua: 0 },
        surahMatches: [],
        quranResults: [],
        hadithResults: [],
        duaResults: [],
      });
      return;
    }

    const qLower = rawQuery.toLowerCase();
    const qArabicNorm = normalizeArabicForSearch(rawQuery);
    const refMatch = rawQuery.match(/^(\d{1,3})\s*[:\-]\s*(\d{1,3})$/);

    const surahMatches = db.surahs
      .filter((s) => {
        if (String(s.surah_number) === rawQuery) return true;
        return (
          s.name_en.toLowerCase().includes(qLower) ||
          s.name_bn.toLowerCase().includes(qLower) ||
          normalizeArabicForSearch(s.name_ar).includes(qArabicNorm) ||
          s.meaning_en.toLowerCase().includes(qLower) ||
          s.meaning_bn.toLowerCase().includes(qLower)
        );
      })
      .slice(0, 12);

    const quranIndex = getQuranSearchIndex();
    const matchedQuran: IndexedAyah[] = [];
    for (const item of quranIndex) {
      if (refMatch) {
        if (item.surah_number === Number(refMatch[1]) && item.ayah_number === Number(refMatch[2])) {
          matchedQuran.push(item);
        }
        continue;
      }
      if (
        item.searchBlobLower.includes(qLower) ||
        (qArabicNorm.length >= 2 && item.arabicNorm.includes(qArabicNorm))
      ) {
        matchedQuran.push(item);
      }
    }

    const matchedHadiths = db.hadiths.filter((h) => {
      const text = `${h.title_bn} ${h.title_en} ${h.translation_bn} ${h.translation_en} ${h.source} ${h.hadith_number} ${h.category}`.toLowerCase();
      return (
        text.includes(qLower) ||
        (qArabicNorm.length >= 2 && normalizeArabicForSearch(h.arabic || '').includes(qArabicNorm))
      );
    });

    const matchedDuas = db.duas.filter((d) => {
      const text = `${d.title_bn} ${d.title_en} ${d.pronunciation_bn} ${d.pronunciation_en} ${d.meaning_bn} ${d.meaning_en} ${d.reference} ${d.category}`.toLowerCase();
      return (
        text.includes(qLower) ||
        (qArabicNorm.length >= 2 && normalizeArabicForSearch(d.arabic || '').includes(qArabicNorm))
      );
    });

    const quranCount = matchedQuran.length;
    const hadithCount = matchedHadiths.length;
    const duaCount = matchedDuas.length;

    const quranSlice =
      scope === 'hadith' || scope === 'dua'
        ? []
        : matchedQuran.slice(0, scope === 'quran' ? limit : Math.min(limit, 25)).map((item) => ({
            surah_number: item.surah_number,
            surah_name_bn: item.surah_name_bn,
            surah_name_en: item.surah_name_en,
            surah_name_ar: item.surah_name_ar,
            ayah_number: item.ayah_number,
            arabic: item.arabic,
            translation_bn: item.translation_bn,
            translation_en: item.translation_en,
            short_tafsir_bn: item.short_tafsir_bn,
            short_tafsir_en: item.short_tafsir_en,
          }));

    res.json({
      query: rawQuery,
      scope,
      counts: {
        all: quranCount + hadithCount + duaCount,
        quran: quranCount,
        hadith: hadithCount,
        dua: duaCount,
      },
      surahMatches: scope === 'hadith' || scope === 'dua' ? [] : surahMatches,
      quranResults: quranSlice,
      hadithResults:
        scope === 'quran' || scope === 'dua' ? [] : matchedHadiths.slice(0, limit),
      duaResults:
        scope === 'quran' || scope === 'hadith' ? [] : matchedDuas.slice(0, limit),
    });
  });

  // Auth endpoints
  app.post('/api/auth/login', (req, res) => {
    const email = cleanText(req.body?.email, 160).toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const admin = db.admins.find((a) => a.email.toLowerCase() === email);
    if (!admin || !verifyPassword(password, admin.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const csrf = crypto.randomBytes(16).toString('hex');
    const payload: SessionPayload = {
      uid: admin.id,
      email: admin.email,
      name: admin.name,
      csrf,
      exp: Date.now() + 1000 * 60 * 60 * 12,
    };
    const token = signSession(payload);
    res.setHeader(
      'Set-Cookie',
      `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200`
    );
    res.json({
      user: { id: admin.id, name: admin.name, email: admin.email },
      csrfToken: csrf,
    });
  });

  app.get('/api/auth/me', (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const session = verifySession(cookies[SESSION_COOKIE]);
    if (!session) {
      res.json({ user: null, csrfToken: null });
      return;
    }
    res.json({
      user: { id: session.uid, name: session.name, email: session.email },
      csrfToken: session.csrf,
    });
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
    res.json({ ok: true });
  });

  // Admin: Manage Quran Ayahs
  app.post('/api/admin/surahs/:surahId/ayahs', requireAdmin, (req, res) => {
    const surahId = Number(req.params.surahId);
    const ayahNumber = Number(req.body?.ayah_number);
    const arabic = cleanText(req.body?.arabic);
    const translation_bn = cleanText(req.body?.translation_bn);
    const translation_en = cleanText(req.body?.translation_en);
    const short_tafsir_bn = cleanText(req.body?.short_tafsir_bn);
    const short_tafsir_en = cleanText(req.body?.short_tafsir_en);
    const tafsir_bn = cleanText(req.body?.tafsir_bn, 8000);
    const tafsir_en = cleanText(req.body?.tafsir_en, 8000);

    if (!Number.isInteger(surahId) || surahId < 1 || surahId > 114) {
      res.status(400).json({ error: 'Invalid surah ID (1-114)' });
      return;
    }
    if (!Number.isInteger(ayahNumber) || ayahNumber < 1 || !arabic || (!translation_bn && !translation_en)) {
      res.status(400).json({ error: 'Ayah number, Arabic text, and translation are required' });
      return;
    }

    const newAyah: Ayah = {
      id: db.nextIds.ayah++,
      surah_id: surahId,
      ayah_number: ayahNumber,
      arabic,
      translation_bn: translation_bn || translation_en,
      translation_en: translation_en || translation_bn,
      ...(short_tafsir_bn ? { short_tafsir_bn } : {}),
      ...(short_tafsir_en ? { short_tafsir_en } : {}),
      ...(tafsir_bn ? { tafsir_bn } : {}),
      ...(tafsir_en ? { tafsir_en } : {}),
    };
    db.ayahs.push(newAyah);
    db.ayahs.sort((a, b) => (a.surah_id === b.surah_id ? a.ayah_number - b.ayah_number : a.surah_id - b.surah_id));
    saveDb();
    cachedQuranIndex = null;
    res.status(201).json(newAyah);
  });

  app.delete('/api/admin/ayahs/:id', requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    const idx = db.ayahs.findIndex((a) => a.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Ayah not found' });
      return;
    }
    db.ayahs.splice(idx, 1);
    saveDb();
    cachedQuranIndex = null;
    res.json({ ok: true });
  });

  // Admin: Manage Hadiths
  app.post('/api/admin/hadiths', requireAdmin, (req, res) => {
    const title_bn = cleanText(req.body?.title_bn, 300);
    const title_en = cleanText(req.body?.title_en, 300);
    const category = cleanText(req.body?.category, 100) || 'General';
    const arabic = cleanText(req.body?.arabic);
    const translation_bn = cleanText(req.body?.translation_bn);
    const translation_en = cleanText(req.body?.translation_en);
    const source = cleanText(req.body?.source, 160);
    const hadith_number = cleanText(req.body?.hadith_number, 60);

    if ((!title_bn && !title_en) || (!translation_bn && !translation_en) || !source) {
      res.status(400).json({ error: 'Title, translation, and source are required' });
      return;
    }

    const item: Hadith = {
      id: db.nextIds.hadith++,
      title_bn: title_bn || title_en,
      title_en: title_en || title_bn,
      category,
      arabic,
      translation_bn: translation_bn || translation_en,
      translation_en: translation_en || translation_bn,
      source,
      hadith_number: hadith_number || '—',
    };
    db.hadiths.unshift(item);
    saveDb();
    res.status(201).json(item);
  });

  app.delete('/api/admin/hadiths/:id', requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    const idx = db.hadiths.findIndex((h) => h.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Hadith not found' });
      return;
    }
    db.hadiths.splice(idx, 1);
    saveDb();
    res.json({ ok: true });
  });

  // Admin: Manage Duas
  app.post('/api/admin/duas', requireAdmin, (req, res) => {
    const category = cleanText(req.body?.category, 120) || 'Daily Routine';
    const title_bn = cleanText(req.body?.title_bn, 300);
    const title_en = cleanText(req.body?.title_en, 300);
    const arabic = cleanText(req.body?.arabic);
    const pronunciation_bn = cleanText(req.body?.pronunciation_bn);
    const pronunciation_en = cleanText(req.body?.pronunciation_en);
    const meaning_bn = cleanText(req.body?.meaning_bn);
    const meaning_en = cleanText(req.body?.meaning_en);
    const reference = cleanText(req.body?.reference, 200) || 'Authentic Sunnah';

    if ((!title_bn && !title_en) || !arabic || (!meaning_bn && !meaning_en)) {
      res.status(400).json({ error: 'Title, Arabic text, and meaning are required' });
      return;
    }

    const item: Dua = {
      id: db.nextIds.dua++,
      category,
      title_bn: title_bn || title_en,
      title_en: title_en || title_bn,
      arabic,
      pronunciation_bn: pronunciation_bn || pronunciation_en,
      pronunciation_en: pronunciation_en || pronunciation_bn,
      meaning_bn: meaning_bn || meaning_en,
      meaning_en: meaning_en || meaning_bn,
      reference,
    };
    db.duas.unshift(item);
    saveDb();
    res.status(201).json(item);
  });

  app.delete('/api/admin/duas/:id', requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    const idx = db.duas.findIndex((d) => d.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Dua not found' });
      return;
    }
    db.duas.splice(idx, 1);
    saveDb();
    res.json({ ok: true });
  });

  // --- User Feedback & Contact Endpoint ---
  const FEEDBACK_PATH = path.join(DATA_DIR, 'feedback.json');
  app.post('/api/feedback', (req, res) => {
    const name = cleanText(req.body?.name, 100) || 'Islamic Life Member';
    const email = cleanText(req.body?.email, 160);
    const topic = cleanText(req.body?.topic, 80) || 'General';
    const message = cleanText(req.body?.message, 4000);
    if (!message || message.length < 4) {
      res.status(400).json({ error: 'Please write at least 4 characters in your feedback.' });
      return;
    }
    const entry = {
      id: `fb_${Date.now()}`,
      name,
      email,
      topic,
      message,
      createdAt: new Date().toISOString(),
    };
    try {
      const list = fs.existsSync(FEEDBACK_PATH)
        ? (JSON.parse(fs.readFileSync(FEEDBACK_PATH, 'utf8')) as unknown[])
        : [];
      const next = [entry, ...(Array.isArray(list) ? list : [])].slice(0, 200);
      fs.writeFileSync(FEEDBACK_PATH, JSON.stringify(next, null, 2), 'utf8');
      res.status(201).json({ ok: true, id: entry.id, createdAt: entry.createdAt });
    } catch {
      res.status(500).json({ error: 'Unable to save feedback right now.' });
    }
  });

  // --- Server-Side Gemini AI Endpoints ---

  // Valid Google Gemini API models. The previous names (gemini-4-hydrogen,
  // gemini-3.5-transcribe) do not exist upstream, so every live call failed.
  const CHAT_MODEL = 'gemini-2.5-flash';
  const CHAT_MODEL_PRO = 'gemini-2.5-pro';
  const CHAT_MODEL_LITE = 'gemini-2.5-flash-lite';
  const TRANSCRIBE_MODEL = 'gemini-2.5-flash';
  const CHAT_MODELS = [CHAT_MODEL, CHAT_MODEL_PRO, CHAT_MODEL_LITE];

  function resolveModel(requested: string): string {
    const wanted = requested.trim();
    if (!wanted) return CHAT_MODEL;
    return CHAT_MODELS.includes(wanted) ? wanted : CHAT_MODEL;
  }

  // 2.5 flash and pro accept thinkingConfig; flash-lite does not.
  function supportsThinking(model: string): boolean {
    return model === CHAT_MODEL || model === CHAT_MODEL_PRO;
  }

  function getServerGeminiKey(): string {
    return (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  }

  function createGeminiClient(): GoogleGenAI {
    const apiKey = getServerGeminiKey();
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is not configured in server environment (Settings > Secrets).'
      );
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  function extractAiError(err: unknown): { status: number; message: string } {
    const anyErr = err as { status?: number; message?: string };
    const rawMsg = anyErr?.message || 'AI request failed.';
    if (rawMsg.includes('GEMINI_API_KEY')) {
      return {
        status: 503,
        message:
          'Server GEMINI_API_KEY is not configured yet. Set GEMINI_API_KEY in AI Studio Secrets to enable live AI.',
      };
    }
    if (anyErr?.status === 429 || rawMsg.toLowerCase().includes('quota') || rawMsg.includes('429')) {
      return {
        status: 429,
        message:
          'Free-tier Gemini rate limit reached temporarily. Please wait a few seconds or switch to Gemini 3.1 Flash Lite and try again.',
      };
    }
    if (anyErr?.status === 403 || rawMsg.toLowerCase().includes('billing')) {
      return {
        status: 403,
        message:
          'This specific model requires a billing-enabled Gemini API key. Standard chat and audio transcription use free-tier models.',
      };
    }
    const status =
      typeof anyErr?.status === 'number' && anyErr.status >= 400 && anyErr.status < 600
        ? anyErr.status
        : 500;
    return { status, message: rawMsg };
  }

  async function withRetryOnce<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      const anyErr = err as { status?: number };
      if (anyErr?.status === 503 || anyErr?.status === 502) {
        await new Promise((r) => setTimeout(r, 700));
        return await fn();
      }
      throw err;
    }
  }

  app.get('/api/ai/status', (_req, res) => {
    const configured = Boolean(getServerGeminiKey());
    res.json({
      ok: true,
      geminiConfigured: configured,
      freeModels: [CHAT_MODEL, CHAT_MODEL_LITE, TRANSCRIBE_MODEL],
      paidMediaModels: ['lyria-3-clip-preview', 'lyria-3-pro-preview', 'gemini-omni-1.2-flash'],
      timestamp: new Date().toISOString(),
    });
  });

  app.post('/api/ai/chat', async (req, res) => {
    try {
      const message = cleanText(req.body?.message, 8000);
      if (!message) {
        res.status(400).json({ error: 'Message is required.' });
        return;
      }

      const requestedModel = cleanText(req.body?.model, 48);
      const model = resolveModel(requestedModel);

      const personaId = cleanText(req.body?.personaId, 48) || 'islamic-scholar';
      const customPrompt = cleanText(req.body?.customSystemInstruction, 1500);
      const systemInstruction = resolvePersonaInstruction(personaId, customPrompt);

      const rawHistory: unknown[] = Array.isArray(req.body?.history) ? req.body.history : [];
      const history = rawHistory
        .slice(-24)
        .filter(
          (turn: unknown): turn is { role: 'user' | 'model'; text: string } =>
            Boolean(turn) &&
            typeof turn === 'object' &&
            ((turn as { role?: string }).role === 'user' ||
              (turn as { role?: string }).role === 'model') &&
            typeof (turn as { text?: string }).text === 'string' &&
            (turn as { text: string }).text.trim().length > 0
        )
        .map((turn: { role: 'user' | 'model'; text: string }) => ({
          role: turn.role,
          parts: [{ text: turn.text.trim().slice(0, 8000) }],
        }));

      const thinkingDepth = cleanText(req.body?.thinkingDepth, 16);
      const thinkingLevelMap: Record<string, ThinkingLevel> = {
        low: ThinkingLevel.LOW,
        medium: ThinkingLevel.MEDIUM,
        high: ThinkingLevel.HIGH,
      };

      const config: {
        systemInstruction: string;
        thinkingConfig?: { thinkingLevel: ThinkingLevel };
      } = {
        systemInstruction,
      };

      if (supportsThinking(model) && thinkingDepth && thinkingLevelMap[thinkingDepth]) {
        config.thinkingConfig = {
          thinkingLevel: thinkingLevelMap[thinkingDepth],
        };
      }

      const ai = createGeminiClient();
      const chat = ai.chats.create({
        model,
        history,
        config,
      });

      const response = await withRetryOnce(() => chat.sendMessage({ message }));
      res.json({
        text: response.text ?? '',
        model,
      });
    } catch (err) {
      const { status, message } = extractAiError(err);
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/ai/transcribe', async (req, res) => {
    try {
      const rawBase64 = typeof req.body?.audioBase64 === 'string' ? req.body.audioBase64.trim() : '';
      if (!rawBase64 || rawBase64.length > 18 * 1024 * 1024) {
        res.status(400).json({ error: 'Valid audio data (up to 12MB) is required.' });
        return;
      }

      const rawMime = cleanText(req.body?.mimeType, 80).split(';')[0].toLowerCase();
      const allowedAudioMimes = new Set([
        'audio/webm',
        'audio/mp3',
        'audio/mpeg',
        'audio/wav',
        'audio/ogg',
        'audio/mp4',
        'audio/m4a',
        'audio/x-m4a',
        'audio/aac',
      ]);
      const mimeType = allowedAudioMimes.has(rawMime) ? rawMime : 'audio/webm';
      const languageHint = cleanText(req.body?.languageHint, 32) || 'auto';
      const customNote = cleanText(req.body?.prompt, 300);

      const promptParts = [
        'Transcribe this audio accurately with clear punctuation.',
        languageHint !== 'auto' ? `Primary spoken language hint: ${languageHint}.` : '',
        customNote ? `Context: ${customNote}` : '',
      ].filter(Boolean);

      const ai = createGeminiClient();
      const response = await ai.models.generateContent({
        model: TRANSCRIBE_MODEL,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: rawBase64,
              },
            },
            { text: promptParts.join(' ') },
          ],
        },
      });

      res.json({
        transcript: response.text ?? '',
        model: TRANSCRIBE_MODEL,
        mimeType,
      });
    } catch (err) {
      const { status, message } = extractAiError(err);
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/ai/music', async (req, res) => {
    try {
      const prompt = cleanText(req.body?.prompt, 1200);
      if (!prompt) {
        res.status(400).json({ error: 'Music prompt is required.' });
        return;
      }

      const requestedModel = cleanText(req.body?.model, 48);
      const model =
        requestedModel === 'lyria-3-pro-preview' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview';

      const ai = createGeminiClient();
      const response = await ai.models.generateContentStream({
        model,
        contents: prompt,
      });

      const audioChunks: Buffer[] = [];
      let lyrics = '';
      let mimeType = 'audio/mpeg';

      for await (const chunk of response) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (audioChunks.length === 0 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioChunks.push(Buffer.from(part.inlineData.data, 'base64'));
          }
          if (part.text) {
            lyrics += part.text;
          }
        }
      }

      if (audioChunks.length === 0) {
        res.status(502).json({ error: 'No audio returned by Lyria.' });
        return;
      }

      const audioBase64 = Buffer.concat(audioChunks).toString('base64');
      res.json({
        audioDataUrl: `data:${mimeType};base64,${audioBase64}`,
        lyrics: lyrics.trim(),
        mimeType,
        model,
      });
    } catch (err) {
      const { status, message } = extractAiError(err);
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/ai/video', async (req, res) => {
    try {
      const prompt = cleanText(req.body?.prompt, 1200);
      if (!prompt) {
        res.status(400).json({ error: 'Video prompt is required.' });
        return;
      }

      const rawAspect = cleanText(req.body?.aspectRatio, 10);
      const aspectRatio = rawAspect === '9:16' ? '9:16' : '16:9';
      const rawDuration = cleanText(req.body?.duration, 10);
      const duration = ['5s', '8s', '10s'].includes(rawDuration) ? rawDuration : '8s';

      const ai = createGeminiClient();
      const interaction = await ai.interactions.create(
        {
          model: 'gemini-omni-1.2-flash',
          input: prompt,
          background: false,
          store: false,
          stream: false,
          response_format: {
            type: 'video',
            aspect_ratio: aspectRatio,
            duration,
            resolution: '720p',
          },
        },
        { timeout: 300000 }
      );

      const videoPart = interaction.output_video;
      if (!videoPart?.data) {
        res.status(502).json({ error: 'No video output returned by Omni Flash.' });
        return;
      }

      const mimeType = videoPart.mime_type || 'video/mp4';
      res.json({
        videoDataUrl: `data:${mimeType};base64,${videoPart.data}`,
        mimeType,
        aspectRatio,
        model: 'gemini-omni-1.2-flash',
      });
    } catch (err) {
      const { status, message } = extractAiError(err);
      res.status(status).json({ error: message });
    }
  });

  // AI Quran Recitation & Arabic Pronunciation Check (Free-Tier Transcribe + Hydrogen Feedback)
  app.post('/api/ai/recitation-check', async (req, res) => {
    try {
      const rawBase64 = typeof req.body?.audioBase64 === 'string' ? req.body.audioBase64.trim() : '';
      const referenceArabic = cleanText(req.body?.referenceArabic, 2000);
      const referenceLabel = cleanText(req.body?.referenceLabel, 200) || 'Selected Arabic Passage';
      const lang = cleanText(req.body?.lang, 10) === 'en' ? 'en' : 'bn';

      if (!rawBase64 || rawBase64.length > 18 * 1024 * 1024) {
        res.status(400).json({ error: 'Valid audio recording (up to 12MB) is required.' });
        return;
      }
      if (!referenceArabic) {
        res.status(400).json({ error: 'Reference Arabic text is required.' });
        return;
      }

      const rawMime = cleanText(req.body?.mimeType, 80).split(';')[0].toLowerCase();
      const allowedAudioMimes = new Set([
        'audio/webm',
        'audio/mp3',
        'audio/mpeg',
        'audio/wav',
        'audio/ogg',
        'audio/mp4',
        'audio/m4a',
        'audio/x-m4a',
        'audio/aac',
      ]);
      const mimeType = allowedAudioMimes.has(rawMime) ? rawMime : 'audio/webm';

      const ai = createGeminiClient();
      const trResponse = await withRetryOnce(() =>
        ai.models.generateContent({
          model: TRANSCRIBE_MODEL,
          contents: {
            parts: [
              { inlineData: { mimeType, data: rawBase64 } },
              {
                text: `Transcribe the spoken Arabic recitation/phrase accurately in Arabic script. Do not auto-correct mistakes; write what was actually heard.`,
              },
            ],
          },
        })
      );

      const transcript = (trResponse.text ?? '').trim();
      const feedbackPrompt =
        lang === 'bn'
          ? `আপনি একজন সহানুভূতিশীল আরবি উচ্চারণ ও কুরআন শিক্ষণ সহায়ক।
যাচাইকৃত মূল আরবি পাঠ (${referenceLabel}):
${referenceArabic}

শিক্ষার্থীর অডিও থেকে প্রাপ্ত ট্রান্সক্রিপ্ট:
${transcript || '(কোনো স্পষ্ট আরবি শব্দ শনাক্ত হয়নি)'}

দয়া করে বাংলা ভাষায়:
১) মূল পাঠের সাথে শিক্ষার্থীর পঠনের শব্দ-ভিত্তিক সম্ভাব্য পার্থক্য সংক্ষেপে তুলনা করুন (যদি শব্দ বাদ পড়ে বা ভিন্ন শোনায়)।
২) নির্দিষ্ট হরফের সম্ভাব্য মাখরাজ ও তাজবিদ (যেমন মদ্দ, ক্বলক্বলাহ বা ইদগাম) অনুশীলনের পরামর্শ দিন।
৩) স্পষ্টভাবে উল্লেখ করুন যে স্বয়ংক্রিয় অডিও ট্রান্সক্রিপশন দিয়ে চূড়ান্ত তাজবিদ বা মাখরাজ যাচাই সম্ভব নয়; শুদ্ধ কেরাত ও ইজাজাহর জন্য সরাসরি অভিজ্ঞ কারী/আলেমের কাছে শোনানো উত্তম। কখনো নিজে নতুন কুরআনের আয়াত বানাবেন না।`
          : `You are a supportive Arabic & Quran recitation study companion.
Verified Reference Arabic (${referenceLabel}):
${referenceArabic}

Learner's transcribed speech:
${transcript || '(No clear Arabic words detected)'}

Please respond concisely in English:
1) Compare detected words against the reference text and highlight possible omitted or differently heard words.
2) Give practical Makharij and Tajweed practice tips (e.g., Madd, Qalqalah, heavy vs light letters).
3) Clearly state that automated speech transcription cannot certify exact Tajweed/Makharij accuracy and recommend practicing with a qualified Quran teacher. Never invent or alter Quranic verses.`;

      const fbResponse = await withRetryOnce(() =>
        ai.models.generateContent({
          model: CHAT_MODEL,
          contents: feedbackPrompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        })
      );

      res.json({
        transcript,
        feedback: (fbResponse.text ?? '').trim(),
        model: `${TRANSCRIBE_MODEL} + ${CHAT_MODEL}`,
      });
    } catch (err) {
      const { status, message } = extractAiError(err);
      res.status(status).json({ error: message });
    }
  });

  // Guarantee JSON errors for unmatched or failing /api/* requests (never HTML fallback)
  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });
  app.use('/api', (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const message = err instanceof Error ? err.message : 'Internal API server error.';
    res.status(500).json({ error: message });
  });

  // Vite middleware in dev / static dist in prod
  if (process.env.NODE_ENV !== 'production') {
    const hmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: hmrDisabled ? null : undefined,
      },
      appType: 'spa',
    });

    // HMR is disabled in AI Studio; suppress Vite client WebSocket connection
    // while keeping all CSS/module helper exports (updateStyle, createHotContext, etc.) intact.
    app.get('/@vite/client', async (_req, res, next) => {
      try {
        const result = await vite.transformRequest('/@vite/client');
        if (!result) {
          next();
          return;
        }
        const patched = result.code.replace(
          'transport.connect(createHMRHandler(handleMessage));',
          '/* HMR disabled: WebSocket connect suppressed */'
        );
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.send(patched);
      } catch {
        next();
      }
    });

    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Islamic Life server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
