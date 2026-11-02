// Web textareas: fit the height to the text between two border-box heights, and mark the field once it must scroll.
// Measuring drops the field to `auto` for a moment; when the page is scrolled to its end that shortens the document and
// the browser pulls the scroll back, so every scroller around the field keeps its position across the measurement.
export function growTextarea(element: HTMLTextAreaElement | null, minimum: number, maximum: number) {
  if (!element) return;
  const scrollers: [Element, number][] = [];
  for (let node = element.parentElement; node; node = node.parentElement)
    if (node.scrollHeight > node.clientHeight) scrollers.push([node, node.scrollTop]);
  const page = element.ownerDocument.scrollingElement;
  if (page && !scrollers.some(([node]) => node === page)) scrollers.push([page, page.scrollTop]);
  element.style.height = "auto";
  const borders = element.offsetHeight - element.clientHeight;
  const content = element.scrollHeight + borders;
  element.style.height = Math.min(maximum, Math.max(minimum, content)) + "px";
  element.toggleAttribute("data-overflow", content > maximum + 0.5);
  for (const [node, top] of scrollers) if (node.scrollTop !== top) node.scrollTop = top;
}
