// Ingenuity mini-games (Ziad's choices in the mini-games doc). Owner: Set A. No game can be lost.
//
//   await wrightFabric(s, ctx)   before the first flight: hold E to attach a small piece of fabric from the
//                                Wright brothers' first aeroplane (Ingenuity really carried one).
//   await rotorSpinUp(s, ctx)    Mars air is very thin, so the blades must spin very fast. Hold Space to
//                                spin up, let go to slow down; keep the gauge in the green to be ready.
import { gamePanel, say } from './_gameUi.js';

// ---------------------------------------------------------------------------------------------------
export async function wrightFabric(s, ctx) {
  const ui = gamePanel(s, { title: { en: 'A piece of history comes along', ar: 'قطعة من التاريخ ترافقك' }, width: 420, height: 200 });
  const st = { attached: 0 };
  s.game = { id: 'wrightFabric', ui, state: st, botKeys: () => ['KeyE'] };
  const draw = () => {
    const { g, w, h } = ui;
    g.fillStyle = '#0a0d14'; g.fillRect(0, 0, w, h);
    // Ingenuity seen from below: body, legs, the solar panel on top drawn as a bar
    g.fillStyle = '#cfd3da'; g.fillRect(w / 2 - 40, 60, 80, 50);
    g.strokeStyle = '#8b8e95'; g.lineWidth = 3;
    for (const dx of [-36, 36]) { g.beginPath(); g.moveTo(w / 2 + dx, 110); g.lineTo(w / 2 + dx * 1.7, 160); g.stroke(); }
    g.fillStyle = '#2c3e66'; g.fillRect(w / 2 - 70, 40, 140, 14);
    // the spot under the panel, and the fabric sliding into it as E is held
    const fx = w / 2 - 14, fy = 62;
    g.setLineDash([4, 3]); g.strokeStyle = '#e3a23c'; g.strokeRect(fx, fy, 28, 16); g.setLineDash([]);
    const k = Math.min(1, st.attached);
    g.fillStyle = '#d8c7a0'; g.fillRect(fx + (1 - k) * 120, fy + (1 - k) * 90, 28, 16);
  };
  const holding = s.hold('KeyE', 1.2, say({ en: 'Hold E: attach the fabric', ar: 'اضغط E مطوّلًا: ثبّت القماش' }));
  ui.help({ en: 'Hold E to attach the fabric under the solar panel.', ar: 'اضغط E مطوّلًا لتثبيت القماش تحت اللوح الشمسي.' });
  let done = false;
  holding.then(() => { done = true; }, () => {});
  await s.until((dt) => {
    if (ctx.input.down('KeyE')) st.attached += dt / 1.2;
    draw();
    return done;
  });
  st.attached = 1; draw();
  ui.help({ en: 'Ingenuity carried a small piece of the Wright brothers\' 1903 Flyer: the first flight on Earth went along on the first flight on another planet.',
    ar: 'حمل إنجنيوتي قطعة صغيرة من طائرة الأخوين رايت (١٩٠٣): أول طيران على الأرض رافق أول طيران على كوكب آخر.' });
  await s.wait(3.5);
  ui.remove();
}

// ---------------------------------------------------------------------------------------------------
const MAX_RPM = 3000;
const GREEN = [2350, 2750];
const READY_SECONDS = 1.5;

export async function rotorSpinUp(s, ctx) {
  const ui = gamePanel(s, { title: { en: 'Spin up the rotor: Mars air is very thin', ar: 'دوّر المروحة: هواء المريخ خفيف جدًا' }, width: 420, height: 230 });
  ui.help({ en: 'Hold Space to spin faster, let go to slow down. Keep the needle in the green.',
    ar: 'اضغط Space مطوّلًا لتسرّع، وفكّه لتبطّئ. خلّ المؤشر في الأخضر.' });
  const st = { rpm: 0, ready: 0 };
  s.game = { id: 'rotorSpinUp', ui, state: st, botKeys: () => (st.rpm < 2560 ? ['Space'] : []) };
  const draw = () => {
    const { g, w } = ui;
    g.fillStyle = '#0a0d14'; g.fillRect(0, 0, w, ui.h);
    const cx = w / 2, cy = 170, r = 120;
    const at = (rpm) => Math.PI + (rpm / MAX_RPM) * Math.PI; // left (0) to right (max) over the top
    const arc = (a, b, color) => { g.strokeStyle = color; g.lineWidth = 16; g.beginPath(); g.arc(cx, cy, r, at(a), at(b)); g.stroke(); };
    arc(0, GREEN[0], '#2a3142'); arc(GREEN[0], GREEN[1], '#4fbf63'); arc(GREEN[1], 2900, '#2a3142'); arc(2900, MAX_RPM, '#c0574a');
    const a = at(st.rpm);
    g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * (r - 12), cy + Math.sin(a) * (r - 12)); g.stroke();
    g.fillStyle = '#fff'; g.font = 'bold 24px system-ui'; g.textAlign = 'center';
    g.fillText(`${Math.round(st.rpm).toLocaleString('en')} RPM`, cx, cy - 30);
    g.font = '13px system-ui'; g.fillStyle = '#9aa3b2';
    g.fillText(say({ en: 'ready', ar: 'جاهز' }) + ` ${Math.round((st.ready / READY_SECONDS) * 100)}%`, cx, cy + 22);
    g.textAlign = 'start';
  };
  await s.until((dt) => {
    const spinning = ctx.input.down('Space');
    st.rpm = Math.max(0, Math.min(MAX_RPM, st.rpm + (spinning ? 1100 : -800) * dt));
    const inGreen = st.rpm >= GREEN[0] && st.rpm <= GREEN[1];
    st.ready = inGreen ? st.ready + dt : Math.max(0, st.ready - dt * 0.5);
    s.hero.rotorSpeed = (st.rpm / MAX_RPM) * 40; // the real blades spin with the gauge
    ui.status(st.rpm > 2900 ? { en: 'Too fast! Let go a little', ar: 'سريع زيادة! فكّ شوي' }
      : inGreen ? { en: 'Hold it there…', ar: 'خلّه كذا…' } : { en: 'Faster…', ar: 'أسرع…' });
    draw();
    return st.ready >= READY_SECONDS;
  });
  ui.help({ en: 'Mars air is about 1% as thick as Earth\'s, so Ingenuity\'s blades spun around 2,400 times a minute.',
    ar: 'هواء المريخ أخف من هواء الأرض بحوالي ١٠٠ مرة، فكانت مراوح إنجنيوتي تدور حوالي ٢٤٠٠ دورة في الدقيقة.' });
  ui.status({ en: 'Ready to fly!', ar: 'جاهز للطيران!' });
  await s.wait(2.2);
  ui.remove();
}
