import { tokens } from '@kjun-ui/tokens';

const properties = [...tokens.colorRoles, ...tokens.domainColorRoles, 'font', 'fontNumeric']
  .map(role => '--kjun-' + role.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase()));

/** Keep nested overlays outside inert/clipped windows without losing their project styling. */
export function createPortalScope(source: HTMLElement, parent: HTMLElement) {
  const document = source.ownerDocument, view = document.defaultView!;
  const element = document.createElement('div');
  element.className = 'kjun-scope';
  element.setAttribute('data-kjun-layer-host', '');
  let frame = 0;
  const sync = () => {
    const style = view.getComputedStyle(source);
    for (const name of properties) {
      // An absent optional role must use this scope's fallback, not an outer override.
      const value = style.getPropertyValue(name).trim() || 'initial';
      if (element.style.getPropertyValue(name) !== value) element.style.setProperty(name, value);
    }
    element.dir = style.direction;
  };
  const schedule = () => {
    if (!frame) frame = view.requestAnimationFrame(() => { frame = 0; sync(); });
  };
  const observer = new MutationObserver(records => {
    if (records.some(record => document.head.contains(record.target) ||
      (record.target instanceof Element && record.target.contains(source)))) schedule();
  });
  sync();
  parent.appendChild(element);
  observer.observe(document.documentElement, { attributes: true, childList: true, characterData: true, subtree: true });
  view.addEventListener('resize', schedule);
  const scheme = view.matchMedia('(prefers-color-scheme: dark)');
  scheme.addEventListener('change', schedule);
  return { element, sync, destroy() {
    observer.disconnect();
    view.cancelAnimationFrame(frame);
    view.removeEventListener('resize', schedule);
    scheme.removeEventListener('change', schedule);
    element.remove();
  } };
}
