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

## Kredit ikon

Ikon UI (computer, folder, notepad, envelope, MS-DOS, briefcase, globe,
recycle, settings) diambil dari
[trapd00r/win95-winxp_icons](https://github.com/trapd00r/win95-winxp_icons),
dikonversi dari `.ico` 32x32 ke PNG dan dirender dengan `image-rendering: pixelated`.
Repo sumber tidak menyertakan file lisensi; ikon Windows adalah karya Microsoft
Corporation dan dipakai di sini sebagai rujukan visual untuk tema retro.

## Mode Administrator (edit data lewat web)

Ada dua jalan masuk:

- Start > **Run as Administrator...**
- Dobel-klik ikon desktop **Administrator**

Login: user name `administrator`, password `D1208096`
(hanya hash SHA-256 yang tersimpan di kode, bukan password aslinya).

Setelah login, terbuka editor JSON dengan tombol: Simpan, Validasi, Rapikan,
Ekspor, Impor, Backup, Reset, Logoff. `Ctrl+S` simpan, `Ctrl+Enter` validasi.

### Cara kerja penyimpanan

GitHub Pages tidak punya backend, jadi data berlapis:

| Lapis | Lokasi | Isi |
|---|---|---|
| Bawaan | `src/data/content.json` (ikut build) | dipakai kalau belum ada edit |
| Aktif | `localStorage` key `portfolio.data.v1` | hasil edit admin |
| Backup | `localStorage` key `portfolio.backups.v1` | snapshot, maksimal 20 |

Setiap **Simpan** menyimpan kondisi data sebelum perubahan sebagai backup baru.
Backup bisa dilihat di tombol **Backup**: Restore, Unduh, atau Hapus.
Restore juga menyimpan kondisi saat itu sebagai backup, jadi tidak ada data hilang.

Data hanya tersimpan di browser yang dipakai. Untuk menjadikan permanen di repo:
**Ekspor** file `content.json`, lalu ganti `src/data/content.json` dan commit.

### Mengganti password

```bash
./scripts/hash-password.sh "PASSWORD_BARU"
```

Ganti konstanta `ADMIN_HASH` di `src/data/store.js` dengan hasil perintah itu,
lalu commit. Login disimpan di `sessionStorage`, jadi hilang saat tab ditutup.
