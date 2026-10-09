# KJUN UI 유지보수

KJUN은 컴포넌트의 구조·상태·상호작용 계약을 소유한다. 모든 Node/npm 명령은 `kjun_ui_dev` Docker 컨테이너에서 실행한다.

## 실행과 검증

```sh
./scripts/dev.sh
docker exec kjun_ui_dev npm run build
docker exec kjun_ui_dev npm test
docker exec kjun_ui_dev npm run test:browser
docker exec kjun_ui_dev npm run test:docs
```

`build`는 토큰 생성 결과 검사, 패키지 빌드, 카탈로그·문서 검사, 타입 검사, 로컬 패키징, 독립 소비 검증, 예제 컴파일·캡처와 문서 빌드를 실행한다. 

`test:browser`는 `tests/browser`의 패키지 계약 검사만 실행한다. 각 검사가 설치한 tarball을 직접 번들해 열기 때문에 문서 서버가 없어도 된다. `test:docs`는 `tests/browser/docs`의 문서 사이트·packed 미리보기·복사 코드 export 검사를 실행한다. 문서 앱을 빌드한 뒤 전용 서버 `http://127.0.0.1:4174`를 띄우므로 개발 서버는 필요하지 않다. 복사 코드 export의 전체 렌더링은 `docs/export-renders.spec.ts` 하나에서 기본 예제·사용 코드·시각 가이드를 함께 확인한다. 새 컨테이너에서는 `setup:browsers`가 Playwright 브라우저와 시스템 라이브러리를 설치한다. 브라우저 파일은 `kjun_ui_playwright` 볼륨에 남는다.

### 작업 순서와 검사 범위

빌드·패키징·설치·검사는 같은 checkout의 공통 잠금을 사용한다. 다른 작업이 실행 중이면 작업명과 경과 시간을 표시하며 대기한다. 빌드 안에서 호출하는 하위 npm 명령은 같은 잠금을 재사용한다. 실패·중단 시 해당 명령의 자식 프로세스를 정리하고 잠금을 해제한다. 잠금 파일은 Docker의 `/tmp`에 있으며 직접 삭제하지 않는다. `test:workflow`로 실행 순서·중단·검사 선택을 검증할 수 있다.

기본 검증은 변경의 영향 범위에 해당하는 관련 검사(필요하면 빠른 검사 포함)만 실행한다. 전체 검사는 요청이 있을 때 실행한다. 문서 관련 검사는 패키지 계약 검사를 대체하지 않는다. 공통 토큰·런타임·레이어·레이아웃·모션 변경은 전체 패키지·문서 검사를 실행한다.

```sh
docker exec kjun_ui_dev npm run test:browser:smoke
docker exec kjun_ui_dev npm run test:browser:related -- select
docker exec kjun_ui_dev npm run test:browser:related -- table,data-state
docker exec kjun_ui_dev npm run test:browser:full
# 목록만 확인할 때는 빌드·브라우저 실행·패키지 설치가 없다.
docker exec kjun_ui_dev npm run test:browser:related -- select --list
```

- `test:browser`와 `test:browser:full`: 기존 전체 패키지 검사. 별도의 3종 브라우저 설정은 기존 `test:browser -- -c ...`로 실행한다.
- `test:browser:smoke`: 기존 `expanded`, `card-contract`, `data-state-design` 파일의 17개 검사. 세 플랫폼의 기본 선택·카드·데이터 상태를 확인하며 전체 검증을 대신하지 않는다.
- `test:browser:related`: `alert`, `data-state`, `card`, `table`, `market`, `select`, `combobox`, `search-input`, `input`, `button`, `form`, `tabs`, `accordion`, `navigation`, `feedback`, `modal`, `drawer`, `popover`, `dropdown`, `tooltip`, `icons`, `typography`, `quantity`, `slider`, `time-picker`, `radio`, `accessibility`를 쉼표로 지정한다. `all`, `tokens`, `runtime`, `layers`, `layout`, `motion`은 전체 검사로 확장한다. 매핑은 `scripts/browser-test-profiles.mjs`에서 관리하며 새 검사 파일도 관련 그룹에 등록한다.

