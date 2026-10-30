import { gsap } from 'gsap';
import * as THREE from 'three';

// Mengelola kamera: parallax idle mengikuti mouse + zoom in/out ke layar monitor.
export function createCameraRig(camera, domElement, opts = {}) {
  const {
    screenObject,          // Object3D: mesh layar monitor
    isMobile = false,
    reducedMotion = false,
    onZoomIn,              // dipanggil saat kamera selesai zoom masuk
    onZoomOut,             // dipanggil saat kamera selesai zoom keluar
  } = opts;

  const basePos = new THREE.Vector3(0, 1.75, isMobile ? 4.6 : 3.6);
  const baseTarget = new THREE.Vector3(0, 1.15, -0.9);
  const lookTarget = baseTarget.clone();

  const mouse = new THREE.Vector2(0, 0);   // -1..1
  const smooth = new THREE.Vector2(0, 0);  // versi lerp

  let state = 'idle'; // 'idle' | 'zooming' | 'focused' | 'unzooming'
  let parallaxEnabled = true;

  // --- parallax: mouse -> offset kecil pada posisi & target kamera ---
  function onPointerMove(e) {
    const x = (e.clientX ?? (e.touches?.[0]?.clientX ?? 0)) / window.innerWidth;
    const y = (e.clientY ?? (e.touches?.[0]?.clientY ?? 0)) / window.innerHeight;
    mouse.set(x * 2 - 1, -(y * 2 - 1));
  }
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  function update(dt) {
    if (state !== 'idle' || !parallaxEnabled || reducedMotion) return;
    const k = 1 - Math.exp(-dt * 3.2); // lerp framerate-independent
    smooth.lerp(mouse, k);
    // ±5–10 derajat terasa sebagai offset posisi kecil
    const px = smooth.x * 0.45;
    const py = smooth.y * 0.28;
    camera.position.set(basePos.x + px, basePos.y + py, basePos.z);
    lookTarget.set(baseTarget.x + smooth.x * 0.35, baseTarget.y + smooth.y * 0.22, baseTarget.z);
    camera.lookAt(lookTarget);
  }

  function screenPose() {
    const p = new THREE.Vector3();
    const n = new THREE.Vector3(0, 0, 1);
    screenObject.getWorldPosition(p);
    screenObject.getWorldDirection(n); // normal layar (menghadap +z lokal)
    const dist = isMobile ? 0.6 : 0.36; // jarak agar layar memenuhi viewport
    const camPos = p.clone().addScaledVector(n, dist);
    camPos.y += 0.01;
    return { camPos, lookAt: p };
  }

  function zoomIn() {
    if (state !== 'idle') return;
    state = 'zooming';
    parallaxEnabled = false;
    const { camPos, lookAt } = screenPose();
    const tl = gsap.timeline({
      defaults: { duration: reducedMotion ? 0.01 : 1.35, ease: 'power3.inOut' },
      onComplete: () => { state = 'focused'; onZoomIn?.(); },
    });
    tl.to(camera.position, { x: camPos.x, y: camPos.y, z: camPos.z }, 0);
    const proxy = { t: 0 };
    const startTarget = lookTarget.clone();
    tl.to(proxy, {
      t: 1,
      onUpdate: () => {
        lookTarget.lerpVectors(startTarget, lookAt, proxy.t);
        camera.lookAt(lookTarget);
      },
    }, 0);
  }

  function zoomOut() {
    if (state !== 'focused') return;
    state = 'unzooming';
    onZoomOut?.();
    const proxy = { t: 0 };
    const startPos = camera.position.clone();
    const startTarget = lookTarget.clone();
    gsap.to(proxy, {
      t: 1,
      duration: reducedMotion ? 0.01 : 1.15,
      ease: 'power3.inOut',
      onUpdate: () => {
        camera.position.lerpVectors(startPos, basePos, proxy.t);
        lookTarget.lerpVectors(startTarget, baseTarget, proxy.t);
        camera.lookAt(lookTarget);
      },
      onComplete: () => {
        state = 'idle';
        parallaxEnabled = true;
        smooth.set(0, 0);
        mouse.set(0, 0);
      },
    });
  }

  return {
    update,
    zoomIn,
    zoomOut,
    get state() { return state; },
    get isFocused() { return state === 'focused'; },
  };
}
