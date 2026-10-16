# 변경 내역

KJUN UI 패키지(`@kjun-ui/icons`·`tokens`·`vue3`·`react`·`native`)는 같은 버전으로 함께 배포합니다. `@kjun-ui/vue2`는 0.5.x까지 함께 배포했습니다.

## 0.6.2 — 2026-10-16

첫 적용 프로젝트의 피드백에서 찾은 결함을 고쳤습니다.

- **숫자 글꼴**: `.kjun-type-number-*`·`.kjun-type-display-*`가 접두사 없는 앱 변수 `--font-numeric`을 읽던 것을 `--kjun-font-numeric`(없으면 `--kjun-font`) 연결로 바꿨습니다. 앱이 `--font-numeric`을 정의하지 않아도 숫자 글꼴이 적용됩니다. 전역 이름 검사가 CSS `var()` 참조도 확인합니다.
- **IconToggle**: `activeColorClass`·`inactiveColorClass`로 넘긴 앱 색 클래스가 실제로 아이콘 색을 정합니다(이전에는 기본 색이 이겼습니다). 색 클래스를 쓰면 KJUN 기본 색과 hover 색을 적용하지 않습니다.
- **KpiHero**: 좁은 화면(400px 이하)에서 보조 지표가 셋 이상이면 두 열로 감쌉니다. 한 줄에 몰려 숫자가 자릿수 사이에서, 라벨이 음절 사이에서 끊기던 문제를 고쳤습니다. 새 토큰 `breakpoints.narrow`(400)와 `responsive.kpiHeroSecondary`를 추가했습니다.
- **Deviation**: 단계 경계(0.1·0.5·1%)를 `deviationThresholds`·`deviationLevel()`로 export하고, 단계별 배경 투명도를 토큰 `states.opacity.deviationLow·Medium·Strong`으로 옮겼습니다. 앱은 같은 경계를 사본 없이 가져다 쓸 수 있습니다.
- `forms.css`에 남아 있던 Vue 2 전용 `kj-` 선택자를 지웠습니다(Vue 3·React에는 영향 없음).

## 0.6.1 — 2026-10-15

- npm에 표시되는 패키지 설명(README)에서 Vue 2 안내를 Vue 3로 고쳤습니다(`@kjun-ui/icons`, `@kjun-ui/react`, `@kjun-ui/native`). 코드 변경은 없습니다.
- `@kjun-ui/vue3`도 다른 패키지처럼 GitHub Actions에서 provenance와 함께 배포합니다.

## 0.6.0 — 2026-10-15

Vue 패키지를 Vue 3용 `@kjun-ui/vue3`로 새로 만들었습니다. `@kjun-ui/vue2`는 0.5.x가 마지막 버전이며 더 이상 갱신하지 않습니다. **깨지는 변경**입니다.

- `@kjun-ui/vue3`는 Vue 3.5 이상이 필요합니다(peer `vue ^3.5`). React 패키지와 같은 DOM·클래스·`data-*`·`aria-*`를 렌더링하고, 스타일은 토큰 CSS만 사용합니다. Vue 2의 `kj-` 유틸리티 클래스는 더 이상 배포하지 않습니다.
- 플러그인: `app.use(Kjun)` (`import Kjun from '@kjun-ui/vue3/plugin'`). `{ skipExisting: true }` 옵션은 그대로입니다.
- 문서의 Vue 예제는 `<script setup>` SFC입니다. 예전 `?platform=vue2` 링크는 Vue 3 문서로 열립니다.

| Vue 2 (0.5) | Vue 3 (0.6) |
| --- | --- |
| `v-model` (`value` / `input`) — Input·Select 등 값 컴포넌트 | `v-model` (`modelValue` / `update:modelValue`) |
| Modal·Drawer·Popover `v-model` (`value` / `input`) | `v-model:open` |
| Select `:open.sync` | `v-model:open` |
| Table `selection-change`, `:sort.sync` + `sort-change`, `row-expand`·`row-collapse` | `v-model:selected`, `v-model:sort`, `v-model:expandedRows` |
| Pagination `update:currentPage`, `update:page-size` | `v-model:page`, `v-model:pageSize` |
| 슬롯 `header-actions`, `menu-header`, `selection-toolbar`, `sub-label`, SearchInput `item` | `headerActions`, `menuHeader`, `selectionToolbar`, `subLabel`, `option` |
| `formatters` 주입·prop | 컴포넌트별 `formatter`·`formatMetric` 함수 prop (React와 같음) |
| `inject: ['kjunFeedback']`, `this.kjunFeedback` | `const feedback = useKjunFeedback()` |
| Button `htmlType` | `type` |
| Icon `size="16px"` | `:size="16"` 또는 CSS 길이 문자열 |
| ErrorBoundary 새로고침 버튼 | `다시 시도`로 경계를 초기화, `fallback` 슬롯·`reset` 이벤트 |
| Breadcrumb `navigate` 이벤트 | `link` 슬롯 (`{ item, label }`) |
| RadioGroup 그룹 `disabled` | 옵션별 `disabled` (React와 같음) |

