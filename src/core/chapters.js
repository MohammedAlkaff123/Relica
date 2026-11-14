// Runs one chapter at a time. Owner: Set A. A chapter is an object with:
//   start(ctx, opts)  set up the stage and run the script (may be async). opts.jump = pitch shortcut
//   update(dt, ctx)   called every frame
//   dispose(ctx)      remove everything it added
// A chapter moves the story on by calling ctx.next().
export function createChapters(list, ctx, closeOverlays) {
  let index = -1;
  let current = null;

  let token = 0;
  function go(i, opts = {}) {
    closeOverlays();
    if (current) current.dispose(ctx);
    index = ((i % list.length) + list.length) % list.length;
    current = list[index];
    // Start on the next tick: the cancelled card, dialogue or photo of the old chapter first finishes
    // hiding its box, so it cannot hide the new chapter's first card by mistake.
    const mine = ++token, chapter = current;
    setTimeout(() => {
      if (mine !== token) return; // another jump happened meanwhile
      Promise.resolve(chapter.start(ctx, opts)).catch((err) => console.error(`chapter "${chapter.id}" failed`, err));
    }, 0);
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
