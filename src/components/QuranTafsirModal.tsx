import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  ScrollText,
  X,
} from 'lucide-react';
import type { Ayah, Language, Surah } from '../types/islamic';

export type TafsirViewTab = 'both' | 'short' | 'detailed';

export interface TafsirModalState {
  mode: 'surah' | 'ayah';
  surah: Surah;
  ayahNumber?: number;
  returnToSurah?: boolean;
}

interface QuranTafsirModalProps {
  modal: TafsirModalState | null;
  lang: Language;
  loading: boolean;
  error: string | null;
  surahAyahs: Ayah[];
  activeAyah: Ayah | null;
  onClose: () => void;
  onRetry: () => void;
  onSelectAyah: (ayahNumber: number, fromSurahModal?: boolean) => void;
  onBackToSurah: () => void;
  playingAyahNumber?: number | null;
  loadingAudioAyahNumber?: number | null;
  onPlayAyah?: (surahNumber: number, ayahNumber: number) => void;
}

const MODAL_SURAH_PAGE_SIZE = 10;

export function cleanAyahArabic(arabic: string, surahNumber: number, ayahNumber: number): string {
  let text = arabic.replace(/^\uFEFF/, '');
  if (surahNumber > 1 && surahNumber !== 9 && ayahNumber === 1) {
    text = text.replace(/^بِسْمِ\s+[ٱا]للَّ?هِ\s+[ٱا]لرَّحْمَٰنِ\s+[ٱا]لرَّحِيمِ\s+/, '');
  }
  return text;
}

