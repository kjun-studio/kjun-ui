import type { ShadowLayer } from '@kjun/tokens';
export function directionalShadow(layers: readonly ShadowLayer[], direction: 'left' | 'right' | 'top' | 'bottom'): ShadowLayer[] {
  return layers.map(layer => ({ ...layer,
    offsetX: direction === 'left' ? layer.offsetY : direction === 'right' ? -layer.offsetY : layer.offsetX,
    offsetY: direction === 'bottom' ? -layer.offsetY : direction === 'top' ? layer.offsetY : layer.offsetX,
  }));
}

export function shadowLayers<Color>(layers: readonly ShadowLayer[], colors: Record<ShadowLayer['colorRole'], Color>) {
  return layers.map(({ colorRole, ...layer }) => ({ ...layer, color: colors[colorRole] }));
}
