# 컴포넌트 탐색 유지보수

`/components`는 공개 컴포넌트 80개를 일곱 분류로 탐색하는 갤러리입니다. 상세 URL과 `/catalog`는 유지합니다. 상단 문서 검색은 Cmd/Ctrl+K로도 열며 한국어 동의어·용도·API 항목을 검색합니다.

## 탐색 데이터

- `shared/docs-navigation.json`: 문서 전용 분류, 부모 관계, 동의어와 용도 키워드. 패키지 분류·API와 분리합니다.
- `shared/docs-pages.json`: 일반 문서의 제목·요약·섹션·검색어. `navigation: false`인 보조 문서는 사이드바와 이전·다음 탐색에서 제외하며, 검색과 직접 주소는 유지합니다. 피드백 서비스의 주소와 Foundations 위치를 유지합니다.
- `shared/document-navigation.ts`: 상세 문서의 사용법·디자인·API·접근성 그룹과 사용 가이드 네 주제의 섹션 소유권·주소·검색어를 정의합니다. 생성 색인, 화면, 기존 주소 연결이 이 정의를 공유합니다.
- `scripts/discovery.mjs`: 기존 카탈로그·컴포넌트 가이드·생성 API를 합쳐 `apps/docs/lib/generated/discovery.json`을 생성합니다. 사이드바·breadcrumb·이전/다음·갤러리·검색이 이 색인을 공유합니다.
- `shared/docs-search.mjs`: 이름, 동의어, API, 용도·설명 순으로 검색합니다. API 결과는 `#api`로 연결하고 내부 피드백 이름은 공개 서비스 문서로 연결합니다.

분류 누락·중복, 잘못된 부모, 미구현 문서 목적지, API 앵커 누락과 오래된 색인은 빌드에서 실패합니다. 분류별 개수는 공개 카탈로그에서 계산하며 하위 구성도 개별 카드로 노출합니다.

일반 문서의 `parentPageId`는 컴포넌트의 `parent`와 별개입니다. 사용 가이드 하위 페이지에 진입하면 부모 메뉴가 펼쳐지며 breadcrumb에서 개요로 돌아갈 수 있습니다. 가이드의 23개 기존 섹션은 한 주제에만 속해야 합니다. 상세 문서의 `sectionGroups` 순서도 실제 섹션 순서와 일치해야 합니다.

공개 80개 상세 문서와 피드백 서비스는 상단에 네 그룹 이동을 제공합니다. 본문을 교체하지 않는 앵커이므로 입력값과 코드 펼침 상태가 유지됩니다. 헤더와 이동 메뉴의 실제 높이를 측정해 이동 위치를 맞추며, 상단 이동 메뉴에서 현재 위치를 표시합니다. 전체 사이트에서 오른쪽 목차를 제거하고 본문을 가운데 정렬합니다. 데스크톱 본문 최대 폭은 일반 문서 960px, 소개 800px이며 갤러리는 더 넓은 기존 구성을 유지합니다. 사용 가이드의 이전 `/usage-guide?...#섹션` 주소는 쿼리와 해시를 유지해 해당 주제로 연결됩니다.

문서 내부 링크는 `doc-link.tsx`에서 `useRouter().push`로 클라이언트 이동하므로 이동할 때 문서 셸과 React를 다시 불러오지 않습니다. Vinext 프로덕션 빌드는 `next/link`가 이동 모듈을 축약 전 export 이름으로 불러와 클릭 시 실패하므로 `next/link`는 사용하지 않습니다. 링크는 실제 `href`를 유지해 새 탭 열기·수정키 클릭·브라우저 뒤로 가기를 그대로 지원하며, 같은 문서의 해시·외부·다운로드 링크는 기본 동작을 따릅니다. 펼침 상태는 sessionStorage, 갤러리 조건은 URL에서 복원합니다.

## 전체 지원 현황

`/catalog`는 지원·검증 요약, 검색 가능한 컴포넌트 목록, 설정·피드백 서비스, 검증 기록 순서로 구성합니다. 기존 `#coverage`, `#services`, `#verification` 주소를 유지하며 `#support-summary`에서 요약으로 이동합니다.

지원 상태 배지는 링크 없이 표시하고, `차이·근거`를 펼치면 플랫폼별 `검증 기록 보기`로 이동합니다. `/verification`의 제목은 `검증 기록`이며, 컴포넌트별 접근성 항목의 별도 링크와 문서 검색에서도 찾을 수 있습니다.

