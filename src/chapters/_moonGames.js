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
// Fender repair
const SLOTS = [
  { kind: 'clamp', x: 0.16, label: '⟦' },
  { kind: 'map', shape: 'circle', x: 0.3, color: '#7fb7e6' },
  { kind: 'map', shape: 'triangle', x: 0.43, color: '#e6c27f' },
  { kind: 'map', shape: 'square', x: 0.57, color: '#9fd49a' },
  { kind: 'map', shape: 'diamond', x: 0.7, color: '#e69a9a' },
  { kind: 'clamp', x: 0.84, label: '⟧' },
];
// The order the pieces come in: maps first (any order), then the two clamps.
const PIECES = [3, 1, 4, 2, 0, 5];

function drawShape(g, shape, x, y, r, fill) {
  g.fillStyle = fill; g.beginPath();
  if (shape === 'circle') g.arc(x, y, r, 0, Math.PI * 2);
  else if (shape === 'triangle') { g.moveTo(x, y - r); g.lineTo(x + r, y + r * 0.8); g.lineTo(x - r, y + r * 0.8); g.closePath(); }
  else if (shape === 'square') g.rect(x - r * 0.85, y - r * 0.85, r * 1.7, r * 1.7);
  else if (shape === 'diamond') { g.moveTo(x, y - r); g.lineTo(x + r, y); g.lineTo(x, y + r); g.lineTo(x - r, y); g.closePath(); }
  g.fill();
}

