import { tokens, type ButtonSize, type InputSize, type TypographyRole, type TypographyToken } from '@kjun-ui/tokens';

export function typeStyle(role: TypographyRole | TypographyToken) {
  const t = typeof role === "string" ? tokens.typography[role] : role;
  return {
    fontSize: t.fontSizePx / 16 + 'rem',
    lineHeight: t.lineHeightPx / 16 + 'rem',
    fontWeight: t.fontWeight,
    letterSpacing: t.letterSpacingEm + 'em',
  };
}

export function selectionTypeStyle(size: ButtonSize, active: boolean) {
  return { ...typeStyle(tokens.button.typography[size]),
    fontWeight: active ? tokens.button.typography[size].fontWeight : tokens.typography.label.fontWeight };
}

export function inputTypeStyle(size: InputSize) {
  const spec = tokens.input[size], t = tokens.typography.input;
  return { ...typeStyle('input'), fontSize: spec.fontSize / 16 + 'rem', lineHeight: spec.lineHeight / 16 + 'rem', letterSpacing: t.letterSpacingEm + 'em' };
}
