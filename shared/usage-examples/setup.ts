import { demoPalettes, demoDomainPalettes, demoFont, cssColorName } from '../demo-colors';
import type { PlatformName, PaletteName } from '../demo-config';
import type { UsageExample } from './builder';
import { literal } from './builder';
export interface SetupFile { name: string; code: string }
export function usageSetupAdditions(platform: PlatformName, palette: PaletteName) {
  const native = platform === 'native';
  return {
    feedback: {
      imports: `import { KjunFeedbackProvider } from "@kjun/${platform}";`,
      registration: platform === 'vue2' ? 'KjunFeedbackProvider,' : '',
      content: '<KjunFeedbackProvider>\n  <Example />\n</KjunFeedbackProvider>',
    },
    domainColors: {
      file: {
        name: native ? 'kjun.js' : 'kjun.css',
        code: native ? `export const appDomainColors = ${literal(demoDomainPalettes[palette])};\n`
          : `:root {\n${colorDeclarations(demoDomainPalettes[palette])}\n}\n`,
      },
      imports: native ? 'import { appDomainColors } from "./kjun";' : '',
      prop: native ? 'domainColors={appDomainColors}' : '',
    },
  };
}

export function usageSetup(platform: PlatformName, palette: PaletteName, usage: Pick<UsageExample, 'domainColors' | 'feedback'>): SetupFile[] {
  const additions = usageSetupAdditions(platform, palette);
  const feedbackImport = usage.feedback ? additions.feedback.imports + '\n' : '';
  const content = usage.feedback ? additions.feedback.content : '<Example />';
  const domainCode = usage.domainColors ? '\n' + additions.domainColors.file.code : '';
  if (platform === 'vue2') return [
    { name: 'App.vue', code: `<template>\n  <KjunProvider>\n${indent(content, 4)}\n  </KjunProvider>\n</template>\n\n<script>\nimport { KjunProvider } from "@kjun/vue2";\n${feedbackImport}import Example from "./Example.vue";\nimport "@kjun/vue2/styles.css";\nimport "./kjun.css";\n\nexport default {\n  components: { KjunProvider, ${usage.feedback ? additions.feedback.registration + ' ' : ''}Example },\n};\n</script>\n` },
    { name: 'kjun.css', code: css(palette) + domainCode },
  ];
  const native = platform === 'native';
  const domainImport = native && usage.domainColors ? additions.domainColors.imports + '\n' : '';
  const domainProp = native && usage.domainColors ? ' ' + additions.domainColors.prop : '';
  return [
    { name: 'App.jsx', code: `import { KjunProvider } from "@kjun/${platform}";\n${feedbackImport}import Example from "./Example.jsx";\n${native ? 'import { appColors, appFont } from "./kjun";' : 'import "@kjun/react/styles.css";\nimport "./kjun.css";'}\n${domainImport}\nexport default function App() {\n  return (\n    <KjunProvider${native ? ' colors={appColors} fontFamily={appFont}' + domainProp : ''}>\n${indent(content, 6)}\n    </KjunProvider>\n  );\n}\n` },
    { name: native ? 'kjun.js' : 'kjun.css', code: (native ? `// 적용 프로젝트가 정하는 색상·서체 값입니다.\nexport const appColors = ${literal(demoPalettes[palette])};\n// 시스템 글꼴을 사용합니다. 사용자 정의 폰트는 로드한 이름으로 지정합니다.\nexport const appFont = undefined;\n` : css(palette)) + domainCode },
  ];
}
function indent(code: string, spaces: number) {
  return code.split('\n').map(line => ' '.repeat(spaces) + line).join('\n');
}
function colorDeclarations(colors: Record<string, string>) {
  return Object.entries(colors).map(([role, value]) => `  ${cssColorName(role)}: ${value};`).join('\n');
}
function css(palette: PaletteName) {
  return `/* 적용 프로젝트가 정하는 색상·서체 값입니다. */\n:root {\n${colorDeclarations(demoPalettes[palette])}\n  --kjun-font: ${demoFont};\n  font-family: var(--kjun-font);\n}\n`;
}
