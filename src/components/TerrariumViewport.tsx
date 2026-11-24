import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CloudFog,
  CloudRain,
  Eye,
  EyeOff,
  Flame,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  Moon,
  Radio,
  RotateCw,
  Sun,
  Sunrise,
  Sunset,
  X,
} from 'lucide-react';
import {
  mountTerrariumScene,
  type ProjectedPinPosition,
  type TerrariumController,
} from '../three/TerrariumScene';
import type {
  CameraPreset,
  CityLocation,
  Language,
  LightingPreset,
  TerrariumPinTelemetry,
  WeatherMode,
} from '../types/islamic';
import {
  PRESET_CITIES,
  LIGHTING_PRESET_HOURS,
  getLocationClock,
  getTerrariumLightingForHour,
} from '../utils/islamicMath';
import { safeReadJson } from '../utils/safeFetch';

interface TerrariumViewportProps {
  lang: Language;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  city?: CityLocation;
}

const LIGHTING_LABELS: Record<LightingPreset, { bn: string; en: string; hour: number }> = {
  fajr: { bn: 'ফজর (ভোর)', en: 'Fajr Dawn', hour: LIGHTING_PRESET_HOURS.fajr },
  dhuhr: { bn: 'যোহর (দুপুর)', en: 'Dhuhr Noon', hour: LIGHTING_PRESET_HOURS.dhuhr },
  asr: { bn: 'আসর (বিকাল)', en: 'Asr Golden', hour: LIGHTING_PRESET_HOURS.asr },
  maghrib: { bn: 'মাগরিব (সন্ধ্যা)', en: 'Maghrib Dusk', hour: LIGHTING_PRESET_HOURS.maghrib },
  isha: { bn: 'এশা (রাত)', en: 'Isha Night', hour: LIGHTING_PRESET_HOURS.isha },
};

const WEATHER_LABELS: Record<WeatherMode, { bn: string; en: string }> = {
  clear: { bn: 'স্বচ্ছ আকাশ', en: 'Clear' },
  rain: { bn: 'বৃষ্টি', en: 'Rain' },
  mist: { bn: 'কুয়াশা ও শিশির', en: 'Mist & Dew' },
};

const CAMERA_LABELS: Record<CameraPreset, { bn: string; en: string }> = {
  overview: { bn: 'সম্পূর্ণ দৃশ্য', en: 'Overview' },
  flora: { bn: 'উদ্ভিদ জুম', en: 'Flora' },
  soil: { bn: 'মাটির স্তর', en: 'Soil Strata' },
  fountain: { bn: 'জলাধার', en: 'Water Pond' },
  lantern: { bn: 'ফানুস', en: 'Lantern' },
  canopy: { bn: 'উপর থেকে', en: 'Top View' },
};

