import { parseTerms } from './terms.mjs';
export const special = parseTerms(`
1x=일 배속|2fa=이중 인증|2g=이세대 이동통신|2k=이케이 해상도|2x=이 배속|3d=삼차원|3g=삼세대 이동통신|3k=삼케이 해상도|3x3=삼 곱하기 삼|4g=사세대 이동통신|4k=사케이 해상도|4wd=사륜구동|4x4=사 곱하기 사|5g=오세대 이동통신|5k=오케이 해상도|5x=오 배속|6g=육세대 이동통신|8k=팔케이 해상도
al=알|ar=증강 현실|bmp=비트맵|cc=폐쇄 자막|ce=유럽 적합성 인증|css=스타일시트|csv=쉼표 구분 데이터|ctg=코탄젠트|cv=이력서|doc=워드 문서|docx=워드 문서|gif=움직이는 이미지|hd=고화질|hdr=고명암비|html=웹 문서|http=웹 통신|husd=후오비 달러|isr=증분 정적 재생성|jpg=제이피지 이미지|js=자바스크립트|json=제이슨 데이터|jsx=자바스크립트 문법 확장
lte=엘티이 이동통신|ltr=왼쪽에서 오른쪽|lyd=리비아 디나르|nc=비영리|nd=변경 금지|ne=북동쪽|nw=북서쪽|pc=개인용 컴퓨터|pdf=피디에프 문서|php=피에이치피|png=피엔지 이미지|ppf=생산 가능 곡선|ppt=발표 문서|que=요청 대기열|rs=러스트|rtl=오른쪽에서 왼쪽|rv=캠핑카|sa=동일 조건 변경 허락|sd=표준 화질|sdk=개발 도구 모음|se=남동쪽|sql=구조화 질의 언어|svg=벡터 이미지|sw=남서쪽
tac=택|tex=텍 수식 문서|tg=탄젠트|tic=틱|tir=국제 도로 운송|tm=상표|toml=톰엘 설정 파일|ts=타입스크립트|tsx=타입스크립트 문법 확장|txt=텍스트 파일|uhd=초고화질|usb=유에스비|uv=자외선|ux=사용자 경험|vo=원어 음성|vr=가상 현실|vs=대결|vue=뷰|wc=화장실|wrrr=으르렁|www=월드 와이드 웹|xd=엑스디|xls=엑셀 문서|xml=엑스엠엘 문서|xxx=성인용|xy=엑스 와이
`);

