// Shared by the React/Native cases and the Vue 3 mirror. Box widths are the containers KjunTiles is measured in.
export const projects = ['모바일 앱 리뉴얼', '파트너 대시보드', '온보딩 개선', '알림 설정', '검색 고도화', '디자인 시스템 이전', '접근성 점검'];
/** One body runs several lines, so its row is taller than the others. */
export const body = (i: number) => i === 1 ? '정산 리포트, 기간 필터, 내보내기, 권한별 화면 분리까지 포함한 2차 범위입니다. 문장이 길어 이 카드만 높습니다.' : '진행 중';
/** Two cards side by side inside a tile card: different titles, so their own widths differ. */
export const nested = ['짧음', '조금 더 긴 카드 제목'];
export const widths = { w320: 320, w560: 560, w800: 800, w1100: 1100 } as const;
/** An app element that is not a KjunCard: its own fill, one of them taller. A minimum, not a fixed height, so a cell can stretch it. */
export const appBox = (tall: boolean) => ({ background: '#dde3ea', minHeight: tall ? 120 : 40 });
