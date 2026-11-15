// Moon mini-games (Ziad's choices in the mini-games doc). Owner: Set A. No game can be lost.
//
//   await liftoffCamera(s, ctx, { onLiftoff })   you work the rover's TV camera from Earth: W/S tilt it,
//                                                but each command arrives about 1.3 s late, so you must
//                                                move before the lander does. Stars for time in frame.
//   await fenderRepair(s, ctx)                   put 4 map sheets and 2 clamps on the broken fender.
//                                                A/D pick the spot, Space places the piece; or drag it
//                                                with the mouse. The dust stops as the fender closes.
import { gamePanel, pointerAt, say, starsFor, starText } from './_gameUi.js';

// ---------------------------------------------------------------------------------------------------
// Liftoff camera
const DELAY = 1.3;     // seconds for a command to reach the Moon (light takes about 1.3 s each way)
const ASCENT = 10;     // seconds of the climb the camera follows
const DIST = 60;       // metres from the rover to the lander, for the angle
const CAM_RATE = 16;   // degrees per second the camera tilts
const FRAME = 11;      // degrees from the centre that still count as "in frame"
const elevation = (t) => (t <= 0 ? 0 : (Math.atan2(0.5 * 2.2 * t * t, DIST) * 180) / Math.PI);

export async function liftoffCamera(s, ctx, { onLiftoff } = {}) {
  const ui = gamePanel(s, { title: { en: 'Houston: you run the rover\'s TV camera', ar: 'هيوستن: أنت تشغّل كاميرا العربة' }, width: 520, height: 300 });
  ui.help({ en: 'Hold W to tilt up, S to tilt down. Your command arrives 1.3 seconds late: start early!',
    ar: 'اضغط W للرفع و S للخفض. أمرك يوصل بعد ١٫٣ ثانية: ابدأ قبلها!' });
  const st = { phase: 'countdown', t: -3, cam: 2, inFrame: 0, queue: [], applied: 0 };
  s.game = {
    id: 'liftoffCamera', ui, state: st,
    // A perfect operator aims where the lander will be when the command lands.
    botKeys() {
      const want = elevation(st.t + DELAY + 0.2);
      const willBe = st.cam + st.queue.reduce((a, q) => a + q.dir, 0) * CAM_RATE * 0.025;
      return want > willBe + 1.5 ? ['KeyW'] : want < willBe - 1.5 ? ['KeyS'] : [];
    },
  };
  const draw = () => {
    const { g, w, h } = ui;
    g.fillStyle = '#04060a'; g.fillRect(0, 0, w, h);
    const px = h / 50; // 50 degrees fit the screen height
    const horizon = h / 2 + st.cam * px;
    g.fillStyle = '#3b3b40'; g.fillRect(0, horizon, w, h - horizon);
    g.fillStyle = '#9a9aa3'; for (let i = 0; i < 30; i++) g.fillRect((i * 97) % w, ((i * 53) % 40) + horizon - 2, 2, 2);
    // the lander: descent stage stays, ascent stage climbs
    const ly = h / 2 - (elevation(Math.max(0, st.t)) - st.cam) * px;
    g.fillStyle = '#c9a24a'; g.fillRect(w / 2 - 18, horizon - 16, 36, 14);
    g.fillStyle = '#d7d9de'; g.fillRect(w / 2 - 12, ly - 12, 24, 14);
    if (st.t > 0 && st.t < 3) { g.fillStyle = 'rgba(255,200,120,.7)'; g.fillRect(w / 2 - 4, ly + 2, 8, 10); }
    // camera frame and scanlines
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2;
    g.strokeRect(w / 2 - 60, h / 2 - FRAME * px, 120, FRAME * 2 * px);
    g.fillStyle = 'rgba(255,255,255,.04)'; for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1);
    // commands still on their way
    g.fillStyle = '#e3a23c'; g.font = '13px system-ui';
    g.fillText(st.queue.length ? say({ en: 'command on its way…', ar: 'الأمر في الطريق…' }) : '', 12, 20);
    g.fillStyle = '#fff'; g.font = 'bold 22px system-ui';
    if (st.phase === 'countdown') g.fillText(String(Math.ceil(-st.t)), w / 2 - 6, 40);
  };

  await s.until((dt) => {
    st.t += dt;
    const dir = (ctx.input.down('KeyW', 'ArrowUp') ? 1 : 0) - (ctx.input.down('KeyS', 'ArrowDown') ? 1 : 0);
    st.queue.push({ at: st.t + DELAY, dir });
    while (st.queue.length && st.queue[0].at <= st.t) {
      st.cam = Math.max(-5, Math.min(80, st.cam + st.queue.shift().dir * CAM_RATE * dt));
    }
    if (st.phase === 'countdown' && st.t >= 0) { st.phase = 'ascent'; onLiftoff?.(); }
    if (st.phase === 'ascent' && Math.abs(elevation(st.t) - st.cam) < FRAME) st.inFrame += dt;
    draw();
    return st.t >= ASCENT;
  });
  const stars = starsFor(st.inFrame / ASCENT);
  st.phase = 'result';
  st.stars = stars;
  ui.help({ en: `${starText(stars)}  The lander stayed in your shot for ${st.inFrame.toFixed(0)} of ${ASCENT} seconds.`,
    ar: `${starText(stars)}  بقيت المركبة في لقطتك ${st.inFrame.toFixed(0)} من ${ASCENT} ثوانٍ.` });
  ui.status({ en: 'In 1972 the camera operator in Houston also had to start before the lander moved.',
    ar: 'في ١٩٧٢ كان مشغّل الكاميرا في هيوستن أيضًا يبدأ قبل أن تتحرك المركبة.' });
  await s.wait(3.2);
  ui.remove();
  return stars;
}

