/** Marks a Popover body with where it can still scroll: `data-scrolled` once it has left the top
 * (the fixed header then draws a divider) and `data-more` while content remains below (the body fades out). */
export function trackPopoverScroll(body: HTMLElement) {
  const update = () => {
    body.toggleAttribute("data-scrolled", body.scrollTop > 0);
    body.toggleAttribute("data-more", body.scrollTop + body.clientHeight < body.scrollHeight - 1);
  };
  update();
  body.addEventListener("scroll", update, { passive: true });
  // The content or the available height can change while the panel is open.
  const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(update);
  observer?.observe(body);
  if (body.firstElementChild) observer?.observe(body.firstElementChild);
  return () => { body.removeEventListener("scroll", update); observer?.disconnect(); };
}
