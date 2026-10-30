import * as THREE from 'three';
import { LAYOUT } from './room.js';

const SCR_W = 512, SCR_H = 384;

/* ------------------------------------------------------------------ *
 * Layar monitor: CanvasTexture 2D yang digambar prosedural.
 * Menampilkan "desktop mini" (wallpaper + ikon + taskbar) + scanlines,
 * dianimasikan ~12fps untuk flicker halus khas CRT.
 * ------------------------------------------------------------------ */
export class ScreenTexture {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = SCR_W; this.canvas.height = SCR_H;
    this.g = this.canvas.getContext('2d');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.mode = 'desktop'; // 'desktop' | 'boot'
    this.bootLines = [];
    this.flicker = 0;
    this.draw();
  }
  setMode(mode, bootLines = []) {
    this.mode = mode; this.bootLines = bootLines; this.draw();
  }
  draw() {
    const g = this.g;
    // wallpaper
    const grad = g.createLinearGradient(0, 0, 0, SCR_H);
    grad.addColorStop(0, '#062b16'); grad.addColorStop(1, '#031007');
    g.fillStyle = grad; g.fillRect(0, 0, SCR_W, SCR_H);
    if (this.mode === 'boot') {
      g.font = '15px monospace'; g.fillStyle = '#33ff66';
      this.bootLines.forEach((ln, i) => g.fillText(ln, 18, 34 + i * 22));
      g.fillStyle = '#9dffb8'; g.fillText('▊', 18, 34 + this.bootLines.length * 22);
    } else {
      // ikon desktop
      const icons = [['📁', 'About'], ['💼', 'Projects'], ['📄', 'Resume'], ['✉️', 'Contact'], ['>_', 'Terminal']];
      g.font = '26px monospace'; g.textAlign = 'center';
      icons.forEach(([glyph, label], i) => {
        const x = 52, y = 56 + i * 62;
        g.fillStyle = 'rgba(51,255,102,.12)'; g.fillRect(x - 26, y - 34, 52, 52);
        g.fillStyle = '#9dffb8'; g.fillText(glyph, x, y);
        g.font = '11px monospace'; g.fillStyle = '#c9e8d2'; g.fillText(label, x, y + 16);
        g.font = '26px monospace';
      });
      // jendela "welcome" kecil
      g.fillStyle = '#04140a'; g.fillRect(150, 60, 300, 180);
      g.strokeStyle = '#2fae57'; g.lineWidth = 2; g.strokeRect(150, 60, 300, 180);
      g.fillStyle = '#155a2d'; g.fillRect(150, 60, 300, 26);
      g.fillStyle = '#eafff0'; g.font = '13px monospace'; g.textAlign = 'left';
      g.fillText('  SELAMAT DATANG', 150, 78);
      g.fillStyle = '#9dffb8'; g.font = '14px monospace';
      g.fillText('Klik layar untuk', 170, 130);
      g.fillText('membuka portfolio_', 170, 152);
      g.fillStyle = '#ffb000'; g.font = '12px monospace';
      g.fillText('> RETRO-OS v1.0', 170, 200);
      // taskbar
      g.fillStyle = '#082412'; g.fillRect(0, SCR_H - 28, SCR_W, 28);
      g.fillStyle = '#2fae57'; g.fillRect(0, SCR_H - 28, SCR_W, 2);
      g.fillStyle = '#9dffb8'; g.font = '13px monospace';
      g.fillText('▦ MULAI', 10, SCR_H - 9);
      g.textAlign = 'right';
      g.fillText(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), SCR_W - 10, SCR_H - 9);
      g.textAlign = 'left';
    }
    // scanlines + vignette (di-bake ke tekstur)
    g.fillStyle = 'rgba(0,0,0,.22)';
    for (let y = 0; y < SCR_H; y += 3) g.fillRect(0, y, SCR_W, 1);
    const vg = g.createRadialGradient(SCR_W/2, SCR_H/2, SCR_H*0.35, SCR_W/2, SCR_H/2, SCR_H*0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.5)');
    g.fillStyle = vg; g.fillRect(0, 0, SCR_W, SCR_H);
    this.texture.needsUpdate = true;
  }
  // dipanggil tiap frame dari main loop; redraw hemat di ~12fps + flicker
  tick(t) {
    const f = Math.floor(t * 12);
    if (f === this.flicker) return;
    this.flicker = f;
    this.draw();
    // brightness flicker halus via material (diatur di monitor.js)
  }
}

/* ------------------------------------------------------------------ *
 * Komputer retro: monitor CRT + keyboard + mouse dari primitif.
 * Bentuknya modular — gampang diganti model .glb (lihat README).
 * ------------------------------------------------------------------ */
