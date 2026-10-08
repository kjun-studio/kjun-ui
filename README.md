# KJUN UI

여러 제품에서 함께 사용하는 Vue 2·React·React Native 컴포넌트와 한국어 사용 가이드입니다. KJUN은 컴포넌트의 구조·크기·간격·상태·동작을 정의하고, 적용 프로젝트는 색상·서체·모드 전환과 데이터를 연결합니다.

## 시작하기

로컬 문서는 `./scripts/dev.sh`로 실행합니다. [시작하기](http://127.0.0.1:4173/getting-started)에서 플랫폼을 선택하고 패키지 파일과 설치 명령을 확인하세요. 현재 패키지는 로컬 파일로 설치합니다.

| 플랫폼 | 패키지 |
| --- | --- |
| 공통 아이콘 데이터 | `@kjun/icons` |
| 공통 토큰과 타입 | `@kjun/tokens` |
| Vue 2 | `@kjun/vue2` |
| React | `@kjun/react` |
| React Native | `@kjun/native` |

사용하는 플랫폼의 패키지와 `@kjun/tokens`·`@kjun/icons`를 함께 설치합니다.

문서 페이지도 패키징된 `@kjun/react`·`@kjun/tokens`·`@kjun/icons`를 사용합니다. 색상·서체는 문서 앱이 제공하고 컨트롤의 규격·동작은 패키지에서 가져옵니다. 패키지를 수정했다면 Docker 안에서 `build:packages` → `pack:local` → `docs:install` 순으로 갱신하세요. 전체 `build`에는 이 과정이 포함됩니다.

## 컴포넌트와 사용 가이드

[전체 컴포넌트](http://127.0.0.1:4173/components)에서 77개 컴포넌트를 이름·용도·API로 탐색할 수 있습니다. 각 문서에는 조작 가능한 예제, 현재 입력값을 반영하는 사용 코드, 구조·상태·크기 비교와 API가 있습니다. 문서 검색은 Cmd/Ctrl+K로 열 수 있습니다.

- [전체 지원 현황](http://127.0.0.1:4173/catalog): 컴포넌트·서비스의 플랫폼별 사용 범위
- [검증 근거](http://127.0.0.1:4173/verification): 접근성 항목별 실행 결과·환경·원본 기록
- [사용 가이드](http://127.0.0.1:4173/usage-guide): 컴포넌트 선택, 버튼 배치, 오류·빈 상태, 문구의 전후 비교
- [화면 배치](http://127.0.0.1:4173/layout): 최대 폭, 열 전환, 스크롤과 하단 CTA
- [레이어·Elevation](http://127.0.0.1:4173/elevation): 그림자와 Modal·Toast·하단 CTA의 겹침
- [피드백 서비스](http://127.0.0.1:4173/feedback): Toast·Confirm·Prompt

KjunProvider로 스타일 적용 영역을 만들고 KjunFeedbackProvider로 영역별 피드백을 제공합니다. Native의 DsFormLayout은 여러 FormGroup의 간격을 연결합니다. `@kjun/icons`는 Tabler 3.48.0 선형 5,166개와 채움형 1,054개를 제공합니다. 기본 제공 범위는 선형 153개와 heart·star 채움형 2개이며, 추가 아이콘은 개별 import 후 KjunProvider의 icons에 등록합니다.

## 프로젝트에 연결하기

웹은 프로젝트 CSS에서 `--kjun-*` 색상 역할을 연결합니다. Native는 `KjunColors<ColorValue>`를 `colors`로 전달합니다. 금융 컴포넌트를 사용할 때는 `KjunDomainColors<ColorValue>`도 연결합니다. 필수 색상 역할은 27개이며 선택 역할은 `colorRoleFallbacks`에 정의되며, 생략하면 연결된 프로젝트 값을 사용합니다. 기존 전체 매핑도 사용할 수 있습니다. 실제 색상과 라이트·다크 전환은 프로젝트가 관리합니다.

본문 서체는 웹의 `--kjun-font`와 Native의 `fontFamily`, 숫자 서체는 `--kjun-font-numeric`와 `numericFontFamily`로 연결합니다. 패키지는 서체를 선택하거나 로드하지 않습니다. 자세한 연결 방법은 [색상·서체 가이드](http://127.0.0.1:4173/styling)를 참고하세요.

데이터 요청·저장·이동은 프로젝트의 코드로 처리합니다. 컴포넌트별 입력값과 콜백·이벤트·슬롯은 각 API 문서에서 확인하세요.

## React Native 사용 범위

React Native 예제는 Native Web을 이용한 브라우저 미리보기입니다. iOS·Android 실제 기기·시뮬레이터 검증은 수행하지 않았습니다. 기기의 입력·접근성·안전 영역과 플랫폼별 지원 옵션은 적용 전에 확인해야 합니다.

## 개발과 유지보수

실행 환경, 빌드·검사 명령, 패키지 생성과 참조 이력은 [유지보수 안내](docs/maintenance.md)에 정리했습니다.
