import { tokens } from '@kjun-ui/tokens'

/**
 * 디자인 시스템 공통 어휘 (단일 출처)
 *
 * size/variant 값 집합이 컴포넌트마다 갈라지는 것을 막기 위해
 * 모든 Ds 컴포넌트의 validator는 이 모듈의 집합을 사용한다.
 *
 * - SIZES_CORE: 폼/입력 계열 (Input, Select, Checkbox, Switch, Progress 등) 3단계
 * - SIZES_EXTENDED: 버튼/배지/칩 계열 (Button, Badge, ButtonGroup, FilterGroup, Spinner) 5단계
 * - SEMANTIC_VARIANTS: 상태 표현 표준 어휘. 'error'는 'danger'의 별칭으로만 수용한다
 *   (Toast는 공개 API($toast.error) 호환을 위해 내부적으로 error를 canonical로 유지).
 */
export const SIZES_CORE = ['sm', 'md', 'lg']
export const SIZES_EXTENDED = ['xs', 'sm', 'md', 'lg', 'xl']
export const SIZES_COMPACT = ['xs', 'sm', 'md']
export const ACTION_LABEL_MODES = ['icon', 'text']
export const REFRESH_VARIANTS = ['ghost', 'secondary']
export const FORM_CONFIRM_VARIANTS = ['primary', 'danger', 'success']
export const SIGNED_VALUE_FORMATS = ['number', 'percent']
export const SIGNED_VALUE_TONES = ['plain', 'pill']
export const ADDRESS_MODES = ['full', 'truncated']
export const IDENTITY_LAYOUTS = ['inline', 'stacked']

export const SEMANTIC_VARIANTS = ['success', 'warning', 'danger', 'info']

/**
 * 컨트롤 높이 사다리 (외곽 기준, Tailwind h-* 클래스)
 *
 * 버튼·버튼그룹·필터 등 툴바 컨트롤의 높이다. 입력 계열은 styles/forms.css의
 * sm 32 / md 40 / lg 48px을 사용한다. 좁은 툴바는 입력과 버튼 모두 sm으로
 * 맞추고, 일반 폼의 확정 액션은 lg(48px)을 사용한다.
 *
 * xs 24px / sm 32px / md 40px / lg 48px / xl 56px
 */
export const CONTROL_HEIGHTS = {
  xs: 'h-button-heights-xs',
  sm: 'h-button-heights-sm',
  md: 'h-button-heights-md',
  lg: 'h-button-heights-lg',
  xl: 'h-button-heights-xl',
}

/**
 * 컨트롤 아이콘 크기 사다리 (SVG 시각 면적 기준)
 *
 * Tabler SVG는 24px viewBox 내부 여백 때문에 같은 font-size의 텍스트보다 작게 보인다.
 * 버튼 글자 크기와 분리해 아이콘의 실제 시각 크기를 일관되게 유지한다.
 *
 * xs 14px / sm 16px / md 16px / lg 18px / xl 20px
 */
export const CONTROL_ICON_SIZES = tokens.button.iconSizes

// Preserve validator metadata for generated public declarations.
export const oneOf = (values) => Object.assign((v) => values.includes(v), { values })
