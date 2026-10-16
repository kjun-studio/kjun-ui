import { onBeforeUnmount, ref, watch } from "vue";

/** The Vue form of shared/package-runtime/use-loading-reveal: true once a loading state has lasted `delay` ms. */
export function useLoadingReveal(active: () => boolean, delay: () => number) {
  const revealed = ref(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  watch([active, delay], ([isActive, wait]) => {
    clearTimeout(timer);
    revealed.value = false;
    if (isActive && wait > 0) timer = setTimeout(() => { revealed.value = true; }, wait);
  }, { immediate: true });
  onBeforeUnmount(() => clearTimeout(timer));
  return () => delay() <= 0 || revealed.value;
}