`scripts/coverage.mjs`는 카탈로그의 구현·검증 상태와 기록 경로, 가이드의 플랫폼 차이, 탐색 분류·문서 목적지를 합쳐 `apps/docs/lib/generated/coverage.json`을 생성합니다. `docs:generate`·`docs:check`에 포함하며 컴포넌트 누락·중복, 잘못된 상세 문서·API 연결, 없는 기록과 오래된 생성물을 검사합니다. 제공 수와 상태 집계는 전체 공개 카탈로그 기준으로 고정됩니다.

검색은 갤러리와 같은 `searchDocuments`를 사용합니다. 기본은 이름순, 검색 중에는 관련도순입니다. `q`·`category`를 URL에서 복원하고 변경 시 문서 플랫폼과 앵커를 보존합니다. 본문 가용 폭 720px 이상은 고정 헤더 비교표, 미만은 세 플랫폼을 세로로 보여주는 카드입니다. 숨긴 구성은 접근성 탐색에서 제외하며 검색·분류·플랫폼 변경과 화면 폭 전환 중 항목의 펼침 상태를 유지합니다.

검증 원문은 현재 연결된 기록만 `/downloads/verification/`에 바이트 그대로 복사합니다. 제목과 기록일은 원문의 제목·첫 문단에서 읽고, 기록일을 최종 검증일로 해석하지 않습니다. `KjunProvider`·`KjunFeedbackProvider`는 세 플랫폼, `DsFormLayout`은 Native 제공이며 서비스의 제공 여부와 개별 검증 통과를 구분합니다.

생성 데이터와 실패 경로는 `tests/coverage.test.mjs`, URL·검색·분류·펼침·반응형·실제 200% 확대·다운로드는 `tests/browser/coverage.spec.ts`에서 검사합니다.

## 썸네일 생성

`build:thumbnails`가 독립 소비 프로젝트에 설치한 로컬 tarball로 `previews/presentation/`의 촬영 전용 React 구성을 번들합니다. 임시 정적 서버와 Playwright로 촬영하므로 문서 개발 서버가 필요하지 않습니다. 상세 문서의 `previews/catalog/` 조작 예제와 접근성 검사 정의는 촬영 구성과 분리합니다.

공개 80개 컴포넌트는 `registry.mjs`에 빠짐없이 등록합니다. 대표 상태와 부모 조합을 명시하고 데모 안내·관찰 메시지·실험용 행동을 넣지 않습니다. 메뉴와 도움말은 실제 트리거를 조작하고 모달·Drawer는 공개 open 속성으로 엽니다. 자동 자르기나 컴포넌트 CSS 확대 없이 아래 촬영 화면으로 모두 1280×800 PNG를 생성합니다.

| 촬영 유형 | CSS 화면 | 해상도 배율 | 안전 여백 | 컴포넌트 수 |
| --- | --- | --- | --- | --- |
| 작은 요소 (`small`) | 320×200 | 4 | 24px | 24 |
| 입력·메뉴 (`control`) | 512×320 | 2.5 | 24px | 28 |
| 목록·표·큰 구성 (`large`) | 640×400 | 2 | 32px | 28 |

너비가 없는 작은 요소, 240·360px 입력·메뉴, 480·576px 큰 구성을 명시적으로 배정합니다. 복합 가격 행인 Freshness는 360px 입력·메뉴 구성입니다. 배경은 문서 기본 팔레트의 `tertiary` 역할을 사용하고 컴포넌트 색상·크기·간격·반경은 packed 패키지 값을 유지합니다. ButtonGroup은 `md`의 일간·주간·월간 중 주간을 선택하며, Chip은 기본·삭제 가능·비활성 상태를 보여줍니다. AccordionItem은 열린 한 항목, DropdownItem은 선택 항목을 부모 안에 배치합니다. MenuButton은 `compact` 점 세 개 트리거로 Dropdown과 구별합니다. DropdownDivider와 TabPane의 점선은 촬영기가 별도 요소로 추가합니다.

