// frontend/src/components/design-system/data-display/_kpiFormat.js

export function resolveSemanticColor(value, semantic) {
  if (semantic !== 'price') return 'text-text-primary'
  if (value > 0) return 'text-price-up'
  if (value < 0) return 'text-price-down'
  return 'text-text-primary'
}

export function resolveSemanticColorForLight(value) {
  // delta-line(절대값/퍼센트)용: 부호로 색상 결정
  if (value > 0) return 'text-price-up'
  if (value < 0) return 'text-price-down'
  return 'text-text-tertiary'
}
