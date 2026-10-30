// Terminal mini: prompt interaktif dengan perintah portfolio.
export function mountTerminal(rootEl, content, sound) {
  const { profile, projects, contact } = content;
  rootEl.innerHTML = `
    <div class="os-term" role="log" aria-label="Terminal">
      <div class="out"></div>
      <div class="prompt-line">
        <span class="ps">guest@retro-os:~$</span>
        <input type="text" aria-label="Perintah terminal" autocomplete="off" spellcheck="false" />
      </div>
    </div>`;
  const out = rootEl.querySelector('.out');
  const input = rootEl.querySelector('input');

  function print(text = '', cls = '') {
    const div = document.createElement('div');
    div.className = 'out ' + cls;
    div.textContent = text;
    out.appendChild(div);
    const scroller = rootEl.querySelector('.os-body');
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  }

  const cmds = {
    help() {
      print('Perintah tersedia:');
      print('  help       tampilkan bantuan ini');
      print('  about      tentang saya');
      print('  projects   daftar proyek');
      print('  contact    info kontak');
      print('  whoami     siapa kamu?');
      print('  date       tanggal & jam');
      print('  clear      bersihkan layar');
    },
    about() {
      print(`${profile.name} — ${profile.role}`);
      print(profile.bio);
      print(`Lokasi: ${profile.location}`);
    },
    projects() {
      projects.forEach((p, i) => {
        print(`[${i + 1}] ${p.title}`);
        print(`    ${p.description}`);
        print(`    tech: ${p.tech.join(', ')}`);
      });
    },
    contact() {
      print(`Email    : ${contact.email}`);
      print(`GitHub   : ${contact.github}`);
      print(`LinkedIn : ${contact.linkedin}`);
    },
    whoami() { print('guest — pengunjung yang penasaran. Bagus.'); },
    date() { print(new Date().toString()); },
    clear() { out.innerHTML = ''; },
  };

  print(content.terminal?.motd || "Ketik 'help' untuk mulai.");

  input.addEventListener('keydown', (e) => {
    sound?.keyClick();
    if (e.key !== 'Enter') return;
    const raw = input.value.trim();
    input.value = '';
    print(`guest@retro-os:~$ ${raw}`);
    if (!raw) return;
    const [cmd] = raw.toLowerCase().split(/\s+/);
    if (cmds[cmd]) cmds[cmd]();
    else print(`perintah tidak dikenal: ${cmd}  (coba 'help')`);
  });

  // klik area terminal -> fokus ke input
  rootEl.querySelector('.os-term').addEventListener('click', () => input.focus());
  setTimeout(() => input.focus(), 300);
}
