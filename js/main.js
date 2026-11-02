// New York Friseur: Mosaikschild, Öffnungsstatus, Steckbuchstaben

// Öffnungszeiten in Minuten ab Mitternacht, Index = getDay() (0 = Sonntag)
const ZEITEN = [null, [570, 1170], [570, 1170], [570, 1170], [570, 1170], [570, 1170], [570, 1140]];
const TAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const uhr = m => `${Math.floor(m / 60)}${m % 60 ? ':' + String(m % 60).padStart(2, '0') : ''} Uhr`;

function status() {
  const el = document.querySelector('[data-status]');
  const jetzt = new Date(), tag = jetzt.getDay(), min = jetzt.getHours() * 60 + jetzt.getMinutes();
  const z = ZEITEN[tag];
  let html;
  if (z && min >= z[0] && min < z[1]) {
    html = `<strong>Jetzt geöffnet</strong>, heute bis ${uhr(z[1])}`;
    el.classList.add('status--offen');
  } else if (z && min < z[0]) {
    html = `<strong>Heute ab ${uhr(z[0])} geöffnet</strong>, bis ${uhr(z[1])}`;
  } else {
    let n = (tag + 1) % 7;
    while (!ZEITEN[n]) n = (n + 1) % 7;
    const wann = n === (tag + 1) % 7 ? 'morgen' : `am ${TAGE[n]}`;
    html = `<strong>Gerade geschlossen</strong>, wieder ${wann} ab ${uhr(ZEITEN[n][0])}`;
  }
  if (el) el.innerHTML = html;
  const zeile = document.querySelector(`[data-zeiten] [data-tag="${tag}"]`);
  if (zeile) zeile.classList.add('heute');
}

// Steckbuchstaben sitzen nie ganz gerade in der Rille
function tafel() {
  let s = 7;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647 - 0.5;
  document.querySelectorAll('[data-tafel] li > span').forEach(span => {
    span.innerHTML = span.textContent.split(' ').map(wort =>
      [...wort].map(c => `<span class="bs" style="transform:translateY(${(r() * 1.6).toFixed(2)}px) rotate(${(r() * 2.4).toFixed(2)}deg)">${c}</span>`).join('')
    ).join(' ');
  });
}

// Mosaikschild im Stil der New Yorker U-Bahn-Stationen, Fliese für Fliese aus der Schrift gerastert
const FARBE = { fuge: '#a9a192', feld: '#f2efe7', schrift: '#1c1b1a', rahmen: '#7a2018', ocker: '#c18d2e', creme: '#ece2c8' };
const SS = 12;                 // Abtastpunkte pro Fliese
let glyphCache = {}, ersteRunde = true;

function glyphe(ch, cap) {
  const key = ch + cap;
  if (glyphCache[key]) return glyphCache[key];
  const c = document.createElement('canvas'), x = c.getContext('2d');
  x.fontStretch = 'semi-condensed';
  x.font = '800 100px Archivo';
  const hoehe = x.measureText('H').actualBoundingBoxAscent;
  const fs = 100 * cap * SS / hoehe;
  x.font = `800 ${fs}px Archivo`;
  const w = Math.ceil(x.measureText(ch).width);
  c.width = w + 2; c.height = cap * SS;
  x.fontStretch = 'semi-condensed';
  x.font = `800 ${fs}px Archivo`;
  x.fillStyle = '#000';
  x.textBaseline = 'alphabetic';
  x.fillText(ch, 1, cap * SS);
  const d = x.getImageData(0, 0, c.width, c.height).data;
  const cols = Math.max(1, Math.round(c.width / SS));
  const grid = [];
  for (let ty = 0; ty < cap; ty++) {
    const row = [];
    for (let tx = 0; tx < cols; tx++) {
      let sum = 0, n = 0;
      for (let y = ty * SS; y < (ty + 1) * SS; y++)
        for (let xx = Math.floor(tx * c.width / cols); xx < Math.floor((tx + 1) * c.width / cols); xx++) { sum += d[(y * c.width + xx) * 4 + 3]; n++; }
      row.push(sum / (n * 255) > 0.45);
    }
    grid.push(row);
  }
  // leere Randspalten entfernen
  let l = 0, r = cols - 1;
  while (l < r && grid.every(row => !row[l])) l++;
  while (r > l && grid.every(row => !row[r])) r--;
  return (glyphCache[key] = grid.map(row => row.slice(l, r + 1)));
}

