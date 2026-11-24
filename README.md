<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/828f631a-ffb0-499f-b05f-c5c95cd95a07

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deployment

The site is deployed to GitHub Pages by `.github/workflows/deploy.yml`.
The workflow runs `npm run build` with `GITHUB_PAGES=true`, which makes
Vite emit asset URLs under `/Islamic-Life/`, then publishes `dist/`.

The express server in `server.ts` is **not** deployed. The client falls
back to bundled seed data when `/api/content` is unreachable, so the
public site renders; the admin console and the AI features stay inert
until that server is hosted somewhere.

## Project layout

```
src/
  components/   pages and shared UI
  contexts/     auth and settings providers
  data/         seed content and curriculum data
  hooks/        useNotificationScheduler
  lib/          firebase bootstrap
  three/        terrarium and qibla scenes
  types/        shared domain types
  utils/        prayer maths, weather, fetch helpers
data/quran/     114 surah snapshots, written by fetch-quran.mjs
server.ts       express API, dev only
```
