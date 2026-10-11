export function resolveSemanticColor(value, semantic) {
  if (semantic !== 'price') return 'kj-text-text-primary'
  if (value > 0) return 'kj-text-price-up'
  if (value < 0) return 'kj-text-price-down'
  return 'kj-text-text-primary'
}

export function resolveSemanticColorForLight(value) {
  // delta-line(절대값/퍼센트)용: 부호로 색상 결정
  if (value > 0) return 'kj-text-price-up'
  if (value < 0) return 'kj-text-price-down'
  return 'kj-text-text-tertiary'
}
