import * as THREE from 'three';

// Layout bersama — dipakai juga oleh monitor.js
export const LAYOUT = {
  deskTopY: 0.78,
  deskCenter: new THREE.Vector3(0, 0, -1.55),
  monitorPos: new THREE.Vector3(0, 0, -1.72),
  lampPos: new THREE.Vector3(-0.95, 0, -1.7),
};

function canvasTexture(draw, w = 256, h = 256) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Tekstur kayu prosedural (original)
function woodTexture() {
  return canvasTexture((g, w, h) => {
    g.fillStyle = '#7a5230'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
      g.strokeStyle = `rgba(60,35,15,${0.12 + Math.random() * 0.2})`;
      g.lineWidth = 1 + Math.random() * 2;
      const y = Math.random() * h;
      g.beginPath(); g.moveTo(0, y);
      g.bezierCurveTo(w * .3, y + 6, w * .6, y - 6, w, y);
      g.stroke();
    }
  });
}

// Poster generatif original (bentuk retro abstrak)
function posterTexture(variant) {
  return canvasTexture((g, w, h) => {
    const palettes = [
      ['#0d1b2a', '#ffb000', '#33ff66', '#f4f1de'],
      ['#1a0f2e', '#ff66aa', '#33ccff', '#f4f1de'],
    ];
    const [bg, c1, c2, c3] = palettes[variant % palettes.length];
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    // matahari / grid synthwave-ish tapi original
    g.fillStyle = c1; g.beginPath(); g.arc(w / 2, h * .38, w * .22, 0, 7); g.fill();
    g.fillStyle = bg;
    for (let i = 0; i < 4; i++) g.fillRect(w * .2, h * (.3 + i * .045), w * .6, 3);
    g.strokeStyle = c2; g.lineWidth = 3;
    for (let i = 0; i <= 6; i++) {
      g.beginPath(); g.moveTo(0, h * (.62 + i * .05)); g.lineTo(w, h * (.62 + i * .05)); g.stroke();
    }
    g.fillStyle = c3; g.font = 'bold 26px monospace'; g.textAlign = 'center';
    g.fillText(variant === 0 ? 'RETRO' : 'FUTURE', w / 2, h * .92);
    g.strokeStyle = c3; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
  }, 256, 384);
}

function rugTexture() {
  return canvasTexture((g, w, h) => {
    g.fillStyle = '#3a2b1f'; g.fillRect(0, 0, w, h);
    for (let r = 0; r < 5; r++) {
      g.strokeStyle = ['#ffb000', '#7a4a21', '#33ff66'][r % 3];
      g.lineWidth = 6;
      g.beginPath(); g.arc(w / 2, h / 2, 20 + r * 22, 0, 7); g.stroke();
    }
  });
}