- 이벤트 이름은 kebab-case(`@page-change`, `@toggle-interest`, `@search-error`)이며, 행 클릭·재시도처럼 연결 여부로 동작이 바뀌는 콜백(`@row-click`, `@retry`)은 prop으로 선언되어 있습니다.
- 모든 슬롯은 타입(`SlotsType`)으로 선언되어 IDE에서 슬롯 이름과 데이터를 확인할 수 있습니다.
- 모든 웹 패키지의 `styles.css`에서 Vue 2 전용 규칙(Tailwind `kj-` 유틸리티, Vue 2 컴포넌트 스타일)을 뺐습니다. React·Vue 3 컴포넌트가 쓰는 `kjun-` 규칙은 그대로이며, 앱이 `kj-` 클래스를 직접 쓰고 있었다면 앱 스타일로 옮기세요.
- 입력 스타일(`forms.css`)은 토큰 패키지 소스로 옮겼습니다. 배포되는 `styles.css` 내용은 같습니다.
- Native: `block` RefreshButton이 행 폭을 채웁니다. 툴팁 래퍼가 내용 폭으로 줄이던 문제를 고쳤습니다.
- Native: QuantityStepper의 바깥 모서리 반경이 루트에 적용되고, 웹에서 `block`이 아니면 내용 폭에 맞춥니다(React와 같음).
- Vue 3: Popover 대화상자 안에서 Tab 포커스가 유지되고, 사라지는 중인 Toast처럼 `inert`인 요소는 Tab 순서에서 빠집니다.

## 0.5.1 — 2026-10-15

- **앱 래퍼에 붙이는 폼 레이아웃 도우미를 클래스에서 속성으로 바꿨습니다.** `class="kjun-form-layout"` 대신 `data-kjun-layout="form"`을 붙이세요. `kjun-`으로 시작하는 클래스는 KJUN 마크업으로 처리되기 때문에, 0.5.0에서는 이 도우미를 붙인 앱 래퍼와 그 안의 앱 요소가 KJUN 기본 텍스트(14px·줄높이 20px, 글꼴·색)와 reset을 받았습니다. 이제 래퍼와 안쪽 앱 요소는 앱 스타일을 그대로 유지하고, 래퍼 바로 아래 폼 그룹의 기본 아래 여백만 없어집니다. `kjun-form-layout` 클래스는 없앴습니다.

## 0.5.0 — 2026-10-14

KJUN이 앱과 함께 쓰는 이름 공간(CSS 클래스·변수·keyframes·요소 id, Vue 전역 컴포넌트·provide 키·인스턴스 멤버, 패키지 export)의 모든 이름이 `kjun`으로 시작합니다. 앱이 같은 이름을 써도 서로 영향을 주지 않습니다. 호환 별칭 없이 바뀌는 **깨지는 변경**입니다.

