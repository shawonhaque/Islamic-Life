import { useEffect, useRef, useState } from 'react';
import { Compass, Globe2, Maximize2, Minimize2, Pause, Play, RotateCcw } from 'lucide-react';
import * as THREE from 'three';
import type { CityLocation, Language } from '../types/islamic';

interface EarthGlobeProps {
  lang: Language;
  city: CityLocation;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
}

const EARTH_TEXTURE =
  'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets/earth_atmos_2048.jpg';
const SPECULAR_TEXTURE =
  'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets/earth_specular_2048.jpg';

// Dhuhr at the user's longitude sits overhead, so rotating the globe by this
// offset puts their city under the sun at noon rather than at the antimeridian.
function longitudeToRotation(lng: number): number {
  return ((lng + 180) * Math.PI) / 180;
}

export function EarthGlobe({ lang, city, fullscreen, onToggleFullscreen }: EarthGlobeProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [spinning, setSpinning] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const spinningRef = useRef(spinning);

  useEffect(() => {
    spinningRef.current = spinning;
  }, [spinning]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.55, 3.05);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setLoadError(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.cursor = 'grab';

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

    const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 96), earthMaterial);
    globe.add(sphere);

    let loadedTexture: THREE.Texture | null = null;
    loader.load(
      EARTH_TEXTURE,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        earthMaterial.map = texture;
        earthMaterial.color.set(0xffffff);
        earthMaterial.needsUpdate = true;
        loadedTexture = texture;
      },
      undefined,
      () => setLoadError(true)
    );

    loader.load(SPECULAR_TEXTURE, (texture) => {
      earthMaterial.specularMap = texture;
      earthMaterial.needsUpdate = true;
    });

    // Faint latitude/longitude cage, like the reference globe's graticule.
    const graticule = new THREE.Mesh(
      new THREE.SphereGeometry(1.002, 48, 32),
      new THREE.MeshBasicMaterial({
        color: 0x9fd8c4,
        wireframe: true,
        transparent: true,
        opacity: 0.09,
      })
    );
    globe.add(graticule);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.14, 64, 64),
      new THREE.MeshBasicMaterial({
        color: 0x6fd3b0,
        transparent: true,
        opacity: 0.12,
        side: THREE.BackSide,
      })
    );
    scene.add(atmosphere);

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

    globe.rotation.y = longitudeToRotation(city.lng);

    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let rotationVelocity = 0;

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      renderer.domElement.style.cursor = 'grabbing';
    };
    const onPointerMove = (event: PointerEvent) => {
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
    const onPointerUp = () => {
      dragging = false;
      renderer.domElement.style.cursor = 'grab';
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const resize = () => {
      const width = mount.clientWidth || 1;
      const height = mount.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      if (spinningRef.current && !dragging) {
        globe.rotation.y += 0.0016;
      } else if (!dragging) {
        globe.rotation.y += rotationVelocity;
        rotationVelocity *= 0.94;
      }
      starField.rotation.y += 0.00012;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      sphere.geometry.dispose();
      graticule.geometry.dispose();
      atmosphere.geometry.dispose();
      stars.dispose();
      earthMaterial.dispose();
      loadedTexture?.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [city.lng]);

  const resetView = () => {
    setLoadError(false);
  };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-[#050d0b] ${
        fullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
      data-testid="home-earth-globe"
    >
      <div className={fullscreen ? 'absolute inset-0' : 'relative aspect-[16/10] sm:aspect-[16/9]'}>
        <div ref={mountRef} className="absolute inset-0" />

        {loadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6">
            <Globe2 className="w-8 h-8 text-[#6fd3b0]" />
            <p className="text-sm text-[#d7ece3]">
              {lang === 'bn'
                ? 'থ্রিডি গ্লোব লোড করা যাচ্ছে না (WebGL বন্ধ থাকতে পারে)।'
                : 'The 3D globe could not load (WebGL may be disabled).'}
            </p>
            <button
              type="button"
              onClick={resetView}
              className="px-3 py-1.5 rounded-lg bg-white/12 hover:bg-white/20 text-xs font-semibold text-white cursor-pointer"
            >
              {lang === 'bn' ? 'আবার চেষ্টা করুন' : 'Try again'}
            </button>
          </div>
        )}

        <div className="absolute top-3 left-3 flex items-center gap-1.5 text-[11px] text-white/85 bg-black/35 backdrop-blur px-2.5 py-1 rounded-lg">
          <Globe2 className="w-3.5 h-3.5 text-[#6fd3b0]" />
          <span>
            {lang === 'bn' ? 'পৃথিবী · লাইভ থ্রিডি' : 'Earth · live 3D'}
          </span>
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSpinning((s) => !s)}
            aria-label={spinning ? (lang === 'bn' ? 'ঘোরানো থামান' : 'Pause rotation') : lang === 'bn' ? 'ঘোরান' : 'Resume rotation'}
            className="p-2 rounded-lg bg-black/35 hover:bg-black/55 backdrop-blur text-white cursor-pointer"
          >
            {spinning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label={fullscreen ? (lang === 'bn' ? 'ফুলস্ক্রিন বন্ধ' : 'Exit fullscreen') : lang === 'bn' ? 'ফুলস্ক্রিন' : 'Fullscreen'}
            className="p-2 rounded-lg bg-black/35 hover:bg-black/55 backdrop-blur text-white cursor-pointer"
          >
            {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
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
              ? 'ড্র্যাগ করে ঘোরান · স্ক্রল ছাড়াই ঘূর্ণন থামাতে পারেন'
              : 'Drag to rotate · pause the spin any time'}
          </p>
        </div>
      </div>
    </div>
  );
}
