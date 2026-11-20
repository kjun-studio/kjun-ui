import { detail, slot } from "./helpers.mjs";
const common = {
  label: detail("입력의 목적을 설명하는 라벨입니다.", {
    연결: "FormGroup 안의 KJUN 입력은 필드 맥락을 받아 라벨과 도움말·오류를 연결합니다. 임의의 사용자 입력 요소에는 같은 연결을 직접 구현해야 합니다.",
    "복합 입력": "QuantityStepper와 NumberInput은 숫자 입력에 라벨·ID·오류·도움말·필수 정보를 연결합니다. TimePicker는 각 부분에 고유한 ID와 시·분·초 이름을 부여하고 도움말·오류를 공유합니다. 웹에서 연결된 라벨은 첫 번째 시 선택 컨트롤을 가리킵니다. Native DatePicker도 필드의 라벨·오류·도움말을 사용하며, Select 팝업의 검색창은 바깥 필드 맥락을 상속하지 않습니다.",
  }),
  required: detail("필수 표시와 자식 필드 맥락을 제공합니다.", {
    "필수 표시": "라벨 뒤의 *는 그림으로만 그리고 화면 낭독기에서는 숨깁니다. 필수 여부는 입력의 required 상태로 전달됩니다.",
    "입력 연결": "Input·Textarea는 이 상태를 상속합니다. React·Vue 3는 기본 required, Native Web은 aria-required로 필수 입력 의미를 전달합니다. React·Vue 2 입력에 명시한 required 값은 FormGroup보다 우선합니다.",
    "상태 책임":
      "FormGroup은 값이나 검증 결과를 계산하지 않습니다. 값·검증 규칙은 소비자가 관리하고 결과 메시지를 error에 전달합니다. required만으로 모든 플랫폼의 제출 검증을 보장하지 않습니다.",
  }),
  error: detail("오류 메시지입니다. 표시하는 동안 hint 자리를 대신합니다.", {
    "입력 자체 오류": "NumberInput의 범위 오류처럼 입력이 스스로 만드는 메시지도 이 자리에 표시합니다. error를 주면 error가 우선합니다.",
    "적용 조건":
      "비어 있지 않은 문자열이면 오류 설명을 표시합니다. boolean 오류 여부가 아닌 메시지를 전달하세요.",
    "상태 책임":
      "오류를 표시해도 입력값·disabled를 바꾸지 않습니다. 검증 후 소비자가 error를 갱신합니다.",
  }),
  hint: detail("입력 도움말입니다.", {
    "표시 조건": "error가 있으면 숨기고 그 자리에 오류를 표시해 필드 높이를 유지합니다. 입력의 접근성 설명도 그동안 error만 가리킵니다.",
  }),
  as: { default: '"div"', ...detail("\"fieldset\"이면 여러 선택지(체크박스 여러 개, 라디오, FilterGroup, ButtonGroup)를 한 이름으로 묶습니다.", {
    "웹 구조": "React·Vue 3에서 바깥 요소가 fieldset이 되고 label이 legend로 그려집니다. 모양과 legend 아래 간격은 일반 라벨과 같고 브라우저 기본 테두리·여백은 지웁니다. hint·error는 fieldset의 aria-describedby로 연결되며, 안의 체크박스·라디오·스위치는 지금처럼 오류일 때 aria-invalid를 받습니다. labelEnd가 있으면 legend는 낭독용으로 숨기고 같은 줄에 보이는 라벨을 따로 그립니다.",
    "id와 포커스": "id는 묶음 안에서 처음 등록된 활성 선택지가 받습니다. 체크박스·라디오·스위치는 그 입력에, FilterGroup·ButtonGroup은 첫 활성 항목 버튼에 붙습니다. 그래서 저장 오류 뒤 document.getElementById(id)?.focus()로 첫 선택지에 포커스를 옮길 수 있습니다. 자기 id를 준 선택지는 받지 않습니다. 묶음 안의 텍스트 입력은 지금처럼 id를 그대로 쓰므로 묶음에는 선택지만 두세요.",
    "Native": "fieldset이 없으므로 그룹 역할(role=\"group\")과 label 이름을 가진 View로 묶습니다. Native Web은 hint·error도 연결합니다. Native 컨트롤에는 요소 id가 없어 id를 선택지에 넘기지 않습니다.",
    "기본값": "\"div\"는 지금처럼 컨트롤 하나에 label을 연결합니다.",
  }) },
};
const labelEnd = (type) => ({ type, ...detail("라벨 줄 끝에 둘 보조 내용입니다. 글자 수나 \"전액\" 같은 작은 동작에 씁니다.", {
  배치: "라벨과 같은 줄 오른쪽 끝에 caption 크기로 둡니다. 오류가 생겨도 자리가 바뀌지 않고 라벨과 입력 사이 간격도 그대로입니다.",
  "책임": "글자 수 계산이나 동작은 앱이 정합니다. 버튼을 넣으면 그 버튼에 이름을 주세요.",
}) });
const ownership = [
  "입력값·검증·요청·비활성 상태: 소비자가 자식 입력과 업무 코드에서 관리합니다. FormGroup에는 value prop이나 값 변경 이벤트가 없습니다.",
  "라벨·도움말·오류 연결: FormGroup이 필드 맥락과 설명 요소를 제공하고 KJUN 입력이 이를 소비합니다.",
];
const webOwnership = [
  ...ownership,
  "아래 간격: 일반 문서 흐름에서는 마지막 그룹이 아니면 아래에 form itemGap(20px)을 둡니다. KjunStack·KjunInline 바로 안에서는 이 간격 없이 gap만 따릅니다. 앱 CSS의 flex·grid로 나란히 둘 때는 부모 요소에 data-kjun-layout=\"form\"을 붙이면 바로 아래 그룹의 아래 간격이 사라지고 부모 gap만 남습니다.",
];
export default {
  vue3: {
    ownership: webOwnership,
    props: {
      ...common,
      id: detail("라벨의 for와 자식 입력에 사용할 명시적 필드 ID입니다.", {
        연결: "id를 제공하면 label의 for와 자식 입력의 id에 사용하고 오류·도움말 ID의 기준으로 삼습니다. 생략하면 고유 ID를 생성해 같은 방식으로 연결합니다.",
      }),
    },
    slots: {
      default: slot(
        "라벨과 설명을 공유할 입력을 배치합니다.",
        "제공 데이터 없음",
        "KjunInput·KjunSelect·KjunTextarea 등은 provide/inject로 필드 맥락을 받습니다. 입력의 v-model은 자식에 연결합니다.",
      ),
      labelEnd: slot(
        "라벨 줄 끝에 둘 보조 내용입니다. 글자 수나 \"전액\" 같은 작은 동작에 씁니다.",
        "제공 데이터 없음",
        "라벨과 같은 줄 오른쪽 끝에 caption 크기로 둡니다. 오류가 생겨도 자리가 바뀌지 않습니다. 버튼을 넣으면 그 버튼에 이름을 주세요.",
      ),
    },
  },
  react: {
    ownership: webOwnership,
    props: {
      ...common,
      id: {
        default: "자동 생성",
        ...detail("자식 필드와 라벨을 연결할 ID입니다.", {
          "기본 동작":
            "생략하면 useId 기반 필드 ID를 생성합니다. KJUN 입력은 Context의 id·labelId·describedBy를 사용합니다.",
        }),
      },
      labelEnd: labelEnd("ReactNode"),
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
      labelEnd: labelEnd("ReactNode"),
      style: detail("그룹 바깥 View의 스타일입니다.", {
        "아래 간격": "그룹은 마지막 자식이어도 아래에 form itemGap 간격을 둡니다(Native는 마지막 자식을 알 수 없습니다). KjunStack·KjunInline·KjunFormLayout 안에서는 이 간격을 지우고, 그 밖에서 마지막 그룹이면 { marginBottom: 0 }을 주세요.",
      }),
      children: slot(
        "필드 맥락을 사용할 Native 입력을 배치합니다.",
        "ReactNode",
        "입력값과 onChangeText는 자식에 연결합니다. 여러 그룹의 간격은 KjunFormLayout으로 구성할 수 있습니다.",
      ),
    },
  },
};