// ---------------------------------------------------------------------------------------------------
// Fender repair: a jigsaw. The fender is an arch over a big wheel, cut into 4 map pieces that lock
// together with puzzle tabs, plus a clamp at each end. Each piece is put back where its outline is.
const SLOTS = [
  { kind: 'clamp' },
  { kind: 'map', color: '#9cc8ec' },
  { kind: 'map', color: '#f0d08a' },
  { kind: 'map', color: '#a8dca0' },
  { kind: 'map', color: '#f2a9a0' },
  { kind: 'clamp' },
];
// The order the pieces come in: maps first (any order), then the two clamps.
const PIECES = [3, 1, 4, 2, 0, 5];

// Geometry, in canvas pixels.
const WHEEL = { x: 300, y: 212, r: 66 };
const R1 = 78, R2 = 106, RM = (R1 + R2) / 2; // fender band, inner and outer radius
const A0 = Math.PI * 1.13, A1 = Math.PI * 1.87; // where the maps start and end (over the top)
const CUT = [0, 1, 2, 3, 4].map((k) => A0 + (A1 - A0) * k / 4); // edges between map pieces
const TAB = [0, 1, -1, 1, 0]; // which way each inner edge's puzzle tab points (0 = plain end)
const TRAY = { x: 92, y: 236 };
const polar = (a, r, c = WHEEL) => [c.x + Math.cos(a) * r, c.y + Math.sin(a) * r];

// One radial edge at angle a from radius rFrom to rTo, with a round puzzle tab bulging dir (+1 toward
// larger angles, -1 toward smaller, 0 for none).
function edge(g, a, rFrom, rTo, dir) {
  const [ex, ey] = [Math.cos(a), Math.sin(a)], [tx, ty] = [-Math.sin(a), Math.cos(a)];
  const at = (r, t) => [WHEEL.x + ex * r + tx * t, WHEEL.y + ey * r + ty * t];
  const sgn = rTo > rFrom ? 1 : -1, kr = 7.5;
  g.lineTo(...at(rFrom, 0));
  if (dir) {
    g.lineTo(...at(RM - sgn * kr * 0.7, 0));
    for (let i = 0; i <= 14; i++) {
      const th = -0.25 * Math.PI + (1.5 * Math.PI) * i / 14; // most of a circle: a knob with a neck
      g.lineTo(...at(RM - sgn * Math.cos(th) * kr, dir * (kr * 0.95 + Math.sin(th) * kr)));
    }
    g.lineTo(...at(RM + sgn * kr * 0.7, 0));
  }
  g.lineTo(...at(rTo, 0));
}

// The outline of map piece k (1..4), drawn around the wheel.
function mapPath(g, k) {
  const a = CUT[k - 1], b = CUT[k];
  g.beginPath();
  g.moveTo(...polar(a, R2));
  g.arc(WHEEL.x, WHEEL.y, R2, a, b);
  edge(g, b, R2, R1, TAB[k]);
  g.arc(WHEEL.x, WHEEL.y, R1, b, a, true);
  edge(g, a, R1, R2, TAB[k - 1]);
  g.closePath();
}

