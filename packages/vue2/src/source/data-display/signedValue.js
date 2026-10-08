export function finiteSignedValue(value) {
  if (value == null || typeof value === 'boolean' || (typeof value === 'string' && !value.trim())) return null
  if (typeof value !== 'number' && typeof value !== 'string') return null
  const number = Number(value)
  return Number.isFinite(number) ? (Object.is(number, -0) ? 0 : number) : null
}
