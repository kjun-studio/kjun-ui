# 변경 내역

KJUN UI 패키지(`@kjun-ui/icons`·`tokens`·`vue2`·`react`·`native`)는 같은 버전으로 함께 배포합니다.

## 0.4.0 — 2026-10-11

- `KjunProvider`가 앱 마크업의 모양을 바꾸지 않습니다. 기본 스타일 초기화(reset)와 기본 글꼴·색·글자 크기는 kjun 컴포넌트 안에서만 적용되고, Provider는 색·서체 변수와 레이어·피드백만 제공합니다.
- Vue 패키지 내부 유틸리티 클래스가 `kj-` 접두사를 씁니다. 앱의 Tailwind 클래스(`hidden md:flex` 등)와 이름이 겹치지 않습니다.
- kjun 유틸리티를 class 속성으로 넘기던 코드는 `kj-` 이름으로 바꾸세요. 예: `activeColorClass="text-favorite"` → `activeColorClass="kj-text-favorite"`, `alignClass` 콜백의 `text-right` → `kj-text-right`.
- kjun 컴포넌트 안에 넣은 슬롯 콘텐츠는 kjun 기본 스타일을 따릅니다. 요소 선택자 대신 클래스로 꾸미세요.
- 공개 API(컴포넌트, props, 이벤트, 슬롯, `--kjun-*` 변수)는 바뀌지 않았습니다.

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
