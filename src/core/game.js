// Renderer, scene, camera and the frame loop.
import * as THREE from 'three';

export function createGame(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 3000);
  camera.position.set(0, 3, -8);

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  function start(tick) {
    let last = performance.now();
    function frame(now) {
      const dt = Math.min((now - last) / 1000, 1 / 20); // never simulate more than 50 ms at once
      last = now;
      tick(dt);
      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  return { renderer, scene, camera, start };
}
