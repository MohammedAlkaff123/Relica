// Full-screen fade to and from black, under the interface (cards and dialogue stay readable).
// Owner: Set A. Chapters use it through stage.fade(toBlack, seconds).
let node = null;

function ensure() {
  if (node) return node;
  node = document.createElement('div');
  node.className = 'fade';
  Object.assign(node.style, {
    position: 'fixed', inset: '0', background: '#000', opacity: '0', pointerEvents: 'none',
  });
  // Right after the 3D canvas, so the #ui layer (cards, dialogue) draws on top of it.
  const canvas = document.getElementById('view');
  if (canvas) canvas.after(node); else document.body.appendChild(node);
  return node;
}

// alpha 0 = clear, 1 = black. seconds 0 = at once.
export function fadeTo(alpha, seconds = 0) {
  const n = ensure();
  n.style.transition = seconds > 0 ? `opacity ${seconds}s linear` : 'none';
  n.style.opacity = String(alpha);
}
