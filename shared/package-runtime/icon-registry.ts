import { defaultIcons } from '@kjun/icons/defaults';
import type { KjunIconRegistry } from '@kjun/icons';

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
export function resolveIcon(registry: KjunIconRegistry, name: string, filled = false) {
  const definition = Object.prototype.hasOwnProperty.call(registry, name) ? registry[name] : undefined;
  const filledNodes = filled && definition?.filled;
  return { nodes: filledNodes || definition?.outline || registry['help-circle']?.outline || defaultIcons['help-circle'].outline, filled: !!filledNodes };
}