관련 검사는 변경 파일을 자동 추론하지 않는다. 호출자가 영향 범위를 지정하며 알 수 없는 범위는 실패한다. 컴포넌트가 다른 컴포넌트를 사용하는 경우 그 소비 관계도 매핑에 반영한다. 제목을 잘라 선택하지 않고 선택된 파일의 모든 플랫폼·화면 크기 사례를 실행한다. 빠른·관련 검사의 결과와 HTML 보고서는 각각 `test-results-browser-smoke`, `test-results-browser-related`, `playwright-report-browser-smoke`, `playwright-report-browser-related`에 저장한다. 기본 워커 1개, 현재 패키지 일치 검사와 기존 전체 테스트는 유지한다.

표 정렬 순환의 계산은 `tests/table-sort.test.mjs`에서 단위 검사한다. 실제 클릭에 따른 행 순서·제어 상태·서버 정렬은 세 플랫폼의 `table-contracts.spec.ts`에 남기고, `api-reference.spec.ts`는 중복된 전체 순환 대신 공개 이벤트 payload를 한 번 검사한다. 선택·포커스·화면 크기·IME·비동기 취소 등 브라우저가 필요한 검사는 유지한다.

```sh
docker exec kjun_ui_dev npm run test:docs:smoke
docker exec kjun_ui_dev npm run test:docs:related -- select
docker exec kjun_ui_dev npm run test:docs:related -- alert,data-state
docker exec kjun_ui_dev npm run test:docs:full
# 목록 확인은 문서를 빌드하거나 브라우저를 실행하지 않는다.
docker exec kjun_ui_dev npm run test:docs:related -- select --list
```

- `test:docs`와 `test:docs:full`: 기존 전체 검사. 기존 파일 지정·`--grep` 인자도 유지한다.
- `test:docs:smoke`: 문서 셸·검색·모바일 탐색과 Vue 2/React/Native Web의 데스크톱·모바일 미리보기 12개 사례. 전체 검증 완료로 기록하지 않는다.
- `test:docs:related`: `alert`, `data-state`, `card`, `table`, `select`, `input`, `button`, `icons`, `navigation`, `accessibility`, `docs`, `overview`, `catalog`, `foundations`, `guides`, `exports` 중 하나 이상을 쉼표로 지정한다. 선택 파일의 모든 플랫폼 사례를 실행한다. `all`, `tokens`, `runtime`, `layers`, `layout`, `motion`, `shell`이 포함되면 전체 검사로 확장한다. 기본 검증은 영향 범위만 실행한다. 전역 CSS 파일을 수정하더라도 바뀐 선택자를 실제로 쓰는 페이지의 범위를 지정하고, 셸·사이드바·헤더의 배치를 바꾼 경우에만 `shell`로 전체 검사를 실행한다. 전체 검사는 요청이 있을 때나 공통 토큰·런타임·레이어 변경에만 실행한다. 모든 문서 spec은 적어도 한 그룹에 속해야 하며 `test:workflow`가 이를 확인한다. 4174 포트에 이미 응답하는 서버가 있으면 오래된 빌드를 검사하지 않도록 빌드 전과 서버 시작 직전에 실패한다. 목록에 없는 범위는 실패하므로 전체 검사 또는 명시적인 spec 파일을 선택한다. 매핑은 `scripts/docs-test-profiles.mjs`에서 관리하며 컴포넌트 소비 관계가 바뀌면 함께 갱신한다.

빠른·관련 검사 결과는 각각 `test-results-docs-smoke`, `test-results-docs-related`에 저장한다. 기본 워커 1개와 기존 패키지 정합성 검사는 유지한다. 빌드 캐시나 타임아웃 완화는 적용하지 않는다.

새 빌드/설치 명령도 `scripts/workflow-run.mjs`를 거치게 한다. 직접 실행하는 임의 명령은 자동으로 보호되지 않는다. 예를 들어 수동 의존성 설치나 여러 단계를 하나의 작업으로 실행할 때는 아래처럼 감싼다. 기존에 실행 중이던 명령에는 잠금이 소급 적용되지 않는다.

```sh
docker exec kjun_ui_dev npm run workflow -- npm install
docker exec kjun_ui_dev npm run workflow -- sh -c 'npm run build && npm run test:docs:full'
```

