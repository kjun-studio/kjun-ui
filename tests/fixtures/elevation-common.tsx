import { demoPalettes } from '../../shared/demo-colors';
import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { cssPalette, palette, demoFont } from './typography-values';
export function mountElevation(K: any, native: boolean) {
  cssPalette();
  const colors = new URLSearchParams(location.search).get('palette') === 'dark' ? demoPalettes.dark : demoPalettes.default;
  for (const [role, value] of Object.entries(colors)) document.documentElement.style.setProperty('--kjun-' + role.replace(/[A-Z]/g, c => '-' + c.toLowerCase()), value);
  document.body.style.background = colors.background;
  document.body.style.color = colors.text;
  function Cases() {
    const [parent, setParent] = useState(false), [child, setChild] = useState(false), [drawer, setDrawer] = useState(false);
    const [popup, setPopup] = useState(false), [select, setSelect] = useState(false), [keep, setKeep] = useState(false);
    const [present, setPresent] = useState(true), [trigger, setTrigger] = useState(true), [actions, setActions] = useState(0), [closes, setCloses] = useState(0);
    const [escape, setEscape] = useState(true);
    const feedback = K.useKjunFeedback();
    const button = (label: string, action?: () => void) => h(K.DsButton, { [native ? 'onPress' : 'onClick']: action, variant: 'secondary' }, label);
    const popupChange = (value: boolean) => { if (!value) setCloses(n => n + 1); if (value || !keep) setPopup(value); };
    Object.assign(window, { elevation: { openWindow: () => setChild(true), openParent: () => setParent(true), closeWindow: () => setChild(false), escape: setEscape, acknowledge: () => { setPopup(false); setSelect(false); },
      delay: () => setKeep(true), removeTrigger: () => setTrigger(false), unmount: () => setPresent(false),
      reopen: () => { setChild(false); setTimeout(() => setChild(true), 30); },
      toast: (duration = 0) => feedback.toast.info('진행 상태 알림', { duration, action: { label: '알림 행동', onClick: () => setActions(n => n + 1) } }),
    } });
    const pop = (label: string, controlled = false) => h(K.DsPopover, { ariaLabel: label + ' 내용',
      ...(controlled ? { open: popup, onOpenChange: popupChange } : {}), trigger: button(label) },
      h('div', null, button('새 창 열기', () => setChild(true)), button('팝업 행동', () => setActions(n => n + 1))));
    return h('div', { style: { padding: 16, display: 'grid', gap: 16 } },
      h('div', { 'data-testid': 'flat' }, h(K.DsCard, { title: '기본 표면', border: true }, button('카드 내부 행동', () => setActions(n => n + 1)))),
      h('div', { 'data-testid': 'raised' }, h(K.DsCard, { title: '분리된 표면', elevation: 'raised' }, '분리된 내용')),
      trigger && pop('화면 팝업', true),
      h(K.DsSelect, { ariaLabel: '화면 선택', value: 'a', options: [{ value: 'a', label: '첫 옵션' }, { value: 'b', label: '둘째 옵션' }], open: select, onOpenChange: (v: boolean) => { if (v || !keep) setSelect(v); if (!v) setCloses(n => n + 1); } }),
      h(K.DsDropdown, { trigger: button('화면 메뉴') }, h(K.DsDropdownItem, { [native ? 'onPress' : 'onClick']: () => setChild(true) }, '메뉴에서 새 창')),
      h(K.DsCombobox, { ariaLabel: '화면 자동완성', value: null, options: ['자동완성 후보'] }),
      h(K.DsSearchInput, { ariaLabel: '화면 검색 제안', value: '', minChars: 0, debounce: 0, loadOptions: async () => [{ id: 'result', name: '검색 후보' }] }),
      button('상위 창 열기', () => setParent(true)), button('패널 열기', () => setDrawer(true)),
      h(K.DsTooltip, { content: '짧은 도움말' }, button('도움말')),
      present && h(K.DsModal, { open: parent, onOpenChange: setParent, title: '상위 창', height: native ? 360 : '360px' },
        trigger && pop('상위 팝업'), button('중첩 패널', () => setDrawer(true)),
        h(K.DsSelect, { ariaLabel: '상위 선택', options: ['옵션 A', '옵션 B'] }),
        h('div', { style: { height: 800 } }, '긴 본문'), button('본문 마지막')),
      present && h(K.DsDrawer, { open: drawer, onOpenChange: setDrawer, title: '패널', position: 'bottom' }, pop('패널 팝업')),
      present && h(K.DsModal, { open: child, onOpenChange: setChild, title: '새 창', closeOnEsc: escape },
        button('새 창 닫기', () => setChild(false)), button('새 창 행동', () => setActions(n => n + 1)), h(K.DsTextarea, { ariaLabel: '새 창 메모' })),
      h('output', { 'data-testid': 'actions' }, actions), h('output', { 'data-testid': 'closes' }, closes));
  }
  createRoot(document.getElementById('root')!).render(h(K.KjunProvider, native ? { colors, fontFamily: demoFont } : {}, h(K.KjunFeedbackProvider, null, h(Cases))));
}
