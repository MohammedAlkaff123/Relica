// Runs one chapter at a time. A chapter is an object with:
//   start(ctx)        set up the stage and run the script (may be async)
//   update(dt, ctx)   called every frame
//   dispose(ctx)      remove everything it added
// A chapter moves the story on by calling ctx.next().
export function createChapters(list, ctx, closeOverlays) {
  let index = -1;
  let current = null;

  function go(i) {
    closeOverlays();
    if (current) current.dispose(ctx);
    index = ((i % list.length) + list.length) % list.length;
    current = list[index];
    Promise.resolve(current.start(ctx)).catch((err) => console.error(`chapter "${current.id}" failed`, err));
  }

  return {
    go,
    next: () => go(index + 1),
    update: (dt) => { if (current) current.update(dt, ctx); },
    get index() { return index; },
  };
}
