import * as THREE from 'three';
import { buildRoom } from './scene/room.js';
import { buildComputer } from './scene/monitor.js';
import { buildLights } from './scene/lights.js';
import { buildPostprocessing } from './scene/postprocessing.js';
import { createCameraRig } from './utils/camera.js';
import { createLoader, trackSyncTask } from './utils/loader.js';
import { createSound } from './utils/sound.js';
import { initOS } from './ui/os.js';
import defaults from './data/content.json';
import { getData, setReloadHandler } from './data/store.js';

// data aktif: hasil edit admin (localStorage) atau content.json bawaan
const content = getData(defaults);

// setelah admin menyimpan, muat ulang supaya layar 3D & judul ikut data baru
setReloadHandler(() => {
  const os = document.getElementById('os-overlay');
  if (os && !os.classList.contains('hidden')) return; // jendela terbuka: biar os.js yang urus
  location.reload();
});

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = matchMedia('(pointer: coarse)').matches || innerWidth < 768;

const loadingEl = document.getElementById('loading');
const fillEl = document.getElementById('loader-fill');
const loadText = document.getElementById('loader-text');
const hintEl = document.getElementById('hint');
const canvas = document.getElementById('scene');

/* ---------- Fallback: tanpa WebGL -> portfolio HTML biasa ---------- */
function showFallback(reason) {
  console.warn('[fallback]', reason);
  loadingEl.classList.add('done');
  canvas.style.display = 'none';
  const fb = document.getElementById('fallback');
  fb.classList.remove('hidden');
  const cards = fb.querySelector('#fallback-projects .cards');
  cards.innerHTML = content.projects.map((p) => `
    <div class="card"><h3>${p.title}</h3><p>${p.description}</p>
    <p style="color:#404040;font-size:11px">${p.tech.join(' · ')}</p></div>`).join('');
  document.title = `${content.profile.name} — Portfolio`;
}

function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

/* ---------- Boot utama ---------- */
async function boot() {
  if (!webglOK()) { showFallback('WebGL tidak tersedia'); return; }

  const manager = createLoader((p, label) => {
    fillEl.style.width = `${Math.round(p * 100)}%`;
    if (label && label !== 'done') loadText.textContent = `Memuat: ${label}…`;
  });

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) { showFallback('gagal membuat renderer: ' + e.message); return; }

  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070a07);
  scene.fog = new THREE.Fog(0x070a07, 7, 15);

  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.05, 60);

  const sound = createSound();

  // --- bangun scene bertahap (progress bar bergerak jujur) ---
  let room, computer, post;
  trackSyncTask(manager, 'ruangan', () => { room = buildRoom(scene); });
  trackSyncTask(manager, 'komputer retro', () => { computer = buildComputer(scene); });
  trackSyncTask(manager, 'pencahayaan', () => { buildLights(scene, room.lampBulbWorld); });
  trackSyncTask(manager, 'efek visual', () => {
    post = buildPostprocessing(renderer, scene, camera, { reducedMotion, isMobile });
    post.composer.setPixelRatio?.(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
  });

  // --- kamera ---
  let os;
  const rig = createCameraRig(camera, canvas, {
    screenObject: computer.screenMesh,
    isMobile, reducedMotion,
    onZoomIn: () => {
      hintEl.classList.add('hidden');
      computer.screenTexture.setMode('boot', ['WINDOWS 95 memuat...', '', 'menghubungkan sesi C:\\>_']);
      setTimeout(() => computer.screenTexture.setMode('desktop'), 3200);
      os.show();
      sound.beep(660, 0.09);
    },
    onZoomOut: () => os.hide(),
  });
  camera.position.set(0, 1.75, isMobile ? 4.6 : 3.6);
  camera.lookAt(0, 1.15, -0.9);

  // --- OS mini ---
  os = initOS({
    content, sound, reducedMotion,
    onExit: () => rig.zoomOut(),
  });

  /* ---------- interaksi: hover & klik monitor ---------- */
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hovering = false;

  function setHover(v) {
    if (v === hovering) return;
    hovering = v;
    computer.screenMaterial.color.setRGB(v ? 1.35 : 1, v ? 1.35 : 1, v ? 1.35 : 1);
    canvas.style.cursor = v ? 'pointer' : 'default';
    hintEl.textContent = v ? 'Klik untuk membuka' : 'Klik monitor untuk masuk';
  }

  canvas.addEventListener('pointermove', (e) => {
    if (!rig.isFocused && rig.state === 'idle') {
      pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      setHover(raycaster.intersectObject(computer.monitor, true).length > 0);
    }
  });
  canvas.addEventListener('click', () => {
    if (hovering && rig.state === 'idle') {
      sound.beep(880, 0.07);
      rig.zoomIn();
    }
  });
  // sentuh: tap pada monitor (mobile tidak ada hover)
  canvas.addEventListener('pointerdown', (e) => {
    if (isMobile && rig.state === 'idle' && e.pointerType === 'touch') {
      pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      if (raycaster.intersectObject(computer.monitor, true).length > 0) rig.zoomIn();
    }
  });

  window.addEventListener('keydown', (e) => {
    const typing = document.activeElement?.tagName === 'INPUT';
    if (e.key === 'Escape' && rig.isFocused && !typing) rig.zoomOut();
  });

  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    post.setSize(innerWidth, innerHeight);
  });

  /* ---------- loop ---------- */
  const clock = new THREE.Clock();
  let rafId = null;
  let running = true;

  function loop() {
    if (!running) return;
    rafId = requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    rig.update(dt);
    if (!reducedMotion) room.updateDust(t);
    computer.screenTexture.tick(t);
    // LED power berkedip halus
    computer.ledMaterial.color.setHex((t % 2.4) < 2.1 ? 0x33ff66 : 0x0d3a1c);
    post.tick(t);
    post.composer.render();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    } else if (!running) {
      running = true;
      clock.getDelta();
      loop();
    }
  });

  // --- selesai: tutup loading, tampilkan hint ---
  manager.onLoad = () => {
    fillEl.style.width = '100%';
    loadText.textContent = 'Siap!';
    setTimeout(() => {
      loadingEl.classList.add('done');
      hintEl.classList.remove('hidden');
      loop();
    }, 350);
  };
  // picu onLoad (semua task sinkron sudah selesai)
  manager.itemStart('final'); manager.itemEnd('final');
}

boot();
