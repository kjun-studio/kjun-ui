'use client';
import { tokens } from '@kjun-ui/tokens';
import Link from './doc-link';
import { CodeBlock } from './code-block';
import {
  BreakpointTable, MotionScale, RadiusScale, RadiusShapes, Related, SpacingSamples, TokenIndex, TokenTable, TypeScale, numeric, spacing,
} from './token-samples';

const preferredSpacing = [4, 8, 12, 16, 20, 24, 32];
// Layout roles are the recommended names; the numeric scale stays available for fine adjustment.
const spacingRoles: [string, string][] = [
  ['space.inline.xs', '아이콘과 글자처럼 한 요소 안의 붙은 부분'],
  ['space.inline.sm', '나란한 관련 요소 · 버튼과 버튼'],
  ['space.stack.sm', '라벨과 입력칸처럼 위아래로 붙은 요소'],
  ['space.stack.md', '같은 묶음의 반복 항목 사이'],
  ['space.inset.md', '카드·패널 안쪽 여백'],
  ['space.stack.lg', '서로 다른 정보 묶음 사이'],
  ['space.section.sm', '화면의 큰 구획 사이'],
];
const roleValue = (path: string) => path.split('.').reduce<any>((value, key) => value[key], tokens) as number;
const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const inputSize = (size: typeof sizes[number]) => size === 'xs' || size === 'xl' ? undefined : tokens.input[size];
const row = (label: string, value: (size: typeof sizes[number]) => number | undefined) => [label, ...sizes.map(size => numeric(value(size) ?? '—'))];

