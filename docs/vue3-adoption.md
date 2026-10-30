# Vue 적용 계약

이 문서는 `@kjun-ui/vue3`의 적용 편의 API를 설명합니다. React·Native에 같은 prop이 있다고 가정하지 않습니다. 앱의 색상·글꼴·모드·업무 상태와 카드 구성은 앱이 소유합니다.

## 빈 배지와 값

- `TabItem.badge`·`KjunTabPane.badge`·`KpiRowItem.badge`의 `null`은 배지를 숨깁니다. Tabs의 숫자 배지 `0`은 표시합니다.
- KpiRow는 전역 또는 항목의 `loading` 중에는 스켈레톤을 표시합니다. `value`를 생략하거나 `undefined`로 둘 수 있습니다.
- 로딩이 아닌 행의 `null`·`undefined`·NaN·Infinity는 `missingText`(기본 `—`)입니다. formatter·숫자 애니메이션·접두/접미 단위를 적용하지 않습니다. 실제 `0`은 정상 숫자입니다. `value` 슬롯과 `valueSegments`는 앱이 제공한 표시를 사용합니다.
- Progress `value=null`과 유효하지 않은 숫자/max는 데이터 없음입니다. 진행 막대의 `aria-valuenow`를 제공하지 않고 데이터 없음으로 이름 붙입니다. `indeterminate=true`는 실행 중이지만 진행률을 모르는 상태이며 `role=progressbar`와 진행 중 설명을 제공합니다. 이 경우 `null`보다 우선합니다.
- Progress의 값 생략 또는 `undefined`는 기존 기본값 `0`입니다. 조회 실패/미수신은 앱이 명시적으로 `null`을 전달하세요. 패키지는 실패 원인이나 데이터 최신성을 추측하지 않습니다.

## 메뉴 상태와 이벤트

```vue
<KjunMenuButton v-model:open="menuOpen" label="작업">
  <KjunDropdownItem @click.stop="save">저장</KjunDropdownItem>
</KjunMenuButton>
```

`open`을 생략하면 기존 비제어 방식입니다. 전달하면 부모 값이 표시 상태를 결정합니다. `update:open`은 변경 요청이고 `open`·`close`는 실제 표시 전환을 알립니다. 부모가 요청을 반영하지 않으면 메뉴와 초점은 기존 상태를 유지합니다. 비활성/로딩 중인 트리거는 열리지 않으며, 열린 상태에서 비활성화되면 닫힘을 요청하고 팝업을 숨깁니다. 열 때 첫 활성 항목에 초점을 주고 닫을 때 기존 `returnFocus` 계약을 따릅니다.

DropdownItem `click`의 인자는 실제 `MouseEvent | KeyboardEvent`입니다. 마우스 클릭은 MouseEvent, Enter/Space는 KeyboardEvent이며 `.stop`을 사용할 수 있습니다. 비활성 항목은 호출하지 않습니다. `.prevent`는 브라우저 기본 동작을 막지만 메뉴 선택 뒤 닫힘 요청을 취소하지 않습니다. 열린 상태를 유지할지는 부모가 `open`으로 결정합니다.

## Table 행 타입

`data: Row[]`의 행 타입은 열의 format/render, `formatValue`·`rowClass`·`onRowClick`, 셀·펼침·선택 도구 슬롯, `update:selected`까지 유지됩니다. `KjunTableProps<Row>`·`KjunTableSlots<Row>`·`TableColumn<Row>`로 명시할 수도 있습니다. 값 자체는 열마다 다르므로 `cell.value`는 `unknown`입니다.

```vue
<KjunTable :data="rows" :columns="columns" v-model:selected="selected" expandable>
  <template #expand="{ row }">{{ row.amount.toFixed(2) }}</template>
</KjunTable>
```

## Fragment 속성 대상

| 컴포넌트 | 일반 class·style | 나머지 속성/DOM 이벤트 | 팝업 스타일 |
| --- | --- | --- | --- |
| Select | `.kjun-select-shell` | 실제 선택 버튼. 설명 ID는 FormGroup과 병합 | 기존 패키지 규격 |
| Dropdown / MenuButton | 트리거 래퍼 | 트리거 래퍼. 실제 버튼 ID는 `triggerId` | Dropdown `menuClass`는 메뉴 본문 |
| Popover | 트리거 래퍼 | 트리거 래퍼 | `panelClass`·`panelStyle`은 dialog |
| Tooltip | 단일 트리거 자식 | 같은 자식. 이벤트·설명 ID·클래스를 병합 | `panelClass`·`panelStyle`은 말풍선 |
| CopyButton | 실제 복사 버튼 | 실제 복사 버튼 | 해당 없음 |

Popover가 `anchorRect`만 사용하고 트리거가 없으면 일반 속성도 dialog에 적용합니다. Tooltip은 기존처럼 단일 Element를 기준으로 합니다. 여러 루트나 텍스트 컴포넌트에서 임의의 첫 형제를 고르지 않습니다. 반응형 폭·여백은 위 대상에 주고 팝업 크기는 분리된 prop을 사용하세요.

## 고정 탭 헤더와 슬라이더 출력

Tabs `stickyHeader`의 기본값은 false입니다. 켜면 가장 가까운 스크롤 컨테이너 안에서 헤더만 고정합니다. `stickyOffset`은 숫자(px) 또는 CSS 길이이며 기본 0입니다. 조상 요소의 overflow와 탭 전체 높이가 sticky 적용 범위를 결정합니다. 패널을 바깥으로 분리할 필요가 없습니다.

Slider·RangeSlider `showValue`의 기본값은 true입니다. false면 출력만 숨기며 label은 유지합니다. 둘 다 없으면 캡션 영역을 만들지 않습니다. `formatValue(number): string`은 각 손잡이의 화면 출력과 `aria-valuetext`에 적용합니다. 숨겨진 출력에서도 접근성 값 설명은 유지하며 modelValue·update:modelValue·change는 숫자 형식을 유지합니다.
