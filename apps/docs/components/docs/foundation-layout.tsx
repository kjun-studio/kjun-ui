'use client';
import Link from './doc-link';
import { DataTable } from './data-table';
import { CodeBlock } from './code-block';
import { CatalogPreview } from './catalog-preview';
import { ColumnsFigure, CtaSpaceFigure, ScrollOwnershipFigure, VerticalSpacingGuide } from './foundation-layout-figures';
import rules from '../../../../shared/foundation-layout.json';

export function FoundationLayoutGuide() {
  return <div className="layout-document">
    <p className="body-copy">콘텐츠에 맞는 폭을 고른 뒤, 보조 정보의 위치와 스크롤할 영역을 정하세요. 아래 수치는 화면을 조합할 때의 권장 시작값이며, 컴포넌트 내부 규격은 유지합니다.</p>
    <section id="width">
      <h2>콘텐츠에 맞는 폭과 여백</h2>
      <h3>1. 콘텐츠 목적에 따라 최대 폭을 고릅니다</h3>
      <dl className="layout-width-options">
        <div><dt>읽기·입력 중심</dt><dd><strong>{rules.readingMax}px</strong><p>긴 본문과 폼을 한 열로 읽는 화면</p></dd></div>
        <div><dt>목록·보조 정보 중심</dt><dd><strong>{rules.pageMax}px</strong><p>본문과 보조 정보를 함께 보는 일반 화면</p></dd></div>
      </dl>
      <p className="layout-caption">최대 폭은 좌우 여백을 포함하며 가운데 정렬합니다. 비교할 열이 많은 데이터 화면은 콘텐츠의 최소 가독 폭에 맞춰 넓힐 수 있습니다.</p>
      <h3>2. 가용 폭에 맞춰 바깥 여백을 정합니다</h3>
      <p className="body-copy">가용 폭은 화면에서 사이드바처럼 항상 자리를 차지하는 영역을 제외한 너비입니다. 이 폭을 기준으로 좌우 여백과 영역 사이 간격을 선택하세요.</p>
      <DataTable presentation="document" headings={['가용 폭', '좌우 여백', '영역 사이 간격']} numericColumns={[1, 2]} rows={[
        [`${rules.mediumFrom}px 미만`, `${rules.gutters.compact}px`, `${rules.gaps.compact}px`],
        [`${rules.mediumFrom}–${rules.wideFrom - 1}px`, `${rules.gutters.medium}px`, `${rules.gaps.regular}px`],
        [`${rules.wideFrom}px 이상`, `${rules.gutters.wide}px`, `${rules.gaps.regular}px`],
      ]} />
      <p className="layout-caption">좌우 여백은 한쪽 기준입니다. Web은 CSS px, Native는 같은 숫자의 논리 단위를 사용합니다. 여백을 바꾸는 기준과 두 열로 전환하는 기준은 별개입니다.</p>
    </section>
    <section id="spacing">
      <h2>내용의 관계를 드러내는 세로 간격</h2>
      <p className="body-copy">관련된 내용은 가깝게 묶고, 주제가 달라지면 간격을 넓힙니다. 아래 견본은 표시된 간격을 실제 CSS px로 보여줍니다.</p>
      <VerticalSpacingGuide />
      <p className="layout-related"><Link href="/tokens#spacing">간격 값 선택 기준</Link></p>
    </section>
    <section id="columns">
      <h2>보조 정보가 필요할 때 두 열로</h2>
      <p className="body-copy">폼과 긴 본문은 넓은 화면에서도 한 열이 기본입니다. 변경 기록·담당자 같은 보조 정보가 있고 가용 폭이 {rules.columnsFrom}px 이상일 때 본문과 보조 영역을 2:1로 나눕니다.</p>
      <ColumnsFigure />
      <p className="layout-caption">두 열의 최소 가독 폭을 확보할 수 없으면 한 열을 유지합니다. 폭이 바뀌어도 필수 입력은 본문에 모으고 입력값과 읽기·Tab 순서를 유지하세요.</p>
      <h3>열 전환 확인하기</h3>
      <CatalogPreview name="GuideScreenLayout" layoutGuide="columns" />
    </section>
    <section id="scroll">
      <h2>스크롤할 영역 정하기</h2>
      <p className="body-copy">일반 페이지는 내용만큼 늘어나게 합니다. 상단과 하단 행동을 계속 보여줘야 하는 앱 화면은 높이를 정하고 가운데 본문만 스크롤하게 하세요.</p>
      <ScrollOwnershipFigure />
      <ul className="layout-notes">
        <li><Link href="/components/modal#usage">Modal</Link>·<Link href="/components/drawer#usage">Drawer</Link>는 오버레이 본문을 스크롤하고 배경 스크롤을 제한합니다.</li>
        <li><Link href="/components/table#usage">넓은 표</Link>의 가로 스크롤은 표 영역 안에 두고, 해당 영역에 접근 가능한 이름을 제공합니다.</li>
        <li>같은 방향의 스크롤 영역을 불필요하게 중첩하지 않습니다.</li>
      </ul>
      <div className="layout-implementation">
        <h3>Web 구현 참고</h3>
        <p className="body-copy">부모가 화면 높이를 정하고 본문이 남은 공간을 사용합니다. <code>min-height: 0</code>은 본문이 줄어들 수 있게 하여 하단 행동이 화면 밖으로 밀리는 것을 방지합니다.</p>
        <CodeBlock label="CSS · 본문만 스크롤하는 화면" code={'/* 화면 높이는 적용 환경에 맞춰 정합니다. */\n.screen {\n  height: 100dvh;\n  display: flex;\n  flex-direction: column;\n}\n.screen-header, .screen-footer { flex-shrink: 0; }\n.screen-body {\n  flex: 1;\n  min-height: 0;\n  min-width: 0;\n  overflow: auto;\n}\n.table-region { max-width: 100%; overflow-x: auto; }'} />
        <p className="layout-caption">Native에서는 높이가 정해진 부모 안에 ScrollView를 배치합니다. <Link href="/usage-guide/mobile#app-screen">플랫폼별 모바일 화면 구현</Link>에서 이어서 확인하세요.</p>
      </div>
    </section>
    <section id="cta">
      <h2>하단 행동의 공간 확보하기</h2>
      <p className="body-copy"><strong>하단 영역이 실제 공간을 차지하는 배치를 기본으로 사용하세요.</strong> 본문은 남은 높이 안에서 스크롤하므로, 버튼 문구가 길어져도 마지막 콘텐츠가 가려지지 않습니다.</p>
      <CtaSpaceFigure />
      <h3>본문 위에 겹쳐야 하는 경우</h3>
      <p className="body-copy">하단 행동을 콘텐츠 위에 띄워야 할 때만 겹치는 배치를 선택하세요. 본문 끝에는 <strong>하단 전체 높이 + {rules.dockGap}px</strong>의 여백을 확보하고, 하단 높이가 바뀔 때마다 갱신합니다.</p>
      <p className="layout-caption">하단 전체 높이는 CTA·내비게이션·안전 영역을 포함합니다. Web은 ResizeObserver, Native는 onLayout으로 측정합니다. 예제의 absolute 배치와 앱의 fixed 배치 모두 같은 여백 계산을 사용합니다.</p>
      <h3>안전 영역은 가장 아래에 한 번만</h3>
      <ul className="layout-notes">
        <li>내비게이션이 있으면 내비게이션 아래에 적용합니다.</li>
        <li>내비게이션이 없으면 CTA 아래에 적용합니다.</li>
        <li>측정한 하단 높이에 안전 영역이 포함되어 있으면 다시 더하지 않습니다.</li>
      </ul>
      <h3>키보드가 나타나도 저장 행동에 도달하게</h3>
      <p className="body-copy">입력 필드와 저장 버튼이 키보드에 가려지지 않도록 앱에서 키보드 회피와 창 크기 변화를 연결합니다. 예제의 키보드 버튼은 높이 변화를 모의 적용하며 실제 기기 키보드를 감지하지 않습니다.</p>
      <h3>하단 배치 확인하기</h3>
      <p className="layout-caption">긴 CTA 문구와 키보드 상태를 적용하고, 본문을 끝까지 스크롤해 마지막 콘텐츠가 보이는지 확인하세요.</p>
      <CatalogPreview name="GuideScrollCTA" layoutGuide="cta" />
      <p className="layout-related"><Link href="/components/bottom-action-bar#usage">BottomActionBar 기본 사용법</Link><Link href="/usage-guide/mobile#bottom-cta-layout">하단 CTA 구현 방법</Link><Link href="/usage-guide/mobile#keyboard-layout">키보드 배치 구현 방법</Link></p>
      <p className="layout-caption">BottomActionBar는 자동으로 고정되지 않습니다. 배치 방식과 실제 안전 영역 값은 적용 앱에서 정합니다.</p>
    </section>
    <section id="platforms">
      <h2>배치를 적용한 뒤 확인할 것</h2>
      <p className="body-copy">좁은 화면·긴 한국어·200% 확대와 실제 기기 키보드에서 아래 결과를 확인하세요.</p>
      <ul className="layout-checklist">
        <li>페이지 전체에 불필요한 가로 스크롤이 생기지 않는다.</li>
        <li>열이 바뀌어도 입력값과 본문 → 보조 정보의 읽기·Tab 순서가 유지된다.</li>
        <li>본문 끝까지 스크롤하면 마지막 콘텐츠가 CTA 위에 온전히 보인다.</li>
        <li>CTA 문구가 여러 줄이 되어도 본문 공간과 끝 여백이 함께 바뀐다.</li>
        <li>키보드가 나타나도 입력 필드와 저장 버튼에 도달할 수 있다.</li>
        <li>내비게이션 표시 여부가 바뀌어도 안전 영역을 중복 적용하지 않는다.</li>
      </ul>
      <p className="layout-caption">Native Web 예제의 확인만으로 실제 기기의 키보드·안전 영역 동작을 검증할 수는 없습니다.</p>
      <p className="layout-related"><Link href="/elevation">레이어·Elevation</Link><Link href="/styling">프로젝트 색상·서체 연결</Link></p>
    </section>
  </div>;
}