개발 서버는 계속 사용하는 장기 실행 프로세스라 공통 잠금 대상에서 제외한다. 공통 잠금은 소스 편집까지 차단하지 않으므로, 최종 검사 중에는 해당 소스와 산출물을 다른 작업에서 변경하지 않는다.

`npm test`와 Playwright는 실행 전에 현재 소스·빌드 출력·tarball·설치본의 일치를 검사한다. 버전 번호가 같아도 소스나 설치 파일이 다르면 중단한다. `verify:current`로 이 검사만 실행할 수 있다. 패키지를 수정했다면 `build:packages` → `pack:local` → `verify:consumers` 순서로 갱신한다. 문서 전체 검증은 위의 `build`부터 실행한다.

Playwright의 기본 조건 대기는 30초, 일반 테스트 제한은 90초다. 문서 검사용 빌드는 미리보기 준비 제한을 30초로 늘리므로(평소 15초, `scripts/docs-test.mjs`) 문서 검사의 조건 대기는 45초다. 클릭·문서 이동도 30초로 제한한다. Docker에서 문서 클라이언트와 packed iframe 준비가 10초를 넘을 수 있으므로, 가이드 상호작용은 플랫폼 초기화 이후에 시작한다. 독립된 모바일 비교 예제는 이전 iframe을 정리한 새 페이지에서 검사한다. 실제 스크롤·위치 유지 동작은 `document-navigation.spec.ts`와 확대 검사에서 별도로 확인한다. 문서 레이아웃·확대 검사(`*-layout.spec.ts`, `visual-zoom.spec.ts`)는 문서 셸을 검사하므로 React에서 모든 폭과 실제 브라우저 확대를 확인하고, Vue 2·Native는 가장 좁은 폭 하나만 확인한다(`motion-docs-helpers.ts`의 `layoutWidths`·`checksZoom`). 플랫폼마다 다른 패키지를 실행하는 검사는 세 플랫폼을 유지한다.

빌드 순서나 패키징을 수정했다면 `docker exec kjun_ui_dev npm run verify:reproducible`도 실행한다. 실제 패키지 빌드·로컬 패키징을 두 번 수행한다. 두 번째 빌드 전에 다섯 dist에 오래된 선언 파일을 추가해 제거되는지 검사하고, 소스 해시·모든 출력 파일·다섯 tarball의 무결성이 같은지 비교한다. 성공하면 최종 패키지로 독립 소비 환경을 갱신하고 `artifacts/reproducible-build.json`에 결과를 기록한다. 출력과 설치본을 갱신하므로 다른 빌드·패키지 테스트와 동시에 실행하지 않는다.

`tests/browser/search-input.spec.ts`는 검색의 초안 취소·요청 취소·지우기 이벤트·항목 식별자와 Modal 내부 검색 Escape를, `layer-contracts.spec.ts`는 Popover 내부 편집과 Modal·prompt·Toast 소유권을, `runtime-market.spec.ts`는 클릭 가능한 시장 행 내부 버튼을 설치한 tarball로 검사한다.

레이어 변경은 `playwright.elevation.config.ts`로 Chromium·Firefox·WebKit에서 검사한다. `quantity.spec.ts`의 입력/Modal 조합도 이 실행에 포함한다. `elevation-keyboard.spec.ts`는 Modal·Drawer의 편집 취소 우선순위, 닫기 비활성 정책, IME·반복 키·keyup, 헤더를 숨긴 대화상자 이름과 Provider 없는 React 사용을 확인한다.

문서 서버는 http://127.0.0.1:4173 에서 실행한다. production 서버를 사용할 때는 정적 예제를 생성한 다음 문서를 빌드하고 서버를 재시작한다. 기존 서버가 실행 중이면 `dev.sh`는 그 주소를 안내한다.

개발 서버의 파일 감시와 자동 화면 반영(HMR)은 비활성화한다. Docker 공유 폴더를 짧은 주기로 조회하는 상시 CPU 부하를 방지하기 위한 설정이다. 소스나 패키지를 변경한 뒤에는 실행 중인 문서 개발 서버를 종료하고 `./scripts/dev.sh`로 다시 시작한 다음 브라우저를 새로고침한다. 패키지 변경 시 필요한 빌드·pack·설치 순서는 그대로 따른다.