// A clamp: a C-shaped grip over one end of the fender.
function clampAt(g, side, alpha = 1, ghost = false) {
  const a = side < 0 ? A0 - 0.05 : A1 + 0.05;
  g.save(); g.translate(...polar(a, RM)); g.rotate(a + Math.PI / 2);
  g.globalAlpha = alpha;
  g.lineWidth = ghost ? 2 : 6; g.strokeStyle = ghost ? 'rgba(255,255,255,.55)' : '#c9ced6';
  if (ghost) g.setLineDash([5, 4]);
  g.beginPath(); g.moveTo(-9, -(RM - R1) - 6); g.lineTo(-9, (R2 - RM) + 6); g.stroke();
  g.beginPath(); g.moveTo(-9, -(RM - R1) - 6); g.lineTo(8, -(RM - R1) - 6); g.moveTo(-9, (R2 - RM) + 6); g.lineTo(8, (R2 - RM) + 6); g.stroke();
  if (!ghost) { g.fillStyle = '#e3a23c'; g.fillRect(4, (R2 - RM) + 2, 10, 9); } // the screw handle
  g.setLineDash([]); g.restore();
}

// Fill a map piece so it looks like a map: paper colour, a grid and contour lines.
function paintMap(g, k, color) {
  mapPath(g, k);
  g.fillStyle = color; g.fill();
  g.save(); g.clip();
  g.strokeStyle = 'rgba(40,50,70,.25)'; g.lineWidth = 1;
  for (let x = 0; x < 600; x += 14) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 300); g.stroke(); }
  for (let y = 0; y < 300; y += 14) { g.beginPath(); g.moveTo(0, y); g.lineTo(600, y); g.stroke(); }
  g.strokeStyle = 'rgba(90,60,30,.45)'; g.lineWidth = 1.5;
  const [cx, cy] = polar((CUT[k - 1] + CUT[k]) / 2, RM);
  for (let r = 6; r < 30; r += 7) { g.beginPath(); g.ellipse(cx + 3, cy - 2, r * 1.3, r, k, 0, Math.PI * 2); g.stroke(); }
  g.restore();
  mapPath(g, k); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 2; g.stroke();
}

// Where a slot sits (for the cursor, mouse drops and flying pieces).
function slotCenter(i) {
  if (i === 0) return polar(A0 - 0.05, RM);
  if (i === 5) return polar(A1 + 0.05, RM);
  return polar((CUT[i - 1] + CUT[i]) / 2, RM);
}

function drawWheel(g, spin) {
  const { x, y, r } = WHEEL;
  g.fillStyle = '#34373e'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); // tyre
  g.strokeStyle = '#6d727b'; g.lineWidth = 4; // chevron treads
  for (let i = 0; i < 18; i++) {
    const a = spin + i * Math.PI * 2 / 18;
    const p = (da, rr) => polar(a + da, rr);
    g.beginPath(); g.moveTo(...p(-0.07, r - 9)); g.lineTo(...p(0.04, r - 2)); g.lineTo(...p(-0.07, r + 0)); g.stroke();
  }
  g.fillStyle = '#8a9099'; g.beginPath(); g.arc(x, y, r - 16, 0, Math.PI * 2); g.fill(); // wire-mesh rim
  g.strokeStyle = 'rgba(40,44,50,.55)'; g.lineWidth = 1;
  for (let i = 0; i < 16; i++) { const a = spin + i * Math.PI / 8; g.beginPath(); g.moveTo(...polar(a, 14)); g.lineTo(...polar(a, r - 16)); g.stroke(); }
  g.fillStyle = '#2a2d33'; g.beginPath(); g.arc(x, y, 14, 0, Math.PI * 2); g.fill(); // hub
  g.fillStyle = '#e3a23c'; g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill();
}

