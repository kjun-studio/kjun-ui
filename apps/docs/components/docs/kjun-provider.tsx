'use client';
import { KjunProvider } from '@kjun/react';
import { tokens } from '@kjun/tokens';
import type { CSSProperties, ReactNode } from 'react';

export function DocsKjunProvider({ children }: { children: ReactNode }) {
  return <KjunProvider className="docs-kjun" style={Object.fromEntries([
    ...Object.entries(tokens.dimension).map(([key, value]) => [`--docs-${key}`, `${value}px`]),
    ...Object.entries(tokens.radius).map(([key, value]) => [`--docs-${key}`, `${value}px`]),
  ]) as CSSProperties}>{children}</KjunProvider>;
}
