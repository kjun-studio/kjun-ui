import { onMounted, ref, watch } from "vue";
import { skeletonPhase } from "../../../shared/package-runtime/skeleton-text";
/** Like React: puts a skeleton on the shared pulse clock once it mounts, so skeletons that appear later still pulse together. */
export function useSkeletonPhase(active: () => boolean = () => true) {
  const el = ref<HTMLElement | null>(null);
  const apply = () => { if (active()) el.value?.style.setProperty("--_kjun-skeleton-delay", skeletonPhase()); };
  onMounted(apply);
  watch(active, apply);
  return el;
}
