'use client';
import Link from './doc-link';
import { DataTable } from './data-table';
import { GuideExample } from './guide-example';
import { accessibilityScenarios } from '../../../../shared/accessibility-examples';

function Example({ index }: { index: number }) {
  return <GuideExample {...accessibilityScenarios[index]} startOnRequest />;
}
export function FoundationAccessibilityGuide() {
  return <div className="reading-document foundation-document">
    <section id="keyboard">
      <h2>키보드 조작</h2>
      <p className="body-copy">마우스를 사용하지 않고 입력·선택·닫기까지 완료할 수 있어야 합니다. Tab·Shift+Tab은 조작 가능한 요소 사이를 이동하고, 버튼은 Enter·Space로 실행합니다. 복합 컨트롤 안에서는 해당 컴포넌트의 방향키 규칙을 사용합니다.</p>
      <DataTable presentation="prose" headings={['조작', '확인할 동작']} rows={[
        [<><kbd>Tab</kbd> · <kbd>Shift</kbd>+<kbd>Tab</kbd></>, '문서 순서대로 진입·이탈하며, 비활성 컨트롤을 건너뜁니다. 양수 tabindex로 순서를 재배치하지 않습니다.'],
        ['Tabs의 좌우 방향키', '사용 가능한 탭을 순환하며 선택 변경을 요청합니다. 선택값은 적용 프로젝트가 반영합니다.'],
        [<>Tabs의 <kbd>Home</kbd> · <kbd>End</kbd></>, '처음·마지막 사용 가능한 탭으로 이동합니다.'],
        [<kbd>Escape</kbd>, '닫기를 허용한 Modal 등 열린 레이어를 닫습니다. 일반 입력값을 임의로 지우지 않습니다.'],
      ]} />
      <p className="body-copy">예제는 직접 실행해야 열립니다. 준비되면 같은 버튼이 ‘예제로 이동’으로 바뀝니다. 다시 눌러 첫 컨트롤로 들어가거나 Tab으로 이동하세요. 로딩 완료만으로 포커스를 가져오지 않습니다.</p>
      <Example index={0} />
      <p className="body-copy">텍스트로 시작하는 탭 패널은 Tab으로 패널에 들어갈 수 있습니다. 첫 내용이 입력이나 버튼이면 해당 컨트롤로 진입합니다. 선택한 탭이 없어도 사용 가능한 첫 탭으로 들어갈 수 있으며, 모두 비활성이면 탭 항목에 진입하지 않습니다.</p>
      <p className="body-copy">탭을 제거하거나 비활성화할 때 포커스와 선택값은 별도로 관리합니다. 프로젝트는 유효한 선택값과 표시할 내용을 결정하세요. <code>items</code>만 사용하는 방식은 실제 패널을 만들지 않으므로 <Link href="/components/tab-pane">TabPane</Link>을 연결한 예제와 같은 패널 구조를 제공하지 않습니다. <a href="https://www.w3.org/WAI/ARIA/apg/patterns/tabs/">WAI-ARIA Tabs 패턴</a></p>
    </section>
    <section id="focus">
      <h2>포커스</h2>
      <p className="body-copy">선택 상태와 포커스, 비활성·읽기 전용의 차이는 <Link href="/interaction">상태·상호작용</Link>의 조작 예제로 확인하세요.</p>
      <p className="body-copy">포커스는 현재 키보드 조작 위치입니다. 선택 표시와 구분해서 눈에 보여야 하고, 스크롤 영역·고정 헤더·레이어에 가려지지 않아야 합니다. Tab으로 이동하면서 테두리가 실제로 보이는지 확인하세요.</p>
      <Example index={1} />
      <p className="body-copy">Modal은 열릴 때 내부로 포커스를 옮기고, 열린 동안 Tab·Shift+Tab을 내부에서 순환시킵니다. 닫히면 살아 있는 트리거로 돌아갑니다. 트리거가 삭제되거나 화면 전환으로 사라지는 흐름에서는 적용 프로젝트가 다음 작업 위치를 정해야 합니다.</p>
      <p className="body-copy">이 페이지의 초기화는 초기화 버튼의 포커스를 유지하며 예제의 Provider와 열린 레이어를 정리합니다. 플랫폼 전환은 플랫폼 선택기의 포커스를 유지합니다. 페이지 이탈 시 실행 영역을 제거합니다. 늦게 도착한 이전 실행 응답은 새 예제에 반영하지 않습니다.</p>
      <p className="body-copy"><Link href="/elevation#overlap">레이어의 입력·포커스 규칙</Link>과 <a href="https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html">포커스 가림 확인 기준</a>을 함께 확인하세요.</p>
    </section>
    <section id="accessible-name">
      <h2>접근성 이름</h2>
      <p className="body-copy"><Link href="/icons#usage">아이콘 사용 규칙</Link>에서 장식·의미·아이콘 전용 행동의 이름을 구분하세요.</p>
      <p className="body-copy">접근성 이름은 보조 기술이 컨트롤을 식별하는 이름입니다. 보이는 라벨을 우선하고 같은 문구가 이름에 포함되게 하세요. 아이콘만 있는 버튼에는 ‘목록 검색’처럼 수행할 작업을 이름으로 제공합니다. placeholder와 Tooltip만으로 입력·버튼의 이름을 대신하지 않습니다.</p>
      <Example index={2} />
      <p className="body-copy"><Link href="/components/form-group">FormGroup</Link>과 <Link href="/components/input">Input</Link>은 필드마다 고유한 ID로 라벨·도움말·오류를 연결합니다. 오류 상태에서는 원인과 수정 방법을 전달하고 해제 후 오래된 오류 참조를 남기지 않습니다. 두 필드의 연결이 서로 섞이지 않는지 확인하세요.</p>
      <p className="body-copy">FormGroup의 <code>required</code>는 Input·Textarea에 필수 입력 의미를 전달합니다. 비활성 입력은 Tab 순서에서 제외하고, 읽기 전용 입력은 내용을 확인·선택할 수 있도록 진입을 유지합니다. 오류가 있는 입력에도 현재 위치를 구분하는 포커스 테두리를 표시합니다.</p>
      <p className="body-copy">오류 설명의 연결은 즉시 낭독이나 첫 오류로의 포커스 이동을 보장하지 않습니다. 제출 후 오류 요약, 알림 시점, 수정할 위치로의 이동은 프로젝트의 폼 흐름에서 설계하고 보조 기술로 확인하세요. 예제의 검색 결과 문구도 화면의 실행 결과이며 실시간 알림을 검증하는 예제가 아닙니다.</p>
      <p className="body-copy">모든 플랫폼의 Tabs는 <code>ariaLabel</code>로 탭 목록의 이름을 지정하며 기본값은 ‘탭’입니다.</p>
    </section>
    <section id="text-resize">
      <h2>글자 확대</h2>
      <p className="body-copy">브라우저 메뉴의 확대를 150%와 200%로 바꿔 이 페이지와 예제를 조작하세요. 브라우저 확대는 실제 글자와 컨트롤을 함께 확대합니다. 화면 폭만 줄이거나 CSS transform으로 크기를 바꾸는 검사와 구분합니다.</p>
      <ol className="body-copy accessibility-checklist">
        <li>라벨·도움말·긴 오류가 잘리지 않고 읽히는지 확인합니다.</li>
        <li>버튼 안의 글자와 입력 내용, 탭 이름이 가려지지 않는지 확인합니다. 가로로 넘치는 탭은 포커스한 항목이 보이도록 스크롤되어야 합니다.</li>
        <li>Modal을 열고 내부 스크롤·닫기·포커스 복귀를 확인합니다.</li>
        <li>320·375px의 좁은 화면에서도 페이지 전체에 불필요한 가로 스크롤이 생기지 않는지 확인합니다.</li>
      </ol>
      <p className="body-copy"><a href="https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html">WCAG 글자 확대 설명</a>은 200%까지 내용과 기능을 유지하는 기준을 안내합니다. 이 페이지의 예제 통과만으로 전체 서비스의 준수를 보장하지 않습니다. 텍스트만 확대, 사용자 서체, 운영체제 글자 크기와 실제 Native 기기는 각각 별도 환경으로 확인하세요.</p>
    </section>
    <section id="responsibilities">
      <h2>적용 프로젝트의 책임</h2>
      <DataTable presentation="prose" headings={['KJUN 패키지', '적용 프로젝트']} rows={[
        ['역할·상태·ID와 라벨·설명 연결', '실제 작업을 설명하는 라벨, 오류 원인과 수정 안내'],
        ['컴포넌트의 키보드 조작·포커스 이동·복귀', '화면 탐색 순서, 삭제·화면 전환 후 다음 포커스, 제출 오류 흐름'],
        ['공통 크기·배치·포커스 표시의 구조', '색상·서체 연결, 대비와 확대 결과, 고정 영역에 가려지는지 확인'],
        ['컴포넌트별 명시된 조건의 검증 기록', '실제 데이터·조합·라우팅·지원 브라우저·보조 기술과 기기에서의 최종 검증'],
      ]} />
      <p className="body-copy">패키지 결함은 재현 조건과 함께 패키지에서 수정합니다. 프로젝트별 CSS나 키보드 이벤트로 공통 규격을 덮어쓰지 않습니다. 색상과 서체는 <Link href="/styling">색상·서체 연결</Link>, 움직임 설정은 <Link href="/motion#reduced-motion">동작 줄이기</Link>에서 확인하세요.</p>
      <p className="body-copy">대표 예제는 Tabs·TabPane·Modal·Input·FormGroup·Button을 다룹니다. 컴포넌트별 키보드·라벨·포커스의 세 검사와 실행 환경·날짜는 <Link href="/verification">검증 기록</Link>에서 확인하세요. 이전 결과가 현재 패키지와 다르면 ‘재검증 필요’로 표시하며, 실행하지 않은 검사를 통과로 간주하지 않습니다.</p>
      <p className="body-copy">React Native 선택의 실행 화면은 Native Web 미리보기입니다. 브라우저 검사는 iOS·Android 기기의 접근성, VoiceOver·TalkBack 낭독 또는 하드웨어 키보드 검증을 대신하지 않습니다.</p>
    </section>
  </div>;
}
