import { useLayoutEffect, useState } from 'react';
import { dropdownColors, setDropdownColors } from './dropdown-design-cases';

export const structureConfig = { density: 'comfortable' };
// One menu with every structure part: a titled section of single choices, a toggle with a description and shortcut, a submenu.
export function DropdownStructureCases({ K, native = false }: { K: any; native?: boolean }) {
  const [config, setConfig] = useState(structureConfig);
  const [sort, setSort] = useState('name');
  const [hidden, setHidden] = useState(true), [alerts, setAlerts] = useState(false);
  const [last, setLast] = useState('');
  useLayoutEffect(() => {
    Object.assign(window, { configureStructure: (next: object) => setConfig(c => ({ ...c, ...next })) });
    setDropdownColors();
  }, []);
  const press = (label: string, run = () => {}) => ({ [native ? 'onPress' : 'onClick']: () => { run(); setLast(label); } });
  return <K.KjunProvider {...(native ? { colors: dropdownColors, fontFamily: 'sans-serif' } : {})}>
    <div style={{ padding: 24 }}>
      <K.KjunDropdown density={config.density} trigger={<K.KjunButton variant="secondary">구조 메뉴</K.KjunButton>}>
        <K.KjunDropdownSection title="정렬">
          <K.KjunDropdownItem selected={sort === 'name'} {...press('이름순', () => setSort('name'))}>이름순</K.KjunDropdownItem>
          <K.KjunDropdownItem selected={sort === 'date'} {...press('날짜순', () => setSort('date'))}>날짜순</K.KjunDropdownItem>
        </K.KjunDropdownSection>
        <K.KjunDropdownDivider />
        <K.KjunDropdownItem checked={hidden} description="보관한 항목 포함" shortcut="⌘H" {...press('숨긴 항목 보기', () => setHidden(v => !v))}>숨긴 항목 보기</K.KjunDropdownItem>
        <K.KjunDropdownItem checked={alerts} keepOpen {...press('알림 받기', () => setAlerts(v => !v))}>알림 받기</K.KjunDropdownItem>
        <K.KjunDropdownSection ariaLabel="더 보기">
          <K.KjunDropdownSubmenu label="내보내기">
            <K.KjunDropdownItem {...press('PDF')}>PDF</K.KjunDropdownItem>
          </K.KjunDropdownSubmenu>
        </K.KjunDropdownSection>
        <K.KjunDropdownSubmenu label="공유" icon="send">
          <K.KjunDropdownItem icon="link" shortcut="⌘L" {...press('링크 복사')}>링크 복사</K.KjunDropdownItem>
          <K.KjunDropdownItem icon="mail" {...press('이메일로 보내기')}>이메일로 보내기</K.KjunDropdownItem>
        </K.KjunDropdownSubmenu>
        <K.KjunDropdownItem variant="danger" icon="trash" {...press('삭제')}>삭제</K.KjunDropdownItem>
      </K.KjunDropdown>
      <span data-testid="last" style={{ display: 'none' }}>{last}</span>
    </div>
  </K.KjunProvider>;
}
