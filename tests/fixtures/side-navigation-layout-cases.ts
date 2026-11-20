// KjunSideNavigationLayout fixture: a short menu beside a tall page.
export const layoutItems = [
  { key: 'home', label: '홈', href: '#home', icon: 'home' },
  { key: 'activity', label: '활동', href: '#activity', icon: 'list', badge: 3, badgeTone: 'neutral' },
  { title: '문서', items: [{ key: 'projects', label: '프로젝트', href: '#projects', icon: 'folder' }, { key: 'archive', label: '보관함', href: '#archive', icon: 'box' }] },
];
const query = new URLSearchParams(location.search);
/** collapsed=1 starts narrow; labels=1 railLabels; width=sm|lg; static=1 sticky={false}; drawer=1 a breakpoint above any viewport;
 * wide=1 breakpoint 0 (always a column). Otherwise the default breakpoint (768). rail=1 railBreakpoint 1000; offset=1 stickyOffset 56. */
export const layoutCase = { collapsed: query.has('collapsed'), labels: query.has('labels'), width: (query.get('width') || 'md') as 'sm' | 'md' | 'lg',
  sticky: !query.has('static'), breakpoint: query.has('drawer') ? 100000 : query.has('wide') ? 0 : undefined,
  railBreakpoint: query.has('rail') ? 1000 : 0, stickyOffset: query.has('offset') ? 56 : 0 };
/** spaces=1 a spaces rail before the menu panel; flat=1 panelSurface flat; closed=1 panelCollapsed from the start;
 * title=long a long space name, title=none none, title=empty an empty string; collapsed, labels and width still pass through (they do not apply). */
export const spacesCase = { on: query.has('spaces'), surface: (query.has('flat') ? 'flat' : 'card') as 'card' | 'flat', closed: query.has('closed'),
  title: query.get('title') === 'none' ? undefined : query.get('title') === 'empty' ? '' : query.get('title') === 'long' ? '아주 긴 이름을 가진 디자인 시스템 프로젝트 공간' : '프로젝트' };
export const spaceItems = [
  { key: 'home', label: '홈', href: '#s-home', icon: 'home' }, { key: 'projects', label: '프로젝트', href: '#s-projects', icon: 'folder' },
  { key: 'team', label: '팀', href: '#s-team', icon: 'building', badge: true },
];
/** The panel's menu, with a parent so a test can see its open state survive a collapse. */
export const panelItems = [
  { key: 'board', label: '보드', href: '#board', icon: 'clipboard-list' },
  { title: '즐겨찾기', items: [{ key: 'brand', label: '브랜드 웹사이트', href: '#brand', icon: 'world' },
    { key: 'docs', label: '문서', icon: 'file-text', children: [{ key: 'guide', label: '가이드', href: '#guide' }, { key: 'api', label: 'API', href: '#api' }] }] },
];
