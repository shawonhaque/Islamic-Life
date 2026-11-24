import type { Ayah, TafsirEdition, TafsirReadResponse } from '../types/islamic';
import { loadStaticSurah } from './quranData';

// The static deploy has no express server, so /api/tafsir/read is unreachable
// there. This reproduces what server.ts does: try the same jsdelivr edition
// feed the server uses, and fall back to the tafsir bundled with each ayah.

const CDN = 'https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir';

function stripHtml(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li)>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function buildFallbackCommentary(
  edition: TafsirEdition,
  surahNumber: number,
  ayah: Ayah
): string {
  const arabic = (ayah.arabic || '').replace(/^\uFEFF/, '');
  if (edition.language === 'ar') {
    return `﴿${arabic}﴾\n\n[${edition.name_ar} — ${edition.author_en}]\n${edition.methodology_en}\n\n${
      ayah.short_tafsir_en || ayah.translation_en
    }`;
  }
  if (edition.language === 'bn') {
    const core = ayah.tafsir_bn || ayah.short_tafsir_bn || ayah.translation_bn;
    return `[${edition.name_bn} · ${edition.author_bn}]\n${edition.methodology_bn}\n\nসূরা ${surahNumber}, আয়াত ${ayah.ayah_number}-এর তাফসির:\n${core}`;
  }
  const core = ayah.tafsir_en || ayah.short_tafsir_en || ayah.translation_en;
  return `[${edition.name_en} · ${edition.author_en}]\n${edition.methodology_en}\n\nCommentary on ${surahNumber}:${ayah.ayah_number}:\n${core}`;
}

async function fetchCdnTafsir(apiSlug: string, surah: number, ayah: number): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${CDN}/${encodeURIComponent(apiSlug)}/${surah}/${ayah}.json`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const payload = (await res.json()) as { text?: string };
    if (typeof payload?.text !== 'string') return null;
    const text = stripHtml(payload.text);
    return text.length > 10 ? text : null;
  } catch {
    return null;
  }
}

export async function readTafsir(
  edition: TafsirEdition,
  surahNumber: number,
  ayahNumber: number
): Promise<TafsirReadResponse | null> {
  const ayahs = await loadStaticSurah(surahNumber);
  const ayah = ayahs?.find((a) => a.ayah_number === ayahNumber) ?? ayahs?.[0];
  if (!ayah) return null;

  let commentary = edition.apiSlug
    ? await fetchCdnTafsir(edition.apiSlug, surahNumber, ayah.ayah_number)
    : null;
  const sourceMode: TafsirReadResponse['sourceMode'] = commentary ? 'live-api' : 'local-scholar';

  if (!commentary) {
    commentary = buildFallbackCommentary(edition, surahNumber, ayah);
  }

  return {
    edition,
    surah_number: surahNumber,
    ayah_number: ayah.ayah_number,
    arabic: (ayah.arabic || '').replace(/^\uFEFF/, ''),
    translation_bn: ayah.translation_bn,
    translation_en: ayah.translation_en,
    short_tafsir_bn: ayah.short_tafsir_bn,
    short_tafsir_en: ayah.short_tafsir_en,
    commentary,
    sourceMode,
  };
}
