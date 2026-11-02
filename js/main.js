// New York Friseur: Öffnungsstatus, Kopfzeile, Preis-Reiter, Galerie

document.documentElement.classList.add('js');

// Öffnungszeiten in Minuten ab Mitternacht, Index = getDay() (0 = Sonntag)
const ZEITEN = [null, [570, 1170], [570, 1170], [570, 1170], [570, 1170], [570, 1170], [570, 1140]];
const TAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const uhr = m => `${Math.floor(m / 60)}${m % 60 ? ':' + String(m % 60).padStart(2, '0') : ''} Uhr`;

function status() {
  const el = document.querySelector('[data-status]');
  const jetzt = new Date(), tag = jetzt.getDay(), min = jetzt.getHours() * 60 + jetzt.getMinutes();
  const z = ZEITEN[tag];
  let html;
  if (z && min >= z[0] && min < z[1]) html = `<strong>Jetzt geöffnet</strong> bis ${uhr(z[1])}.`;
  else if (z && min < z[0]) html = `<strong>Heute ab ${uhr(z[0])}</strong> geöffnet.`;
  else {
    let n = (tag + 1) % 7;
    while (!ZEITEN[n]) n = (n + 1) % 7;
    html = `Wieder geöffnet ${n === (tag + 1) % 7 ? 'morgen' : 'am ' + TAGE[n]} ab ${uhr(ZEITEN[n][0])}.`;
  }
  if (el) el.innerHTML = html;
  const zeile = document.querySelector(`[data-zeiten] [data-tag="${tag}"]`);
  if (zeile) zeile.classList.add('heute');
}

// Kopfzeile wird dunkel, sobald das Foto oben verlassen ist
function kopf() {
  const k = document.querySelector('[data-kopf]');
  if (!k || k.classList.contains('kopf--seite')) return;
  const pruefen = () => k.classList.toggle('kopf--fest', scrollY > 40);
  pruefen();
  addEventListener('scroll', pruefen, { passive: true });
}

// Preisliste als Reiter (ohne JavaScript stehen alle Listen untereinander)
function reiter() {
  const leiste = document.querySelector('[data-reiter]');
  if (!leiste) return;
  const tabs = [...leiste.querySelectorAll('[role="tab"]')];
  const waehle = (tab, fokus) => {
    tabs.forEach(t => {
      const an = t === tab;
      t.setAttribute('aria-selected', an);
      t.tabIndex = an ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !an;
    });
    if (fokus) tab.focus();
  };
  leiste.hidden = false;
  waehle(tabs[0]);
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => waehle(t));
    t.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) waehle(tabs[(i + d + tabs.length) % tabs.length], true);
    });
  });
  document.querySelectorAll('[data-tab-link]').forEach(a => a.addEventListener('click', () => {
    waehle(document.getElementById('tab-' + a.dataset.tabLink));
  }));
}

// Galerie: Foto groß im Dialog
function galerie() {
  const dlg = document.querySelector('[data-lightbox]');
  if (!dlg || !dlg.showModal) return;
  const bild = dlg.querySelector('img');
  document.querySelectorAll('[data-galerie] a').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    bild.src = a.href;
    bild.alt = a.querySelector('img').alt;
    dlg.showModal();
  }));
  dlg.addEventListener('click', () => dlg.close());
}

status();
kopf();
reiter();
galerie();
