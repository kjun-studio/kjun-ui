import { demoPalettes } from '../../shared/demo-colors';
import { cssValues } from './style-values';
export const popoverColors = demoPalettes[(new URLSearchParams(location.search).get('palette') || 'default') as keyof typeof demoPalettes];
export const popoverConfig = { placement: 'bottom', noPadding: false, matchTriggerWidth: false, maxHeight: 400, text: '부가 내용을 확인하세요.', left: 300, top: 160, width: 160 };
export function setupPopoverColors() {
  for (const [name, value] of Object.entries(cssValues(popoverColors, 'Arial'))) document.documentElement.style.setProperty(name, value);
  document.body.style.margin = '0';
  document.body.style.background = popoverColors.background;
}