문서 셸은 패키징된 `@kjun-ui/react`·`@kjun-ui/tokens`·`@kjun-ui/icons`를 설치해 사용한다.

`pack:local` 다음 `docs:install`이 동일 버전 tarball의 무결성을 갱신하고 설치본을 검증한다. 문서 개발 서버와 빌드도 설치본이 현재 패키지와 같은지 확인한다. 전체 `setup`은 패키지 빌드·pack 이후 문서 의존성을 설치하므로 새 체크아웃에서 tarball을 먼저 준비할 필요가 없다.

실제 컴포넌트 예제는 독립 소비 환경에 설치한 KJUN 패키지를 사용한다.

문서 앱의 색상·서체는 `apps/docs/app/kjun.css`에 있고, `DocsKjunProvider`가 앱 토큰을 공급한다. 탐색 링크와 검색 결과 목록은 문서에 맞게 조합하며 버튼·입력·선택·표·카드·탭·레이어는 공개 KJUN API를 사용한다. 예시 팔레트와 서체는 `shared/demo-colors.ts`에서 관리하며 패키지에 포함하지 않는다.

## 패키지와 공개 범위

현재 배포 버전은 npm `@kjun-ui/*` v0.3.1이다. `pack:local`은 다섯 패키지의 `.tgz`를 생성하고 `artifacts/manifest.json`에 파일명·버전·무결성을 기록한다. 문서 다운로드와 소비 검증은 이 manifest를 사용한다. `verify:consumers`는 별도 임시 프로젝트에 설치하여 워크스페이스 소스 없이 소비할 수 있는지 확인한다.

소비 검증 폴더는 후속 `verify:current`·예제 검사에서도 사용하므로 현재 성공 폴더 하나를 보존한다. 새 검증이 성공하면 `consumer.json`을 원자적으로 교체한 뒤 이전 폴더를 삭제한다. 실패하면 새 폴더만 삭제하고, 강제 종료 잔여물은 다음 소비 검증 시작 시 정리한다. 모든 정리는 공통 workflow 잠금 안에서 Linux `rm`을 낮은 CPU 우선순위로 실행해 폴더별로 순차 처리한다. 이전 형식 폴더도 삭제 전에 checkout별 이름으로 옮겨 중간에 종료돼도 소유권을 식별할 수 있게 한다. 현재 기록이 손상됐으면 정리를 중단하고, 다른 checkout·일반 임시 폴더·심볼릭 링크는 정리 대상으로 삼지 않는다. 삭제 실패는 경고를 남기고 다음 실행에서 재시도한다.

기존 잔여 폴더만 정리할 때는 `docker exec kjun_ui_dev npm run workflow -- node scripts/consumer-workspace.mjs`를 사용한다. 이전 형식의 `kjun-consumer-*`도 이 checkout의 tarball 설치 프로젝트임을 확인한 경우에만 정리하며, `consumer.json`이 가리키는 폴더는 패키지가 오래됐더라도 보존한다. `/tmp/kjun-consumer-*`를 일괄 삭제하지 않는다.

`artifacts/build-state.json`은 빌드 입력과 출력 해시, `pack-state.json`은 패키지 manifest와 빌드 연결을 기록한다. 빌드를 시작하면 이전 성공 기록을 무효화하므로 실패한 빌드 뒤에 이전 파일을 최신 패키지로 검증할 수 없다. 빌드 중 자동 생성하는 Vue API 선언은 입력에서 제외하고 배포되는 `dist/index.d.ts`를 출력으로 검사한다. 소비 검증은 lockfile의 무결성과 설치된 파일 내용까지 대조한다. 미리보기·복사 예제·그림·접근성 검사도 같은 사전 검사를 사용한다.

[컴포넌트 카탈로그](../shared/component-catalog.json)는 공개 컴포넌트 80개와 내부 구현 5개를 추적한다. 내부 TableCards는 DsTable, Toast·ToastContainer·ConfirmModal·PromptModal은 KjunFeedbackProvider에 연결된다. 사용자용 지원 현황에는 공개 컴포넌트·설정 API·피드백 서비스와 플랫폼별 사용 범위를 표시한다.

