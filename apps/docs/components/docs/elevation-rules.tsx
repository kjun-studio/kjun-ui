'use client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './disclosure';

const rules = [
  {
    title: '새 Modal·Drawer',
    summary: '새 창이 열리면 이전 영역의 팝업을 닫고 배경 입력을 차단합니다.',
    detailTitle: '제어형 팝업의 상태 처리',
    detail: '메뉴·선택·검색 제안·Popover·Tooltip이 대상입니다. 제어형 상태 반영이 늦어도 표시와 입력을 차단하며, 새 창을 닫아도 이전 팝업을 자동으로 다시 열지 않습니다.',
  },
  {
    title: '팝업에서 새 창 열기',
    summary: '팝업은 닫히고 새 창이 유지됩니다. 창을 닫으면 원래 팝업 버튼으로 포커스가 돌아갑니다.',
    detailTitle: '상태 소유와 포커스 복귀',
    detail: '새 창의 상태와 컴포넌트는 팝업 바깥의 지속되는 소유 영역에 둡니다. 원래 팝업 트리거가 제거되면 살아 있는 상위 창으로 복귀합니다.',
  },
  {
    title: 'Escape·Tab',
    summary: 'Escape는 편집 중인 입력이 먼저 처리합니다. 처리되지 않은 Escape만 최상위 영역 하나를 닫고, Tab은 현재 활성 범위에서 이동합니다.',
    detailTitle: '한글 등 조합 입력 중의 처리',
    detail: 'IME 조합 입력을 보존합니다. 편집 중인 입력이 Escape를 처리했다면 같은 키 입력으로 상위 팝업이나 창까지 함께 닫지 않습니다.',
  },
  {
    title: '중첩 창',
    summary: '안쪽 창을 닫으면 바깥 창이 다시 활성화되고, 안쪽 창을 열었던 버튼으로 포커스가 돌아갑니다.',
    detailTitle: '중첩 Provider의 창 순서',
    detail: 'Provider의 색상·서체 범위가 달라도 활성 창의 순서는 공유합니다. 하위 창을 닫을 때 상위 창은 유지합니다.',
  },
  {
    title: '긴 본문·배경 CTA',
    summary: '열린 창의 본문만 스크롤합니다. 배경의 하단 CTA는 창을 닫은 뒤 다시 사용할 수 있습니다.',
    detailTitle: '본문 밖으로 나오는 팝업',
    detail: '팝업은 Provider의 호스트에서 렌더링하여 모달 본문의 overflow에 잘리지 않습니다. 배경 화면의 입력은 차단합니다.',
  },
  {
    title: 'Toast',
    summary: '활성 창이 바뀌어도 알림의 남은 시간과 행동을 유지합니다.',
    detailTitle: 'Toast의 표시 위치와 그림자',
    detail: 'Toast는 활성 창으로 이동합니다. flat 역할을 유지하며, 앞에 표시하기 위해 그림자를 추가하지 않습니다.',
  },
];

export function ElevationRules() {
  return <ul className="elevation-rules">
    {rules.map(rule => <li key={rule.title}>
      <h3>{rule.title}</h3>
      <div>
        <p className="elevation-rule-summary">{rule.summary}</p>
        <Collapsible className="elevation-rule-detail">
          <CollapsibleTrigger suffixIcon="chevron-down">{rule.detailTitle}</CollapsibleTrigger>
          <CollapsibleContent><p>{rule.detail}</p></CollapsibleContent>
        </Collapsible>
      </div>
    </li>)}
  </ul>;
}
