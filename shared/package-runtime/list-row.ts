// What a list row is, shared by every platform. A switch row (checked given) wins over href and onClick; a row given
// `selected` (true or false) is one choice in a single-choice list and reads as a radio.
export type ListRowKind = "switch" | "radio" | "link" | "button" | "static";
export function listRowKind({ checked, selected, href, pressable }: { checked?: boolean; selected?: boolean; href?: string; pressable: boolean }): ListRowKind {
  if (checked !== undefined) return "switch";
  if (selected !== undefined && (pressable || !!href)) return "radio";
  if (href) return "link";
  return pressable ? "button" : "static";
}

const developmentMode = () => { try { return !!process.env.NODE_ENV && process.env.NODE_ENV !== "production"; } catch { return false; } };
let warned = false;
/** One development warning when a row is given props that cannot apply together. */
export function warnListRowProps({ checked, selected, href, chevron }: { checked?: boolean; selected?: boolean; href?: string; chevron?: boolean }) {
  if (warned || !developmentMode()) return;
  const clash = checked !== undefined && (href || selected !== undefined || chevron);
  if (!clash) return;
  warned = true;
  console.warn("KJUN ListRow: a switch row (checked) ignores href, selected and chevron; give each row one role.");
}
