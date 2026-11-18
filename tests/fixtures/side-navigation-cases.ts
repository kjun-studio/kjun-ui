// A workspace sidebar: loose destinations, a titled group with a parent and its children, loose items after it, and a second group.
// "브랜드 웹사이트" carries an icon (children draw none) and a dot (its closed parent shows one); "도움말" opens in a new tab.
export const sideItems = [
  { key: 'home', label: '홈', href: '#home', icon: 'home' },
  { key: 'tasks', label: '할 일', href: '#tasks', icon: 'checklist', badge: 12 },
  { title: '문서', icon: 'file-text', items: [
    { key: 'projects', label: '프로젝트', icon: 'folder', children: [
      { key: 'brand', label: '브랜드 웹사이트', href: '#brand', icon: 'world', badge: true },
      { key: 'checkout', label: '결제 화면 개선', href: '#checkout' },
    ] },
    { key: 'archive', label: '아주 긴 이름을 가진 프로젝트 문서 보관함', href: '#archive', icon: 'box' },
  ] },
  { key: 'help', label: '도움말', href: 'https://example.com/help', icon: 'help-circle', target: '_blank' },
  { title: '관리', icon: 'adjustments', items: [
    { key: 'settings', label: '설정', href: '#settings', icon: 'settings' },
    { key: 'billing', label: '결제', href: '#billing', icon: 'wallet', disabled: true },
  ] },
];
const query = new URLSearchParams(location.search);
// actions=1 gives "보관함" two row actions and "관리" a title action; pergroup=1 opens "문서" by default and keeps "관리" always open.
if (query.has('actions')) {
  (sideItems[2] as any).items[1].actions = [{ key: 'new', icon: 'plus', label: '새 문서' }, { key: 'more', icon: 'dots', label: '더 보기' }];
  (sideItems[4] as any).action = { key: 'add', icon: 'plus', label: '관리 항목 추가' };
}
if (query.has('pergroup')) { (sideItems[2] as any).defaultOpen = true; (sideItems[4] as any).collapsible = false; }
// tones=1 makes "할 일"'s count a neutral total; nested=1 gives "프로젝트" a second-level parent "디자인" with two pages;
// limit=1 shows only the first row of "문서" and a "1개 더 보기" row; shortlabels=1 gives the long archive a short rail name.
if (query.has('tones')) (sideItems[1] as any).badgeTone = 'neutral';
if (query.has('nested')) (sideItems[2] as any).items[0].children.push({ key: 'design', label: '디자인', children: [
  { key: 'tokens', label: '토큰', href: '#tokens' }, { key: 'icons', label: '아이콘', href: '#icons', badge: 2, badgeTone: 'neutral' }] });
if (query.has('limit')) (sideItems[2] as any).limit = 1;
if (query.has('shortlabels')) { (sideItems[2] as any).items[1].shortLabel = '보관함'; (sideItems[2] as any).shortTitle = '문서함'; }
// disabledparent=1 disables the "프로젝트" parent.
if (query.has('disabledparent')) (sideItems[2] as any).items[0].disabled = true;
// empty=1 adds a group "즐겨찾기" with no rows and its empty line.
if (query.has('empty')) sideItems.push({ title: '즐겨찾기', icon: 'star', items: [], empty: '즐겨찾기한 문서가 없습니다' } as any);
export const sideStart = query.get('value') || 'home';
/** collapsed=1 starts with icons only; controlled=1 passes expanded; late=1 hands the items over after the first render;
 * groups=1 turns on collapsibleGroups; rail=groups shows one icon per group while collapsed; labels=1 turns on railLabels;
 * compact=1 sets density="compact". */
export const sideCase = { collapsed: query.has('collapsed'), controlled: query.has('controlled'), late: query.has('late'),
  groups: query.has('groups'), rail: (query.get('rail') || 'items') as 'items' | 'groups', labels: query.has('labels'),
  density: (query.has('compact') ? 'compact' : 'default') as 'default' | 'compact',
  /** counts=1 groupCounts; flyout=1 collapsedParent="flyout"; chrome=1 a header, a footer and the collapse toggle;
   * link=1 renders links with a stand-in router link; short=1 gives the column a fixed height that scrolls. */
  counts: query.has('counts'), flyout: query.has('flyout'), chrome: query.has('chrome'), link: query.has('link'), short: query.has('short') };
export const sideWidth = (collapsed: boolean) => collapsed ? sideCase.labels ? 88 : 64 : 240;
/** The aside around the menu: a fixed, scrolling height for short=1 and chrome=1. */
export const sideColumn = (collapsed: boolean) => ({ width: sideWidth(collapsed) + 'px', ...(sideCase.short || sideCase.chrome ? { height: '260px', overflowY: 'auto' as const } : {}),
  ...(sideCase.chrome ? { display: 'flex', flexDirection: 'column' as const } : {}) });
