// KjunSideNavigationLayout fixture: a short menu beside a tall page.
export const layoutItems = [
  { key: 'home', label: '홈', href: '#home', icon: 'home' },
  { key: 'activity', label: '활동', href: '#activity', icon: 'list', badge: 3, badgeTone: 'neutral' },
  { title: '문서', items: [{ key: 'projects', label: '프로젝트', href: '#projects', icon: 'folder' }, { key: 'archive', label: '보관함', href: '#archive', icon: 'box' }] },
];
const query = new URLSearchParams(location.search);
/** collapsed=1 starts narrow; labels=1 railLabels; width=sm|lg; static=1 sticky={false}; drawer=1 a breakpoint above any viewport;
 * wide=1 breakpoint 0 (always a column). Otherwise the default breakpoint (768). */
export const layoutCase = { collapsed: query.has('collapsed'), labels: query.has('labels'), width: (query.get('width') || 'md') as 'sm' | 'md' | 'lg',
  sticky: !query.has('static'), breakpoint: query.has('drawer') ? 100000 : query.has('wide') ? 0 : undefined };
