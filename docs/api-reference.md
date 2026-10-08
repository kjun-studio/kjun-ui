# API 설명과 사용 계약

공개 컴포넌트 80개, Vue 2·React·Native Web의 문서용 API는 `apps/docs/lib/generated/api-reference.json`에 생성한다. FormGroup·Select·SearchInput·Table·DataState·피드백 서비스는 상태 소유권과 콜백·이벤트·슬롯의 상세 계약을 포함한다. API 화면은 공통 문서 플랫폼 선택을 구독하며 기존 `#api`와 `#preview` 주소를 사용한다.

## 데이터와 생성

- `scripts/api.mjs`의 기존 `api.json`은 공개 prop 타입·필수 여부의 기반이다. 이 기존 단계는 Vue 선언 생성도 담당한다.
- `scripts/api-reference-source.mjs`는 현재 패키지 소스에서 React·Native의 확인 가능한 리터럴 기본값과 Vue 이벤트·슬롯을 읽는다. props를 받는 내부 모델 함수의 기본값, Vue mixin·조건부 이벤트명·동적/전달 슬롯도 포함한다.
- `shared/api-reference/`의 분류별 JSON에는 검토한 컴포넌트·플랫폼·prop 이름을 명시한다. `terms.json`은 같은 목적의 항목에 재사용할 짧은 설명이며, 같은 이름이라도 의미가 다른 것은 `overrides.mjs`에서 구분한다.
- 핵심 문서의 `.mjs` 메타데이터는 적용 조건·발생 시점·인자·반환값·상태 책임·중첩 데이터를 관리한다. `contracts.mjs`의 명시적 재사용과 플랫폼별 차이를 함께 검토한다.
- `scripts/api-reference.mjs`는 위 데이터를 결합한다. 이 단계는 **패키지 선언·구현을 쓰지 않는다**. 기본 예제의 props를 패키지 기본값으로 읽지 않는다. 훅·조건에 의존하는 기본값은 검토한 문구를 사용하고, 확인되지 않은 기본값은 `—`로 둔다.
- `scripts/discovery.mjs`는 설명과 계약 키워드를 검색 색인에 추가한다. API 이름 검색의 우선순위와 `#api` 목적지는 유지한다.

`shared/component-guides.json`은 68개 역할·상태·플랫폼 안내의 원본이다. Button·Input·Modal도 전용 사용 안내에 이 가이드를 함께 표시한다. 상세 콜백·슬롯 설명이 없는 다른 문서는 실제 추출한 이름과 짧은 설명까지만 표시한다.

## 변경 절차

모든 Node/npm 명령은 Docker 안에서 실행한다.

```sh
docker exec -w /workspace kjun_ui_dev npm run api:generate
docker exec -w /workspace kjun_ui_dev npm run docs:generate
docker exec -w /workspace kjun_ui_dev npm run docs:check
docker exec -w /workspace kjun_ui_dev npm run typecheck
docker exec -w /workspace kjun_ui_dev npm test
docker exec -w /workspace kjun_ui_dev npm run test:browser
docker exec -w /workspace kjun_ui_dev npm run build
```

공개 prop이 바뀌면 분류별 바인딩과 설명을 구현과 대조한 뒤 함께 수정한다. 생성 검사는 설명 누락, 잘못된 prop·이벤트·슬롯·서비스 API 참조, 중복, 존재하지 않는 예제, 내부 절대경로와 오래된 생성 결과를 차단한다. 타입·기본값·행동의 의미는 소스 대조와 packed 소비 테스트로 확인한다.

현재 빌드 절차는 [유지보수 안내](maintenance.md)를 따른다.

## 확인한 계약 차이

