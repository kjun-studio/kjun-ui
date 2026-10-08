import type { CSSProperties } from 'react';
import rules from '../../../../shared/foundation-layout.json';

export function VerticalSpacingGuide() {
  const samples = [
    { label: '제목과 설명', value: 16, use: '같은 내용을 설명할 때' },
    { label: '관련된 콘텐츠', value: 24, use: '필드 그룹·카드 사이' },
    { label: '섹션 사이 · 좁은 화면', value: 32, use: '주제가 달라질 때' },
    { label: '섹션 사이 · 넓은 화면', value: 48, use: '주제가 달라질 때' },
  ];
  return <figure className="layout-figure layout-spacing-figure">
    <dl className="layout-spacing-samples">{samples.map(sample => <div key={sample.value}>
      <dt>{sample.label}</dt>
      <dd><strong>{sample.value}px</strong>
        <div className="layout-gap-sample" aria-hidden="true" style={{ '--sample-gap': `${sample.value}px` } as CSSProperties}>
          <span /><i /><span />
        </div>
        <p>{sample.use}</p>
      </dd>
    </div>)}</dl>
    <figcaption>페이지의 바깥 간격을 조정하는 시작값입니다. 컴포넌트 내부 간격은 해당 컴포넌트의 규격을 따릅니다.</figcaption>
  </figure>;
}

export function ColumnsFigure() {
  return <figure className="layout-figure">
    <div className="layout-comparison">
      <div>
        <h3>한 열</h3><p className="layout-figure-label">가용 폭 {rules.columnsFrom}px 미만</p>
        <div className="layout-column-map" data-columns="1"><b>본문</b><b>보조 정보</b></div>
      </div>
      <div>
        <h3>두 열</h3><p className="layout-figure-label">가용 폭 {rules.columnsFrom}px 이상 · 너비 2:1</p>
        <div className="layout-column-map" data-columns="2"><b>본문</b><b>보조 정보</b></div>
      </div>
    </div>
    <figcaption>읽기·Tab 순서: 본문 → 보조 정보. 폼·긴 본문만 있는 화면은 폭과 관계없이 한 열을 유지합니다.</figcaption>
  </figure>;
}

export function ScrollOwnershipFigure() {
  return <figure className="layout-figure">
    <div className="layout-comparison">
      <div>
        <h3>페이지 전체 스크롤</h3><p className="layout-figure-label">문서·일반 페이지</p>
        <div className="layout-scroll-map">
          <div className="layout-scroll-zone"><span>↕ 페이지 전체</span><b>제목</b><p>본문</p><p>마지막 콘텐츠</p><b>하단 행동</b></div>
        </div>
      </div>
      <div>
        <h3>가운데 본문 스크롤</h3><p className="layout-figure-label">높이가 정해진 앱 화면</p>
        <div className="layout-scroll-map">
          <div className="layout-fixed-zone">상단 · 공간 유지</div>
          <div className="layout-scroll-zone"><span>↕ 본문</span><p>남은 높이 안에서 스크롤</p><p>마지막 콘텐츠</p></div>
          <div className="layout-fixed-zone">하단 행동 · 공간 유지</div>
        </div>
      </div>
    </div>
    <figcaption>점선은 스크롤 영역입니다. 상단·하단을 유지하는 화면에서도 본문의 마지막 콘텐츠에 도달할 수 있어야 합니다.</figcaption>
  </figure>;
}

function Dock() {
  return <div className="layout-dock-map"><b>CTA + 내비게이션</b><span>안전 영역 · 한 번 적용</span></div>;
}
export function CtaSpaceFigure() {
  return <figure className="layout-figure">
    <div className="layout-comparison">
      <div>
        <h3>공간을 차지하는 배치</h3><p className="layout-figure-label"><strong>기본 권장</strong> · 본문은 남은 공간 사용</p>
        <div className="layout-cta-map" data-placement="flow">
          <div className="layout-scroll-zone"><span>↕ 본문</span><p>마지막 콘텐츠</p></div>
          <Dock />
        </div>
      </div>
      <div>
        <h3>본문 위에 겹치는 배치</h3><p className="layout-figure-label">필요할 때 · 본문 끝 여백 직접 확보</p>
        <div className="layout-cta-map" data-placement="overlay">
          <div className="layout-scroll-zone"><span>↕ 본문</span><p>마지막 콘텐츠</p><div className="layout-reserved-space" aria-label="하단 높이와 추가 간격만큼 확보한 본문 끝 여백" /></div>
          <Dock />
        </div>
      </div>
    </div>
    <figcaption><span className="layout-reserve-key" aria-hidden="true" /> 사선 영역은 겹치는 하단을 위한 본문 끝 여백입니다. 하단 전체 높이 + {rules.dockGap}px를 확보합니다.</figcaption>
  </figure>;
}
