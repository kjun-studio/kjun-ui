// Keyboard focus shows a ring; pointer focus does not. Tracks the last input modality across the
// document, like react-aria's focus-visible: focus before any interaction counts as keyboard.
type Modality = "keyboard" | "pointer" | null;
let modality: Modality = null, installs = 0;
const onKey = (event: KeyboardEvent) => {
  if (event.metaKey || event.altKey || event.ctrlKey || ["Control", "Shift", "Meta", "Alt"].includes(event.key)) return;
  modality = "keyboard";
};
const onPointer = () => { modality = "pointer"; };
const events = ["pointerdown", "mousedown", "touchstart"] as const;

export function installFocusVisible(document: Document) {
  if (installs++ === 0) {
    document.addEventListener("keydown", onKey, true);
    for (const type of events) document.addEventListener(type, onPointer, true);
  }
  return () => {
    if (--installs > 0) return;
    document.removeEventListener("keydown", onKey, true);
    for (const type of events) document.removeEventListener(type, onPointer, true);
    modality = null;
  };
}
export const isFocusVisible = () => modality !== "pointer";
