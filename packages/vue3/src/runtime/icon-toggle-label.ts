import { onMounted, onUpdated, ref } from "vue";

/** Resolve a text label after the surrounding template has mounted its label elements. */
export function useIconToggleLabel(label: () => string | undefined, labelledBy: () => string | undefined) {
  const button = ref<HTMLButtonElement | null>(null), text = ref("");
  let warned = false;
  const refresh = () => {
    const doc = button.value?.ownerDocument;
    const labels = (labelledBy() ?? "").trim().split(/\s+/).filter(Boolean)
      .map(id => doc?.getElementById(id)).filter((node): node is HTMLElement => !!node);
    // aria-labelledby takes precedence over aria-label, including an explicitly empty label.
    text.value = labels.length ? labels.map(node => node.textContent?.trim() ?? "").join(" ").trim() : label()?.trim() ?? "";
    if (process.env.NODE_ENV !== "production") {
      // Check the naming contract, not the browser's complete accessible-name algorithm.
      const missing = !label()?.trim() && !labelledBy()?.trim();
      if (missing && !warned) console.warn("[KJUN] IconToggle needs an accessible name: aria-label, ariaLabel, or aria-labelledby referencing label text.");
      warned = missing;
    }
  };
  onMounted(refresh);
  onUpdated(refresh);
  return { button, text, refresh };
}
