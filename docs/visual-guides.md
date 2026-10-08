# 시각 가이드 유지보수

공개 77개와 피드백 서비스의 시각 가이드는 문서 전용 데이터입니다. 패키지 API와 컴포넌트 내부 규격은 변경하지 않습니다. `/usage-guide`의 네 주제 페이지와 각 문서의 `#anatomy`, `#states`는 상단의 문서 플랫폼 선택을 따릅니다.

사용 가이드는 `/usage-guide/forms`(폼·입력), `/usage-guide/data`(조회·목록), `/usage-guide/mobile`(모바일 배치), `/usage-guide/feedback`(피드백·문구)로 나뉩니다. 개요에는 주제와 사례 링크를 표시합니다. `shared/document-navigation.ts`가 기존 23개 섹션의 목적지를 정의하며 실행 예제의 설정·상태를 유지합니다. 코드는 `shared/implementation-examples.ts`의 15개 사례에만 별도 구현 방법으로 제공하고 단순 비교는 컴포넌트 `#usage`로 연결합니다. 예전 `/usage-guide#섹션` 링크도 해당 주제로 연결됩니다.

## 데이터와 실행

- `shared/visual-guides/`의 일곱 분류 파일에 실제 구조 부위·공개 속성 비교·관련 사용 가이드를 작성합니다. 부위는 실제 DOM 또는 정확한 텍스트를 가리켜야 합니다. 상호 배타적인 표시 요소는 별도 도해를 사용합니다.
- `index.ts`는 생성 API를 기준으로 플랫폼이 지원하는 상태와 크기를 결합합니다. 예제 설정값과 패키지 기본값은 분리합니다. `usage-content.ts`는 네 선택 비교, 세 배치와 문구 전후 예제의 공통 정의입니다.
- `previews/catalog/example-layouts.ts`의 세 소비자 배치는 기존 예제 생성기를 사용합니다. `visual` 설정은 공개 prop과 표시 문구만 바꾸며 실행·표시용 생성 결과에 동일하게 적용합니다. 문서 구현 코드는 별도 생성기의 기본 상태를 사용합니다. 계측은 실행 모듈에만 추가합니다.
- 비교 프레임은 기존 예제 프로토콜의 플랫폼·세션·설정 버전 검사와 현재 상태 동기화를 사용합니다. 화면 밖 비교는 지연 실행하며 레이어 비교는 사용자가 열었을 때 시작합니다.
- `apps/docs/components/docs/`의 `visual-guide`, `anatomy-figure`, `guide-example`, `usage-guide`가 화면을 구성합니다. Modal·버튼·표 등 문서 셸도 패키징된 KJUN React를 사용합니다.

## 생성 순서

모든 Node/npm 명령은 `kjun_ui_dev` 안에서 실행합니다. 정상 전체 빌드에는 아래 과정이 포함되어 있습니다.

```sh
docker exec -w /workspace kjun_ui_dev npm run docs:generate
docker exec -w /workspace kjun_ui_dev npm run build:previews
docker exec -w /workspace kjun_ui_dev npm run examples:verify
docker exec -w /workspace kjun_ui_dev npm run guides:verify
docker exec -w /workspace kjun_ui_dev npm run build:thumbnails
docker exec -w /workspace kjun_ui_dev npm run build:guide-figures
docker exec -w /workspace kjun_ui_dev npm --prefix apps/docs run build
```

`vinext start`는 `dist/client`에 복사된 정적 미리보기를 제공합니다. 미리보기나 이미지를 다시 생성한 뒤에는 문서 production 빌드와 서버 재시작까지 수행하고, 검증 서버의 번들이 최신 생성 파일과 일치하는지 확인하세요.

선행 패키징·독립 소비 환경 준비는 `pack:local`, `verify:consumers`를 사용합니다. 캡처는 설치된 tarball의 Vue 2·React·Native Web 번들을 임시 정적 서버에서 실행하므로 문서 개발 서버에 의존하지 않습니다. 폰트와 설정 적용 완료, 실제 레이어 열림을 기다린 후 PNG·주석 좌표를 생성합니다. 메뉴·목록·도움말·대화상자 전체가 캡처 경계 안에 있는지도 검사합니다.

`apps/docs/public/previews/guide-figures/manifest.json`은 패키지 기록, 번들·스타일·폰트·도해 정의·캡처 스크립트의 fingerprint, 개별 이미지 해시와 주석 좌표를 보관합니다. 변경 후 이미지를 재생성해야 하며 `guide-figures:check`는 누락·오래된 결과를 실패 처리합니다. 

## 검증

생성 결과는 225개 구조 이미지(68 × 3, 피드백 세 서비스 × 3, 추가 열림·오류 도해), 854개 상태·크기 비교, 51개 선택·문구 비교입니다. 기존 예제·프리셋·현재 값 검증 375개에 더해 비교 코드 905개를 독립 packed 소비 환경에서 컴파일합니다.

`tests/visual-guides.test.mjs`는 공개 커버리지, 부모 안의 하위 구성, 플랫폼별 API 차이, 잘못된 API 참조, 생성 결과와 이미지 해시·좌표, 검색 목적지를 검사합니다. `tests/browser/visual-guides.spec.ts`는 비교 코드 전체 실행, 네 선택 비교, 도해 확대·포커스 복귀, 세 배치의 입력·검증·복사 재실행·필터·재시도와 모바일을 검사합니다.

