import { demoPalettes } from '../../shared/demo-colors';
import { cssValues } from './style-values';
export const navigationColors = demoPalettes[(new URLSearchParams(location.search).get('palette') || 'default') as keyof typeof demoPalettes];
export const navigationConfig = { value: 'home', badge: 3 as string | number | null, icons: true, mixed: false, long: false, count: 3, safeAreaBottom: 0, keyboardVisible: false, hideOnKeyboard: true, acceptNavigation: true };
export function navigationItems(config: typeof navigationConfig) {
  return [
    { key: 'home', label: '홈', href: '#home', icon: 'home' },
    { key: 'activity', label: config.long ? '모든 프로젝트 활동 내역' : '활동', href: '#activity', icon: config.mixed ? undefined : 'list', badge: config.badge },
    { key: 'settings', label: '설정', href: '#settings', icon: 'settings', disabled: true },
    { key: 'archive', label: '보관', href: '#archive', icon: 'list' },
    { key: 'more', label: '추가', href: '#more', icon: 'settings' },
  ].slice(0, config.count).map(item => ({ ...item, icon: config.icons ? item.icon : undefined, badge: item.badge ?? undefined }));
}
export function setupNavigationColors() {
  for (const [name, value] of Object.entries(cssValues(navigationColors, 'Arial'))) document.documentElement.style.setProperty(name, value);
  document.body.style.margin = '0';
  document.body.style.background = navigationColors.background;
}
