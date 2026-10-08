export async function copyCode(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  // HTTP previews do not expose the Clipboard API. Restore the reader's focus
  // and selection after using the browser's legacy copy command.
  const previous = document.activeElement as HTMLElement | null;
  const selection = document.getSelection();
  const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index).cloneRange()) : [];
  const field = document.createElement('textarea');
  field.value = text;
  field.readOnly = true;
  field.tabIndex = -1;
  field.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;font-size:16px';
  (previous?.closest<HTMLElement>('[role="dialog"]') || document.body).appendChild(field);
  try {
    field.focus({ preventScroll: true });
    field.select();
    if (!document.execCommand('copy')) throw Error('Clipboard copy failed');
  } finally {
    field.remove();
    previous?.focus({ preventScroll: true });
    if (selection) {
      selection.removeAllRanges();
      for (const range of ranges) selection.addRange(range);
    }
  }
}
