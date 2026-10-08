import { detail, slot } from "./helpers.mjs";
const common = {
  label: detail("입력의 목적을 설명하는 라벨입니다.", {
    연결: "FormGroup 안의 KJUN 입력은 필드 맥락을 받아 라벨과 도움말·오류를 연결합니다. 임의의 사용자 입력 요소에는 같은 연결을 직접 구현해야 합니다.",
    "복합 입력": "QuantityStepper는 숫자 입력에 라벨·ID·오류·도움말·필수 정보를 연결합니다. TimePicker는 각 부분에 고유한 ID와 시·분·초 이름을 부여하고 도움말·오류를 공유합니다. 웹에서 연결된 라벨은 첫 번째 시 선택 컨트롤을 가리킵니다. Native DatePicker도 필드의 라벨·오류·도움말을 사용하며, Select 팝업의 검색창은 바깥 필드 맥락을 상속하지 않습니다.",
  }),
  required: detail("필수 표시와 자식 필드 맥락을 제공합니다.", {
    "입력 연결": "Input·Textarea는 이 상태를 상속합니다. React·Vue 2는 기본 required, Native Web은 aria-required로 필수 입력 의미를 전달합니다. React·Vue 2 입력에 명시한 required 값은 FormGroup보다 우선합니다.",
    "상태 책임":
      "FormGroup은 값이나 검증 결과를 계산하지 않습니다. 값·검증 규칙은 소비자가 관리하고 결과 메시지를 error에 전달합니다. required만으로 모든 플랫폼의 제출 검증을 보장하지 않습니다.",
  }),
  error: detail("오류 메시지입니다. hint보다 우선 표시합니다.", {
    "적용 조건":
      "비어 있지 않은 문자열이면 오류 설명을 표시합니다. boolean 오류 여부가 아닌 메시지를 전달하세요.",
    "상태 책임":
      "오류를 표시해도 입력값·disabled를 바꾸지 않습니다. 검증 후 소비자가 error를 갱신합니다.",
  }),
  hint: detail("입력 도움말입니다.", {
    "표시 조건": "error가 비어 있을 때 표시하며, 오류가 있으면 접근성 설명도 오류를 우선합니다.",
  }),
};
const ownership = [
  "입력값·검증·요청·비활성 상태: 소비자가 자식 입력과 업무 코드에서 관리합니다. FormGroup에는 value prop이나 값 변경 이벤트가 없습니다.",
  "라벨·도움말·오류 연결: FormGroup이 필드 맥락과 설명 요소를 제공하고 KJUN 입력이 이를 소비합니다.",
];
export default {
  vue2: {
    ownership,
    props: {
      ...common,
      id: detail("라벨의 for와 자식 입력에 사용할 명시적 필드 ID입니다.", {
        연결: "id를 제공하면 label의 for를 연결하고 오류·도움말 ID에도 사용합니다. 생략 시 라벨·설명 ID를 내부 UID로 만들지만 label의 for는 비어 있으므로 명시적 클릭 연결이 필요하면 id를 지정하세요.",
      }),
    },
    slots: {
      default: slot(
        "라벨과 설명을 공유할 입력을 배치합니다.",
        "제공 데이터 없음",
        "DsInput·DsSelect·DsTextarea 등은 inject로 필드 맥락을 받습니다. 입력의 value와 변경 이벤트는 자식에 연결합니다.",
      ),
    },
  },
  react: {
    ownership,
    props: {
      ...common,
      id: {
        default: "자동 생성",
        ...detail("자식 필드와 라벨을 연결할 ID입니다.", {
          "기본 동작":
            "생략하면 useId 기반 필드 ID를 생성합니다. KJUN 입력은 Context의 id·labelId·describedBy를 사용합니다.",
        }),
      },
      children: slot(
        "필드 맥락을 사용할 입력을 배치합니다.",
        "ReactNode",
        "값과 onValueChange 등 변경 콜백은 자식 입력에 연결하세요. 자식 disabled는 FormGroup의 error와 별개입니다.",
      ),
    },
  },
  native: {
    ownership,
    props: {
      ...common,
      id: {
        default: "자동 생성",
        ...detail("입력과 설명에 사용할 nativeID 기준입니다.", {
          연결: "생략하면 useId 기반 ID를 생성합니다. 자식 입력은 Context의 label·error·hint를 접근성 속성에 사용합니다. 웹 label의 for와 동일한 클릭 동작을 보장하지 않습니다.",
        }),
      },
      children: slot(
        "필드 맥락을 사용할 Native 입력을 배치합니다.",
        "ReactNode",
        "입력값과 onChangeText는 자식에 연결합니다. 여러 그룹의 간격은 DsFormLayout으로 구성할 수 있습니다.",
      ),
    },
  },
};
