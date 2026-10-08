import { detail, event, slot } from "./helpers.mjs";
const ownership = [
  "조회 조건·결과·loading·error: 소비자가 요청 코드에서 관리합니다. DataState는 요청을 실행하지 않습니다.",
  "조회 표시 이력: 컴포넌트가 성공한 조건과 요청 중 조건을 추적합니다. resultKey를 제공하면 외부 결과의 소속 조건을 우선 사용합니다.",
  "본문 인스턴스: preserveContent가 켜져도 이전 조회 결과가 있어야 가려진 본문을 유지합니다. 유지와 사용자에게 보이는 상태는 다릅니다.",
];
export const queryProps = {
  queryKey: detail("현재 요청 조건을 식별합니다.", {
    "상태 전이":
      "null이면 기존 hasLoadedOnce 방식입니다. 키가 있으면 현재 조건의 결과 존재 여부로 최초 로딩과 동일 조건 갱신을 구분합니다.",
    "조건 변경":
      "queryKey를 B로 바꾸고 loading=true로 요청합니다. 이전 데이터의 resultKey가 A이면 B의 성공 결과로 취급하지 않습니다.",
  }),
  resultKey: {
    type: "string | number | null | undefined",
    ...detail("현재 전달한 데이터가 속한 조건 키입니다.", {
      "결과 연결":
        "요청 성공 시 data와 resultKey를 함께 갱신합니다. resultKey가 queryKey와 같을 때 현재 조건의 결과로 봅니다.",
      "생략과 null":
        "세 플랫폼 모두 undefined 생략 여부를 구분합니다. 명시적 null은 현재 결과가 없음을 나타낼 수 있으므로 생략과 같은 값으로 가정하지 마세요.",
      책임: "늦은 A 응답의 실제 데이터 덮어쓰기는 소비자 요청 코드에서 막아야 합니다. DataState는 데이터 요청을 취소하거나 응답을 필터링하지 않습니다.",
    }),
  },
  hasLoadedOnce: detail("성공한 결과가 이미 있음을 전달합니다.", {
    "적용 조건":
      "queryKey가 없을 때 이전 결과를 유지하는 갱신 판단에 사용합니다. 조건 키가 있을 때는 해당 조건의 완료 이력과 resultKey 계약을 함께 적용합니다.",
  }),
};
const common = {
  ...queryProps,
  size: detail("대체 상태의 위아래 여백을 지정합니다.", { 구성: "sm 24px · md 48px · lg 80px입니다. 빈 상태의 DsEmpty에는 여백을 중복 적용하지 않습니다." }),
  refreshingText: detail("본문 위 별도 줄에 갱신 상태를 표시합니다.", { 배치: "긴 문구는 영역 안에서 줄바꿈하며 제목이나 행동 버튼을 덮지 않습니다." }),
  retryText: detail("오류와 갱신 경고의 재시도 버튼 문구입니다.", { 배치: "긴 문구는 버튼 안에서 줄바꿈하고 버튼 높이가 늘어납니다." }),
  preserveContent: detail("가려진 본문의 인스턴스를 유지합니다.", {
    "적용 조건":
      "이전에 조회 결과가 있을 때만 가려진 본문을 유지합니다. 최초 로딩에서 아직 생성되지 않은 콘텐츠를 보장하지 않습니다.",
    "표시와 구분":
      "조건 변경·오류·빈 상태에서 유지된 본문은 접근과 표시가 차단됩니다. 동일 조건 갱신에서 결과가 보이는 동작과 별개입니다.",
  }),
  loading: detail("조회가 진행 중임을 표시합니다.", {
    "상태 전이":
      "현재 조건의 결과가 없으면 최초 로딩 표시를 사용합니다. 같은 조건의 결과가 있으면 결과와 갱신 표시를 유지합니다.",
    실패: "같은 조건의 결과가 있는 갱신 실패는 이전 결과와 경고를 표시합니다. 현재 조건의 결과가 없는 실패는 본문 대신 오류를 표시합니다.",
  }),
  empty: detail("성공 결과가 비어 있음을 전달합니다.", {
    우선순위:
      "최초 로딩 → 차단 오류 → 빈 상태 순으로 대체 콘텐츠를 표시합니다. 빈 결과 판정은 소비자가 data를 검사해 전달합니다.",
  }),
  error: detail("요청 실패 메시지입니다.", {
    "표시 조건": "현재 조건 결과가 있으면 갱신 경고로, 결과가 없으면 차단 오류로 표시합니다.",
    "상태 책임": "재시도 시 소비자가 오류를 정리하고 loading을 갱신합니다.",
  }),
};
const retry = event(
  "재시도 행동을 요청합니다.",
  "차단 오류 또는 갱신 경고의 재시도 버튼 실행 시",
  "없음",
  "반환값은 사용하지 않습니다.",
  "소비자가 실제 요청과 loading·error·data·resultKey를 갱신합니다. 콜백·리스너가 없으면 기본 재시도 버튼을 표시하지 않습니다.",
);
const empty = event(
  "빈 상태의 행동을 요청합니다.",
  "emptyActionText로 표시된 버튼 실행 시",
  "없음",
  "반환값은 사용하지 않습니다.",
  "생성·조건 변경 등 실제 행동은 소비자가 구현합니다.",
);
export default {
  vue2: {
    ownership,
    props: common,
    events: { retry, "empty-action": empty },
    slots: {
      loading: slot("기본 최초 로딩 표시를 교체합니다."),
      empty: slot("기본 빈 상태를 교체합니다.", "제공 데이터 없음", "DataState가 size에 따른 바깥 여백을 담당합니다. 슬롯의 DsEmpty에는 기본 여백을 중복 적용하지 않습니다."),
      error: slot(
        "기본 오류 표시를 교체합니다.",
        "{ error: 오류 메시지, retry: () => void }",
        "retry()는 retry 이벤트를 통지합니다. 데이터 요청은 소비자 리스너가 수행합니다.",
      ),
      default: slot(
        "성공 결과 콘텐츠를 배치합니다.",
        "제공 데이터 없음",
        "화면 상태에 따라 가려지거나 제거됩니다. preserveContent는 기존 결과 인스턴스를 유지하는 용도입니다.",
      ),
    },
  },
  react: {
    ownership,
    props: {
      ...common,
      onRetry: {
        ...retry,
        details: retry.details.map((d) =>
          d.label === "전달값"
            ? {
                ...d,
                text: "공개 타입은 인자 없음입니다. 기본 버튼 경로의 이벤트 객체에는 의존하지 마세요.",
              }
            : d,
        ),
      },
      onEmptyAction: {
        ...empty,
        details: empty.details.map((d) =>
          d.label === "전달값"
            ? {
                ...d,
                text: "공개 타입은 인자 없음입니다. 기본 버튼 경로의 이벤트 객체에는 의존하지 마세요.",
              }
            : d,
        ),
      },
      children: slot("성공 결과의 본문입니다.", "ReactNode"),
      loadingContent: slot("기본 최초 로딩 표시를 교체합니다.", "ReactNode"),
      emptyContent: slot("기본 빈 상태를 교체합니다.", "ReactNode", "DataState가 size에 따른 바깥 여백을 담당합니다. 내부 DsEmpty에는 기본 여백을 중복 적용하지 않습니다."),
      errorContent: slot(
        "기본 오류 표시를 교체합니다.",
        "ReactNode",
        "Vue error 슬롯처럼 인자를 받는 함수가 아닙니다. 소비자가 error와 재시도 함수를 사용해 요소를 구성하세요.",
      ),
    },
  },
};
