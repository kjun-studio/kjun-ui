import { tokens } from "@kjun/tokens";
// FLIP only the outer slot; entry/exit belongs to the inner toast surface.
export function createToastLayout() {
  let root: HTMLElement | null = null;
  const boxes = new Map<string, { top: number; left: number; width: number; height: number }>();
  const animations = new Map<Element, Animation>();
  return {
    update(nextRoot: HTMLElement, reduced: boolean) {
      if (root !== nextRoot) { boxes.clear(); for (const a of animations.values()) a.cancel(); animations.clear(); root = nextRoot; }
      const nodes = [...root.querySelectorAll<HTMLElement>(':scope > [data-toast-id]')];
      const initialHeight = root.getBoundingClientRect().height;
      const initialWidth = root.getBoundingClientRect().width;
      for (const node of nodes) {
        const box = boxes.get(node.dataset.toastId!);
        if (node.dataset.exiting === 'true' && box) Object.assign(node.style, {
          position: 'absolute', top: box.top + 'px', left: box.left + 'px', width: box.width + 'px', height: box.height + 'px',
        });
      }
      root.style.minHeight = nodes.some(node => node.dataset.exiting === 'true') ? Math.max(initialHeight, ...[...boxes.values()].map(box => box.top + box.height)) + 'px' : '';
      root.style.minWidth = nodes.some(node => node.dataset.exiting === 'true') ? Math.max(initialWidth, ...[...boxes.values()].map(box => box.left + box.width)) + 'px' : '';
      const alive = new Set(nodes.map(node => node.dataset.toastId!));
      for (const id of boxes.keys()) if (!alive.has(id)) boxes.delete(id);
      for (const [node, animation] of animations) if (!node.isConnected) { animation.cancel(); animations.delete(node); }
      for (const node of nodes) {
        const id = node.dataset.toastId!, old = boxes.get(id);
        if (node.dataset.exiting === 'true') continue;
        const transform = getComputedStyle(node).transform;
        const offset = transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m42;
        const top = node.offsetTop, left = node.offsetLeft;
        animations.get(node)?.cancel();
        if (old && !reduced && Math.abs(old.top + offset - top) > 0.5) {
          const animation = node.animate([{ transform: `translateY(${old.top + offset - top}px)` }, { transform: 'translateY(0)' }], { duration: tokens.motion.toastMove, easing: tokens.motion.easeOut });
          animations.set(node, animation);
        }
        boxes.set(id, { top, left, width: node.offsetWidth, height: node.offsetHeight });
      }
    },
    destroy() { for (const animation of animations.values()) animation.cancel(); animations.clear(); boxes.clear(); root = null; },
  };
}