function zeile(text, cap) {
  const teile = [];
  for (const ch of text) teile.push(ch === ' ' ? null : glyphe(ch, cap));
  const breite = teile.reduce((s, g, i) => s + (g ? g[0].length : Math.round(cap * 0.35)) + (i ? 1 : 0), 0);
  return { teile, breite };
}

function mosaik(cv) {
  const W = cv.clientWidth;
  if (!W) return;
  const zeilen = W < 900 ? ['NEW YORK', 'FRISEUR'] : ['NEW YORK FRISEUR'];
  const RAHMEN = 5, PAD = 3, ABST = 4;
  const ziel = W < 680 ? 3.4 : W < 1100 ? 4.4 : 5.2;   // gewünschte Fliesengröße in px
  let cap = 7, plan;
  for (let c = 7; c <= 30; c++) {
    const z = zeilen.map(t => zeile(t, c));
    const cols = Math.max(...z.map(q => q.breite)) + 2 * (RAHMEN + PAD + 1);
    if (W / cols < ziel && plan) break;
    cap = c; plan = { z, cols };
  }
  const { z, cols } = plan;
  const rows = 2 * (RAHMEN + PAD) + z.length * cap + (z.length - 1) * ABST;
  const t = W / cols, dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(W * dpr); cv.height = Math.round(rows * t * dpr);
  const x = cv.getContext('2d');
  x.scale(dpr, dpr);

  // Raster: jede Fliese bekommt ihre Farbe
  const feld = Array.from({ length: rows }, () => Array(cols).fill('feld'));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const rand = Math.min(r, c, rows - 1 - r, cols - 1 - c);
    if (rand <= 1 || rand === 4) feld[r][c] = 'rahmen';
    else if (rand <= 3) feld[r][c] = (Math.floor(r / 2) + Math.floor(c / 2)) % 2 ? 'ocker' : 'creme';
  }
  z.forEach((q, i) => {
    let cx = Math.floor((cols - q.breite) / 2);
    const cy = RAHMEN + PAD + i * (cap + ABST);
    q.teile.forEach((g, k) => {
      if (k) cx++;
      if (!g) { cx += Math.round(cap * 0.35); return; }
      g.forEach((row, ry) => row.forEach((on, rx) => { if (on) feld[cy + ry][cx + rx] = 'schrift'; }));
      cx += g[0].length;
    });
  });

  let s = 11;
  const zz = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const fliesen = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) fliesen.push({ r, c, f: feld[r][c], j: zz(), o: c + zz() * 14 });
  const g = Math.max(1, t * 0.13);
  const male = f => {
    x.fillStyle = FARBE[f.f];
    x.fillRect(f.c * t + g / 2, f.r * t + g / 2, t - g, t - g);
    x.fillStyle = f.j < 0.5 ? `rgba(255,255,255,${(0.5 - f.j) * 0.22})` : `rgba(0,0,0,${(f.j - 0.5) * 0.14})`;
    x.fillRect(f.c * t + g / 2, f.r * t + g / 2, t - g, t - g);
  };
  x.fillStyle = FARBE.fuge;
  x.fillRect(0, 0, W, rows * t);

  const still = !ersteRunde || matchMedia('(prefers-reduced-motion: reduce)').matches;
  ersteRunde = false;
  if (still) { fliesen.forEach(male); return; }
  // beim ersten Laden werden die Fliesen von links nach rechts gesetzt
  fliesen.sort((a, b) => a.o - b.o);
  const dauer = 1100, start = performance.now();
  let i = 0;
  const schritt = now => {
    const bis = Math.min(fliesen.length, Math.ceil(fliesen.length * Math.min(1, (now - start) / dauer)));
    for (; i < bis; i++) male(fliesen[i]);
    if (i < fliesen.length) requestAnimationFrame(schritt);
  };
  requestAnimationFrame(schritt);
}

status();
tafel();
const cv = document.querySelector('[data-mosaik]');
if (cv) {
  document.fonts.load('800 100px Archivo').then(() => {
    mosaik(cv);
    let w = cv.clientWidth, timer;
    addEventListener('resize', () => {
      clearTimeout(timer);
      timer = setTimeout(() => { if (cv.clientWidth !== w) { w = cv.clientWidth; mosaik(cv); } }, 150);
    });
  });
}