const TERRARIUM_PINS: TerrariumPinTelemetry[] = [
  {
    id: 'palm',
    labelBn: 'খেজুর গাছ (Date Palm)',
    labelEn: 'Date Palm Canopy',
    descBn:
      'টেরারিয়ামের কেন্দ্রস্থলে অবস্থিত ক্ষুদ্রাকৃতির বোটানিক্যাল পাম উদ্ভিদ, যা সালোকসংশ্লেষণের মাধ্যমে ভেতরের অক্সিজেন ও কার্বন চক্র সচল রাখে।',
    descEn:
      'Central botanical date palm driving photosynthesis, transpiration, and closed-loop oxygen equilibrium inside the glass biosphere.',
    moisture: '78%',
    lux: '4,500 lx',
    temp: '25.2°C',
    roleBn: 'অক্সিজেন উৎপাদক',
    roleEn: 'O₂ Producer',
    cameraPreset: 'flora',
  },
  {
    id: 'fountain',
    labelBn: 'জলাধার (Water Pond)',
    labelEn: 'Evaporative Pond',
    descBn:
      'স্বচ্ছ জলাধার যা বাষ্পীভবনের মাধ্যমে কাঁচের ভেতরের আদর্শ আর্দ্রতা (৭৫%-৮৫%) ধরে রাখে এবং রাতের আলোয় নীল আভা ছড়ায়।',
    descEn:
      'Reflective freshwater basin maintaining 75%–85% internal relative humidity through gentle evaporation and condensation.',
    moisture: '99%',
    lux: '2,100 lx',
    temp: '22.8°C',
    roleBn: 'আর্দ্রতা নিয়ন্ত্রক',
    roleEn: 'Humidity Core',
    cameraPreset: 'fountain',
  },
  {
    id: 'soil',
    labelBn: 'মাটির স্তর (Soil Strata)',
    labelEn: '3-Layer Soil Strata',
    descBn:
      '৩ স্তরের প্রাকৃতিক ফিল্টারেশন ব্যবস্থা: নিচে নুড়িপাথর (ড্রেনেজ), মাঝে অ্যাক্টিভেটেড চারকোল (বিশুদ্ধকরণ) এবং উপরে জৈব হিউমাস মাটি।',
    descEn:
      'Three-tier natural substrate cross-section: river pebbles for drainage, activated charcoal for filtration, and organic humus.',
    moisture: '68%',
    lux: '850 lx',
    temp: '23.4°C',
    roleBn: 'প্রাকৃতিক ফিল্টার',
    roleEn: 'Bio-Filtration',
    cameraPreset: 'soil',
  },
  {
    id: 'lantern',
    labelBn: 'পিতলের ফানুস (Lantern)',
    labelEn: 'Brass Garden Lantern',
    descBn:
      'মাগরিব ও এশার সময়ে উষ্ণ সোনালি আলো প্রদান করে, যা রাতের বায়োলুমিনিসেন্ট পরিবেশের সঙ্গে সামঞ্জস্যপূর্ণ।',
    descEn:
      'Handcrafted miniature brass lantern illuminating the sanctuary warmly during Maghrib twilight and Isha night hours.',
    moisture: '54%',
    lux: '1,650 lx',
    temp: '27.0°C',
    roleBn: 'সন্ধ্যার আলোকসজ্জা',
    roleEn: 'Night Beacon',
    cameraPreset: 'lantern',
  },
  {
    id: 'ferns',
    labelBn: 'ফার্ন ও মস (Ferns & Moss)',
    labelEn: 'Understory Ferns & Moss',
    descBn:
      'ছায়াপ্রিয় ভেলভেট মস ও ফার্ন উদ্ভিদ যা মাটির ক্ষয় রোধ করে এবং ভোর ও বৃষ্টির শিশির ধরে রাখে।',
    descEn:
      'Shade-adapted understory fern rosettes and velvet moss cushions trapping morning dew and stabilizing soil moisture.',
    moisture: '84%',
    lux: '1,920 lx',
    temp: '23.9°C',
    roleBn: 'শিশির ধারক',
    roleEn: 'Dew Retention',
    cameraPreset: 'flora',
  },
];

function getPrayerPhaseLabel(hour: number, lang: Language): string {
  if (hour < 4.8 || hour >= 19.2) return lang === 'bn' ? 'এশা (রাত)' : 'Isha Night';
  if (hour < 7.5) return lang === 'bn' ? 'ফজর (ভোর)' : 'Fajr Dawn';
  if (hour < 15.0) return lang === 'bn' ? 'যোহর (দুপুর)' : 'Dhuhr Noon';
  if (hour < 17.5) return lang === 'bn' ? 'আসর (বিকাল)' : 'Asr Golden';
  return lang === 'bn' ? 'মাগরিব (সন্ধ্যা)' : 'Maghrib Dusk';
}

