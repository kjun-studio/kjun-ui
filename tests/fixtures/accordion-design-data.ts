import { demoPalettes } from '../../shared/demo-colors';
import { cssValues } from './style-values';
export const accordionColors = demoPalettes[(new URLSearchParams(location.search).get('palette') || 'default') as keyof typeof demoPalettes];
export const accordionBody = '이 계정에서 사용할 기본 정보를 확인하고 변경할 수 있습니다.';
export const accordionConfig = { title: '계정 설정', body: accordionBody, tone: 'card', multiple: false, disabled: false, action: false };
export function setupAccordionColors() {
  for (const [name, value] of Object.entries(cssValues(accordionColors, 'Arial'))) document.documentElement.style.setProperty(name, value);
  document.body.style.margin = '0'; document.body.style.background = accordionColors.background;
}
