import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Download,
  Globe,
  Loader2,
  Minus,
  Plus,
  RectangleHorizontal,
  RectangleVertical,
  Share2,
  Square,
  X,
} from 'lucide-react';
import type { Ayah, Language, SurahDetailResponse } from '../types/islamic';
import { safeReadJson } from '../utils/safeFetch';
import { loadStaticSurah } from '../utils/quranData';
import { cleanAyahArabic } from './QuranTafsirModal';

export interface VerseImageTarget {
  surahNumber: number;
  ayahNumber: number;
  surahNameEn: string;
  surahNameBn: string;
  surahNameAr: string;
  totalAyahs?: number;
  initialArabic?: string;
  initialTranslationEn?: string;
  initialTranslationBn?: string;
}

interface VerseImageModalProps {
  open: boolean;
  lang: Language;
  target: VerseImageTarget | null;
  onClose: () => void;
}

type ShowMode = 'both' | 'arabic' | 'translation';
type ShapeMode = 'story' | 'portrait' | 'square';
type CardThemeId = 'indigo' | 'cream' | 'emerald' | 'plum' | 'ivory' | 'blush';

interface CardTheme {
  id: CardThemeId;
  bgTop: string;
  bgBottom: string;
  borderColor: string;
  accentColor: string;
  textColor: string;
  subTextColor: string;
  badgeBg: string;
}

const CARD_THEMES: CardTheme[] = [
  {
    id: 'indigo',
    bgTop: '#101d47',
    bgBottom: '#0b1330',
    borderColor: '#b99345',
    accentColor: '#d4a84f',
    textColor: '#ffffff',
    subTextColor: '#d0d7ea',
    badgeBg: 'rgba(212, 168, 79, 0.14)',
  },
  {
    id: 'cream',
    bgTop: '#f8f0db',
    bgBottom: '#efe1c0',
    borderColor: '#9f7524',
    accentColor: '#8b6114',
    textColor: '#1f2421',
    subTextColor: '#564d3b',
    badgeBg: 'rgba(139, 97, 20, 0.1)',
  },
  {
    id: 'emerald',
    bgTop: '#064433',
    bgBottom: '#03251b',
    borderColor: '#c39a48',
    accentColor: '#e2bd6b',
    textColor: '#ffffff',
    subTextColor: '#cbe8dc',
    badgeBg: 'rgba(226, 189, 107, 0.14)',
  },
  {
    id: 'plum',
    bgTop: '#421a47',
    bgBottom: '#b46256',
    borderColor: '#eebc8c',
    accentColor: '#f6cca0',
    textColor: '#ffffff',
    subTextColor: '#fce7eb',
    badgeBg: 'rgba(246, 204, 160, 0.16)',
  },
  {
    id: 'ivory',
    bgTop: '#ffffff',
    bgBottom: '#f9f6ee',
    borderColor: '#9e7628',
    accentColor: '#8c6216',
    textColor: '#1a201d',
    subTextColor: '#4c5450',
    badgeBg: 'rgba(140, 98, 22, 0.08)',
  },
  {
    id: 'blush',
    bgTop: '#f8dae5',
    bgBottom: '#eec1d3',
    borderColor: '#8d3658',
    accentColor: '#7a2949',
    textColor: '#2c121d',
    subTextColor: '#613044',
    badgeBg: 'rgba(122, 41, 73, 0.1)',
  },
];

const TEXT_SCALES = [0.84, 0.92, 1.0, 1.12, 1.24];

function toArabicIndicDigits(num: number): string {
  const digits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num)
    .split('')
    .map((ch) => digits[Number(ch)] ?? ch)
    .join('');
}

function EightPointStarSvg({ color, className = 'w-3.5 h-3.5' }: { color: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="5" y="5" width="14" height="14" fill="none" stroke={color} strokeWidth="1.5" />
      <rect
        x="5"
        y="5"
        width="14"
        height="14"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        transform="rotate(45 12 12)"
      />
      <circle cx="12" cy="12" r="2.2" fill={color} />
    </svg>
  );
}

function drawEightPointStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, r * 0.14);
  const s = r * 1.3;
  ctx.strokeRect(-s / 2, -s / 2, s, s);
  ctx.rotate(Math.PI / 4);
  ctx.strokeRect(-s / 2, -s / 2, s, s);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function wrapTextLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = words[0];

  for (let i = 1; i < words.length; i += 1) {
    const next = `${current} ${words[i]}`;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

export function VerseImageModal({ open, lang, target, onClose }: VerseImageModalProps) {
  const [fromAyah, setFromAyah] = useState<number>(1);
  const [toAyah, setToAyah] = useState<number>(1);
  const [surahAyahs, setSurahAyahs] = useState<Ayah[]>([]);
  const [totalAyahs, setTotalAyahs] = useState<number>(1);
  const [loadingSurah, setLoadingSurah] = useState<boolean>(false);

  const [showMode, setShowMode] = useState<ShowMode>('both');
  const [shapeMode, setShapeMode] = useState<ShapeMode>('portrait');
  const [themeId, setThemeId] = useState<CardThemeId>('indigo');
  const [textStep, setTextStep] = useState<number>(2); // 0..4
  const [translationLang, setTranslationLang] = useState<Language>(lang);
  const [exporting, setExporting] = useState<boolean>(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  useEffect(() => {
    setTranslationLang(lang);
  }, [lang]);

  useEffect(() => {
    if (!open || !target) return;
    setFromAyah(target.ayahNumber);
    setToAyah(target.ayahNumber);
    setTotalAyahs(Math.max(target.totalAyahs ?? target.ayahNumber, target.ayahNumber));
    setShareFeedback(null);

    let cancelled = false;
    setLoadingSurah(true);
    fetch(`/api/surahs/${target.surahNumber}`)
      .then((res) => (res.ok ? safeReadJson<SurahDetailResponse>(res) : null))
      .then(async (data) => {
        const ayahs =
          Array.isArray(data?.ayahs) && data.ayahs.length
            ? data.ayahs
            : await loadStaticSurah(target.surahNumber);
        if (cancelled || !ayahs) return;
        setSurahAyahs(ayahs);
        setTotalAyahs(data?.total_ayahs || ayahs.length || target.ayahNumber);
      })
      .catch(() => {
        // fallback cleanly to initial ayah payload
      })
      .finally(() => {
        if (!cancelled) setLoadingSurah(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, target?.surahNumber, target?.ayahNumber, target?.totalAyahs]);

  const activeTheme = useMemo(
    () => CARD_THEMES.find((t) => t.id === themeId) ?? CARD_THEMES[0],
    [themeId]
  );

  const selectedVerses = useMemo(() => {
    if (!target) return [];
    const inRange = surahAyahs
      .filter((a) => a.ayah_number >= fromAyah && a.ayah_number <= toAyah)
      .sort((a, b) => a.ayah_number - b.ayah_number);

    if (inRange.length > 0) return inRange;

    return [
      {
        id: target.ayahNumber,
        surah_id: target.surahNumber,
        ayah_number: target.ayahNumber,
        arabic: target.initialArabic || '',
        translation_bn: target.initialTranslationBn || '',
        translation_en: target.initialTranslationEn || '',
      },
    ];
  }, [target, surahAyahs, fromAyah, toAyah]);

  const combinedArabic = useMemo(() => {
    if (!target) return '';
    return selectedVerses
      .map(
        (v) =>
          `${cleanAyahArabic(v.arabic, target.surahNumber, v.ayah_number)} ﴿${toArabicIndicDigits(
            v.ayah_number
          )}﴾`
      )
      .join(' ');
  }, [selectedVerses, target]);

  const combinedTranslation = useMemo(() => {
    return selectedVerses
      .map((v) =>
        translationLang === 'bn'
          ? v.translation_bn || v.translation_en
          : v.translation_en || v.translation_bn
      )
      .filter(Boolean)
      .join(' ');
  }, [selectedVerses, translationLang]);

  if (!open || !target) return null;

  const verseRangeStr =
    fromAyah === toAyah
      ? `${target.surahNumber}:${fromAyah}`
      : `${target.surahNumber}:${fromAyah}–${toAyah}`;

  const surahCalligraphyTitle = target.surahNameAr.startsWith('سورة') || target.surahNameAr.startsWith('سُورَة')
    ? target.surahNameAr
    : `سُورَةُ ${target.surahNameAr}`;

  const scale = TEXT_SCALES[textStep] ?? 1.0;

  const renderCardBlob = async (): Promise<Blob | null> => {
    if (typeof document === 'undefined') return null;
    if (document.fonts?.ready) {
      await document.fonts.ready.catch(() => {});
    }

    const dims =
      shapeMode === 'story'
        ? { w: 1080, h: 1920 }
        : shapeMode === 'portrait'
        ? { w: 1080, h: 1350 }
        : { w: 1080, h: 1080 };

    const canvas = document.createElement('canvas');
    canvas.width = dims.w;
    canvas.height = dims.h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 1. Background gradient
    const grad = ctx.createLinearGradient(0, 0, dims.w * 0.4, dims.h);
    grad.addColorStop(0, activeTheme.bgTop);
    grad.addColorStop(1, activeTheme.bgBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, dims.w, dims.h);

    // 2. Inset double frame + corner stars
    const pad = 42;
    ctx.strokeStyle = activeTheme.borderColor;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.72;
    ctx.strokeRect(pad, pad, dims.w - pad * 2, dims.h - pad * 2);
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.35;
    ctx.strokeRect(pad + 12, pad + 12, dims.w - (pad + 12) * 2, dims.h - (pad + 12) * 2);
    ctx.globalAlpha = 1;

    const starInset = pad + 42;
    drawEightPointStar(ctx, starInset, starInset, 14, activeTheme.accentColor);
    drawEightPointStar(ctx, dims.w - starInset, starInset, 14, activeTheme.accentColor);
    drawEightPointStar(ctx, starInset, dims.h - starInset, 14, activeTheme.accentColor);
    drawEightPointStar(ctx, dims.w - starInset, dims.h - starInset, 14, activeTheme.accentColor);

    // 3. Top Surah Calligraphy & diamond divider
    const topY = shapeMode === 'story' ? 190 : 128;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = activeTheme.accentColor;
    ctx.font = `600 44px "Amiri", serif`;
    ctx.fillText(surahCalligraphyTitle, dims.w / 2, topY);

    const divY = topY + 52;
    ctx.strokeStyle = activeTheme.accentColor;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(dims.w / 2 - 190, divY);
    ctx.lineTo(dims.w / 2 - 22, divY);
    ctx.moveTo(dims.w / 2 + 22, divY);
    ctx.lineTo(dims.w / 2 + 190, divY);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.translate(dims.w / 2, divY);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = activeTheme.accentColor;
    ctx.fillRect(-7, -7, 14, 14);
    ctx.restore();

    // 4. Measure & center Arabic + Translation vertically
    const contentWidth = dims.w - 190;
    const arFontSize = Math.round((shapeMode === 'square' ? 46 : 52) * scale);
    const trFontSize = Math.round((shapeMode === 'square' ? 28 : 31) * scale);
    const arLineH = Math.round(arFontSize * 1.65);
    const trLineH = Math.round(trFontSize * 1.5);

    ctx.font = `600 ${arFontSize}px "Amiri", serif`;
    const arabicLines =
      showMode === 'both' || showMode === 'arabic'
        ? wrapTextLines(ctx, combinedArabic, contentWidth)
        : [];

    ctx.font = `500 ${trFontSize}px "Hind Siliguri", "Plus Jakarta Sans", sans-serif`;
    const transLines =
      showMode === 'both' || showMode === 'translation'
        ? wrapTextLines(ctx, combinedTranslation, contentWidth)
        : [];

    const arBlockH = arabicLines.length * arLineH;
    const trBlockH = transLines.length * trLineH;
    const midBarH = showMode === 'both' ? 54 : 0;
    const totalBodyH = arBlockH + midBarH + trBlockH;

    const availTop = divY + 54;
    const availBottom = dims.h - (shapeMode === 'story' ? 210 : 165);
    let cursorY = Math.max(availTop, availTop + (availBottom - availTop - totalBodyH) / 2);

    if (arabicLines.length > 0) {
      ctx.fillStyle = activeTheme.textColor;
      ctx.font = `600 ${arFontSize}px "Amiri", serif`;
      ctx.direction = 'rtl';
      for (const line of arabicLines) {
        ctx.fillText(line, dims.w / 2, cursorY + arLineH / 2);
        cursorY += arLineH;
      }
      ctx.direction = 'ltr';
    }

    if (showMode === 'both') {
      cursorY += 22;
      ctx.fillStyle = activeTheme.accentColor;
      ctx.fillRect(dims.w / 2 - 42, cursorY, 84, 4);
      cursorY += 32;
    }

    if (transLines.length > 0) {
      ctx.fillStyle = activeTheme.subTextColor;
      ctx.font = `500 ${trFontSize}px "Hind Siliguri", "Plus Jakarta Sans", sans-serif`;
      for (const line of transLines) {
        ctx.fillText(line, dims.w / 2, cursorY + trLineH / 2);
        cursorY += trLineH;
      }
    }

    // 5. Footer metadata & brand pill
    const footerY = dims.h - (shapeMode === 'story' ? 128 : 108);
    ctx.textAlign = 'left';
    ctx.fillStyle = activeTheme.textColor;
    ctx.font = `700 28px "Plus Jakarta Sans", "Hind Siliguri", sans-serif`;
    const refTitle =
      translationLang === 'bn'
        ? `${target.surahNameBn} · ${verseRangeStr}`
        : `${target.surahNameEn} · ${verseRangeStr}`;
    ctx.fillText(refTitle, pad + 56, footerY - 12);

    ctx.fillStyle = activeTheme.subTextColor;
    ctx.font = `500 22px "Plus Jakarta Sans", "Hind Siliguri", sans-serif`;
    ctx.fillText(
      translationLang === 'bn' ? 'বাংলা অনুবাদ · ইসলামিক লাইফ' : 'Saheeh International · Islamic Life',
      pad + 56,
      footerY + 20
    );

    ctx.textAlign = 'right';
    ctx.fillStyle = activeTheme.accentColor;
    ctx.font = `700 24px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText('Islamic Life', dims.w - pad - 56, footerY + 4);

    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0)
    );
  };

  const handleDownload = async () => {
    setExporting(true);
    try {
      const blob = await renderCardBlob();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `islamic-life-quran-${target.surahNumber}-${fromAyah}${
        toAyah > fromAyah ? `-${toAyah}` : ''
      }.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setShareFeedback(lang === 'bn' ? 'কার্ড ডাউনলোড হয়েছে!' : 'Image downloaded!');
    } finally {
      setExporting(false);
    }
  };

  const handleShare = async () => {
    setExporting(true);
    try {
      const shareText = `${combinedArabic}\n\n${combinedTranslation}\n\n— ${
        translationLang === 'bn' ? target.surahNameBn : target.surahNameEn
      } (${verseRangeStr})`;

      const blob = await renderCardBlob();
      if (blob && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        const file = new File([blob], `quran-${target.surahNumber}-${fromAyah}.png`, {
          type: 'image/png',
        });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `${target.surahNameEn} ${verseRangeStr}`,
            text: shareText,
            files: [file],
          });
          setShareFeedback(lang === 'bn' ? 'শেয়ার করা হয়েছে!' : 'Shared!');
          return;
        }
        await navigator.share({
          title: `${target.surahNameEn} ${verseRangeStr}`,
          text: shareText,
        });
        setShareFeedback(lang === 'bn' ? 'শেয়ার করা হয়েছে!' : 'Shared!');
        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setShareFeedback(lang === 'bn' ? 'আয়াত ও অনুবাদ কপি হয়েছে!' : 'Verse copied to clipboard!');
      }
    } catch {
      // ignore user-cancelled share dialog
    } finally {
      setExporting(false);
    }
  };

  const previewAspectClass =
    shapeMode === 'story'
      ? 'aspect-[9/16] max-w-[270px]'
      : shapeMode === 'portrait'
      ? 'aspect-[4/5] max-w-[330px]'
      : 'aspect-square max-w-[340px]';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={lang === 'bn' ? 'আয়াত কার্ড তৈরি' : 'Verse image'}
      data-testid="verse-image-modal"
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div className="bg-[#faf7f0] rounded-2xl border border-[#ebe6da] shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        {/* Modal Top Header */}
        <div className="sticky top-0 z-10 bg-[#faf7f0]/95 backdrop-blur-xs px-5 py-4 border-b border-[#ebe6da] flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-[#1f2421]">
            {lang === 'bn' ? 'আয়াত কার্ড তৈরি করুন (Verse Image)' : 'Verse image'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
            className="w-8 h-8 rounded-full bg-[#efeae0] hover:bg-[#e5ded0] text-[#494e45] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Live Card Preview Stage */}
          <div className="flex justify-center">
            <div
              data-testid="verse-card-preview"
              style={{
                background: `linear-gradient(155deg, ${activeTheme.bgTop}, ${activeTheme.bgBottom})`,
                color: activeTheme.textColor,
              }}
              className={`w-full ${previewAspectClass} rounded-2xl p-3 shadow-xl relative flex flex-col justify-between transition-all`}
            >
              {/* Double Ornamental Frame */}
              <div
                style={{ borderColor: activeTheme.borderColor }}
                className="flex-1 rounded-xl border border-opacity-70 p-4 sm:p-5 flex flex-col justify-between relative"
              >
                {/* 4 Corner Geometric Stars */}
                <EightPointStarSvg color={activeTheme.accentColor} className="w-3.5 h-3.5 absolute top-2 left-2" />
                <EightPointStarSvg color={activeTheme.accentColor} className="w-3.5 h-3.5 absolute top-2 right-2" />
                <EightPointStarSvg color={activeTheme.accentColor} className="w-3.5 h-3.5 absolute bottom-2 left-2" />
                <EightPointStarSvg color={activeTheme.accentColor} className="w-3.5 h-3.5 absolute bottom-2 right-2" />

                {/* Top Surah Calligraphy */}
                <div className="text-center pt-1">
                  <p
                    style={{ color: activeTheme.accentColor }}
                    className="font-arabic text-xl sm:text-2xl font-bold"
                  >
                    {surahCalligraphyTitle}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-1.5 opacity-70">
                    <span
                      style={{ backgroundColor: activeTheme.accentColor }}
                      className="h-px w-12 sm:w-16"
                    />
                    <span
                      style={{ backgroundColor: activeTheme.accentColor }}
                      className="w-2 h-2 rotate-45 inline-block"
                    />
                    <span
                      style={{ backgroundColor: activeTheme.accentColor }}
                      className="h-px w-12 sm:w-16"
                    />
                  </div>
                </div>

                {/* Verse Body */}
                <div className="my-auto py-3 space-y-3 text-center overflow-y-auto max-h-[260px]">
                  {loadingSurah ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin opacity-70" />
                    </div>
                  ) : (
                    <>
                      {(showMode === 'both' || showMode === 'arabic') && (
                        <p
                          dir="rtl"
                          style={{
                            color: activeTheme.textColor,
                            fontSize: `${Math.round(18 * scale)}px`,
                          }}
                          className="font-arabic leading-loose"
                        >
                          {combinedArabic}
                        </p>
                      )}

                      {showMode === 'both' && (
                        <div className="flex justify-center">
                          <span
                            style={{ backgroundColor: activeTheme.accentColor }}
                            className="w-10 h-0.5 rounded-full opacity-75"
                          />
                        </div>
                      )}

                      {(showMode === 'both' || showMode === 'translation') && (
                        <p
                          style={{
                            color: activeTheme.subTextColor,
                            fontSize: `${Math.round(12.5 * scale)}px`,
                          }}
                          className="leading-relaxed font-medium"
                        >
                          {combinedTranslation}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Card Footer */}
                <div className="flex items-end justify-between gap-2 pt-2 text-left">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold truncate">
                      {translationLang === 'bn'
                        ? `${target.surahNameBn} · ${verseRangeStr}`
                        : `${target.surahNameEn} · ${verseRangeStr}`}
                    </p>
                    <p style={{ color: activeTheme.subTextColor }} className="text-[10px] opacity-80">
                      {translationLang === 'bn' ? 'বাংলা অনুবাদ' : 'Saheeh International'}
                    </p>
                  </div>

                  <div
                    style={{
                      backgroundColor: activeTheme.badgeBg,
                      borderColor: activeTheme.borderColor,
                      color: activeTheme.accentColor,
                    }}
                    className="px-2.5 py-1 rounded-lg border text-[10px] font-bold shrink-0"
                  >
                    Islamic Life
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons: Download & Share */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              data-testid="verse-image-download-btn"
              onClick={handleDownload}
              disabled={exporting}
              className="py-3 px-4 rounded-xl bg-[#8d671b] hover:bg-[#755413] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{lang === 'bn' ? 'ডাউনলোড (PNG)' : 'Download'}</span>
            </button>

            <button
              type="button"
              data-testid="verse-image-share-btn"
              onClick={handleShare}
              disabled={exporting}
              className="py-3 px-4 rounded-xl bg-white border border-[#e3dccb] hover:border-[#b58328] text-[#1f2421] text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
            >
              {shareFeedback ? (
                <Check className="w-4 h-4 text-[#087653]" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
              <span>{shareFeedback || (lang === 'bn' ? 'শেয়ার করুন' : 'Share')}</span>
            </button>
          </div>

          {/* Controls Container */}
          <div className="bg-white rounded-2xl border border-[#ebe6da] p-4 sm:p-5 space-y-5">
            {/* Verses Range */}
            <div>
              <p className="text-xs font-semibold text-[#5a6058] mb-2">
                {lang === 'bn' ? 'আয়াত পরিসর (Verses)' : 'Verses'}
              </p>
              <div className="flex items-center gap-2.5">
                <div className="flex-1">
                  <span className="block text-[11px] text-[#7a7f75] text-center mb-1">
                    {lang === 'bn' ? 'শুরু আয়াত' : 'From ayah'}
                  </span>
                  <div className="flex items-center justify-between border border-[#ebe6da] rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setFromAyah((v) => Math.max(1, v - 1))}
                      disabled={fromAyah <= 1}
                      aria-label="Decrease start ayah"
                      className="w-8 h-8 rounded-lg bg-[#f3efe4] hover:bg-[#e7e0ce] disabled:opacity-40 flex items-center justify-center cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono-tabular text-sm font-bold text-[#1f2421]">
                      {fromAyah}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFromAyah((v) => Math.min(toAyah, v + 1))}
                      disabled={fromAyah >= toAyah}
                      aria-label="Increase start ayah"
                      className="w-8 h-8 rounded-lg bg-[#f3efe4] hover:bg-[#e7e0ce] disabled:opacity-40 flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <span className="text-[#7a7f75] pt-5">→</span>

                <div className="flex-1">
                  <span className="block text-[11px] text-[#7a7f75] text-center mb-1">
                    {lang === 'bn' ? 'শেষ আয়াত' : 'To ayah'}
                  </span>
                  <div className="flex items-center justify-between border border-[#ebe6da] rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setToAyah((v) => Math.max(fromAyah, v - 1))}
                      disabled={toAyah <= fromAyah}
                      aria-label="Decrease end ayah"
                      className="w-8 h-8 rounded-lg bg-[#f3efe4] hover:bg-[#e7e0ce] disabled:opacity-40 flex items-center justify-center cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono-tabular text-sm font-bold text-[#1f2421]">
                      {toAyah}
                    </span>
                    <button
                      type="button"
                      onClick={() => setToAyah((v) => Math.min(totalAyahs, v + 1))}
                      disabled={toAyah >= totalAyahs}
                      aria-label="Increase end ayah"
                      className="w-8 h-8 rounded-lg bg-[#f3efe4] hover:bg-[#e7e0ce] disabled:opacity-40 flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-[#7a7f75] mt-1.5">
                {lang === 'bn'
                  ? 'একাধিক আয়াত একসাথে কার্ডে রাখতে সংখ্যা বাড়ান বা কমান।'
                  : 'Add the ayahs before or after to make one image.'}
              </p>
            </div>

            {/* Show Mode */}
            <div>
              <p className="text-xs font-semibold text-[#5a6058] mb-2">
                {lang === 'bn' ? 'দেখান (Show)' : 'Show'}
              </p>
              <div className="grid grid-cols-3 gap-1 bg-[#f0ece1] p-1 rounded-xl text-xs">
                {(
                  [
                    ['both', lang === 'bn' ? 'আরবি ও অনুবাদ' : 'Both'],
                    ['arabic', lang === 'bn' ? 'শুধু আরবি' : 'Arabic'],
                    ['translation', lang === 'bn' ? 'শুধু অনুবাদ' : 'Translation'],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setShowMode(mode)}
                    className={`py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                      showMode === mode
                        ? 'bg-white text-[#1f2421] shadow-xs'
                        : 'text-[#5a6058] hover:text-[#1f2421]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Shape */}
            <div>
              <p className="text-xs font-semibold text-[#5a6058] mb-2">
                {lang === 'bn' ? 'কার্ডের আকার (Shape)' : 'Shape'}
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {(
                  [
                    {
                      id: 'story' as const,
                      title: lang === 'bn' ? 'স্টোরি' : 'Story',
                      sub: lang === 'bn' ? 'হোয়াটসঅ্যাপ ও স্ট্যাটাস' : 'WhatsApp status, stories',
                      Icon: RectangleVertical,
                    },
                    {
                      id: 'portrait' as const,
                      title: lang === 'bn' ? 'পোর্ট্রেট' : 'Portrait',
                      sub: lang === 'bn' ? 'ফেসবুক ও ইনস্টাগ্রাম' : 'Instagram, Facebook posts',
                      Icon: RectangleHorizontal,
                    },
                    {
                      id: 'square' as const,
                      title: lang === 'bn' ? 'বর্গাকার' : 'Square',
                      sub: lang === 'bn' ? 'চ্যাট ও শেয়ারিং' : 'Chats, X, Facebook',
                      Icon: Square,
                    },
                  ] as const
                ).map(({ id, title, sub, Icon }) => {
                  const selected = shapeMode === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setShapeMode(id)}
                      className={`p-3 rounded-xl border text-center transition-colors cursor-pointer flex flex-col items-center gap-1 ${
                        selected
                          ? 'bg-[#faf6ea] border-[#9f7524] text-[#8b6114]'
                          : 'bg-white border-[#ebe6da] text-[#494e45] hover:border-[#b58328]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-bold">{title}</span>
                      <span className="text-[10px] text-[#7a7f75] leading-tight">{sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Style Swatches */}
            <div>
              <p className="text-xs font-semibold text-[#5a6058] mb-2">
                {lang === 'bn' ? 'থিম স্টাইল (Style)' : 'Style'}
              </p>
              <div className="grid grid-cols-6 gap-2">
                {CARD_THEMES.map((t) => {
                  const active = themeId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-label={`Select ${t.id} card style`}
                      onClick={() => setThemeId(t.id)}
                      style={{
                        background: `linear-gradient(155deg, ${t.bgTop}, ${t.bgBottom})`,
                        color: t.textColor,
                      }}
                      className={`aspect-[3/4] rounded-xl p-1.5 flex flex-col items-center justify-center border-2 transition-transform cursor-pointer ${
                        active ? 'border-[#8d671b] scale-105 shadow-md' : 'border-transparent hover:scale-102'
                      }`}
                    >
                      <span
                        style={{ backgroundColor: t.accentColor }}
                        className="w-3 h-0.5 rounded-full mb-1"
                      />
                      <span className="font-arabic text-[9px] leading-tight text-center">
                        رَبَّنَا
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Text Size */}
            <div>
              <p className="text-xs font-semibold text-[#5a6058] mb-2">
                {lang === 'bn' ? 'ফন্ট সাইজ (Text size)' : 'Text size'}
              </p>
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setTextStep((s) => Math.max(0, s - 1))}
                  disabled={textStep <= 0}
                  className="px-4 py-2 rounded-xl bg-[#f3efe4] hover:bg-[#e7e0ce] disabled:opacity-40 text-xs font-bold text-[#1f2421] cursor-pointer"
                >
                  A−
                </button>
                <div className="flex items-center gap-2">
                  {TEXT_SCALES.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      aria-label={`Font scale step ${idx + 1}`}
                      onClick={() => setTextStep(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-colors cursor-pointer ${
                        textStep === idx ? 'bg-[#8d671b]' : 'bg-[#e3dccb]'
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setTextStep((s) => Math.min(TEXT_SCALES.length - 1, s + 1))}
                  disabled={textStep >= TEXT_SCALES.length - 1}
                  className="px-4 py-2 rounded-xl bg-[#f3efe4] hover:bg-[#e7e0ce] disabled:opacity-40 text-xs font-bold text-[#1f2421] cursor-pointer"
                >
                  A+
                </button>
              </div>
            </div>

            {/* Translation Language Selector */}
            <button
              type="button"
              onClick={() => setTranslationLang((prev) => (prev === 'bn' ? 'en' : 'bn'))}
              className="w-full rounded-xl bg-[#f3efe4] hover:bg-[#eae3d3] px-4 py-3 flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 text-left">
                <Globe className="w-4 h-4 text-[#7a7f75]" />
                <div>
                  <p className="text-[11px] text-[#7a7f75]">
                    {lang === 'bn' ? 'অনুবাদ ভাষা পরিবর্তন করুন' : 'Translation'}
                  </p>
                  <p className="text-xs font-bold text-[#1f2421]">
                    {translationLang === 'bn'
                      ? 'বাংলা · তাইসীরুল কুরআন (ট্যাপ করে English)'
                      : 'English · Saheeh International (Tap for বাংলা)'}
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#8d671b]">
                {translationLang === 'bn' ? 'BN → EN' : 'EN → BN'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
