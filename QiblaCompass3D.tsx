import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Compass, RotateCcw, Smartphone } from 'lucide-react';
import {
  mountQiblaCompassScene,
  shortestAngleDelta,
  type QiblaCompassController,
} from '../three/QiblaCompassScene';
import type { Language } from '../types/islamic';

interface QiblaCompass3DProps {
  lang: Language;
  qiblaBearing: number;
  cardinalLabel: string;
}

interface DeviceOrientationEventExtended extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

interface DeviceOrientationStaticWithPermission {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

function getScreenOrientationAngle(): number {
  if (typeof window === 'undefined') return 0;
  if (window.screen?.orientation && typeof window.screen.orientation.angle === 'number') {
    return window.screen.orientation.angle;
  }
  const winAngle = (window as unknown as { orientation?: number }).orientation;
  return typeof winAngle === 'number' ? winAngle : 0;
}

export function QiblaCompass3D({ lang, qiblaBearing, cardinalLabel }: QiblaCompass3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<QiblaCompassController | null>(null);

  const [sensorActive, setSensorActive] = useState(false);
  const [sensorSource, setSensorSource] = useState<'none' | 'live' | 'manual'>('none');
  const [permissionState, setPermissionState] = useState<'idle' | 'granted' | 'denied' | 'unsupported'>('idle');
  const [deviceHeading, setDeviceHeading] = useState<number>(0);

  // Mount Three.js 3D Compass into dedicated empty div
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const ctrl = mountQiblaCompassScene(el, qiblaBearing, 0);
    controllerRef.current = ctrl;

    return () => {
      ctrl.dispose();
      controllerRef.current = null;
    };
    // Mount once on component mount; dynamic props sync via controller methods below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    controllerRef.current?.setQiblaBearing(qiblaBearing);
  }, [qiblaBearing]);

  useEffect(() => {
    controllerRef.current?.setDeviceHeading(deviceHeading);
  }, [deviceHeading]);

  // Listen to DeviceOrientation API when activated
  useEffect(() => {
    if (!sensorActive) return;

    const handleOrientation = (evt: Event) => {
      const e = evt as DeviceOrientationEventExtended;
      let heading: number | null = null;

      if (typeof e.webkitCompassHeading === 'number' && !Number.isNaN(e.webkitCompassHeading)) {
        heading = e.webkitCompassHeading;
      } else if (typeof e.alpha === 'number' && !Number.isNaN(e.alpha)) {
        // W3C standard: alpha increases counter-clockwise; convert to clockwise compass azimuth
        heading = (360 - e.alpha + getScreenOrientationAngle()) % 360;
      }

      if (heading !== null) {
        const normalized = ((heading % 360) + 360) % 360;
        setDeviceHeading(Number(normalized.toFixed(1)));
        setSensorSource('live');
      }
    };

    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    window.addEventListener('deviceorientation', handleOrientation, true);

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [sensorActive]);

  const handleEnableCompassSensor = async () => {
    if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) {
      setPermissionState('unsupported');
      return;
    }

    const DOE = window.DeviceOrientationEvent as unknown as DeviceOrientationStaticWithPermission;
    if (typeof DOE.requestPermission === 'function') {
      try {
        const result = await DOE.requestPermission();
        if (result === 'granted') {
          setPermissionState('granted');
          setSensorActive(true);
        } else {
          setPermissionState('denied');
        }
      } catch {
        setPermissionState('denied');
      }
    } else {
      setPermissionState('granted');
      setSensorActive(true);
    }
  };

  const turnDelta = shortestAngleDelta(deviceHeading, qiblaBearing);
  const absDelta = Math.abs(turnDelta);
  const isAligned = absDelta <= 5;

  return (
    <div className="bg-white rounded-2xl border border-[#dce7e0] overflow-hidden">
      {/* Compact Header Strip */}
      <div className="px-5 py-3.5 border-b border-[#eef5f0] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#eef5f0] text-[#087653] flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#183027]">
              {lang === 'bn' ? '৩ডি ইন্টারেক্টিভ কিবলা কম্পাস' : 'Interactive 3D Qibla Compass'}
            </h2>
            <p className="text-xs text-[#5a7066]">
              {lang === 'bn'
                ? 'কাবা দিকনির্দেশনায় ৩ডি মডেল · ড্র্যাগ করে ঘোরান ও জুম করুন'
                : 'Drag to orbit & zoom · Real-time DeviceOrientation sensor ready'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="qibla-sensor-btn"
            onClick={handleEnableCompassSensor}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              sensorActive
                ? 'bg-[#087653] border-[#087653] text-white'
                : 'bg-[#faf7f0] border-[#b58328]/40 text-[#8a6017] hover:bg-[#f5efe0]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>
              {sensorActive
                ? sensorSource === 'live'
                  ? lang === 'bn'
                    ? 'লাইভ সেন্সর সক্রিয়'
                    : 'Live Sensor Active'
                  : lang === 'bn'
                  ? 'সেন্সর চালু (অপেক্ষমাণ)'
                  : 'Sensor Listening'
                : lang === 'bn'
                ? 'ফোন সেন্সর চালু করুন'
                : 'Enable Device Sensor'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => controllerRef.current?.resetView()}
            aria-label={lang === 'bn' ? 'ভিউ রিসেট' : 'Reset 3D view'}
            className="p-1.5 rounded-lg border border-[#dce7e0] text-[#5a7066] hover:text-[#183027] hover:bg-[#f7faf8] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dedicated Empty Three.js Canvas Mount (Sibling-separated from controls) */}
      <div className="relative bg-[#f6f2e7]">
        <div
          ref={mountRef}
          data-testid="qibla-3d-canvas-host"
          className="w-full h-[340px] sm:h-[380px]"
        />

        {/* Subtle Non-overlapping Alignment Pill */}
        <div className="px-4 py-2.5 bg-white/95 border-t border-[#eef5f0] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            {isAligned ? (
              <span
                data-testid="qibla-aligned-badge"
                className="inline-flex items-center gap-1.5 font-semibold text-[#087653]"
              >
                <CheckCircle2 className="w-4 h-4 text-[#087653]" />
                <span>
                  {lang === 'bn'
                    ? 'আপনি কাবা শরীফ বরাবর মুখ করে আছেন!'
                    : 'Aligned directly toward the Holy Kaaba!'}
                </span>
              </span>
            ) : (
              <span className="text-[#494e45] font-medium">
                {lang === 'bn'
                  ? `${Math.abs(Math.round(turnDelta))}° ${turnDelta > 0 ? 'ডানে' : 'বামে'} ঘুরুন`
                  : `Turn ${Math.abs(Math.round(turnDelta))}° ${turnDelta > 0 ? 'right' : 'left'} toward ${cardinalLabel}`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 font-mono-tabular text-[#5a7066]">
            <span>
              {lang === 'bn' ? 'ডিভাইস:' : 'Heading:'}{' '}
              <strong className="text-[#183027]">{Math.round(deviceHeading)}°</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {lang === 'bn' ? 'কিবলা:' : 'Qibla:'}{' '}
              <strong className="text-[#087653]">{qiblaBearing}°</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Heading Test & Calibration Bar (Helps desktop users test sensor rotation & alignment) */}
      <div className="px-5 py-3.5 bg-[#faf7f0] border-t border-[#ebe6da] space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="qibla-heading-slider"
            className="text-xs font-medium text-[#5a7066]"
          >
            {lang === 'bn'
              ? 'সেন্সর ক্যালিব্রেশন / ম্যানুয়াল হেডিং পরীক্ষা (0°–359°):'
              : 'Sensor Calibration / Manual Heading Test (0°–359°):'}
          </label>
          <button
            type="button"
            data-testid="qibla-align-test-btn"
            onClick={() => {
              setSensorSource('manual');
              setDeviceHeading(qiblaBearing);
            }}
            className="text-xs font-semibold text-[#087653] hover:underline cursor-pointer"
          >
            {lang === 'bn' ? 'কিবলা বরাবর অ্যালাইন করুন' : 'Simulate Align to Qibla'}
          </button>
        </div>

        <input
          id="qibla-heading-slider"
          type="range"
          min={0}
          max={359}
          step={1}
          value={Math.round(deviceHeading)}
          onChange={(e) => {
            setSensorSource('manual');
            setDeviceHeading(Number(e.target.value));
          }}
          className="w-full accent-[#087653] cursor-pointer"
        />

        {permissionState === 'denied' && (
          <p className="text-[11px] text-[#991b1b]">
            {lang === 'bn'
              ? 'ডিভাইস সেন্সরের অনুমতি পাওয়া যায়নি। ব্রাউজার সেটিংস থেকে অনুমতি দিন অথবা উপরের স্লাইডার ব্যবহার করুন।'
              : 'Motion sensor permission was denied. Enable it in browser settings or use the manual heading slider above.'}
          </p>
        )}
        {permissionState === 'unsupported' && (
          <p className="text-[11px] text-[#6e7268]">
            {lang === 'bn'
              ? 'এই ডিভাইসে সরাসরি কম্পাস সেন্সর পাওয়া যায়নি; ম্যানুয়াল হেডিং স্লাইডার দিয়ে দিক যাচাই করুন।'
              : 'DeviceOrientation sensor is unavailable on this browser; use the calibration slider to rotate the 3D dial.'}
          </p>
        )}
      </div>
    </div>
  );
}
