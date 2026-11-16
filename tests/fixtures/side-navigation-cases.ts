// A workspace sidebar: loose destinations, a titled group with a parent and its children, and a second group.
export const sideItems = [
  { key: 'home', label: '홈', href: '#home', icon: 'home' },
  { key: 'tasks', label: '할 일', href: '#tasks', icon: 'checkbox', badge: 12 },
  { title: '문서', items: [
    { key: 'projects', label: '프로젝트', icon: 'folder', children: [
      { key: 'brand', label: '브랜드 웹사이트', href: '#brand' },
      { key: 'checkout', label: '결제 화면 개선', href: '#checkout' },
    ] },
    { key: 'archive', label: '아주 긴 이름을 가진 프로젝트 문서 보관함', href: '#archive', icon: 'archive' },
  ] },
  { title: '관리', items: [
    { key: 'settings', label: '설정', href: '#settings', icon: 'settings' },
    { key: 'billing', label: '결제', href: '#billing', icon: 'credit-card', disabled: true },
  ] },
];
export const sideStart = new URLSearchParams(location.search).get('value') || 'home';
