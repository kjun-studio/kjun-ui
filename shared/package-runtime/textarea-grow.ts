// Web textareas: fit the height to the text between two border-box heights, and mark the field once it must scroll.
export function growTextarea(element: HTMLTextAreaElement | null, minimum: number, maximum: number) {
  if (!element) return;
  element.style.height = "auto";
  const borders = element.offsetHeight - element.clientHeight;
  const content = element.scrollHeight + borders;
  element.style.height = Math.min(maximum, Math.max(minimum, content)) + "px";
  element.toggleAttribute("data-overflow", content > maximum + 0.5);
}
