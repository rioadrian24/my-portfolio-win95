import * as THREE from 'three';

// Pencahayaan hangat & moody: point light dari lampu meja,
// ambient redup, glow biru dari layar monitor.
export function buildLights(scene, lampPos) {
  // Ambient redup — ruangan tetap terbaca tapi gelap
  const ambient = new THREE.AmbientLight(0x2a3348, 0.55);
  scene.add(ambient);

  // Hemisphere halus: langit biru gelap / lantai cokelat hangat
  const hemi = new THREE.HemisphereLight(0x33415e, 0x3a2a1a, 0.35);
  scene.add(hemi);

  // Point light hangat dari lampu meja (sumber utama + shadow)
  const lampLight = new THREE.PointLight(0xffb46b, 8, 7, 2);
  lampLight.position.copy(lampPos);
  lampLight.castShadow = true;
  lampLight.shadow.mapSize.set(1024, 1024);
  lampLight.shadow.bias = -0.004;
  scene.add(lampLight);

  // Glow biru-hijau dari layar monitor (tanpa shadow, murah)
  const screenGlow = new THREE.PointLight(0x4dff88, 3, 2.6, 2);
  screenGlow.position.set(0, 1.35, -1.15);
  scene.add(screenGlow);

  // Rim dingin tipis dari arah kamera agar siluet tidak tenggelam
  const rim = new THREE.DirectionalLight(0x3a5a8a, 0.5);
  rim.position.set(2, 2.5, 3);
  scene.add(rim);

  return { ambient, lampLight, screenGlow };
}
