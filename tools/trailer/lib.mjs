// Frame-by-frame capture of the game for the trailer. Owner: Set B (Abdulkarim), for TRAILER_HANDOFF.md.
//
// The game normally runs on the real clock, so a slow machine gives a jerky recording. Here the page
// is given its own clock: every captured frame moves game time on by exactly 1/30 s, however long
// the picture took to draw. The result is smooth 30 fps footage on any machine.
//
// Uses the Chrome already installed on this computer (puppeteer-core downloads no browser).
// The game must be running:  python serve.py   (http://localhost:5173)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const OUT = path.join(HERE, 'out');
export const BASE = process.env.RELICA_URL ?? 'http://localhost:5173';
export const FPS = 30, WIDTH = 1920, HEIGHT = 1080;

const CHROME = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].find((p) => p && fs.existsSync(p));

// Runs in the page before any of its own scripts: the page's clock now only moves when we say so.
function virtualClock() {
  let now = 0, nextId = 1, frames = [], timers = [];
  const start = Date.now();
  performance.now = () => now;
  Date.now = () => start + now;
  window.requestAnimationFrame = (fn) => { const id = nextId++; frames.push([id, fn]); return id; };
  window.cancelAnimationFrame = (id) => { frames = frames.filter((f) => f[0] !== id); };
  const add = (fn, ms, every, args) => { const id = nextId++; timers.push({ id, at: now + Math.max(0, ms || 0), fn, every, args }); return id; };
  window.setTimeout = (fn, ms, ...args) => add(fn, ms, 0, args);
  window.setInterval = (fn, ms, ...args) => add(fn, ms, Math.max(1, ms || 1), args);
  window.clearTimeout = window.clearInterval = (id) => { timers = timers.filter((t) => t.id !== id); };
  // Move the clock on by `ms`, run the timers that came due, then draw one frame.
  window.__advance = (ms) => {
    const end = now + ms;
    for (let guard = 0; guard < 500; guard++) {
      const due = timers.filter((t) => t.at <= end).sort((a, b) => a.at - b.at)[0];
      if (!due) break;
      now = Math.max(now, due.at);
      if (due.every) due.at += due.every; else timers = timers.filter((t) => t !== due);
      try { typeof due.fn === 'function' && due.fn(...due.args); } catch (err) { console.error(err); }
    }
    now = end;
    const run = frames; frames = [];
    for (const [, fn] of run) { try { fn(now); } catch (err) { console.error(err); } }
    return now;
  };
}

export async function launch({ headless = true } = {}) {
  if (!CHROME) throw new Error('Chrome not found. Set CHROME_PATH to chrome.exe.');
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: headless ? 'new' : false,
    defaultViewport: { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 },
    args: [`--window-size=${WIDTH},${HEIGHT}`, '--hide-scrollbars', '--mute-audio', '--force-device-scale-factor=1',
      '--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-webgpu', '--autoplay-policy=no-user-gesture-required',
      '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'],
  });
  return browser;
}

// Opens the game at `query` (for example '?chapter=moon&lang=ar&mute') with the page clock under our control.
export async function openGame(browser, query, { log = false } = {}) {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(virtualClock);
  // No interface animation runs on the real clock while we step frames: make them instant.
  await page.evaluateOnNewDocument(() => {
    addEventListener('DOMContentLoaded', () => {
      const s = document.createElement('style');
      s.id = 'trailer-capture';
      s.textContent = '*,*::before,*::after{transition-duration:0s!important;transition-delay:0s!important;animation-duration:0.001s!important;animation-delay:0s!important;caret-color:transparent!important}';
      document.head.appendChild(s);
    });
  });
  page.on('pageerror', (err) => console.warn('  page error:', err.message));
  if (log) page.on('console', (m) => console.log('  page:', m.text()));
  await page.goto(BASE + '/' + query, { waitUntil: 'domcontentloaded' });
  return page;
}

// Step game frames (not saved) until `test` is true in the page. Real waits in between let files load.
export async function until(page, test, { max = 3000, label = '' } = {}) {
  for (let i = 0; i < max; i++) {
    await page.evaluate((ms) => window.__advance(ms), 1000 / FPS);
    if (await page.evaluate(test)) return i;
    if (i % 4 === 0) await new Promise((r) => setTimeout(r, 15));
  }
  throw new Error('timed out waiting for ' + (label || test.toString().slice(0, 80)));
}

// Step `n` frames without saving them.
export async function skip(page, n) {
  for (let i = 0; i < n; i++) await page.evaluate((ms) => window.__advance(ms), 1000 / FPS);
}

// Record `n` frames into out/<name>/0001.jpg ... `each(i)` runs before frame i (hold keys, move things).
export async function record(page, name, n, { each = null, quality = 95, from = 1 } = {}) {
  const dir = path.join(OUT, name);
  fs.mkdirSync(dir, { recursive: true });
  if (from === 1) for (const f of fs.readdirSync(dir)) if (f.endsWith('.jpg')) fs.unlinkSync(path.join(dir, f));
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    if (each) await each(i);
    await page.evaluate((ms) => window.__advance(ms), 1000 / FPS);
    await page.screenshot({ path: path.join(dir, String(from + i).padStart(4, '0') + '.jpg'), type: 'jpeg', quality, optimizeForSpeed: true });
  }
  console.log(`  ${name}: ${n} frames (${(n / FPS).toFixed(1)} s of film) in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  return dir;
}

// The game is "ready" when a chapter is on stage and its hero's model has loaded.
export const stageReady = () => !!(window.relica?.stage?.alive && window.relica.stage.hero);

// Hide parts of the interface for a clean shot. Names: 'all' (everything over the 3D picture),
// 'hud' (top panels and mission list), 'fade' (the black fade layer).
export async function hide(page, ...what) {
  await page.evaluate((list) => {
    let s = document.getElementById('trailer-hide');
    if (!s) { s = document.createElement('style'); s.id = 'trailer-hide'; document.head.appendChild(s); }
    const css = [];
    if (list.includes('all')) css.push('#ui,#shell,.fade{display:none!important}');
    if (list.includes('hud')) css.push('.hud,.mission,.discovery,.navigation,.objective,.pause-button,#shell{visibility:hidden!important}');
    if (list.includes('fade')) css.push('.fade{display:none!important}');
    s.textContent = css.join('\n');
  }, what);
}
