// "Wait until the player presses Enter or clicks." Shared by cards, dialogue and memory photos,
// because only one of them is on screen at a time.
//   const ok = await prompt.wait()   -> true if the player continued, false if it was cancelled
export function createPrompt(input) {
  let resolve = null;
  function settle(value) {
    if (!resolve) return;
    const r = resolve;
    resolve = null;
    r(value);
  }
  return {
    wait() { settle(false); return new Promise((r) => { resolve = r; }); },
    update() { if (resolve && input.pressed('Enter', 'Click')) settle(true); },
    cancel() { settle(false); },
  };
}
