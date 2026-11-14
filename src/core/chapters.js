// Runs one chapter at a time. Owner: Set A. A chapter is an object with:
//   start(ctx, opts)  set up the stage and run the script (may be async). opts.jump = pitch shortcut
//   update(dt, ctx)   called every frame
//   dispose(ctx)      remove everything it added
// A chapter moves the story on by calling ctx.next().
export function createChapters(list, ctx, closeOverlays) {
  let index = -1;
  let current = null;

  function go(i, opts = {}) {
    closeOverlays();
    if (current) current.dispose(ctx);
    index = ((i % list.length) + list.length) % list.length;
    current = list[index];
    Promise.resolve(current.start(ctx, opts)).catch((err) => console.error(`chapter "${current.id}" failed`, err));
  }

  return {
    go,
    next: () => go(index + 1),
    restart: () => go(index),
    find: (id) => list.findIndex((c) => c.id === id),
    update: (dt) => { if (current) current.update(dt, ctx); },
    get index() { return index; },
  };
}
