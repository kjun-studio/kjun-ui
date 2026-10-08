import { demoPalettes } from '../../shared/demo-colors';
import { cssValues } from './style-values';
export const actionBarColors = demoPalettes[(new URLSearchParams(location.search).get('palette') || 'default') as keyof typeof demoPalettes];
export const actionBarConfig = {
  width: 390, description: '저장하면 모든 기기에 적용됩니다.', direct: false,
  showCancel: true, showConfirm: true, disabled: false, loading: false,
  safeAreaBottom: 0, keyboardVisible: false, hideOnKeyboard: false, variant: 'primary',
};
export function setupActionBarColors() {
  for (const [name, value] of Object.entries(cssValues(actionBarColors, 'Arial'))) document.documentElement.style.setProperty(name, value);
  document.body.style.margin = '0';
  document.body.style.background = actionBarColors.background;
}