카탈로그의 `origin`, `sources`, 내부 `owner`는 유지보수 정보다. 공개 화면의 제목·설명·검색 결과에 구현 출처나 이관 단위를 그대로 표시하지 않는다. 문서 플랫폼이 Native일 때 공통 셸에서 브라우저 미리보기·기기 미검증 안내를 한 번 표시하고, 컴포넌트 본문에는 해당 기능의 구체적인 차이를 설명한다.

### 토큰 메타데이터 · 2026-09-14

`tokens.basis`와 `tokens.json`의 `basis` 키 값은 `KJUN`이다. 이는 현재 규격의 이름을 나타내는 메타데이터다. 구조·크기·간격·색상 역할·동작 토큰은 바꾸지 않는다. 저장소의 소비 코드에는 이 값으로 분기하거나 이전 리터럴 타입에 의존하는 곳이 없었다. 별도 소비 코드가 이전 문자열을 비교한다면 해당 비교를 갱신해야 한다.

## 공통 상태와 선언 파일

React·Native의 Table, MarketCards, SearchInput 상태 로직은 `shared/package-runtime`에서 관리한다. 이 소스는 각 패키지의 ESM·CJS 번들에 포함되며 별도 배포 패키지나 런타임 의존성을 추가하지 않는다. 렌더링·포커스·팝업 열기·플랫폼 이벤트는 각 패키지가 담당한다. MarketCards 저장소 접근은 주입하며 React는 기본 localStorage, Native는 소비자가 전달한 저장소를 사용한다.

`shared/package-runtime`과 `scripts/declarations.mjs`, `scripts/vue-prop-type.mjs`는 빌드 소스 해시에 포함된다. API 추출은 공통 모델의 상속된 props와 기본값도 따라간다. Vue 함수형 prop은 TypeScript AST로 최상위 union을 조합하므로 콜백의 반환값 null과 prop 자체의 null을 구분한다. 생성된 Vue `src/index.d.ts`와 문서 API 데이터는 같은 타입 계산을 사용한다.

React·Native의 `dist/index.d.ts`는 `dist/types/packages/<platform>/src/index.d.ts`를 재수출한다. `dist/types/shared/package-runtime`에도 선언을 출력해 상대 경로를 패키지 안에서 완결한다. 선언 생성은 `scripts/declarations.mjs`에서 저장소 기준 rootDir로 수행한다. 빌드는 시작 기록을 pending으로 만든 뒤 다섯 패키지의 생성 전용 dist 전체를 비우고 icons → tokens → vue2 → react → native 순서로 다시 만든다. 실패하거나 중단된 빌드는 pack·소비 검증을 통과할 수 없다.

Vue Table은 부모가 상태와 이벤트를 소유하며 `table/`의 sorting·search·expansion·cards·layout·viewport 모듈로 계산과 감지를 나눈다. TableCards에는 카드에 필요한 값과 콜백만 전달한다. 세 플랫폼의 카드·컴팩트 전환은 `tokens.table.mobileBreakpoint = 768` 미만을 사용한다.

`tests/browser/{table-contracts,runtime-cards,runtime-market,search-input}.spec.ts`는 설치된 tarball로 화면 경계·상태 유지·카드 슬롯·검색 취소·저장값 복원을 검사한다. `tests/fixtures/runtime-types.tsx`는 독립 소비 프로젝트에서 nullable Vue 콜백·제네릭 추론·플랫폼별 높이 타입을 검사한다. `tests/package-runtime.test.mjs`는 선언의 상대 참조가 패키지 안에서 해결되는지, 설치한 ESM·CJS가 실행되는지 확인한다. Native 런타임 검증은 Native Web을 사용한다.

## 컴포넌트 모션

숫자 갱신은 `shared/package-runtime/number-motion.ts`에서 포맷팅 이전의 현재 표시값을 보관한다. `fromPrevious=true`일 때 연속 갱신은 현재 값에서 이어지고, 문자열·비애니메이션·모션 감소·제거 시 이전 프레임을 취소한다. React·Vue·Native가 같은 계산을 사용한다.

선택 표시와 펼침은 200ms, 큰 패널은 등장 300ms·퇴장 200ms, 작은 팝업은 등장 200ms·퇴장 150ms를 기준으로 한다. Tooltip은 100ms 투명도 전환을 사용한다. 색상·서체는 적용 프로젝트가 제공하며 모션을 위한 공개 props나 제품별 규격은 추가하지 않는다.

