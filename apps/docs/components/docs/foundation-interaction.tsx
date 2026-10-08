'use client';
import { tokens } from '@kjun-ui/tokens';
import Link from './doc-link';
import { DataTable } from './data-table';
import { GuideExample } from './guide-example';
import { interactionScenarios } from '../../../../shared/interaction-examples';

function Example({ index }: { index: number }) {
  return <GuideExample {...interactionScenarios[index]} startOnRequest />;
}
export function FoundationInteractionGuide() {
  return <div className="reading-document foundation-document">
    <section id="states">
      <h2>상태의 구분</h2>
      <p className="body-copy">상태는 사용자의 조작 위치, 선택한 값, 사용 가능 여부와 작업 진행을 전달합니다. 서로 다른 의미이므로 한 컴포넌트에 여러 상태가 함께 나타날 수 있습니다.</p>
      <DataTable headings={['구분', '상태', '전달하는 의미']} rows={[
        ['조작에 대한 반응', <><code>hover</code> · <code>pressed</code> · <code>focus</code></>, '포인터가 놓인 곳, 누르는 순간, 키보드 조작 위치'],
        ['선택', <code>selected</code>, '프로젝트가 유지하는 현재 선택값'],
        ['사용 가능 여부', <><code>disabled</code> · <code>readonly</code></>, '실행·편집 차단 또는 읽기만 허용'],
        ['작업 진행', <code>loading</code>, '작업이 진행 중임을 표시하고 해당 컨트롤의 재실행을 차단'],
      ]} />
      <h3>대표 컴포넌트에 적용되는 상태</h3>
      <DataTable headings={['컴포넌트', '조작·선택', '공개 설정']} rows={[
        ['Button', 'hover · pressed · focus', 'disabled · loading'],
        ['Input', 'hover · focus', 'disabled · Vue의 readonly / React·Native의 readOnly'],
        ['Tabs · TabPane', 'focus · selected, React·Vue의 hover 표시', 'Tabs의 value · 각 항목 또는 TabPane의 disabled'],
      ]} />
      <p className="body-copy">모든 컴포넌트가 모든 상태를 지원하지는 않습니다. Tabs 전체의 disabled 속성은 없으며 항목별로 사용 가능 여부를 지정합니다. 정확한 속성과 기본값은 각 컴포넌트 API에서 확인하세요.</p>
      <p className="body-copy">예제는 직접 실행합니다. 준비된 뒤 ‘예제로 이동’을 누르거나 Tab으로 들어가세요. 초기화·플랫폼 전환은 실행 환경과 Provider를 다시 만들고, 페이지 이탈은 예제를 제거해 진행 중인 작업 표시와 타이머를 정리합니다.</p>
    </section>
    <section id="interaction">
      <h2>조작 반응</h2>
      <p className="body-copy"><code>hover</code>는 포인터가 위에 있다는 반응이며 선택이나 작업 완료를 뜻하지 않습니다. 터치 환경처럼 hover가 없는 입력에서도 핵심 작업을 수행할 수 있어야 합니다.</p>
      <p className="body-copy">hover의 시각 표현은 컴포넌트와 플랫폼에 따라 다릅니다. Native Web Tabs는 별도의 hover 배경 변화 없이 선택과 포커스를 표시합니다.</p>
      <p className="body-copy"><code>pressed</code>는 누르고 있는 동안의 피드백입니다. 놓거나 조작을 취소하면 끝납니다. 지속되는 토글 선택을 뜻하는 <code>aria-pressed</code>와 구분하세요. 토글이 필요하면 <Link href="/components/icon-toggle">IconToggle</Link>이나 <Link href="/components/button-group">ButtonGroup</Link>의 선택 계약을 사용합니다.</p>
      <p className="body-copy"><code>focus</code>는 현재 조작 위치이고 <code>focus-visible</code>은 포커스 표시 조건입니다. 키보드 포커스는 식별할 수 있어야 하지만 마우스로 클릭했을 때의 표시까지 모든 플랫폼에서 같다고 가정하지 않습니다. <Link href="/accessibility#focus">포커스와 키보드 접근성</Link>을 함께 확인하세요.</p>
      <Example index={0} />
    </section>
    <section id="selection">
      <h2>선택</h2>
      <p className="body-copy"><Link href="/icons#variants">아이콘의 선형·채움형</Link>은 형태 선택이며 지속적인 선택 상태는 IconToggle의 계약으로 제공합니다.</p>
      <p className="body-copy">선택(<code>selected</code>)은 포인터나 포커스가 다른 곳으로 이동해도 유지됩니다. Tabs의 방향키는 포커스를 옮기고 선택 변경을 요청하며, 적용 프로젝트가 value를 반영합니다. 선택된 탭의 포커스 표시는 선택선과 함께 구분되어야 합니다.</p>
      <Example index={1} />
      <p className="body-copy">세 플랫폼 모두 TabPane의 자식을 함께 마운트하고 탭 전환 중에도 내부 입력값을 유지합니다. 선택되지 않은 패널은 화면·키보드·접근성 탐색에서 숨깁니다. 패널을 제거하거나 페이지를 떠나면 자식 상태가 해제됩니다. 숨겨진 자식의 효과·타이머는 계속 유지되므로, 프로젝트는 선택값에 따라 요청이나 구독을 시작·중지하세요.</p>
      <p className="body-copy">선택된 항목을 비활성화해도 프로젝트의 선택값을 임의로 바꾸지 않습니다. 사용 가능한 선택값과 표시할 패널은 프로젝트가 결정합니다. 탭 내부에 있던 포커스의 이동과 외부 컨트롤의 포커스 유지는 <Link href="/components/tabs#accessibility">Tabs</Link>·<Link href="/components/tab-pane">TabPane</Link> 규칙을 따릅니다.</p>
      <p className="body-copy">비활성 탭은 선택 변경뿐 아니라 우클릭·길게 누르기의 보조 메뉴 콜백도 실행하지 않습니다. 누르는 도중 항목이 비활성화되거나 제거되면 예약된 보조 동작을 취소합니다.</p>
    </section>
    <section id="availability">
      <h2>사용 가능 여부</h2>
      <DataTable headings={['상태', '사용자의 조작', '값과 포커스']} rows={[
        [<code>disabled</code>, '실행·편집·지우기를 차단합니다.', '값은 표시할 수 있습니다. 일반 웹 버튼·입력은 Tab 순서에서 빠집니다. 복합 컨트롤은 각 키보드 규칙을 확인하세요.'],
        [<><code>readonly</code> / <code>readOnly</code></>, '입력 편집·지우기를 차단합니다.', '웹 입력은 포커스와 텍스트 선택이 가능합니다. 프로젝트의 값 갱신은 반영됩니다.'],
      ]} />
      <Example index={2} />
      <p className="body-copy">웹의 네이티브 폼 제출에서 disabled 필드는 제출 대상에서 제외되고 readonly 필드는 포함될 수 있습니다. 이 규칙이 프로젝트가 직접 만드는 요청 객체에서 값을 자동으로 제외해 주지는 않습니다. Native의 선택·키보드 동작은 실제 기기에서 별도로 확인하세요.</p>
      <p className="body-copy">비활성 상태만으로 이유를 알 수는 없습니다. 사용할 수 없는 이유와 가능한 다음 행동을 주변 안내로 제공하세요. 오류·읽기 전용·비활성의 구체적인 표시 조합은 <Link href="/components/input#states">Input 상태 규칙</Link>을 따릅니다.</p>
    </section>
    <section id="loading">
      <h2>작업 진행</h2>
      <p className="body-copy">Button의 loading은 재실행을 막고 작업 진행을 표시합니다. 실제로 로딩 상태가 렌더링된 시점부터 최소 {tokens.button.loadingMinimum}ms 유지합니다. 이는 버튼 표시의 최소 시간이며 네트워크 지연이나 모든 컴포넌트의 공통 대기 시간이 아닙니다.</p>
      <Example index={3} />
      <p className="body-copy">예제는 네트워크 요청 없이 <code>idle</code> → <code>pending</code> → <code>success</code> 또는 <code>error</code>로 전환합니다. 완료·실패 처리 버튼은 <code>pending</code>일 때만 사용할 수 있습니다. 빠른 완료 후에도 최소 표시 시간 동안 저장 버튼은 잠시 로딩으로 남을 수 있습니다. 버튼 크기와 접근성 이름은 유지하고, 라벨 자리에 진행 표시를 보여 줍니다.</p>
      <p className="body-copy">웹 예제에서 저장과 완료·실패 처리를 직접 실행하면 안내 영역으로 포커스를 옮깁니다. 저장 후 Tab으로 완료·실패 처리에 접근할 수 있으며 결과는 라이브 영역으로도 전달합니다. Native 예제는 Android의 live region과 iOS의 접근성 알림을 연결합니다. 실제 네트워크 응답만으로 사용자의 포커스를 옮기지 말고, 요청 결과 알림과 다음 조작을 별도로 설계하세요. 기기별 낭독과 포커스는 실제 기기에서 검증해야 합니다.</p>
      <p className="body-copy">프로젝트는 요청 시작·성공·실패, 재시도, 서버 권한 확인과 중복 처리 방지를 책임집니다. 버튼 비활성만으로 서버 작업의 중복 실행을 방지할 수는 없습니다. <Link href="/motion#reduced-motion">동작 줄이기</Link>에서도 진행 상태의 의미와 실행 차단은 유지합니다.</p>
    </section>
    <section id="composition">
      <h2>상태 조합·플랫폼</h2>
      <DataTable headings={['조합', '유지할 계약']} rows={[
        [<><code>selected</code> + <code>focus</code></>, '선택값과 키보드 위치를 함께 식별합니다.'],
        [<><code>selected</code> + <code>disabled</code></>, '선택값은 유지하고 해당 항목의 조작은 차단합니다.'],
        [<><code>readonly</code> + <code>focus</code></>, '읽고 선택할 수 있지만 편집·지우기는 실행하지 않습니다.'],
        [<><code>disabled</code> + <code>loading</code></>, '진행 표시는 유지합니다. 로딩이 끝나도 disabled 조건은 남습니다.'],
        [<>Input <code>error</code> + <code>disabled</code></>, '오류 테두리를 유지합니다. 모든 상태에 적용되는 단일 시각 우선순위는 없습니다.'],
      ]} />
      <p className="body-copy">초기화와 재실행은 새로운 예제로 시작합니다.</p>
      <p className="body-copy">KJUN은 상태의 의미와 공통 크기·조작을 관리합니다. 프로젝트는 색상·서체, 대비, 비활성 이유, 작업 결과와 삭제·완료 후의 선택·포커스를 설계합니다. 세부 점검은 <Link href="/accessibility#responsibilities">적용 프로젝트의 접근성 책임</Link>에서 확인하세요.</p>
      <p className="body-copy">React Native 선택은 Native Web 미리보기입니다. 브라우저의 키보드·포인터 검사는 iOS·Android의 터치·하드웨어 키보드·VoiceOver·TalkBack 검증을 대신하지 않습니다. <Link href="/verification">검증 기록</Link>의 플랫폼·실행 조건과 재검증 필요 표시를 확인하세요.</p>
    </section>
  </div>;
}
