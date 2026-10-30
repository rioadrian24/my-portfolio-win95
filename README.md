# Portfolio — Desktop Windows 95

Versi uji coba tampilan portfolio dengan estetika **Windows 95**: desktop teal,
ikon kotak, taskbar abu-abu dengan Start menu, jendela draggable, dan prompt
MS-DOS.

Sama seperti versi utama: pengunjung masuk ke ruangan 3D, klik monitor, lalu
masuk ke desktop. Konten tetap dibaca dari `src/data/content.json`.

**Stack:** Three.js + Vite + vanilla JS.

## Menjalankan

```bash
npm install
npm run dev
npm run build
```

## Yang berbeda dari tema retro-terminal

- `src/os.css` — seluruh chrome 95 (bevel 4 lapis, taskbar, Start menu, tray).
- `src/ui/windows.js` — title bar biru, tombol minimize/maximize/close,
  double-click title bar untuk maximize.
- `src/ui/os.js` — boot POST/DOS, ikon desktop (klik = pilih, dobel-klik = buka),
  Start menu berisi aplikasi + kontrol suara + Shut Down.
- `src/styles.css` — loading screen bergaya boot, fallback non-WebGL abu-abu 95.

## Ganti konten

Semua teks di `src/data/content.json`. Placeholder `[NAMA KAMU]` dan sejenisnya
ada di `index.html` (title, meta SEO, teks sr-only, fallback).

## Palet

| Token | Nilai |
|---|---|
| Desktop | `#008080` |
| Face / tombol | `#c0c0c0` |
| Highlight | `#000080` |
| Light bevel | `#ffffff` |
| Shadow bevel | `#808080` |
| Dark bevel | `#000000` |
