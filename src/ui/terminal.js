// Prompt gaya MS-DOS: perintah portfolio, prompt C:\> , naskah monokrom.
export function mountTerminal(rootEl, content, sound) {
  const { profile, projects, contact } = content;
  rootEl.innerHTML = `
    <div class="os-term" role="log" aria-label="MS-DOS Prompt">
      <div class="out"></div>
      <div class="prompt-line">
        <span class="ps">C:\\&gt;</span>
        <input type="text" aria-label="Perintah" autocomplete="off" spellcheck="false" />
      </div>
    </div>`;
  const out = rootEl.querySelector('.out');
  const input = rootEl.querySelector('input');

  function print(text = '', cls = '') {
    const div = document.createElement('div');
    div.className = 'out ' + cls;
    div.textContent = text;
    out.appendChild(div);
    const scroller = rootEl.closest('.os-body') || rootEl;
    scroller.scrollTop = scroller.scrollHeight;
  }

  const cmds = {
    help() {
      print('Perintah yang tersedia:');
      print('  HELP      tampilkan bantuan ini');
      print('  DIR       daftar proyek');
      print('  TYPE      tentang saya');
      print('  CONTACT   info kontak');
      print('  WHOAMI    siapa saya');
      print('  DATE      tanggal dan jam');
      print('  CLS       bersihkan layar');
    },
    dir() {
      print(` Volume in drive C is PORTFOLIO`);
      print(` Directory of C:\\PROJECTS`);
      print('');
      projects.forEach((p) => {
        print(`  ${p.title.padEnd(42)} ${p.tech.join(', ')}`);
      });
      print('');
      print(`  ${projects.length} file(s)`);
    },
    type() {
      print(`${profile.name}`);
      print(`${profile.role} - ${profile.location}`);
      print('');
      print(profile.bio);
    },
    contact() {
      print(`EMAIL  : ${contact.email}`);
      print(`GITHUB : ${contact.github}`);
      print(`LINKED : ${contact.linkedin}`);
    },
    whoami() { print('guest - pengunjung yang penasaran.'); },
    date() { print(new Date().toString()); },
    cls() { out.innerHTML = ''; },
    about: 'type',
    projects: 'dir',
    clear: 'cls',
  };

  print('Microsoft(R) Windows 95');
  print('   (C)Copyright Microsoft Corp 1981-1995.');
  print('');
  print(content.terminal?.motd || "Ketik HELP untuk daftar perintah.");
  print('');

  input.addEventListener('keydown', (e) => {
    sound?.keyClick();
    if (e.key !== 'Enter') return;
    const raw = input.value;
    input.value = '';
    print(`C:\\>${raw}`);
    const key = raw.trim().toLowerCase().split(/\s+/)[0];
    if (!key) return;
    const resolved = typeof cmds[key] === 'string' ? cmds[cmds[key]] : cmds[key];
    if (resolved) resolved();
    else print(`Bad command or file name: ${key}`);
  });

  rootEl.querySelector('.os-term').addEventListener('click', () => input.focus());
  setTimeout(() => input.focus(), 300);
}
