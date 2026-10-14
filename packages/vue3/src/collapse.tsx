import { defineComponent, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { tokens } from "@kjun-ui/tokens";
import { useReducedMotion } from "./runtime/presence";

/** Height motion for disclosure content; the closed body stays mounted until its exit ends. */
export const KjunCollapse = defineComponent({
  name: "KjunCollapse",
  props: { open: { type: Boolean, required: true } },
  setup(props, { slots }) {
    const reduced = useReducedMotion();
    const retained = ref(props.open);
    const root = ref<HTMLElement | null>(null), body = ref<HTMLElement | null>(null);
    let animation: Animation | null = null, previous = props.open, interrupted: number | null = null;
    let dispose: (() => void) | undefined;
    const present = () => props.open || retained.value;
    const run = () => {
      dispose?.(); dispose = undefined;
      const el = root.value, inner = body.value, open = props.open;
      if (!el || !inner) return;
      let disposed = false;
      const wasOpen = previous;
      previous = open;
      let lastHeight = inner.getBoundingClientRect().height;
      const animate = (from?: number) => {
        const start = from ?? interrupted ?? (animation ? el.getBoundingClientRect().height : wasOpen ? el.getBoundingClientRect().height : 0);
        interrupted = null;
        animation?.cancel();
        const end = open ? inner.getBoundingClientRect().height : 0;
        const finish = () => {
          if (disposed) return;
          el.style.height = open ? "auto" : "0px"; animation = null;
          retained.value = open;
        };
        if (reduced.value || start === end) { finish(); return; }
        el.style.height = end + "px";
        const transition = el.animate([{ height: start + "px" }, { height: end + "px" }], {
          duration: tokens.motion.collapse, easing: tokens.motion.easeOut,
        });
        animation = transition;
        transition.onfinish = finish;
      };
      if (open) retained.value = true;
      animate(wasOpen === open && !animation && interrupted === null ? lastHeight : undefined);
      const observer = new ResizeObserver(() => {
        const height = inner.getBoundingClientRect().height;
        if (open && height !== lastHeight) animate(animation ? undefined : lastHeight);
        lastHeight = height;
      });
      observer.observe(inner);
      dispose = () => {
        disposed = true; observer.disconnect();
        if (animation) {
          const height = el.getBoundingClientRect().height;
          interrupted = height;
          animation.cancel(); animation = null; el.style.height = height + "px";
        }
      };
    };
    onMounted(run);
    watch([() => props.open, reduced, present], run, { flush: "post" });
    onBeforeUnmount(() => dispose?.());
    return () => present() ? (
      <div ref={root} class="kjun-motion-collapse" inert={!props.open} aria-hidden={!props.open || undefined}>
        <div ref={body}>{slots.default?.()}</div>
      </div>
    ) : null;
  },
});
