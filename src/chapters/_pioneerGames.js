// Pioneer 10 mini-games (Ziad's choices in the mini-games doc). Owner: Set A. No game can be lost.
//
//   await spinScan(s, ctx, { onRow })   Pioneer spun as it flew, and built its pictures one line per turn.
//                                       A needle goes round the dial: press Space when it passes Jupiter.
//                                       Each good press adds one row to the picture (onRow(rows, total)).
//   await slowMessage(s, ctx)           the picture travels home while the years pass: the further Pioneer
//                                       goes, the longer the signal takes, until it fades (2003).
import { gamePanel, say } from './_gameUi.js';

const ROWS = 8;
const TURN = Math.PI;      // radians per second: one turn every 2 seconds
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export async function spinScan(s, ctx, { onRow } = {}) {
  const ui = gamePanel(s, { title: { en: 'Build the picture one line per turn', ar: 'ابنِ الصورة سطرًا مع كل دورة' }, width: 420, height: 210, place: 'low' });
  ui.help({ en: 'Press Space when the needle passes Jupiter.', ar: 'اضغط Space لما يمر المؤشر على المشتري.' });
  const st = { angle: -Math.PI / 2, rows: 0, misses: 0, window: 0.32, flash: 0, shake: 0 };
  s.game = {
    id: 'spinScan', ui, state: st, tap: true,
    botKeys: () => (Math.abs(wrap(st.angle)) < st.window * 0.6 ? ['Space'] : []),
  };
  const draw = (dt) => {
    const { g, w } = ui;
    g.fillStyle = '#05070c'; g.fillRect(0, 0, w, ui.h);
    const cx = 120 + Math.sin(st.shake * 50) * 4 * (st.shake > 0), cy = 105, r = 78;
    // the turn: Jupiter's window at the top, the needle going round
    g.strokeStyle = '#2a3142'; g.lineWidth = 10; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = 'rgba(227,162,60,.9)'; g.beginPath(); g.arc(cx, cy, r, -Math.PI / 2 - st.window, -Math.PI / 2 + st.window); g.stroke();
    g.fillStyle = '#d9b38a'; g.beginPath(); g.arc(cx, cy - r, 11, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#a7795a'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - 10, cy - r - 3); g.lineTo(cx + 10, cy - r - 3); g.stroke();
    const a = st.angle - Math.PI / 2;
    g.strokeStyle = st.flash > 0 ? '#7fe08a' : '#fff'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * (r - 6), cy + Math.sin(a) * (r - 6)); g.stroke();
    // the picture so far: one band per row
    const bands = ['#d9c3a6', '#b59b7f', '#e4cfad', '#c99b73', '#ead5b6', '#b58261', '#e4c6a0', '#b48b70'];
    for (let i = 0; i < ROWS; i++) {
      g.fillStyle = i < st.rows ? bands[i] : '#141925';
      g.fillRect(250, 30 + i * 18, 140, 16);
    }
    g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 1; g.strokeRect(250, 30, 140, ROWS * 18 - 2);
    st.flash = Math.max(0, st.flash - dt); st.shake = Math.max(0, st.shake - dt);
  };
  await s.until((dt) => {
    st.angle = wrap(st.angle + TURN * dt);
    if (ctx.input.pressed('Space')) {
      if (Math.abs(wrap(st.angle)) < st.window) {
        st.rows++; st.flash = 0.25; s.sound('tick');
        onRow?.(st.rows, ROWS);
      } else {
        st.misses++; st.shake = 0.3;
        if (st.misses % 3 === 0) st.window = Math.min(0.75, st.window + 0.15); // easier after a few misses
      }
    }
    ui.status({ en: `Lines ${st.rows} / ${ROWS}`, ar: `الأسطر ${st.rows} / ${ROWS}` });
    draw(dt);
    return st.rows >= ROWS;
  });
  ui.help({ en: 'Pioneer 10 spun as it flew and built its Jupiter pictures line by line, one line each turn.',
    ar: 'بايونير 10 كان يدور وهو يطير، وبنى صور المشتري سطرًا بسطر مع كل دورة.' });
  ui.status('');
  await s.wait(2.6);
  ui.remove();
}

// ---------------------------------------------------------------------------------------------------
// Light needs about 8.3 minutes per astronomical unit (AU, the Earth–Sun distance).
const MIN_PER_AU = 8.3;
const travelText = (au) => {
  const min = au * MIN_PER_AU;
  return min < 60 ? say({ en: `${Math.round(min)} min`, ar: `${Math.round(min)} دقيقة` })
    : say({ en: `${(min / 60).toFixed(1)} hours`, ar: `${(min / 60).toFixed(1)} ساعة` });
};

export async function slowMessage(s, ctx) {
  const ui = gamePanel(s, { title: { en: 'The picture travels home', ar: 'الصورة في طريقها للأرض' }, width: 520, height: 200 });
  ui.help({ en: 'Hold Space to fast-forward the years.', ar: 'اضغط Space مطوّلًا لتسريع السنين.' });
  const st = { t: 0, dot: 0 };
  s.game = { id: 'slowMessage', ui, state: st, botKeys: () => ['Space'] };
  const DURATION = 9;
  await s.until((dt) => {
    const fast = ctx.input.down('Space') ? 2.2 : 1;
    st.t = Math.min(1, st.t + (dt * fast) / DURATION);
    const year = Math.round(1973 + 30 * st.t);
    const au = 5 + 75 * st.t; // from Jupiter (about 5 AU) to about 80 AU in 2003
    st.dot = (st.dot + dt * fast * (1.6 - st.t)) % 1; // the signal crawls more slowly as the gap grows
    const { g, w, h } = ui;
    g.fillStyle = '#05070c'; g.fillRect(0, 0, w, h);
    const ex = 40, px = 60 + (w - 120) * (0.15 + 0.85 * st.t);
    g.fillStyle = '#7fb7e6'; g.beginPath(); g.arc(ex, 90, 10, 0, 7); g.fill();
    g.fillStyle = '#cfd3da'; g.fillRect(px - 6, 84, 12, 12);
    g.strokeStyle = 'rgba(255,255,255,.18)'; g.setLineDash([3, 5]); g.beginPath(); g.moveTo(ex + 12, 90); g.lineTo(px - 8, 90); g.stroke(); g.setLineDash([]);
    const alpha = 1 - st.t * 0.85; // the signal fades with distance
    g.fillStyle = `rgba(227,162,60,${alpha})`; g.beginPath(); g.arc(px - 8 - (px - ex - 20) * st.dot, 90, 4, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.font = 'bold 20px system-ui'; g.fillText(String(year), w / 2 - 24, 40);
    g.font = '14px system-ui'; g.fillStyle = '#c8d0dc';
    g.fillText(say({ en: `Distance: about ${Math.round(au)} AU`, ar: `المسافة: حوالي ${Math.round(au)} وحدة فلكية` }), 30, 145);
    g.fillText(say({ en: 'Signal takes: ', ar: 'الإشارة تاخذ: ' }) + travelText(au), 30, 170);
    return st.t >= 1;
  });
  ui.help({ en: 'By 2003 Pioneer 10\'s signal took about 11 hours to reach Earth, and grew too faint to hear.',
    ar: 'في ٢٠٠٣ صارت إشارة بايونير 10 تاخذ حوالي ١١ ساعة لتوصل الأرض، وضعفت لين ما عاد أحد يسمعها.' });
  ui.status('');
  await s.wait(3);
  ui.remove();
}
