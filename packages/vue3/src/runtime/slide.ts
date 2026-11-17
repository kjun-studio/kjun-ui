import { onBeforeUnmount, shallowRef, watch, type Ref } from "vue";
import { tokens } from "@kjun-ui/tokens";
import { slideNext, slideStart, type SlideState } from "../../../../shared/package-runtime/event-calendar";

/**
 * The Vue form of shared/package-runtime/use-slide: follows key, leaving for slideOut ms and entering for slideIn ms;
 * reduced motion switches at once.
 */
export function useSlide(key: () => string, reduceMotion: () => boolean): Ref<SlideState> {
  const state = shallowRef<SlideState>({ shown: key(), pending: null, phase: "idle", direction: 1 });
  let timer: ReturnType<typeof setTimeout> | undefined;
  watch(key, next => {
    const current = state.value;
    state.value = reduceMotion() ? { shown: next, pending: null, phase: "idle", direction: current.direction } : slideStart(current, next);
  });
  // As in React, every new state restarts the timer of its phase; idle has none.
  watch(state, current => {
    clearTimeout(timer);
    if (current.phase === "idle") return;
    timer = setTimeout(() => { state.value = slideNext(state.value); },
      current.phase === "out" ? tokens.extensions.calendar.slideOut : tokens.extensions.calendar.slideIn);
  });
  onBeforeUnmount(() => clearTimeout(timer));
  return state;
}
