import { tokens } from "@kjun-ui/tokens";
import { useEffect, useRef, useState } from "react";
import type { LayoutChangeEvent, ScrollView } from "react-native";
import { sameEdges, scrollEdges, type ScrollEdges } from "../../../shared/package-runtime/scroll-fade";

/**
 * FilterGroup scroll mode, as on Web: which edges have more chips past them, and scrolling the selected chip in clear
 * of the fade. Single mode follows the value; multiple mode reveals once, so turning a chip off keeps the row still.
 */
export function useFilterRow(scroll: boolean, multiple: boolean, value: unknown) {
  const scroller = useRef<ScrollView>(null), chips = useRef(new Map<unknown, { x: number; width: number }>());
  const box = useRef({ scrollLeft: 0, scrollTop: 0, clientWidth: 0, clientHeight: 0, scrollWidth: 0, scrollHeight: 0 });
  const [edges, setEdges] = useState<ScrollEdges>({ start: false, end: false });
  const revealed = useRef(false), valueNow = useRef(value);
  valueNow.current = value;
  const reveal = () => {
    const first = Array.isArray(valueNow.current) ? valueNow.current[0] : valueNow.current;
    const chip = chips.current.get(first), { scrollLeft, clientWidth, scrollWidth } = box.current;
    if (!scroll || !chip || !clientWidth || !scrollWidth) return;
    const pad = tokens.extensions.scrollFade.width, left = scrollLeft + pad, right = scrollLeft + clientWidth - pad;
    const target = chip.x < left ? chip.x - pad : chip.x + chip.width > right ? chip.x + chip.width - clientWidth + pad : scrollLeft;
    const x = Math.max(0, Math.min(target, scrollWidth - clientWidth));
    if (Math.abs(x - scrollLeft) >= 1) scroller.current?.scrollTo({ x, animated: revealed.current });
    revealed.current = true;
  };
  const firstReveal = () => { if (!revealed.current) reveal(); };
  useEffect(() => { if (revealed.current && !multiple) reveal(); }, [multiple ? null : value]);
  return {
    scroller,
    edges,
    measure(option: unknown, event: LayoutChangeEvent) {
      const { x, width } = event.nativeEvent.layout;
      chips.current.set(option, { x, width });
      firstReveal();
    },
    /** userScrolled: once the row has been moved, the first reveal must not pull it back (layout arrives late on Native Web). */
    update(next: Partial<typeof box.current>, userScrolled = false) {
      box.current = { ...box.current, ...next };
      const found = scrollEdges(box.current, "horizontal");
      setEdges(previous => sameEdges(previous, found) ? previous : found);
      if (userScrolled) revealed.current = true;
      else firstReveal();
    },
  };
}
