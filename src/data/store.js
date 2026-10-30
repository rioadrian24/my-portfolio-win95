// Depot data admin: baca/tulis content.json dari browser.
//
// GitHub Pages tidak punya backend, jadi penyimpanan berlapis:
//   1. data default  -> src/data/content.json (ikut build)
//   2. data aktif    -> localStorage (hasil edit admin)
//   3. backup        -> localStorage (snapshot otomatis tiap simpan)
// Export/import file tetap disediakan supaya data bisa dipindah ke repo.

const KEY_DATA = 'portfolio.data.v1';
const KEY_BACKUPS = 'portfolio.backups.v1';
const KEY_SESSION = 'portfolio.admin.session';
const MAX_BACKUPS = 20;

let cache = null;
let onReload = null;

// dipanggil setelah data diganti dari luar UI (mis. editor admin menyimpan)
export function setReloadHandler(fn) {
  onReload = fn;
}

export function requestReload() {
  onReload?.();
}

export function getData(defaults) {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY_DATA);
    cache = raw ? JSON.parse(raw) : structuredClone(defaults);
  } catch {
    cache = structuredClone(defaults);
  }
  return cache;
}

export function setData(next) {
  cache = next;
  localStorage.setItem(KEY_DATA, JSON.stringify(next));
  return next;
}

export function resetData(defaults) {
  cache = structuredClone(defaults);
  localStorage.removeItem(KEY_DATA);
  return cache;
}

export function isCustomised() {
  return localStorage.getItem(KEY_DATA) !== null;
}

/* ---------------- backup ---------------- */

export function listBackups() {
  try {
    return JSON.parse(localStorage.getItem(KEY_BACKUPS) || '[]');
  } catch {
    return [];
  }
}

// simpan snapshot sebelum perubahan diterapkan
export function pushBackup(snapshot, label = 'manual') {
  const list = listBackups();
  list.unshift({
    at: new Date().toISOString(),
    label,
    bytes: JSON.stringify(snapshot).length,
    data: snapshot,
  });
  // batasi supaya localStorage tidak penuh
  while (list.length > MAX_BACKUPS) list.pop();
  try {
    localStorage.setItem(KEY_BACKUPS, JSON.stringify(list));
  } catch {
    // kuota habis: buang setengah backup terlama lalu coba sekali lagi
    const trimmed = list.slice(0, Math.max(1, Math.floor(MAX_BACKUPS / 2)));
    localStorage.setItem(KEY_BACKUPS, JSON.stringify(trimmed));
  }
  return label;
}

export function getBackup(at) {
  return listBackups().find((b) => b.at === at) || null;
}

export function deleteBackup(at) {
  const list = listBackups().filter((b) => b.at !== at);
  localStorage.setItem(KEY_BACKUPS, JSON.stringify(list));
  return list;
}

/* ---------------- import / export ---------------- */

export function exportJSON(data) {
  return JSON.stringify(data, null, 2);
}

export function downloadJSON(data, filename = 'content.json') {
  const blob = new Blob([exportJSON(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function importJSON(text) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object' || !parsed.profile) {
    throw new Error('Struktur JSON tidak valid: bagian "profile" tidak ditemukan.');
  }
  if (!Array.isArray(parsed.projects)) {
    throw new Error('Struktur JSON tidak valid: "projects" harus berupa array.');
  }
  return parsed;
}

/* ---------------- sesi admin ---------------- */

// hash SHA-256 password admin. Ganti nilai ini untuk mengubah password.
// Dibuat dengan: echo -n "PASSWORD_BARU" | sha256sum
const ADMIN_HASH = '8b348555dbd67e49e227032ad644528c726c311960c02d85c057c8bce323dd81';

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function login(password) {
  const hash = await sha256(password);
  if (hash !== ADMIN_HASH) return false;
  sessionStorage.setItem(KEY_SESSION, '1');
  return true;
}

export function logout() {
  sessionStorage.removeItem(KEY_SESSION);
}

export function isLoggedIn() {
  return sessionStorage.getItem(KEY_SESSION) === '1';
}
