'use client';
import type { ReactNode } from 'react';
import { tokens } from '@kjun/tokens';
import Link from './doc-link';
import { DataTable } from './data-table';
import { MotionPlayground } from './motion-playground';
import { MotionDistanceFigure } from './motion-figures';
import { MotionCurveComparison } from './motion-curve-comparison';
import { MotionPreference } from './motion-preference';
import { MotionInterruptDemo } from './motion-interrupt';
import { MotionSpeedProvider, SpeedDock } from './motion-speed';
import { reachMs, type CurveName } from './motion-curves';

const ms = (value: number) => <span className="motion-number">{value}ms</span>;
const code = (...names: string[]) => <span className="motion-token-names">{names.map(name => <code key={name}>{name}</code>)}</span>;
const durations = tokens.motion as unknown as Record<string, number>;
// A row shows one duration, so every token grouped in it must share that value.
function duration(tokenNames: string[]) {
  const values = new Set(tokenNames.map(name => durations[name]));
  if (values.size !== 1) throw new Error(`Motion timing row mixes durations: ${tokenNames.join(', ')}`);
  return [...values][0];
}
// One row per role: token, time, curve and when 90% of the movement is visible.
// Fades and color changes do not travel, so they have no 90% point.
const timing = (role: ReactNode, tokenNames: string[], curve: CurveName, moves = true) => {
  const time = duration(tokenNames);
  return [role, code(...tokenNames.map(name => 'motion.' + name)), ms(time), code('motion.' + curve), moves && curve !== 'easeLinear' ? ms(reachMs(curve, time)) : '—'];
};
const durationRow = (role: ReactNode, name: string, curve: string) => [role, code('motion.' + name), ms(duration([name])), curve, '—'];

