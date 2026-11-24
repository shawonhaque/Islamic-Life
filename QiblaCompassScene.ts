import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export interface QiblaCompassController {
  setQiblaBearing: (bearingDeg: number) => void;
  setDeviceHeading: (headingDeg: number) => void;
  resetView: () => void;
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

export function shortestAngleDelta(fromDeg: number, toDeg: number): number {
  return (((toDeg - fromDeg + 540) % 360) + 360) % 360 - 180;
}

function createCompassDialTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;

  // Warm ivory parchment dial base
  const bgGrad = ctx.createRadialGradient(cx, cy, 40, cx, cy, 490);
  bgGrad.addColorStop(0, '#fffdf7');
  bgGrad.addColorStop(0.72, '#faf5e6');
  bgGrad.addColorStop(1, '#ede3cc');
  ctx.fillStyle = bgGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 500, 0, Math.PI * 2);
  ctx.fill();

  // Subtle 8-point Islamic geometric star rosette in center
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = 'rgba(181, 131, 40, 0.22)';
  ctx.lineWidth = 2.5;
  for (let s = 0; s < 2; s++) {
    ctx.save();
    ctx.rotate((s * Math.PI) / 4);
    ctx.strokeRect(-145, -145, 290, 290);
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, 212, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(8, 118, 83, 0.28)';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, 345, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(181, 131, 40, 0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // 72 graduation ticks (every 5 degrees) + degree labels every 30 degrees
  for (let deg = 0; deg < 360; deg += 5) {
    const rad = ((deg - 90) * Math.PI) / 180;
    const isMajor = deg % 30 === 0;
    const isMedium = deg % 10 === 0;
    const rOuter = 474;
    const rInner = isMajor ? 430 : isMedium ? 446 : 458;

    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(rad) * rInner, cy + Math.sin(rad) * rInner);
    ctx.lineTo(cx + Math.cos(rad) * rOuter, cy + Math.sin(rad) * rOuter);
    ctx.strokeStyle = deg === 0 ? '#087653' : isMajor ? '#183027' : 'rgba(90, 112, 102, 0.65)';
    ctx.lineWidth = deg === 0 ? 6 : isMajor ? 4 : isMedium ? 2.5 : 1.5;
    ctx.stroke();

    if (isMajor && deg % 90 !== 0) {
      const tx = cx + Math.cos(rad) * 392;
      const ty = cy + Math.sin(rad) * 392;
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate((deg * Math.PI) / 180);
      ctx.fillStyle = '#494e45';
      ctx.font = '600 24px ui-monospace, SFMono-Regular, Menlo, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${deg}°`, 0, 0);
      ctx.restore();
    }
  }

  // Cardinal markers N / E / S / W + Arabic sub-labels
  const cardinals = [
    { deg: 0, label: 'N', sub: 'شمال', color: '#087653' },
    { deg: 90, label: 'E', sub: 'شرق', color: '#183027' },
    { deg: 180, label: 'S', sub: 'جنوب', color: '#183027' },
    { deg: 270, label: 'W', sub: 'غرب', color: '#183027' },
  ];

  for (const c of cardinals) {
    const rad = ((c.deg - 90) * Math.PI) / 180;
    const tx = cx + Math.cos(rad) * 378;
    const ty = cy + Math.sin(rad) * 378;
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate((c.deg * Math.PI) / 180);
    ctx.fillStyle = c.color;
    ctx.font = '800 50px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(c.label, 0, -10);
    ctx.fillStyle = '#8f6319';
    ctx.font = '600 22px sans-serif';
    ctx.fillText(c.sub, 0, 28);
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function mountQiblaCompassScene(
  container: HTMLElement,
  initialBearingDeg: number,
  initialHeadingDeg = 0
): QiblaCompassController {
  const isSoftwareGl = detectSoftwareGl();
  const width = Math.max(280, container.clientWidth);
  const height = Math.max(280, container.clientHeight);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf6f2e7);

  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 40);
  const defaultCamPos = new THREE.Vector3(0, 4.15, 2.75);
  camera.position.copy(defaultCamPos);

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.appendChild(renderer.domElement);

  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  // Studio IBL environment for brushed brass & glass reflections
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTexture;
  pmremGenerator.dispose();

  // Three-point studio lighting
  const keyLight = new THREE.DirectionalLight(0xfff1d6, 2.2);
  keyLight.position.set(3.5, 6.2, 3.8);
  keyLight.castShadow = !isSoftwareGl;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 16;
  keyLight.shadow.camera.left = -2.8;
  keyLight.shadow.camera.right = 2.8;
  keyLight.shadow.camera.top = 2.8;
  keyLight.shadow.camera.bottom = -2.8;
  keyLight.shadow.bias = -0.0005;
  scene.add(keyLight);

  const hemiLight = new THREE.HemisphereLight(0xfffaf0, 0x3b4d3e, 1.05);
  scene.add(hemiLight);

  const rimLight = new THREE.DirectionalLight(0xd7efe7, 0.75);
  rimLight.position.set(-4, 3, -3.5);
  scene.add(rimLight);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.05, 0);
  controls.enableDamping = !isSoftwareGl;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 2.8;
  controls.maxDistance = 7.0;
  controls.minPolarAngle = 0.15;
  controls.maxPolarAngle = Math.PI * 0.44;

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

  // Grounding contact shadow beneath compass housing
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sCtx = shadowCanvas.getContext('2d')!;
  const sGrad = sCtx.createRadialGradient(64, 64, 14, 64, 64, 62);
  sGrad.addColorStop(0, 'rgba(20, 32, 26, 0.42)');
  sGrad.addColorStop(0.65, 'rgba(20, 32, 26, 0.16)');
  sGrad.addColorStop(1, 'rgba(20, 32, 26, 0)');
  sCtx.fillStyle = sGrad;
  sCtx.fillRect(0, 0, 128, 128);
  const contactTex = new THREE.CanvasTexture(shadowCanvas);
  textures.push(contactTex);

  const contactPlane = new THREE.Mesh(
    trackGeo(new THREE.CircleGeometry(2.35, 32)),
    trackMat(
      new THREE.MeshBasicMaterial({
        map: contactTex,
        transparent: true,
        depthWrite: false,
      })
    )
  );
  contactPlane.rotation.x = -Math.PI / 2;
  contactPlane.position.y = -0.24;
  scene.add(contactPlane);

  // Materials
  const brassMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xd5ad59,
      roughness: 0.24,
      metalness: 0.9,
    })
  );
  const walnutCaseMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x16382b,
      roughness: 0.38,
      metalness: 0.22,
    })
  );
  const emeraldMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x087653,
      roughness: 0.28,
      metalness: 0.35,
    })
  );
  const tailNeedleMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xcbd5ce,
      roughness: 0.4,
      metalness: 0.55,
    })
  );
  const kaabaBlackMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x151817,
      roughness: 0.48,
      metalness: 0.15,
    })
  );
  const beaconMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xd5ad59,
      emissive: 0x087653,
      emissiveIntensity: 0.2,
      roughness: 0.25,
      metalness: 0.65,
    })
  );

  // =========================================================
  // 1. COMPOSITE HOUSING (Base Plinth, Outer Bezel, Knurled Ring, Lubber Beacon, Crystal Glass)
  // =========================================================
  const compassRoot = new THREE.Group();
  scene.add(compassRoot);

  // Turned lower housing profile
  const housingPoints = [
    new THREE.Vector2(0, -0.22),
    new THREE.Vector2(1.76, -0.22),
    new THREE.Vector2(1.86, -0.14),
    new THREE.Vector2(1.86, 0.08),
    new THREE.Vector2(1.74, 0.15),
    new THREE.Vector2(1.58, 0.15),
    new THREE.Vector2(1.54, 0.02),
    new THREE.Vector2(0, 0.02),
  ];
  const housingMesh = new THREE.Mesh(
    trackGeo(new THREE.LatheGeometry(housingPoints, 48)),
    walnutCaseMat
  );
  housingMesh.castShadow = true;
  housingMesh.receiveShadow = true;
  compassRoot.add(housingMesh);

  // Brushed brass outer bezel collar
  const bezelTorus = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(1.7, 0.055, 16, 48)),
    brassMat
  );
  bezelTorus.rotation.x = Math.PI / 2;
  bezelTorus.position.y = 0.15;
  bezelTorus.castShadow = true;
  compassRoot.add(bezelTorus);

  // Knurled brass grip notches around perimeter (24 lugs)
  const lugGeo = trackGeo(new THREE.BoxGeometry(0.05, 0.18, 0.04));
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const lug = new THREE.Mesh(lugGeo, brassMat);
    lug.position.set(Math.cos(a) * 1.86, -0.03, Math.sin(a) * 1.86);
    lug.rotation.y = -a + Math.PI / 2;
    compassRoot.add(lug);
  }

  // Fixed Device-Forward Lubber Line / Alignment Beacon at -Z (Top of compass housing)
  const beaconGroup = new THREE.Group();
  beaconGroup.position.set(0, 0.19, -1.7);
  const beaconBase = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.09, 0.18, 4)), beaconMat);
  beaconBase.rotation.x = Math.PI / 2;
  beaconBase.rotation.z = Math.PI / 4;
  beaconBase.position.z = 0.06;
  const beaconGem = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.065, 0)), beaconMat);
  beaconGem.position.set(0, 0.05, -0.02);
  beaconGroup.add(beaconBase, beaconGem);
  compassRoot.add(beaconGroup);

  // =========================================================
  // 2. ROTATING DIAL GROUP (Compass Rose + Qibla Needle + 3D Kaaba Sculpture)
  // =========================================================
  const dialGroup = new THREE.Group();
  compassRoot.add(dialGroup);

  const dialTexture = createCompassDialTexture(maxAniso);
  textures.push(dialTexture);

  const dialDisk = new THREE.Mesh(
    trackGeo(new THREE.CircleGeometry(1.55, 64)),
    trackMat(
      new THREE.MeshStandardMaterial({
        map: dialTexture,
        roughness: 0.55,
        metalness: 0.05,
      })
    )
  );
  dialDisk.rotation.x = -Math.PI / 2;
  dialDisk.position.y = 0.03;
  dialDisk.receiveShadow = true;
  dialGroup.add(dialDisk);

  // Qibla Needle & Kaaba Monument Group (rotates inside dialGroup by -qiblaBearing)
  const qiblaNeedleGroup = new THREE.Group();
  qiblaNeedleGroup.position.y = 0.09;
  dialGroup.add(qiblaNeedleGroup);

  // Faceted Emerald Qibla Arrowhead pointing toward -Z in local frame
  const arrowShape = new THREE.Shape();
  arrowShape.moveTo(0, 1.18);
  arrowShape.lineTo(0.11, 0);
  arrowShape.lineTo(0, 0.14);
  arrowShape.lineTo(-0.11, 0);
  arrowShape.closePath();
  const arrowGeo = trackGeo(
    new THREE.ExtrudeGeometry(arrowShape, {
      depth: 0.032,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.008,
      bevelSegments: 2,
    })
  );
  arrowGeo.rotateX(-Math.PI / 2);
  const qiblaFrontNeedle = new THREE.Mesh(arrowGeo, emeraldMat);
  qiblaFrontNeedle.castShadow = true;
  qiblaNeedleGroup.add(qiblaFrontNeedle);

  // Tail counterweight arrow pointing +Z
  const tailShape = new THREE.Shape();
  tailShape.moveTo(0, -0.95);
  tailShape.lineTo(0.08, 0);
  tailShape.lineTo(-0.08, 0);
  tailShape.closePath();
  const tailGeo = trackGeo(
    new THREE.ExtrudeGeometry(tailShape, {
      depth: 0.022,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.005,
      bevelSegments: 1,
    })
  );
  tailGeo.rotateX(-Math.PI / 2);
  const qiblaTailNeedle = new THREE.Mesh(tailGeo, tailNeedleMat);
  qiblaTailNeedle.castShadow = true;
  qiblaNeedleGroup.add(qiblaTailNeedle);

  // Miniature 3D Kaaba Sculpture mounted near Qibla arrow tip (z = -1.16)
  const kaabaGroup = new THREE.Group();
  kaabaGroup.position.set(0, 0.03, -1.18);
  const kaabaPlinth = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.16, 0.18, 0.028, 24)),
    brassMat
  );
  const kaabaCube = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.16, 0.18, 0.16)),
    kaabaBlackMat
  );
  kaabaCube.position.y = 0.095;
  kaabaCube.castShadow = true;
  const kiswahBand = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.164, 0.032, 0.164)),
    brassMat
  );
  kiswahBand.position.y = 0.135;
  const kaabaDoor = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.042, 0.065, 0.01)),
    brassMat
  );
  kaabaDoor.position.set(0.025, 0.075, -0.081);
  kaabaGroup.add(kaabaPlinth, kaabaCube, kiswahBand, kaabaDoor);
  qiblaNeedleGroup.add(kaabaGroup);

  // Center Brass Jewel Cap
  const pivotCap = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.11, 0.13, 0.06, 24)),
    brassMat
  );
  pivotCap.position.y = 0.035;
  const pivotDome = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.08, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2)),
    emeraldMat
  );
  pivotDome.position.y = 0.065;
  qiblaNeedleGroup.add(pivotCap, pivotDome);

  // Protective Crystal Glass Dome Cover (rendered last, depthWrite: false)
  const glassMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xf4fbf8,
      roughness: 0.05,
      metalness: 0.0,
      transmission: isSoftwareGl ? 0 : 0.9,
      transparent: true,
      opacity: isSoftwareGl ? 0.16 : 0.25,
      ior: 1.48,
      thickness: 0.12,
      clearcoat: 1.0,
      depthWrite: false,
    })
  );
  const glassLens = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(1.62, 48)), glassMat);
  glassLens.rotation.x = -Math.PI / 2;
  glassLens.position.y = 0.18;
  glassLens.renderOrder = 10;
  compassRoot.add(glassLens);

  // =========================================================
  // 3. STATE & ON-DEMAND RENDER LOOP (Damped Angles + Software-WebGL Pacing)
  // =========================================================
  let currentHeading = ((initialHeadingDeg % 360) + 360) % 360;
  let targetHeading = currentHeading;
  let currentBearing = ((initialBearingDeg % 360) + 360) % 360;
  let targetBearing = currentBearing;

  let lastFrameTime = performance.now();
  let transitionActive = false;
  let frameId = 0;
  let pollTimerId = 0;
  let renderBusy = false;
  let renderDirty = false;
  let disposed = false;

  if (!isSoftwareGl) {
    renderer.compile(scene, camera);
  }

  function applyTransforms() {
    // Rotating dial counter-clockwise when heading turns clockwise keeps real North aligned
    dialGroup.rotation.y = THREE.MathUtils.degToRad(currentHeading);
    // Qibla needle sits on dial at bearing degrees clockwise from North
    qiblaNeedleGroup.rotation.y = -THREE.MathUtils.degToRad(currentBearing);

    // Alignment beacon glow when facing Kaaba within ±5 degrees
    const alignmentError = Math.abs(shortestAngleDelta(currentHeading, currentBearing));
    const isAligned = alignmentError <= 5;
    beaconMat.emissive.setHex(isAligned ? 0x10b981 : 0x087653);
    beaconMat.emissiveIntensity = isAligned ? 1.45 : 0.25;
  }

  function afterDraw(cb: () => void) {
    const gl = renderer.getContext() as WebGL2RenderingContext;
    const sync = typeof gl.fenceSync === 'function'
      ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0)
      : null;
    gl.flush();
    const startedAt = performance.now();

    const poll = () => {
      if (disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const timedOut = performance.now() - startedAt > 120;
      const state = sync && !timedOut ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
      if (state === gl.UNSIGNALED) {
        pollTimerId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        pollTimerId = window.setTimeout(cb, 40);
      }
    };
    pollTimerId = window.setTimeout(poll, 5);
  }

  function stepTransitions(dt: number): boolean {
    let stillMoving = false;

    const headingDelta = shortestAngleDelta(currentHeading, targetHeading);
    if (Math.abs(headingDelta) > 0.08) {
      const step = headingDelta * (1 - Math.exp(-14 * dt));
      currentHeading = (currentHeading + step + 360) % 360;
      stillMoving = true;
    } else {
      currentHeading = targetHeading;
    }

    const bearingDelta = shortestAngleDelta(currentBearing, targetBearing);
    if (Math.abs(bearingDelta) > 0.08) {
      const step = bearingDelta * (1 - Math.exp(-12 * dt));
      currentBearing = (currentBearing + step + 360) % 360;
      stillMoving = true;
    } else {
      currentBearing = targetBearing;
    }

    return stillMoving;
  }

  function requestRender() {
    if (disposed) return;
    if (renderBusy) {
      renderDirty = true;
      return;
    }
    renderBusy = true;
    frameId = requestAnimationFrame(() => {
      if (disposed) return;
      renderDirty = false;
      const now = performance.now();
      const dt = transitionActive ? Math.min(Math.max((now - lastFrameTime) / 1000, 0.016), 0.15) : 0.04;
      lastFrameTime = now;

      const stillMoving = stepTransitions(dt);
      transitionActive = stillMoving;

      applyTransforms();
      controls.update();
      renderer.render(scene, camera);

      const done = () => {
        renderBusy = false;
        if (!disposed && (renderDirty || stillMoving)) {
          requestRender();
        }
      };

      if (isSoftwareGl) {
        afterDraw(done);
      } else {
        done();
      }
    });
  }

  controls.addEventListener('change', requestRender);
  applyTransforms();
  requestRender();

  function handleResize() {
    if (disposed) return;
    const w = Math.max(280, container.clientWidth);
    const h = Math.max(280, container.clientHeight);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    requestRender();
  }

  const resizeObserver = new ResizeObserver(handleResize);
  resizeObserver.observe(container);

  return {
    setQiblaBearing(bearingDeg: number) {
      targetBearing = ((bearingDeg % 360) + 360) % 360;
      transitionActive = true;
      lastFrameTime = performance.now();
      requestRender();
    },
    setDeviceHeading(headingDeg: number) {
      targetHeading = ((headingDeg % 360) + 360) % 360;
      transitionActive = true;
      lastFrameTime = performance.now();
      requestRender();
    },
    resetView() {
      camera.position.copy(defaultCamPos);
      controls.target.set(0, 0.05, 0);
      controls.update();
      requestRender();
    },
    resize: handleResize,
    dispose() {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(pollTimerId);
      controls.removeEventListener('change', requestRender);
      resizeObserver.disconnect();
      controls.dispose();
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
