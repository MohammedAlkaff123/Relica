// "Wait until the player presses Enter, Space or clicks." Shared by cards, dialogue and memory photos,
// because only one of them is on screen at a time.
//   const ok = await prompt.wait()   -> true if the player continued, false if it was cancelled
//   prompt.id                        number of the current wait (changes with every new wait)
//   prompt.advance(id)               continue the wait `id` as if the player pressed (auto-close);
//                                    does nothing if another wait has started since
//   prompt.spaceAllowed = () => bool Space continues only when this says so. main.js makes it false
//                                    while the player is driving or flying, where Space hops or lifts.
export function createPrompt(input) {
  let resolve = null;
  let id = 0;
  function settle(value) {
    if (!resolve) return;
    const r = resolve;
    resolve = null;
    r(value);
  }
  const prompt = {
    spaceAllowed: () => true,
    get id() { return id; },
    get waiting() { return !!resolve; },
    wait() { settle(false); id++; return new Promise((r) => { resolve = r; }); },
    update() {
      if (!resolve) return;
      if (input.pressed('Enter', 'Click') || (input.pressed('Space') && prompt.spaceAllowed())) settle(true);
    },
    advance(which) { if (which === id) settle(true); },
    cancel() { settle(false); },
  };
  return prompt;
}
