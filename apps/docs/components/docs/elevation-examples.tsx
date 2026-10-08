'use client';
import { useState } from 'react';
import { DsButton, DsCard, DsPopover, DsModal, DsDrawer, DsTooltip, KjunProvider, KjunFeedbackProvider, useKjunFeedback } from '@kjun-ui/react';
import tokens from '@/lib/generated/tokens.json';

// floating is not a Card role, so the static sample borrows the ambient shadow from the token data.
const floatingShadow = tokens.shadowScale.ambient
  .map(s => `${s.offsetX}px ${s.offsetY}px ${s.blurRadius}px ${s.spreadDistance}px var(--kjun-shadow-subtle, var(--kjun-shadow))`).join(', ');
const surfaces = [
  { role: 'flat', caption: '그림자 없음', elevation: 'flat' },
  { role: 'raised', caption: '옅은 접촉 그림자', elevation: 'raised' },
  { role: 'floating', caption: '옅은 주변 그림자', elevation: 'flat', style: { boxShadow: floatingShadow } },
] as const;

function LayerStatus({ active, returnTo }: { active: string; returnTo?: string }) {
  return <dl className="elevation-status" aria-live="polite" aria-atomic="true">
    <div><dt>현재 활성 영역</dt><dd>{active}</dd></div>
    <div><dt>닫은 뒤 포커스</dt><dd>{returnTo || '팝업이나 창을 열어 복귀 위치를 확인하세요.'}</dd></div>
  </dl>;
}

function SurfaceExamples() {
  const [popup, setPopup] = useState(false), [modal, setModal] = useState(false);
  const [nested, setNested] = useState(false), [drawer, setDrawer] = useState(false);
  const [lastReturn, setLastReturn] = useState<string>();
  const feedback = useKjunFeedback();
  const active = nested ? '중첩 창' : modal ? '새 활성 창' : drawer ? 'Drawer' : popup ? 'Popover' : '문서 화면';
  const returnTo = nested ? '중첩 창 열기 버튼' : modal || popup ? 'Popover 열기 버튼' : drawer ? 'Drawer 열기 버튼' : lastReturn;
  const closeModal = (open: boolean) => { setModal(open); if (!open) { setNested(false); setLastReturn('Popover 열기 버튼으로 복귀했습니다.'); } };
  return <div className="elevation-examples">
    <KjunProvider className="elevation-card-comparison">
      {surfaces.map(surface => <figure key={surface.role}>
        <figcaption><strong>{surface.role}</strong> · {surface.caption}</figcaption>
        <DsCard title="프로젝트 설정" elevation={surface.elevation} style={'style' in surface ? surface.style : undefined}>
          <p>팀과 공유할 프로젝트의 기본 정보를 확인합니다.</p>
          <p>마지막 변경 · 오늘</p>
        </DsCard>
      </figure>)}
    </KjunProvider>
    <p className="body-copy">세 표면은 크기·내용·표면색·여백이 같고 그림자만 다릅니다. Card는 flat·raised만 사용하며, floating은 Popover·Modal처럼 콘텐츠 위에 겹치는 표면에 사용합니다.</p>
    <LayerStatus active={active} returnTo={returnTo} />
    <DsCard className="elevation-floating-stage" title="최근 변경 내역" border>
      <p>프로젝트 이름과 공유 설정이 변경되었습니다.</p>
      <div className="elevation-actions">
        <DsPopover open={popup} onOpenChange={open => { setPopup(open); if (!open) setLastReturn('Popover 열기 버튼으로 복귀했습니다.'); }}
          ariaLabel="떠 있는 표면" placement="bottom" trigger={<DsButton variant="secondary">Popover 열기</DsButton>}>
          <p>변경 내역 위에 겹치는 floating 표면입니다.</p>
          <DsButton onClick={() => setModal(true)}>팝업에서 새 모달 열기</DsButton>
        </DsPopover>
        <DsButton variant="secondary" onClick={() => setDrawer(true)}>Drawer 열기</DsButton>
        <DsButton variant="secondary" onClick={() => feedback.toast.info('그림자 없이 작업 결과를 전달합니다.', { duration: 6000, action: { label: '확인', onClick: () => {} } })}>Toast 표시</DsButton>
        <DsTooltip content="그림자 없이 대비와 배치로 구분합니다."><DsButton variant="secondary">Tooltip 보기</DsButton></DsTooltip>
      </div>
    </DsCard>
    <DsModal open={modal} onOpenChange={closeModal} title="새 활성 창">
      <p>원래 팝업은 닫히고 이 창만 조작할 수 있습니다. 중첩 창을 열어 Escape와 Tab을 비교하세요.</p>
      <LayerStatus active={nested ? '중첩 창' : '새 활성 창'} returnTo={nested ? '중첩 창 열기 버튼' : 'Popover 열기 버튼'} />
      <KjunProvider>
        <DsButton onClick={() => setNested(true)}>중첩 창 열기</DsButton>
        <DsModal open={nested} onOpenChange={setNested} title="중첩 창">
          <p>Escape를 누르면 이 창만 닫히고 이전 창이 다시 활성화됩니다.</p>
          <LayerStatus active="중첩 창" returnTo="중첩 창 열기 버튼" />
          <DsButton onClick={() => setNested(false)}>이 창 닫기</DsButton>
        </DsModal>
      </KjunProvider>
    </DsModal>
    <DsDrawer open={drawer} onOpenChange={open => { setDrawer(open); if (!open) setLastReturn('Drawer 열기 버튼으로 복귀했습니다.'); }} title="배경을 차단하는 패널">
      <p>Modal과 같은 floating 역할입니다. 방향에 따라 그림자의 방향만 바뀝니다.</p>
      <LayerStatus active="Drawer" returnTo="Drawer 열기 버튼" />
    </DsDrawer>
  </div>;
}

export function ElevationExamples() {
  return <KjunFeedbackProvider><SurfaceExamples /></KjunFeedbackProvider>;
}
