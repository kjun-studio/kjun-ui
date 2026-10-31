import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { setDropdownColors } from './dropdown-design-cases';
import { structureConfig } from './dropdown-structure-cases';
setDropdownColors();
const state = reactive({ config: { ...structureConfig }, sort: 'name', hidden: true, last: '' });
Object.assign(window, { configureStructure: (next: object) => { state.config = { ...state.config, ...next }; } });
const press = (label: string, run = () => {}) => ({ onClick: () => { run(); state.last = label; } });
createApp(defineComponent(() => () => (
  <K.KjunProvider>{{ default: () => (
    <div style={{ padding: '24px' }}>
      <K.KjunDropdown density={state.config.density}>{{
        trigger: () => <K.KjunButton variant="secondary">구조 메뉴</K.KjunButton>,
        default: () => [
          <K.KjunDropdownSection title="정렬">{{ default: () => [
            <K.KjunDropdownItem selected={state.sort === 'name'} {...press('이름순', () => { state.sort = 'name'; })}>이름순</K.KjunDropdownItem>,
            <K.KjunDropdownItem selected={state.sort === 'date'} {...press('날짜순', () => { state.sort = 'date'; })}>날짜순</K.KjunDropdownItem>,
          ] }}</K.KjunDropdownSection>,
          <K.KjunDropdownDivider />,
          <K.KjunDropdownItem checked={state.hidden} description="보관한 항목 포함" shortcut="⌘H" {...press('숨긴 항목 보기', () => { state.hidden = !state.hidden; })}>숨긴 항목 보기</K.KjunDropdownItem>,
          <K.KjunDropdownSubmenu label="공유" icon="send">{{ default: () => [
            <K.KjunDropdownItem icon="link" shortcut="⌘L" {...press('링크 복사')}>링크 복사</K.KjunDropdownItem>,
            <K.KjunDropdownItem icon="mail" {...press('이메일로 보내기')}>이메일로 보내기</K.KjunDropdownItem>,
          ] }}</K.KjunDropdownSubmenu>,
          <K.KjunDropdownItem variant="danger" icon="trash" {...press('삭제')}>삭제</K.KjunDropdownItem>,
        ],
      }}</K.KjunDropdown>
      <span data-testid="last" style={{ display: 'none' }}>{state.last}</span>
    </div>
  ) }}</K.KjunProvider>
))).mount('#root');
