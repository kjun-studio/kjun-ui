import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { tokens } from "@kjun-ui/tokens";

export function useReducedMotion() {
  const reduced = ref(typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches);
  let media: MediaQueryList | undefined;
  const update = (event: MediaQueryListEvent) => { reduced.value = event.matches; };
  onMounted(() => { media = matchMedia("(prefers-reduced-motion: reduce)"); reduced.value = media.matches; media.addEventListener("change", update); });
  onBeforeUnmount(() => media?.removeEventListener("change", update));
  return reduced;
}

/** Only presentation is delayed. The caller's value and event timing stay synchronous. */
export function usePresence(open: () => boolean, reduced: () => boolean, exitDuration: number = tokens.motion.layerExit) {
  const retained = ref(open()), active = ref(false);
  let mounted = false, first = 0, second = 0, timer: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => { cancelAnimationFrame(first); cancelAnimationFrame(second); clearTimeout(timer); };
  watch([open, reduced], ([isOpen, isReduced]) => {
    cancel();
    if (isOpen) {
      retained.value = true;
      if (isReduced || mounted) active.value = true;
      else first = requestAnimationFrame(() => { second = requestAnimationFrame(() => { active.value = true; }); });
      mounted = true;
    } else {
      active.value = false;
      const finish = () => { mounted = false; retained.value = false; };
      if (isReduced) finish(); else timer = setTimeout(finish, exitDuration);
    }
  }, { immediate: true, flush: "sync" });
  onBeforeUnmount(cancel);
  return { present: () => open() || retained.value, active: () => open() && active.value };
}
