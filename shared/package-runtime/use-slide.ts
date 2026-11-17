import { tokens } from "@kjun-ui/tokens";
import { useEffect, useRef, useState } from "react";
import { slideNext, slideStart } from "./event-calendar";
import type { SlideState } from "./event-calendar";

/** The month slide for React and Native: follows key, leaving for slideOut ms and entering for slideIn ms; reduced motion switches at once. */
export function useSlide(key: string, reduceMotion: boolean): SlideState {
  const [state, setState] = useState<SlideState>({ shown: key, pending: null, phase: "idle", direction: 1 });
  const last = useRef(key);
  useEffect(() => {
    if (last.current === key) return;
    last.current = key;
    setState(current => reduceMotion ? { shown: key, pending: null, phase: "idle", direction: current.direction } : slideStart(current, key));
  }, [key, reduceMotion]);
  useEffect(() => {
    if (state.phase === "idle") return;
    const timer = setTimeout(() => setState(slideNext), state.phase === "out" ? tokens.extensions.calendar.slideOut : tokens.extensions.calendar.slideIn);
    return () => clearTimeout(timer);
  }, [state]);
  return state;
}
