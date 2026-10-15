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
select.vue3.events["update:open"].details.find((d) => d.label === "상태 책임").text =
  "v-model:open 또는 update:open으로 동기화합니다. 단일 선택은 update:modelValue → change → update:open(false) 순서로 요청합니다. 부모가 거절하면 팝업과 검색어를 유지합니다.";
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
for (const platform of ["vue3", "react", "native"]) {
  const ownQuery = platform === "vue3" ? dataState.vue3.props : queryProps;
  for (const key of ["queryKey", "resultKey", "hasLoadedOnce"])
    table[platform].props[key] = ownQuery[key];
}
export const coreContracts = {
  ...extensionContracts,
  KjunFormGroup: formGroup,
  KjunSelect: select,
  KjunSearchInput: searchInput,
  KjunTable: table,
  KjunDataState: dataState,
};
export const feedbackContracts = feedback;