export async function fenderRepair(s, ctx) {
  const ui = gamePanel(s, { title: { en: 'The dust guard broke: make a new one from the route maps', ar: 'واقي الغبار انكسر: اصنع واحدًا جديدًا من خرائط الطريق' },
    intro: { en: 'There are no spare parts on the Moon, so the crew used the maps that show them the way, taped them into a new dust guard and held it on with clamps.',
      ar: 'لا قطع غيار على القمر، فاستعمل الطاقم الخرائط التي يهتدون بها إلى طريقهم، ولصقوها واقيًا جديدًا وثبّتوه بملاقط.' },
    width: 520, height: 300 });
  ui.help({ en: 'A / D: choose the spot. Space: place the piece. Or drag it with the mouse.',
    ar: 'A / D: اختر المكان. Space: ثبّت القطعة. أو اسحبها بالماوس.' });
  const st = { cursor: 2, next: 0, placed: new Set(), misses: 0, wiggle: 0, drag: null, dust: [], fly: null };
  const current = () => PIECES[st.next];
  s.game = {
    id: 'fenderRepair', ui, state: st, tap: true, // its keys are presses, not holds
    botKeys() {
      if (st.next >= PIECES.length) return [];
      if (st.cursor < current()) return ['KeyD'];
      if (st.cursor > current()) return ['KeyA'];
      return ['Space'];
    },
  };
  const tryPlace = (slot) => {
    if (st.next >= PIECES.length || st.fly) return;
    if (slot === current()) {
      st.fly = { slot, t: 0, from: st.drag ? [st.drag.x, st.drag.y] : [TRAY.x, TRAY.y] };
      s.sound('strap', 'land');
    } else {
      st.misses++; st.wiggle = 0.35; // the piece does not fit there; try another spot
    }
  };

  // Mouse: drag the waiting piece from the tray onto its outline on the fender.
  const down = (e) => {
    const p = pointerAt(ui.canvas, e);
    if (Math.hypot(p.x - TRAY.x, p.y - TRAY.y) < 50) { st.drag = p; ui.canvas.setPointerCapture?.(e.pointerId); }
  };
  const move = (e) => { if (st.drag) st.drag = pointerAt(ui.canvas, e); };
  const up = (e) => {
    if (!st.drag) return;
    const p = pointerAt(ui.canvas, e);
    let best = -1, bestD = 46;
    SLOTS.forEach((_, i) => { const [x, y] = slotCenter(i); const d = Math.hypot(p.x - x, p.y - y); if (d < bestD) { best = i; bestD = d; } });
    if (best >= 0) { st.cursor = best; tryPlace(best); }
    st.drag = null;
  };
  ui.canvas.addEventListener('pointerdown', down);
  ui.canvas.addEventListener('pointermove', move);
  ui.canvas.addEventListener('pointerup', up);

  // Draw piece i with its middle at (x, y) instead of on the fender.
  const pieceAt = (i, x, y, scale = 1) => {
    const [cx, cy] = slotCenter(i);
    g.save(); g.translate(x, y); g.scale(scale, scale); g.translate(-cx, -cy);
    if (SLOTS[i].kind === 'map') paintMap(g, i, SLOTS[i].color); else clampAt(g, i === 0 ? -1 : 1);
    g.restore();
  };
  const g = ui.g;
  let spin = 0, done = 0;

  const draw = (dt) => {
    const { w, h } = ui;
    g.fillStyle = '#0a0d14'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#20232b'; g.fillRect(0, WHEEL.y + WHEEL.r, w, h); // the ground
    const open = 1 - st.placed.size / SLOTS.length;
    spin += dt * (0.6 + 2.4 * open);
    drawWheel(g, spin);
    // Dust sprays up out of every gap that has no map yet.
    for (let i = 1; i <= 4; i++) {
      if (st.placed.has(i) || Math.random() > 0.8) continue;
      const a = (CUT[i - 1] + CUT[i]) / 2 + (Math.random() - 0.5) * 0.3, [x, y] = polar(a, R1);
      st.dust.push({ x, y, vx: Math.cos(a) * 120 + (Math.random() - 0.5) * 60, vy: Math.sin(a) * 120, life: 0.9 });
    }
    g.fillStyle = 'rgba(190,185,175,.65)';
    st.dust = st.dust.filter((d) => (d.life -= dt) > 0);
    for (const d of st.dust) { d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 60 * dt; g.fillRect(d.x, d.y, 3, 3); }
    // The puzzle board: dashed outlines where pieces go, the pieces already in, the cursor.
    const hint = st.misses >= 3 && st.next < PIECES.length ? current() : -1;
    SLOTS.forEach((sl, i) => {
      if (st.placed.has(i)) return;
      const lit = i === hint ? '#7fe08a' : i === st.cursor ? '#e3a23c' : null;
      if (sl.kind === 'map') {
        mapPath(g, i);
        g.fillStyle = lit ? (lit === '#7fe08a' ? 'rgba(127,224,138,.18)' : 'rgba(227,162,60,.18)') : 'rgba(255,255,255,.04)'; g.fill();
        g.setLineDash([6, 5]); g.strokeStyle = lit || 'rgba(255,255,255,.5)'; g.lineWidth = lit ? 3 : 1.6; g.stroke(); g.setLineDash([]);
      } else {
        clampAt(g, i === 0 ? -1 : 1, 1, true);
        if (lit) { const [x, y] = slotCenter(i); g.strokeStyle = lit; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 24, 0, Math.PI * 2); g.stroke(); }
      }
    });
    for (const i of st.placed) if (SLOTS[i].kind === 'map') paintMap(g, i, SLOTS[i].color);
    for (const i of st.placed) if (SLOTS[i].kind === 'clamp') clampAt(g, i === 0 ? -1 : 1);
    // All in: the fender shines for a moment.
    if (st.placed.size === SLOTS.length) {
      done += dt;
      g.save(); g.globalAlpha = Math.max(0, 0.6 - done * 0.5); g.strokeStyle = '#fff2c4'; g.lineWidth = 8;
      g.beginPath(); g.arc(WHEEL.x, WHEEL.y, R2 + 4, A0 - 0.1, A1 + 0.1); g.stroke(); g.restore();
    }
    // A piece flying into place.
    if (st.fly) {
      st.fly.t = Math.min(1, st.fly.t + dt / 0.28);
      const [tx, ty] = slotCenter(st.fly.slot), u = 1 - (1 - st.fly.t) ** 3;
      pieceAt(st.fly.slot, st.fly.from[0] + (tx - st.fly.from[0]) * u, st.fly.from[1] + (ty - st.fly.from[1]) * u);
      if (st.fly.t >= 1) { st.placed.add(st.fly.slot); st.next++; st.fly = null; }
    }
    // The tray: the piece in your hands.
    g.fillStyle = 'rgba(255,255,255,.06)'; g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 1.5;
    g.beginPath(); g.roundRect?.(TRAY.x - 70, TRAY.y - 48, 140, 96, 10); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '600 12px system-ui, sans-serif'; g.textAlign = 'center';
    g.fillText(say({ en: 'in your hands', ar: 'في يدك' }), TRAY.x, TRAY.y - 54); g.textAlign = 'start';
    if (st.next < PIECES.length && !st.fly) {
      st.wiggle = Math.max(0, st.wiggle - dt);
      const shake = Math.sin(st.wiggle * 40) * 8 * (st.wiggle > 0);
      const x = (st.drag?.x ?? TRAY.x) + shake, y = st.drag?.y ?? TRAY.y;
      pieceAt(current(), x, y, st.drag ? 1 : 1.15);
    }
  };

  await s.until((dt) => {
    if (ctx.input.pressed('KeyA', 'ArrowLeft')) st.cursor = Math.max(0, st.cursor - 1);
    if (ctx.input.pressed('KeyD', 'ArrowRight')) st.cursor = Math.min(SLOTS.length - 1, st.cursor + 1);
    if (ctx.input.pressed('Space')) tryPlace(st.cursor);
    const kind = st.next < PIECES.length ? SLOTS[current()].kind : null;
    ui.status(kind === 'clamp' ? { en: 'Now a clamp at each end to hold the maps on', ar: 'الحين ملقط على كل طرف يثبّت الخرائط' }
      : kind === 'map' ? { en: `Map piece ${st.next + 1} of 4: put it where its shape fits`, ar: `قطعة خريطة ${st.next + 1} من ٤: حطها في المكان اللي يناسب شكلها` }
      : { en: 'Fixed!', ar: 'تصلّح!' });
    draw(dt);
    return st.next >= PIECES.length;
  });
  st.cursor = -1;
  ui.status({ en: 'Fixed! No more dust.', ar: 'تصلّح! خلاص ما فيه غبار.' });
  const shine = s.every((dt) => draw(dt)); // keep the wheel turning and the fender shining
  s.onDispose(shine);
  ui.help({ en: 'Apollo 17\'s crew really fixed it this way: 4 laminated maps and 2 clamps.',
    ar: 'طاقم أبولو 17 صلّحه فعلًا بهالطريقة: ٤ خرائط مغلّفة وملقطين.' });
  await s.wait(2.5);
  shine();
  ui.canvas.removeEventListener('pointerdown', down);
  ui.canvas.removeEventListener('pointermove', move);
  ui.canvas.removeEventListener('pointerup', up);
  ui.remove();
}
