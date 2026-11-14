// Tuning panel for the directors. Press ` (the key under Escape) to show or hide it.
// Every number in content/tuning.json gets a slider. Changes apply at once.
// "Copy values" puts the current numbers on the clipboard: paste them over content/tuning.json to keep them.
import GUI from 'lil-gui';

export function createTweak(tuning) {
  const gui = new GUI({ title: 'Tuning' });
  for (const [group, values] of Object.entries(tuning)) {
    const folder = gui.addFolder(group);
    for (const key of Object.keys(values)) {
      if (typeof values[key] !== 'number') continue;
      const max = Math.max(1, Math.abs(values[key]) * 4);
      folder.add(values, key, 0, max, max / 400);
    }
  }
  gui.add({
    copy() {
      const text = JSON.stringify(tuning, null, 2);
      console.log(text);
      if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    },
  }, 'copy').name('Copy values');

  let visible = location.hash === '#dev';
  gui.show(visible);
  return { toggle() { visible = !visible; gui.show(visible); } };
}
