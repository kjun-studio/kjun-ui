'use client';
import { tokens } from '@kjun-ui/tokens';
import { DsIcon as Icon } from '@kjun-ui/react';
import Link from './doc-link';
import { DataTable } from './data-table';
import { GuideExample } from './guide-example';
import { IconCatalog } from './icon-catalog';
import { iconScenarios } from '../../../../shared/icon-examples';
export function FoundationIconsGuide() {
  return <div className="reading-document foundation-document">
    <IconCatalog />
    <section id="size-alignment" className="icon-guide">
      <h2>크기·정렬</h2>
      <p className="body-copy">같은 아이콘을 여섯 크기로 비교하고, 텍스트·버튼 옆에서 어떻게 정렬되는지 확인하세요.</p>
      <GuideExample {...iconScenarios[0]} />
      <div className="icon-principles">
        <article><h3>텍스트와 함께 맞추기</h3><p>웹의 기본 크기 1em은 부모 글자 크기를 따릅니다. 크기를 고정할 때는 size를 지정하세요.</p></article>
        <article><h3>버튼의 아이콘 슬롯 사용하기</h3><p>앞·뒤 아이콘은 <Link href="/components/button#api">Button의 prefixIcon·suffixIcon</Link>을 사용하면 크기와 간격이 함께 맞춰집니다.</p></article>
        <article><h3>모양과 누르는 영역 구분하기</h3><p>작은 아이콘 자체에 동작을 붙이지 않고 Button·IconToggle로 감싸세요. 도형 경로·획 두께·컨트롤 내부 간격은 유지합니다.</p></article>
      </div>
      <details className="icon-guide-details">
        <summary>플랫폼별 크기 API와 단위</summary>
        <div>
          <DataTable headings={['플랫폼', '기본 크기', '크기 API 예']} rows={[
            ['React', '1em', <><code>{'size={16}'}</code> 또는 <code>size="1.5em"</code></>], ['Vue 2', '1em', <><code>size="16px"</code> 또는 <code>size="1.5em"</code></>], ['React Native', '16 논리 단위', <code>{'size={16}'}</code>],
          ]} />
          <p>웹의 숫자 크기는 px, em은 부모 글자 크기에 비례합니다. Native의 숫자는 논리 단위이며 기기 픽셀 수가 아닙니다. SVG의 24 × 24 내부 좌표는 표시 크기를 고정하지 않습니다.</p>
          <p>Button은 별도 button.iconSizes를 따릅니다: {Object.entries(tokens.button.iconSizes).map(([role, size]) => `${role} ${size}`).join(' · ')}.</p>
          <p><Link href="/tokens#sizes">크기 토큰</Link> · <Link href="/accessibility#responsibilities">누르는 영역 기준</Link></p>
        </div>
      </details>
    </section>
    <section id="variants" className="icon-guide">
      <h2>형태 선택</h2>
      <p className="body-copy">선형을 기본으로 사용합니다. 전체 1,054개 채움형은 개별 import 후 Provider에 등록해 사용합니다. 기본 제공되는 heart·star로 두 형태를 비교해 보세요.</p>
      <GuideExample {...iconScenarios[1]} />
      <div className="icon-principles">
        <article><h3>채움형과 선택 상태는 별개</h3><p>채움형은 도형만 바꿉니다. 지속적인 선택에는 <Link href="/components/icon-toggle">IconToggle</Link>의 active와 상태 변경 요청을 연결하세요.</p></article>
        <article><h3>같은 기능에는 같은 아이콘</h3><p>닫기와 삭제, 뒤로 가기와 외부 링크는 의미가 다릅니다. 모양이 비슷해도 서로 바꾸어 사용하지 마세요.</p>
          <div className="icon-meaning-pairs"><span><Icon name="x" aria-hidden="true" /> 닫기</span><span><Icon name="trash" aria-hidden="true" /> 삭제</span><span><Icon name="arrow-left" aria-hidden="true" /> 뒤로</span><span><Icon name="external-link" aria-hidden="true" /> 외부 링크</span></div>
        </article>
      </div>
      <details className="icon-guide-details">
        <summary>지원하지 않는 형태·이름의 대체 동작</summary>
        <div><p>채움형이 없는 유효한 이름에 filled를 요청하면 해당 이름의 선형으로 표시합니다. 등록하지 않은 이름은 help-circle로 대체합니다. 추가 아이콘의 복사 예제에는 정적 import와 Provider 등록 코드가 포함됩니다.</p><p><Link href="/components/icon#api">Icon API</Link> · <Link href="/interaction#selection">선택 상태 연결</Link></p></div>
      </details>
      <GuideExample {...iconScenarios[2]} startOnRequest />
    </section>
    <section id="usage" className="icon-guide">
      <h2>사용 규칙</h2>
      <p className="body-copy">아이콘이 장식인지, 정보를 전달하는지, 행동을 실행하는지에 따라 의미를 전달하는 방법을 선택하세요.</p>
      <div className="icon-principles icon-usage-rules">
        <article><h3>장식은 중복해서 읽지 않기</h3><p>옆의 보이는 텍스트가 의미를 전달하면 아이콘은 접근성 읽기에서 제외합니다.</p><div className="icon-rule-example"><Icon name="check" aria-hidden="true" /><span>저장 완료</span></div><p className="icon-rule-caption">텍스트가 이미 완료 상태를 설명합니다.</p></article>
        <article><h3>중요한 정보는 텍스트와 함께</h3><p>아이콘 모양이나 색상만으로 상태를 전달하지 말고, 사용자가 이해할 수 있는 문구를 함께 제공합니다.</p><div className="icon-rule-example"><Icon name="alert-circle" aria-hidden="true" /><span>입력 내용을 확인해 주세요</span></div><p className="icon-rule-caption">색상을 구분하지 못해도 의미가 전달됩니다.</p></article>
        <article><h3>아이콘 버튼에는 행동 이름</h3><p>Button·IconToggle에 수행할 행동을 ariaLabel로 제공합니다. Tooltip만으로 이름을 대신하지 않습니다.</p><div className="icon-rule-example"><Icon name="x" aria-hidden="true" /><code>ariaLabel="닫기"</code></div><p className="icon-rule-caption">모양 이름 ‘엑스’ 대신 행동 ‘닫기’로 설명합니다.</p></article>
      </div>
      <details className="icon-guide-details">
        <summary>플랫폼별 접근성 이름과 읽기 순서</summary>
        <div><p>공통 예제는 보이는 텍스트나 부모 컨트롤로 의미를 전달합니다. Native Icon에는 웹 SVG와 동일한 독립 접근성 이름 API가 없습니다. 필요한 의미는 부모 컨트롤과 플랫폼에 맞는 텍스트에서 제공합니다.</p><p><Link href="/accessibility#accessible-name">접근성 이름</Link> · <Link href="/components/icon#accessibility">Icon의 플랫폼 차이</Link></p><p>React Native 실행 화면은 Native Web 미리보기입니다. 실제 iOS·Android의 렌더링·터치·VoiceOver·TalkBack은 기기에서 별도로 확인합니다.</p></div>
      </details>
      <details className="icon-guide-details">
        <summary>색상 상속과 회전·로딩 상태</summary>
        <div><p>웹 Icon은 currentColor를 사용합니다. Native는 color를 지정하거나 Provider의 text 색상 역할을 사용합니다. 실제 색상·서체·모드 전환과 대비는 <Link href="/styling">적용 프로젝트</Link>가 관리합니다.</p><p>spin은 회전 표현이며 로딩 상태나 중복 실행 방지를 만들지 않습니다. <Link href="/interaction#loading">작업 진행</Link>과 <Link href="/motion#reduced-motion">모션·동작 줄이기</Link>를 따르세요.</p></div>
      </details>
    </section>
  </div>;
}