`captureFor(scene)`을 화면·촬영·경계 검사가 공유합니다. 메뉴·툴팁과 촬영 표시선도 같은 안전 여백으로 검사합니다. Modal·Drawer는 실제 소비자 iframe의 위치·크기를 측정해 바깥 여백과 안쪽 대화상자 경계를 각각 검사합니다. 소개 이미지 3개는 기존 640×400·2배·32px 규칙과 배경을 유지합니다.

갤러리 카드는 8:5 비율을 유지합니다. 브라우저 전체가 아닌 갤러리 가용 너비를 기준으로 660px 미만은 한 열, 660px 이상은 두 열, 1000px 이상은 세 열입니다. 대표 이미지의 확대 표현과 실제 크기는 상세 예제에서 확인할 수 있다는 안내를 제공합니다.

컴포넌트 이미지와 manifest는 `apps/docs/public/previews/thumbnails/`, 소개의 목록·폼·데이터 이미지는 `apps/docs/public/previews/overview/`에 생성됩니다. manifest의 `images`와 `overviewImages` 및 기존 URL은 유지합니다. `captureProfiles`와 각 `scenes`의 `captureType`·`capture`·표시선·iframe 조건·경계 관찰 결과를 기록합니다. 패키지 무결성·번들·스타일·폰트·촬영 소스의 변경을 해시로 추적합니다. `thumbnails:check`는 이미지 누락·손상·크기 오류·촬영 조건 불일치·빠진 경계 증거·오래된 캐시를 검출하며, `build:thumbnails`는 이를 재생성합니다. 생성물은 Git에 넣지 않습니다.

소개는 시스템 소개, 공통 규격과 프로젝트의 색상·서체 관리 원칙, 컴포넌트 탐색 순서로 구성합니다. 상단에는 제목·짧은 설명·시작하기와 컴포넌트 보기 링크를 함께 배치하며 선택한 문서 플랫폼을 유지합니다. 목록·폼·데이터 조합 이미지 섹션은 소개에서 제거했으며, 화면 구성 예시는 사용 가이드에서 확인합니다. 기존 조합 이미지 생성과 URL은 유지합니다.

모든 Node/npm 명령은 컨테이너에서 실행합니다.

```sh
docker exec kjun_ui_dev npm run docs:generate
docker exec kjun_ui_dev npm run docs:check
docker exec kjun_ui_dev npm run build
docker exec kjun_ui_dev npm run thumbnails:check
docker exec kjun_ui_dev npm test
docker exec kjun_ui_dev npm run test:browser
```

탐색 상호작용은 `tests/browser/discovery.spec.ts`, 색인·검색 계약은 `tests/discovery.test.mjs`에서 검증합니다. Native 상태는 기존 카탈로그의 Native Web 검증과 실제 기기 미검증을 구분합니다.

상단 이동·주제 분할은 `tests/document-navigation.test.mjs`와 `tests/browser/document-navigation.spec.ts`에서 검증합니다. 아래 수치는 이전 구현 당시의 기록입니다.

## 구현 검증 결과

- 타입 검사, 토큰·카탈로그·탐색 색인 검사, 패키지 빌드·로컬 패키징·독립 소비 검증, packed 예제와 문서 빌드 통과.
- 단위 테스트 17개 통과.
- 로컬 프로덕션 서버에서 브라우저 테스트 61개 검증 완료. 전체 실행에서 60개가 통과했고, 상세 문서 68개와 다운로드를 연속 확인하던 검사는 시간 제한을 초과했습니다. 같은 검증을 독립된 네 탭으로 나눠 재실행한 결과 54.8초에 통과했습니다.
- 신규 탐색 테스트 7개 통과: 전체 카드·이미지·플랫폼 상태, URL 복원과 필터, 이름·동의어·용도·API 검색, 키보드·포커스·한국어 입력, 부모·하위 이동, 모바일 메뉴·이미지 실패, 반응형 열 배치.
- 68개 썸네일의 해시와 제공 상태 확인. 열린 메뉴·모달·도움말·표·하위 구성 및 모바일 화면 시각 검토 완료. 썸네일 누락 시 검사 실패, 복원 후 검사 통과 확인.

테스트는 모두 `kjun_ui_dev`에서 실행했습니다. 문서 링크는 빌드 결과에서도 확인했습니다.

현재 범위와 검증 결과는 [신규 계약](extensions.md)과 [v0.3.0 검증 기록](verification-v0.3.0.md)을 따릅니다. 문서에 남은 날짜별 수치는 당시 이력입니다.
