import { demoPalettes } from '../../shared/demo-colors';
import { cssValues } from './style-values';
export const tabsColors = demoPalettes[(new URLSearchParams(location.search).get('palette') || 'default') as keyof typeof demoPalettes];
export const tabsConfig = () => ({
  value: 'one', variant: 'underline', density: 'comfortable', width: 360, accept: true,
  items: [
    { name: 'one', label: '개요' },
    { name: 'two', label: '파일', icon: 'file', badge: 12 },
    { name: 'blocked', label: '비활성', disabled: true },
    { name: 'three', label: '활동 기록' },
  ],
});
export function setupTabsColors() {
  for (const [name, value] of Object.entries(cssValues(tabsColors, 'Arial'))) document.documentElement.style.setProperty(name, value);
  document.body.style.margin = '0'; document.body.style.background = tabsColors.background;
}