export function Tokens() {
  return <div className="tokens-content">
    <TokenIndex />
    <section id="spacing">
      <h2>간격</h2>
      <p className="body-copy">가까운 항목은 좁게, 서로 다른 정보 묶음은 넓게 배치합니다. 직접 구성하는 화면에는 먼저 용도에 맞는 역할 토큰을 고르세요. 역할 토큰은 아래 숫자 스케일을 가리킵니다.</p>
      <TokenTable spec headings={['역할 토큰', '값', '용도']} numericColumns={[1]} rows={spacingRoles.map(([path, use]) => [<code>{path}</code>, numeric(`${roleValue(path)}px`), use])} />
      <p className="token-caption">두 블록 사이의 색칠된 영역이 실제 간격입니다. 모든 견본은 Web의 CSS px 기준이며 Native에서는 같은 수치를 논리 단위로 씁니다.</p>
      <SpacingSamples values={spacing.filter(([, value]) => preferredSpacing.includes(value))} />
      <details className="token-details">
        <summary>미세 조정과 큰 영역에 쓰는 간격</summary>
        <p className="body-copy">2·3·6·10·14px는 작은 요소 사이를 미세하게 맞출 때만 씁니다. 28px와 40px 이상은 큰 영역을 구분할 때 씁니다.</p>
        <SpacingSamples values={spacing.filter(([, value]) => !preferredSpacing.includes(value))} />
      </details>
      <Related><Link href="/layout">화면 배치</Link><Link href="/components/form-group#states">FormGroup의 항목 간격</Link></Related>
    </section>

    <section id="radius">
      <h2>모서리</h2>
      <p className="body-copy">모서리는 요소의 역할과 크기에 따라 정해집니다. 컨트롤은 크기가 커질수록 모서리도 커지고(<code>shape.control</code>), 카드처럼 큰 면은 더 둥글게(<code>shape.container</code>), 배지처럼 작은 요소는 원형(<code>shape.pill</code>)을 씁니다. KJUN 컴포넌트는 크기에 맞는 모서리를 스스로 적용합니다.</p>
      <RadiusShapes />
      <details className="token-details">
        <summary>전체 모서리 스케일</summary>
        <p className="body-copy">직접 만드는 요소에는 위 역할과 같은 값을 쓰세요. <code>radius9999</code>는 짧은 변의 절반까지 둥글게 만들어 원형과 알약 형태를 모두 표현합니다.</p>
        <RadiusScale />
      </details>
      <Related><Link href="/components/button#states">Button</Link><Link href="/components/card#states">Card</Link></Related>
    </section>

    <section id="sizes">
      <h2>컴포넌트 치수</h2>
      <p className="body-copy">Button과 Input은 같은 크기 이름에서 같은 높이와 모서리를 씁니다. 같은 줄에 놓는 컨트롤은 같은 <code>size</code>를 선택하세요.</p>
      <TokenTable spec headings={['항목', ...sizes]} numericColumns={[1, 2, 3, 4, 5]} rows={[
        row('높이', size => tokens.button.heights[size]),
        row('모서리', size => tokens.button.radii[size]),
        row('Button 좌우 여백', size => tokens.button.paddingX[size]),
        row('Button 아이콘 쪽 여백', size => tokens.button.iconSidePaddingX[size]),
        row('Button 최소 너비', size => tokens.button.minWidths[size]),
        row('Button 아이콘·라벨 간격', size => tokens.button.contentGaps[size]),
        row('Input 좌우 여백', size => inputSize(size)?.padding),
        row('Button 글자', size => tokens.button.typography[size].fontSizePx),
        row('Input 글자', size => inputSize(size)?.fontSize),
        row('아이콘', size => tokens.button.iconSizes[size]),
      ]} />
      <p className="token-caption">단위: px · —는 Input이 제공하지 않는 크기입니다. Input 글자는 모바일 브라우저의 자동 확대를 막기 위해 모든 크기에서 16px입니다.</p>
      <div className="token-touch-example">
        <div className="token-touch-area" style={{ width: tokens.native.minimumTouchTarget, height: tokens.native.minimumTouchTarget }} aria-hidden="true">
          <span style={{ width: tokens.button.heights.xs, height: tokens.button.heights.xs }} />
        </div>
        <p>보이는 크기와 누를 수 있는 영역은 다릅니다.<span className="token-caption">{tokens.button.heights.xs}px 컨트롤도 Native와 Web 터치 모드에서 최소 {tokens.native.minimumTouchTarget}px 터치 영역을 확보합니다.</span></p>
      </div>
      <Related><Link href="/components/button#states">Button 크기 선택</Link><Link href="/components/input#states">Input 크기 선택</Link></Related>
    </section>

    <section id="typography">
      <h2>타이포그래피</h2>
      <p className="body-copy">글자는 역할로 고릅니다. 한 역할은 크기·줄높이·굵기를 함께 정하므로 셋을 따로 바꾸지 마세요. 서체는 프로젝트가 연결합니다.</p>
      <TypeScale />
      <p className="token-caption">크기/줄높이 단위: px. 숫자 표시용 역할(number·display)은 같은 크기의 제목 역할을 따르며 숫자 서체와 고정폭 숫자를 씁니다.</p>
      <Related><Link href="/styling">프로젝트 서체 연결</Link></Related>
    </section>

    <section id="responsive">
      <h2>반응형 전환</h2>
      <p className="body-copy">기기 이름보다 콘텐츠가 차지하는 너비를 기준으로 배치를 바꿉니다. 컴포넌트는 아래 기준보다 좁아지면 쌓거나 카드로 바꿉니다.</p>
      <BreakpointTable />
      <p className="token-caption">단위: px. 컴포넌트는 창이 아니라 자신이 놓인 영역의 너비를 기준으로 전환합니다.</p>
      <Related><Link href="/layout#columns">반응형 화면 배치</Link><Link href="/components/table#states">Table의 반응형 표시</Link></Related>
    </section>

    <section id="motion">
      <h2>모션</h2>
      <p className="body-copy">작은 반응은 짧게, 큰 영역의 변화는 따라갈 수 있을 만큼 길게 씁니다. 동작 줄이기 설정에서는 이동 없이 결과만 보여 줍니다.</p>
      <MotionScale />
      <p className="token-caption">들어올 때는 표준 감속 <code>motion.easeOut</code>, 가장자리 패널은 강조 감속 <code>motion.easeEmphasized</code>, 나갈 때는 <code>motion.easeIn</code>과 일정 속도 페이드 <code>motion.easeLinear</code>를 씁니다. 창은 {tokens.motionDistance.modalEnter}px, 팝업은 {tokens.motionDistance.popup}px만큼 이동합니다.</p>
      <Related><Link href="/motion">모션 기준과 견본</Link></Related>
    </section>

    <section id="usage">
      <h2>토큰 사용</h2>
      <p className="body-copy">직접 구성하는 화면에는 역할 토큰(<code>space</code>·<code>shape</code>)과 타이포그래피 역할을 사용합니다. 숫자 스케일(<code>dimension</code>·<code>radius</code>)은 역할로 표현되지 않는 미세 조정에만 씁니다. KJUN 컴포넌트의 크기와 모서리는 각 컴포넌트의 속성으로 선택하세요.</p>
      <CodeBlock label="역할 토큰 선택" code={'import { tokens } from "@kjun-ui/tokens";\n\nconst gap = tokens.space.stack.md;      // 16\nconst radius = tokens.shape.container; // 16\nconst body = tokens.typography.body;'} />
      <p className="body-copy">같은 의미의 요소에는 같은 토큰을 반복해 사용합니다. 색상과 서체는 프로젝트에서 연결하고, 상태·포커스·조작 규칙은 KJUN의 공통 동작을 따릅니다.</p>
      <Related><Link href="/styling">색상·서체 연결</Link><Link href="/interaction">상태·포커스·상호작용</Link></Related>
    </section>
  </div>;
}