화면에 남아 있는 상태와 공개 상태값은 구분한다. 닫기 이벤트·피드백 Promise·Toast 타이머는 원래 시점에 처리하고, 퇴장 중인 내용은 조작 대상에서 제외한다. Native 팝업은 위치 측정이 끝난 뒤 표시한다. 모션 감소가 켜지면 진행 중인 전환을 최종 상태로 맞춘다.

`tests/number-motion.test.mjs`는 숫자 재지정과 프레임 취소를, `tests/browser/component-motion.spec.ts`와 `layer-motion-edges.spec.ts`는 packed 패키지의 중간 프레임·빠른 반전·모션 감소·레이어 정리·피드백 수명을 검사한다. 회전 속도는 제어된 시간으로 검사하며 실제 기기 성능 측정과 구분한다. 기존 ButtonGroup 모션 검사도 함께 실행한다.

## 공통 상태·표시 로직 유지보수

`shared/package-runtime/options.ts`는 옵션 값·타입을 보존하는 식별자와 선택 계산을 제공한다. React·Native의 Select는 같은 검색 결과·페이지 제한·선택 표시 계산을 사용하며, Combobox는 별도 공통 상태 훅을 사용한다. Vue Select는 식별·선택 계산을 공유하고 기존 검색 대상과 순위를 유지한다. 실제 열림 전이의 처리와 플랫폼별 포커스 계약은 기존 상태 회귀 검사에서 확인한다.

Table의 카드 구성·반응형 컬럼과 셀 렌더러 우선순위는 `table-presentation.ts`에서 관리한다. React·Native의 각 Table은 상태를 소유하고 도구 모음·카드·표 렌더러에 필요한 값과 콜백을 전달한다. 셀 렌더러가 반환한 null·false·0을 기본 포맷으로 덮어쓰지 않는다. FeedbackDialog의 검증·제출·취소는 공통 훅을 사용하며, 화면에 남아 있는 이전 요청은 다음 요청을 완료할 수 없다.

React 레이어의 기존 재수출 경로는 유지하며 FloatingPanel·Popover/Tooltip·Dropdown·Drawer 구현을 분리했다. Dropdown의 한 상태 전이는 열림·닫힘 콜백을 한 번만 통지한다.

`tokens.motion`의 `layerEnter/layerExit`, `backdrop`, `popupEnter/popupExit`, `tooltipEnter/tooltipExit`, `toastEnter/toastExit`, `collapse`, `indicator`, `toastMove`가 모션 시간을 정의한다. CSS 변수는 토큰 생성기가 만들고, JavaScript 애니메이션과 제거 타이머도 같은 역할의 값을 사용한다. 기존 시간과 easing은 유지한다. 모션 시간을 변경할 때는 `tokens:generate` 뒤 packed 모션 검사를 실행한다.

소비 타입 검사는 Bundler·Node16·NodeNext × ESM·CommonJS의 여섯 조합에서 모든 공개 컴포넌트와 provider, 주요 제네릭·오류 타입·서브패스를 확인한다. 재현성 검사는 오래된 `.d.ts`와 `.d.cts`가 모두 제거되는지도 확인한다.

## 스타일 소스

Vue 유틸리티 설정은 `packages/vue2/style-utilities.json`과 `style-theme.mjs`, 입력 스타일은 `packages/vue2/src/styles/forms.css`에서 KJUN 소스로 관리한다. 레이어와 버튼 반경은 공통 토큰에서 가져온다. 서드파티 라이선스와 에셋 기록은 `licenses/`에 둔다.

## 상세 유지보수 문서

패키지 선언은 `scripts/declarations.mjs`가 Vue API 생성 뒤 후처리한다. ESM 선언의 내부 상대 경로는 `.js`, CJS의 `.d.cts` 선언은 `.cjs`를 사용한다. `package.json`의 `exports.import.types`와 `exports.require.types`는 각 선언으로 연결하고 기존 최상위 `types` 필드는 유지한다. Vue plugin의 CJS는 `module.exports`로 내보내는 설치 객체를 `export =`로 선언한다.

