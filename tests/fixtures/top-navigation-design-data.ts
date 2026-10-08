import { demoPalettes } from '../../shared/demo-colors';
import { cssValues } from './style-values';
export const topNavigationColors = demoPalettes[(new URLSearchParams(location.search).get('palette') || 'default') as keyof typeof demoPalettes];
export const topNavigationConfig = { title: '프로젝트 설정', description: '변경할 내용을 선택하세요.', leading: true, leadingText: '', actions: true, actionText: '저장', multiple: false, mixed: false, active: false, disabled: false, loading: false, safeAreaTop: 0, variant: 'ghost' };
export function setupTopNavigationColors() {
  for (const [name, value] of Object.entries(cssValues(topNavigationColors, 'Arial'))) document.documentElement.style.setProperty(name, value);
  document.body.style.margin = '0';
  document.body.style.background = topNavigationColors.background;
}
