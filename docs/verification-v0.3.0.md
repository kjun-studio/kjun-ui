# v0.3.0 검증 기록

2026-10-08, `kjun_ui_dev` Docker 컨테이너에서 로컬 산출물로 검증했습니다. Native 검증 범위는 React Native Web이며 iOS·Android 기기 검증은 수행하지 않았습니다.

## 범위

- 공개 컴포넌트와 내부 구현 전체의 카탈로그·API·문서·예제 연결
- 다섯 패키지(icons, tokens, vue2, react, native)의 빌드와 로컬 패키징
- packed `.tgz`를 설치한 독립 소비 환경과 문서 앱

## 검증 결과

| 검증 | 결과 |
|---|---|
| tokens:generate · tokens:check | 생성된 계약·역할 연결·문서 자료 일치 |
| 전체 `npm run build` | 패키지 빌드, catalog:check, 로컬 패키징, 문서 생성·검사, typecheck, 독립 소비 검증, 프리뷰와 문서 빌드 통과 |
| 단위 테스트 `npm test` | 183개 통과 |
| 문서 coverage·catalog 브라우저 검사 | 17개 통과 |

공개 컴포넌트 77개는 이 기록을 검증 근거로 사용합니다. 전체 브라우저 테스트(`test:browser:full`, `test:docs:full`)는 이 기록에서 실행하지 않았습니다.