export function buildRoom(scene) {
  const group = new THREE.Group();
  const wood = woodTexture();
  const matWall = new THREE.MeshStandardMaterial({ color: 0x2b2f26, roughness: 1 });
  const matFloor = new THREE.MeshStandardMaterial({ color: 0x4a3b2a, roughness: .9 });
  const matWood = new THREE.MeshStandardMaterial({ map: wood, roughness: .8 });
  const matWoodDark = new THREE.MeshStandardMaterial({ color: 0x4f3418, roughness: .85 });
  const matBlack = new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: .6 });

  // --- Lantai & dinding ---
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(9, 7.5), matFloor);
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  group.add(floor);

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.4), matWall);
  backWall.position.set(0, 1.7, -2.3); backWall.receiveShadow = true;
  group.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 3.4), matWall);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-4.5, 1.7, 1.45); leftWall.receiveShadow = true;
  group.add(leftWall);

  // Karpet
  const rug = new THREE.Mesh(
    new THREE.CircleGeometry(1.3, 40),
    new THREE.MeshStandardMaterial({ map: rugTexture(), roughness: 1 })
  );
  rug.rotation.x = -Math.PI / 2; rug.position.set(0.4, 0.005, 0.6);
  rug.receiveShadow = true;
  group.add(rug);

  // --- Meja ---
  const desk = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.07, 1.15), matWood);
  top.position.y = LAYOUT.deskTopY - 0.035; top.castShadow = top.receiveShadow = true;
  desk.add(top);
  for (const [x, z] of [[-1.25, -0.5], [1.25, -0.5], [-1.25, 0.5], [1.25, 0.5]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, LAYOUT.deskTopY - 0.07, 0.08), matWoodDark);
    leg.position.set(x, (LAYOUT.deskTopY - 0.07) / 2, z); leg.castShadow = true;
    desk.add(leg);
  }
  desk.position.copy(LAYOUT.deskCenter);
  group.add(desk);

  // --- Kursi ---
  const chair = new THREE.Group();
  const matChair = new THREE.MeshStandardMaterial({ color: 0x5a2d2d, roughness: .9 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.07, 0.5), matChair);
  seat.position.y = 0.48; seat.castShadow = true; chair.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.07), matChair);
  back.position.set(0, 0.82, -0.24); back.castShadow = true; chair.add(back);
  for (const [x, z] of [[-0.22, -0.2], [0.22, -0.2], [-0.22, 0.2], [0.22, 0.2]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.48, 8), matBlack);
    leg.position.set(x, 0.24, z); chair.add(leg);
  }
  chair.position.set(0.15, 0, -0.55);
  chair.rotation.y = -0.35;
  group.add(chair);

  // --- Rak buku (dinding kiri) ---
  const shelf = new THREE.Group();
  const shelfMat = new THREE.MeshStandardMaterial({ color: 0x3d2a16, roughness: .9 });
  const SW = 1.5, SH = 1.9, SD = 0.32;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(SW, SH, 0.04), shelfMat);
  frame.position.z = -SD / 2; shelf.add(frame);
  for (let i = 0; i < 4; i++) {
    const board = new THREE.Mesh(new THREE.BoxGeometry(SW, 0.04, SD), shelfMat);
    board.position.y = -SH / 2 + 0.06 + i * (SH - 0.1) / 3;
    board.castShadow = true; shelf.add(board);
  }
  const bookCols = [0xb03a2e, 0x2e86b0, 0x33ff66, 0xffb000, 0x7d3c98, 0xd4ac0d, 0x1a7a33];
  for (let s = 0; s < 3; s++) {
    let x = -SW / 2 + 0.06;
    while (x < SW / 2 - 0.08) {
      const bw = 0.035 + Math.random() * 0.035;
      const bh = 0.22 + Math.random() * 0.12;
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(bw, bh, 0.2),
        new THREE.MeshStandardMaterial({ color: bookCols[(Math.random() * bookCols.length) | 0], roughness: .9 })
      );
      const yBase = -SH / 2 + 0.08 + s * (SH - 0.1) / 3;
      book.position.set(x + bw / 2, yBase + bh / 2, 0.02);
      book.rotation.z = Math.random() < 0.12 ? 0.18 : 0;
      book.castShadow = true;
      shelf.add(book);
      x += bw + 0.008;
    }
  }
  shelf.position.set(-4.3, 1.15, -0.9);
  shelf.rotation.y = Math.PI / 2;
  group.add(shelf);

  // --- Poster di dinding belakang ---
  [[-1.7, posterTexture(0)], [1.7, posterTexture(1)]].forEach(([x, tex]) => {
    const p = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.92, 0.02),
      new THREE.MeshStandardMaterial({ map: tex, roughness: .9 })
    );
    p.position.set(x, 2.05, -2.28);
    p.rotation.z = (Math.random() - 0.5) * 0.06;
    group.add(p);
  });

  // --- Lampu meja ---
  const lamp = new THREE.Group();
  const matLamp = new THREE.MeshStandardMaterial({ color: 0x8a6d2f, roughness: .5, metalness: .4 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.04, 16), matLamp);
  base.position.y = 0.02; lamp.add(base);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.55, 8), matLamp);
  arm.position.set(0.1, 0.28, 0); arm.rotation.z = -0.5; arm.castShadow = true; lamp.add(arm);
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 0.18, 16, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xa8842f, roughness: .6, side: THREE.DoubleSide })
  );
  shade.position.set(0.24, 0.52, 0); shade.rotation.z = 0.9; lamp.add(shade);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xffd9a0 })
  );
  bulb.position.set(0.27, 0.47, 0); lamp.add(bulb);
  lamp.position.set(LAYOUT.lampPos.x, LAYOUT.deskTopY, LAYOUT.lampPos.z);
  group.add(lamp);
  const lampGlowWorld = new THREE.Vector3();
  bulb.getWorldPosition(lampGlowWorld); // dihitung ulang di main setelah group ditambah

  // --- Tanaman ---
  const plant = new THREE.Group();
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.07, 0.14, 12),
    new THREE.MeshStandardMaterial({ color: 0xa8542f, roughness: .9 })
  );
  pot.position.y = 0.07; pot.castShadow = true; plant.add(pot);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: .9, flatShading: true });
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.32 + Math.random() * 0.15, 6), leafMat);
    const a = (i / 7) * Math.PI * 2;
    leaf.position.set(Math.cos(a) * 0.05, 0.3, Math.sin(a) * 0.05);
    leaf.rotation.set(Math.sin(a) * 0.45, 0, Math.cos(a) * 0.45);
    leaf.castShadow = true; plant.add(leaf);
  }
  plant.position.set(1.05, LAYOUT.deskTopY, -1.75);
  group.add(plant);

  // --- Properti: mug, floppy disk, sticky notes ---
  const mug = new THREE.Group();
  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.04, 0.1, 14),
    new THREE.MeshStandardMaterial({ color: 0x2e86b0, roughness: .7 })
  );
  cup.position.y = 0.05; cup.castShadow = true; mug.add(cup);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.009, 8, 16), cup.material);
  handle.position.set(0.05, 0.05, 0); mug.add(handle);
  mug.position.set(-0.55, LAYOUT.deskTopY, -1.35);
  group.add(mug);

  const floppyMat = new THREE.MeshStandardMaterial({ color: 0x1b1e24, roughness: .6 });
  for (let i = 0; i < 4; i++) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.012, 0.095), floppyMat);
    f.position.set(0.72, LAYOUT.deskTopY + 0.008 + i * 0.014, -1.4);
    f.rotation.y = (Math.random() - 0.5) * 0.4; f.castShadow = true;
    group.add(f);
  }

  const noteCols = [0xffe066, 0xff9f9f, 0x9fd8ff];
  for (let i = 0; i < 3; i++) {
    const n = new THREE.Mesh(
      new THREE.PlaneGeometry(0.09, 0.09),
      new THREE.MeshStandardMaterial({ color: noteCols[i], roughness: 1, side: THREE.DoubleSide })
    );
    n.position.set(-2.6 + i * 0.14, 1.85 + (i % 2) * 0.12, -2.28);
    n.rotation.z = (Math.random() - 0.5) * 0.3;
    group.add(n);
  }

  scene.add(group);

  // --- Partikel debu di cahaya lampu ---
  const dustGeo = new THREE.BufferGeometry();
  const N = 140;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = LAYOUT.lampPos.x + (Math.random() - 0.5) * 1.6;
    pos[i * 3 + 1] = 0.4 + Math.random() * 1.6;
    pos[i * 3 + 2] = LAYOUT.lampPos.z + (Math.random() - 0.5) * 1.6;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    color: 0xffd9a0, size: 0.012, transparent: true, opacity: 0.5,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  scene.add(dust);

  const dustBase = pos.slice();
  function updateDust(t) {
    const p = dustGeo.attributes.position.array;
    for (let i = 0; i < N; i++) {
      p[i * 3] = dustBase[i * 3] + Math.sin(t * 0.3 + i) * 0.05;
      p[i * 3 + 1] = dustBase[i * 3 + 1] + Math.sin(t * 0.22 + i * 1.7) * 0.08;
      p[i * 3 + 2] = dustBase[i * 3 + 2] + Math.cos(t * 0.26 + i * 0.6) * 0.05;
    }
    dustGeo.attributes.position.needsUpdate = true;
  }

  return { updateDust, lampBulbWorld: lampGlowWorld, lampGroup: lamp };
}
