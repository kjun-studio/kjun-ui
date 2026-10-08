import type { ExampleControl, ExamplePreset, Settings } from './example-registry';
import type { GuideCase } from './visual-guides/types';
import { tableProjectRows } from '../previews/catalog/example-tools.ts';

export const tableControls: ExampleControl[] = [
  { key: 'design', label: '데이터 구성', kind: 'choice', default: '기본', options: ['기본', '문서 목록', '프로젝트', '수치 비교'] },
  { key: 'compact', label: '촘촘한 행', kind: 'boolean', default: false },
  { key: 'striped', label: '줄무늬', kind: 'boolean', default: false },
  { key: 'hoverable', label: '행 강조', kind: 'boolean', default: true },
  { key: 'stickyHeader', label: '고정 헤더', kind: 'boolean', default: false },
];
const base: Settings = { selectable: false, expandable: false, searchable: false, responsive: 'none' };
export const tableDesignExamples: GuideCase[] = [
  { id: 'table-simple', label: '간결한 목록', description: '문서 이름과 분류, 작성자, 수정일을 비교합니다. 선택 도구 없이 읽기에 집중하는 구성입니다.', settings: { ...base, design: '문서 목록', hoverable: false } },
  { id: 'table-dense', label: '촘촘한 줄무늬 표', description: '여러 행을 빠르게 훑는 관리 화면에 사용합니다. 행 간격을 줄이고 교차 배경으로 읽던 행을 구분합니다.', settings: { ...base, design: '문서 목록', compact: true, striped: true } },
  { id: 'table-projects', label: '상태·진행률·행별 작업', description: '프로젝트 상태는 배지, 진행률은 막대, 예산은 우측 정렬 숫자로 표시합니다. 보기 버튼으로 해당 행을 확인하세요.', settings: { ...base, design: '프로젝트' } },
  { id: 'table-metrics', label: '수치 비교', description: '주문 수와 매출, 증감률과 목표 달성을 한눈에 비교합니다. 열 제목을 누르면 수치 순서로 정렬됩니다.', settings: { ...base, design: '수치 비교', striped: true } },
  { id: 'table-selection', label: '일괄 선택', description: '선택한 행에 대한 작업을 표 위에 모읍니다. 체크박스로 항목을 추가하거나 선택을 해제해 보세요.', settings: { ...base, design: '프로젝트', selectable: true }, values: { selected: [tableProjectRows[0]] } },
  { id: 'table-expansion', label: '행 안에서 상세 펼치기', description: '요약은 표에 남기고 일정과 작업 메모를 펼쳐 봅니다. 첫 번째 행을 펼친 상태로 시작합니다.', settings: { ...base, design: '프로젝트', expandable: true }, values: { expanded: ['p1'] } },
  { id: 'table-sticky', label: '고정 헤더와 긴 목록', description: '높이가 정해진 영역에서 목록만 스크롤합니다. 열 제목은 위에 남아 각 값의 의미를 확인할 수 있습니다.', settings: { ...base, design: '문서 목록', compact: true, striped: true, stickyHeader: true } },
  { id: 'table-cards', label: '모바일 카드 · 375px', description: '같은 프로젝트 데이터를 제목·상태·담당자·진행 현황으로 나눕니다. 행별 작업은 카드 하단에 둡니다.', settings: { ...base, design: '프로젝트', responsive: 'card' }, viewportWidth: 375 },
];
export const tableDesignPresets: ExamplePreset[] = tableDesignExamples.map(({ id, label, settings, values, viewportWidth }) => ({ id, label, settings, values, narrow: viewportWidth === 375 }));