export function buildComputer(scene) {
  const group = new THREE.Group();
  const plastic = new THREE.MeshStandardMaterial({ color: 0xd6cdb4, roughness: .7 });
  const plasticDark = new THREE.MeshStandardMaterial({ color: 0xb3a888, roughness: .75 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1c1e22, roughness: .6 });

  const deskY = LAYOUT.deskTopY;
  const mx = LAYOUT.monitorPos.x, mz = LAYOUT.monitorPos.z;

  // --- Dudukan monitor ---
  const standBase = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.26), plasticDark);
  standBase.position.set(mx, deskY + 0.015, mz - 0.05); standBase.castShadow = true;
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.08), plasticDark);
  neck.position.set(mx, deskY + 0.09, mz - 0.08);
  group.add(standBase, neck);

  // --- Body CRT ---
  const mon = new THREE.Group();
  const bodyW = 0.58, bodyH = 0.46, bodyD = 0.5;
  const body = new THREE.Mesh(new THREE.BoxGeometry(bodyW, bodyH, bodyD), plastic);
  body.castShadow = body.receiveShadow = true;
  mon.add(body);
  // bezel depan (sedikit menonjol)
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(bodyW - 0.02, bodyH - 0.02, 0.03), plasticDark);
  bezel.position.z = bodyD / 2;
  mon.add(bezel);

  // --- Layar melengkung ---
  const scrW = 0.46, scrH = 0.35, bulge = 0.035;
  const scrGeo = new THREE.PlaneGeometry(scrW, scrH, 28, 20);
  const sp = scrGeo.attributes.position;
  for (let i = 0; i < sp.count; i++) {
    const x = sp.getX(i) / (scrW / 2), y = sp.getY(i) / (scrH / 2);
    sp.setZ(i, bulge * (1 - x * x) * (1 - y * y));
  }
  scrGeo.computeVertexNormals();
  const screenTex = new ScreenTexture();
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex.texture });
  const screen = new THREE.Mesh(scrGeo, screenMat);
  screen.position.z = bodyD / 2 + 0.016;
  mon.add(screen);

  // tombol + LED + label di bezel bawah
  for (let i = 0; i < 3; i++) {
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.012, 10), dark);
    btn.rotation.x = Math.PI / 2;
    btn.position.set(0.12 + i * 0.035, -bodyH / 2 + 0.035, bodyD / 2 + 0.012);
    mon.add(btn);
  }
  const led = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.008, 0.006),
    new THREE.MeshBasicMaterial({ color: 0x33ff66 })
  );
  led.position.set(-0.2, -bodyH / 2 + 0.035, bodyD / 2 + 0.013);
  mon.add(led);
  const labelC = document.createElement('canvas');
  labelC.width = 128; labelC.height = 24;
  const lg = labelC.getContext('2d');
  lg.fillStyle = '#8a8064'; lg.font = 'bold 15px monospace'; lg.textAlign = 'center';
  lg.fillText('RETRO-14', 64, 18);
  const labelT = new THREE.CanvasTexture(labelC);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.017),
    new THREE.MeshBasicMaterial({ map: labelT, transparent: true }));
  label.position.set(0, -bodyH / 2 + 0.035, bodyD / 2 + 0.0125);
  mon.add(label);

  mon.position.set(mx, deskY + 0.15 + bodyH / 2, mz);
  mon.rotation.x = -0.04; // sedikit menengadah
  group.add(mon);

  // --- Keyboard ---
  const kb = new THREE.Group();
  const kbBase = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.028, 0.17), plastic);
  kbBase.castShadow = kbBase.receiveShadow = true;
  kb.add(kbBase);
  const keyGeo = new THREE.BoxGeometry(0.026, 0.014, 0.026);
  const keyMat = new THREE.MeshStandardMaterial({ color: 0xe8e2cf, roughness: .8 });
  const rows = [15, 15, 14, 13];
  const keyMesh = new THREE.InstancedMesh(keyGeo, keyMat, rows.reduce((a, b) => a + b, 0));
  const dummy = new THREE.Object3D();
  let ki = 0;
  rows.forEach((count, r) => {
    for (let c = 0; c < count; c++) {
      dummy.position.set(-0.21 + c * 0.03 + r * 0.006, 0.02, -0.06 + r * 0.032);
      dummy.updateMatrix();
      keyMesh.setMatrixAt(ki++, dummy.matrix);
    }
  });
  // spacebar
  const space = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.014, 0.026), keyMat);
  space.position.set(0, 0.02, 0.068); kb.add(space);
  keyMesh.castShadow = true;
  kb.add(keyMesh);
  kb.position.set(mx - 0.02, deskY + 0.014, mz + 0.42);
  kb.rotation.y = 0.03;
  group.add(kb);

  // --- Mouse ---
  const mouse = new THREE.Group();
  const mBody = new THREE.Mesh(new THREE.SphereGeometry(0.032, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), plasticDark);
  mBody.scale.set(1, 0.62, 1.35); mBody.castShadow = true;
  mouse.add(mBody);
  const mBtn = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.008, 0.03), plastic);
  mBtn.position.set(0, 0.02, 0.018); mouse.add(mBtn);
  // kabel (kurva sederhana)
  const cablePts = [new THREE.Vector3(0, 0.01, -0.045), new THREE.Vector3(0.02, 0.008, -0.14), new THREE.Vector3(-0.05, 0.005, -0.24)];
  const cable = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cablePts), 12, 0.004, 6),
    dark
  );
  mouse.add(cable);
  mouse.position.set(mx + 0.33, deskY, mz + 0.42);
  group.add(mouse);

  scene.add(group);

  return {
    group,
    monitor: mon,
    screenMesh: screen,
    screenMaterial: screenMat,
    screenTexture: screenTex,
    ledMaterial: led.material,
  };
}
