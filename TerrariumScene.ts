import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import type { CameraPreset, TerrariumPinTelemetry, WeatherMode } from '../types/islamic';
import { getTerrariumLightingForHour } from '../utils/islamicMath';

// Pre-allocated scratch math objects (zero GC inside animation loop)
const _dummy = new THREE.Object3D();
const _vec3 = new THREE.Vector3();
const _projVec = new THREE.Vector3();
const _targetPos = new THREE.Vector3();
const _targetLook = new THREE.Vector3();
const _color = new THREE.Color();
const _spaceBg = new THREE.Color();

export interface ProjectedPinPosition {
  id: TerrariumPinTelemetry['id'];
  x: number;
  y: number;
  visible: boolean;
}

export interface TerrariumController {
  setHour: (hour: number) => void;
  setWeather: (mode: WeatherMode) => void;
  setCameraPreset: (preset: CameraPreset) => void;
  setAutoRotate: (enabled: boolean) => void;
  setPinsCallback: (cb: ((pins: ProjectedPinPosition[]) => void) | null) => void;
  resize: () => void;
  dispose: () => void;
}

function detectSoftwareGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createProceduralTexture(
  kind: 'soil' | 'bark' | 'wood' | 'stone',
  maxAnisotropy: number
): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const size = 256;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  let seed = kind === 'soil' ? 101 : kind === 'bark' ? 202 : kind === 'wood' ? 303 : 404;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  if (kind === 'soil') {
    cCtx.fillStyle = '#3b2b1e';
    cCtx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#707070';
    bCtx.fillRect(0, 0, size, size);
    for (let i = 0; i < 1600; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const r = 1 + rand() * 3.2;
      const tone = rand();
      cCtx.fillStyle = tone > 0.72 ? '#2b4a26' : tone > 0.38 ? '#4c3827' : '#2a1d13';
      cCtx.beginPath();
      cCtx.arc(x, y, r, 0, Math.PI * 2);
      cCtx.fill();

      const g = Math.floor(80 + tone * 140);
      bCtx.fillStyle = `rgb(${g},${g},${g})`;
      bCtx.beginPath();
      bCtx.arc(x, y, r, 0, Math.PI * 2);
      bCtx.fill();
    }
  } else if (kind === 'bark') {
    cCtx.fillStyle = '#5c4430';
    cCtx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, size, size);
    for (let y = 0; y < size; y += 6) {
      const shade = Math.floor(60 + rand() * 50);
      cCtx.fillStyle = `rgb(${shade + 25}, ${shade + 8}, ${shade - 8})`;
      cCtx.fillRect(0, y, size, 4 + rand() * 3);
      const bVal = Math.floor(80 + rand() * 120);
      bCtx.fillStyle = `rgb(${bVal},${bVal},${bVal})`;
      bCtx.fillRect(0, y, size, 3);
    }
  } else if (kind === 'wood') {
    cCtx.fillStyle = '#3a2416';
    cCtx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, size, size);
    for (let i = 0; i < 90; i++) {
      const y = rand() * size;
      cCtx.fillStyle = rand() > 0.5 ? 'rgba(28,15,8,0.45)' : 'rgba(90,58,36,0.3)';
      cCtx.fillRect(0, y, size, 1 + rand() * 3);
      bCtx.fillStyle = rand() > 0.5 ? 'rgba(60,60,60,0.4)' : 'rgba(170,170,170,0.4)';
      bCtx.fillRect(0, y, size, 2);
    }
  } else {
    cCtx.fillStyle = '#8d8c85';
    cCtx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#888888';
    bCtx.fillRect(0, 0, size, size);
    for (let i = 0; i < 650; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const r = 1 + rand() * 4;
      const v = Math.floor(110 + rand() * 65);
      cCtx.fillStyle = `rgb(${v},${v - 2},${v - 6})`;
      cCtx.beginPath();
      cCtx.arc(x, y, r, 0, Math.PI * 2);
      cCtx.fill();
      bCtx.fillStyle = `rgb(${v},${v},${v})`;
      bCtx.beginPath();
      bCtx.arc(x, y, r, 0, Math.PI * 2);
      bCtx.fill();
    }
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap };
}

function groundHeightAt(x: number, z: number): number {
  const r = Math.hypot(x, z);
  const mound = Math.max(0, 0.36 - r * 0.14);
  const ripple = Math.sin(x * 1.9 + 0.4) * Math.cos(z * 1.7) * 0.055;
  const pondDip = Math.hypot(x - 0.65, z - 0.55) < 0.62 ? -0.14 : 0;
  return mound + ripple + pondDip;
}

const CAMERA_PRESETS: Record<CameraPreset, { pos: [number, number, number]; target: [number, number, number] }> = {
  overview: { pos: [5.25, 3.25, 6.25], target: [0, 0.55, 0] },
  flora: { pos: [-1.95, 1.85, 2.55], target: [-0.25, 1.32, -0.1] },
  soil: { pos: [-2.65, 0.65, 3.15], target: [-0.45, 0.25, 0.2] },
  fountain: { pos: [2.1, 1.45, 2.35], target: [0.65, 0.42, 0.55] },
  lantern: { pos: [1.75, 1.25, 2.15], target: [0.65, 0.72, -0.15] },
  canopy: { pos: [0.45, 5.3, 1.85], target: [0, 0.85, 0] },
};

const PIN_WORLD_ANCHORS: Array<{ id: TerrariumPinTelemetry['id']; pos: THREE.Vector3 }> = [
  { id: 'palm', pos: new THREE.Vector3(-0.28, 2.05, -0.18) },
  { id: 'fountain', pos: new THREE.Vector3(0.65, 0.48, 0.55) },
  { id: 'soil', pos: new THREE.Vector3(-1.35, 0.22, 1.1) },
  { id: 'lantern', pos: new THREE.Vector3(0.65, 0.88, -0.15) },
  { id: 'ferns', pos: new THREE.Vector3(-0.95, 0.72, 0.85) },
];