export function FoundationMotionGuide() {
  return <MotionSpeedProvider>
    <section id="principles">
      <h2>사용 원칙</h2>
      <p className="body-copy">모션은 선택의 변화, 패널의 위치, 작업의 진행을 이해하는 데 사용합니다. 사용자가 달라진 상태를 알아볼 수 있는 만큼만 움직이세요.</p>
      <ul className="body-copy motion-principles">
        <li><strong>조작에 바로 반응합니다.</strong> 결과와 선택 상태는 즉시 바꾸고, 전환 중에도 다음 조작을 받습니다.</li>
        <li><strong>움직임에 이유를 둡니다.</strong> 등장·퇴장은 공간 관계를, 반복 모션은 진행 중인 작업을 표현합니다.</li>
        <li><strong>결과를 함께 설명합니다.</strong> 완료·오류·로딩은 문구와 상태로도 전달합니다.</li>
      </ul>
      <MotionPreference />
    </section>
    <section id="easing-distance">
      <h2>속도 곡선·이동 거리</h2>
      <p className="body-copy">등장과 선택 변화는 표준 감속으로 반응하고, 화면 가장자리에서 먼 거리를 이동하는 패널만 강조 감속을 씁니다. 퇴장 이동은 가속하고, 투명도는 일정한 속도로 먼저 사라집니다.</p>
      <MotionCurveComparison />
      <h3>이동 거리 선택</h3>
      <p className="body-copy">작은 팝업은 짧게, 화면 가장자리의 패널은 패널 크기만큼 이동합니다. 선택선·펼침·알림 재배치는 실제 위치와 크기의 차이를 따라갑니다.</p>
      <MotionDistanceFigure />
      <p className="motion-caption">거리 견본은 Web의 CSS px 기준입니다. Native는 같은 수치를 논리 단위로 사용합니다.</p>
      <div className="motion-related"><span>관련 문서</span><Link href="/components/popover#states">작은 팝업</Link><Link href="/components/drawer#states">가장자리 패널</Link></div>
    </section>
    <section id="timing">
      <h2>전환 시간</h2>
      <p className="body-copy">작은 상태 변화는 빠르게 전달하고, 새 영역의 등장은 위치를 알아볼 수 있게 표현합니다. 디자인과 구현은 아래 토큰 이름으로 같은 전환을 가리킵니다.</p>
      <div className="motion-table"><DataTable headings={['역할', '토큰', '시간', '곡선', '90% 도달']} numericColumns={[2, 4]} rows={[
        timing(<>상태 피드백 <Link href="/components/tabs#states">Tabs</Link></>, ['control', 'indicator', 'collapse'], 'easeOut'),
        timing('팝업 등장', ['popupEnter', 'toastEnter'], 'easeOut'),
        timing(<>창 등장 <Link href="/components/modal#states">Modal</Link></>, ['layerEnter'], 'easeOut'),
        timing(<>가장자리 패널 등장 <Link href="/components/drawer#states">Drawer</Link></>, ['layerEnter'], 'easeEmphasized'),
        timing('스크림 등장', ['backdrop'], 'easeOut', false),
        timing('툴팁 등장', ['tooltipEnter'], 'easeOut', false),
        timing('창·패널 퇴장 이동', ['layerExit'], 'easeIn'),
        timing('팝업·알림 퇴장 이동', ['popupExit', 'toastExit'], 'easeIn'),
        timing('스크림 퇴장 페이드', ['backdropExit'], 'easeLinear'),
        timing('팝업·툴팁 퇴장 페이드', ['fadeExit', 'tooltipExit'], 'easeLinear'),
        durationRow(<>숫자 변화 <Link href="/components/animated-number#states">AnimatedNumber</Link></>, 'number', '감속 보간'),
        timing(<>진행률 변화 <Link href="/components/progress#states">Progress</Link></>, ['progress'], 'easeOut'),
        timing(<>가격 변동 글자색 <Link href="/components/price-cell#states">PriceCell</Link></>, ['priceFlash'], 'easeOut', false),
        timing('가격 변동 배경', ['priceBackground'], 'easeOut', false),
        durationRow(<>반복 회전 <Link href="/components/spinner#states">Spinner</Link></>, 'spin', '일정 속도, 작업 중에만'),
        durationRow(<>반복 강조 <Link href="/components/skeleton#states">Skeleton</Link></>, 'shimmer', '왕복, 작업 중에만'),
      ]} /></div>
      <p className="motion-caption">ms는 1/1,000초입니다. 90% 도달은 이동 거리의 90%가 보이는 시점으로, 사용자가 체감하는 전환 길이에 가깝습니다. 퇴장 페이드는 이동보다 먼저 끝나 사라지는 순간이 끊겨 보이지 않습니다.</p>
      <div className="motion-related"><span>관련 문서</span><Link href="/feedback#states">알림과 피드백</Link><Link href="/components/animated-number#states">숫자 변화</Link></div>
    </section>
    <section id="examples">
      <h2>실제 동작 예제</h2>
      <p className="body-copy">살펴볼 동작을 선택하고 아래에서 직접 조작해 보세요. 예제마다 표시한 토큰은 앞의 전환 시간 표와 같은 이름입니다. 전환 도중 다시 조작했을 때 이어지는 움직임도 확인할 수 있습니다.</p>
      <MotionPlayground />
      <details className="motion-details">
        <summary>예제 실행 환경 안내</summary>
        <p>선택한 예제는 바로 조작할 수 있습니다. 모션은 직접 조작할 때 시작하며, 레이어와 알림은 시연 영역 안에서 열립니다.</p>
        <p>다른 예제 선택·초기화·플랫폼 전환은 열린 레이어와 알림, 진행 중인 전환을 정리합니다. 각 예제는 처음 상태에서 시작합니다.</p>
        <p>Vue 2·React는 브라우저에서 실행합니다. React Native 선택은 Native Web 미리보기이며, iOS·Android 기기 검증은 별도로 필요합니다.</p>
      </details>
    </section>
    <section id="interruption">
      <h2>연속 조작</h2>
      <p className="body-copy">전환 도중 다시 조작하면 현재 위치나 값에서 새 목표로 이어집니다. 이전 움직임이 끝날 때까지 기다리게 하지 않습니다.</p>
      <MotionInterruptDemo />
      <ul className="body-copy motion-principles">
        <li>실제 동작 예제에서 Tabs를 빠르게 왕복하거나 Accordion을 펼치는 중 다시 눌러 보세요.</li>
        <li>숫자가 증가하는 중 더 작은 값을 선택하면 현재 표시값에서 방향이 바뀝니다.</li>
        <li>Modal·Drawer를 닫으면 이전 실행 버튼으로 포커스가 돌아옵니다. 닫힘 자체가 작업 성공을 뜻하지는 않습니다.</li>
      </ul>
      <div className="motion-related"><span>관련 문서</span><Link href="/interaction">상태·포커스·상호작용</Link></div>
    </section>
    <section id="reduced-motion">
      <h2>동작 줄이기</h2>
      <p className="body-copy">움직임을 줄여도 선택 결과와 작업 상태는 동일하게 전달합니다. 시스템 설정은 열려 있는 예제와 곡선 비교에도 바로 반영됩니다.</p>
      <dl className="motion-reduced-comparison">
        <div><dt>일반 동작</dt><dd>위치·높이·숫자가 현재 상태에서 목표로 이어집니다. 진행 중인 작업은 반복 모션으로 표시합니다.</dd></div>
        <div><dt>동작 줄이기</dt><dd>위치·높이·숫자는 최종 상태를 바로 보여줍니다. 반복 모션은 줄이거나 멈추고, 로딩 문구와 상태는 유지합니다.</dd></div>
      </dl>
      <p className="body-copy">Toast의 남은 알림도 동작 줄이기를 켜면 즉시 배치합니다. 설정을 다시 꺼도 끝난 전환을 재생하지 않으며, 다음 조작부터 움직임이 적용됩니다.</p>
      <div className="motion-related"><span>관련 문서</span><Link href="/accessibility">접근성</Link><Link href="#easing-distance">일반 동작과 줄인 동작 비교</Link></div>
    </section>
    <SpeedDock />
  </MotionSpeedProvider>;
}
