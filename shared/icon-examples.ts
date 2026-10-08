import { tokens } from '@kjun-ui/tokens';
import { icons, filledIcons } from '@kjun-ui/tokens/icons';
import type { ExampleControl } from './example-registry';
import type { GuideCase } from './visual-guides/types';
import type { IconSelection } from './icon-catalog';
export const iconSizeValues: number[] = Object.values(tokens.iconSizes);
export const iconExampleNames = ['GuideIconSelection', 'GuideIconAlignment', 'GuideIconVariants'];
export const iconControls: Record<string, ExampleControl[]> = {
  GuideIconSelection: [
    { key: 'name', label: '아이콘 이름', kind: 'text', default: 'heart' },
    { key: 'size', label: '아이콘 크기', kind: 'number', default: tokens.iconSizes.default, min: Math.min(...Object.values(tokens.iconSizes)), max: Math.max(...Object.values(tokens.iconSizes)) },
    { key: 'filled', label: '채움형', kind: 'boolean', default: false },
  ],
};
export const iconSelectionScenario = (selection: IconSelection): GuideCase => ({
  id: 'icons-selection', label: '현재 크기 미리보기',
  description: '선택한 플랫폼의 실제 크기와 형태입니다.',
  settings: { ...selection },
});
export const iconScenarios = [
  { name: 'GuideIconAlignment', destination: '/components/icon#api', scenario: {
    id: 'icons-alignment', label: '크기와 텍스트 정렬 비교',
    description: '여섯 크기와 텍스트·Button 배치를 비교하세요. 웹에서는 글자 크기를 바꾸어 기본 1em과 명시한 크기의 차이를 확인합니다.',
    values: { largeText: false },
  } },
  { name: 'GuideIconVariants', destination: '/components/icon#states', scenario: {
    id: 'icons-variants', label: '선형과 채움형 비교', description: 'heart·star의 두 형태와 선형·이름 대체 동작을 비교합니다.',
  } },
  { name: 'DsIconToggle', destination: '/components/icon-toggle', scenario: {
    id: 'icons-toggle', label: '지속적인 선택 · IconToggle', description: '버튼을 눌러 선택값과 접근성 상태를 함께 바꿉니다.', settings: { usage: '즐겨찾기' },
  } },
] satisfies { name: string; destination: string; scenario: GuideCase }[];
export const iconValidationSelections = [
  ...Object.keys(icons).sort().map(name => ({ name, size: tokens.iconSizes.default, filled: false })),
  ...Object.values(tokens.iconSizes).flatMap(size => Object.keys(filledIcons).map(name => ({ name, size, filled: true }))),
];
