import { tokens } from '@kjun/tokens';

export function typeStyle(role) {
  const t = typeof role === 'string' ? tokens.typography[role] : role;
  return { fontSize: t.fontSizePx / 16 + 'rem', lineHeight: t.lineHeightPx / 16 + 'rem',
    fontWeight: t.fontWeight, letterSpacing: t.letterSpacingEm + 'em' };
}

export function selectionTypeStyle(size, active) {
  return { ...typeStyle(tokens.button.typography[size]),
    fontWeight: active ? tokens.button.typography[size].fontWeight : tokens.typography.label.fontWeight };
}