- Select는 세 플랫폼 모두 boolean `open`을 제어형으로 사용하고, 생략·`undefined`는 내부 상태를 사용한다. 부모가 닫힘 요청을 거절하면 검색어와 팝업을 유지하며 실제 닫힘에서 검색어·더 보기 제한을 초기화한다. Vue에서 `open`을 초기값처럼 쓰던 경우 prop을 생략하거나 `:open.sync`로 연결한다. 지우기는 단일 `null`, 복수 `[]`를 전달한다. `searchable`·`clearable` 기본값은 false다.
- Select 옵션은 필터링 전에 값과 타입으로 식별한다. 숫자 `0`과 문자열 `"0"`을 구분하며 키가 없으면 원본 인덱스를 사용한다. 옵션 내부 상태를 안정적으로 유지하려면 고유한 `valueKey`가 필요하다. React·Vue 검색창은 조합 중 방향키·Enter·Escape의 기본 동작과 포커스를 보존한다.
- Tabs의 빈 값은 동적으로 도착하거나 활성화된 첫 후보의 선택을 요청한다. 같은 빈 값 기간의 같은 후보는 한 번만 요청한다. 초기 선택도 Vue `input → change`, React·Native `onValueChange → onChange` 순서를 따른다.
- Accordion을 단일 모드로 바꾸면 마지막으로 연 항목만 유지한다. 복수 모드로 돌아가도 닫힌 항목은 복원하지 않으며 제거된 자식은 열린 목록에서 정리한다. 단일 모드의 여러 `defaultOpen`은 첫 등록 항목만 연다.
- React Dropdown은 `항목 action → onClose 1회` 순서로 통지하며 중복 닫힘 요청과 퇴장 애니메이션 완료는 추가 통지를 만들지 않는다.
- SearchInput의 자동 완성 요청은 고정 300ms이며 `debounce`는 일반 입력 통지에만 적용한다. 세 플랫폼 모두 외부 값·비활성화·지연 시간·입력 모드 변경과 해제 시 예약된 입력 통지를 취소한다. Vue의 키보드 선택은 IME 조합이 끝난 뒤 처리한다. `itemKey`는 세 플랫폼 모두 결과의 안정된 식별자로 읽으며 숫자 0과 문자열 키를 구분한다. 지우기는 대기 중인 통지·요청을 취소하고 빈 값 변경 한 번 → clear 한 번 순서로 즉시 알린다. 소비자가 AbortSignal을 요청에 연결하고 결과 배열로 변환한다.
- Table 선택은 행 객체 배열, 확장은 키 배열이다. 정렬 해제는 `{ key: '', order: 'asc' }`이며 검색은 data를 필터링하지 않는다. 세 플랫폼 모두 `expandedRows=[]`는 제어형 전체 닫힘이고, prop을 생략하면 내부 상태를 사용한다. 기존 Vue 코드에서 빈 배열을 전달한 채 내부 토글에 의존했다면 prop을 생략하거나 변경 이벤트의 배열을 반영해야 한다. `cell-*`와 전달 슬롯을 `default`로 오인하지 않는다.
- React Modal은 명시적 ariaLabel, 표시 제목, 기본 이름 순서로 접근성 이름을 정한다. React Dropdown은 실제 트리거 버튼에 메뉴·펼침 상태를 연결하며, 사용자 정의 버튼은 받은 id·aria 속성과 disabled를 DOM 버튼에 전달해야 한다.
- 세 플랫폼 DataState는 생략한 resultKey와 null을 구분한다. 현재 조건과 다른 결과 키는 해당 조건의 성공 결과가 아니다. 요청 취소·응답 커밋은 소비자 책임이다. Vue 오류 슬롯의 `{ error, retry }`와 React·Native의 ReactNode인 errorContent를 구분한다.
- FormGroup은 값·비활성 상태를 소유하지 않는다. 필수 표시가 제출 검증을 대신하지 않으며 error가 hint보다 우선한다. Native 접근성 연결을 HTML label 클릭과 동일하게 설명하지 않는다.
- 피드백은 공개 Provider 서비스와 tokens의 대기열 계약을 기준으로 한다. 내부 원본 모달의 API로 설명하지 않는다. Confirm 실패는 reject, 취소·해제는 false, Prompt 취소·해제는 null이다.
- 가이드의 무조건적인 loading·disabled·value 연결 문구를 제거했다. Vue RadioGroup만 그룹 disabled를 제공하며 Vue ButtonGroup은 옵션별 disabled를 읽지 않는다. Progress에 무한 진행 모드, Checkbox에 중간 선택 prop, ProgressCell에 formatter를 안내하지 않는다.

브라우저 테스트의 `api-contracts-*` fixture는 `artifacts/consumer.json`의 독립 소비 환경에 설치된 `.tgz` 패키지를 사용한다. 문서 UI 테스트는 설명 펼침·키보드·플랫폼 전환·320px 스크롤을 확인한다. 기존 예제 상태 복사·갤러리·검색·전체 카탈로그 검증을 함께 유지한다. Native 검증은 Web에 한정하며 실제 기기 검증으로 표시하지 않는다.

## 로컬 검증 결과 · 2026-09-12

- API 설명 2,114개 / 공개 컴포넌트 68개 / 세 플랫폼: 생성·누락·참조 검사 통과.
- 타입 검사, 단위 테스트 28개, 전체 브라우저 테스트 114개 통과.
- 문서 프로덕션 빌드 통과. 기존 예제·복사·플랫폼 복원·검색·갤러리 회귀 포함.
- 독립 소비 환경의 packed React로 썸네일 68개 재생성 및 검사 통과. 모달·표·DropdownItem 대표 이미지 검토.

현재 범위와 검증 결과는 [신규 계약](extensions.md)과 [v0.3.0 검증 기록](verification-v0.3.0.md)을 따릅니다. 문서에 남은 날짜별 수치는 당시 이력입니다.
