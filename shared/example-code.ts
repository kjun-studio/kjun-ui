import { foundationPreviewCss } from "./foundation-examples";
import type { PlatformName, PaletteName } from './demo-config';
import { demoPalettes, demoDomainPalettes, demoFont, cssColorName } from './demo-colors';
import type { Settings, Values } from './example-registry';
export interface ExampleSources { sources: Record<PlatformName, string>; events: boolean; controls: string[] }
export function copiedValues(values: Values): Values {
  // Messages are event history. Only JSON state owned by the example is exported.
  return Object.fromEntries(Object.entries(values).filter(([key]) => key !== 'message'));
}
export function exampleSource(template: string, platform: PlatformName, settings: Settings, values: Values) {
  const literal = (value: unknown) => JSON.stringify(value, null, 2).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  const iconName = String(settings.name || 'heart');
  if (template.includes('/* ICON_IMPORTS */') && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(iconName)) throw Error('Invalid icon import');
  const code = template.replace('/* ICON_IMPORTS */', () => `import selectedIcon from '@kjun-ui/icons/icons/${iconName}';\nconst projectIcons = { ${JSON.stringify(iconName)}: selectedIcon };`)
    .replace('/* ICON_PROVIDER */', platform === 'vue2' ? 'props: { icons: projectIcons }' : 'icons={projectIcons}').replace('__KJUN_SETTINGS__', () => literal(settings)).replace('__KJUN_VALUES__', () => literal(copiedValues(values)))
    .replace(/\/\* (?:PARAMS|PAGE_PARAMS|EXAMPLE_PROPS|OBSERVE|VUE_PROPS|VUE_OBSERVE) \*\//g, '')
    .replace('/* VUE_EXAMPLE_PROPS */', '{}');
  return platform === 'vue2' ? '<script>\n' + code + '</script>\n' : code;
}
export function exampleSetup(platform: PlatformName, palette: PaletteName) {
  if (platform === 'native') return `// Consuming app values; KJUN packages define roles only.\nexport const appColors = ${JSON.stringify(demoPalettes[palette], null, 2)};\nexport const appDomainColors = ${JSON.stringify(demoDomainPalettes[palette], null, 2)};\nexport const appFont = ${JSON.stringify(demoFont)};\n`;
  const colors = Object.entries({ ...demoPalettes[palette], ...demoDomainPalettes[palette] }).map(([role, value]) => `  ${cssColorName(role)}: ${value};`).join('\n');
  return foundationPreviewCss + `\n/* Consuming app colors and font. Install project fonts as described in /getting-started. */\n:root {\n${colors}\n  --kjun-font: ${demoFont};\n  font-family: var(--kjun-font);\n}\n.catalog-example { max-width: 760px; margin: 0 auto; min-width: 0; }\n.catalog-render { min-width: 0; }\n.catalog-stack { display: flex; flex-direction: column; gap: 16px; }\n.catalog-group { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }\n.catalog-example > output { display: block; margin-top: 12px; font-size: 12px; }\n`;
}
