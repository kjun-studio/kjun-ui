import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { cssPalette, palette, demoDomainColors } from './typography-values';

export function mountTokenCompletion(api: any, native: boolean) {
  cssPalette();
  function Cases() {
    const [checked, setChecked] = useState(false), [enabled, setEnabled] = useState(false), [page, setPage] = useState(1);
    const [text, setText] = useState('');
    const box = (id: string, child: any) => h('div', { key: id, 'data-testid': id, style: { marginBottom: 20 } }, child);
    return h('div', { style: { padding: 16 } }, [
      box('form', [h(api.DsFormGroup, { key: 'field', label: '입력 검사', hint: '안내 문구' }, h(api.DsInput, { value: text, ...(native ? { onChangeText: setText } : { onChange: (event: any) => setText(event.target.value) }), ariaLabel: '입력 검사' })), h('span', { key: 'following' }, '다음 항목')]),
      box('button', h(api.DsButton, { prefixIcon: 'check' }, '실행 가능')),
      box('disabled', h(api.DsButton, { disabled: true }, '실행 불가')),
      box('checkbox', h(api.DsCheckbox, { value: checked, onValueChange: setChecked, size: 'sm', label: '작은 선택' })),
      box('switch', h(api.DsSwitch, { value: enabled, onValueChange: setEnabled, label: '사용 설정' })),
      box('signed', h(api.DsSignedValue, { value: 12, tone: 'pill', showFreshness: false })),
      box('progress', h(api.DsProgressCell, { value: 30 })),
      box('pagination', h(api.DsPagination, { currentPage: page, totalPages: 3, onPageChange: setPage })),
      h('output', { 'data-testid': 'values', key: 'values' }, `${checked}/${enabled}/${page}`),
    ]);
  }
  createRoot(document.getElementById('root')!).render(h(api.KjunProvider, native ? { colors: palette(), domainColors: demoDomainColors } : null, h(Cases)));
}