| 이전 | 0.5.0 |
| --- | --- |
| 컴포넌트·타입 `DsButton`, `DsButtonProps` … (세 플랫폼) | `KjunButton`, `KjunButtonProps` … |
| Vue 템플릿 태그 `<ds-button>` | `<kjun-button>` |
| Vue 마크업 클래스 `ds-*` (`ds-modal-container`, `ds-kpi-row__value` …) | `kjun-*` |
| `ds-form-layout` | `kjun-form-layout` |
| `flashClass` 값 `price-flash-up` / `price-flash-down` (`-bg`, `-bg-pop`, `-bg-strong` 포함) | `kjun-price-flash-up` / `kjun-price-flash-down` … |
| `mobile-simple-list*` 클래스 | `kjun-mobile-simple-list*` |
| Provider에 정의되던 접두사 없는 변수 (`--border`, `--brand`, `--text-primary`, `--font-sans`, `--ease-out`, `--motion-*`, `--extension-*` 등 582개) | 내부 변수 `--_kjun-*`. 공개 색상·서체 변수 `--kjun-*`는 그대로입니다. |
| Vue 인스턴스 메서드 `$formatNumber` 등 8개, `$toast` | `kjunFormatNumber` …, `kjunToast` |
| Vue provide 키 `dropdown`, `radioGroup`, `tabsContainer`, `accordion`, `dsFormGroup` | `kjunDropdown`, `kjunRadioGroup`, `kjunTabs`, `kjunAccordion`, `kjunFormGroup` |
| Vue 전용 마켓 클래스 `metric-pills`·`metric-pill`·`pill-arrow`, `market-table`, `market-card`·`card-left`·`card-right` … | `kjun-metric-pill-group`·`kjun-metric-pill`·`kjun-metric-pill-arrow`, `kjun-market-table-frame`, `kjun-market-card`·`kjun-market-card-left`·`kjun-market-card-right` … |
| Vue Drawer 바깥 레이어 `ds-drawer-overlay` | `kjun-drawer-layer` |
| 생성되는 요소 id (`tab-…`, `tabpanel-…`, `accordion-header-…`, `modal-title-…`, `drawer-title-…`, React·Native `useId` 값 등) | `kjun-`로 시작 |
| `--card-border` | `--_kjun-role-card-border` |

- **Provider가 `--border`, `--font-sans` 같은 변수를 더 이상 정의하지 않습니다.** 앱 CSS가 이 이름을 읽으면 앱의 값이 그대로 쓰입니다. KJUN이 정의하던 값에 기대던 앱 CSS는 앱에서 직접 정의하세요.
- **Vue 플러그인**: `Vue.use(Kjun, { skipExisting: true })`(`import Kjun from '@kjun-ui/vue2/plugin'`)로 앱이 이미 등록한 같은 이름의 컴포넌트를 유지할 수 있습니다. 옵션 없이 설치하면 덮어쓰기 전에 경고합니다.
- **Vue `KjunErrorBoundary`**는 가장 가까운 경계만 에러를 처리합니다. `error` 이벤트(React·Native의 `onError`)를 내보내고 앱의 `Vue.config.errorHandler`(없으면 콘솔)로 에러를 알립니다. 바깥 경계는 반응하지 않습니다. 이전에는 에러를 알리지 않고 삼켰습니다.
- **감속 모드(`prefers-reduced-motion`)**의 애니메이션 단축이 kjun 컴포넌트에만 적용됩니다. Provider 안 앱 애니메이션은 그대로 재생됩니다.
- **kjun 마크업 판별**: 클래스가 `kjun-`으로 *시작*할 때만 kjun 마크업으로 처리합니다. `my-kjun-logo` 같은 앱 클래스는 앱 마크업입니다.
- 폼 그룹 간격 규칙이 앱의 `flex`·`grid` 클래스를 읽지 않습니다. 앱 래퍼에서 폼 그룹을 나란히 배치할 때는 `kjun-form-layout`을 붙이세요.
- Vue Select의 지우기 버튼 자리 여백이 다시 적용됩니다(0.4.0에서 빠졌던 규칙).
- 저장소의 단위 테스트(`tests/global-names.test.mjs`)가 빌드 결과의 CSS 클래스·변수·keyframes, 요소 id, Vue 전역 컴포넌트·provide 키·인스턴스 멤버를 확인하고, `kjun`으로 시작하지 않는 이름이 있으면 실패합니다. 패키지 export는 예전 `Ds*` 이름이 남지 않았는지만 확인합니다.
- 컴포넌트 안에서 다른 컴포넌트·provide 키를 직접 참조하던 앱 코드(예: `inject: ['dropdown']`로 만든 사용자 정의 항목)는 위 표의 새 이름을 쓰세요.

## 0.4.2 — 2026-10-14

- 0.4.1에서 빠진 `ds-*` 규칙도 kjun 컴포넌트 안에서만 적용됩니다. `:is(.kjun-…, .ds-…)`처럼 kjun 클래스가 선택지로만 들어 있던 규칙이 앱 마크업에 적용되던 문제를 고쳤습니다. 대상: KPI·숫자 표시(`ds-kpi-hero*`, `ds-kpi-row*`, `ds-animated-number*`), `ds-button-group`, `ds-badge`, `ds-breadcrumb-link`, `ds-pagination-button`.