export function TerrariumViewport({
  lang,
  fullscreen,
  onToggleFullscreen,
  city = PRESET_CITIES[0],
}: TerrariumViewportProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<TerrariumController | null>(null);
  const pinElsRef = useRef<Record<string, HTMLButtonElement | null>>({});

  const [hour, setHour] = useState<number>(16.0);
  const [weather, setWeather] = useState<WeatherMode>('clear');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('overview');
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [showPins, setShowPins] = useState<boolean>(true);
  const [selectedPinId, setSelectedPinId] = useState<TerrariumPinTelemetry['id'] | null>(null);
  const [liveSync, setLiveSync] = useState<boolean>(false);
  const [liveClock, setLiveClock] = useState<string>('--:--:--');
  const [envTemp, setEnvTemp] = useState<string>('25.4°C');
  const [envHumidity, setEnvHumidity] = useState<string>('78%');
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );
  const [webglError, setWebglError] = useState<boolean>(false);

  const handlePinsProjected = useCallback(
    (projected: ProjectedPinPosition[]) => {
      const containerEl = mountRef.current;
      const cw = containerEl?.clientWidth ?? 900;
      const ch = containerEl?.clientHeight ?? 500;
      const bottomSafeY = dockCollapsed ? ch - 46 : ch - 135;

      for (const p of projected) {
        const el = pinElsRef.current[p.id];
        if (!el) continue;
        const inSafeZone =
          p.visible &&
          p.x >= 24 &&
          p.x <= cw - 110 &&
          p.y >= 64 &&
          p.y <= bottomSafeY;
        if (!inSafeZone) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
        } else {
          el.style.opacity = '1';
          el.style.pointerEvents = 'auto';
          el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) translate(0, -50%)`;
        }
      }
    },
    [dockCollapsed]
  );

  useEffect(() => {
    controllerRef.current?.setPinsCallback(handlePinsProjected);
  }, [handlePinsProjected]);

  // Mount Three.js scene once
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    try {
      const ctrl = mountTerrariumScene(el, hour, weather);
      ctrl.setPinsCallback(handlePinsProjected);
      controllerRef.current = ctrl;
      return () => {
        ctrl.setPinsCallback(null);
        ctrl.dispose();
        controllerRef.current = null;
      };
    } catch {
      setWebglError(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trigger resize when toggling fullscreen
  useEffect(() => {
    const id = window.setTimeout(() => {
      controllerRef.current?.resize();
    }, 60);
    return () => window.clearTimeout(id);
  }, [fullscreen]);

  // Keep dock collapsed on narrow mobile viewports unless explicitly opened there
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const onChange = (e: MediaQueryListEvent) => {
      setDockCollapsed(e.matches);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Live clock & continuous Live Sync mode
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setLiveClock(now.toLocaleTimeString('en-GB'));
      if (liveSync) {
        const dec = now.getHours() + now.getMinutes() / 60;
        setHour(dec);
        controllerRef.current?.setHour(dec);
      }
    };
    updateClock();
    const id = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(id);
  }, [liveSync]);

  const handleHourChange = (nextHour: number) => {
    setLiveSync(false);
    setHour(nextHour);
    controllerRef.current?.setHour(nextHour);
  };

  const handleWeatherChange = (mode: WeatherMode) => {
    setWeather(mode);
    controllerRef.current?.setWeather(mode);
  };

  const handleCameraChange = (preset: CameraPreset) => {
    setCameraPreset(preset);
    controllerRef.current?.setCameraPreset(preset);
  };

  const handleToggleAutoRotate = () => {
    const next = !autoRotate;
    setAutoRotate(next);
    controllerRef.current?.setAutoRotate(next);
  };

  const handlePinClick = (pin: TerrariumPinTelemetry) => {
    setSelectedPinId(pin.id);
    setCameraPreset(pin.cameraPreset);
    controllerRef.current?.setCameraPreset(pin.cameraPreset);
  };

  const handleEnableLiveSync = async () => {
    const nextSync = !liveSync;
    setLiveSync(nextSync);
    if (!nextSync) return;

    const clock = getLocationClock(Date.now(), city.tzOffset);
    const decimalHour = clock.hours24 + clock.minutes / 60;
    setHour(decimalHour);
    controllerRef.current?.setHour(decimalHour);

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lng}&current=temperature_2m,relative_humidity_2m,weather_code`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await safeReadJson<{
        current?: { temperature_2m?: number; relative_humidity_2m?: number; weather_code?: number };
      }>(res);
      if (data?.current) {
        if (typeof data.current.temperature_2m === 'number') {
          setEnvTemp(`${data.current.temperature_2m.toFixed(1)}°C`);
        }
        if (typeof data.current.relative_humidity_2m === 'number') {
          setEnvHumidity(`${Math.round(data.current.relative_humidity_2m)}%`);
        }
        const code = Number(data.current.weather_code ?? 0);
        if (code >= 51) handleWeatherChange('rain');
        else if (code === 45 || code === 48) handleWeatherChange('mist');
        else handleWeatherChange('clear');
      }
    } catch {
      // Offline fallback retains last known local telemetry values
    }
  };

  const selectedPin = useMemo(
    () => TERRARIUM_PINS.find((p) => p.id === selectedPinId) ?? null,
    [selectedPinId]
  );

  const formattedHour = `${String(Math.floor(hour)).padStart(2, '0')}:${String(
    Math.round((hour % 1) * 60) % 60
  ).padStart(2, '0')}`;

  const lightingSnapshot = useMemo(() => getTerrariumLightingForHour(hour), [hour]);
  const solarDeg = Math.round((lightingSnapshot.sunElevation * 180) / Math.PI);
  const phaseLabel = getPrayerPhaseLabel(hour, lang);

  return (
    <div
      data-testid="terrarium-container"
      data-hour={hour.toFixed(2)}
      data-weather={weather}
      className={
        fullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen bg-[#02050d]'
          : 'relative w-full h-[460px] lg:h-[540px] rounded-2xl overflow-hidden border border-[#1d2c3f] bg-[#02050d]'
      }
    >
      {/* Dedicated WebGL Mount Container outside React controls */}
      <div
        ref={mountRef}
        data-testid="terrarium-canvas-mount"
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {webglError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#061222] text-white p-6 text-center">
          <p className="text-lg font-semibold">
            {lang === 'bn' ? '৩ডি টেরারিয়াম প্রিভিউ' : '3D Terrarium Preview'}
          </p>
          <p className="text-sm text-white/80 mt-1">
            {lang === 'bn'
              ? 'এই ব্রাউজারে WebGL সক্রিয় নয়।'
              : 'WebGL rendering is unavailable in this browser context.'}
          </p>
        </div>
      )}

      {/* 3D Projected NASA Satellite Telemetry Pins (Zero React re-render overhead) */}
      {showPins && !dockCollapsed && !webglError && (
        <div
          aria-label={lang === 'bn' ? '৩ডি বোটানিক্যাল পিন' : '3D Botanical Telemetry Pins'}
          className="absolute inset-0 pointer-events-none overflow-hidden"
        >
          {TERRARIUM_PINS.map((pin) => {
            const isSelected = selectedPinId === pin.id;
            return (
              <button
                key={pin.id}
                ref={(el) => {
                  pinElsRef.current[pin.id] = el;
                }}
                type="button"
                data-testid={`terrarium-pin-${pin.id}`}
                onClick={() => handlePinClick(pin)}
                style={{ left: 0, top: 0, opacity: 0 }}
                className="absolute flex items-center gap-1.5 cursor-pointer group focus:outline-none"
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full border border-white transition-colors ${
                    isSelected ? 'bg-[#fbbf24]' : 'bg-[#38bdf8]'
                  }`}
                />
                <span className="w-4 h-px bg-white/60 hidden sm:inline-block" />
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-mono-tabular whitespace-nowrap border transition-colors ${
                    isSelected
                      ? 'bg-[#0b192c]/95 border-[#fbbf24] text-[#fde68a]'
                      : 'bg-[#040a17]/90 border-[#38bdf8]/45 text-[#e2e8f0] group-hover:border-[#38bdf8] group-hover:bg-[#0c2138]/95'
                  }`}
                >
                  {lang === 'bn' ? pin.labelBn : pin.labelEn}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Top NASA Eyes Header + Event Ticker + Quick Actions (Solid dark panels, zero backdrop-filter) */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#050b16]/90 border border-white/15 text-white flex flex-col gap-0.5 min-w-0 max-w-[58%] sm:max-w-none">
          <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono-tabular tracking-wider text-[#38bdf8] uppercase truncate">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] shrink-0 inline-block" aria-hidden="true" />
            <span className="truncate">NASA EYES // BIOSPHERE</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-[#f8fafc] truncate">
            <span className="truncate">{lang === 'bn' ? '৩ডি বোটানিক্যাল টেরারিয়াম' : '3D Glass Terrarium'}</span>
            <span className="text-[#fbbf24] font-mono-tabular shrink-0">{formattedHour}</span>
          </div>
        </div>

        {/* Center Live Telemetry Ticker (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#1a1209]/90 border border-[#fb923c]/35 text-[#fdba74] text-[11px] font-mono-tabular">
          <Radio className="w-3.5 h-3.5 text-[#fb923c]" />
          <span>
            {phaseLabel} · {WEATHER_LABELS[weather][lang]} · SUN {solarDeg}° · O₂ OPTIMAL
          </span>
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto shrink-0">
          <button
            type="button"
            data-testid="terrarium-pins-toggle"
            onClick={() => setShowPins((s) => !s)}
            aria-label={lang === 'bn' ? '৩ডি পিন দেখান/লুকান' : 'Toggle 3D pins'}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              showPins
                ? 'bg-[#082238]/92 border-[#38bdf8]/50 text-[#bae6fd]'
                : 'bg-[#050b16]/90 border-white/15 text-white/75 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lang === 'bn' ? 'পিন' : 'Pins'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label={
              fullscreen
                ? lang === 'bn'
                  ? 'ফুলস্ক্রিন বন্ধ করুন'
                  : 'Exit fullscreen 3D view'
                : lang === 'bn'
                ? 'ফুলস্ক্রিন ৩ডি দেখুন'
                : 'Expand fullscreen 3D view'
            }
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#050b16]/90 hover:bg-[#087653] text-white text-xs font-medium border border-white/15 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">
              {fullscreen
                ? lang === 'bn'
                  ? 'ওয়েবসাইটে ফিরুন'
                  : 'Exit 3D'
                : lang === 'bn'
                ? 'ফুলস্ক্রিন ৩ডি'
                : 'Fullscreen 3D'}
            </span>
          </button>
        </div>
      </div>

      {/* Specimen Inspector Drawer (Bottom-docked on mobile, top-right on desktop) */}
      {selectedPin && (
        <aside
          data-testid="terrarium-inspector"
          className="absolute bottom-14 left-3 right-3 sm:left-auto sm:bottom-auto sm:top-16 sm:right-3 sm:w-[275px] rounded-xl bg-[#050b16]/94 border border-[#38bdf8]/40 text-white p-3 sm:p-3.5 shadow-xl z-20"
        >
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-white/10">
            <div>
              <span className="inline-block text-[10px] font-mono-tabular text-[#38bdf8] uppercase tracking-wider">
                {lang === 'bn' ? selectedPin.roleBn : selectedPin.roleEn}
              </span>
              <h3 className="text-sm font-bold text-[#f8fafc] mt-0.5">
                {lang === 'bn' ? selectedPin.labelBn : selectedPin.labelEn}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPinId(null)}
              aria-label={lang === 'bn' ? 'ইন্সপেক্টর বন্ধ করুন' : 'Close inspector'}
              className="p-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-[#cbd5e1] leading-relaxed mt-2">
            {lang === 'bn' ? selectedPin.descBn : selectedPin.descEn}
          </p>

          <div className="grid grid-cols-3 gap-1.5 mt-3">
            <div className="bg-white/5 border border-white/10 rounded-lg p-2">
              <p className="text-[9px] font-mono-tabular text-[#94a3b8]">MOISTURE</p>
              <p className="text-xs font-bold font-mono-tabular text-[#38bdf8] mt-0.5">
                {selectedPin.moisture}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-2">
              <p className="text-[9px] font-mono-tabular text-[#94a3b8]">LUX</p>
              <p className="text-xs font-bold font-mono-tabular text-[#fbbf24] mt-0.5">
                {selectedPin.lux}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-2">
              <p className="text-[9px] font-mono-tabular text-[#94a3b8]">TEMP</p>
              <p className="text-xs font-bold font-mono-tabular text-[#4ade80] mt-0.5">
                {selectedPin.temp}
              </p>
            </div>
          </div>
        </aside>
      )}

      {/* Collapsible Bottom NASA Control Dock (Zero Viewport Occlusion) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[min(95%,820px)] flex flex-col items-center pointer-events-none">
        <button
          type="button"
          onClick={() => setDockCollapsed((c) => !c)}
          aria-expanded={!dockCollapsed}
          className="pointer-events-auto mb-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#050b16]/92 text-white text-xs font-medium border border-white/15 hover:bg-[#087653] transition-colors cursor-pointer"
        >
          {dockCollapsed ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {dockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>
            {dockCollapsed
              ? lang === 'bn'
                ? 'নিয়ন্ত্রণ দেখান'
                : 'Show Controls'
              : lang === 'bn'
              ? 'নিয়ন্ত্রণ লুকান'
              : 'Hide Controls'}
          </span>
        </button>

        {!dockCollapsed && (
          <div
            className={`pointer-events-auto w-full rounded-xl bg-[#050b16]/92 text-white border border-white/15 shadow-2xl max-h-[225px] sm:max-h-none overflow-y-auto ${
              fullscreen ? 'p-3 space-y-2.5' : 'p-2.5 space-y-2'
            }`}
          >
            {/* Row 1: 5 Prayer Presets + 24H Orbital Scrubber + Live Sync */}
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <div className="flex items-center gap-1 flex-wrap">
                {(Object.keys(LIGHTING_PRESET_HOURS) as LightingPreset[]).map((preset) => {
                  const item = LIGHTING_LABELS[preset];
                  const active = Math.abs(hour - item.hour) < 0.7;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleHourChange(item.hour)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                        active
                          ? 'bg-[#087653] text-white border border-[#10b981]'
                          : 'bg-white/10 text-white/85 hover:bg-white/20 border border-transparent'
                      }`}
                    >
                      {preset === 'fajr' && <Sunrise className="w-3 h-3 text-[#fbbf24]" />}
                      {(preset === 'dhuhr' || preset === 'asr') && (
                        <Sun className="w-3 h-3 text-[#fbbf24]" />
                      )}
                      {preset === 'maghrib' && <Sunset className="w-3 h-3 text-[#fb923c]" />}
                      {preset === 'isha' && <Moon className="w-3 h-3 text-[#93c5fd]" />}
                      <span>{item[lang]}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <label className="flex items-center gap-2 text-xs text-white/85">
                  <span className="font-mono-tabular text-[10px] text-[#94a3b8] uppercase whitespace-nowrap">
                    ORBIT 24H
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={24}
                    step={0.1}
                    value={hour}
                    aria-label={lang === 'bn' ? 'দিন-রাত সময় স্লাইডার' : 'Day and night orbital lighting time slider'}
                    onChange={(e) => handleHourChange(Number(e.target.value))}
                    className="w-24 sm:w-28 accent-[#fbbf24] cursor-pointer"
                  />
                </label>

                <button
                  type="button"
                  data-testid="terrarium-live-sync-btn"
                  onClick={handleEnableLiveSync}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono-tabular border transition-colors cursor-pointer ${
                    liveSync
                      ? 'bg-[#064e3b] border-[#22c55e] text-[#86efac]'
                      : 'bg-white/5 border-white/15 text-[#94a3b8] hover:text-white'
                  }`}
                >
                  <span>{liveSync ? 'LIVE ON' : 'LIVE SYNC'}</span>
                </button>
              </div>
            </div>

            {/* Row 2: Weather + Camera Presets + Orbit + Telemetry Readout */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
              <div className="flex items-center gap-1 flex-wrap">
                {(['clear', 'rain', 'mist'] as WeatherMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleWeatherChange(mode)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      weather === mode
                        ? 'bg-[#d5ad59] text-[#11241c]'
                        : 'bg-white/10 text-white/85 hover:bg-white/20'
                    }`}
                  >
                    {mode === 'clear' && <Sun className="w-3 h-3" />}
                    {mode === 'rain' && <CloudRain className="w-3 h-3" />}
                    {mode === 'mist' && <CloudFog className="w-3 h-3" />}
                    <span>{WEATHER_LABELS[mode][lang]}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 flex-wrap">
                {(Object.keys(CAMERA_LABELS) as CameraPreset[]).map((cam) => (
                  <button
                    key={cam}
                    type="button"
                    onClick={() => handleCameraChange(cam)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      cameraPreset === cam
                        ? 'bg-[#38bdf8] text-[#050b16]'
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    {cam === 'soil' && <Layers className="w-3 h-3" />}
                    {cam === 'lantern' && <Flame className="w-3 h-3" />}
                    <span>{CAMERA_LABELS[cam][lang]}</span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleToggleAutoRotate}
                  aria-pressed={autoRotate}
                  aria-label={lang === 'bn' ? 'স্বয়ংক্রিয় ঘূর্ণন' : 'Auto rotate'}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    autoRotate
                      ? 'bg-[#087653] text-white'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  <RotateCw className="w-3 h-3" />
                  <span>{lang === 'bn' ? 'ঘূর্ণন' : 'Orbit'}</span>
                </button>
              </div>

              <div className="hidden md:flex items-center gap-2 text-[11px] font-mono-tabular text-[#94a3b8]">
                <span>{envTemp}</span>
                <span>·</span>
                <span>HUM {envHumidity}</span>
                <span>·</span>
                <span className="text-[#cbd5e1]">{liveClock}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
