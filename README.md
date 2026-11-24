<div align="center">

# Islamic Life · ইসলামিক লাইফ

**A Bengali-first Islamic companion — Quran, prayer, knowledge, and daily worship in one place.**

[**Live site »**](https://shawonhaque.github.io/Islamic-Life/)

[![Deploy](https://github.com/shawonhaque/Islamic-Life/actions/workflows/deploy.yml/badge.svg)](https://github.com/shawonhaque/Islamic-Life/actions/workflows/deploy.yml)
![React](https://img.shields.io/badge/React-19-087653?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-087653?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-087653?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-087653?logo=tailwindcss&logoColor=white)

</div>

---

## What is this

Islamic Life is a single-page web app for daily Islamic practice, written in
Bengali with an English switch. It runs entirely in the browser: the whole
Quran, prayer times computed from your coordinates, qibla direction, a tasbih
counter, zakat calculator, hijri calendar, and a 3D globe — no account needed.

Google sign-in adds optional cloud backup so settings, goals, and reading
progress follow you across devices. Without it, everything stays in
`localStorage` and the JSON export works offline.

## Features

| | |
|---|---|
| **কুরআন** | All 114 surahs with Bengali translation and transliteration, served as static JSON. Per-ayah audio via `QuranAudioPlayer`. |
| **তাফসির** | 17 editions, 11 of them fetched live from the `spa5k/tafsir_api` CDN; the rest ship as bundled text. |
| **হাদিস ও দোয়া** | Curated hadith and dua collections with Bengali translation. |
| **নামাজ শিক্ষা** | Step-by-step salah guide with rak'ah counts and recitations. |
| **নামাজের সময়** | Prayer times computed locally from GPS or a chosen city, with six calculation methods (Karachi, MWL, ISNA, Umm al-Qura, Egyptian, Tehran) and adhan reminders. |
| **কিবলা** | Compass bearing to the Kaaba, plus an optional Google Maps view. |
| **ইসলামিক জ্ঞানকোষ** | 8 categories, 32 articles, and 9 Bengali video lectures playable in place. |
| **আরবি ও কুরআন শিক্ষা** | Arabic alphabet and Quran-reading academy with progress tracking. |
| **ডিজিটাল তাসবিহ** | Tap counter with presets, haptics, and session history. |
| **আল্লাহর ৯৯ নাম** | The 99 names with meanings and explanations. |
| **যাকাত হিসাব** | Zakat calculator across gold, silver, cash, and liabilities with nisab thresholds. |
| **হিজরি তারিখ** | Hijri/Gregorian calendar with Islamic observances. |
| **সেহরি, ইফতার ও রমজান** | Ramadan timetable and fasting tracker. |
| **হজ ও উমরাহ** | Step-by-step pilgrimage guide. |
| **৩ডি পৃথিবী গ্লোব** | Interactive WebGL globe of the earth, lazy-loaded so `three` stays out of the entry bundle. |
| **এআই ও ক্লাউড স্টুডিও** | Chat with a Gemini-backed assistant and transcribe audio. Works with a user-supplied API key, or through the dev server. |
| **সেটিংস ও অ্যাকাউন্ট** | Language, theme, city, calculation method, notification reminders, cloud sync, and JSON backup export. |

## Getting started

**Prerequisites:** Node.js 22 or newer.

```bash
npm install
npm run dev
```

The dev server runs `server.ts` on <http://localhost:3000> and proxies Vite
through it, so the AI endpoints and `/api/content` work locally.

For AI features, copy `.env.example` to `.env.local` and set `GEMINI_API_KEY`.
Without it the AI studio still loads and explains that a key is needed — you
can also paste a key in Settings, which stores it in `localStorage`.

### Scripts

| Command | Does |
|---|---|
| `npm run dev` | Express + Vite dev server on port 3000 |
| `npm run build` | Converts Quran data, generates brand assets, SEO tags and the search index, then builds to `dist/` |
| `npm run preview` | Serves the built `dist/` |
| `npm run lint` | `tsc --noEmit` |
| `npm run clean` | Removes `dist/` and `server.js` |

## Deployment

The live site is GitHub Pages, published by `.github/workflows/deploy.yml` on
every push to `main`. The workflow builds with `GITHUB_PAGES=true`, which makes
Vite emit asset URLs under `/Islamic-Life/`, then pushes `dist/` to the
`gh-pages` branch that Pages serves.

The express server is **not** deployed. On the static build `__HAS_BACKEND__` is
false, so the client skips `/api/content` and falls back to bundled seed data.
Quran audio, prayer times, and qibla all work; AI chat needs a user-supplied
Gemini key because there is no server to hold one.

### Cloud sign-in

Sign-in needs a Firebase project that authorizes the hosting origin. The
committed `firebase-applet-config.json` points at an AI Studio applet project
that only authorizes `*.web.app` and `*.run.app`, so sign-in on GitHub Pages
fails with `auth/unauthorized-domain` until you either:

1. add `shawonhaque.github.io` under **Firebase Console → Authentication →
   Settings → Authorized domains**, or
2. point the build at your own project with the `VITE_FIREBASE_*` variables
   (see `.env.example`). The deploy workflow reads them from repository
   secrets, and `src/lib/firebase.ts` merges them over the committed JSON.

Also enable the Google provider under **Authentication → Sign-in method**, and
publish `firestore.rules` so users can only read and write their own documents.

Without sign-in, settings and progress stay in `localStorage` and
**Settings → Backup → Export** downloads a JSON snapshot.

## Project layout

```
src/
  components/   29 views and shared UI
  contexts/     AuthContext, SettingsContext
  data/         seed content: knowledge, modules, personas, curriculum
  hooks/        useNotificationScheduler
  lib/          firebase bootstrap
  three/        terrarium and qibla scenes
  types/        shared domain types
  utils/        prayer maths, weather, Gemini client, fetch helpers
data/quran/     114 surah snapshots (~140 MB, tracked), read by fetch-quran.mjs
scripts/        build-time generators for Quran data, brand, SEO, search index
server.ts       express API, dev only
firestore.rules security rules for user documents
```

Build-time scripts turn `data/quran/` into `public/quran/`, so never edit
`public/quran/` by hand.

## Tech stack

React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · Firebase (Auth + Firestore) ·
three.js · Google Maps JS API · Express · `@google/genai`

## Notes for contributors

`AGENTS.md` collects the non-obvious pitfalls — routing that must be updated in
four places, Gemini model names that the live API rejects, position utilities
that silently collide, and the Firebase domain issue above. Read it before
changing shared UI or build config.

## License

Personal project. Quran text and translations belong to their respective
sources; tafsir is fetched from
[`spa5k/tafsir_api`](https://github.com/spa5k/tafsir_api) and lecture videos are
embedded from YouTube via `youtube-nocookie.com`.
