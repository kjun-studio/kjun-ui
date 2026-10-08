# 문서 예제 유지보수

공개 컴포넌트 77개와 Provider·피드백 예제는 Vue 2, React, Native Web에서 동일한 예제 정의를 사용한다. 패키지 API·스타일은 수정하지 않으며, 실제 기기 검증 여부는 기존 카탈로그를 따른다.

## 정의와 생성

- `shared/example-registry.ts`: 조절기, 초기값, 프리셋, 최소 캔버스 높이, 복원 한계. 해당 예제에서 작동하는 조절기만 등록한다. 조절기와 프리셋 ID는 중복하지 않는다.
- `previews/catalog/example-controls.ts`, `example-data.ts`, `example-tools.ts`: 실행 동작과 샘플 데이터. 컴포넌트별 switch 분기를 한 번 작성한다. props에 함수를 전달할 때 실제 플랫폼 계약을 확인한다.
- `previews/templates/`: 플랫폼 어댑터와 Provider 연결. Vue Select의 `update:open`, Vue Input의 `readonly`, Native Input의 `onChangeText` 매핑을 유지한다.
- `scripts/examples.mjs`: TypeScript 심벌을 이용해 각 분기에서 사용하는 헬퍼만 추출한다. 템플릿에서 실행 모듈과 복사 소스를 함께 생성한다. 실행 모듈에만 상태·이벤트 계측을 삽입한다. 비동기 검색 함수와 캐시는 컴포넌트 렌더 밖에 유지한다.
- `artifacts/examples/`와 `public/previews/sources/`는 생성 결과다. 생성 결과를 직접 편집하지 않는다.

## 기본 사용 코드

공개 77개 컴포넌트 상세와 피드백 서비스는 `#usage`의 기본 사용법에 선택한 플랫폼의 기본 프리셋 코드를 펼쳐 표시한다. 미리보기 → 동작과 책임 → 기본 사용법 → 디자인 → API → 접근성 순서이며, 입력·선택·크기·열림 상태·초기화는 코드에 반영하지 않는다. Vue는 template과 script가 있는 SFC, React·Native는 JSX 컴포넌트다. Button 기본 예제는 각 플랫폼에서 30줄 이하다. 표·검색·피드백은 샘플 데이터와 실제 핸들러를 포함하며 길이를 줄이기 위해 동작을 생략하지 않는다.

- `shared/usage-examples/`의 명시적인 생성기를 입력·선택, 레이어, 데이터 표시, 확장 컴포넌트, 검색, 피드백, 구현 사례로 나누어 필요한 분류만 지연 로드한다. 새 공개 컴포넌트에 생성기가 없으면 검증이 실패한다.
- 생성기는 기존 조절기 설정·프리셋·샘플 데이터를 재사용한다. 출력에는 데모 렌더러, 이벤트 변환표, 계측 코드나 예제 내부 모듈 import가 없다.
- 공통 Provider, 패키지 스타일, 적용 프로젝트의 색상·서체 파일은 `시작하기#connect`에서 제공한다. 기본 코드는 `Example.vue` 또는 `Example.jsx`로 연결한다. 개별 페이지에는 `공통 설정: 시작하기` 링크만 표시한다.
- 생성기의 `feedback`·`domainColors`가 필요한 예제에는 `이 예제에 필요한 설정` 안내와 `시작하기#feedback-setup`·`시작하기#domain-colors` 링크를 표시한다. 컴포넌트 자체의 필수 조건과 구분하며 링크는 문서 플랫폼을 유지한다.
- `shared/usage-examples/setup.ts`의 공통 파일과 추가 코드 조각을 문서·실행 검증에서 함께 사용한다. 추가 import·등록·Provider 내부·색상 파일·속성은 기존 설정에 덧붙이며 피드백과 색상을 함께 적용해도 서로 덮어쓰지 않는다. 샘플 값은 문서 소유이며 제품 토큰 연결은 색상·서체 가이드를 따른다.
- 코드의 로딩·오류·재시도는 `usage-source.tsx`가 독립적으로 관리한다. 플랫폼·컴포넌트별로 영역을 교체하고 이전 요청의 응답을 무시한다. iframe 준비나 snapshot 응답을 기다리지 않는다.
- `CatalogPreview`와 `GuideExample`, `MotionPlayground`에는 코드·설정 파일·코드 재시도 UI를 넣지 않는다. 초기화, 실행 재시도, 예제 설정, 이벤트 기록과 관련 문서 이동은 유지한다.
- `shared/implementation-examples.ts`가 구현 설명의 소유 사례 15개(복합 레시피 9개, 동작·배치 사례 6개)를 명시한다. 가이드의 별도 구현 방법에 권장 사례의 초기 상태와 공개 API 코드를 제공한다. 단순 비교는 관련 컴포넌트의 기본 사용법으로 연결한다.
- 전체 실행 소스와 snapshot 프로토콜의 생성 산출물은 packed 예제 실행·검증에 계속 사용한다. 문서에서 현재 상태를 코드로 복사하는 기능은 제공하지 않는다.