export function QuranTafsirModal({
  modal,
  lang,
  loading,
  error,
  surahAyahs,
  activeAyah,
  onClose,
  onRetry,
  onSelectAyah,
  onBackToSurah,
  playingAyahNumber,
  loadingAudioAyahNumber,
  onPlayAyah,
}: QuranTafsirModalProps) {
  const [viewTab, setViewTab] = useState<TafsirViewTab>('both');
  const [tafsirLang, setTafsirLang] = useState<Language>(lang);
  const [surahPage, setSurahPage] = useState<number>(1);
  const [ayahFilterInput, setAyahFilterInput] = useState<string>('');
  const scrollBodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setTafsirLang(lang);
  }, [lang]);

  useEffect(() => {
    if (!modal) return;
    setSurahPage(1);
    setAyahFilterInput('');
  }, [modal?.mode, modal?.surah.surah_number]);

  useEffect(() => {
    if (!modal) return;
    scrollBodyRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [modal?.mode, modal?.surah.surah_number, modal?.ayahNumber, surahPage]);

  // Escape key & body scroll lock
  useEffect(() => {
    if (!modal) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [modal, onClose]);

  const filteredSurahAyahs = useMemo(() => {
    const q = ayahFilterInput.trim();
    if (!q) return surahAyahs;
    const num = Number(q);
    if (Number.isInteger(num) && num >= 1) {
      return surahAyahs.filter((a) => a.ayah_number === num);
    }
    const lower = q.toLowerCase();
    return surahAyahs.filter(
      (a) =>
        a.translation_bn.toLowerCase().includes(lower) ||
        a.translation_en.toLowerCase().includes(lower) ||
        (a.short_tafsir_bn || '').toLowerCase().includes(lower) ||
        (a.short_tafsir_en || '').toLowerCase().includes(lower)
    );
  }, [surahAyahs, ayahFilterInput]);

  const totalModalPages = Math.max(1, Math.ceil(filteredSurahAyahs.length / MODAL_SURAH_PAGE_SIZE));
  const clampedSurahPage = Math.min(surahPage, totalModalPages);
  const pagedSurahAyahs = useMemo(() => {
    const start = (clampedSurahPage - 1) * MODAL_SURAH_PAGE_SIZE;
    return filteredSurahAyahs.slice(start, start + MODAL_SURAH_PAGE_SIZE);
  }, [filteredSurahAyahs, clampedSurahPage]);

  if (!modal) return null;

  const { mode, surah, ayahNumber, returnToSurah } = modal;
  const totalAyahs = surah.total_ayahs || surahAyahs.length;
  const currentAyahNum = activeAyah?.ayah_number ?? ayahNumber ?? 1;

  const renderTafsirBlocks = (ayah: Ayah) => {
    const shortText =
      tafsirLang === 'bn'
        ? ayah.short_tafsir_bn || ayah.short_tafsir_en || ''
        : ayah.short_tafsir_en || ayah.short_tafsir_bn || '';
    const fullText =
      tafsirLang === 'bn'
        ? ayah.tafsir_bn || ayah.tafsir_en || ''
        : ayah.tafsir_en || ayah.tafsir_bn || '';

    return (
      <div className="space-y-3 mt-4">
        {(viewTab === 'both' || viewTab === 'short') && (
          <div
            data-testid={`modal-short-tafsir-${ayah.ayah_number}`}
            className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] p-4"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#b58328]">
                <ScrollText className="w-3.5 h-3.5" />
                {tafsirLang === 'bn'
                  ? 'সংক্ষিপ্ত তাফসির (আল-মুখতাসার)'
                  : 'Short Tafsir (Al-Mukhtasar)'}
              </span>
              <span className="text-[11px] font-mono-tabular text-[#6d7a72]">
                {surah.surah_number}:{ayah.ayah_number}
              </span>
            </div>
            {shortText ? (
              <p className="text-sm text-[#2d453b] leading-relaxed whitespace-pre-line">
                {shortText}
              </p>
            ) : (
              <p className="text-xs text-[#6d7a72] italic">
                {tafsirLang === 'bn'
                  ? 'এই আয়াতের সংক্ষিপ্ত তাফসির পাওয়া যায়নি।'
                  : 'Short tafsir is not available for this ayah.'}
              </p>
            )}
          </div>
        )}

        {(viewTab === 'both' || viewTab === 'detailed') && (
          <div
            data-testid={`modal-detailed-tafsir-${ayah.ayah_number}`}
            className="rounded-xl bg-[#eef5f0]/65 border border-[#087653]/25 p-4"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#064b37]">
                <BookOpen className="w-3.5 h-3.5" />
                {tafsirLang === 'bn'
                  ? 'বিস্তারিত তাফসির (তাফসীরে ইবনে কাসীর)'
                  : 'Detailed Tafsir (Tafsir Ibn Kathir)'}
              </span>
              <span className="text-[11px] font-mono-tabular text-[#087653]">
                {surah.surah_number}:{ayah.ayah_number}
              </span>
            </div>
            {fullText ? (
              <p className="text-sm text-[#183027] leading-relaxed whitespace-pre-line">
                {fullText}
              </p>
            ) : (
              <p className="text-xs text-[#5a7066] italic">
                {tafsirLang === 'bn'
                  ? 'এই আয়াতের বিস্তারিত তাফসির পাওয়া যায়নি।'
                  : 'Detailed tafsir is not available for this ayah.'}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quran-tafsir-modal-title"
      data-testid="quran-tafsir-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-[#183027]/45 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
    >
      <div className="bg-white border border-[#ebe6da] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <header className="px-4 sm:px-5 py-3.5 sm:py-4 bg-[#faf7f0] border-b border-[#ebe6da] flex items-start justify-between gap-3 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#5a7066]">
              {mode === 'ayah' && returnToSurah && (
                <button
                  type="button"
                  onClick={onBackToSurah}
                  className="inline-flex items-center gap-1 text-[#087653] hover:text-[#064b37] font-semibold cursor-pointer mr-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'সূরা তাফসিরে ফিরুন' : 'Back to Surah Tafsir'}</span>
                </button>
              )}
              <span className="font-mono-tabular font-semibold text-[#087653]">
                {mode === 'ayah'
                  ? `${lang === 'bn' ? 'সূরা' : 'Surah'} ${surah.surah_number}:${currentAyahNum}`
                  : `${lang === 'bn' ? 'সূরা' : 'Surah'} ${surah.surah_number}`}
              </span>
              <span aria-hidden="true">·</span>
              <span>{surah.revelation_type}</span>
              <span aria-hidden="true">·</span>
              <span>
                {surah.total_ayahs} {lang === 'bn' ? 'আয়াত' : 'Ayahs'}
              </span>
            </div>

            <h2
              id="quran-tafsir-modal-title"
              className="font-display text-lg sm:text-xl font-bold text-[#183027] mt-1 flex flex-wrap items-center gap-2"
            >
              <span>
                {lang === 'bn' ? surah.name_bn : surah.name_en}
                {mode === 'ayah'
                  ? ` — ${lang === 'bn' ? `আয়াত ${currentAyahNum}` : `Ayah ${currentAyahNum}`}`
                  : ` — ${lang === 'bn' ? 'সম্পূর্ণ সূরা তাফসির' : 'Complete Surah Tafsir'}`}
              </span>
              <span className="font-arabic text-[#087653] font-normal text-xl">{surah.name_ar}</span>
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            data-testid="close-tafsir-modal"
            aria-label={lang === 'bn' ? 'মোডাল বন্ধ করুন' : 'Close Tafsir modal'}
            className="p-2 rounded-lg border border-[#ebe6da] bg-white text-[#5a7066] hover:text-[#183027] hover:border-[#087653] cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Controls Bar: Both / Short / Detailed + Language Switch */}
        <div className="px-5 py-3 bg-white border-b border-[#ebe6da] flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div
            role="tablist"
            aria-label={lang === 'bn' ? 'তাফসিরের ধরন' : 'Tafsir Version'}
            className="inline-flex bg-[#f5efe0] p-0.5 rounded-lg text-xs"
          >
            {(
              [
                ['both', lang === 'bn' ? 'উভয় তাফসির' : 'Both Versions'],
                ['short', lang === 'bn' ? 'সংক্ষিপ্ত তাফসির' : 'Short Tafsir'],
                ['detailed', lang === 'bn' ? 'বিস্তারিত তাফসির' : 'Detailed Tafsir'],
              ] as const
            ).map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={viewTab === tab}
                onClick={() => setViewTab(tab)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  viewTab === tab
                    ? 'bg-[#087653] text-white font-semibold shadow-xs'
                    : 'text-[#5a7066] hover:text-[#183027]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {mode === 'surah' && (
              <input
                type="text"
                value={ayahFilterInput}
                onChange={(e) => {
                  setAyahFilterInput(e.target.value);
                  setSurahPage(1);
                }}
                placeholder={lang === 'bn' ? 'আয়াত নং বা শব্দ...' : 'Filter ayah # or word...'}
                aria-label={lang === 'bn' ? 'তাফসিরে আয়াত খুঁজুন' : 'Filter ayahs in Surah Tafsir'}
                className="w-36 sm:w-44 px-2.5 py-1.5 text-xs rounded-lg border border-[#ebe6da] bg-[#faf7f0] focus:outline-none focus:border-[#087653]"
              />
            )}

            <div
              role="group"
              aria-label={lang === 'bn' ? 'তাফসিরের ভাষা' : 'Tafsir Language'}
              className="inline-flex bg-[#f5efe0] p-0.5 rounded-lg text-xs"
            >
              {(['bn', 'en'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setTafsirLang(l)}
                  className={`px-2.5 py-1.5 rounded-md font-semibold cursor-pointer ${
                    tafsirLang === l
                      ? 'bg-white text-[#087653] shadow-xs'
                      : 'text-[#5a7066] hover:text-[#183027]'
                  }`}
                >
                  {l === 'bn' ? 'বাংলা' : 'English'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div ref={scrollBodyRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-sm text-[#5a7066]">
              <Loader2 className="w-6 h-6 text-[#087653] animate-spin" />
              <span>
                {lang === 'bn'
                  ? 'সংক্ষিপ্ত ও বিস্তারিত তাফসির লোড হচ্ছে...'
                  : 'Fetching Short & Detailed Tafsir...'}
              </span>
            </div>
          ) : error ? (
            <div className="py-14 text-center space-y-3">
              <p className="text-sm text-[#b91c1c]">{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#087653] text-white text-xs font-semibold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}</span>
              </button>
            </div>
          ) : mode === 'ayah' ? (
            activeAyah ? (
              <div>
                <div className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] p-4 sm:p-5">
                  {onPlayAyah && (
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-mono-tabular text-xs font-semibold text-[#087653]">
                        {surah.surah_number}:{activeAyah.ayah_number}
                      </span>
                      <button
                        type="button"
                        onClick={() => onPlayAyah(surah.surah_number, activeAyah.ayah_number)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                          playingAyahNumber === activeAyah.ayah_number
                            ? 'bg-[#087653] border-[#087653] text-white'
                            : 'bg-white border-[#ebe6da] text-[#087653] hover:border-[#087653]'
                        }`}
                      >
                        {loadingAudioAyahNumber === activeAyah.ayah_number ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : playingAyahNumber === activeAyah.ayah_number ? (
                          <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {playingAyahNumber === activeAyah.ayah_number
                            ? lang === 'bn'
                              ? 'বিরতি দিন'
                              : 'Pause Ayah'
                            : lang === 'bn'
                            ? 'তেলাওয়াত শুনুন'
                            : 'Play Ayah'}
                        </span>
                      </button>
                    </div>
                  )}
                  <p className="font-arabic text-2xl sm:text-3xl text-[#183027] text-right leading-loose">
                    {cleanAyahArabic(activeAyah.arabic, surah.surah_number, activeAyah.ayah_number)}
                  </p>
                  <p className="text-base text-[#183027] font-medium mt-4 leading-relaxed">
                    {tafsirLang === 'bn' ? activeAyah.translation_bn : activeAyah.translation_en}
                  </p>
                  <p className="text-xs text-[#5a7066] mt-1.5 leading-relaxed">
                    {tafsirLang === 'bn' ? activeAyah.translation_en : activeAyah.translation_bn}
                  </p>
                </div>

                {renderTafsirBlocks(activeAyah)}
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-[#5a7066]">
                {lang === 'bn' ? 'আয়াতের তথ্য পাওয়া যায়নি।' : 'Ayah details not available.'}
              </p>
            )
          ) : (
            /* Surah-level Tafsir View */
            <div className="space-y-4">
              <div className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] p-4 text-xs sm:text-sm text-[#3c4f44] flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-[#183027]">
                    {lang === 'bn' ? surah.meaning_bn : surah.meaning_en}
                  </span>
                  <span className="mx-2 text-[#b8b1a1]">•</span>
                  <span>
                    {lang === 'bn'
                      ? 'যেকোনো আয়াতের উপর ক্লিক করে আলাদাভাবে পড়ুন'
                      : 'Click any Ayah card below to focus its individual Tafsir'}
                  </span>
                </div>
                <span className="font-mono-tabular text-xs text-[#087653] font-semibold">
                  {filteredSurahAyahs.length} / {totalAyahs} {lang === 'bn' ? 'আয়াত' : 'Ayahs'}
                </span>
              </div>

              {pagedSurahAyahs.length === 0 ? (
                <p className="py-10 text-center text-sm text-[#5a7066]">
                  {lang === 'bn' ? 'মিল পাওয়া যায়নি।' : 'No matching verses found.'}
                </p>
              ) : (
                pagedSurahAyahs.map((ayah) => (
                  <div
                    key={`modal-surah-${surah.surah_number}-${ayah.ayah_number}`}
                    className="rounded-xl border border-[#ebe6da] bg-white p-4 sm:p-5 hover:border-[#087653]/45 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-tabular text-xs font-bold px-2.5 py-1 rounded-md bg-[#eef5f0] text-[#087653]">
                          {surah.surah_number}:{ayah.ayah_number}
                        </span>
                        {onPlayAyah && (
                          <button
                            type="button"
                            onClick={() => onPlayAyah(surah.surah_number, ayah.ayah_number)}
                            aria-label={lang === 'bn' ? 'আয়াত তেলাওয়াত শুনুন' : 'Play Ayah audio'}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] font-semibold transition-colors cursor-pointer ${
                              playingAyahNumber === ayah.ayah_number
                                ? 'bg-[#087653] border-[#087653] text-white'
                                : 'bg-[#faf7f0] border-[#ebe6da] text-[#087653] hover:border-[#087653]'
                            }`}
                          >
                            {loadingAudioAyahNumber === ayah.ayah_number ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : playingAyahNumber === ayah.ayah_number ? (
                              <Pause className="w-3 h-3" />
                            ) : (
                              <Play className="w-3 h-3" />
                            )}
                            <span>{lang === 'bn' ? 'শুনুন' : 'Listen'}</span>
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectAyah(ayah.ayah_number, true)}
                        className="text-xs font-semibold text-[#087653] hover:text-[#064b37] cursor-pointer"
                      >
                        {lang === 'bn' ? 'একক আয়াতে খুলুন →' : 'Open Ayah View →'}
                      </button>
                    </div>

                    <p className="font-arabic text-2xl text-[#183027] text-right leading-loose">
                      {cleanAyahArabic(ayah.arabic, surah.surah_number, ayah.ayah_number)}
                    </p>
                    <p className="text-sm text-[#183027] font-medium mt-3">
                      {tafsirLang === 'bn' ? ayah.translation_bn : ayah.translation_en}
                    </p>

                    {renderTafsirBlocks(ayah)}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <footer className="px-5 py-3 bg-[#faf7f0] border-t border-[#ebe6da] flex items-center justify-between gap-3 shrink-0 text-xs">
          {mode === 'ayah' ? (
            <>
              <button
                type="button"
                data-testid="modal-prev-ayah"
                disabled={currentAyahNum <= 1 || loading}
                onClick={() => onSelectAyah(currentAyahNum - 1, returnToSurah)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#ebe6da] bg-white font-medium text-[#183027] disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{lang === 'bn' ? 'পূর্ববর্তী আয়াত' : 'Previous Ayah'}</span>
              </button>
              <span className="font-mono-tabular text-[#5a7066]">
                {lang === 'bn'
                  ? `আয়াত ${currentAyahNum} / ${totalAyahs}`
                  : `Ayah ${currentAyahNum} of ${totalAyahs}`}
              </span>
              <button
                type="button"
                data-testid="modal-next-ayah"
                disabled={currentAyahNum >= totalAyahs || loading}
                onClick={() => onSelectAyah(currentAyahNum + 1, returnToSurah)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#ebe6da] bg-white font-medium text-[#183027] disabled:opacity-40 cursor-pointer"
              >
                <span>{lang === 'bn' ? 'পরবর্তী আয়াত' : 'Next Ayah'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={clampedSurahPage <= 1 || loading}
                onClick={() => setSurahPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#ebe6da] bg-white font-medium text-[#183027] disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{lang === 'bn' ? 'পূর্ববর্তী' : 'Prev'}</span>
              </button>
              <span className="font-mono-tabular text-[#5a7066]">
                {lang === 'bn'
                  ? `পৃষ্ঠা ${clampedSurahPage} / ${totalModalPages}`
                  : `Page ${clampedSurahPage} of ${totalModalPages}`}
              </span>
              <button
                type="button"
                disabled={clampedSurahPage >= totalModalPages || loading}
                onClick={() => setSurahPage((p) => Math.min(totalModalPages, p + 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#ebe6da] bg-white font-medium text-[#183027] disabled:opacity-40 cursor-pointer"
              >
                <span>{lang === 'bn' ? 'পরবর্তী' : 'Next'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
