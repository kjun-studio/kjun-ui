import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";
import { keyboardEvents } from "../../../shared/package-runtime/drawer-geometry";

/**
 * Whether the on-screen keyboard is up for a bottom bar that hides with it. The app's keyboardVisible wins when given;
 * without it the bar listens to the platform's keyboard events (none on Native Web, where it stays false).
 */
export function useKeyboardShown(given: boolean | undefined, listen: boolean) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (given !== undefined || !listen) return;
    const events = keyboardEvents(Platform.OS);
    if (!events) return;
    setShown(Keyboard.isVisible?.() ?? false);
    const show = Keyboard.addListener(events.show, () => setShown(true)), hide = Keyboard.addListener(events.hide, () => setShown(false));
    return () => { show.remove(); hide.remove(); };
  }, [given, listen]);
  return given ?? (listen && shown);
}
