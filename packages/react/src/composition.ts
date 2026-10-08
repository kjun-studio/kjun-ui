import { useRef, type KeyboardEvent } from "react";
import { isComposingKey } from "@kjun-ui/tokens";

// Some IMEs end composition before delivering the confirming Enter (keyCode 229).
export function useCompositionGuard() {
  const composing = useRef(false);
  return {
    onCompositionStart: () => { composing.current = true; },
    onCompositionEnd: () => { composing.current = false; },
    isComposing: (event: KeyboardEvent<HTMLElement>) =>
      isComposingKey(event, composing.current),
  };
}
