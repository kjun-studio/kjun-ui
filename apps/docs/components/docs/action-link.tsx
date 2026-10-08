'use client';
import type { ComponentProps } from 'react';
import { tokens } from '@kjun/tokens';
import Link from './doc-link';

// Preserve native navigation (copy URL / open in a new tab) with shared geometry.
export function ActionLink({ variant = 'primary', size = 'lg', ...props }: ComponentProps<typeof Link> & { variant?: 'primary' | 'secondary'; size?: 'md' | 'lg' }) {
  const type = tokens.button.typography[size];
  return <Link {...props} className="docs-action-link" data-variant={variant} style={{
    height: tokens.button.heights[size],
    minWidth: tokens.button.minWidths[size],
    paddingInline: tokens.button.paddingX[size],
    borderRadius: tokens.button.radii[size],
    fontSize: type.fontSizePx,
    lineHeight: `${type.lineHeightPx}px`,
    fontWeight: type.fontWeight,
    letterSpacing: `${type.letterSpacingEm}em`,
  }} />;
}
