// Time segment lists open with the selected value in the middle, so the values on both sides stay in view.
export function centerSelectedOption(list: HTMLElement | null | undefined) {
  const option = list?.querySelector<HTMLElement>('[aria-selected="true"]');
  if (!list || !option) return;
  list.scrollTop = option.offsetTop - (list.clientHeight - option.offsetHeight) / 2;
}
