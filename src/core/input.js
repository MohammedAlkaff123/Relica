// Keyboard and click state.
// down(code)    -> true while the key is held
// pressed(code) -> true only on the frame the key went down
// Codes are KeyboardEvent.code values ("KeyW", "Space", "Enter"). A mouse click counts as "Click".
export function createInput() {
  const held = new Set();
  const hit = new Set();
  const block = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

  window.addEventListener('keydown', (e) => {
    if (block.has(e.code)) e.preventDefault();
    if (!e.repeat) hit.add(e.code);
    held.add(e.code);
  });
  window.addEventListener('keyup', (e) => held.delete(e.code));
  window.addEventListener('blur', () => held.clear());
  window.addEventListener('pointerdown', (e) => {
    if (e.target.closest && e.target.closest('.lil-gui')) return; // clicks on the tuning panel are not game input
    hit.add('Click');
  });

  return {
    down: (...codes) => codes.some((c) => held.has(c)),
    pressed: (...codes) => codes.some((c) => hit.has(c)),
    endFrame: () => hit.clear(),
  };
}
