'use client';
import { ElevationExamples } from './elevation-examples';
import { ElevationRules } from './elevation-rules';
import Link from './doc-link';
import { DataTable } from './data-table';
import { CatalogPreview } from './catalog-preview';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './disclosure';
import tokens from '@/lib/generated/tokens.json';

export function FoundationElevationGuide() {
  return <>
    <div className="elevation-intro">
      <dl className="elevation-concepts">
        <div><dt>표면 표현</dt><dd>그림자로 배경과 얼마나 분리해 보일지 정합니다. flat·raised·floating 중 역할을 선택합니다.</dd></div>
        <div><dt>표시 순서</dt><dd>겹치는 창 중 무엇을 앞에 보여줄지 정합니다. 창의 소유 관계와 열린 순서를 따릅니다.</dd></div>
        <div><dt>입력·포커스</dt><dd>어디를 클릭하고 키보드로 이동할 수 있는지 정합니다. 새 창이 열리면 배경 입력을 차단합니다.</dd></div>
      </dl>
      <p className="elevation-principle"><strong>세 규칙은 독립적입니다.</strong> 앞에 있는 Modal이 메뉴보다 더 진한 그림자를 가질 필요는 없습니다.</p>
    </div>
    <section id="shadows">
      <h2>표면 역할 선택</h2>
      <DataTable headings={['역할', '사용 상황', '표현']} rows={[
        ['flat', '일반 콘텐츠·기본 Card·Toast·Tooltip', '그림자 없음. 간격·표면색·필요한 테두리로 구분'],
        ['raised', '배경에서 살짝 분리할 Card', '작고 옅은 접촉 그림자'],
        ['floating', 'Select·메뉴·Popover·Modal·Drawer', '옅은 주변 그림자. 차단 창은 배경 차단과 활성 영역으로 구분'],
      ]} />
      <p className="body-copy">Card는 내용을 묶는 컨테이너입니다. 행동은 내부 Button·Link에 연결합니다. 마우스를 올리거나 내부 버튼에 포커스를 옮겨도 카드 전체가 떠오르지 않습니다.</p>
    </section>
    <section id="examples">
      <h2>실제 표면 비교</h2>
      <ElevationExamples />
      <p className="body-copy">팝업이나 창을 열면 현재 활성 영역과 닫은 뒤 포커스가 돌아갈 위치를 확인할 수 있습니다.</p>
    </section>
    <section id="preview">
      <h2>Modal·Toast·하단 CTA 함께 보기</h2>
      <p className="body-copy">아래 순서로 창이 바뀔 때 조작 범위와 포커스가 어떻게 이동하는지 확인하세요.</p>
      <ol className="elevation-walkthrough" aria-label="레이어 체험 순서">
        <li><strong>팝업 메뉴 열기</strong><p>아래 예제의 ‘팝업 메뉴’를 누르면 화면 위에 메뉴가 열립니다.</p></li>
        <li><strong>새 모달 열기</strong><p>메뉴에서 ‘새 모달 열기’를 누르세요. 이전 팝업은 사라지고 새 창만 조작할 수 있습니다.</p></li>
        <li><strong>닫고 복귀 확인</strong><p>닫기 버튼이나 Escape로 창을 닫으면 ‘팝업 메뉴’ 버튼으로 포커스가 돌아옵니다.</p></li>
      </ol>
      <CatalogPreview name="GuideLayerStack" detail />
      <p className="body-copy">이어서 하단의 ‘변경 내용 확인’을 열고 ‘Toast 표시’를 눌러 보세요. 알림의 ‘기록 보기’는 실행할 수 있고, 배경 CTA는 창을 닫을 때까지 차단됩니다. 색상·긴 콘텐츠·안전 영역은 ‘예제 설정’에서 바꿀 수 있습니다.</p>
    </section>
    <section id="order">
      <h2>활성 창과 표시 순서</h2>
      <figure className="foundation-diagram elevation-window-map">
        <div className="elevation-window-stack">
          <div className="elevation-inactive"><strong>배경 화면 또는 이전 창</strong><p>새 창이 열리면 입력 차단 · 기존 팝업 닫기</p></div>
          <div className="elevation-active"><strong>현재 활성 창</strong><p>본문 · 입력 · 확정 행동</p>
            <ul className="elevation-window-floats" aria-label="활성 창 위에 표시되는 표면">
              <li>이 창에서 연 팝업·Tooltip</li>
              <li>남은 시간과 행동을 유지하는 Toast</li>
            </ul>
          </div>
        </div>
        <figcaption>창의 소유 관계와 열린 순서에 따라 활성 범위가 바뀝니다. 배경의 팝업은 새 창 위에 남지 않습니다.</figcaption>
      </figure>
    </section>
    <section id="overlap">
      <h2>겹침과 입력 규칙</h2>
      <p className="body-copy">화면에서 확인할 동작을 먼저 읽고, 구현할 때 필요한 세부 조건을 펼쳐 보세요.</p>
      <ElevationRules />
    </section>
    <section id="platforms">
      <h2>상세 참조와 플랫폼 범위</h2>
      <Collapsible><CollapsibleTrigger>토큰 원형과 페이지 레이어 보기</CollapsibleTrigger><CollapsibleContent>
        <DataTable headings={['원형', 'X / Y / blur / spread', '색상 역할']} rows={Object.entries(tokens.shadowScale).map(([name, layers]) => [name, layers.length ? layers.map(s => `${s.offsetX} / ${s.offsetY} / ${s.blurRadius} / ${s.spreadDistance}`).join(', ') : '빈 배열', layers[0]?.colorRole || '없음'])} />
        <p className="body-copy"><code>shadowScale → elevation → card.elevation / modal.elevation / extensions.*.elevation</code>을 같은 정의에서 생성합니다. <code>ShadowLayer</code>·<code>ElevationRole</code>·<code>CardElevation</code> 타입을 제공합니다. shadowSubtle의 색상과 투명도는 프로젝트가 제공하며 생략하면 shadow를 사용합니다.</p>
        <DataTable headings={['페이지 레이어', '값']} rows={Object.entries(tokens.layers.page).map(([name, value]) => [`layers.page.${name}`, value])} />
        <p className="body-copy">창의 중첩 순서는 패키지가 자동으로 관리합니다. 내부 CSS 변수와 계산값은 프로젝트 설정 API가 아닙니다.</p>
      </CollapsibleContent></Collapsible>
      <p className="body-copy">React·Vue 2는 Provider의 색상·서체 범위를 유지하는 Web 호스트를 사용합니다. Native는 활성 Modal 창 내부에 Toast를 표시합니다. Web z-index와 Native 창 순서는 서로 다른 플랫폼 기능입니다.</p>
      <p className="body-copy">Native Web은 브라우저 미리보기입니다. iOS·Android의 기기 키보드·안전 영역·뒤로 가기·VoiceOver·TalkBack 검증은 별도로 수행합니다.</p>
      <p className="body-copy"><Link href="/layout#cta">하단 CTA 공간 확보</Link> · <Link href="/feedback">피드백 서비스</Link> · <Link href="/components/card">Card</Link> · <Link href="/components/modal">Modal</Link></p>
    </section>
  </>;
}
