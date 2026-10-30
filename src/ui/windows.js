// Window manager gaya Windows 95: jendela draggable, title bar biru,
// tombol minimize / maximize / close, z-order, dan tombol taskbar.
export function createWindowManager({ windowsEl, taskbarEl, screenEl, sound }) {
  const wins = new Map();
  let zTop = 10;
  let cascade = 0;

  function bringToFront(win) {
    win.el.style.zIndex = ++zTop;
    wins.forEach((w) => {
      w.el.classList.toggle('inactive', w !== win);
      w.taskBtn?.classList.remove('active');
    });
    win.taskBtn?.classList.add('active');
  }

  function clampToScreen(win) {
    const pr = screenEl.getBoundingClientRect();
    const r = win.el.getBoundingClientRect();
    const nx = parseFloat(win.el.style.left) || 0;
    const ny = parseFloat(win.el.style.top) || 0;
    win.el.style.left = Math.max(-r.width + 80, Math.min(pr.width - 80, nx)) + 'px';
    win.el.style.top = Math.max(0, Math.min(pr.height - 80, ny)) + 'px';
  }

  function makeDraggable(win) {
    const bar = win.el.querySelector('.os-titlebar');
    let sx, sy, ox, oy, dragging = false;
    bar.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.os-btn')) return;
      if (win.maximized) return;
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      const r = win.el.getBoundingClientRect();
      const pr = screenEl.getBoundingClientRect();
      ox = r.left - pr.left; oy = r.top - pr.top;
      bar.setPointerCapture(e.pointerId);
      bringToFront(win);
    });
    bar.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      win.el.style.left = (ox + e.clientX - sx) + 'px';
      win.el.style.top = Math.max(0, oy + e.clientY - sy) + 'px';
      win.el.style.right = 'auto'; win.el.style.bottom = 'auto';
      clampToScreen(win);
    });
    bar.addEventListener('pointerup', () => { dragging = false; });
    bar.addEventListener('pointercancel', () => { dragging = false; });
    // double-click title bar = maximize / restore (perilaku 95)
    bar.addEventListener('dblclick', (e) => {
      if (e.target.closest('.os-btn')) return;
      toggleMaximize(win);
    });
  }

  function toggleMaximize(win) {
    if (win.maximized) {
      Object.assign(win.el.style, win.prevBox);
      win.el.classList.remove('maximized');
      win.maximized = false;
    } else {
      win.prevBox = {
        left: win.el.style.left, top: win.el.style.top,
        width: win.el.style.width, height: win.el.style.height,
      };
      win.el.style.left = '0px';
      win.el.style.top = '0px';
      win.el.style.width = '100%';
      win.el.style.height = 'calc(100% - 30px)';
      win.el.classList.add('maximized');
      win.maximized = true;
    }
    sound?.beep(700, 0.04, 'square', 0.02);
  }

  function open({ id, title, render, width }) {
    // kalau sudah terbuka: fokuskan (atau restore bila minimize)
    if (wins.has(id)) {
      const w = wins.get(id);
      if (w.minimized) {
        w.el.style.display = 'flex';
        w.minimized = false;
      }
      bringToFront(w);
      return w;
    }

    const el = document.createElement('div');
    el.className = 'os-window';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', title);
    el.style.width = width || '420px';

    // cascade agar jendela tidak menumpuk persis
    const off = (cascade % 6) * 26;
    el.style.left = (24 + off) + 'px';
    el.style.top = (24 + off) + 'px';
    cascade++;

    el.innerHTML = `
      <div class="os-titlebar">
        <span class="ttl">${title}</span>
        <button class="os-btn" data-act="min" aria-label="Minimize">_</button>
        <button class="os-btn" data-act="max" aria-label="Maximize">□</button>
        <button class="os-btn" data-act="close" aria-label="Tutup">×</button>
      </div>
      <div class="os-body"></div>`;
    const body = el.querySelector('.os-body');
    render(body);

    const taskBtn = document.createElement('button');
    taskBtn.className = 'taskbtn';
    taskBtn.textContent = title;
    taskBtn.addEventListener('click', () => {
      const w = wins.get(id);
      if (!w) return;
      if (w.minimized) {
        w.el.style.display = 'flex'; w.minimized = false; bringToFront(w);
      } else if (parseInt(w.el.style.zIndex) === zTop) {
        w.el.style.display = 'none'; w.minimized = true;
        taskBtn.classList.remove('active');
      } else {
        bringToFront(w);
      }
    });
    taskbarEl.appendChild(taskBtn);

    const win = { id, el, taskBtn, minimized: false, maximized: false, prevBox: null };
    el.querySelector('[data-act="close"]').addEventListener('click', () => close(id));
    el.querySelector('[data-act="max"]').addEventListener('click', () => toggleMaximize(win));
    el.querySelector('[data-act="min"]').addEventListener('click', () => {
      el.style.display = 'none'; win.minimized = true;
      taskBtn.classList.remove('active');
      sound?.beep(520, 0.06, 'square', 0.03);
    });
    el.addEventListener('pointerdown', () => bringToFront(win), true);

    windowsEl.appendChild(el);
    wins.set(id, win);
    makeDraggable(win);
    bringToFront(win);
    sound?.beep(760, 0.05, 'square', 0.03);
    return win;
  }

  function close(id) {
    const w = wins.get(id);
    if (!w) return;
    w.el.remove();
    w.taskBtn.remove();
    wins.delete(id);
    sound?.beep(420, 0.06, 'square', 0.03);
  }

  function closeAll() {
    [...wins.keys()].forEach(close);
    cascade = 0;
  }

  return { open, close, closeAll };
}
