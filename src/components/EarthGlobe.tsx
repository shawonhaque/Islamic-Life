import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Compass,
  Globe2,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import * as THREE from 'three';
import type { CityLocation, Language } from '../types/islamic';

interface EarthGlobeProps {
  lang: Language;
  city: CityLocation;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
}

const EARTH_TEXTURES = [
  'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets/earth_atmos_2048.jpg',
  'https://unpkg.com/three@0.160.0/examples/textures/planets/earth_atmos_2048.jpg',
];
const SPECULAR_TEXTURES = [
  'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets/earth_specular_2048.jpg',
  'https://unpkg.com/three@0.160.0/examples/textures/planets/earth_specular_2048.jpg',
];

const FOV_DEGREES = 38;
const GLOBE_RADIUS = 1;
// The atmosphere shell is the outermost thing that must stay on screen, so
// framing is computed against it rather than the bare globe surface.
const OUTER_RADIUS = 1.14;
const FIT_PADDING = 1.16;

/**
 * Camera distance at which the whole globe fits inside the viewport for the
 * current aspect ratio. Fitting the vertical field of view alone leaves the
 * globe overflowing on narrow screens, which is what pushed it below the fold
 * before, so both axes are checked and the tighter one wins.
 */
function fitDistance(aspect: number): number {
  const halfV = (FOV_DEGREES * Math.PI) / 360;
  const halfH = Math.atan(Math.tan(halfV) * Math.max(aspect, 0.2));
  const limiting = Math.min(halfV, halfH);
  return (OUTER_RADIUS / Math.sin(limiting)) * FIT_PADDING;
}

/**
 * Rotation that brings the given longitude to the centre of the visible disc.
 * SphereGeometry maps longitude to `theta = lng + 180` on a unit circle, so the
 * globe has to turn by -(lng + 90) degrees for that meridian to face the camera.
 */
function longitudeToRotation(lng: number): number {
  return -((lng + 90) * Math.PI) / 180;
}

/**
 * Equirectangular lat/lng to a point on a three.js sphere, matching the UV
 * layout of SphereGeometry so the marker lands on the right country.
 */
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

