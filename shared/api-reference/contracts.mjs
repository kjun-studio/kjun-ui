import { extensionContracts } from "./extensions.mjs";
import formGroup from "./form-group.mjs";
import select from "./select.mjs";
import searchInput from "./search-input.mjs";
import table from "./table.mjs";
import dataState, { queryProps } from "./data-state.mjs";
import feedback from "./feedback.mjs";
import { detail } from "./helpers.mjs";
for (const contract of [select, searchInput, table, dataState])
  contract.native = structuredClone(contract.react);
select.vue2.events["update:open"].details.find((d) => d.label === "상태 책임").text =
  "open.sync 또는 update:open으로 동기화합니다. 단일 선택은 input → change → update:open(false) 순서로 요청합니다. 부모가 거절하면 팝업과 검색어를 유지합니다.";
select.vue2.slots.selected.details[0].text =
  "{ option: 선택된 옵션 | null, label: 기본 표시 문자열 }";
select.vue2.slots.selected.details.push({
  label: "복수 선택",
  text: "Vue의 option은 value 전체와 일치하는 단일 옵션을 찾으므로 배열 선택에서는 null입니다. label은 한 항목의 라벨 또는 N개 선택됨을 제공합니다. React·Native renderSelected는 첫 번째 일치 옵션을 받을 수 있습니다.",
});
select.vue2.props.searchable = detail("옵션 목록의 검색 입력을 제공합니다.", {
  "검색 대상": "Vue는 labelKey 외에 옵션의 base·symbol·name·displayName도 검색합니다. 정확한 일치·라벨 구분자 접두어·접두어·포함 순으로 정렬하고 동순위는 원래 옵션 순서를 유지합니다. React·Native는 라벨 포함 검색만 수행합니다.",
  "기본값": "패키지 기본값은 false입니다. 내부 옵션 검색이며 서버 요청은 소비자가 별도로 처리합니다.",
  "조합 입력": "composition 이벤트·isComposing·keyCode 229를 판별합니다. 조합 중 방향키·Enter·Escape의 입력기 기본 동작과 검색 포커스를 보존하고 상위 레이어로 전파하지 않습니다.",
});
table.native.props.rowClass = {
  summary:
    "공개 타입에 남아 있는 웹 행 클래스 설정입니다. 현재 Native 구현은 이 prop을 읽지 않습니다.",
};
table.native.props.hoverable = {
  summary: "행을 누르는 동안 강조 배경을 표시합니다. 웹 hover와 같은 입력 방식은 아닙니다.",
};
select.native.ownership.push(
  "Native 팝업은 Modal 기반입니다. Native Web은 브라우저 검증이며 실제 기기 검증과 별개입니다.",
);
searchInput.native.ownership.push(
  "Native 자동 완성은 팝업 안의 입력에서 검색을 이어갑니다. 닫힘·뒤로 가기는 내부 열림 상태와 요청 정리를 수행합니다.",
);
searchInput.native.props.onEnter = {
  ...searchInput.native.props.onEnter,
  details: searchInput.native.props.onEnter.details.map((d) =>
    d.label === "발생 시점"
      ? {
          ...d,
          text: "Native 입력의 onSubmitEditing 경로에서 호출합니다. 결과 행 선택은 별도 onSelect 경로입니다.",
        }
      : d.label === "상태 책임"
        ? { ...d, text: "입력 제출은 onEnter로, 결과 행 선택은 onSelect로 처리합니다. 결과 행 선택은 onEnter를 호출하지 않습니다." }
        : d,
  ),
};
for (const platform of ["vue2", "react", "native"]) {
  const ownQuery = platform === "vue2" ? dataState.vue2.props : queryProps;
  for (const key of ["queryKey", "resultKey", "hasLoadedOnce"])
    table[platform].props[key] = ownQuery[key];
}
export const coreContracts = {
  ...extensionContracts,
  DsFormGroup: formGroup,
  DsSelect: select,
  DsSearchInput: searchInput,
  DsTable: table,
  DsDataState: dataState,
};
export const feedbackContracts = feedback;
