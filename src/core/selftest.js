// Self-test for Set A (Ziad's tasks). Owner: Set A.
//
// Open  http://localhost:5173/?test&speed=4  and wait. A panel on the right lists every check as it runs,
// with ✅ pass, ❌ fail or ℹ️ information, and a summary at the end. Do not press keys while it runs:
// it drives the game itself by sending key presses, like a player would.
//
// What it checks, by task in TASKS.md:
//   A-1  the physics ground matches heightAt on the Moon and Mars
//   A-2  rover speed builds and fades, it never flips, never falls through, and hops land again
//   A-3  an objective zone fires when the rover drives into it, and its marker goes away
//   A-5  stage.wait timing, fade, lockControls, R restarts the chapter
//   A-11 chapter keys 1-5 and pitch keys 6-9
//   A-4, A-6..A-9, A-15..A-17  a bot plays every chapter to its end without ever using E to skip,
//        and the mission tasks tick off
//   cleanup: no objects left behind after 20 fast chapter jumps; no errors in the console
//
// It does not judge whether the game is fun, how it looks, or the frame rate on your laptop. Those are
// in the hand checklist the team keeps in TESTLOG.md.
import { heightAt } from './terrain.js';

export async function runSelfTest(ctx) {
  // ---------- report panel ----------
  const box = document.createElement('div');
  Object.assign(box.style, {
    position: 'fixed', top: '8px', right: '8px', width: '430px', maxHeight: '92vh', overflow: 'auto',
    background: 'rgba(5,8,14,0.93)', color: '#e8eef4', font: '12px/1.45 monospace', padding: '10px 12px',
    border: '1px solid #345', borderRadius: '6px', zIndex: 50, pointerEvents: 'auto', whiteSpace: 'pre-wrap',
  });
  document.body.appendChild(box);
  const head = document.createElement('div');
  head.style.cssText = 'font-weight:bold;margin-bottom:6px';
  head.textContent = 'Set A self-test: running… do not press keys';
  box.appendChild(head);
  const results = [];
  function report(status, name, detail = '') {
    results.push({ status, name, detail });
    const line = document.createElement('div');
    const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : 'ℹ️';
    line.textContent = `${icon} ${name}${detail ? '\n    ' + detail : ''}`;
    if (status === 'fail') line.style.color = '#ff9b8a';
    box.appendChild(line);
    box.scrollTop = box.scrollHeight;
    console.log(`[self-test] ${icon} ${name} ${detail}`);
  }
  const check = (ok, name, detail) => report(ok ? 'pass' : 'fail', name, detail);

  // ---------- errors seen while testing ----------
  const errors = [];
  const origError = console.error;
  console.error = (...args) => { errors.push(args.map(String).join(' ')); origError.apply(console, args); };
  window.addEventListener('error', (e) => errors.push(String(e.message)));
  window.addEventListener('unhandledrejection', (e) => { if (!e.defaultPrevented && e.reason?.name !== 'Gone') errors.push(String(e.reason)); });

  // ---------- helpers ----------
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const visible = (sel) => { const n = document.querySelector(sel); return !!n && !n.classList.contains('hidden') && n.offsetParent !== null; };
  const objective = () => (visible('.objective') ? document.querySelector('.objective').textContent : '');
  const prompting = () => visible('.dialogue') || visible('.card') || visible('.memory') || visible('.credits') || visible('.roll');
  const held = new Set();
  const send = (type, code) => window.dispatchEvent(new KeyboardEvent(type, { code }));
  const down = (c) => { if (!held.has(c)) { held.add(c); send('keydown', c); } };
  const up = (c) => { if (held.delete(c)) send('keyup', c); };
  const setKeys = (list) => { for (const c of [...held]) if (!list.includes(c)) up(c); for (const c of list) down(c); };
  const tap = async (c) => { send('keydown', c); await sleep(40); send('keyup', c); };
  // Wait until test() is true, at most `seconds` of game time. Returns true if it became true.
  async function until(test, seconds) {
    const end = ctx.clock + seconds;
    while (ctx.clock < end) { if (test()) return true; await sleep(25); }
    return !!test();
  }
  const waitGame = (seconds) => until(() => false, seconds);
  async function go(index, opts) {
    const before = ctx.stage;
    ctx.chapters.go(index, opts);
    await until(() => ctx.stage && ctx.stage !== before, 5);
    return ctx.stage;
  }
  const hero = () => ctx.stage.hero.object;
  function heading() {
    const q = hero().quaternion;
    return Math.atan2(2 * (q.x * q.z + q.w * q.y), 1 - 2 * (q.x * q.x + q.y * q.y));
  }
  function steer(tx, tz, slack = 0.12) {
    const p = hero().position;
    const d = Math.atan2(tx - p.x, tz - p.z) - heading();
    const a = Math.atan2(Math.sin(d), Math.cos(d));
    return a > slack ? ['KeyA'] : a < -slack ? ['KeyD'] : [];
  }
  const beam = () => ctx.scene.children.find((c) => c.userData?.beam);
  const tiltDeg = () => {
    const q = hero().quaternion; // angle between the model's up and the world's up
    const upY = 1 - 2 * (q.x * q.x + q.z * q.z);
    return (Math.acos(Math.max(-1, Math.min(1, upY))) * 180) / Math.PI;
  };
  const skipPrompts = async () => { if (prompting()) { setKeys([]); await tap('Enter'); await sleep(120); return true; } return false; };
  async function waitForControls(seconds = 30) {
    return until(() => { if (prompting()) tap('Enter'); return ctx.stage?.controls; }, seconds);
  }

  async function test(name, fn) {
    try { await fn(); } catch (err) { report('fail', name, 'crashed: ' + (err?.message ?? err)); }
    setKeys([]);
  }

  await sleep(500);
  check(errors.length === 0, 'Boot: the game starts with no errors', errors[0] ?? '');

  // ---------- A-1 ground ----------
  for (const [index, world] of [[1, 'moon'], [2, 'mars']]) {
    await test(`A-1 physics ground matches heightAt (${world})`, async () => {
      await go(index);
      let worst = 0, misses = 0;
      for (let i = 0; i < 80; i++) {
        // Off the 2 m grid lines and cell diagonals: a ray exactly on a triangle edge can slip through
        // (a ray quirk only; objects still rest on those spots, checked separately in Node).
        const x = -150 + ((i * 37) % 300) + 0.62, z = -150 + ((i * 61) % 300) + 1.27;
        const g = ctx.physics.groundRay(x, z);
        if (g === null) { misses++; continue; }
        worst = Math.max(worst, Math.abs(g - heightAt(world, x, z)));
      }
      check(misses === 0 && worst < 0.3, `A-1 physics ground matches heightAt (${world})`,
        `80 points, largest gap ${worst.toFixed(2)} m (limit 0.30)${misses ? `, ${misses} points with no ground` : ''}`);
    });
  }

  // ---------- A-2 rover, A-3 objectives, A-5 helpers (on the Moon) ----------
  await test('A-2 rover', async () => {
    const s = await go(1, { jump: 'selftest' }); // the Moon with no story events
    await waitForControls();
    const top = ctx.tuning.rover.speed;
    await waitGame(0.5);
    // Record the speed on every game tick, so the result does not depend on how fast this test polls.
    const log = [];
    const stopLog = s.every(() => log.push([s.time, s.controller.speed]));
    const at = (t) => (log.find(([time]) => time >= t) ?? log[log.length - 1])[1];

    let t0 = s.time;
    down('KeyW');
    await waitGame(3);
    const early = at(t0 + 0.25), late = at(t0 + 2.75);
    check(early < top * 0.6 && late > top * 0.85, 'A-2 speed builds up (not instant)',
      `after 0.25 s: ${early.toFixed(1)} m/s, after 2.75 s: ${late.toFixed(1)} m/s (top ${top})`);
    t0 = s.time;
    up('KeyW');
    await waitGame(3.5);
    const coasting = at(t0 + 0.3), stopped = at(t0 + 3.3);
    check(coasting > 0.5 && stopped < 0.3, 'A-2 speed fades when W is let go',
      `0.3 s after: ${coasting.toFixed(1)} m/s, 3.3 s after: ${stopped.toFixed(2)} m/s`);
    stopLog();

    // Weave and hop for 12 s: never flips, never sinks into the ground.
    let maxTilt = 0, deepest = 0, hopUp = false, hopDown = false, longest = 0, air = 0;
    const end = ctx.clock + 12;
    let lastHop = 0;
    while (ctx.clock < end) {
      const k = ['KeyW', Math.floor(ctx.clock / 1.5) % 2 ? 'KeyA' : 'KeyD'];
      setKeys(k);
      if (ctx.clock - lastHop > 2 && s.controller.grounded) { tap('Space'); lastHop = ctx.clock; }
      maxTilt = Math.max(maxTilt, tiltDeg());
      const p = hero().position;
      deepest = Math.min(deepest, p.y - s.hero.half[1] - heightAt('moon', p.x, p.z));
      if (!s.controller.grounded) { hopUp = true; air += 0.025 * (ctx.clock > 0 ? 1 : 0); }
      else if (hopUp) { hopDown = true; longest = Math.max(longest, air); air = 0; }
      await sleep(25);
    }
    setKeys([]);
    check(maxTilt < 35, 'A-2 never flips over', `largest tilt ${maxTilt.toFixed(0)}° (limit 35°)`);
    check(deepest > -0.3, 'A-2 never falls through the ground', `lowest point ${deepest.toFixed(2)} m against the ground (limit -0.30)`);
    check(hopUp && hopDown, 'A-2 Space hops: leaves the ground and lands again', hopUp ? '' : 'never left the ground');

    // A-3: a zone ten metres ahead fires when driven into, then its marker goes away.
    const p = hero().position, h = heading();
    const zx = p.x + Math.sin(h) * 10, zz = p.z + Math.cos(h) * 10;
    let fired = false;
    s.goTo(zx, zz, 'Self-test zone', { radius: 3 }).then(() => { fired = true; }).catch(() => {});
    await until(() => { setKeys(['KeyW', ...steer(zx, zz)]); return fired; }, 20);
    setKeys([]);
    check(fired, 'A-3 an objective zone fires when the rover enters it');
    check(fired && !beam(), 'A-3 the zone marker is removed once reached');

    // A-5 helpers.
    const waitStart = s.time;
    await s.wait(1);
    const took = s.time - waitStart;
    check(took > 0.95 && took < 1.25, 'A-5 stage.wait(1) waits one second of game time', `${took.toFixed(2)} s`);
    // The fade is a CSS transition in real time, so wait up to 2 real seconds for it.
    const opacity = () => document.querySelector('.fade') && getComputedStyle(document.querySelector('.fade')).opacity;
    await s.fade(true, 0.2);
    for (let i = 0; i < 40 && opacity() !== '1'; i++) await sleep(50);
    const black = opacity();
    await s.fade(false, 0);
    await sleep(50);
    const clear = opacity();
    check(black === '1' && clear === '0', 'A-5 stage.fade goes to black and back', `black ${black}, clear ${clear}`);
    s.lockControls();
    down('KeyW');
    await waitGame(1);
    const locked = s.controller.speed;
    up('KeyW');
    s.unlockControls();
    check(locked < 0.3, 'A-5 lockControls: W does nothing while locked', `${locked.toFixed(2)} m/s`);

    const before = ctx.stage;
    await tap('KeyR');
    await until(() => ctx.stage !== before, 5);
    await waitGame(0.3);
    const q = hero().position;
    check(ctx.stage !== before && ctx.chapters.index === 1 && Math.hypot(q.x - 7, q.z - 3) < 1.5,
      'A-5 R restarts the chapter from its start', `chapter ${ctx.chapters.index}, rover at ${q.x.toFixed(1)}, ${q.z.toFixed(1)}`);
  });

  // ---------- A-11 keys ----------
  await test('A-11 chapter keys', async () => {
    const names = ['opening', 'moon', 'mars', 'sky', 'epilogue'];
    const bad = [];
    for (let i = 0; i < 5; i++) {
      const before = ctx.stage;
      await tap('Digit' + (i + 1));
      const ok = await until(() => ctx.stage !== before && ctx.chapters.index === i, 5);
      const card = ok && await until(() => visible('.card'), 3);
      if (!ok || !card) bad.push(`${i + 1} (${names[i]})${ok ? ': no title card' : ''}`);
    }
    check(!bad.length, 'A-11 keys 1-5 open each chapter with its title card', bad.length ? 'failed: ' + bad.join(', ') : '');
  });

  await test('A-11 pitch keys 6-9', async () => {
    const press = async (code) => { const b = ctx.stage; await tap(code); await until(() => ctx.stage !== b, 5); return ctx.stage; };
    let s = await press('Digit6');
    await waitForControls(10);
    const p = hero().position;
    check(ctx.chapters.index === 1 && Math.hypot(p.x - 14, p.z - 62) < 8, 'A-11 key 6 jumps to the fender (Moon, after stop 1)', `chapter ${ctx.chapters.index}`);

    s = await press('Digit7');
    const viking = await until(() => { if (prompting()) { skipPrompts(); } return ctx.characters.has('viking'); }, 8);
    check(ctx.chapters.index === 2 && viking, 'A-11 key 7 jumps to the Viking radio call');

    s = await press('Digit8');
    await waitForControls(10);
    down('KeyW');
    const slowing = await until(() => s.controller.speedScale < 0.8, 12);
    up('KeyW');
    check(ctx.chapters.index === 2 && slowing, 'A-11 key 8 jumps to the dust storm (the rover starts slowing)');

    s = await press('Digit9');
    const last = await until(() => objective().startsWith('Last flight'), 8);
    check(ctx.chapters.index === 3 && last, 'A-11 key 9 jumps to flight 72');
  });

  // ---------- cleanup ----------
  await test('Cleanup after fast jumps', async () => {
    await go(4);
    await waitGame(0.5);
    const base = ctx.scene.children.length;
    for (let i = 0; i < 20; i++) { await tap('Digit' + (1 + (i % 5))); await sleep(60); }
    await go(4);
    await waitGame(0.5);
    const after = ctx.scene.children.length;
    check(after === base, 'Nothing is left behind after 20 fast chapter jumps', `objects in the scene: ${base} before, ${after} after`);
  });

  // ---------- every chapter, played to its end by a bot ----------
  const done = () => [...document.querySelectorAll('li')].map((li, i) => (li.classList.contains('done') ? i : -1)).filter((i) => i >= 0);

  const bots = {
    opening() {
      const o = objective();
      if (o.startsWith('W and S')) return ['KeyW'];
      if (o.startsWith('A and D')) return ['KeyA'];
      return [];
    },
    moon() {
      if (objective().startsWith('Stop inside')) return [];
      const b = beam();
      return b ? ['KeyW', ...steer(b.position.x, b.position.z)] : [];
    },
    mars(s, memo) {
      const o = objective();
      if (o.includes('Hold E')) return ['KeyE'];
      // The storm: keep holding W. Nothing tells the player to let go.
      if (s.viking && s.controls) {
        memo.storm = memo.storm ?? ctx.clock;
        if (ctx.clock - memo.storm > 27) memo.stormSpeeds.push(s.controller.speed);
        return ['KeyW'];
      }
      const b = beam();
      return b ? ['KeyW', ...steer(b.position.x, b.position.z)] : [];
    },
    sky(s, memo) {
      const h = s.controller, o = objective(), keys = [];
      const p = h.position;
      if (h.broken) { memo.broken = true; return Math.floor(ctx.clock * 2) % 2 ? ['Space'] : []; }
      const fly = (tx, tz, alt) => {
        const d = Math.hypot(tx - p.x, tz - p.z);
        keys.push(...steer(tx, tz, 0.15));
        if (d > 1.5 && keys.length === 0) keys.push('KeyW');
        else if (d > 4) keys.push('KeyW');
        if (h.altitude < alt) keys.push('Space');
        return keys;
      };
      if (o.startsWith('Hold Space') || o.startsWith('Keep holding')) return ['Space'];
      if (o.startsWith('Hold it') || o.startsWith('Too low') || o.startsWith('Too high')) return h.altitude < 2.9 ? ['Space'] : [];
      if (o.startsWith('Press E')) { memo.e = !memo.e; return [h.altitude < 3.5 ? 'Space' : null, memo.e ? 'KeyE' : null].filter(Boolean); }
      if (o.includes('pad') || o.startsWith('Not on the pad')) {
        const pad = ctx.scene.children.find((c) => c.userData?.pad && c.visible);
        if (!pad) return [];
        const d = Math.hypot(pad.position.x - p.x, pad.position.z - p.z);
        if (d > 2.0) return fly(pad.position.x, pad.position.z, 2.5);
        return [];
      }
      const b = beam();
      if (b) return fly(b.position.x, b.position.z, 4);
      return [];
    },
    epilogue(s) {
      if (!objective().includes('turn back')) return [];
      const d = 2.3 - hero().rotation.y;
      const a = Math.atan2(Math.sin(d), Math.cos(d));
      return a > 0.03 ? ['KeyA'] : a < -0.03 ? ['KeyD'] : [];
    },
  };

  // [index, id, task, game-second limit, how many mission tasks must be ticked, story target in seconds]
  const plays = [
    [0, 'opening', 'A-6 Opening', 200, 2, 45],
    [1, 'moon', 'A-4 + A-15 Moon (Carry the crew)', 600, 3, 180],
    [2, 'mars', 'A-7 + A-16 Mars (Follow the water)', 700, 3, 210],
    [3, 'sky', 'A-8 + A-17 Mars sky (Be the eyes)', 700, 2, 150],
    [4, 'epilogue', 'A-9 Epilogue (Listen)', 300, 2, 75],
  ];
  const timing = [];
  for (const [index, id, name, limit, tasksNeeded, target] of plays) {
    await test(name, async () => {
      const s = await go(index);
      const memo = { stormSpeeds: [] };
      let usedEToFinish = false, ticked = [], finished = false;
      const start = ctx.clock;
      while (ctx.clock - start < limit) {
        if (ctx.chapters.index !== index) { finished = true; break; }
        if (index === 4 && objective().startsWith('The end')) { finished = true; break; }
        const now = done();
        if (now.length >= ticked.length) ticked = now;
        if (await skipPrompts()) continue;
        const keys = ctx.stage === s && s.alive ? bots[id](s, memo) : [];
        // E is only ever pressed when the game itself asks for it.
        if (keys.includes('KeyE') && !/Hold E|Press E/.test(objective())) usedEToFinish = true;
        setKeys(keys);
        await sleep(25);
      }
      setKeys([]);
      const secs = Math.round(ctx.clock - start);
      timing.push(`${id} ${secs} s (story target ${target} s)`);
      check(finished, `${name}: plays to the end`, finished ? `${secs} game seconds` : `stuck after ${secs} s at "${objective()}"`);
      check(!usedEToFinish, `${name}: never needs E to skip`);
      check(ticked.length >= tasksNeeded, `${name}: mission tasks ticked`, `${ticked.length} ticked (need ${tasksNeeded})`);
      if (id === 'moon') check(s.air?.best > 0.5, 'A-15 the air-time record counts jumps', `best ${s.air?.best?.toFixed(1)} s`);
      if (id === 'mars') {
        check(memo.stormSpeeds.length > 0 && Math.min(...memo.stormSpeeds) < 0.3,
          'A-7 the storm stops the rover while W is still held',
          memo.stormSpeeds.length ? `speed at the end: ${Math.min(...memo.stormSpeeds).toFixed(2)} m/s` : 'storm not reached');
        check((s.water ?? 0) === 3, 'A-16 three signs of water found', `${s.water ?? 0} / 3`);
      }
      if (id === 'sky') check(memo.broken, 'A-8 flight 72 ends in the crash, and Space only twitches the rotor');
    });
  }
  report('info', 'Chapter lengths with the bot (the bot is faster than a person, and placeholders are short)', timing.join('\n    '));

  const found = ctx.hud.discoveries?.map((d) => d.id) ?? [];
  report('info', 'Discovery cards shown during the test', `${found.length}: ${found.join(', ')}`);

  check(errors.length === 0, 'No errors in the console during the whole test', errors.slice(0, 3).join(' | '));

  const fails = results.filter((r) => r.status === 'fail').length;
  const passes = results.filter((r) => r.status === 'pass').length;
  head.textContent = fails ? `Set A self-test: ${passes} passed, ${fails} FAILED` : `Set A self-test: all ${passes} checks passed`;
  head.style.color = fails ? '#ff9b8a' : '#9fef9f';
  console.error = origError;
  window.relicaTest = { done: true, passes, fails, results };
}
