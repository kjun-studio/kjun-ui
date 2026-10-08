"use client";
import { CatalogPreview } from './catalog-preview';
import type { ComponentName, PaletteName } from '../../../../shared/demo-config';
export { Choice } from './choice';
export function Playground({ component = 'button', initialPalette = 'default' }: {
  component?: ComponentName; initialPalette?: PaletteName;
}) {
  const name = { button: 'DsButton', input: 'DsInput', modal: 'DsModal' }[component];
  return <CatalogPreview name={name} detail initialPalette={initialPalette} legacyComponent={component}
    overrides={component === 'modal' ? { title: '변경 사항 저장', confirmText: '저장' } : {}} />;
}
