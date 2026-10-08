# 화면 배치와 레이어 Foundation

`/layout`은 최대 폭·페이지 여백·열 전환·스크롤·하단 CTA를, `/elevation`은 기존 그림자·레이어 토큰과 오버레이의 입력 규칙을 설명한다. 수치는 권장 기본값이며 패키지의 새 공개 API가 아니다.

## 유지보수

화면 배치 문서의 구성은 [Montage Grid](https://montage.wanted.co.kr/docs/foundations/base-material/grid)를 참고했다. 표에 사용하는 수치는 `shared/foundation-layout.json`의 KJUN 권장값이다. 그림자는 같은 예시 색상을 적용해 형태를 비교하며, 컴포넌트 실행 예제는 설치된 KJUN 패키지로 렌더링한다.

- `shared/foundation-layout.json`이 화면 배치 권장값의 원본이다. 문서가 직접 읽고 예제 생성기가 세 플랫폼의 복사 코드에 같은 값을 삽입한다.
- `shared/foundation-examples.ts`는 예제 이름·조작 항목·프리셋과 해당 배치 예제의 폭 제한을 관리한다.
- `previews/catalog/example-foundations.ts`는 기존 KJUN 컴포넌트의 화면 조합이다. `previews/templates/foundation-*.txt`의 레이아웃 코드는 이 세 예제에만 포함하며 packed 실행·검증용 산출물에 유지한다. 원칙 문서의 실행 영역에는 코드 복사 UI를 제공하지 않는다.
- Web은 ResizeObserver, Native는 onLayout으로 가용 폭과 하단 영역 높이를 측정한다. 측정값을 복사할 상태에 넣지 않으므로 소비 환경에서 다시 계산한다.
- 일반 예제의 760px 최대 폭은 유지하고 GuideScreenLayout에만 예외를 적용한다. iframe의 실제 가용 폭을 표시하며 축소 배율로 넓은 화면을 모사하지 않는다.
- 문서 그림자·레이어 표는 생성된 기존 토큰을 읽는다. 새 역할이나 제품별 팔레트를 패키지에 추가하지 않는다.

## 화면 배치 문서 구성

`/layout`의 본문·참고 표는 최대 720px, 본문은 16px/28px, 표는 14px/20px로 표시한다. `layout-document.css`와 `DataTable`의 명시적인 `document` 표현을 사용하며 다른 문서의 표나 packed 패키지의 셀 간격·카드 전환은 바꾸지 않는다.

- 콘텐츠 목적에 따른 최대 폭과 가용 폭에 따른 여백을 구분한다. 별도 `#spacing`에서 16·24·32·48px의 실제 간격 견본을 제공한다. 기존 `#width`, `#columns`, `#scroll`, `#cta`, `#platforms` 앵커는 유지한다.
- 한 열·두 열의 읽기 순서와 너비 비율을 구분한다. CTA는 공간을 차지하는 배치를 기본으로 설명하고 겹침 배치·안전 영역·키보드 처리를 소제목으로 나눈다.
- 중복 설명 표를 줄이고 Web 스크롤 CSS는 별도 구현 참고로 유지한다. 관련 구현·컴포넌트 링크는 선택 플랫폼을 유지한다.
- 767px 이하에서는 화면 배치 예제의 폭 조절·넓게 보기 도구를 숨긴다. 열 전환의 넓게 보기는 모달 안에서 실제 1024px를 확보할 수 있는 창 폭 1120px부터 제공한다. 모바일에서는 도식으로 두 열 구성을 안내하며, 실행 예제를 축소하지 않는다.
- 현재 가용 폭은 실행 프레임에서 한 번만 표시한다. 문서 바깥 안내는 현재 배치의 의미와 가능한 다음 행동만 설명한다.
- 확인 항목은 마지막 콘텐츠 도달, 입력·읽기 순서 유지, 긴 CTA, 키보드, 안전 영역 중복 여부로 정리한다. 기기 키보드는 기존처럼 모의 상태다.

## 검증

모든 Node/npm 명령은 `kjun_ui_dev`에서 실행한다.

```sh
docker exec kjun_ui_dev npm run build
docker exec kjun_ui_dev npm test
docker exec kjun_ui_dev npx playwright test tests/browser/foundations.spec.ts
```

Foundation 상호작용 검사는 최신 packed 정적 예제를 별도 임시 HTTP 서버에서 읽는다. 문서 경로 검사는 `KJUN_TEST_URL` 또는 기본 `http://127.0.0.1:4173`의 최신 문서 서버가 필요하다.

검사 범위는 320·375px, 767/768·1023/1024·1199/1200px, 1440px, 입력값과 읽기 순서, 720px 읽기 폭, 두 CTA 배치의 높이 재계산, 안전 영역 한 번 적용, 모달 배경 입력 제한·본문 스크롤·Toast 행동·포커스 복귀, 복사 코드 독립 실행, 실제 Chromium 200% 확대다.

Native Web 결과는 iOS·Android 기기 검증이 아니다. 안전 영역과 키보드 상태는 앱이 제공하는 입력을 모의 적용한다. 실제 기기의 키보드 회피·접근성·뒤로 가기는 별도로 검증한다.

### 2026-09-26 화면 배치 문서 검증

- Docker에서 문서 생성·정합성 검사, packed 의존성 검사, 타입 검사와 문서 앱 빌드를 통과했다. 문서 탐색 단위 검사 3개도 통과했다.
- `docs-layout.spec.ts`, `docs-layout-controls.spec.ts`, `layout-document.spec.ts`의 18개 브라우저 검사를 분할 실행해 모두 통과했다. 320·390·1280·1440px, 실제 Chromium 200% 확대, 세 플랫폼 입력 유지·열 전환·CTA 설정, 기존 앵커·뒤로 가기·플랫폼 보존 링크와 Popover 회귀를 확인했다.
- 본문 16px/28px, 표 14px/20px, 최대 폭 720px와 왼쪽 정렬, 실제 간격 견본, 동일한 CTA 도식 높이, 다른 문서 표의 기존 표현을 검사했다. 1119/1120px의 넓게 보기 제공 경계도 확인했다.
- 동시 작업의 빌드가 `dist`를 교체해 HTML과 자산이 어긋나는 것을 피하도록 완성된 빌드를 컨테이너의 별도 임시 디렉터리로 복사해 검증했다. 로컬 4173 서버도 이 완성본으로 재시작하고 HTML·CSS·JavaScript 12개 자산의 정상 응답과 실제 화면·예제 로딩을 확인했다.
- 동시 빌드 부하로 제한 시간에 도달한 세 플랫폼 연속 확대·Native Popover 검사는 전체 실행 시간을 늘려 재검증했다. 확인 항목은 유지했으며 Native 실제 기기 검증이나 외부 배포는 수행하지 않았다.

### 2026-09-14 검증 결과

| 검사 | 결과 |
| --- | --- |
| 전체 `npm run build` | 통과: 타입 검사, 패키지 4개 설치, 복사 예제 636개, 비교 예제 1,166개, 문서 빌드 포함 |
| `npm test` | 41개 통과 |
| Foundation 브라우저 검사 | 11개 통과: 세 플랫폼 배치·CTA·Modal/Toast, 실제 200% 확대, 문서 연결 |
| 기존 문서 회귀 검사 | 25개 통과: 스타일 12개, 플랫폼 선택 11개, 검색·모바일 탐색 2개 |
| 화면 확인 | 문서 데스크톱·모바일, 두 열 배치, 긴 CTA, Vue Modal/Toast 확인 |

Docker 바인드 마운트에서 간헐적으로 잘린 파일이 읽혀, 동일한 `kjun_ui_dev` 내부의 `/tmp/kjun-foundation-verify.AXkhFw`에 작업 복사본을 만들고 검증했다. Foundation 관련 소스·연결 파일 22개의 SHA-256이 작업 폴더와 일치함을 확인했다. 최종 빌드를 로컬 4173 포트에서 실행한 뒤 두 경로의 HTTP 200과 문서 경로·목차·검색·넓게 보기 검사를 다시 확인했다.

빌드에는 번들 크기와 vinext 정적 경로 분류 안내가 남아 있다. Native 실제 기기는 검증하지 않았다.
