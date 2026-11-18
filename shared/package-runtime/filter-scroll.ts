// Shared by the React and Vue 3 KjunFilterGroup in scroll mode: the row fades at the edges with more chips past them,
// as KjunScrollFade and Tabs do, and the selected chip scrolls in clear of the fade.
import { tokens } from "@kjun-ui/tokens";
import { trackScrollFade } from "./scroll-fade";
import { revealTab } from "./tab-keyboard";

export function trackFilterScroll(row: HTMLElement) {
  const fade = typeof ResizeObserver === "undefined" ? undefined : trackScrollFade(row, () => "horizontal", edges => {
    row.toggleAttribute("data-fade-start", edges.start);
    row.toggleAttribute("data-fade-end", edges.end);
  });
  let revealed = false;
  return {
    /** Scrolls the first selected chip into view: at once the first time, smoothly after that. */
    reveal() {
      const chip = row.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (chip) revealTab(row, chip, tokens.extensions.scrollFade.width, revealed);
      revealed = true;
    },
    destroy() {
      fade?.destroy();
      row.removeAttribute("data-fade-start");
      row.removeAttribute("data-fade-end");
    },
  };
}
