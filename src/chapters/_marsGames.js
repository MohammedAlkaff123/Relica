// Mars mini-game (Ziad's choice in the mini-games doc). Owner: Set A. No game can be lost.
//
//   await grindRock(s, ctx)   Opportunity's rock grinder (the RAT). Hold Space to press harder, let go to
//                             ease off. Inside the green band the grinder cuts: dust, then the weathered
//                             crust, then the fresh rock inside. Too hard and it only skids (no harm).
import { gamePanel, say } from './_gameUi.js';

const LAYERS = [
  { en: 'Dust', ar: 'غبار', color: '#c28a5a' },
  { en: 'Weathered crust', ar: 'القشرة المتآكلة', color: '#8f5a3c' },
  { en: 'Fresh rock', ar: 'الصخر من الداخل', color: '#6f6a78' },
];
const SECONDS_PER_LAYER = 2.2; // time inside the green band to cut one layer

export async function grindRock(s, ctx) {
  const ui = gamePanel(s, { title: { en: 'Grind the rock: see what is inside', ar: 'احفر الصخرة: شوف وش داخلها' }, width: 520, height: 260 });
  ui.help({ en: 'Hold Space to press, let go to ease off. Keep the needle in the green.',
    ar: 'اضغط Space مطوّلًا لتزيد الضغط، وفكّه لتخففه. خلّ المؤشر في الأخضر.' });
  const st = { pressure: 0, depth: 0, t: 0, idle: 0, band: 0.18, sparks: [] };
  s.game = {
    id: 'grindRock', ui, state: st,
    botKeys: () => (st.pressure < greenCenter() ? ['Space'] : []),
  };
  // The green band drifts a little so it stays a game, and widens if the player struggles.
  const greenCenter = () => 0.62 + Math.sin(st.t * 0.9) * 0.08;

  const draw = (dt) => {
    const { g, w, h } = ui;
    g.fillStyle = '#0b0a0d'; g.fillRect(0, 0, w, h);
    // the rock, seen from above, with the ground-down circle showing the layer reached
    const layer = Math.min(LAYERS.length - 1, Math.floor(st.depth));
    g.fillStyle = '#b07a52'; g.beginPath(); g.arc(170, 130, 105, 0, Math.PI * 2); g.fill();
    for (let i = 0; i <= layer; i++) {
      g.fillStyle = LAYERS[i].color; g.beginPath(); g.arc(170, 130, 62 - i * 6, 0, Math.PI * 2); g.fill();
    }
    if (st.depth >= LAYERS.length - 0.05) {
      // inside: small spheres and yellowish grains, the signs of water
      g.fillStyle = '#4b5470'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(150 + (i * 23) % 50, 110 + (i * 37) % 45, 4, 0, 7); g.fill(); }
      g.fillStyle = '#d8c25a'; for (let i = 0; i < 7; i++) g.fillRect(140 + (i * 29) % 60, 105 + (i * 17) % 50, 3, 3);
    }
    // grinder head spinning
    g.save(); g.translate(170, 130); g.rotate(st.t * 12 * st.pressure);
    g.strokeStyle = 'rgba(220,220,230,.85)'; g.lineWidth = 3;
    for (let i = 0; i < 3; i++) { g.rotate((Math.PI * 2) / 3); g.beginPath(); g.moveTo(0, 0); g.lineTo(46, 0); g.stroke(); }
    g.restore();
    // sparks when pressing too hard
    st.sparks = st.sparks.filter((p) => (p.life -= dt) > 0);
    g.fillStyle = '#ffd27a';
    for (const p of st.sparks) { p.x += p.vx * dt; p.y += p.vy * dt; g.fillRect(p.x, p.y, 2, 2); }
    // pressure meter
    const mx = 360, my = 30, mh = 200;
    g.fillStyle = '#1d2230'; g.fillRect(mx, my, 34, mh);
    const c = greenCenter();
    g.fillStyle = 'rgba(127,224,138,.55)'; g.fillRect(mx, my + (1 - c - st.band / 2) * mh, 34, st.band * mh);
    g.fillStyle = 'rgba(230,110,90,.45)'; g.fillRect(mx, my, 34, 0.1 * mh);
    g.fillStyle = '#fff'; g.fillRect(mx - 6, my + (1 - st.pressure) * mh - 2, 46, 4);
    // layer list
    g.font = '14px system-ui';
    LAYERS.forEach((l, i) => {
      g.fillStyle = st.depth > i + 0.999 ? '#7fe08a' : i === layer ? '#e3a23c' : 'rgba(255,255,255,.5)';
      g.fillText((st.depth > i + 0.999 ? '✓ ' : '• ') + say(l), 412, 70 + i * 34);
    });
  };

  await s.until((dt) => {
    st.t += dt;
    const pressing = ctx.input.down('Space');
    st.pressure = Math.max(0, Math.min(1, st.pressure + (pressing ? 0.85 : -0.7) * dt));
    const c = greenCenter();
    const inGreen = Math.abs(st.pressure - c) < st.band / 2;
    if (inGreen) { st.depth += dt / SECONDS_PER_LAYER; st.idle = 0; }
    else st.idle += dt;
    if (st.idle > 6) { st.band = Math.min(0.34, st.band + 0.06); st.idle = 0; } // help after a struggle
    if (st.pressure > 0.9) {
      for (let i = 0; i < 3; i++) st.sparks.push({ x: 170 + (Math.random() - 0.5) * 30, y: 130 + (Math.random() - 0.5) * 30, vx: (Math.random() - 0.5) * 200, vy: (Math.random() - 0.5) * 200, life: 0.3 });
    }
    ui.status(st.pressure > 0.9 ? { en: 'Too hard: it skids. Ease off!', ar: 'ضغط قوي: يتزحلق. خفّف!' }
      : inGreen ? { en: 'Grinding…', ar: 'يحفر…' } : st.pressure < c ? { en: 'Press a bit harder', ar: 'اضغط أكثر شوي' } : { en: 'A bit softer', ar: 'أخف شوي' });
    draw(dt);
    return st.depth >= LAYERS.length;
  });
  ui.help({ en: 'Opportunity ground rocks like this to look under the dusty, weathered surface.',
    ar: 'أوبورتيونيتي كانت تحفر الصخور كذا عشان تشوف تحت السطح المغبر المتآكل.' });
  ui.status({ en: 'Fresh rock reached!', ar: 'وصلت للصخر من الداخل!' });
  await s.wait(2.4);
  ui.remove();
}
