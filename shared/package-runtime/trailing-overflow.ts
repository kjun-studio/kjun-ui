// Reports whether a horizontal scroller still hides content past its trailing edge, so tables can fade
// that edge until the end is reached. Returns a cleanup for the listeners.
export function watchTrailingOverflow(element: HTMLElement, onChange: (hidden: boolean) => void): () => void {
  const update = () => onChange(element.scrollLeft + element.clientWidth < element.scrollWidth - 1);
  const observer = typeof ResizeObserver === "function" ? new ResizeObserver(update) : null;
  observer?.observe(element);
  if (element.firstElementChild) observer?.observe(element.firstElementChild);
  element.addEventListener("scroll", update, { passive: true });
  update();
  return () => {
    observer?.disconnect();
    element.removeEventListener("scroll", update);
  };
}