프리뷰는 `artifacts/consumer.json`의 독립 소비 환경에 설치한 tarball에 연결된다. 문서에서 패키지 소스나 워크스페이스 패키지를 직접 실행하지 않는다. 기존 세 컴포넌트용 프리뷰 URL은 호환용으로 남아 있으며, 현재 문서의 실행은 공통 카탈로그 경로를 사용한다.

## 미리보기 상태와 기본 코드

설정 버전·플랫폼·세션·프레임 출처가 모두 맞는 렌더 완료 응답만 미리보기에 적용한다. 코드 복사는 이미 표시된 기본 코드 또는 구현 코드를 사용하며 실행 중인 입력·선택·열림 상태를 읽지 않는다.

상세 문서의 사용법·디자인·API·접근성 이동은 같은 페이지의 앵커다. 본문과 예제를 교체하지 않으므로 입력값이 유지되고 `#usage`도 사용법 그룹의 현재 위치로 표시한다. 가이드 주제 사이의 이동은 별도 페이지 진입이다.

프리셋·플랫폼 전환은 미리보기 상태·기록을 초기화한다. 복수 선택 전환은 값의 배열/단일 형태를 초기화한다. 조회 상태를 바꾸면 이전의 queryKey/resultKey 조작값도 초기화한다. 색상·폭 변경은 공개 API로 복원 가능한 현재 값을 유지한다. 기본 사용법의 코드는 플랫폼 변경에만 따라 바뀐다.

상세 페이지의 실행기는 프리셋·실제 프레임 너비·초기화·넓게 보기를 상단에 표시한다. 프리셋이 하나뿐이면 선택기 대신 기본 예제로 표시한다. 예제 설정은 모양·동작·상태·콘텐츠와 문서 색상 환경으로 묶고 이벤트 기록은 접힌 설정 밖에 둔다. 비교 사례가 고정하는 속성은 설정에서 제외한다. 확대 화면에서도 설정을 조작할 수 있으며 닫은 뒤 입력값·설정을 유지하고 확대 버튼으로 초점을 돌려준다.

상세 실행기의 레이어 예제는 닫힌 상태에서는 콘텐츠 높이를 사용하고 열렸을 때 필요한 공간을 확보한다. 375px 보기에는 실제 iframe 너비를 함께 표시하며, 부모 영역이 더 좁으면 축소된 실제 너비를 안내한다. ErrorBoundary는 의도적인 렌더 오류와 예제 복구를, ScrollFade는 줄바꿈하지 않는 긴 항목을 제공한다. 복사·외부 링크의 모의 콜백은 캔버스 아래에 명시한다. `tests/browser/example-runner.spec.ts`에서 세 플랫폼의 설정·확대·복구·가로 스크롤과 모바일 너비를 검사한다.

## 문서 플랫폼 선택

문서 상단의 선택은 예제·복사 코드·API·설치 가이드가 함께 사용한다. `DocsPlatformProvider`가 선택을 관리하고 예제는 현재 플랫폼을 입력으로 받는다. 플랫폼을 확정하기 전에는 플랫폼별 콘텐츠를 렌더링하지 않는다.

- URL의 `platform=vue2|react|native`가 현재 탭의 `sessionStorage` 값보다 우선한다. 둘 다 없으면 Vue 2를 사용한다. 키는 `kjun-docs-platform-v1`이며 탭 간 동기화는 하지 않는다.
- 초기 URL 정리는 replace, 사용자 선택은 push로 기록한다. 뒤로·앞으로 이동과 페이지 복원 시 URL을 다시 적용한다. 예: `/components/select?platform=react#api`.
- 문서 링크와 검색 결과는 플랫폼을 전달한다. 갤러리는 검색·분류만 변경하고 플랫폼을 유지한다. 외부 링크·다운로드·내부 앵커는 바꾸지 않는다.
- 플랫폼 변경은 선택한 프리셋·색상을 유지하고 프리셋 초기 설정·값을 적용한다. 이벤트 기록을 초기화하고 이전 코드 로딩 응답을 무시한다. 설정 도구가 명시적으로 전달한 설정은 그대로 적용한다.
- 공유 URL에는 플랫폼만 포함한다. 프리셋·입력값 공유와 별도 플랫폼 비교 화면은 포함하지 않는다.

