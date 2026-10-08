import { palette, cssPalette } from './typography-values';
export type CardPaletteMode = 'initial' | 'changed' | 'fallback';
export function cardPalette(mode: CardPaletteMode = 'initial') {
  const colors: ReturnType<typeof palette> & { onBrand?: string } = { ...palette(mode === 'changed'), inverse: '#334455' };
  if (mode === 'fallback') delete (colors as { onBrand?: string }).onBrand;
  return colors;
}
export function applyCardPalette(mode: CardPaletteMode = 'initial') {
  cssPalette(mode === 'changed');
  document.documentElement.style.setProperty('--kjun-inverse', '#334455');
  if (mode === 'fallback') document.documentElement.style.removeProperty('--kjun-on-brand');
}
export const longCardTitle = 'InternationalPortfolioPerformanceSummary2026';
