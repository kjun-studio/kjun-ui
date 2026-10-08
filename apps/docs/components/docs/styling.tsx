"use client";
import tokens from "@/lib/generated/tokens.json";
import { CodeBlock } from "./code-block";
import { DataTable } from "./data-table";
import { Playground } from "./playground";

const kebab = (role: string) =>
  role.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
const webMapping =
  "/* design-system/kjun.css — 적용 프로젝트에서 관리 */\n" +
  ":root {\n" +
  tokens.coreColorRoles
    .map((role) => `  --kjun-${kebab(role)}: var(--app-${kebab(role)});`)
    .join("\n") +
  "\n  --kjun-font: var(--app-font);\n}";
const nativeMapping =
  "/* design-system/kjun.ts — 적용 프로젝트에서 관리 */\n" +
  'import type { KjunColors } from "@kjun-ui/tokens";\n' +
  'import type { ColorValue } from "react-native";\n' +
  'import { colors, fonts } from "./tokens";\n\n' +
  "export const appColors = {\n" +
  tokens.coreColorRoles.map((role) => `  ${role}: colors.${role},`).join("\n") +
  "\n} satisfies KjunColors<ColorValue>;\n\nexport const appFont = fonts.body;";

export function Styling() {
  return (
    <>
      <section id="ownership">
        <h2>색상은 프로젝트 한 곳에서 관리합니다</h2>
        <p className="body-copy">
          KJUN UI는 색상 역할과 컴포넌트 규격을 정의합니다. 실제 색상 값과 서체,
          라이트·다크 전환은 적용 프로젝트가 관리합니다. 새 프로젝트를
          추가하거나 브랜드 색상을 바꾸기 위해 공용 패키지를 수정할 필요가
          없습니다.
        </p>
        <DataTable
          headings={["KJUN UI", "적용 프로젝트"]}
          rows={[
            ["크기·간격·상태·상호작용", "색상 값·서체·라이트/다크 전환"],
            ["색상 역할과 타입", "기존 프로젝트 토큰을 공용 역할에 연결"],
          ]}
        />
      </section>
      <section id="web">
        <h2>웹: 프로젝트 CSS 변수를 연결하세요</h2>
        <p className="body-copy">
          오른쪽의 --app-*는 예시 이름입니다. 프로젝트가 이미 사용하는 변수
          이름으로 연결하고 HEX 값을 다시 복사하지 마세요. 아래 역할과
          --kjun-font를 정의합니다. 필수 색상은 {tokens.coreColorRoles.length}개이며 나머지는 선택적으로 지정합니다.
        </p>
        <CodeBlock code={webMapping} label="Vue 2 · React 공통 연결" />
        <CodeBlock
          code={
            'import "@kjun-ui/react/styles.css";\nimport "./design-system/kjun.css";\n\n<KjunProvider>\n  <DsButton variant="primary">저장</DsButton>\n</KjunProvider>'
          }
          label="웹 Provider에는 색상 속성이 없습니다"
        />
        <p className="body-copy">
          Provider는 스타일 범위를 만들며 프로젝트의 변수를 덮어쓰지 않습니다.
          앱 전체 값은 :root에서 연결하세요. 일부 영역만 다르면 해당 Provider의
          class나 style에서 변수를 연결합니다. React 모달도 가장 가까운 Provider
          안에 렌더링되어 색상·폰트와 이후 변경을 그대로 상속합니다. Provider는
          transform·filter로 고정 위치의 기준을 바꾸거나 모달을 자르는 상위 요소
          밖에 배치하세요.
        </p>
        <p className="body-copy">웹 Provider는 마운트·갱신 시 필수 색상과 --kjun-font 누락을 오류로 알립니다.
          금융 표현을 사용하는 컴포넌트는 해당 범위의 금융 역할 13개도 검사합니다.
          일반 버튼·입력·숫자 표시에는 금융 역할이 필요하지 않습니다. 폰트 파일 로딩은 프로젝트에서 확인하세요.</p>
      </section>
      <section id="native">
        <h2>Native: 프로젝트 값을 앱 루트에서 전달하세요</h2>
        <p className="body-copy">
          CSS를 사용하지 않는 Native는 colors를 필수로 받습니다. 각 항목의
          오른쪽은 기존 프로젝트 토큰에 연결하세요. KjunColors는 필수 {tokens.coreColorRoles.length}개 역할의
          누락을 타입으로 확인하며, DynamicColorIOS 같은 ColorValue도 사용할 수
          있습니다.
        </p>
        <CodeBlock code={nativeMapping} label="프로젝트 토큰 연결" />
        <CodeBlock
          code={
            "<KjunProvider colors={appColors} fontFamily={appFont}>\n  <App />\n</KjunProvider>"
          }
          label="앱 루트에서 한 번 전달"
        />
        <p className="body-copy">
          라이트·다크 전환 시 프로젝트에서 colors 값을 교체하면 열린 모달에도
          반영됩니다. 중첩 Provider는 자신의 colors를 사용하며, fontFamily를
          생략하면 부모 값을 상속합니다. 루트에서 fontFamily를 생략하면 시스템
          글꼴을 사용합니다. 사용자 정의 폰트는 앱에서 먼저 로드하세요.
          Provider나 필수 색상이 누락되면 오류를 표시하며 내장 팔레트로 대체하지
          않습니다.
        </p>
      </section>
      <section id="optional-colors">
        <h2>필요한 컴포넌트 색상만 추가하세요</h2>
        <p className="body-copy">
          선택 역할 {Object.keys(tokens.colorRoleFallbacks).length}개는 생략하면 아래 기본 역할의 프로젝트 값을 사용합니다.
          별도 색상값을 지정하면 그 값이 우선합니다. brandSubtleBg는 브랜드 강조 배경, selectedBg는 선택 배경입니다. onBrand·onDanger·onSuccess·onWarning은 각 강조 배경 위 글자와 아이콘이며 생략하면 inverse를 사용합니다.
          KjunCoreColors는 필수 역할만, ResolvedKjunColors는 연결이 끝난 전체 역할을 나타냅니다.
          Native Provider는 resolveKjunColors와 같은 규칙으로 연결합니다. 금융 역할은 별도 계약입니다.
        </p>
        <DataTable headings={["선택 역할", "생략 시 사용할 역할"]} rows={Object.entries(tokens.colorRoleFallbacks).map(([role, fallback]) => [role, fallback])} />
        <p className="body-copy">
          Card의 surface="accent"는 강조 배경, surface="subtle"은 은은한 강조 배경입니다.
          테두리는 모든 표면에서 border로 선택합니다. cardAccentStart/End와 cardSubtleStart/End/Border에
          프로젝트 색상을 연결하세요. 이름은 용도를 나타내며 실제 색상과 강도는 프로젝트가 정합니다.
        </p>
      </section>
      <section id="domain"><h2>금융 역할과 숫자 서체</h2><p className="body-copy">금융 컴포넌트를 사용할 때만 별도 KjunDomainColors 역할을 연결합니다. 같은 값을 사용해도 역할의 의미는 유지합니다. 웹 숫자 서체는 --kjun-font-numeric, Native는 numericFontFamily이며 생략하면 영역 본문 서체를 사용합니다.</p><CodeBlock label="금융 역할 연결" code={"/* 웹: 프로젝트의 기존 토큰에 연결 */\n"+tokens.domainColorRoles.map(role=>`--kjun-${kebab(role)}: var(--app-${kebab(role)});`).join("\n")+"\n\n// Native\n<KjunProvider colors={appColors} domainColors={appDomainColors}\n  fontFamily={appFont} numericFontFamily={appNumericFont}>\n  <App />\n</KjunProvider>"}/></section>
      <section id="rules">
        <h2>색상의 역할</h2>
        <p className="body-copy">HeatmapCell·ProgressCell·Deviation의 수치는 숫자 서체를 사용하며,
          Deviation 배지도 같은 규칙을 따릅니다. KpiRow의 valueKind="text"는 본문 서체를 사용합니다.
          Deviation의 text·pill·badge는 모두 priceUp/priceDown을 사용하고,
          배지 배경은 priceUpBg/priceDownBg를 사용합니다. 중립값은 보조 역할을, 경고 아이콘은 warning을 유지합니다.</p>
        <DataTable
          headings={["역할", "사용 범위"]}
          rows={[
            [
              "brand / brandHover / brandActive",
              "주요 행동·포커스와 상태 변화",
            ],
            [
              "background / surface / secondary / hover / active",
              "앱 배경·표면·보조 영역과 상태 변화",
            ],
            [
              "buttonSecondary / buttonSecondaryHover / buttonSecondaryActive",
              "secondary 버튼의 채움과 상태 변화. secondary 표면과 분리된 버튼 전용 역할",
            ],
            [
              "text / textSecondary / textTertiary / textDisabled / inverse",
              "본문·보조·안내·비활성·강조 배경 위 글자",
            ],
            ["border / borderSecondary", "기본·보조 테두리"],
            ["danger / dangerDark / dangerActive / dangerBg", "오류·삭제와 hover·누름 상태, 해당 상태의 배경"],
            [
              "success / successDark / successActive / warning / warningDark / warningActive",
              "완료·주의와 hover·누름 상태",
            ],
            [
              "overlay / shadow / shadowSubtle",
              "모달 배경과 공통 그림자의 색상",
            ],
          ]}
        />
        <p className="body-copy">
          역할의 의미와 상태별 사용 규칙은 공통으로 유지합니다. 손익·지출 같은
          업무 색상은 프로젝트에서 별도로 관리합니다. 프로젝트는
          글자·배경·포커스의 대비를 함께 확인하세요.
        </p>
        <h3>함께 확인할 색상 역할</h3>
        <DataTable headings={["조합", "사용 기준"]} rows={[
          ["text / surface·background·secondary", "본문은 각 표면 위에서 읽혀야 합니다. textSecondary·textTertiary는 중요도가 낮은 설명에 사용하며 필수 정보를 희미한 색만으로 구분하지 않습니다."],
          ["buttonSecondary* / secondary·surface", "secondary 버튼은 muted 카드처럼 secondary로 칠한 표면 위에도 놓입니다. 버튼 역할은 surface와 secondary 양쪽에서 구분되는 값으로 지정합니다."],
          ["textDisabled / buttonSecondary", "비활성 버튼은 variant와 관계없이 buttonSecondary 배경과 textDisabled 글자를 사용합니다. ghost 계열은 배경 없이 글자만 바뀝니다."],
          ["onBrand / brand·brandHover·brandActive", "브랜드 버튼과 Card의 brand 표면에 사용합니다. 그라데이션의 양 끝과 중간, hover·active 상태에서 함께 확인합니다."],
          ["onDanger·onSuccess·onWarning / danger·success·warning", "채운 상태 버튼의 전경입니다. 기본 대체값 inverse가 해당 배경과 맞지 않으면 on* 역할을 직접 지정합니다."],
          ["success·warning·danger / *Bg·*Light", "Bg는 상태 설명의 옅은 바탕, Light와 LightEnd는 카드 그라데이션, Accent는 강조 아이콘·장식에 사용합니다. 배경·아이콘·문구를 함께 확인합니다."],
          ["focusRing / 인접 표면·테두리", "키보드 포커스가 기본·선택·오류 표면 모두에서 구분되도록 지정합니다."],
          ["glassBg·glassBorder / 실제 뒤쪽 콘텐츠", "반투명색은 겹쳐 보이는 배경에 따라 결과가 달라집니다. 밝고 어두운 이미지 위에서 본문과 테두리를 확인합니다."],
        ]} />
        <p className="body-copy">선택 역할의 대체값은 누락된 색을 채우는 규칙입니다. 상태 차이나 읽기 좋은 대비를 자동으로 보장하지 않으므로 앱의 각 색상 모드에서 기본·hover·active·focus·disabled 조합을 확인하세요.</p>
      </section>
      <section id="preview">
        <h2>같은 컴포넌트, 다른 프로젝트 값</h2>
        <p className="body-copy">
          아래 색상은 문서가 직접 정의한 예제입니다. 배포 패키지에는 포함되지
          않으며, 웹 CSS 변수와 Native colors에 같은 역할의 값을 연결합니다.
        </p>
        <Playground />
      </section>
    </>
  );
}
