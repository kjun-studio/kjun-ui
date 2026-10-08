import { tokens, type ButtonSize, type InputSize, type TypographyRole, type TypographyToken } from '@kjun/tokens';

/** CSS em tracking is converted to the logical units consumed by Native Text. */
export function typeStyle(role: TypographyRole | TypographyToken) {
  const t = typeof role === "string" ? tokens.typography[role] : role;
  return {
    fontSize: t.fontSizePx,
    lineHeight: t.lineHeightPx,
    fontWeight: `${t.fontWeight}` as '400' | '500' | '600' | '700',
    letterSpacing: t.fontSizePx * t.letterSpacingEm,
  };
}

export function selectionTypeStyle(size: ButtonSize, active: boolean) {
  return { ...typeStyle(tokens.button.typography[size]),
    fontWeight: typeStyle(active ? tokens.button.typography[size] : 'label').fontWeight };
}

export function inputTypeStyle(size: InputSize) {
  const spec = tokens.input[size], t = tokens.typography.input;
  return { ...typeStyle('input'), fontSize: spec.fontSize, lineHeight: spec.lineHeight, letterSpacing: spec.fontSize * t.letterSpacingEm };
}
