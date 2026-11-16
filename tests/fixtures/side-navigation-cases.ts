// A workspace sidebar: loose destinations, a titled group with a parent and its children, loose items after it, and a second group.
// "브랜드 웹사이트" carries an icon (children draw none) and a dot (its closed parent shows one); "도움말" opens in a new tab.
export const sideItems = [
  { key: 'home', label: '홈', href: '#home', icon: 'home' },
  { key: 'tasks', label: '할 일', href: '#tasks', icon: 'checklist', badge: 12 },
  { title: '문서', items: [
    { key: 'projects', label: '프로젝트', icon: 'folder', children: [
      { key: 'brand', label: '브랜드 웹사이트', href: '#brand', icon: 'world', badge: true },
      { key: 'checkout', label: '결제 화면 개선', href: '#checkout' },
    ] },
    { key: 'archive', label: '아주 긴 이름을 가진 프로젝트 문서 보관함', href: '#archive', icon: 'box' },
  ] },
  { key: 'help', label: '도움말', href: 'https://example.com/help', icon: 'help-circle', target: '_blank' },
  { title: '관리', items: [
    { key: 'settings', label: '설정', href: '#settings', icon: 'settings' },
    { key: 'billing', label: '결제', href: '#billing', icon: 'wallet', disabled: true },
  ] },
];
const query = new URLSearchParams(location.search);
export const sideStart = query.get('value') || 'home';
/** collapsed=1 starts with icons only; controlled=1 passes expanded; late=1 hands the items over after the first render. */
export const sideCase = { collapsed: query.has('collapsed'), controlled: query.has('controlled'), late: query.has('late') };
export const sideWidth = (collapsed: boolean) => collapsed ? 64 : 240;
