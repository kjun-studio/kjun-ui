import { tokens } from "@kjun-ui/tokens";
type Box = { top: number; left: number; width: number; height: number; card: number };
// FLIP only the outer slot; entry/exit belongs to the inner toast surface. The "+N" strip moves with the cards, and a
// card whose width changes (a stack going from several equal cards to one hugging card) eases to its new width.
export function createToastLayout() {
  let root: HTMLElement | null = null;
  const boxes = new Map<string, Box>();
  const animations = new Map<Element, Animation>();
  const idOf = (node: HTMLElement) => node.dataset.toastId ?? "more";
  const cardOf = (node: HTMLElement) => node.querySelector<HTMLElement>(".kjun-toast, [data-kjun-toast]");
  return {
    update(nextRoot: HTMLElement, reduced: boolean) {
      if (root !== nextRoot) { boxes.clear(); for (const a of animations.values()) a.cancel(); animations.clear(); root = nextRoot; }
      const nodes = [...root.querySelectorAll<HTMLElement>(':scope > [data-toast-id], :scope > [data-toast-more]')];
      const rect = root.getBoundingClientRect(), style = getComputedStyle(root);
      for (const node of nodes) {
        const box = boxes.get(idOf(node));
        if (node.dataset.exiting === 'true' && box) Object.assign(node.style, {
          position: 'absolute', top: box.top + 'px', left: box.left + 'px', width: box.width + 'px', height: box.height + 'px',
        });
      }
      // A leaving card keeps its place; the stack keeps room for it plus its own padding, where the shadow falls.
      const leaving = nodes.some(node => node.dataset.exiting === 'true'), values = [...boxes.values()];
      root.style.minHeight = leaving ? Math.max(rect.height, ...values.map(box => box.top + box.height + parseFloat(style.paddingBottom || '0'))) + 'px' : '';
      root.style.minWidth = leaving ? Math.max(rect.width, ...values.map(box => box.left + box.width + parseFloat(style.paddingRight || '0'))) + 'px' : '';
      const alive = new Set(nodes.map(idOf));
      for (const id of boxes.keys()) if (!alive.has(id)) boxes.delete(id);
      for (const [node, animation] of animations) if (!node.isConnected) { animation.cancel(); animations.delete(node); }
      for (const node of nodes) {
        const id = idOf(node), old = boxes.get(id);
        if (node.dataset.exiting === 'true') continue;
        const transform = getComputedStyle(node).transform;
        const offset = transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m42;
        const top = node.offsetTop, left = node.offsetLeft, card = cardOf(node);
        animations.get(node)?.cancel();
        if (old && !reduced && Math.abs(old.top + offset - top) > 0.5) {
          const animation = node.animate([{ transform: `translateY(${old.top + offset - top}px)` }, { transform: 'translateY(0)' }], { duration: tokens.motion.toastMove, easing: tokens.motion.easeOut });
          animations.set(node, animation);
        }
        // Measure the card's resting width, not a width an earlier ease is still passing through.
        const easing = card ? animations.get(card) : undefined, from = easing && card ? card.offsetWidth : old?.card;
        easing?.cancel();
        const width = card?.offsetWidth ?? 0;
        if (card && from && !reduced && Math.abs(from - width) > 0.5) {
          animations.set(card, card.animate([{ width: from + 'px' }, { width: width + 'px' }], { duration: tokens.motion.toastMove, easing: tokens.motion.easeOut }));
        }
        boxes.set(id, { top, left, width: node.offsetWidth, height: node.offsetHeight, card: width });
      }
    },
    destroy() { for (const animation of animations.values()) animation.cancel(); animations.clear(); boxes.clear(); root = null; },
  };
}
