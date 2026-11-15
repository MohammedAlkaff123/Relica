// First script on the page. Owner: Set C.
// 1. Landing page: logos, the challenge, the idea, GitHub and "Start the game".
// 2. Loading screen: downloads every file in content/preload.json into memory, with real progress.
// 3. Starts the game (src/main.js), which opens the main menu.
// Deep links for the team (?chapter=, ?jump=, ?test) skip the landing page and go straight to loading.
import { prefs } from './ui/prefs.js';
import { t, applyText } from './ui/i18n.js';
import { preloadAll } from './ui/loader.js';

const params = new URLSearchParams(location.search);
const deepLink = params.has('chapter') || params.has('jump') || params.has('test');
const $ = (id) => document.getElementById(id);

// ---------- language ----------
function syncLanguage() {
  applyText(document);
  document.title = t('landing.title');
  for (const b of document.querySelectorAll('#landing-lang .seg')) b.setAttribute('aria-pressed', String(b.dataset.lang === prefs.language));
}
syncLanguage();
prefs.subscribe(syncLanguage);
for (const b of document.querySelectorAll('#landing-lang .seg')) b.addEventListener('click', () => prefs.set({ language: b.dataset.lang }));

// ---------- the night sky: drawn once, still (no moving particles) ----------
function drawSky() {
  const sky = $('sky');
  const c = document.createElement('canvas');
  const w = innerWidth, h = innerHeight, dpr = Math.min(2, devicePixelRatio || 1);
  c.width = w * dpr; c.height = h * dpr;
  const g = c.getContext('2d');
  g.scale(dpr, dpr);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const count = Math.round((w * h) / 2600);
  for (let i = 0; i < count; i++) {
    const x = rnd() * w, y = rnd() * h, r = rnd() < 0.92 ? 0.5 + rnd() * 0.7 : 1.1 + rnd() * 0.9;
    g.globalAlpha = 0.25 + rnd() * 0.6;
    g.fillStyle = rnd() < 0.15 ? '#f3d9bd' : '#f2ebdd';
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  sky.style.backgroundImage = `url(${c.toDataURL('image/png')})`;
}
drawSky();
let skyTimer = 0;
addEventListener('resize', () => { clearTimeout(skyTimer); skyTimer = setTimeout(drawSky, 200); });

// ---------- the two machines (loads three.js and the two models while the player reads) ----------
let landing = null;
if (!deepLink) {
  import('./ui/landing.js')
    .then((m) => m.createLanding($('landing-3d')))
    .then((l) => {
      landing = l;
      document.body.classList.add('machines-ready');
      $('start').addEventListener('pointerenter', () => landing?.mood('happy', 3));
      $('github').addEventListener('pointerenter', () => landing?.mood('curious', 2));
    })
    .catch((err) => console.warn('landing picture could not start', err));
}

// ---------- loading ----------
const STEP = { code: 'load.code', data: 'load.data', models: 'load.models', textures: 'load.textures', photos: 'load.photos', fonts: 'load.fonts' };
const mb = (b) => (b / 1048576).toFixed(1);
function setProgress(fraction, stepKey, bytesText = '', filesText = '') {
  const pct = Math.max(0, Math.min(100, Math.floor(fraction * 100)));
  document.querySelector('.load-fill').style.width = pct + '%';
  document.querySelector('.load-bar').setAttribute('aria-valuenow', String(pct));
  $('load-pct').textContent = pct + '%';
  $('load-step').textContent = t(stepKey);
  $('load-bytes').textContent = bytesText;
  $('load-files').textContent = filesText;
}

async function load() {
  document.body.classList.add('loading');
  $('loader').classList.remove('hidden');
  document.querySelector('.load-error').classList.add('hidden');
  try {
    // Downloads are 90% of the bar, by bytes. The last 10% is the engine really starting.
    await preloadAll((p) => setProgress((p.loaded / p.total) * 0.9, STEP[p.group] ?? 'load.code', `${mb(p.loaded)} / ${mb(p.total)} MB`, t('load.files', { done: p.done, total: p.count })));
    const engine = { data: 0.92, physics: 0.95, interface: 0.98, ready: 1 };
    // A dropped request should not strand the player: try the engine import a few times.
    let engineModule = null;
    for (let attempt = 0; !engineModule; attempt++) {
      try { engineModule = await import('./main.js'); }
      catch (err) { if (attempt >= 2) throw err; await new Promise((r) => setTimeout(r, 600 * (attempt + 1))); }
    }
    const { startGame } = engineModule;
    await startGame({ onStep: (s) => setProgress(engine[s] ?? 0.9, s === 'ready' ? 'load.ready' : 'load.start') });
    finish();
  } catch (err) {
    console.error(err);
    document.querySelector('.load-error').classList.remove('hidden');
  }
}

function finish() {
  document.body.classList.remove('on-landing', 'loading');
  document.body.classList.add('in-game');
  $('loader').classList.add('fade-out');
  setTimeout(() => {
    $('loader').classList.add('hidden');
    $('landing').remove();
    $('sky').remove();
    landing?.dispose();
    $('landing-3d').remove();
  }, 600);
}

// ---------- a new version on the site ----------
// Every minute the page asks for content/preload.json (its version changes with each deploy). On the
// landing page it simply reloads; during play it offers a Reload button, so nobody loses their place
// without choosing to (progress is saved at each chapter start).
let loadedVersion = null;
const siteVersion = async () => {
  try { return (await (await fetch('content/preload.json', { cache: 'no-store' })).json()).version ?? null; } catch { return null; }
};
siteVersion().then((v) => { loadedVersion = v; });
let updateShown = false;
setInterval(async () => {
  if (document.hidden || !loadedVersion || updateShown || deepLink) return;
  const v = await siteVersion();
  if (!v || v === loadedVersion) return;
  if (document.body.classList.contains('on-landing') && !document.body.classList.contains('loading')) { location.reload(); return; }
  updateShown = true;
  const box = document.createElement('div');
  box.className = 'update-toast';
  box.setAttribute('role', 'status');
  const words = document.createElement('span');
  words.textContent = t('update.ready');
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn-primary';
  btn.textContent = t('update.reload');
  btn.addEventListener('click', () => location.reload());
  btn.addEventListener('keydown', (e) => e.stopPropagation());
  btn.addEventListener('pointerdown', (e) => e.stopPropagation());
  box.append(words, btn);
  document.body.append(box);
}, 60000);

$('load-retry').addEventListener('click', load);
$('start').addEventListener('click', () => {
  $('landing').classList.add('leaving');
  landing?.mood('happy', 10);
  load();
});
if (deepLink) {
  $('landing').classList.add('hidden');
  load();
}
