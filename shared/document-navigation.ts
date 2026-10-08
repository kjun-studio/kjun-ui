export interface DocumentSectionGroup { id: string; title: string; sections: string[] }
export interface GuideTopic {
  id: string; path: string; title: string; description: string;
  aliases: string[]; useCases: string[]; sections: [string, string][];
}

// One owner and one canonical destination for every existing guide section.
export const guideTopics: GuideTopic[] = [
  {
    id: 'usage-forms', path: '/usage-guide/forms', title: '폼·입력',
    description: '입력 항목과 선택 도구를 연결하고 저장·검증 흐름을 구성합니다.',
    aliases: ['입력 폼', '선택 기준', '버튼 배치', '취소 버튼', '긴 한국어 라벨'],
    useCases: ['저장 폼', '입력 검증', '수량 입력', '분할 선택'],
    sections: [['form', '설정 폼'], ['selection', '선택 입력 비교'], ['input-settings', '시간·수량·범위'],
      ['segmented-selection', '분할 선택'], ['action-placement', '주요·취소 버튼 배치'],
      ['long-labels', '긴 한국어 라벨'], ['field-errors', '오류 메시지 위치']],
  },
  {
    id: 'usage-data', path: '/usage-guide/data', title: '조회·목록',
    description: '검색과 목록을 구성하고 로딩·갱신·빈 결과·조회 실패를 구분합니다.',
    aliases: ['목록 구성', '검색 툴바', '데이터 조회', '빈 결과', '조회 실패', '보조 버튼'],
    useCases: ['자산 목록', '범용 목록', '검색 결과', '목록 갱신'],
    sections: [['toolbar', '검색 툴바'], ['generic-lists', '범용 목록'], ['assets', '자산 목록'],
      ['thumbnail', 'Thumbnail'], ['loading', '로딩 비교'], ['row-actions', '행의 보조 버튼'],
      ['refresh-context', '갱신 중 화면 유지'], ['empty-vs-error', '빈 결과와 조회 실패']],
  },
  {
    id: 'usage-mobile', path: '/usage-guide/mobile', title: '모바일 배치',
    description: '좁은 화면에서 본문·하단 행동·키보드와 패널의 공간을 나눕니다.',
    aliases: ['모바일 화면', '하단 배치', '안전 영역', '키보드 배치', 'BottomSheet'],
    useCases: ['하단 CTA', '모바일 스크롤', '하단 Drawer'],
    sections: [['app-screen', '모바일 화면 구성'], ['bottom-cta-layout', '하단 CTA와 본문'],
      ['keyboard-layout', '키보드 표시 시 배치'], ['bottom-sheet', '하단 Drawer']],
  },
  {
    id: 'usage-feedback', path: '/usage-guide/feedback', title: '피드백·문구',
    description: '상황에 맞는 레이어와 알림을 고르고 다음 행동을 명확하게 안내합니다.',
    aliases: ['레이어 선택', '알림 비교', 'UX writing', '문구 작성', '삭제 확인 문구'],
    useCases: ['삭제 확인', '버튼 문구', '오류 메시지', '빈 상태 문구'],
    sections: [['layers', '레이어 비교'], ['feedback', '알림 비교'],
      ['delete-confirmation', '삭제 확인'], ['writing', '문구 작성 원칙']],
  },
];

export function guideTopicForSection(section: string) {
  return guideTopics.find(topic => topic.sections.some(([id]) => id === section));
}
export function usageGuideHref(section: string) {
  const topic = guideTopicForSection(section);
  if (!topic) throw Error('Unknown usage guide section: ' + section);
  return topic.path + '#' + section;
}
export function legacyGuideDestination(path: string, search: string, hash: string) {
  if (path !== '/usage-guide' || !hash) return null;
  let section: string;
  try { section = decodeURIComponent(hash.slice(1)); } catch { return null; }
  const topic = guideTopicForSection(section);
  return topic ? topic.path + search + hash : null;
}

export function detailSectionGroups(designs: string[] = [], examples: string[] = []): DocumentSectionGroup[] {
  return [
    { id: 'usage', title: '사용법', sections: ['preview', 'guidelines', 'usage'] },
    { id: 'design', title: '디자인', sections: [...examples, 'anatomy', 'states', ...designs] },
    { id: 'api', title: 'API', sections: ['api'] },
    { id: 'accessibility', title: '접근성', sections: ['accessibility'] },
  ];
}