`verify:consumers`는 새 tarball을 설치한 환경에서 Bundler·Node16·NodeNext와 ESM·CJS의 6개 조합을 검사한다. 정상 import, 공개 타입 재수출, 제네릭 추론과 `@ts-expect-error` 사례를 함께 검사하므로 선언이 `any`로 사라져서 통과하는 경우도 잡는다. 선언 AST의 상대 경로 정규화와 설치본의 전체 선언 그래프는 단위 검사에서 별도로 확인한다.

- [API 설명과 검토](api-reference.md)
- [컴포넌트 탐색과 검색](component-discovery.md)
- [문서 예제와 상태 복사](component-examples.md)
- [구조 도해와 상태 비교](visual-guides.md)
- [화면 배치와 레이어](foundations.md)
- [신규 계약과 레시피](extensions.md)

선택적 WebMCP 예제 설정은 모의 레지스트리로 검사하며 실제 브라우저의 WebMCP 구현 검증과 구분한다. Native 검증 결과는 React Native Web에 한정한다. 실제 기기의 DatePicker·ScrollFade·배경 흐림 등의 차이는 해당 컴포넌트 가이드에서 관리한다.

## 토큰 원본과 변경 검증

작성 원본은 `packages/tokens/src/definitions`의 JSON이다. 타이포그래피와 색상·기하 규격·그림자·상태 표현을 분리하고 `$ref`로 공통 규격을 참조한다. `tokens:generate`가 공개 JSON, TypeScript, CSS와 문서 데이터를 생성하며 `tokens:check`는 생성 결과와 참조·단위를 검사한다.

사용자 문서와 패키지 README는 배포된 현재 규격과 사용법을 설명한다. 내부 버전 간 이관표와 개발 중 변경 내역은 사용자 안내에 포함하지 않는다.

`node scripts/token-mutation.mjs`는 임시 사본에서 본문·버튼·Card 반경·패딩·그림자를 바꾸고 패키지 재생성부터 세 플랫폼 렌더링까지 검사한다. 원래 작업 트리와 역사적 스냅샷은 수정하지 않는다. 성공 기록은 `artifacts/token-mutation.json`이다. Native Web만 실행한 경우 실제 기기 검증으로 기록하지 않는다.

`geometry-details.json`은 FormGroup·Checkbox·Switch·Pagination·금융 표시 등 세부 규격을, `states.json`은 상태 투명도·포커스·테두리를 관리한다. `scripts/token-validation.mjs`는 숫자로 표현되는 길이·시간·굵기·투명도·레이어의 잘못된 교차 참조와 모든 컴포넌트 그림자를 검사한다.

`tests/geometry-tokens.test.mjs`는 파일 목록을 고정하지 않고 전체 패키지 소스를 검사한다. 조건부 값·크기별 목록·논리 방향 속성·Vue 스타일도 포함한다. 0, 원형 50%, 실제 크기에 대한 비율 계산과 접근성 숨김 박스의 -1px은 기하 상수 예외다. 새로운 예외는 용도와 변경 전파 여부를 함께 기록한다.

`tests/typography-sizing-tokens.test.mjs`는 전체 패키지의 독립 굵기·자간과 반복된 기본 터치 크기를 검사한다. Checkbox·Switch 구현과 공통 폼 CSS에는 너비·높이 검사도 적용한다. 단순한 지역 상수와 크기 맵을 따라가지만 임의의 데이터 흐름 전체를 분석하지는 않는다. 그 외 컴포넌트의 모든 너비·높이를 토큰화했다는 의미는 아니다.

`tests/browser/token-propagation.spec.ts`는 Empty 제목·설명, 모든 크기의 ButtonGroup·FilterGroup 표시·측정 글자, Tabs, Checkbox·Switch의 치수와 터치 영역을 packed 패키지에서 확인한다. 원본 변경 검사에는 굵기·자간·최소 터치 크기·선택 컨트롤 치수도 포함한다. Switch 손잡이의 크기와 이동 후 안쪽 여백, 선택 변경 시 글자 폭 유지, 실제 입력·선택 동작을 함께 확인한다.