## 0.4.1 — 2026-10-14

- `ds-`로 시작하는 kjun 컴포넌트 스타일(입력 필드, 선택 컨트롤, 드롭다운 항목, 폼 그룹 등 57개 클래스)이 kjun 컴포넌트 안에서만 적용됩니다. 앱 마크업이 같은 `ds-*` 이름을 써도 Provider 안에서 kjun 스타일을 받지 않습니다.
- 앱 래퍼에 붙이는 레이아웃 도우미는 `kjun-form-layout`을 쓰세요. `ds-form-layout`은 0.4.x 동안 그대로 동작하지만 다음 버전에서 제거할 예정입니다.

## 0.4.0 — 2026-10-11

`KjunProvider`(와 `KjunFeedbackProvider`)로 앱 전체를 감싸도 kjun CSS가 앱 마크업의 모양을 바꾸지 않습니다. 컴포넌트·props·이벤트·슬롯·`--kjun-*` 변수 이름은 그대로지만, 아래 항목은 **깨지는 변경**입니다.

- **Provider가 앱 요소를 꾸미지 않습니다.** 기본 스타일 초기화(reset), Tailwind 기본 변수(`--tw-*`), 기본 글꼴·글자색·글자 크기는 kjun 컴포넌트 안에서만 적용됩니다. Provider에 기대어 앱 본문의 글꼴·색을 정하던 앱은 앱 CSS에서 직접 지정하세요.
- **Vue 내부 유틸리티 클래스가 `kj-` 접두사를 씁니다.** 앱의 Tailwind 클래스(`hidden md:flex` 등)와 이름이 겹치지 않습니다. 같은 `styles.css`를 쓰므로 React 앱도 해당합니다.
- **kjun 유틸리티를 직접 쓰던 코드는 `kj-` 이름으로 바꾸세요.** 앱 마크업에 쓴 `text-text-secondary`, `font-medium` 같은 kjun 전용 클래스와, 클래스를 받는 props에 넘기던 값이 대상입니다: `alignClass`, `widthClass`, `rowClass`, `cellClass`, `descClass`, `menuClass`, `flashClass`, `activeColorClass`, `inactiveColorClass`, `titleClass`, `subtitleClass`. 예: `activeColorClass="text-favorite"` → `"kj-text-favorite"`.
- **Vue `DsIconToggle`의 `activeColorClass`·`inactiveColorClass` 기본값**이 `kj-text-brand`·`kj-text-text-tertiary`로 바뀌었습니다.
- **kjun 컴포넌트 안에 넣은 슬롯 콘텐츠**는 kjun 기본 스타일을 따릅니다. 요소 선택자 대신 클래스로 꾸미세요.
- **`kjun-`로 시작하는 클래스 이름은 kjun 전용입니다.** 앱 요소나 Provider의 `className`에 `kjun-`로 시작하는 클래스를 붙이면 그 영역이 kjun 마크업으로 처리됩니다.
- 앱 아이콘 주변 글자의 색·크기는 kjun 아이콘에 그대로 이어집니다(`currentColor`, `1em`).

## 0.3.2 — 2026-10-11

- GitHub Actions 릴리스로 배포합니다. npm 패키지에 빌드 출처(provenance)가 표시됩니다. 패키지 코드는 0.3.1과 같습니다.
- 문서 사이트의 컴포넌트 카탈로그에서 이관 전 내부 경로 기록을 지웠습니다.

## 0.3.1 — 2026-10-09

- `@kjun-ui/vue2`가 React 없이 동작합니다. Alert 액션 크기 정의가 React 모듈을 불러오던 문제를 고쳤습니다.
- Vue 2 Breadcrumb·BottomNavigation·ListRow 링크는 `javascript:`·`data:` 같은 주소를 렌더링하지 않습니다. 상대 경로와 http·https·mailto·tel 주소는 그대로 사용합니다.
- `@kjun-ui/native`의 `react-native` peer 범위를 `>=0.86.3`으로 넓혔습니다.
- 패키지 README에 npm 설치 명령을 넣고 필수 색상 역할 수를 27개로 바로잡았습니다.

## 0.3.0 — 2026-10-09

- npm 첫 공개 배포입니다. 문서: https://ui.kjun.dev
