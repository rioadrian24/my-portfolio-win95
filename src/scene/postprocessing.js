import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// Shader custom: vignette + film grain + chromatic aberration tipis.
// Digabung dalam satu pass agar murah (satu fullscreen quad).
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uGrain: { value: 0.06 },      // intensitas grain
    uVignette: { value: 0.42 },   // kekuatan vignette
    uAberration: { value: 0.0016 }, // chromatic aberration
    uAnimate: { value: 1 },       // 0 saat prefers-reduced-motion
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uTime, uGrain, uVignette, uAberration, uAnimate;
    varying vec2 vUv;
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    void main() {
      vec2 uv = vUv;
      // chromatic aberration radial tipis (lebih kuat di tepi)
      vec2 dir = uv - 0.5;
      float r2 = dot(dir, dir);
      float ab = uAberration * (0.4 + r2 * 2.4);
      vec3 col;
      col.r = texture2D(tDiffuse, uv + dir * ab).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - dir * ab).b;
      // film grain
      float t = uTime * uAnimate;
      float g = hash(uv * (100.0 + t * 60.0) + t) - 0.5;
      col += g * uGrain * (0.4 + 0.6 * uAnimate);
      // vignette
      float v = smoothstep(0.95, 0.35, length(dir) * (1.0 + uVignette));
      col *= mix(1.0 - uVignette * 0.7, 1.0, v);
      gl_FragColor = vec4(col, 1.0);
    }`,
};

export function buildPostprocessing(renderer, scene, camera, opts = {}) {
  const { reducedMotion = false, isMobile = false } = opts;
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  // Bloom ringan — hanya area terang (layar, lampu, LED) yang glow
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.38,   // strength
    0.65,   // radius
    0.78    // threshold
  );
  composer.addPass(bloom);

  const grade = new ShaderPass(GradeShader);
  if (reducedMotion) {
    grade.uniforms.uAnimate.value = 0;
    grade.uniforms.uGrain.value = 0.025;
  }
  if (isMobile) grade.uniforms.uGrain.value *= 0.7;
  composer.addPass(grade);
  composer.addPass(new OutputPass());

  function setSize(w, h) {
    composer.setSize(w, h);
  }
  function tick(t) {
    grade.uniforms.uTime.value = t;
  }
  return { composer, setSize, tick };
}