// Whole-name overrides preserve natural meaning where word-by-word composition
// would be ambiguous (currency, formulas, sports and conventional UI labels).
export const phrases = {
  'ball-american-football': '미식축구공', 'ball-football': '축구공', 'ball-football-off': '축구공 비활성',
  'building-burj-al-arab': '부르즈 알 아랍 호텔', 'tic-tac': '틱택토 게임', 'air-conditioning': '에어컨',
  'air-conditioning-disabled': '에어컨 비활성', 'air-balloon': '열기구', 'first-aid-kit': '구급상자',
  'ice-cream': '아이스크림', 'ice-cream-2': '아이스크림 2', 'ice-cream-off': '아이스크림 비활성',
  'flip-flops': '슬리퍼', 'world-www': '월드 와이드 웹', 'device-sd-card': '에스디 메모리 카드',
  'file-type-rs': '러스트 소스 파일', 'file-isr': '증분 정적 재생성 파일', 'chart-ppf': '생산 가능 곡선 차트',
  'http-que': '웹 요청 대기열', 'http-que-off': '웹 요청 대기열 비활성', 'credit-card': '신용카드',
  'bread': '식빵', 'butterfly': '나비', 'medical-cross': '의료 십자', 'medical-cross-off': '의료 십자 비활성',
  'accessible': '접근성 사람', 'accessible-off': '접근성 비활성',
  'disabled': '휠체어 이용자', 'guitar-pick': '기타 피크', 'square-root': '제곱근',
  'shoe': '신발', 'shoe-off': '신발 비활성', 'brand-open-source': '오픈 소스', 'brand-days-counter': '디데이 카운터',
  'a-b': '에이비 비교 테스트', 'access-point': '무선 접속 지점',
  'heart-rate-monitor': '심박수 측정기', 'device-heart-monitor': '심전도 모니터',
  'device-remote': '리모컨', 'device-airpods-case': '에어팟 충전 케이스', 'device-vision-pro': '비전 프로',
  'device-computer-camera': '웹캠', 'device-landline-phone': '유선 전화기',
  'currency-real': '브라질 헤알', 'currency-ripple': '리플', 'currency-bahraini': '바레인 디나르',
  'currency-krone-czech': '체코 코루나', 'currency-dollar-australian': '호주 달러',
  'currency-dollar-canadian': '캐나다 달러', 'currency-dollar-brunei': '브루나이 달러',
  'currency-dollar-guyanese': '가이아나 달러', 'currency-dollar-singapore': '싱가포르 달러',
  'currency-dollar-zimbabwean': '짐바브웨 달러', 'currency-krone-danish': '덴마크 크로네',
  'currency-krone-swedish': '스웨덴 크로나', 'currency-rupee-nepalese': '네팔 루피',
  'http-head': '웹 헤더 조회 요청', 'http-get': '웹 데이터 조회 요청', 'http-post': '웹 데이터 전송 요청',
  'http-put': '웹 데이터 대체 요청', 'http-patch': '웹 데이터 부분 수정 요청',
  'http-options': '웹 요청 옵션 조회', 'http-connect': '웹 터널 연결 요청', 'http-trace': '웹 요청 경로 추적',
  'http-delete': '웹 데이터 삭제 요청', 'math-lower': '작다 부등호', 'math-equal-lower': '작거나 같다 부등호',
  'math-greater': '크다 부등호', 'math-equal-greater': '크거나 같다 부등호',
  'math-x-floor-divide-y': '엑스 와이 정수 나눗셈',
  'relation-one-to-one': '일대일 관계', 'relation-one-to-many': '일대다 관계', 'relation-many-to-many': '다대다 관계',
  'building-eiffel-tower': '에펠탑', 'building-carousel': '회전목마', 'solar-panel': '태양광 패널',
  'augmented-reality': '증강 현실', 'air-traffic-control': '항공 교통 관제',
  'exchange': '양방향 교환', 'maximize': '화면 최대화', 'minimize': '화면 최소화',
  'forbid': '금지 표지', 'brand-cake': '케이크 브랜드', 'brand-sketch': '스케치 브랜드',
  'circle-dashed-x': '원형 파선 닫기', 'coin': '단일 동전', 'txt': '텍스트 문서 형식',
  'file-type-doc': '워드 문서 형식 DOC', 'file-type-docx': '워드 문서 형식 DOCX',
  'gender-agender': '에이젠더', 'gender-genderless': '성별 없음', 'help': '도움말 물음표',
  'layout-align-center': '가로 가운데 정렬', 'layout-align-middle': '세로 가운데 정렬',
  'menu': '세 줄 메뉴', 'navigation-top': '상단 탐색', 'navigation-up': '위쪽 탐색',
  'solar-electricity': '태양광 전기', 'sun-electricity': '태양과 전기',
  'square-x': '사각형 닫기', 'square-rounded-x': '둥근 사각형 닫기', 'ticket': '입장권',
  'toggle-left': '왼쪽 토글 스위치', 'toggle-right': '오른쪽 토글 스위치',
  'transition-left': '왼쪽 화면 전환', 'transition-right': '오른쪽 화면 전환',
  'car-fan': '자동차 송풍기', 'tools-kitchen': '주방 도구', 'chart-pie': '원형 차트',
  'player-track-next': '다음 트랙 재생', 'player-track-prev': '이전 트랙 재생',
};