export async function fenderRepair(s, ctx) {
  const ui = gamePanel(s, { title: { en: 'The fender broke: make a new one out of maps', ar: 'الرفرف انكسر: سوّ له رفرف جديد من الخرائط' },
    intro: { en: 'There are no spare parts on the Moon, so the crew taped four laminated maps into a new fender and held it on with clamps.',
      ar: 'ما فيه قطع غيار على القمر، فالطاقم لصق ٤ خرائط مغلّفة وسوّى منها رفرف جديد، وثبّتوه بملاقط.' },
    width: 520, height: 300 });
  ui.help({ en: 'A / D: choose the spot. Space: place the piece. Or drag it with the mouse.',
    ar: 'A / D: اختر المكان. Space: ثبّت القطعة. أو اسحبها بالماوس.' });
  const st = { cursor: 2, next: 0, placed: new Set(), misses: 0, wiggle: 0, drag: null, dust: [] };
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
  const slotX = (i) => SLOTS[i].x * ui.w;
  const ARC_Y = 110;

  const tryPlace = (slot) => {
    if (st.next >= PIECES.length) return;
    if (slot === current()) {
      st.placed.add(slot); st.next++;
      s.sound('strap', 'land');
    } else {
      st.misses++; st.wiggle = 0.35; // the piece does not fit there; try another spot
    }
  };

  // Mouse: drag the waiting piece onto a spot on the fender.
  const down = (e) => {
    const p = pointerAt(ui.canvas, e);
    if (Math.hypot(p.x - ui.w / 2, p.y - 250) < 34) { st.drag = p; ui.canvas.setPointerCapture?.(e.pointerId); }
  };
  const move = (e) => { if (st.drag) st.drag = pointerAt(ui.canvas, e); };
  const up = (e) => {
    if (!st.drag) return;
    const p = pointerAt(ui.canvas, e);
    st.drag = null;
    const near = SLOTS.findIndex((_, i) => Math.hypot(p.x - slotX(i), p.y - ARC_Y) < 36);
    if (near >= 0) { st.cursor = near; tryPlace(near); }
  };
  ui.canvas.addEventListener('pointerdown', down);
  ui.canvas.addEventListener('pointermove', move);
  ui.canvas.addEventListener('pointerup', up);

  const draw = (dt) => {
    const { g, w, h } = ui;
    g.fillStyle = '#0a0d14'; g.fillRect(0, 0, w, h);
    // wheel
    g.fillStyle = '#55585e'; g.beginPath(); g.arc(w / 2, 190, 62, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2c2f35'; g.beginPath(); g.arc(w / 2, 190, 24, 0, Math.PI * 2); g.fill();
    // dust from the wheel: less with every piece in place
    const open = 1 - st.placed.size / SLOTS.length;
    for (let i = 0; i < 3 * open; i++) st.dust.push({ x: w / 2 + (Math.random() - 0.5) * 60, y: 135, vx: (Math.random() - 0.5) * 90, vy: -60 - Math.random() * 80, life: 1 });
    g.fillStyle = 'rgba(170,170,170,.6)';
    st.dust = st.dust.filter((d) => (d.life -= dt) > 0);
    for (const d of st.dust) { d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 120 * dt; g.fillRect(d.x, d.y, 3, 3); }
    // the fender: spots as outlines, placed pieces filled in
    g.strokeStyle = '#8b8e95'; g.lineWidth = 3; g.beginPath(); g.arc(w / 2, 190, 100, Math.PI * 1.12, Math.PI * 1.88); g.stroke();
    SLOTS.forEach((sl, i) => {
      const x = slotX(i);
      const hint = st.misses >= 3 && i === current();
      g.strokeStyle = hint ? '#7fe08a' : i === st.cursor ? '#e3a23c' : 'rgba(255,255,255,.35)';
      g.lineWidth = i === st.cursor || hint ? 3 : 1.5;
      g.strokeRect(x - 26, ARC_Y - 26, 52, 52);
      if (st.placed.has(i)) {
        if (sl.kind === 'map') drawShape(g, sl.shape, x, ARC_Y, 20, sl.color);
        else { g.fillStyle = '#c8ccd2'; g.font = 'bold 34px system-ui'; g.fillText(sl.label, x - 9, ARC_Y + 12); }
      } else if (sl.kind === 'map') {
        g.globalAlpha = 0.28; drawShape(g, sl.shape, x, ARC_Y, 18, sl.color); g.globalAlpha = 1;
      } else { g.fillStyle = 'rgba(200,204,210,.3)'; g.font = 'bold 30px system-ui'; g.fillText(sl.label, x - 8, ARC_Y + 10); }
    });
    // the piece waiting in your hands
    if (st.next < PIECES.length) {
      const sl = SLOTS[current()];
      st.wiggle = Math.max(0, st.wiggle - dt);
      const px = (st.drag?.x ?? w / 2) + Math.sin(st.wiggle * 40) * 8 * (st.wiggle > 0);
      const py = st.drag?.y ?? 250;
      g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(px - 32, py - 28, 64, 56);
      if (sl.kind === 'map') drawShape(g, sl.shape, px, py, 20, sl.color);
      else { g.fillStyle = '#c8ccd2'; g.font = 'bold 34px system-ui'; g.fillText(sl.label, px - 9, py + 12); }
    }
  };

  await s.until((dt) => {
    if (ctx.input.pressed('KeyA', 'ArrowLeft')) st.cursor = Math.max(0, st.cursor - 1);
    if (ctx.input.pressed('KeyD', 'ArrowRight')) st.cursor = Math.min(SLOTS.length - 1, st.cursor + 1);
    if (ctx.input.pressed('Space')) tryPlace(st.cursor);
    const kind = st.next < PIECES.length ? SLOTS[current()].kind : null;
    ui.status(kind === 'clamp' ? { en: 'Now a clamp to hold the maps in place', ar: 'الحين ملقط يثبّت الخرائط' }
      : kind === 'map' ? { en: `Map sheet ${st.next + 1} of 4: find the spot with its shape`, ar: `ورقة خريطة ${st.next + 1} من ٤: لاقِ مكان شكلها` }
      : { en: 'Fixed!', ar: 'تصلّح!' });
    draw(dt);
    return st.next >= PIECES.length;
  });
  ui.help({ en: 'Apollo 17\'s crew really fixed it this way: 4 laminated maps and 2 clamps.',
    ar: 'طاقم أبولو 17 صلّحه فعلًا بهالطريقة: ٤ خرائط مغلّفة وملقطين.' });
  await s.wait(2.5);
  ui.canvas.removeEventListener('pointerdown', down);
  ui.canvas.removeEventListener('pointermove', move);
  ui.canvas.removeEventListener('pointerup', up);
  ui.remove();
}
