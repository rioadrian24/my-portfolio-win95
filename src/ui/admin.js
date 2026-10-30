// Editor admin bergaya Windows 95: login dialog, editor JSON, riwayat backup.
import {
  getData, setData, resetData, isCustomised,
  listBackups, pushBackup, getBackup, deleteBackup,
  exportJSON, downloadJSON, importJSON,
  login, logout, isLoggedIn,
} from '../data/store.js';

const LOGIN_W = 'Logon';
const WIN_W = 'Administrator';

export function initAdmin({ wm, screen, defaults, onDataChanged, sound }) {
  /* ================= dialog login ================= */
  function openLogin() {
    const win = wm.open({
      id: 'login',
      title: LOGIN_W,
      width: '380px',
      icon: 'icons/computer.png',
      render(body) {
        body.innerHTML = `
          <div class="logon">
            <div class="logon-head">
              <img src="icons/winflag.png" alt="" width="32" height="32" />
              <div>
                <p class="logon-title">Welcome to Windows 95</p>
                <p class="meta">Masuk sebagai administrator untuk mengubah data portfolio.</p>
              </div>
            </div>
            <div class="logon-field">
              <label for="logon-user">User name:</label>
              <input id="logon-user" type="text" value="administrator" spellcheck="false" autocomplete="username" />
            </div>
            <div class="logon-field">
              <label for="logon-pass">Password:</label>
              <input id="logon-pass" type="password" spellcheck="false" autocomplete="current-password" />
            </div>
            <p class="logon-msg" role="alert"></p>
            <div class="logon-actions">
              <button class="big-btn" data-act="ok">OK</button>
              <button class="big-btn" data-act="cancel">Batal</button>
            </div>
          </div>`;
        const pass = body.querySelector('#logon-pass');
        const msg = body.querySelector('.logon-msg');
        const user = body.querySelector('#logon-user');

        async function submit() {
          if (user.value.trim().toLowerCase() !== 'administrator') {
            msg.textContent = 'User name harus administrator.';
            return;
          }
          const ok = await login(pass.value);
          if (!ok) {
            msg.textContent = 'Password salah. Coba lagi.';
            pass.value = '';
            pass.focus();
            sound?.beep(320, 0.12, 'square', 0.04);
            return;
          }
          sound?.beep(880, 0.08, 'square', 0.03);
          wm.close('login');
          openAdmin();
        }

        body.querySelector('[data-act="ok"]').addEventListener('click', submit);
        body.querySelector('[data-act="cancel"]').addEventListener('click', () => wm.close('login'));
        body.querySelector('.logon').addEventListener('keydown', (e) => {
          if (e.key === 'Enter') submit();
        });
        setTimeout(() => pass.focus(), 120);
      },
    });
    return win;
  }

  /* ================= editor admin ================= */
  function openAdmin() {
    const wmWin = wm.open({
      id: 'admin',
      title: WIN_W,
      width: '640px',
      icon: 'icons/settings.png',
      render(body) {
        body.innerHTML = `
          <div class="adm">
            <div class="adm-bar">
              <span class="adm-state" aria-live="polite">Siap.</span>
              <div class="spacer"></div>
              <button class="big-btn" data-act="save">Simpan</button>
              <button class="big-btn" data-act="validate">Validasi</button>
              <button class="big-btn" data-act="format">Rapikan</button>
              <button class="big-btn" data-act="export">Ekspor</button>
              <button class="big-btn" data-act="import">Impor</button>
              <button class="big-btn" data-act="backups">Backup</button>
              <button class="big-btn" data-act="reset">Reset</button>
              <button class="big-btn" data-act="logout">Logoff</button>
            </div>
            <textarea class="adm-edit" spellcheck="false" aria-label="Isi content.json"></textarea>
            <div class="adm-foot">
              <span class="meta" data-role="stat"></span>
            </div>
            <input type="file" accept="application/json,.json" data-role="file" hidden />
          </div>`;

        const edit = body.querySelector('.adm-edit');
        const state = body.querySelector('.adm-state');
        const stat = body.querySelector('[data-role="stat"]');
        const fileInput = body.querySelector('[data-role="file"]');

        edit.value = exportJSON(getData(defaults));
        updateStat();

        function setState(text, kind = '') {
          state.textContent = text;
          state.className = 'adm-state' + (kind ? ' ' + kind : '');
        }

        function updateStat() {
          const lines = edit.value.split('\n').length;
          const bytes = new Blob([edit.value]).size;
          stat.textContent = `${lines} baris · ${bytes} byte · ${isCustomised() ? 'data kustom aktif' : 'memakai content.json bawaan'}`;
        }

        function parsedOrNull() {
          try {
            return importJSON(edit.value);
          } catch (e) {
            return e;
          }
        }

        // peringatan saat menutup dengan perubahan belum disimpan
        let dirty = false;
        edit.addEventListener('input', () => {
          dirty = true;
          updateStat();
          setState('Belum disimpan.');
        });

        const handle = {
          save() {
            const res = parsedOrNull();
            if (res instanceof Error) {
              setState(res.message, 'bad');
              sound?.beep(300, 0.12, 'square', 0.04);
              return;
            }
            pushBackup(getData(defaults), 'sebelum simpan');
            setData(res);
            dirty = false;
            setState('Tersimpan. Backup data sebelumnya dibuat di localStorage.', 'good');
            updateStat();
            sound?.beep(880, 0.08, 'square', 0.03);
            onDataChanged?.(getData(defaults));
          },
          validate() {
            const res = parsedOrNull();
            if (res instanceof Error) {
              setState(res.message, 'bad');
              return;
            }
            setState(`JSON valid: ${res.projects.length} proyek, profil "${res.profile.name}".`, 'good');
          },
          format() {
            const res = parsedOrNull();
            if (res instanceof Error) { setState(res.message, 'bad'); return; }
            edit.value = exportJSON(res);
            updateStat();
            setState('JSON dirapikan (indentasi 2 spasi).', 'good');
          },
          export() {
            const res = parsedOrNull();
            if (res instanceof Error) { setState(res.message, 'bad'); return; }
            downloadJSON(res, 'content.json');
            setState('File content.json diunduh.');
          },
          import() {
            fileInput.value = '';
            fileInput.click();
          },
          backups() {
            openBackups();
          },
          reset() {
            if (!confirm('Kembalikan ke content.json bawaan dan hapus data kustom?')) return;
            pushBackup(getData(defaults), 'sebelum reset');
            const fresh = resetData(defaults);
            edit.value = exportJSON(fresh);
            updateStat();
            setState('Data dikembalikan ke bawaan.', 'good');
            onDataChanged?.(fresh);
          },
          logout() {
            logout();
            wm.close('admin');
            wm.close('backups');
            sound?.beep(420, 0.08, 'square', 0.03);
          },
        };

        body.querySelectorAll('[data-act]').forEach((btn) => {
          btn.addEventListener('click', () => {
            const fn = handle[btn.dataset.act];
            if (fn) fn();
          });
        });

        fileInput.addEventListener('change', async () => {
          const f = fileInput.files?.[0];
          if (!f) return;
          try {
            const text = await f.text();
            const res = importJSON(text);
            edit.value = exportJSON(res);
            updateStat();
            dirty = true;
            setState(`Dimuat dari file: ${f.name}. Tekan Simpan untuk menerapkan.`, 'good');
          } catch (e) {
            setState('Gagal membaca file: ' + e.message, 'bad');
          }
        });

        // Ctrl+S simpan, Ctrl+Enter validasi
        edit.addEventListener('keydown', (e) => {
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
            handle.save();
          } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            handle.validate();
          }
        });

        return {
          beforeClose() {
            return !dirty || confirm('Ada perubahan yang belum disimpan. Tutup tetap?');
          },
        };
      },
    });
    return wmWin;
  }

  /* ================= riwayat backup ================= */
  function openBackups() {
    const wmWin = wm.open({
      id: 'backups',
      title: 'Riwayat Backup',
      width: '560px',
      icon: 'icons/briefcase.png',
      render(body) {
        function paint() {
          const list = listBackups();
          if (!list.length) {
            body.innerHTML = `
              <div class="adm">
                <p>Belum ada backup. Backup dibuat otomatis setiap kali data disimpan.</p>
              </div>`;
            return;
          }
          body.innerHTML = `
            <div class="adm">
              <p class="meta">Snapshot lokal, maksimal 20 terbaru. Restore akan menyimpan kondisi sekarang sebagai backup baru.</p>
              <div class="bk-list">
                ${list.map((b, i) => `
                  <div class="bk-item">
                    <div class="bk-meta">
                      <b>#${i + 1}</b> ${new Date(b.at).toLocaleString('id-ID')}
                      <span class="meta"> · ${b.label} · ${b.bytes} byte</span>
                    </div>
                    <div class="bk-actions">
                      <button class="big-btn" data-restore="${b.at}">Restore</button>
                      <button class="big-btn" data-download="${b.at}">Unduh</button>
                      <button class="big-btn" data-del="${b.at}">Hapus</button>
                    </div>
                  </div>`).join('')}
              </div>
            </div>`;

          body.querySelectorAll('[data-restore]').forEach((btn) => {
            btn.addEventListener('click', () => {
              const b = getBackup(btn.dataset.restore);
              if (!b) return;
              if (!confirm('Restore backup ini? Data saat ini akan disimpan sebagai backup baru.')) return;
              pushBackup(getData(defaults), 'sebelum restore');
              setData(b.data);
              onDataChanged?.(getData(defaults));
              paint();
            });
          });
          body.querySelectorAll('[data-download]').forEach((btn) => {
            btn.addEventListener('click', () => {
              const b = getBackup(btn.dataset.download);
              if (b) downloadJSON(b.data, `content-backup-${b.at.slice(0, 19).replace(/[:T]/g, '-')}.json`);
            });
          });
          body.querySelectorAll('[data-del]').forEach((btn) => {
            btn.addEventListener('click', () => {
              deleteBackup(btn.dataset.del);
              paint();
            });
          });
        }
        paint();
      },
    });
    return wmWin;
  }

  return { openLogin, openAdmin, openBackups, isLoggedIn };
}
