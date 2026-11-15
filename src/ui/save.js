// Local save: the game remembers the last chapter reached, on this device only. Owner: Set C.
//
//   save.read()          { chapter: 2, id: 'mars', memories: [...], discoveries: [...], at: 1731600000000 } or null
//   save.write(data)     stores it (quietly does nothing if the browser blocks storage)
//   save.clear()         forget it (New game)
//
// A checkpoint is the start of a chapter. Continue starts that chapter again with the photos and
// discoveries collected before it, so the ending wall is complete.
const KEY = 'relica.save.v1';

export const save = {
  read() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!data || !Number.isInteger(data.chapter) || data.chapter < 0) return null;
      return {
        chapter: data.chapter,
        id: String(data.id ?? ''),
        memories: Array.isArray(data.memories) ? data.memories.filter((x) => typeof x === 'string') : [],
        discoveries: Array.isArray(data.discoveries) ? data.discoveries.filter((d) => d && typeof d.id === 'string') : [],
        at: Number(data.at) || 0,
      };
    } catch { return null; }
  },
  write(data) {
    try { localStorage.setItem(KEY, JSON.stringify({ ...data, at: Date.now() })); return true; } catch { return false; }
  },
  clear() { try { localStorage.removeItem(KEY); } catch { /* blocked */ } },
};
