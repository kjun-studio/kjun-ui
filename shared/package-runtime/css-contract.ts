import { coreColorRoles, domainColorRoles } from '@kjun/tokens';

const variable = (role: string) => '--kjun-' + role.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase());

function requireRoles(element: Element, roles: readonly string[], label: string) {
  const style = element.ownerDocument.defaultView!.getComputedStyle(element);
  const missing = roles.filter(role => !style.getPropertyValue(variable(role)).trim());
  if (missing.length) throw Error(`Missing KJUN CSS ${label}: ${missing.join(', ')}`);
}

/** Check app-owned bindings after the scope has entered the document. */
export function validateKjunCssScope(element: Element) {
  requireRoles(element, coreColorRoles, 'color roles');
  requireRoles(element, ['font'], 'font (--kjun-font)');
}

/** Financial colors are required only by components rendering domain expressions. */
export function validateKjunDomainCss(element: Element) {
  requireRoles(element, domainColorRoles, 'domain colors');
}

// A new callback checks the current branch and nearest CSS scope on each commit.
export const domainColorRef = (required: boolean) => required ? (element: Element | null) => {
  if (element) validateKjunDomainCss(element);
} : undefined;