`tests/browser/visual-zoom.spec.ts`는 전체 Chromium의 페이지 확대 설정을 200%로 적용합니다. `devicePixelRatio: 2`와 1440px 창의 `innerWidth: 720`을 확인한 뒤 세 플랫폼의 긴 배치를 검사합니다. CSS 배율이나 DPR만 변경한 화면을 페이지 확대 검증으로 간주하지 않습니다. 이는 Native 기기의 시스템 글자 크기 검증이 아닙니다.

현재 빌드 절차는 [유지보수 안내](maintenance.md)를 따릅니다.

현재 범위와 검증 결과는 [신규 계약](extensions.md)과 [v0.3.0 검증 기록](verification-v0.3.0.md)을 따릅니다. 문서에 남은 날짜별 수치는 당시 이력입니다.

## 디자인 판단의 전후 비교

폼·입력의 `#action-placement`, `#long-labels`, `#field-errors`, 조회·목록의 `#row-actions`, `#refresh-context`, `#empty-vs-error`, 모바일 배치의 `#bottom-cta-layout`, `#keyboard-layout`, 피드백·문구의 `#delete-confirmation`에서 열 가지 전후 비교를 제공합니다. `components`에 등록된 상세 문서에도 디자인 그룹 아래 같은 비교를 표시하며 기존 `#design-사례ID` 앵커로 바로 이동할 수 있습니다.

- `shared/visual-guides/design-cases.ts`는 주제, 적용 대상, 전후 설명, 실행 설정, 캡처 폭과 주석의 공통 정의입니다. 선택적인 `appliesWhen`·`caution`은 적용 조건과 주의사항이며 검색에도 포함됩니다. `values`는 초기 실행·캡처·복사 코드에 공통 적용합니다. 공개 컴포넌트 목적지와 문서 전용 실행 레시피 이름은 별도로 검증합니다.
- `previews/catalog/example-design-cases.ts`의 열 레시피가 설치된 KJUN 패키지를 렌더합니다. `CaseColumns`·`CaseCell`·`CasePart`는 소비 화면의 열 배치·주석 영역·가로 스크롤을 구성하는 문서 예제 래퍼입니다. 모바일 전용 `CaseScreen`·`CaseViewport`·`CaseScroll`·`CaseFooter`·`CaseKeyboard`는 기존 래퍼와 구분합니다. 세 플랫폼 템플릿에서 실행·복사 코드에 똑같이 포함되며 패키지 내부 규격은 바꾸지 않습니다.
- 375px·640px의 실제 브라우저 폭으로 전후 120개 이미지(열 비교 × 전후 × 두 폭 × 세 플랫폼)를 생성합니다. 가용 콘텐츠 폭은 프레임 양쪽 여백 24px을 제외한 값입니다. 좁은 화면에서 긴 버튼의 넘침은 해당 예제 영역 안에서 가로로 확인합니다.
- `viewportHeight`는 삭제 확인과 두 모바일 사례에서 720px입니다. GuideExample의 실행 높이와 캡처 전체 프레임 높이를 일치시켜 본문 밖에 렌더링되는 Modal도 포함합니다. 나머지 사례는 콘텐츠 기반 높이를 유지합니다.
- 모바일 본문은 마지막 항목에서 시작하는 520px 문서용 화면입니다. 권장 사례는 스크롤 본문·하단 행동을 형제로 나누고, 모의 키보드 표시 중에는 220px를 한 번 제외합니다. 안전 여백 24px는 맨 아래 탐색(탐색이 없는 경우 CTA)에만 적용합니다. 키보드 시뮬레이션은 OS 이벤트·인셋 구현이나 기기 검증을 대신하지 않습니다.
- `scripts/design-figures.mjs`는 기존 packed 캡처 도구를 사용하며 별도 `design-figures/manifest.json`에 패키지 정보, fingerprint, 이미지 해시·좌표를 기록합니다. fingerprint에는 정의·캡처 코드·번들·스타일·폰트가 포함됩니다.
- `build:design-figures`는 전체 빌드에 포함됩니다. `design-figures:check`는 누락·변경된 이미지와 잘못된 좌표·오래된 생성 결과를 실패 처리합니다. 이미지·manifest를 직접 편집하지 마세요.
- 기본 화면에는 도해와 번호별 해설을 표시합니다. 실행 프레임과 코드는 펼친 뒤에만 로드합니다. 삭제 확인은 기존 레이어 예제처럼 각 프레임의 ‘실행 비교 열기’를 눌렀을 때 Modal을 시작해 두 프레임의 자동 포커스 경쟁을 피합니다. 폭 변경은 해당 폭의 새 예제로 시작합니다. 이미지 실패 시 해설, 재시도와 실행 예제 진입을 제공합니다.

`tests/design-cases.test.mjs`, `tests/browser/design-cases.spec.ts`, `tests/browser/design-case-actions.ts`와 기존 200% 확대 검사에서 데이터·캡처·검색 목적지, 입력 재검증·삭제·동일 조건 갱신·독립적인 복구·본문 스크롤·모의 키보드, 현재 값 복사·재실행, 실제 프레임 폭, 모바일 확대·포커스 복귀·이미지 복구를 검증합니다. Native Web 캡처와 상호작용은 기기 검증을 뜻하지 않습니다.