플랫폼 전환 회귀는 `tests/browser/docs-platform.spec.ts`에서 첫 프레임·복사·API 일치, URL·탭 복원, 저장소 실패, 이전 응답 무시, 모바일 키보드 조작을 검사한다.

## 검증

모든 Node/npm 명령은 `kjun_ui_dev`의 `/workspace`에서 실행한다.

```sh
docker exec -w /workspace kjun_ui_dev npm run typecheck
docker exec -w /workspace kjun_ui_dev npm run build:previews
docker exec -w /workspace kjun_ui_dev npm run examples:verify
docker exec -w /workspace kjun_ui_dev npm test
docker exec -w /workspace kjun_ui_dev npm run build:thumbnails
docker exec -w /workspace kjun_ui_dev npm --prefix apps/docs run build
docker exec -w /workspace kjun_ui_dev npm run test:browser
```

`examples:verify`는 전체 코드와 짧은 코드의 기본·프리셋·상태 복원·boolean false 조합을 실제 소비 환경에서 컴파일한다. 짧은 코드만 검사하려면 `node scripts/example-consumers.mjs --usage`를 사용한다. 시작하기의 공통 설정과 해당 예제의 추가 설정을 결합하며 Vue는 패키지 빌드와 동일한 compiler·transpiler로 template의 render 함수까지 연결한다. 결과는 `artifacts/export-checks`에만 저장한다. 브라우저 테스트는 이 결과를 읽어 독립 실행하고, UI에서 실제 복사한 코드도 다시 컴파일하여 실행한다. 테스트 전 packed 프리뷰와 소비 예제를 생성해야 한다.

`tests/usage-examples.test.mjs`는 전체 대상의 생성기, Button 길이, 문자열 escaping, false·0·빈 문자열·배열·null 보존을 검사한다. `tests/browser/getting-started-setup.spec.ts`는 문서에서 복사한 공통 설정과 추가 설정 4개 조합의 독립 실행, 링크·플랫폼·앵커·목차·검색·모바일 배치를 확인한다. `usage-examples.spec.ts`는 전체 기본 코드의 독립 실행·배치 순서·상태 분리·코드 재시도·빠른 플랫폼 전환을 확인한다. `implementation-examples.spec.ts`는 15개 소유 사례와 공개 API 동작을, `usage-layout.spec.ts`는 세 플랫폼의 390·1280·1440px 및 실제 200% 확대를 확인한다. Native 실행 결과는 Native Web 검증이다.

패키지·예제·스타일 변경 후 썸네일을 갱신하고 모달·메뉴·표·하위 구성 이미지를 확인한다. 기본 빌드는 현재 KJUN 패키지·소비 환경·문서를 검증한다. 빌드 절차는 [유지보수 안내](maintenance.md)를 따른다.

### 2026-09-12 검증 결과

- 플랫폼 선택 통합을 포함한 타입 검사와 단위 테스트 22개, 전체 브라우저 테스트 95개 통과.
- packed 소비 환경에서 복사 예제 348개 컴파일, 세 플랫폼의 모든 기본 예제 실행 확인.
- React 썸네일 68개 재생성, 대표 레이어·표·하위 구성과 데스크톱·모바일 문서 화면 확인.
- 플랫폼 통합 후에는 예제 정의를 변경하지 않았으며 썸네일 68개와 검색 색인의 유효성을 다시 확인했다. 320px·390px·900px·1440px에서 상단 선택기와 문서 레이아웃을 검증했다.
- 패키지·프리뷰·문서의 개별 빌드 통과.

브라우저 테스트는 기본적으로 `http://127.0.0.1:4173`의 실행 중인 문서를 사용한다. 다른 포트는 `KJUN_TEST_URL`로 지정한다. Native 검증은 Web 실행에 한정한다.

현재 범위와 검증 결과는 [신규 계약](extensions.md)과 [v0.3.0 검증 기록](verification-v0.3.0.md)을 따릅니다. 문서에 남은 날짜별 수치는 당시 이력입니다.