Chip의 크기별 타이포그래피는 `extensions.chip.typography`를 Web과 Native가 함께 읽는다. 삭제 영역과 Toast 너비·닫기 버튼·진행선도 역할에서 읽으며, Native Chip·Toast와 해당 CSS의 치수 감사로 고정값 재도입을 검사한다. `tests/browser/chip-toast-tokens.spec.ts`는 세 크기의 글자·삭제·비활성 상태, 글자 확대, Toast 크기·진행선·실행·닫기를 검증한다. 원본 변경 실험에는 Chip 역할 재연결과 삭제 크기, Toast 네 치수 변경을 포함한다.

`tests/token-relationships.test.mjs`는 양수 치수와 콘텐츠 수용 크기, Checkbox·Radio 내부 아이콘, Native Chip 터치 영역, Toast 최소/최대 폭, 페이지 레이어와 기본 breakpoint 순서를 검증한다. 간격·반경의 0 초기화, 모션 시간 0, 컴포넌트별 독립 반응형 기준은 허용한다.

`node scripts/token-consumption.mjs`는 숫자형 컴포넌트 규격의 플랫폼별 소비 경로를 검사한다. 지역 별칭·크기별 접근·구조 분해·가져온 geometry와 CSS 변수·Vue 유틸리티를 추적한다. 공유 CSS는 플랫폼의 소스가 해당 선택자를 사용할 때만 연결로 인정한다. 객체 전달은 하위 속성의 실행까지 증명하지 않으므로, 이 목록은 packed 렌더링 및 원본 변경 검사와 함께 사용한다. Native 전용 터치 영역, HTML 표의 자동 너비, Native의 페이지 크기 Select 조합 등 플랫폼 차이는 파일 안에 이유를 명시한다.

독립 입력이 아닌 조회용 별칭은 `scripts/token-aliases.mjs`에서 정규 역할에 대한 `$ref`를 강제한다. `button.fontSizes/radius/weight/formActionRadius`, `input.*.placeholderSize`, `extensions.compound`의 크기·반경과 이전 `extensions.navigation`의 중복 필드가 해당한다. 작성 원본에서 별칭을 별도 값으로 바꾸면 생성 단계에서 정규 역할을 안내하며 실패한다. 입력 글자와 placeholder는 동일 크기를 사용하고, Compound는 Input, 상단·하단 탐색은 `topNavigation/bottomNavigation`이 규격을 소유한다. `navigation.padding/actionsGap/actionGap`은 BottomActionBar의 독립 역할로 유지한다.

같은 파일은 Empty 아이콘, Badge 점, Alert 간격·닫기, FormActions, 크기별 입력 글자·affix, Modal 너비·제목, Drawer 닫기 반경, Tooltip 안쪽 여백, Table 스켈레톤, Pagination과 오류·KPI 표시를 검사한다. `scripts/token-mutation.mjs`는 이 역할들을 기본 공통값과 다르게 바꾸어 다시 생성·패키징한 뒤 같은 검사를 실행한다. 모든 Node/npm 명령은 `docker exec kjun_ui_dev ...`로 실행한다.

`definitions/sizing.json`은 Spinner·Progress, 아이콘, Skeleton, 금융·시장·KPI 로딩 표시, 메뉴·Tooltip·Drawer와 닫기 컨트롤의 크기를 소유한다. Vue의 크기 유틸리티는 이 역할에서 생성하며, 버튼 높이도 간격 유틸리티와 분리한다. 새 절대 치수는 용도에 맞는 역할을 추가하거나 기존 역할을 참조한다.

`scripts/size-token-audit.mjs`와 `tests/size-tokens.test.mjs`는 전체 패키지 및 공유 런타임을 재귀 검사한다. 스타일·JSX·Vue 속성, 기본값·별칭·조건부·계산식·Skeleton 도우미·크기 유틸리티를 확인한다. SVG viewBox 내부 도형, %, em/ch/lh, 실측값, 접근성 숨김 박스와 Slider 측정 전 분모 보호는 크기 역할 대상과 구분한다. 정적 검사는 임의의 데이터 흐름을 증명하지 않으므로 `tests/browser/size-contracts.spec.ts`와 원본 변경 실험을 함께 실행한다. 플랫폼별 미적용 경로는 `scripts/token-consumption.mjs`에서 실제 렌더링 차이와 함께 명시한다.
