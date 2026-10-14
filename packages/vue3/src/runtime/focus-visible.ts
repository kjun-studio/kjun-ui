import { onBeforeUnmount, onMounted, ref } from "vue";
import { installFocusVisible, isFocusVisible } from "../../../../shared/package-runtime/focus-visible";

/** react-aria's data-focus-visible: true while focus arrived from the keyboard. Bind the handlers to the focusable element. */
export function useFocusVisible() {
  const visible = ref(false);
  let uninstall: (() => void) | undefined;
  onMounted(() => { uninstall = installFocusVisible(document); });
  onBeforeUnmount(() => uninstall?.());
  return {
    visible,
    onFocus: () => { visible.value = isFocusVisible(); },
    onBlur: () => { visible.value = false; },
  };
}
