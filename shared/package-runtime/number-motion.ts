import { tokens } from "@kjun-ui/tokens";

// Keep the unformatted displayed value: a target is never an animation's origin.
export function createNumberMotion(apply: (value: number | string) => void) {
  let frame = 0, revision = 0, current: number | string = 0;
  let previous: { value: number | string; animated: boolean; fromPrevious: boolean } | undefined;
  function cancel() { revision++; cancelAnimationFrame(frame); frame = 0; }
  function show(value: number | string) { current = value; apply(value); }
  return {
    update(value: number | string, animated: boolean, fromPrevious: boolean, reduced: boolean) {
      const changed = !previous || value !== previous.value || animated !== previous.animated || fromPrevious !== previous.fromPrevious;
      const first = !previous;
      previous = { value, animated, fromPrevious };
      if (!changed && !reduced) return; // Turning motion back on never replays a completed update.
      cancel();
      if (typeof value === 'string' || !animated || reduced || (fromPrevious && (first || typeof current === 'string'))) {
        show(value); return;
      }
      const target = Number.isFinite(value) ? value : 0;
      const from = fromPrevious ? Number(current) : 0;
      const version = revision, started = performance.now();
      show(from);
      if (from === target) return;
      const tick = (now: number) => {
        if (version !== revision) return;
        const progress = Math.min(1, Math.max(0, (now - started) / tokens.motion.number));
        show(progress === 1 ? target : from + (target - from) * (1 - Math.pow(1 - progress, 3)));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    },
    cancel,
  };
}
