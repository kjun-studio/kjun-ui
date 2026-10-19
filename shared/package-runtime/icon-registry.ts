import { defaultIcons } from '@kjun-ui/icons/defaults';
import type { KjunIconRegistry } from '@kjun-ui/icons';

export { defaultIcons };
export function mergeIcons(parent: KjunIconRegistry, own?: KjunIconRegistry): KjunIconRegistry {
  if (!own || !Object.keys(own).length) return parent;
  const result = { ...parent };
  for (const [name, definition] of Object.entries(own)) {
    const inherited = Object.prototype.hasOwnProperty.call(parent, name) ? parent[name] : undefined;
    Object.defineProperty(result, name, { enumerable: true, configurable: true, writable: true,
      value: { outline: definition.outline ?? inherited?.outline,
        ...((definition.filled ?? inherited?.filled) ? { filled: definition.filled ?? inherited?.filled } : {}) } });
  }
  return result;
}
/** Adds component-owned icons without overriding a project's registration. */
export function withFallbackIcons(registry: KjunIconRegistry, fallbacks: KjunIconRegistry): KjunIconRegistry {
  return mergeIcons(fallbacks, registry);
}
const warnedIcons = new Set<string>();
declare const process: { env: { NODE_ENV?: string } };
// Development builds name a missing registration once; production stays silent and keeps the fallback.
// The literal process.env.NODE_ENV is what bundlers replace; with no replacement and no process object
// the mode is unknown, so stay silent.
function developmentMode() {
  try { return !!process.env.NODE_ENV && process.env.NODE_ENV !== "production"; } catch { return false; }
}
function warnMissingIcon(name: string) {
  if (!developmentMode() || warnedIcons.has(name)) return;
  warnedIcons.add(name);
  console.warn(`KJUN Icon: "${name}" 아이콘이 등록되지 않아 help-circle로 대신합니다. @kjun-ui/icons/icons/${name}를 import해 KjunProvider의 icons에 등록하세요.`);
}
export function resolveIcon(registry: KjunIconRegistry, name: string, filled = false) {
  const definition = Object.prototype.hasOwnProperty.call(registry, name) ? registry[name] : undefined;
  if (!definition && name) warnMissingIcon(name);
  const filledNodes = filled && definition?.filled;
  return { nodes: filledNodes || definition?.outline || registry['help-circle']?.outline || defaultIcons['help-circle'].outline, filled: !!filledNodes };
}
