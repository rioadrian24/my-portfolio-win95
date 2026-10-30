// Suara opsional berbasis WebAudio (tanpa file audio).
// Default OFF — user mengaktifkannya lewat tombol speaker di taskbar OS.
export function createSound() {
  let ctx = null;
  let enabled = false;
  let humNodes = null;

  function ensureCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function beep(freq = 880, dur = 0.09, type = 'square', vol = 0.05) {
    if (!enabled) return;
    const c = ensureCtx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g).connect(c.destination);
    o.start(); o.stop(c.currentTime + dur);
  }

  function keyClick() { beep(1200 + Math.random() * 600, 0.03, 'square', 0.02); }

  function startHum() {
    if (!enabled || humNodes) return;
    const c = ensureCtx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sawtooth'; o.frequency.value = 59; // hum CRT ~50-60Hz
    g.gain.value = 0.006;
    o.connect(g).connect(c.destination);
    o.start();
    humNodes = { o, g };
  }
  function stopHum() {
    humNodes?.o.stop();
    humNodes = null;
  }

  function setEnabled(v) {
    enabled = v;
    if (v) { ensureCtx(); startHum(); }
    else stopHum();
  }

  return {
    beep, keyClick, setEnabled,
    get enabled() { return enabled; },
  };
}
