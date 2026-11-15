// A quick check that capture works on this machine: opens the Moon chapter, reports the graphics
// card Chrome is using and what the video encoder supports, and saves two seconds of frames.
//   node probe.mjs
import { launch, openGame, until, record, stageReady } from './lib.mjs';

const browser = await launch();
try {
  const page = await openGame(browser, '?chapter=moon&lang=ar&mute');
  const waited = await until(page, stageReady, { label: 'the Moon chapter' });
  const info = await page.evaluate(async () => {
    const gl = window.relica.renderer.getContext();
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const video = 'VideoEncoder' in window ? await VideoEncoder.isConfigSupported({ codec: 'avc1.640028', width: 1920, height: 1080, bitrate: 12e6, framerate: 30 }) : null;
    const audio = 'AudioEncoder' in window ? await AudioEncoder.isConfigSupported({ codec: 'mp4a.40.2', sampleRate: 48000, numberOfChannels: 2, bitrate: 192000 }) : null;
    return {
      gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown',
      size: [innerWidth, innerHeight, devicePixelRatio],
      h264: video?.supported ?? false, aac: audio?.supported ?? false,
      chapter: window.relica.chapters.index, lang: document.documentElement.lang,
      keys: Object.keys(window.relica.stage).slice(0, 60),
    };
  });
  console.log('ready after', waited, 'frames');
  console.log(info);
  await record(page, 'probe', 60);
} finally {
  await browser.close();
}