export function EarthGlobe({ lang, city, fullscreen, onToggleFullscreen }: EarthGlobeProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLDivElement | null>(null);
  const [spinning, setSpinning] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const spinningRef = useRef(spinning);
  const zoomRef = useRef<(delta: number) => void>(() => {});
  const resetRef = useRef<() => void>(() => {});

  useEffect(() => {
    spinningRef.current = spinning;
  }, [spinning]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onToggleFullscreen();
    };
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [fullscreen, onToggleFullscreen]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    setLoadError(false);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV_DEGREES, 1, 0.1, 200);
    camera.position.set(0, 0, fitDistance(1));

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setLoadError(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, {
      display: 'block',
      width: '100%',
      height: '100%',
      cursor: 'grab',
      touchAction: 'none',
    });

    const globe = new THREE.Group();
    scene.add(globe);

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0x2f6f5a,
      specular: 0x1b3b32,
      shininess: 14,
      emissive: 0x0d1f19,
    });

    const sphere = new THREE.Mesh(new THREE.SphereGeometry(GLOBE_RADIUS, 96, 96), earthMaterial);
    globe.add(sphere);

    // Textures come from a CDN, so a blocked or offline network is expected.
    // Try a second mirror before showing the error panel.
    let loadedTexture: THREE.Texture | null = null;
    const loadWithFallback = (
      urls: string[],
      onLoad: (t: THREE.Texture) => void,
      onFail?: () => void
    ) => {
      let index = 0;
      const attempt = () => {
        if (index >= urls.length) {
          onFail?.();
          return;
        }
        loader.load(urls[index++], onLoad, undefined, attempt);
      };
      attempt();
    };

    loadWithFallback(
      EARTH_TEXTURES,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        earthMaterial.map = texture;
        earthMaterial.color.set(0xffffff);
        earthMaterial.needsUpdate = true;
        loadedTexture = texture;
      },
      () => setLoadError(true)
    );

    loadWithFallback(SPECULAR_TEXTURES, (texture) => {
      earthMaterial.specularMap = texture;
      earthMaterial.needsUpdate = true;
    });

    const graticule = new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_RADIUS * 1.002, 48, 32),
      new THREE.MeshBasicMaterial({
        color: 0x9fd8c4,
        wireframe: true,
        transparent: true,
        opacity: 0.09,
      })
    );
    globe.add(graticule);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(OUTER_RADIUS, 64, 64),
      new THREE.MeshBasicMaterial({
        color: 0x6fd3b0,
        transparent: true,
        opacity: 0.12,
        side: THREE.BackSide,
      })
    );
    scene.add(atmosphere);

    // City marker: a gold pin plus a soft halo, parented to the globe group so
    // it rotates with the surface instead of drifting.
    const cityPoint = latLngToVector3(city.lat, city.lng, GLOBE_RADIUS * 1.012);
    const marker = new THREE.Group();
    marker.position.copy(cityPoint);

    const pin = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0xf6d37b })
    );
    marker.add(pin);

    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.036, 0.052, 32),
      new THREE.MeshBasicMaterial({
        color: 0xf6d37b,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
      })
    );
    // Face the ring along the surface normal so it reads as a flat disc.
    halo.lookAt(cityPoint.clone().multiplyScalar(2));
    marker.add(halo);
    globe.add(marker);

    const stars = new THREE.BufferGeometry();
    const starCount = 1400;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i += 1) {
      const radius = 18 + Math.random() * 22;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    stars.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starField = new THREE.Points(
      stars,
      new THREE.PointsMaterial({ color: 0xe8f5ef, size: 0.09, transparent: true, opacity: 0.75 })
    );
    scene.add(starField);

    const sun = new THREE.DirectionalLight(0xfff4d6, 3.1);
    sun.position.set(4.2, 1.8, 3.4);
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0xbcd6cc, 1.45));

    const initialRotation = longitudeToRotation(city.lng);
    globe.rotation.y = initialRotation;

    let baseDistance = fitDistance(1);
    let distance = baseDistance;
    let targetDistance = baseDistance;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let rotationVelocity = 0;
    const activePointers = new Map<number, { x: number; y: number }>();
    let pinchStartGap = 0;
    let pinchStartDistance = 0;

    const applyDistance = (next: number) => {
      targetDistance = THREE.MathUtils.clamp(next, baseDistance * 0.62, baseDistance * 1.55);
    };

    const onPointerDown = (event: PointerEvent) => {
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (activePointers.size === 1) {
        dragging = true;
        lastX = event.clientX;
        lastY = event.clientY;
        renderer.domElement.style.cursor = 'grabbing';
      } else if (activePointers.size === 2) {
        const [a, b] = Array.from(activePointers.values());
        pinchStartGap = Math.hypot(a.x - b.x, a.y - b.y);
        pinchStartDistance = targetDistance;
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!activePointers.has(event.pointerId)) return;
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (activePointers.size === 2) {
        const [a, b] = Array.from(activePointers.values());
        const gap = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchStartGap > 0) {
          applyDistance(pinchStartDistance * (pinchStartGap / Math.max(gap, 1)));
        }
        return;
      }

      if (!dragging) return;
      const deltaX = event.clientX - lastX;
      const deltaY = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      globe.rotation.y += deltaX * 0.005;
      globe.rotation.x = THREE.MathUtils.clamp(
        globe.rotation.x + deltaY * 0.004,
        -Math.PI / 3,
        Math.PI / 3
      );
      rotationVelocity = deltaX * 0.0009;
    };

    const onPointerUp = (event: PointerEvent) => {
      activePointers.delete(event.pointerId);
      if (activePointers.size < 2) pinchStartGap = 0;
      if (activePointers.size === 0) {
        dragging = false;
        renderer.domElement.style.cursor = 'grab';
      }
    };

    // Wheel zoom is scoped to the canvas with a non-passive listener so the
    // page does not scroll while the visitor is zooming the globe.
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      applyDistance(targetDistance * (1 + Math.sign(event.deltaY) * 0.12));
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    const resize = () => {
      const width = mount.clientWidth || 1;
      const height = mount.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      baseDistance = fitDistance(camera.aspect);
      targetDistance = THREE.MathUtils.clamp(
        targetDistance,
        baseDistance * 0.62,
        baseDistance * 1.55
      );
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    zoomRef.current = (delta: number) => applyDistance(targetDistance * (1 + delta));
    resetRef.current = () => {
      globe.rotation.set(0, initialRotation, 0);
      rotationVelocity = 0;
      targetDistance = baseDistance;
      setSpinning(true);
    };

    const markerWorld = new THREE.Vector3();
    const cameraDirection = new THREE.Vector3();
    const toCamera = new THREE.Vector3();

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);

      if (spinningRef.current && !dragging) {
        globe.rotation.y += 0.0016;
      } else if (!dragging) {
        globe.rotation.y += rotationVelocity;
        rotationVelocity *= 0.94;
      }

      // Ease toward the target distance so zoom and resize feel smooth.
      if (Math.abs(distance - targetDistance) > 0.001) {
        distance += (targetDistance - distance) * 0.15;
      } else {
        distance = targetDistance;
      }
      camera.position.set(0, 0, distance);
      camera.lookAt(0, 0, 0);

      starField.rotation.y += 0.00012;
      renderer.render(scene, camera);

      // Project the city marker to screen space for its HTML label, and hide
      // it while the marker sits on the far side of the globe.
      const label = labelRef.current;
      if (label) {
        marker.getWorldPosition(markerWorld);
        camera.getWorldDirection(cameraDirection);
        toCamera.copy(cameraDirection).negate();
        const facing = markerWorld.clone().normalize().dot(toCamera);
        const projected = markerWorld.clone().project(camera);
        const onScreen =
          facing > 0.02 && Math.abs(projected.x) < 1.05 && Math.abs(projected.y) < 1.05;
        if (onScreen) {
          const x = ((projected.x + 1) / 2) * 100;
          const y = ((1 - projected.y) / 2) * 100;
          label.style.left = `${x}%`;
          label.style.top = `${y}%`;
          label.style.opacity = String(Math.min(1, facing * 1.8));
          label.style.visibility = 'visible';
        } else {
          label.style.visibility = 'hidden';
        }
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      zoomRef.current = () => {};
      resetRef.current = () => {};
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('wheel', onWheel);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      sphere.geometry.dispose();
      graticule.geometry.dispose();
      atmosphere.geometry.dispose();
      pin.geometry.dispose();
      halo.geometry.dispose();
      stars.dispose();
      earthMaterial.dispose();
      loadedTexture?.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [city.lat, city.lng, retryToken]);

  const retry = useCallback(() => {
    setLoadError(false);
    setRetryToken((n) => n + 1);
  }, []);

  return (
    <div
      className={`overflow-hidden bg-[#050d0b] ${
        // Position and radius utilities are mutually exclusive: emitting both
        // `relative`+`fixed` or `rounded-2xl`+`rounded-none` leaves the winner
        // to stylesheet order, which collapsed the box to zero height.
        fullscreen
          ? 'fixed inset-0 z-[60] rounded-none'
          : 'relative rounded-2xl'
      }`}
      data-testid="home-earth-globe"
    >
      <div
        className={
          fullscreen
            ? 'absolute inset-0'
            : // Square on phones so the globe fills the frame instead of being
              // squeezed into a thin strip, wider as the viewport grows.
              'relative aspect-square sm:aspect-[4/3] lg:aspect-[16/9] max-h-[70vh]'
        }
      >
        <div ref={mountRef} className="absolute inset-0" />

        {loadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6 bg-[#050d0b]/85">
            <Globe2 className="w-8 h-8 text-[#6fd3b0]" />
            <p className="text-sm text-[#d7ece3]">
              {lang === 'bn'
                ? 'থ্রিডি গ্লোব লোড করা যাচ্ছে না (WebGL বন্ধ থাকতে পারে বা টেক্সচার ডাউনলোড ব্যর্থ হয়েছে)।'
                : 'The 3D globe could not load (WebGL may be off, or the texture download failed).'}
            </p>
            <button
              type="button"
              onClick={retry}
              className="px-3 py-1.5 rounded-lg bg-white/12 hover:bg-white/20 text-xs font-semibold text-white cursor-pointer"
            >
              {lang === 'bn' ? 'আবার চেষ্টা করুন' : 'Try again'}
            </button>
          </div>
        )}

        {/* City label, repositioned every frame by the render loop. */}
        <div
          ref={labelRef}
          className="absolute -translate-x-1/2 -translate-y-[140%] pointer-events-none whitespace-nowrap text-[10px] font-semibold text-[#f6d37b] bg-black/45 backdrop-blur px-1.5 py-0.5 rounded"
          style={{ visibility: 'hidden' }}
        >
          {lang === 'bn' ? city.name_bn : city.name_en}
        </div>

        <div className="absolute top-3 left-3 flex items-center gap-1.5 text-[11px] text-white/85 bg-black/35 backdrop-blur px-2.5 py-1 rounded-lg">
          <Globe2 className="w-3.5 h-3.5 text-[#6fd3b0]" />
          <span>{lang === 'bn' ? 'পৃথিবী · লাইভ থ্রিডি' : 'Earth · live 3D'}</span>
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => zoomRef.current(-0.15)}
            aria-label={lang === 'bn' ? 'জুম ইন' : 'Zoom in'}
            data-testid="globe-zoom-in"
            className="p-2 rounded-lg bg-black/35 hover:bg-black/55 backdrop-blur text-white cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => zoomRef.current(0.15)}
            aria-label={lang === 'bn' ? 'জুম আউট' : 'Zoom out'}
            data-testid="globe-zoom-out"
            className="p-2 rounded-lg bg-black/35 hover:bg-black/55 backdrop-blur text-white cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setSpinning((s) => !s)}
            aria-label={
              spinning
                ? lang === 'bn'
                  ? 'ঘোরানো থামান'
                  : 'Pause rotation'
                : lang === 'bn'
                  ? 'ঘোরান'
                  : 'Resume rotation'
            }
            className="p-2 rounded-lg bg-black/35 hover:bg-black/55 backdrop-blur text-white cursor-pointer"
          >
            {spinning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => resetRef.current()}
            aria-label={lang === 'bn' ? 'ভিউ রিসেট করুন' : 'Reset view'}
            data-testid="globe-reset"
            className="p-2 rounded-lg bg-black/35 hover:bg-black/55 backdrop-blur text-white cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label={
              fullscreen
                ? lang === 'bn'
                  ? 'ফুলস্ক্রিন বন্ধ'
                  : 'Exit fullscreen'
                : lang === 'bn'
                  ? 'ফুলস্ক্রিন'
                  : 'Fullscreen'
            }
            className="p-2 rounded-lg bg-black/35 hover:bg-black/55 backdrop-blur text-white cursor-pointer"
          >
            {fullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-end justify-between gap-2">
          <div className="text-white">
            <p className="text-sm font-semibold flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#f6d37b]" />
              {lang === 'bn' ? city.name_bn : city.name_en}
            </p>
            <p className="text-[11px] text-white/70 font-mono-tabular">
              {city.lat.toFixed(3)}°, {city.lng.toFixed(3)}°
            </p>
          </div>
          <p className="text-[10px] text-white/55 max-w-[60%] text-right">
            {lang === 'bn'
              ? 'ড্র্যাগ করে ঘোরান · স্ক্রল বা পিঞ্চ করে জুম করুন'
              : 'Drag to rotate · scroll or pinch to zoom'}
          </p>
        </div>
      </div>
    </div>
  );
}
