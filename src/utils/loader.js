import { LoadingManager } from 'three';

// Central LoadingManager — dipakai untuk semua aset.
// Progress bar di-update dari sini; teks status bisa di-pass per tahap.
export function createLoader(onProgress) {
  const manager = new LoadingManager();
  let itemsTotal = 0;
  let itemsLoaded = 0;

  manager.onStart = (url, loaded, total) => {
    itemsTotal = total;
    itemsLoaded = loaded;
    onProgress(loaded / Math.max(total, 1), url);
  };
  manager.onProgress = (url, loaded, total) => {
    itemsLoaded = loaded;
    itemsTotal = total;
    onProgress(loaded / Math.max(total, 1), url);
  };
  manager.onLoad = () => onProgress(1, 'done');
  manager.onError = (url) => console.warn('[loader] gagal memuat:', url);
  return manager;
}

// Helper: daftarkan "tugas" sinkron ke manager agar progress bar bergerak
// walau aset utamanya prosedural (tanpa fetch jaringan).
export function trackSyncTask(manager, label, fn) {
  manager.itemStart(label);
  try {
    fn();
  } finally {
    manager.itemEnd(label);
  }
}