export function mountTerrariumScene(
  container: HTMLElement,
  initialHour = 16.0,
  initialWeather: WeatherMode = 'clear'
): TerrariumController {
  const isSoftwareGl = detectSoftwareGl();

  const width = Math.max(300, container.clientWidth);
  const height = Math.max(260, container.clientHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 120);
  camera.position.set(...CAMERA_PRESETS.overview.pos);

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.appendChild(renderer.domElement);

  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  // Studio PBR Environment Reflection for brass, glass, & pond reflections
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTexture;
  pmremGenerator.dispose();

  // GPU Bloom Post-Processing (skipped in software WebGL for deterministic speed)
  let composer: EffectComposer | null = null;
  let bloomPass: UnrealBloomPass | null = null;
  if (!isSoftwareGl) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.42,
      0.45,
      0.86
    );
    composer.addPass(bloomPass);
  }

  // Lighting Rig (Key + Hemisphere Fill + Rim + Pond & Lantern PointLights)
  const keyLight = new THREE.DirectionalLight(0xffeed0, 2.4);
  keyLight.position.set(5, 8, 5);
  keyLight.castShadow = !isSoftwareGl;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 25;
  keyLight.shadow.camera.left = -4;
  keyLight.shadow.camera.right = 4;
  keyLight.shadow.camera.top = 4;
  keyLight.shadow.camera.bottom = -4;
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.normalBias = 0.02;
  scene.add(keyLight);

  const hemiLight = new THREE.HemisphereLight(0x88ccff, 0x221a12, 0.85);
  hemiLight.position.set(0, 12, 0);
  scene.add(hemiLight);

  const rimLight = new THREE.DirectionalLight(0x7dd3fc, 0.65);
  rimLight.position.set(-5, 4, -5);
  scene.add(rimLight);

  const fog = new THREE.FogExp2(0x030712, 0.02);
  scene.fog = fog;
  scene.background = new THREE.Color(0x030712);

  // Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...CAMERA_PRESETS.overview.target);
  controls.enableDamping = !isSoftwareGl;
  controls.dampingFactor = 0.06;
  controls.minDistance = 2.0;
  controls.maxDistance = 12.0;
  controls.minPolarAngle = 0.2;
  controls.maxPolarAngle = Math.PI * 0.54;
  controls.enablePan = false;
  controls.autoRotate = false;
  controls.autoRotateSpeed = 0.65;

  let cameraTransitionActive = false;
  const onControlStart = () => {
    cameraTransitionActive = false;
  };
  controls.addEventListener('start', onControlStart);

  // Resource tracking
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  // Procedural Textures
  const soilTex = createProceduralTexture('soil', maxAniso);
  const barkTex = createProceduralTexture('bark', maxAniso);
  const woodTex = createProceduralTexture('wood', maxAniso);
  const stoneTex = createProceduralTexture('stone', maxAniso);
  [soilTex, barkTex, woodTex, stoneTex].forEach((t) => textures.push(t.map, t.bumpMap));

  // Soft radial contact glow/shadow disc beneath terrarium pedestal
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sCtx = shadowCanvas.getContext('2d')!;
  const grad = sCtx.createRadialGradient(64, 64, 14, 64, 64, 62);
  grad.addColorStop(0, 'rgba(2, 6, 16, 0.78)');
  grad.addColorStop(0.55, 'rgba(14, 116, 144, 0.22)');
  grad.addColorStop(1, 'rgba(2, 6, 16, 0)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, 128, 128);
  const contactTex = new THREE.CanvasTexture(shadowCanvas);
  textures.push(contactTex);

  const contactPlane = new THREE.Mesh(
    trackGeo(new THREE.CircleGeometry(2.7, 36)),
    trackMat(
      new THREE.MeshBasicMaterial({
        map: contactTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.9,
      })
    )
  );
  contactPlane.rotation.x = -Math.PI / 2;
  contactPlane.position.y = -0.32;
  scene.add(contactPlane);

  // ==========================================================
  // 0. NASA COSMOS STARFIELD + EQUATORIAL RETICLE + ORBITAL RINGS
  // ==========================================================
  const starCount = 1100;
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  let sSeed = 918273;
  const sRand = () => {
    sSeed = (sSeed * 1664525 + 1013904223) >>> 0;
    return sSeed / 4294967296;
  };
  for (let i = 0; i < starCount; i++) {
    const u = sRand();
    const v = sRand();
    const theta = u * Math.PI * 2;
    const phi = Math.acos(2 * v - 1);
    const radius = 22 + sRand() * 28;
    starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = radius * Math.cos(phi);
    starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

    const tint = sRand();
    if (tint > 0.78) {
      _color.setHex(0xfde68a);
    } else if (tint > 0.45) {
      _color.setHex(0xbae6fd);
    } else {
      _color.setHex(0xe2e8f0);
    }
    starColors[i * 3] = _color.r;
    starColors[i * 3 + 1] = _color.g;
    starColors[i * 3 + 2] = _color.b;
  }
  const starGeo = trackGeo(new THREE.BufferGeometry());
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
  const starMat = trackMat(
    new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    })
  );
  const starField = new THREE.Points(starGeo, starMat);
  scene.add(starField);

  // Equatorial NASA Telemetry Reticle Ring on base plane
  const reticleGroup = new THREE.Group();
  reticleGroup.position.y = -0.3;
  scene.add(reticleGroup);

  const reticleOuter = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(2.48, 0.009, 6, 96)),
    trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.32,
      })
    )
  );
  reticleOuter.rotation.x = Math.PI / 2;
  reticleGroup.add(reticleOuter);

  const tickGeo = trackGeo(new THREE.BoxGeometry(0.014, 0.008, 0.12));
  const tickMat = trackMat(
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45 })
  );
  const tickInstanced = new THREE.InstancedMesh(tickGeo, tickMat, 24);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    _dummy.position.set(Math.cos(a) * 2.55, 0, Math.sin(a) * 2.55);
    _dummy.rotation.set(0, -a + Math.PI / 2, 0);
    _dummy.scale.set(1, 1, i % 6 === 0 ? 1.7 : 1.0);
    _dummy.updateMatrix();
    tickInstanced.setMatrixAt(i, _dummy.matrix);
  }
  tickInstanced.instanceMatrix.needsUpdate = true;
  tickInstanced.computeBoundingSphere();
  reticleGroup.add(tickInstanced);

  // Tilted NASA Solar & Lunar Orbital Rings + Sun/Moon Orbs
  const orbitGroup = new THREE.Group();
  orbitGroup.position.set(0, 1.35, 0);
  orbitGroup.rotation.z = 0.22;
  orbitGroup.rotation.x = 0.14;
  scene.add(orbitGroup);

  const solarOrbitMat = trackMat(
    new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.62 })
  );
  const solarOrbitRing = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(3.35, 0.012, 8, 128)),
    solarOrbitMat
  );
  solarOrbitRing.rotation.x = Math.PI / 2;
  orbitGroup.add(solarOrbitRing);

  const lunarOrbitMat = trackMat(
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.34 })
  );
  const lunarOrbitRing = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(3.75, 0.009, 8, 128)),
    lunarOrbitMat
  );
  lunarOrbitRing.rotation.x = Math.PI / 2;
  lunarOrbitRing.rotation.y = 0.24;
  orbitGroup.add(lunarOrbitRing);

  const sunOrbMat = trackMat(new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
  const sunOrb = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.16, 18, 18)), sunOrbMat);
  const sunHaloMat = trackMat(
    new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.3 })
  );
  const sunHalo = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.28, 16, 16)), sunHaloMat);
  sunOrb.add(sunHalo);
  orbitGroup.add(sunOrb);

  const moonOrbMat = trackMat(new THREE.MeshBasicMaterial({ color: 0x93c5fd }));
  const moonOrb = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.11, 16, 16)), moonOrbMat);
  const moonHaloMat = trackMat(
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.24 })
  );
  const moonHalo = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.2, 14, 14)), moonHaloMat);
  moonOrb.add(moonHalo);
  orbitGroup.add(moonOrb);

  // ==========================================================
  // 1. COMPOSITE TERRARIUM VESSEL (Pedestal, Strata, Brass Frame, Glass Dome)
  // ==========================================================
  const terrariumGroup = new THREE.Group();
  scene.add(terrariumGroup);

  const walnutMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: woodTex.map,
      bumpMap: woodTex.bumpMap,
      bumpScale: 0.018,
      roughness: 0.68,
      metalness: 0.08,
    })
  );
  const brassMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xd5ad59,
      roughness: 0.22,
      metalness: 0.92,
    })
  );
  const darkMetalMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x26322d,
      roughness: 0.42,
      metalness: 0.8,
    })
  );

  const plinthPoints = [
    new THREE.Vector2(0, -0.3),
    new THREE.Vector2(1.88, -0.3),
    new THREE.Vector2(1.94, -0.22),
    new THREE.Vector2(1.94, -0.06),
    new THREE.Vector2(1.84, 0.0),
    new THREE.Vector2(0, 0.0),
  ];
  const plinthMesh = new THREE.Mesh(trackGeo(new THREE.LatheGeometry(plinthPoints, 8)), walnutMat);
  plinthMesh.castShadow = true;
  plinthMesh.receiveShadow = true;
  terrariumGroup.add(plinthMesh);

  const collarGeo = trackGeo(new THREE.TorusGeometry(1.83, 0.04, 12, 8));
  collarGeo.rotateX(Math.PI / 2);
  collarGeo.rotateY(Math.PI / 8);
  const collarMesh = new THREE.Mesh(collarGeo, brassMat);
  collarMesh.position.y = 0.015;
  terrariumGroup.add(collarMesh);

  const footGeo = trackGeo(new THREE.CylinderGeometry(0.1, 0.07, 0.08, 12));
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const foot = new THREE.Mesh(footGeo, brassMat);
    foot.position.set(Math.cos(angle) * 1.55, -0.3, Math.sin(angle) * 1.55);
    terrariumGroup.add(foot);
  }

  // Geological cross-section layers inside glass base
  const gravelMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x6c6e69,
      bumpMap: stoneTex.bumpMap,
      bumpScale: 0.025,
      roughness: 0.85,
      metalness: 0.05,
    })
  );
  const gravelLayer = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(1.74, 1.74, 0.14, 8)),
    gravelMat
  );
  gravelLayer.position.y = 0.09;
  gravelLayer.receiveShadow = true;
  terrariumGroup.add(gravelLayer);

  const charcoalLayer = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(1.73, 1.73, 0.05, 8)),
    trackMat(new THREE.MeshStandardMaterial({ color: 0x1e2422, roughness: 0.92 }))
  );
  charcoalLayer.position.y = 0.185;
  terrariumGroup.add(charcoalLayer);

  const soilGeo = trackGeo(new THREE.CylinderGeometry(1.71, 1.72, 0.22, 32, 1));
  const posAttr = soilGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vy = posAttr.getY(i);
    const vz = posAttr.getZ(i);
    if (vy > 0.05) {
      posAttr.setY(i, 0.11 + groundHeightAt(vx, vz));
    }
  }
  soilGeo.computeVertexNormals();
  const soilMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: soilTex.map,
      bumpMap: soilTex.bumpMap,
      bumpScale: 0.03,
      roughness: 0.88,
      metalness: 0.02,
    })
  );
  const soilMesh = new THREE.Mesh(soilGeo, soilMat);
  soilMesh.position.y = 0.31;
  soilMesh.receiveShadow = true;
  terrariumGroup.add(soilMesh);

  // Sunken glowing water pond + water Light + animated ripple ring
  const pondMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x0ea5e9,
      emissive: 0x0369a1,
      emissiveIntensity: 0.42,
      roughness: 0.08,
      metalness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      transparent: true,
      opacity: 0.9,
    })
  );
  const pondMesh = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(0.56, 28)), pondMat);
  pondMesh.rotation.x = -Math.PI / 2;
  pondMesh.position.set(0.65, 0.33, 0.55);
  pondMesh.receiveShadow = true;
  terrariumGroup.add(pondMesh);

  const pondRippleMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    })
  );
  const pondRipple = new THREE.Mesh(
    trackGeo(new THREE.RingGeometry(0.14, 0.17, 28)),
    pondRippleMat
  );
  pondRipple.rotation.x = -Math.PI / 2;
  pondRipple.position.set(0.65, 0.338, 0.55);
  terrariumGroup.add(pondRipple);

  const fountainGlow = new THREE.PointLight(0x38bdf8, 0.8, 3.5);
  fountainGlow.position.set(0.65, 0.65, 0.55);
  terrariumGroup.add(fountainGlow);

  // Brass octagonal vertical struts & curved dome ribs
  const domeHeight = 2.65;
  const domeRadius = 1.78;
  const strutGeo = trackGeo(new THREE.CylinderGeometry(0.022, 0.024, 1.45, 8));
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 + Math.PI / 8;
    const sx = Math.cos(angle) * domeRadius;
    const sz = Math.sin(angle) * domeRadius;

    const strut = new THREE.Mesh(strutGeo, brassMat);
    strut.position.set(sx, 0.74, sz);
    terrariumGroup.add(strut);

    const ribCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(sx, 1.45, sz),
      new THREE.Vector3(sx * 0.78, 2.32, sz * 0.78),
      new THREE.Vector3(Math.cos(angle) * 0.24, domeHeight, Math.sin(angle) * 0.24)
    );
    const ribMesh = new THREE.Mesh(
      trackGeo(new THREE.TubeGeometry(ribCurve, 12, 0.018, 6, false)),
      brassMat
    );
    terrariumGroup.add(ribMesh);
  }

  const midRing = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(domeRadius, 0.022, 8, 8)),
    brassMat
  );
  midRing.rotation.x = Math.PI / 2;
  midRing.rotation.z = Math.PI / 8;
  midRing.position.y = 1.45;
  terrariumGroup.add(midRing);

  const finialGroup = new THREE.Group();
  finialGroup.position.y = domeHeight;
  const topRing = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.24, 0.026, 10, 16)), brassMat);
  topRing.rotation.x = Math.PI / 2;
  const topCap = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.08, 12, 10)), brassMat);
  topCap.position.y = 0.09;
  const topLoop = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.08, 0.016, 8, 16)), brassMat);
  topLoop.position.y = 0.21;
  finialGroup.add(topRing, topCap, topLoop);
  terrariumGroup.add(finialGroup);

  const glassMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xe6f9f5,
      roughness: 0.06,
      metalness: 0.0,
      transmission: isSoftwareGl ? 0 : 0.9,
      transparent: true,
      opacity: isSoftwareGl ? 0.18 : 0.3,
      ior: 1.5,
      thickness: 0.18,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      depthWrite: false,
      side: THREE.FrontSide,
    })
  );

  const glassWallGeo = trackGeo(new THREE.CylinderGeometry(domeRadius - 0.015, domeRadius - 0.015, 1.44, 8, 1, true));
  glassWallGeo.rotateY(Math.PI / 8);
  const glassWall = new THREE.Mesh(glassWallGeo, glassMat);
  glassWall.position.y = 0.74;
  glassWall.renderOrder = 10;
  terrariumGroup.add(glassWall);

  const glassConeGeo = trackGeo(new THREE.CylinderGeometry(0.23, domeRadius - 0.015, domeHeight - 1.45, 8, 1, true));
  glassConeGeo.rotateY(Math.PI / 8);
  const glassCone = new THREE.Mesh(glassConeGeo, glassMat);
  glassCone.position.y = 1.45 + (domeHeight - 1.45) / 2;
  glassCone.renderOrder = 10;
  terrariumGroup.add(glassCone);

  // ==========================================================
  // 2. PROCEDURAL FLORA (Date Palm, Ferns, Moss, Stones, Lantern, Grass)
  // ==========================================================
  const floraSwayTargets: Array<{ obj: THREE.Object3D; phase: number; amp: number }> = [];

  const treeBaseY = 0.42 + groundHeightAt(-0.28, -0.18);
  const treeGroup = new THREE.Group();
  treeGroup.position.set(-0.28, treeBaseY, -0.18);
  terrariumGroup.add(treeGroup);

  const barkMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: barkTex.map,
      bumpMap: barkTex.bumpMap,
      bumpScale: 0.035,
      roughness: 0.85,
      metalness: 0.02,
    })
  );

  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.08, 0.55, 0.04),
    new THREE.Vector3(0.02, 1.15, -0.04),
    new THREE.Vector3(-0.04, 1.56, 0.02),
  ]);
  const trunkMesh = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(trunkCurve, 18, 0.085, 10, false)),
    barkMat
  );
  trunkMesh.castShadow = true;
  trunkMesh.receiveShadow = true;
  treeGroup.add(trunkMesh);

  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + 0.3;
    const rootCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(Math.cos(a) * 0.05, 0.16, Math.sin(a) * 0.05),
      new THREE.Vector3(Math.cos(a) * 0.14, 0.05, Math.sin(a) * 0.14),
      new THREE.Vector3(Math.cos(a) * 0.24, -0.03, Math.sin(a) * 0.24)
    );
    const rootMesh = new THREE.Mesh(
      trackGeo(new THREE.TubeGeometry(rootCurve, 8, 0.028, 6, false)),
      barkMat
    );
    rootMesh.castShadow = true;
    treeGroup.add(rootMesh);
  }

  const crownGroup = new THREE.Group();
  crownGroup.position.set(-0.04, 1.55, 0.02);
  treeGroup.add(crownGroup);
  floraSwayTargets.push({ obj: crownGroup, phase: 0, amp: 0.035 });

  const frondStemMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x3b6e35, roughness: 0.62, metalness: 0.02 })
  );
  const frondLeafMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x228b4d,
      roughness: 0.45,
      metalness: 0.04,
      side: THREE.DoubleSide,
    })
  );
  const dateFruitMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xe2a83b, roughness: 0.35, metalness: 0.08 })
  );

  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(0.11, 0.26, 0.02, 0.72);
  leafShape.quadraticCurveTo(-0.08, 0.28, 0, 0);
  const leafBladeGeo = trackGeo(new THREE.ShapeGeometry(leafShape, 6));

  for (let i = 0; i < 10; i++) {
    const frondPivot = new THREE.Group();
    const angle = (i / 10) * Math.PI * 2 + (i % 2) * 0.18;
    const tierTilt = i % 2 === 0 ? 0.35 : 0.72;
    frondPivot.rotation.y = angle;
    frondPivot.rotation.x = tierTilt;

    const spineCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0.22, 0.44),
      new THREE.Vector3(0, -0.05, 0.88)
    );
    const spineMesh = new THREE.Mesh(
      trackGeo(new THREE.TubeGeometry(spineCurve, 10, 0.014, 5, false)),
      frondStemMat
    );
    frondPivot.add(spineMesh);

    for (let j = 1; j <= 5; j++) {
      const t = j / 6;
      const pt = spineCurve.getPoint(t);
      const scale = (1 - t * 0.45) * 0.48;
      for (const side of [-1, 1]) {
        const leaflet = new THREE.Mesh(leafBladeGeo, frondLeafMat);
        leaflet.position.copy(pt);
        leaflet.scale.setScalar(scale);
        leaflet.rotation.x = Math.PI * 0.48;
        leaflet.rotation.z = side * 0.75;
        leaflet.castShadow = true;
        frondPivot.add(leaflet);
      }
    }

    crownGroup.add(frondPivot);
    floraSwayTargets.push({ obj: frondPivot, phase: i * 0.7, amp: 0.03 });
  }

  const dateGeo = trackGeo(new THREE.SphereGeometry(0.035, 8, 8));
  for (let c = 0; c < 3; c++) {
    const ca = (c * Math.PI * 2) / 3 + 0.5;
    const cluster = new THREE.Group();
    cluster.position.set(Math.cos(ca) * 0.11, -0.08, Math.sin(ca) * 0.11);
    for (let d = 0; d < 4; d++) {
      const berry = new THREE.Mesh(dateGeo, dateFruitMat);
      berry.position.set((d % 2) * 0.03 - 0.015, -d * 0.032, ((d + 1) % 2) * 0.03 - 0.015);
      cluster.add(berry);
    }
    crownGroup.add(cluster);
  }

  // Secondary Fern Rosettes
  const fernLocations: Array<[number, number, number]> = [
    [-0.95, 0.85, 0.88],
    [0.72, -0.68, 0.95],
    [-0.78, -0.82, 0.75],
  ];
  const fernMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x2f9b53,
      roughness: 0.58,
      metalness: 0.02,
      side: THREE.DoubleSide,
    })
  );

  fernLocations.forEach(([fx, fz, fScale], fIdx) => {
    const fernGroup = new THREE.Group();
    fernGroup.position.set(fx, 0.41 + groundHeightAt(fx, fz), fz);
    fernGroup.scale.setScalar(fScale);
    for (let b = 0; b < 7; b++) {
      const frond = new THREE.Mesh(leafBladeGeo, fernMat);
      frond.rotation.y = (b / 7) * Math.PI * 2;
      frond.rotation.x = 0.85 + (b % 2) * 0.25;
      frond.scale.setScalar(0.62);
      frond.castShadow = true;
      fernGroup.add(frond);
    }
    terrariumGroup.add(fernGroup);
    floraSwayTargets.push({ obj: fernGroup, phase: fIdx * 1.4, amp: 0.04 });
  });

  // Moss cushions
  const mossMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x3b8a42,
      bumpMap: soilTex.bumpMap,
      bumpScale: 0.02,
      roughness: 0.9,
      metalness: 0.0,
    })
  );
  const mossPositions: Array<[number, number, number, number]> = [
    [-0.65, 0.42, 0.35, 0.55],
    [0.12, -0.82, 0.38, 0.48],
    [1.05, 0.05, 0.34, 0.52],
    [-0.25, 0.95, 0.36, 0.45],
  ];
  mossPositions.forEach(([mx, mz, sx, sy]) => {
    const moss = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(sx, 14, 10)), mossMat);
    moss.scale.set(1.15, sy, 0.95);
    moss.position.set(mx, 0.39 + groundHeightAt(mx, mz), mz);
    moss.receiveShadow = true;
    terrariumGroup.add(moss);
  });

  // River stones
  const wetStoneMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: stoneTex.map,
      bumpMap: stoneTex.bumpMap,
      bumpScale: 0.02,
      roughness: 0.28,
      metalness: 0.06,
    })
  );
  const stoneCoords: Array<[number, number, number]> = [
    [0.15, 0.52, 0.14],
    [0.32, 0.85, 0.11],
    [0.98, 0.72, 0.13],
    [1.12, 0.32, 0.1],
    [-0.08, 0.18, 0.12],
    [0.42, 0.02, 0.1],
  ];
  stoneCoords.forEach(([rx, rz, rs], idx) => {
    const stone = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(rs, 1)), wetStoneMat);
    stone.scale.set(1.25, 0.62, 0.95);
    stone.rotation.y = idx * 1.1;
    stone.position.set(rx, 0.41 + groundHeightAt(rx, rz), rz);
    stone.castShadow = true;
    stone.receiveShadow = true;
    terrariumGroup.add(stone);
  });

  // Miniature Islamic Brass Garden Lantern
  const lx = 0.65;
  const lz = -0.15;
  const lanternGroup = new THREE.Group();
  lanternGroup.position.set(lx, 0.41 + groundHeightAt(lx, lz), lz);
  terrariumGroup.add(lanternGroup);

  const lBase = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.11, 0.13, 0.06, 6)), darkMetalMat);
  lBase.position.y = 0.03;
  const lPost = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.022, 0.026, 0.28, 8)), brassMat);
  lPost.position.y = 0.18;
  const lGlowMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffdf96,
      emissive: 0xffa73b,
      emissiveIntensity: 1.4,
      roughness: 0.2,
    })
  );
  const lCore = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.065, 0.065, 0.14, 6)), lGlowMat);
  lCore.position.y = 0.39;
  const lRoof = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.12, 0.11, 6)), brassMat);
  lRoof.position.y = 0.51;
  const lTip = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.025, 8, 8)), brassMat);
  lTip.position.y = 0.58;
  lanternGroup.add(lBase, lPost, lCore, lRoof, lTip);

  const lanternLight = new THREE.PointLight(0xffb454, 1.2, 4.0, 1.8);
  lanternLight.position.set(0, 0.4, 0);
  lanternGroup.add(lanternLight);

  // Instanced Meadow Grass
  const grassCount = 96;
  const bladeGeo = trackGeo(new THREE.ConeGeometry(0.015, 0.24, 4));
  bladeGeo.translate(0, 0.12, 0);
  const grassMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x368c44,
      roughness: 0.85,
      metalness: 0.0,
      envMapIntensity: 0.35,
    })
  );
  const grassInstanced = new THREE.InstancedMesh(bladeGeo, grassMat, grassCount);
  grassInstanced.castShadow = false;
  grassInstanced.receiveShadow = true;

  const grassData: Array<{ x: number; y: number; z: number; rotY: number; scale: number; phase: number }> = [];
  for (let i = 0; i < grassCount; i++) {
    const angle = (i * 2.39996) % (Math.PI * 2);
    const radius = 0.22 + Math.sqrt((i + 1) / grassCount) * 1.25;
    let gx = Math.cos(angle) * radius;
    let gz = Math.sin(angle) * radius;
    if (Math.hypot(gx - 0.65, gz - 0.55) < 0.64) {
      gx = -gx;
    }
    const gy = 0.41 + groundHeightAt(gx, gz);
    const scale = 0.85 + ((i * 37) % 30) / 100;
    const rotY = (i * 1.3) % (Math.PI * 2);

    _dummy.position.set(gx, gy, gz);
    _dummy.rotation.set(0, rotY, 0);
    _dummy.scale.setScalar(scale);
    _dummy.updateMatrix();
    grassInstanced.setMatrixAt(i, _dummy.matrix);

    const shade = 0.82 + (i % 5) * 0.06;
    _color.setRGB(shade * 0.9, shade * 1.06, shade * 0.88);
    grassInstanced.setColorAt(i, _color);
    grassData.push({ x: gx, y: gy, z: gz, rotY, scale, phase: i * 0.4 });
  }
  grassInstanced.instanceMatrix.needsUpdate = true;
  if (grassInstanced.instanceColor) grassInstanced.instanceColor.needsUpdate = true;
  grassInstanced.computeBoundingSphere();
  terrariumGroup.add(grassInstanced);

  // ==========================================================
  // 3. WEATHER & BIOLUMINESCENT SPORE SYSTEMS
  // ==========================================================
  // Rain Streaks
  const rainCount = 160;
  const rainGeo = trackGeo(new THREE.CylinderGeometry(0.006, 0.006, 0.3, 4));
  const rainMat = trackMat(
    new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.68 })
  );
  const rainInstanced = new THREE.InstancedMesh(rainGeo, rainMat, rainCount);
  rainInstanced.frustumCulled = false;
  rainInstanced.visible = false;
  scene.add(rainInstanced);

  const rainDrops: Array<{ x: number; y: number; z: number; speed: number }> = [];
  for (let i = 0; i < rainCount; i++) {
    const angle = (i * 2.13) % (Math.PI * 2);
    const rad = 0.5 + ((i * 19) % 100) / 26;
    rainDrops.push({
      x: Math.cos(angle) * rad,
      y: (i * 0.37) % 5.5,
      z: Math.sin(angle) * rad,
      speed: 4.8 + (i % 5) * 0.65,
    });
  }

  // Mist Clouds inside terrarium
  const mistGroup = new THREE.Group();
  mistGroup.visible = false;
  scene.add(mistGroup);
  const mistMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: 0xe2f1ee,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
    })
  );
  const mistRings: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.42 + (i % 2) * 0.16, 12, 10)), mistMat);
    m.scale.set(1.6, 0.32, 1.3);
    const ma = (i / 6) * Math.PI * 2;
    m.position.set(Math.cos(ma) * 0.72, 0.68 + (i % 3) * 0.22, Math.sin(ma) * 0.72);
    mistGroup.add(m);
    mistRings.push(m);
  }

  // Bioluminescent Night Fireflies / Spores inside glass dome
  const fireflyCount = 48;
  const fireflyPos = new Float32Array(fireflyCount * 3);
  for (let i = 0; i < fireflyCount; i++) {
    const r = 0.25 + ((i * 13) % 100) / 80;
    const theta = (i * 2.39996) % (Math.PI * 2);
    fireflyPos[i * 3] = Math.cos(theta) * r;
    fireflyPos[i * 3 + 1] = 0.55 + ((i * 19) % 100) / 62;
    fireflyPos[i * 3 + 2] = Math.sin(theta) * r;
  }
  const fireflyGeo = trackGeo(new THREE.BufferGeometry());
  fireflyGeo.setAttribute('position', new THREE.BufferAttribute(fireflyPos, 3));
  const fireflyMat = trackMat(
    new THREE.PointsMaterial({
      color: 0x4ade80,
      size: 0.085,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
    })
  );
  const fireflySystem = new THREE.Points(fireflyGeo, fireflyMat);
  fireflySystem.visible = false;
  terrariumGroup.add(fireflySystem);

  // ==========================================================
  // 4. STATE, NASA ORBITAL LIGHTING & RENDER LOOP
  // ==========================================================
  let currentHour = initialHour;
  let targetHour = initialHour;
  let weatherMode: WeatherMode = initialWeather;
  let activePreset: CameraPreset = 'overview';
  let pinsCallback: ((pins: ProjectedPinPosition[]) => void) | null = null;

  function applyLighting(hourVal: number) {
    const l = getTerrariumLightingForHour(hourVal);
    const orbitAngle = ((hourVal - 6) / 24) * Math.PI * 2;

    // Move Sun & Moon Orbs along tilted NASA orbital rings
    sunOrb.position.set(Math.cos(orbitAngle) * 3.35, 0, Math.sin(orbitAngle) * 3.35);
    moonOrb.position.set(-Math.cos(orbitAngle) * 3.75, 0, -Math.sin(orbitAngle) * 3.75);

    const radius = 9;
    keyLight.position.set(
      Math.cos(l.sunAzimuth) * Math.cos(l.sunElevation) * radius,
      Math.max(1.5, Math.sin(l.sunElevation) * radius + 1.4),
      Math.sin(l.sunAzimuth) * Math.cos(l.sunElevation) * radius
    );
    keyLight.color.setHex(l.sunColorHex);
    keyLight.intensity = weatherMode === 'rain' ? l.sunIntensity * 0.72 : l.sunIntensity * 1.08;

    hemiLight.color.setHex(l.hemiSkyHex);
    hemiLight.groundColor.setHex(l.hemiGroundHex);
    hemiLight.intensity = Math.max(0.55, l.hemiIntensity);

    // Deep NASA Eyes Cosmic Space Backdrop (smooth gradient across Fajr, Noon, Maghrib, Night)
    if (l.isNight) {
      _spaceBg.setHex(0x02050d);
    } else if (hourVal < 7.5) {
      _spaceBg.setHex(0x0c1324);
    } else if (hourVal > 17.0) {
      _spaceBg.setHex(0x130e20);
    } else {
      _spaceBg.setHex(0x071324);
    }

    if (weatherMode === 'mist') {
      _spaceBg.lerp(_color.setHex(0x112029), 0.35);
    } else if (weatherMode === 'rain') {
      _spaceBg.lerp(_color.setHex(0x09111c), 0.4);
    }

    (scene.background as THREE.Color).copy(_spaceBg);
    fog.color.copy(_spaceBg);
    fog.density = weatherMode === 'mist' ? 0.045 : weatherMode === 'rain' ? 0.028 : 0.014;

    // Stars & Orbits visibility
    starMat.opacity = l.isNight ? 0.95 : hourVal > 17 || hourVal < 7.5 ? 0.72 : 0.45;
    solarOrbitMat.opacity = l.isNight ? 0.28 : 0.65;
    lunarOrbitMat.opacity = l.isNight ? 0.62 : 0.3;

    // Lantern & Pond & Bioluminescent Spores
    lanternLight.intensity = Math.max(0.45, l.lanternIntensity);
    lGlowMat.emissiveIntensity = 0.45 + l.lanternIntensity * 0.85;
    fountainGlow.intensity = l.isNight ? 1.55 : 0.65;
    fireflySystem.visible = l.isNight || hourVal < 5.6 || weatherMode === 'mist';
  }

  function applyWeather(mode: WeatherMode) {
    weatherMode = mode;
    rainInstanced.visible = mode === 'rain';
    mistGroup.visible = mode === 'mist';
    wetStoneMat.roughness = mode === 'rain' ? 0.14 : mode === 'mist' ? 0.22 : 0.36;
    pondMat.roughness = mode === 'rain' ? 0.16 : 0.06;
    glassMat.roughness = mode === 'rain' ? 0.2 : 0.06;
    applyLighting(currentHour);
  }

  applyWeather(initialWeather);
  applyLighting(initialHour);

  if (!isSoftwareGl) {
    renderer.compile(scene, camera);
  }

  let lastTime = performance.now();
  const startTime = lastTime;
  let frameId = 0;
  let pollTimerId = 0;
  let disposed = false;

  function projectPins() {
    if (!pinsCallback) return;
    const w = container.clientWidth || width;
    const h = container.clientHeight || height;
    const projected: ProjectedPinPosition[] = PIN_WORLD_ANCHORS.map((anchor) => {
      _projVec.copy(anchor.pos).project(camera);
      const visible = _projVec.z <= 1 && _projVec.z >= -1;
      const x = (_projVec.x * 0.5 + 0.5) * w;
      const y = (-_projVec.y * 0.5 + 0.5) * h;
      return { id: anchor.id, x, y, visible };
    });
    pinsCallback(projected);
  }

  function afterDraw(cb: () => void) {
    const gl = renderer.getContext() as WebGL2RenderingContext;
    const sync = typeof gl.fenceSync === 'function'
      ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0)
      : null;
    gl.flush();
    const waitStart = performance.now();
    const poll = () => {
      if (disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const timedOut = performance.now() - waitStart > 120;
      const state = sync && !timedOut ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
      if (state === gl.UNSIGNALED) {
        pollTimerId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        pollTimerId = window.setTimeout(cb, 80);
      }
    };
    pollTimerId = window.setTimeout(poll, 5);
  }

  function tick() {
    if (disposed) return;
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    const elapsed = (now - startTime) / 1000;

    if (Math.abs(targetHour - currentHour) > 0.002) {
      currentHour = THREE.MathUtils.damp(currentHour, targetHour, 6, dt);
      applyLighting(currentHour);
    }

    if (cameraTransitionActive) {
      const preset = CAMERA_PRESETS[activePreset];
      _targetPos.set(preset.pos[0], preset.pos[1], preset.pos[2]);
      _targetLook.set(preset.target[0], preset.target[1], preset.target[2]);
      const alpha = 1 - Math.exp(-6.0 * dt);
      camera.position.lerp(_targetPos, alpha);
      controls.target.lerp(_targetLook, alpha);
      if (camera.position.distanceTo(_targetPos) < 0.025) {
        camera.position.copy(_targetPos);
        controls.target.copy(_targetLook);
        cameraTransitionActive = false;
      }
    }

    // Gentle botanical breeze sway
    const breezeAmp = weatherMode === 'rain' ? 1.8 : 1.0;
    for (let i = 0; i < floraSwayTargets.length; i++) {
      const f = floraSwayTargets[i];
      f.obj.rotation.z = Math.sin(elapsed * 1.4 + f.phase) * f.amp * breezeAmp;
    }

    // Pond ripple pulse
    const ripplePhase = (elapsed * 0.55) % 1;
    const rippleScale = 0.6 + ripplePhase * 2.2;
    pondRipple.scale.set(rippleScale, rippleScale, 1);
    pondRippleMat.opacity = (1 - ripplePhase) * 0.45;

    // Grass sway
    for (let i = 0; i < grassCount; i++) {
      const g = grassData[i];
      _dummy.position.set(g.x, g.y, g.z);
      _dummy.rotation.set(
        Math.sin(elapsed * 1.8 + g.phase) * 0.08 * breezeAmp,
        g.rotY,
        Math.cos(elapsed * 1.5 + g.phase) * 0.06 * breezeAmp
      );
      _dummy.scale.setScalar(g.scale);
      _dummy.updateMatrix();
      grassInstanced.setMatrixAt(i, _dummy.matrix);
    }
    grassInstanced.instanceMatrix.needsUpdate = true;

    // Rain particle update
    if (weatherMode === 'rain') {
      for (let i = 0; i < rainCount; i++) {
        const drop = rainDrops[i];
        drop.y -= drop.speed * dt;
        if (drop.y < -0.25) {
          drop.y = 5.2;
        }
        _dummy.position.set(drop.x, drop.y, drop.z);
        _dummy.rotation.set(0, 0, 0.06);
        _dummy.scale.setScalar(1);
        _dummy.updateMatrix();
        rainInstanced.setMatrixAt(i, _dummy.matrix);
      }
      rainInstanced.instanceMatrix.needsUpdate = true;
    }

    // Mist drift update
    if (weatherMode === 'mist') {
      for (let i = 0; i < mistRings.length; i++) {
        const m = mistRings[i];
        const a = (i / mistRings.length) * Math.PI * 2 + elapsed * 0.14;
        m.position.x = Math.cos(a) * 0.72;
        m.position.z = Math.sin(a) * 0.72;
      }
    }

    // Night fireflies gentle float
    if (fireflySystem.visible) {
      fireflySystem.rotation.y = elapsed * 0.16;
      fireflySystem.position.y = Math.sin(elapsed * 1.5) * 0.05;
    }

    // Subtle slow starfield drift
    starField.rotation.y = elapsed * 0.008;

    controls.update();

    if (composer) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }

    projectPins();

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }
  }

  tick();

  function handleResize() {
    if (disposed) return;
    const w = Math.max(300, container.clientWidth);
    const h = Math.max(260, container.clientHeight);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    if (composer) {
      composer.setSize(w, h);
      bloomPass?.setSize(w, h);
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
    projectPins();
  }

  const resizeObserver = new ResizeObserver(handleResize);
  resizeObserver.observe(container);

  return {
    setHour(hour: number) {
      targetHour = Math.max(0, Math.min(24, hour));
    },
    setWeather(mode: WeatherMode) {
      applyWeather(mode);
    },
    setCameraPreset(preset: CameraPreset) {
      activePreset = preset;
      cameraTransitionActive = true;
    },
    setAutoRotate(enabled: boolean) {
      controls.autoRotate = isSoftwareGl ? false : enabled;
    },
    setPinsCallback(cb: ((pins: ProjectedPinPosition[]) => void) | null) {
      pinsCallback = cb;
      projectPins();
    },
    resize: handleResize,
    dispose() {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(pollTimerId);
      resizeObserver.disconnect();
      controls.removeEventListener('start', onControlStart);
      controls.dispose();
      composer?.dispose();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      envTexture.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}
