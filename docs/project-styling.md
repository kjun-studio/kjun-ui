# 프로젝트 색상·서체 연결

KJUN UI는 색상 역할과 공통 규격을 정의합니다. 적용 프로젝트는 실제 값과 라이트/다크 전환을 소유합니다. 색상을 변경할 때 공용 패키지를 다시 배포하지 않습니다.

## 웹

`@kjun-ui/react/styles.css` 또는 `@kjun-ui/vue2/styles.css`를 한 번 가져오고 프로젝트에서 아래 연결 파일을 만듭니다. `--app-*`는 예시 이름이므로 우변을 실제 프로젝트 토큰으로 연결하세요. 값을 복사하지 않습니다.

```css
:root {
  --kjun-brand: var(--app-brand);
  --kjun-brand-hover: var(--app-brand-hover);
  --kjun-brand-active: var(--app-brand-active);
  --kjun-background: var(--app-background);
  --kjun-surface: var(--app-surface);
  --kjun-secondary: var(--app-secondary);
  --kjun-hover: var(--app-hover);
  --kjun-active: var(--app-active);
  --kjun-button-secondary: var(--app-button-secondary);
  --kjun-button-secondary-hover: var(--app-button-secondary-hover);
  --kjun-button-secondary-active: var(--app-button-secondary-active);
  --kjun-text: var(--app-text);
  --kjun-text-secondary: var(--app-text-secondary);
  --kjun-text-tertiary: var(--app-text-tertiary);
  --kjun-text-disabled: var(--app-text-disabled);
  --kjun-inverse: var(--app-inverse);
  --kjun-border: var(--app-border);
  --kjun-danger: var(--app-danger);
  --kjun-danger-active: var(--app-danger-active);
  --kjun-success: var(--app-success);
  --kjun-success-active: var(--app-success-active);
  --kjun-warning: var(--app-warning);
  --kjun-warning-active: var(--app-warning-active);
  --kjun-overlay: var(--app-overlay);
  --kjun-shadow: var(--app-shadow);
  --kjun-info: var(--app-info);
  --kjun-focus-ring: var(--app-focus-ring);
  --kjun-font: var(--app-font);
  --kjun-font-numeric: var(--app-font-numeric, var(--app-font));
}
```

```tsx
import "@kjun-ui/react/styles.css";
import "./design-system/kjun.css";

<KjunProvider>
  <DsButton variant="primary">저장</DsButton>
</KjunProvider>
```

Provider에는 `theme` prop이 없습니다. `.kjun-scope` 범위와 컴포넌트 스타일의 역할 연결만 제공하며 색상을 덮어쓰지 않습니다. 라이트/다크 전환은 기존 앱 변수 값을 바꾸세요. 부분 영역은 중첩 Provider의 class/style에 CSS 변수를 연결합니다.

React 모달은 가장 가까운 Provider 안에 렌더링되어 해당 영역의 색상·폰트와 변경을 상속합니다. Provider는 transform/filter로 고정 위치의 기준을 변경하거나 모달을 자르는 상위 요소 밖에 배치합니다. Provider가 없는 React 모달은 document.body에 렌더링되어 문서 루트의 변수를 사용합니다. Vue 모달은 기존처럼 Provider 안에 렌더링됩니다.

필수 27개 색상 역할(`coreColorRoles`)과 `--kjun-font`를 연결합니다. 선택 역할은 생략할 수 있습니다. 공용 패키지는 누락된 CSS 변수를 제품 팔레트로 대체하지 않습니다.

웹 Provider는 마운트·갱신 시 필수 색상과 `--kjun-font` 누락을 오류로 알립니다. 금융 색상을 사용하는 컴포넌트는 자신이 렌더링되는 범위에서 13개 금융 역할의 연결도 검사합니다. 일반 버튼·입력·숫자 표시만 사용하는 영역에는 금융 역할을 요구하지 않습니다. 폰트 파일의 로딩 여부와 색상 대비는 적용 프로젝트에서 확인합니다.

## Native

```tsx
import type { ColorValue } from "react-native";
import type { KjunColors } from "@kjun-ui/tokens";
import { colors, fonts } from "./tokens";

export const appColors = {
  brand: colors.brand,
  brandHover: colors.brandHover,
  brandActive: colors.brandActive,
  background: colors.background,
  surface: colors.surface,
  secondary: colors.secondary,
  hover: colors.hover,
  active: colors.active,
  buttonSecondary: colors.buttonSecondary,
  buttonSecondaryHover: colors.buttonSecondaryHover,
  buttonSecondaryActive: colors.buttonSecondaryActive,
  text: colors.text,
  textSecondary: colors.textSecondary,
  textTertiary: colors.textTertiary,
  textDisabled: colors.textDisabled,
  inverse: colors.inverse,
  border: colors.border,
  danger: colors.danger,
  dangerActive: colors.dangerActive,
  success: colors.success,
  successActive: colors.successActive,
  warning: colors.warning,
  warningActive: colors.warningActive,
  overlay: colors.overlay,
  shadow: colors.shadow,
  info: colors.info,
  focusRing: colors.focusRing,
} satisfies KjunColors<ColorValue>;
export const appFont = fonts.body;

// 앱 루트
<KjunProvider colors={appColors} fontFamily={appFont}>
  <App />
</KjunProvider>
```

