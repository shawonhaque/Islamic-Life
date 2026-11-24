import {
  Loader2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  SkipBack,
  SkipForward,
  Square,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { Language, QuranReciter, Surah } from '../types/islamic';

export const QURAN_RECITERS: QuranReciter[] = [
  {
    id: 'ar.alafasy',
    name_en: 'Mishary Rashid Alafasy',
    name_bn: 'মিশারী রশিদ আল-আফাসী',
    style: 'Murattal',
  },
  {
    id: 'ar.husary',
    name_en: 'Mahmoud Khalil Al-Husary',
    name_bn: 'মাহমুদ খলিল আল-হুসারী',
    style: 'Murattal',
  },
  {
    id: 'ar.abdulbasitmurattal',
    name_en: 'Abdul Basit Abdus Samad',
    name_bn: 'আব্দুল বাসিত আব্দুস সামাদ',
    style: 'Murattal',
  },
  {
    id: 'ar.minshawi',
    name_en: 'Mohamed Siddiq Al-Minshawi',
    name_bn: 'মুহাম্মদ সিদ্দীক আল-মিনশাভী',
    style: 'Murattal',
  },
];

export type AudioRepeatMode = 'off' | 'ayah' | 'surah';

interface QuranAudioPlayerProps {
  lang: Language;
  surah: Surah;
  reciterId: string;
  isPlaying: boolean;
  isLoading: boolean;
  activeAyahNumber: number | null;
  playMode: 'surah' | 'ayah';
  currentTime: number;
  duration: number;
  playbackRate: number;
  repeatMode: AudioRepeatMode;
  isMuted: boolean;
  error: string | null;
  onTogglePlaySurah: () => void;
  onStop: () => void;
  onPrevAyah: () => void;
  onNextAyah: () => void;
  onSeek: (time: number) => void;
  onChangeReciter: (reciterId: string) => void;
  onCycleRepeat: () => void;
  onCycleSpeed: () => void;
  onToggleMute: () => void;
  onRetry: () => void;
}

function formatAudioTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function QuranAudioPlayer({
  lang,
  surah,
  reciterId,
  isPlaying,
  isLoading,
  activeAyahNumber,
  playMode,
  currentTime,
  duration,
  playbackRate,
  repeatMode,
  isMuted,
  error,
  onTogglePlaySurah,
  onStop,
  onPrevAyah,
  onNextAyah,
  onSeek,
  onChangeReciter,
  onCycleRepeat,
  onCycleSpeed,
  onToggleMute,
  onRetry,
}: QuranAudioPlayerProps) {
  const currentReciter =
    QURAN_RECITERS.find((r) => r.id === reciterId) ?? QURAN_RECITERS[0];
  const hasActiveTrack = activeAyahNumber !== null;
  const maxDuration = duration > 0 ? duration : 0;
  const clampedTime = Math.min(currentTime, maxDuration || currentTime);

  return (
    <div
      data-testid="quran-audio-player"
      className="mt-4 rounded-xl bg-[#faf7f0] border border-[#ebe6da] p-3.5 sm:p-4 space-y-3"
    >
      {/* Top Row: Play Controls + Active Info + Reciter Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            data-testid="audio-play-surah-btn"
            onClick={onTogglePlaySurah}
            disabled={isLoading}
            aria-label={
              isPlaying
                ? lang === 'bn'
                  ? 'তেলাওয়াত বিরতি দিন'
                  : 'Pause recitation'
                : lang === 'bn'
                ? 'সূরা তেলাওয়াত শুনুন'
                : 'Play Surah recitation'
            }
            className="w-10 h-10 rounded-full bg-[#087653] hover:bg-[#065c41] text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              data-testid="audio-prev-btn"
              onClick={onPrevAyah}
              disabled={!hasActiveTrack || activeAyahNumber <= 1 || isLoading}
              title={lang === 'bn' ? 'পূর্ববর্তী আয়াত' : 'Previous Ayah'}
              aria-label={lang === 'bn' ? 'পূর্ববর্তী আয়াত' : 'Previous Ayah'}
              className="p-2 rounded-lg border border-[#ebe6da] bg-white text-[#183027] hover:border-[#087653] disabled:opacity-40 cursor-pointer"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              data-testid="audio-next-btn"
              onClick={onNextAyah}
              disabled={
                !hasActiveTrack ||
                activeAyahNumber >= surah.total_ayahs ||
                isLoading
              }
              title={lang === 'bn' ? 'পরবর্তী আয়াত' : 'Next Ayah'}
              aria-label={lang === 'bn' ? 'পরবর্তী আয়াত' : 'Next Ayah'}
              className="p-2 rounded-lg border border-[#ebe6da] bg-white text-[#183027] hover:border-[#087653] disabled:opacity-40 cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
            {hasActiveTrack && (
              <button
                type="button"
                data-testid="audio-stop-btn"
                onClick={onStop}
                title={lang === 'bn' ? 'বন্ধ করুন' : 'Stop playback'}
                aria-label={lang === 'bn' ? 'বন্ধ করুন' : 'Stop playback'}
                className="p-2 rounded-lg border border-[#ebe6da] bg-white text-[#5a7066] hover:text-[#b91c1c] hover:border-[#b91c1c]/40 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="min-w-0 ml-1">
            <p
              data-testid="audio-now-playing"
              className="text-xs font-semibold text-[#183027] truncate"
            >
              {isLoading
                ? lang === 'bn'
                  ? 'অডিও লোড হচ্ছে...'
                  : 'Loading audio...'
                : hasActiveTrack
                ? lang === 'bn'
                  ? `চলছে: ${surah.name_bn} · আয়াত ${activeAyahNumber}/${surah.total_ayahs}${
                      playMode === 'ayah' ? ' (একক আয়াত)' : ''
                    }`
                  : `Playing: ${surah.name_en} · Ayah ${activeAyahNumber}/${surah.total_ayahs}${
                      playMode === 'ayah' ? ' (Single)' : ''
                    }`
                : lang === 'bn'
                ? `${surah.name_bn} — অডিও তেলাওয়াত`
                : `${surah.name_en} — Audio Recitation`}
            </p>
            <p className="text-[11px] text-[#5a7066] truncate">
              {lang === 'bn' ? currentReciter.name_bn : currentReciter.name_en}
            </p>
          </div>
        </div>

        {/* Right Controls: Reciter + Speed + Repeat + Mute */}
        <div className="flex flex-wrap items-center gap-1.5">
          <select
            data-testid="audio-reciter-select"
            value={reciterId}
            onChange={(e) => onChangeReciter(e.target.value)}
            aria-label={lang === 'bn' ? 'কারি নির্বাচন করুন' : 'Select Reciter'}
            className="px-2.5 py-1.5 rounded-lg border border-[#ebe6da] bg-white text-xs font-medium text-[#183027] focus:outline-none focus:border-[#087653] cursor-pointer max-w-[190px]"
          >
            {QURAN_RECITERS.map((rec) => (
              <option key={rec.id} value={rec.id}>
                {lang === 'bn' ? rec.name_bn : rec.name_en}
              </option>
            ))}
          </select>

          <button
            type="button"
            data-testid="audio-speed-btn"
            onClick={onCycleSpeed}
            title={lang === 'bn' ? 'গতি পরিবর্তন করুন' : 'Playback speed'}
            aria-label={lang === 'bn' ? 'তেলাওয়াতের গতি' : 'Playback speed'}
            className="px-2 py-1.5 rounded-lg border border-[#ebe6da] bg-white font-mono-tabular text-[11px] font-semibold text-[#183027] hover:border-[#087653] cursor-pointer"
          >
            {playbackRate}x
          </button>

          <button
            type="button"
            data-testid="audio-repeat-btn"
            onClick={onCycleRepeat}
            title={
              repeatMode === 'ayah'
                ? lang === 'bn'
                  ? 'আয়াত পুনরাবৃত্তি চালু'
                  : 'Repeat Ayah'
                : repeatMode === 'surah'
                ? lang === 'bn'
                  ? 'সূরা পুনরাবৃত্তি চালু'
                  : 'Repeat Surah'
                : lang === 'bn'
                ? 'পুনরাবৃত্তি বন্ধ'
                : 'Repeat Off'
            }
            aria-label={lang === 'bn' ? 'পুনরাবৃত্তি মোড' : 'Repeat mode'}
            className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
              repeatMode !== 'off'
                ? 'bg-[#087653] border-[#087653] text-white'
                : 'bg-white border-[#ebe6da] text-[#5a7066] hover:border-[#087653]'
            }`}
          >
            {repeatMode === 'ayah' ? (
              <Repeat1 className="w-3.5 h-3.5" />
            ) : (
              <Repeat className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {repeatMode === 'ayah'
                ? lang === 'bn'
                  ? 'আয়াত'
                  : 'Ayah'
                : repeatMode === 'surah'
                ? lang === 'bn'
                  ? 'সূরা'
                  : 'Surah'
                : lang === 'bn'
                ? 'রিপিট'
                : 'Repeat'}
            </span>
          </button>

          <button
            type="button"
            data-testid="audio-mute-btn"
            onClick={onToggleMute}
            aria-label={
              isMuted
                ? lang === 'bn'
                  ? 'শব্দ চালু করুন'
                  : 'Unmute audio'
                : lang === 'bn'
                ? 'নিঃশব্দ করুন'
                : 'Mute audio'
            }
            className="p-1.5 rounded-lg border border-[#ebe6da] bg-white text-[#5a7066] hover:text-[#183027] hover:border-[#087653] cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-[#b91c1c]" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Progress Scrubber Bar */}
      <div className="flex items-center gap-2.5 text-[11px] font-mono-tabular text-[#5a7066]">
        <span className="w-9 text-right shrink-0">{formatAudioTime(clampedTime)}</span>
        <input
          type="range"
          min={0}
          max={maxDuration || 100}
          step={0.1}
          value={maxDuration > 0 ? clampedTime : 0}
          disabled={!hasActiveTrack || maxDuration <= 0}
          onChange={(e) => onSeek(Number(e.target.value))}
          aria-label={lang === 'bn' ? 'অডিও সময় স্লাইডার' : 'Audio seek bar'}
          className="flex-1 h-1.5 accent-[#087653] cursor-pointer disabled:opacity-40"
        />
        <span className="w-9 shrink-0">{formatAudioTime(maxDuration)}</span>
      </div>

      {error && (
        <div
          data-testid="audio-error-banner"
          className="flex items-center justify-between gap-2 text-xs text-[#b91c1c] bg-[#fef2f2] border border-[#fecaca] rounded-lg px-3 py-2"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={onRetry}
            className="font-semibold underline cursor-pointer shrink-0"
          >
            {lang === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}
          </button>
        </div>
      )}
    </div>
  );
}
