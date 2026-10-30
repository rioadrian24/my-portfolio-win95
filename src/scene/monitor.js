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
    // layar Windows 95: desktop teal polos
    g.fillStyle = '#008080'; g.fillRect(0, 0, SCR_W, SCR_H);

    if (this.mode === 'boot') {
      g.fillStyle = '#000000'; g.fillRect(0, 0, SCR_W, SCR_H);
      g.font = '15px monospace'; g.fillStyle = '#c0c0c0'; g.textAlign = 'left';
      this.bootLines.forEach((ln, i) => g.fillText(ln, 18, 34 + i * 22));
      g.fillStyle = '#ffffff'; g.fillText('_', 18, 34 + this.bootLines.length * 22);
      this.finish();
      return;
    }

    const FACE = '#c0c0c0', LIGHT = '#ffffff', SHADOW = '#808080', DARK = '#000000', NAVY = '#000080';
    const icon = (x, y, drawFn, label) => {
      g.save(); g.translate(x, y); drawFn(); g.restore();
      g.font = '10px "MS Sans Serif", Tahoma, sans-serif';
      g.textAlign = 'center'; g.fillStyle = '#ffffff';
      g.fillText(label, x, y + 24);
    };

    // --- ikon desktop (bentuk primitif, gaya 95) ---
    // computer
    icon(46, 44, () => {
      g.fillStyle = FACE; g.fillRect(-14, -14, 28, 20);
      g.fillStyle = DARK; g.fillRect(-14, -14, 28, 1); g.fillRect(-14, 5, 28, 1);
      g.fillRect(-14, -14, 1, 20); g.fillRect(13, -14, 1, 20);
      g.fillStyle = LIGHT; g.fillRect(-13, -13, 1, 18); g.fillRect(-13, -13, 26, 1);
      g.fillStyle = '#1a6b4a'; g.fillRect(-11, -11, 22, 14);
      g.fillStyle = '#33b07a'; g.fillRect(-11, -11, 22, 2);
      g.fillStyle = SHADOW; g.fillRect(-4, 6, 8, 3);
      g.fillStyle = FACE; g.fillRect(-8, 9, 16, 2);
    }, 'About Me');

    // folder
    icon(46, 106, () => {
      g.fillStyle = '#f0c000'; g.fillRect(-14, -8, 28, 18);
      g.fillStyle = '#ffd94a'; g.fillRect(-14, -11, 12, 4);
      g.strokeStyle = DARK; g.lineWidth = 1;
      g.strokeRect(-14, -11, 12, 4); g.strokeRect(-14, -8, 28, 18);
      g.fillStyle = '#c89600'; g.fillRect(-13, -5, 26, 1);
    }, 'Projects');

    // notepad
    icon(46, 168, () => {
      g.fillStyle = LIGHT; g.fillRect(-8, -13, 16, 24);
      g.strokeStyle = DARK; g.strokeRect(-8, -13, 16, 24);
      g.fillStyle = SHADOW;
      for (let i = 0; i < 5; i++) g.fillRect(-5, -8 + i * 4, 10, 1);
      g.fillStyle = NAVY; g.fillRect(-1, -15, 2, 3);
    }, 'Resume');

    // envelope
    icon(46, 230, () => {
      g.fillStyle = LIGHT; g.fillRect(-13, -9, 26, 18);
      g.strokeStyle = DARK; g.strokeRect(-13, -9, 26, 18);
      g.beginPath(); g.moveTo(-13, -9); g.lineTo(0, 2); g.lineTo(13, -9); g.stroke();
      g.fillStyle = SHADOW; g.fillRect(-13, 7, 26, 2);
    }, 'Contact');

    // MS-DOS prompt
    icon(46, 292, () => {
      g.fillStyle = FACE; g.fillRect(-14, -11, 28, 22);
      g.fillStyle = DARK; g.fillRect(-14, -11, 28, 1); g.fillRect(-14, 10, 28, 1);
      g.fillRect(-14, -11, 1, 22); g.fillRect(13, -11, 1, 22);
      g.fillStyle = LIGHT; g.fillRect(-13, -10, 1, 20); g.fillRect(-13, -10, 26, 1);
      g.fillStyle = DARK; g.fillRect(-11, -8, 22, 16);
      g.fillStyle = '#c0c0c0'; g.font = '9px monospace'; g.textAlign = 'left';
      g.fillText('C:\\>', -9, 2);
      g.textAlign = 'center';
    }, 'MS-DOS');

    // --- jendela About Me ---
    const wx = 120, wy = 36, ww = 360, wh = 210;
    // bayangan + frame raised
    g.fillStyle = SHADOW; g.fillRect(wx + 2, wy + 2, ww, wh);
    g.fillStyle = FACE; g.fillRect(wx, wy, ww, wh);
    g.fillStyle = LIGHT; g.fillRect(wx, wy, ww, 1); g.fillRect(wx, wy, 1, wh);
    g.fillStyle = DARK; g.fillRect(wx, wy + wh - 1, ww, 1); g.fillRect(wx + ww - 1, wy, 1, wh);
    // title bar solid navy
    g.fillStyle = NAVY; g.fillRect(wx + 3, wy + 3, ww - 6, 18);
    g.fillStyle = '#ffffff'; g.font = 'bold 12px "MS Sans Serif", Tahoma, sans-serif';
    g.textAlign = 'left'; g.fillText('About Me', wx + 8, wy + 16);
    // tombol caption
    [0, 1, 2].forEach((i) => {
      const bx = wx + ww - 20 - i * 20;
      g.fillStyle = FACE; g.fillRect(bx, wy + 5, 16, 14);
      g.fillStyle = LIGHT; g.fillRect(bx, wy + 5, 16, 1); g.fillRect(bx, wy + 5, 1, 14);
      g.fillStyle = DARK; g.fillRect(bx, wy + 18, 16, 1); g.fillRect(bx + 15, wy + 5, 1, 14);
      g.fillStyle = DARK; g.font = 'bold 9px Tahoma, sans-serif'; g.textAlign = 'center';
      if (i === 0) g.fillText('_', bx + 8, wy + 17);
      if (i === 1) { g.fillRect(bx + 4, wy + 8, 8, 7); g.fillStyle = FACE; g.fillRect(bx + 5, wy + 9, 6, 5); }
      if (i === 2) g.fillText('x', bx + 8, wy + 17);
      g.textAlign = 'left';
    });
    // isi jendela (panel sunken)
    g.fillStyle = FACE; g.fillRect(wx + 4, wy + 24, ww - 8, wh - 30);
    g.fillStyle = SHADOW; g.fillRect(wx + 6, wy + 26, ww - 12, wh - 34);
    g.fillStyle = FACE; g.fillRect(wx + 7, wy + 27, ww - 14, wh - 36);
    g.fillStyle = '#000000'; g.font = 'bold 13px "MS Sans Serif", Tahoma, sans-serif';
    g.fillText('Rio Adrian Maulana Gymnastiar', wx + 16, wy + 48);
    g.fillStyle = SHADOW; g.fillRect(wx + 16, wy + 56, ww - 32, 1);
    g.fillStyle = '#404040'; g.font = '11px "MS Sans Serif", Tahoma, sans-serif';
    g.fillText('Software Engineering Teacher', wx + 16, wy + 74);
    g.fillText('& Fullstack Developer', wx + 16, wy + 89);
    g.fillStyle = '#000000'; g.font = 'bold 11px "MS Sans Serif", Tahoma, sans-serif';
    g.fillText('8 proyek produksi berjalan', wx + 16, wy + 112);
    g.fillStyle = '#404040'; g.font = '11px "MS Sans Serif", Tahoma, sans-serif';
    g.fillText('Klik layar untuk membuka desktop', wx + 16, wy + 132);
    // tombol OK bergaya 95
    const bx2 = wx + 16, by2 = wy + 152, bw = 74, bh = 22;
    g.fillStyle = FACE; g.fillRect(bx2, by2, bw, bh);
    g.fillStyle = LIGHT; g.fillRect(bx2, by2, bw, 1); g.fillRect(bx2, by2, 1, bh);
    g.fillStyle = DARK; g.fillRect(bx2, by2 + bh - 1, bw, 1); g.fillRect(bx2 + bw - 1, by2, 1, bh);
    g.fillStyle = '#000000'; g.font = '11px "MS Sans Serif", Tahoma, sans-serif';
    g.textAlign = 'center'; g.fillText('OK', bx2 + bw / 2, by2 + 15);

    // --- taskbar ---
    const tbY = SCR_H - 30;
    g.fillStyle = FACE; g.fillRect(0, tbY, SCR_W, 30);
    g.fillStyle = LIGHT; g.fillRect(0, tbY, SCR_W, 1);
    g.fillStyle = SHADOW; g.fillRect(0, tbY + 1, SCR_W, 1);
    // Start button
    const sbW = 78, sbH = 22, sbY = tbY + 4;
    g.fillStyle = FACE; g.fillRect(2, sbY, sbW, sbH);
    g.fillStyle = LIGHT; g.fillRect(2, sbY, sbW, 1); g.fillRect(2, sbY, 1, sbH);
    g.fillStyle = DARK; g.fillRect(2, sbY + sbH - 1, sbW, 1); g.fillRect(2 + sbW - 1, sbY, 1, sbH);
    // flag 4 warna
    g.fillStyle = '#ff0000'; g.fillRect(7, sbY + 6, 6, 6);
    g.fillStyle = '#00a000'; g.fillRect(14, sbY + 6, 6, 6);
    g.fillStyle = '#0000c0'; g.fillRect(7, sbY + 13, 6, 5);
    g.fillStyle = '#f0c000'; g.fillRect(14, sbY + 13, 6, 5);
    g.fillStyle = '#000000'; g.font = 'bold 12px "MS Sans Serif", Tahoma, sans-serif';
    g.textAlign = 'left'; g.fillText('Start', 26, sbY + 16);
    // task button
    const tb2x = sbW + 8, tb2w = 130;
    g.fillStyle = SHADOW; g.fillRect(tb2x, sbY, tb2w, sbH);
    g.fillStyle = FACE; g.fillRect(tb2x + 1, sbY + 1, tb2w - 2, sbH - 2);
    g.fillStyle = '#000000'; g.font = '11px "MS Sans Serif", Tahoma, sans-serif';
    g.fillText('About Me', tb2x + 8, sbY + 15);
    // tray + jam
    const tw = 66, tx = SCR_W - tw - 4;
    g.fillStyle = SHADOW; g.fillRect(tx, sbY, tw, sbH);
    g.fillStyle = LIGHT; g.fillRect(tx + 1, sbY + 1, tw - 2, sbH - 2);
    g.fillStyle = '#000000'; g.font = '11px "MS Sans Serif", Tahoma, sans-serif';
    g.textAlign = 'center';
    g.fillText(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), tx + tw / 2, sbY + 15);
    g.textAlign = 'left';

    this.finish();
  }

  // scanlines ringan + vignette, lalu upload tekstur
  finish() {
    const g = this.g;
    const vg = g.createRadialGradient(SCR_W / 2, SCR_H / 2, SCR_H * 0.42, SCR_W / 2, SCR_H / 2, SCR_H * 0.85);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.45)');
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
    new THREE.MeshBasicMaterial({ color: 0x4dff88 })
  );
  led.position.set(-0.2, -bodyH / 2 + 0.035, bodyD / 2 + 0.013);
  mon.add(led);
  const labelC = document.createElement('canvas');
  labelC.width = 128; labelC.height = 24;
  const lg = labelC.getContext('2d');
  lg.fillStyle = '#8a8064'; lg.font = 'bold 15px monospace'; lg.textAlign = 'center';
  lg.fillText('WIN-95', 64, 18);
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
