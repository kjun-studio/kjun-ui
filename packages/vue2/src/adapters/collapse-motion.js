import { tokens } from "@kjun-ui/tokens";
const motions = new WeakMap();
export function stopCollapse(el) {
  const motion = motions.get(el);
  if (!motion) return;
  el.style.height = el.getBoundingClientRect().height + 'px';
  motion.cancel(); motions.delete(el);
}
export function prepareCollapse(el) {
  if (motions.has(el)) stopCollapse(el);
  else el.style.height = '0px';
}
export function moveCollapse(el, open, done) {
  stopCollapse(el);
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  let animation, disposed = false;
  const inner = el.firstElementChild || el;
  let last = inner.getBoundingClientRect().height;
  const observer = new ResizeObserver(() => {
    const height = inner.getBoundingClientRect().height;
    if (open && height !== last) { last = height; run(); }
  });
  const cleanup = () => { disposed = true; animation?.cancel(); observer.disconnect(); media.removeEventListener('change', preference); };
  const finish = () => { if (disposed) return; cleanup(); motions.delete(el); el.style.height = open ? '' : '0px'; el.style.overflow = ''; done(); };
  const preference = () => { if (media.matches) finish(); };
  function run() {
    const from = el.getBoundingClientRect().height, to = open ? inner.getBoundingClientRect().height : 0;
    animation?.cancel(); el.style.overflow = 'hidden'; el.style.height = to + 'px';
    if (media.matches || from === to) { finish(); return; }
    animation = el.animate([{ height: from + 'px' }, { height: to + 'px' }], { duration: tokens.motion.collapse, easing: tokens.motion.easeOut });
    animation.onfinish = finish;
  }
  motions.set(el, { cancel: cleanup });
  observer.observe(inner); media.addEventListener('change', preference); run();
}
