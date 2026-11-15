// Checks the finished trailer by decoding it in Chrome:  node verify.mjs [file]
// Reports duration, size, frame rate and sound level per second, and saves stills to out/verify/.
import fs from 'node:fs';
import path from 'node:path';
import { launch, BASE, OUT } from './lib.mjs';

const file = process.argv[2] ?? 'out/relica-trailer-30s.mp4';
const rel = path.relative(path.resolve('../..'), path.resolve(file)).replaceAll('\\', '/');
const browser = await launch();
try {
  const page = await browser.newPage();
  await page.goto(BASE + '/tools/trailer/compose.html', { waitUntil: 'load' });
  const info = await page.evaluate(async (url) => {
    const v = document.createElement('video'); v.muted = true; v.src = url; v.preload = 'auto';
    document.body.appendChild(v);
    await new Promise((ok, bad) => { v.onloadeddata = ok; v.onerror = () => bad(new Error('video will not decode')); });
    const bytes = await (await fetch(url)).arrayBuffer();
    const audio = await new AudioContext().decodeAudioData(bytes.slice(0));
    const d = audio.getChannelData(0), per = [];
    for (let s = 0; s < Math.floor(audio.duration); s++) {
      let sum = 0, peak = 0;
      for (let i = s * audio.sampleRate; i < (s + 1) * audio.sampleRate; i++) { sum += d[i] * d[i]; peak = Math.max(peak, Math.abs(d[i])); }
      per.push([s, (20 * Math.log10(Math.sqrt(sum / audio.sampleRate) + 1e-9)).toFixed(0), peak.toFixed(2)]);
    }
    // Count frames: play through and count presented frames.
    let frames = 0;
    await new Promise((done) => { const tick = (_, m) => { frames = m.presentedFrames; if (v.ended) done(); else v.requestVideoFrameCallback(tick); }; v.requestVideoFrameCallback(tick); v.playbackRate = 4; v.play(); v.onended = () => setTimeout(done, 100); });
    return { duration: v.duration, w: v.videoWidth, h: v.videoHeight, audio: { duration: audio.duration, rate: audio.sampleRate, channels: audio.numberOfChannels }, per, frames, mb: bytes.byteLength / 1048576 };
  }, '/' + rel);
  console.log(`video ${info.w}x${info.h}, ${info.duration.toFixed(3)} s, ${info.mb.toFixed(1)} MB, frames seen while playing at 4x: ${info.frames}`);
  console.log(`audio ${info.audio.channels} ch, ${info.audio.rate} Hz, ${info.audio.duration.toFixed(3)} s`);
  console.log('sound per second (dB RMS, peak):', info.per.map(([s, db, p]) => `${s}:${db}/${p}`).join('  '));
  fs.mkdirSync(path.join(OUT, 'verify'), { recursive: true });
  // The local server cannot seek inside a video, so play it through once and grab stills on the way.
  const stills = await page.evaluate(async (times) => {
    const v = document.querySelector('video'); v.currentTime = 0; v.playbackRate = 1;
    const c = document.createElement('canvas'); c.width = 960; c.height = 540;
    const g = c.getContext('2d', { willReadFrequently: true });
    const out = []; let next = 0;
    await new Promise((done) => {
      const tick = (_, m) => {
        if (next < times.length && m.mediaTime >= times[next]) {
          g.drawImage(v, 0, 0, 960, 540);
          const d = g.getImageData(0, 0, 960, 540).data; let s = 0;
          for (let i = 0; i < d.length; i += 40) s += d[i] + d[i + 1] + d[i + 2];
          out.push([times[next], +(s / (d.length / 40) / 3).toFixed(1), c.toDataURL('image/jpeg', 0.7)]);
          next++;
        }
        if (v.ended || next >= times.length) done(); else v.requestVideoFrameCallback(tick);
      };
      v.requestVideoFrameCallback(tick); v.play();
    });
    return out;
  }, [0.5, 2.5, 3.9, 5.5, 6.8, 8.3, 9.8, 11.8, 13.8, 15.5, 16.4, 17.2, 18.0, 18.8, 19.6, 21, 23.2, 25.5, 28.0, 29.5]);
  for (const [t, mean, url] of stills) fs.writeFileSync(path.join(OUT, 'verify', String(Math.round(t * 10)).padStart(4, '0') + '.jpg'), Buffer.from(url.split(',')[1], 'base64'));
  console.log('mean brightness of each still:', stills.map(([t, m]) => `${t}s:${m}`).join('  '));
  console.log('stills in out/verify/');
} finally {
  await browser.close();
}
