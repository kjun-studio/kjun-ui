/** How long a copy button shows its success state before it can copy again. */
export const copyFeedbackDuration = 1500;

/** Web copy: the async Clipboard API in secure contexts, else a hidden textarea and execCommand. */
export async function browserCopy(value: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const previous = document.activeElement as HTMLElement | null,
    ta = document.createElement("textarea");
  ta.value = value;
  ta.style.cssText = "position:fixed;left:-9999px;top:-9999px";
  document.body.append(ta);
  ta.select();
  try {
    if (!document.execCommand("copy")) throw Error("Clipboard copy failed");
  } finally {
    ta.remove();
    previous?.focus();
  }
}

/** True for a handler result that settles later, so a control can stay busy until it does. */
export function isPending(result: unknown): result is PromiseLike<unknown> {
  return !!result && typeof (result as PromiseLike<unknown>).then === "function";
}
