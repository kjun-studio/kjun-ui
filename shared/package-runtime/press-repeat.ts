/** Hold-to-repeat for step buttons (QuantityStepper ±). A press still steps once through the button's click; holding it past
 * `delay` steps again every `interval` until release, and the click that ends a repeating hold is then swallowed so the
 * value does not move one extra step. `step` returns false when it can go no further, which ends the repeat. */
export interface PressRepeat {
  /** Pointer or touch went down on the button. With a window, release anywhere (a disabled button gets no pointerup) ends it. */
  start(view?: Window): void;
  stop(): void;
  /** Pointer or touch came up: ends the hold; the repeated mark lasts only for the click that follows in the same input event. */
  release(): void;
  /** Called from the click: true when this click ends a hold that already repeated, so it must not step again. */
  takeRepeated(): boolean;
}

export function createPressRepeat(step: () => boolean, delay: number, interval: number): PressRepeat {
  let timer: ReturnType<typeof setTimeout> | undefined, repeating: ReturnType<typeof setInterval> | undefined;
  let repeated = false, active = false, detach: (() => void) | undefined;
  const stop = () => {
    active = false;
    if (timer !== undefined) clearTimeout(timer);
    if (repeating !== undefined) clearInterval(repeating);
    timer = repeating = undefined;
    detach?.();
    detach = undefined;
  };
  const release = () => {
    stop();
    setTimeout(() => { repeated = false; }, 0);
  };
  const tick = () => { if (!step()) stop(); };
  return {
    start(view) {
      stop();
      repeated = false;
      active = true;
      timer = setTimeout(() => {
        timer = undefined;
        repeated = true;
        tick();
        if (active) repeating = setInterval(tick, interval);
      }, delay);
      if (!view) return;
      const end = () => release();
      for (const type of ["pointerup", "pointercancel", "blur"] as const) view.addEventListener(type, end);
      detach = () => { for (const type of ["pointerup", "pointercancel", "blur"] as const) view.removeEventListener(type, end); };
    },
    stop,
    release,
    takeRepeated() {
      const was = repeated;
      repeated = false;
      return was;
    },
  };
}
