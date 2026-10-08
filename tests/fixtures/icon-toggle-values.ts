import { setRootValues } from './style-values';
import { domainColorRoles, type KjunDomainColors } from '@kjun-ui/tokens';
export const domainColors = {
  ...Object.fromEntries(domainColorRoles.map(role => [role, '#445566'])),
  favorite: '#D08812', interest: '#B03368',
} as KjunDomainColors<string>;
export const rows = [{ id: 0, name: '첫 항목' }, { id: 'b', name: '둘째 항목' }];
export const columns = [{ key: 'name', label: '이름', type: 'text' }];
export const initial = {
  active: false, loading: false, disabled: false, size: 'md',
  activeIcon: 'heart', inactiveIcon: 'star',
  favorite: [] as (number | string)[], interest: [] as (number | string)[],
  togglingFavorite: null as number | string | null,
  togglingInterest: null as number | string | null,
};
export function setup() {
  setRootValues();
  for (const [name, color] of Object.entries(domainColors))
    document.documentElement.style.setProperty('--kjun-' + name.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase()), color);
}
