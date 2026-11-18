import type { ExampleControl, ExamplePreset } from './example-registry';
import type { GuideCase } from './visual-guides/types';
import type { PaletteName } from './demo-config';
import { demoPalettes } from './demo-colors.ts';

// Lists are panels on a page, like cards: their examples sit on the page colour so a section's surface and a group's
// rounded cards show (an open list puts its rows on the page itself, so it keeps the plain preview).
const listPreviews = ['KjunListSection', 'KjunListGroup', 'KjunListItem'];
// A bottom bar is a surface with a shadow, so its example also sits on the page colour.
const pagePreviews = ['KjunBottomNavigation'];
export function cardPreviewStyle(component: string, surface: unknown, palette: PaletteName, variant?: unknown) {
  if (pagePreviews.includes(component) || listPreviews.includes(component) && variant !== 'open') {
    const colors = demoPalettes[palette];
    return { background: palette === 'dark' ? colors.background : colors.secondary, minHeight: '100vh' };
  }
  if (component !== 'KjunCard') return undefined;
  const colors = demoPalettes[palette];
  return { background: surface === 'muted' ? colors.surface : palette === 'dark' ? colors.background : colors.secondary, minHeight: '100vh' };
}
export const cardControls: ExampleControl[] = [
  { key: 'design', label: '콘텐츠 구성', kind: 'choice', default: '정보', options: ['정보', '통계', '이미지', '테이블', '입력 폼', '액션만', '사용자 헤더', '링크'] },
  { key: 'surface', label: '표면', kind: 'choice', default: 'default', options: ['default', 'muted', 'accent', 'success', 'warning', 'danger', 'info', 'subtle', 'brand', 'brandSoft', 'glass'] },
  { key: 'padding', label: '영역 여백', kind: 'choice', default: 'md', options: ['none', 'sm', 'md', 'lg'] },
  { key: 'bodyPadding', label: '본문 여백', kind: 'choice', default: 'inherit', options: ['inherit', 'none', 'sm', 'md', 'lg'] },
  { key: 'radius', label: '모서리', kind: 'choice', default: 'md', options: ['none', 'sm', 'md', 'lg'] },
  { key: 'elevation', label: '그림자', kind: 'choice', default: 'flat', options: ['flat', 'raised'] },
  { key: 'border', label: '외곽 테두리', kind: 'boolean', default: false },
  { key: 'dividers', label: '영역 구분선', kind: 'boolean', default: false },
];
export const cardDesignExamples: GuideCase[] = [
  { id: 'card-information', label: '정보와 후속 행동', description: '제목·설명·본문·푸터를 같은 시작선에 맞춥니다. 내용과 관련된 행동은 푸터 버튼으로 제공합니다.', settings: { design: '정보' } },
  { id: 'card-statistic', label: '통계 요약', description: '제목 영역 없이 라벨(label·secondary), 수치(numberLg), 설명(caption·tertiary) 순으로 위계를 두고 진행 막대로 달성 현황을 보여 줍니다.', settings: { design: '통계', padding: 'sm', surface: 'muted', border: false } },
  { id: 'card-media', label: '이미지와 설명', description: '미디어는 카드 상단 모서리에 맞춰 자르고, 제목과 본문에는 독립적인 여백을 유지합니다.', settings: { design: '이미지', radius: 'lg', elevation: 'raised', border: false } },
  { id: 'card-table', label: '여백 없이 연결한 표', description: '본문에만 bodyPadding="none"을 적용합니다. 헤더와 푸터의 여백은 유지됩니다.', settings: { design: '테이블', bodyPadding: 'none', dividers: true } },
  { id: 'card-form', label: '입력 폼과 저장', description: '입력 필드와 저장 행동을 구분선으로 나눕니다. 프로젝트 이름을 수정하고 저장해 보세요.', settings: { design: '입력 폼', dividers: true } },
  { id: 'card-actions', label: '제목 없는 헤더 액션', description: '제목 없이 headerActions만 주면 본문과 같은 줄 끝에 둡니다. 화면이 좁아 본문이 160px보다 좁아지면 본문 위로 올라갑니다.', settings: { design: '액션만' }, viewportWidth: 375 },
  { id: 'card-custom-header', label: '사용자 헤더와 액션', description: '제목 영역을 배지로 교체하면서 headerActions를 함께 사용합니다.', settings: { design: '사용자 헤더', surface: 'subtle' } },
  { id: 'card-brand', label: '브랜드 표면', description: '브랜드 배경과 onBrand 전경을 함께 사용합니다. 안쪽 primary 버튼은 brandAction 역할(기본: onBrand 바탕·brand 글자)로 반전해 표면에 묻히지 않습니다. 실제 색상은 적용 앱이 지정합니다.', settings: { design: '정보', surface: 'brand', border: false, padding: 'lg' } },
  { id: 'card-glass', label: '반투명 표면', description: 'glassBg·glassBorder를 사용합니다. 외곽 테두리와 그림자는 각각 독립적으로 선택합니다. Web에서만 배경 흐림을 적용합니다.', settings: { design: '정보', surface: 'glass', elevation: 'raised' } },
  { id: 'card-border', label: '얇은 외곽선', description: '기본은 선 없이 표시합니다. border를 켜면 레이아웃 크기를 바꾸지 않고 안쪽에 0.5px 외곽선을 그립니다.', settings: { design: '정보', border: true } },
];
export const cardDesignPresets: ExamplePreset[] = cardDesignExamples.map(({ id, label, settings, viewportWidth }) => ({ id, label, settings, narrow: viewportWidth === 375 }));
