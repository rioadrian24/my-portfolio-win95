import { createWindowManager } from './windows.js';
import { mountTerminal } from './terminal.js';

// Desktop mini gaya Windows 95: boot DOS, ikon desktop, taskbar, jendela konten.
// Seluruh konten dibaca dari content.json — ganti di satu file itu saja.
export function initOS({ content, sound, onExit, reducedMotion = false }) {
  const overlay = document.getElementById('os-overlay');
  const screen = document.getElementById('os-screen');
  const bootEl = document.getElementById('os-boot');
  const desktopEl = document.getElementById('os-desktop');
  const iconsEl = document.getElementById('os-icons');
  const windowsEl = document.getElementById('os-windows');
  const taskbarWins = document.getElementById('os-taskbar-windows');
  const clockEl = document.getElementById('os-clock');

  const wm = createWindowManager({ windowsEl, taskbarEl: taskbarWins, screenEl: screen, sound });
  let booted = false;
  let clockTimer = null;

  const { profile, projects, contact, resume } = content;

  /* ---------- isi jendela ---------- */
  function renderAbout(body) {
    body.innerHTML = `
      <h3>${profile.name}</h3>
      <p class="meta">${profile.role} · ${profile.location}</p>
      <p style="margin-top:8px"><b>${profile.tagline}</b></p>
      <p style="margin-top:8px">${profile.bio}</p>`;
  }

  function renderProjects(body) {
    body.innerHTML = `<h3>Projects (${projects.length})</h3>` + projects.map((p) => `
      <div class="proj">
        <h4>${p.title}</h4>
        <p>${p.description}</p>
        <p class="tech">${p.tech.join(' · ')}</p>
        <p class="links">
          ${p.demo && !p.demo.includes('example.com') ? `<a href="${p.demo}" target="_blank" rel="noopener">Buka situs</a>` : ''}
          ${p.repo && !p.repo.includes('[username]') ? `<a href="${p.repo}" target="_blank" rel="noopener">Source</a>` : ''}
        </p>
      </div>`).join('');
  }

  function renderResume(body) {
    body.innerHTML = `
      <h3>Resume</h3>
      <p>${profile.name} — ${profile.role}</p>
      <p class="meta">Versi PDF terbaru, siap diunduh.</p>
      <a class="big-btn" href="${resume.url}" download>${resume.label}</a>
      <p class="meta" style="margin-top:10px">Taruh file PDF di <b>public/resume.pdf</b>
      (atau ubah <b>resume.url</b> di content.json).</p>`;
  }

  function renderContact(body) {
    body.innerHTML = `
      <h3>Contact</h3>
      <p>${contact.note || ''}</p>
      <p style="margin-top:8px">Email: <a href="mailto:${contact.email}">${contact.email}</a></p>
      <p>GitHub: <a href="${contact.github}" target="_blank" rel="noopener">${contact.github.replace('https://github.com/', 'github.com/')}</a></p>
      <p>LinkedIn: <a href="${contact.linkedin}" target="_blank" rel="noopener">LinkedIn</a></p>`;
  }

  function renderTerminal(body) {
    mountTerminal(body, content, sound);
  }

  const APPS = [
    { id: 'about', title: 'About Me', glyph: '🖥️', render: renderAbout, width: '400px' },
    { id: 'projects', title: 'Projects', glyph: '🗂️', render: renderProjects, width: '480px' },
    { id: 'resume', title: 'Resume', glyph: '📄', render: renderResume, width: '400px' },
    { id: 'contact', title: 'Contact', glyph: '✉️', render: renderContact, width: '380px' },
    { id: 'terminal', title: 'MS-DOS Prompt', glyph: '⌨️', render: renderTerminal, width: '500px' },
  ];

  function openApp(id) {
    const app = APPS.find((a) => a.id === id);
    if (app) wm.open({ id: app.id, title: app.title, render: app.render, width: app.width });
  }

  // ikon desktop: klik = pilih, dobel-klik = buka (perilaku 95)
  APPS.forEach((app) => {
    const b = document.createElement('button');
    b.className = 'os-icon';
    b.innerHTML = `<span class="glyph">${app.glyph}</span><span>${app.title}</span>`;
    b.addEventListener('click', () => {
      iconsEl.querySelectorAll('.os-icon').forEach((n) => n.classList.remove('selected'));
      b.classList.add('selected');
      sound?.beep(600, 0.03, 'square', 0.02);
    });
    b.addEventListener('dblclick', () => openApp(app.id));
    iconsEl.appendChild(b);
  });

  /* ---------- Start menu ---------- */
  const startBtn = document.getElementById('os-start');
  let startMenu = null;

  function buildStartMenu() {
    const menu = document.createElement('div');
    menu.id = 'os-startmenu';
    menu.setAttribute('role', 'menu');
    menu.innerHTML = `
      <div class="sm-side"><span>Windows 95</span></div>
      <div class="sm-items">
        ${APPS.map((a) => `<button class="sm-item" role="menuitem" data-app="${a.id}">
          <span class="sm-ico">${a.glyph}</span>${a.title}</button>`).join('')}
        <div class="sm-sep"></div>
        <button class="sm-item" role="menuitem" data-act="sound"><span class="sm-ico">♪</span>Suara: <b id="sm-sound-state">Mati</b></button>
        <div class="sm-sep"></div>
        <button class="sm-item" role="menuitem" data-act="exit"><span class="sm-ico">⏻</span>Shut Down...</button>
      </div>`;
    menu.addEventListener('click', (e) => {
      const item = e.target.closest('.sm-item');
      if (!item) return;
      if (item.dataset.app) openApp(item.dataset.app);
      else if (item.dataset.act === 'sound') toggleSound();
      else if (item.dataset.act === 'exit') onExit();
      closeStartMenu();
    });
    screen.appendChild(menu);
    return menu;
  }

  function openStartMenu() {
    if (!startMenu) startMenu = buildStartMenu();
    document.getElementById('sm-sound-state').textContent = sound.enabled ? 'Nyala' : 'Mati';
    startMenu.classList.add('open');
    startBtn.classList.add('pressed');
    document.addEventListener('pointerdown', onDocDown, true);
  }

  function closeStartMenu() {
    if (startMenu) startMenu.classList.remove('open');
    startBtn.classList.remove('pressed');
    document.removeEventListener('pointerdown', onDocDown, true);
  }

  function onDocDown(e) {
    if (e.target.closest('#os-startmenu') || e.target.closest('#os-start')) return;
    closeStartMenu();
  }

  startBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (startMenu && startMenu.classList.contains('open')) closeStartMenu();
    else openStartMenu();
  });

  // jam real-time di tray
  function tickClock() {
    clockEl.textContent = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  // suara (default OFF) — dikendalikan dari Start menu
  function toggleSound() {
    sound.setEnabled(!sound.enabled);
    if (sound.enabled) sound.beep(880, 0.08, 'square', 0.03);
  }

  /* ---------- boot sequence (gaya POST/DOS) ---------- */
  const BOOT_LINES = [
    'Award Modular BIOS v4.51PG, An Energy Star Ally',
    'Copyright (C) 1984-95, Award Software, Inc.',
    '',
    'Main Processor : Pentium(tm) 133MHz',
    'Memory Test     : 16384K OK',
    '',
    'Detecting HDD Primary Master  ... WDC AC21600H',
    'Detecting HDD Primary Slave   ... None',
    '',
    'Starting MS-DOS...',
    '',
    '<span class="warn">HIMEM is testing extended memory...done.</span>',
    'C:\\> WIN',
    '',
    'Memuat driver grafis ....................... <span class="ok">OK</span>',
    'Memuat driver keyboard ..................... <span class="ok">OK</span>',
    'Memuat driver mouse ........................ <span class="ok">OK</span>',
    'Menyiapkan desktop ......................... <span class="ok">OK</span>',
  ];

  function runBoot(done) {
    bootEl.classList.remove('hidden');
    bootEl.innerHTML = '';
    sound.beep(660, 0.12, 'square', 0.03);
    if (reducedMotion) {
      bootEl.innerHTML = BOOT_LINES.join('\n');
      setTimeout(done, 600);
      return;
    }
    let i = 0;
    const iv = setInterval(() => {
      bootEl.innerHTML += BOOT_LINES[i] + '\n';
      if (BOOT_LINES[i].trim()) sound.beep(480 + (i % 5) * 30, 0.02, 'square', 0.015);
      i++;
      if (i >= BOOT_LINES.length) {
        clearInterval(iv);
        setTimeout(done, 300);
      }
    }, 110);
  }

  function showDesktop() {
    bootEl.classList.add('hidden');
    desktopEl.classList.remove('hidden');
    tickClock();
    clockTimer = setInterval(tickClock, 1000);
    // buka jendela sambutan sekali saja
    setTimeout(() => openApp('about'), 250);
  }

  /* ---------- API publik ---------- */
  function show() {
    overlay.classList.remove('hidden');
    requestAnimationFrame(() => overlay.classList.add('show'));
    if (!booted) {
      booted = true;
      runBoot(showDesktop);
    } else if (desktopEl.classList.contains('hidden')) {
      showDesktop();
    } else {
      tickClock();
      clockTimer = setInterval(tickClock, 1000);
    }
  }

  function hide() {
    closeStartMenu();
    overlay.classList.remove('show');
    clearInterval(clockTimer);
    setTimeout(() => {
      overlay.classList.add('hidden');
      wm.closeAll();
      desktopEl.classList.add('hidden');
    }, 260);
  }

  return { show, hide, openApp };
}