우변을 프로젝트의 기존 토큰으로 연결하세요. `colors`는 필수 27개 역할을 가진 값이며 필요한 선택 역할을 추가할 수 있습니다. 색상이나 Provider가 누락되면 오류를 표시합니다. Context 접근은 `useKjunStyles()`를 사용합니다. `ColorValue`를 지원하며 모드 전환 시 프로젝트에서 전달 값을 변경합니다. 열린 모달에도 값이 반영됩니다.

중첩 Provider는 색상을 별도로 전달하고 fontFamily를 생략하면 부모 값을 상속합니다. 루트에서 서체를 생략하면 시스템 글꼴을 사용하며, 사용자 정의 폰트 로딩은 앱의 책임입니다.

## 선택 역할과 기존 매핑

`KjunColors`는 `KjunCoreColors`의 27개 필수 역할과 `colorRoleFallbacks`에 정의된 선택 역할을 받습니다. 생략한 역할은 `colorRoleFallbacks`에 따라 프로젝트가 이미 전달한 값으로 연결합니다. 예를 들어 inputBg는 secondary, inputBorderFocus는 focusRing, chartGrid는 border를 사용합니다. 패키지에 고정 색상값을 추가하지 않습니다.

웹은 기존 `--kjun-*` 변수 이름을 그대로 사용합니다. 명시적으로 제공한 선택 역할은 상속한 값도 포함하여 항상 우선합니다. Native의 `resolveKjunColors(colors)`와 Provider는 같은 역할 연결을 적용하며, `useKjunStyles().colors`는 전체 역할이 있는 `ResolvedKjunColors<ColorValue>`를 반환합니다. 모드 변경 시 생략한 역할도 새 프로젝트 값을 따라갑니다.

`colorRoles`에 정의된 현재 역할 이름으로 작성한 전체 매핑도 사용할 수 있습니다. 차트·카드·그라데이션 등 특정 표현이 필요할 때만 해당 선택 역할을 추가하세요. 정확한 목록과 연결 대상은 [색상·서체 가이드](http://127.0.0.1:4173/styling#optional-colors)와 tokens.json에서 확인할 수 있습니다. 문서 실행 예제의 설정에는 미리보기 색상을 재현하기 위한 선택 역할도 포함됩니다.

## 카드 표면과 색상 역할

`DsCard`의 `surface="accent"`는 강조 배경, `surface="subtle"`은 은은한 강조 배경이며 `surface="brand"`는 브랜드 배경입니다. 실제 색상과 강도는 적용 프로젝트가 결정합니다.

| 표면 | 연결할 선택 역할 |
| --- | --- |
| `accent` | `cardAccentStart` / `cardAccentEnd` |
| `subtle` | `cardSubtleStart` / `cardSubtleEnd` / `cardSubtleBorder` |
| `brand` | 배경은 `brand` / `brandHover`, 전경은 `onBrand` |
| `glass` | `glassBg` / `glassBorder` |

테두리는 모든 표면에서 `border`로 선택하고, 그림자는 `elevation="flat"` 또는 `"raised"`로 선택합니다. 배경 선택과 테두리·그림자는 독립적입니다.

Accent·Subtle의 Start를 생략하면 `secondary`, End를 생략하면 `surface`, `cardSubtleBorder`를 생략하면 `border`의 프로젝트 값을 사용합니다. 내부 CSS 클래스에 의존하지 말고 공개 `surface` 속성과 색상 역할을 연결하세요.

## 유지하는 계약과 검증

크기·간격·반경·이벤트와 상태 의미는 공통 규격을 유지합니다. 상태별 글자·배경·테두리·포커스와 그림자 색상을 프로젝트에서 연결하며 업무 색상은 따로 관리합니다. 문서 예시 색상은 shared/demo-colors.ts에만 있고 패키지에는 포함되지 않습니다.

검증은 압축 설치한 패키지로 수행합니다. 프로젝트 색상 적용, 열린 모달의 값 갱신, 중첩 범위, 필수 값 누락, 기존 키보드·입력·모달 동작을 확인합니다. Native Web 테스트는 iOS/Android 기기 검증을 의미하지 않습니다.

## 금융 표현과 숫자 서체

금융 표현에는 별도 KjunDomainColors 계약의 13개 역할을 연결합니다. 웹은 --kjun-price-up / --kjun-price-down 등 domainColorRoles의 CSS 변수를, Native는 domainColors를 전달합니다. 정확한 목록은 tokens.json의 colorRoles·domainColorRoles와 문서의 색상·서체 연결 페이지에서 확인합니다. 숫자 서체는 --kjun-font-numeric / numericFontFamily이며 생략 시 영역의 본문 서체를 사용합니다.

HeatmapCell·ProgressCell·Deviation의 수치는 숫자 서체를 사용하며, Deviation의 배지 표현도 같은 규칙을 따릅니다. KpiRow의 `valueKind="text"`는 본문 서체를 사용합니다. Deviation은 text·pill·badge 모두 방향에 따라 `priceUp/priceDown`을 사용하고, 배지 배경은 `priceUpBg/priceDownBg`에 연결합니다. 중립 범위는 보조 텍스트·표면 역할을 유지하며 경고 아이콘만 `warning`을 사용합니다.
