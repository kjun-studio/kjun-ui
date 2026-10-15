import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { cssPalette, palette } from './typography-values';

export const selectionSizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
export const choiceSizes = ['sm', 'md', 'lg'] as const;
export const selectionOptions = [{ value: 'a', label: '첫 번째 WWW' }, { value: 'b', label: '두 번째 MMM' }];
export const tabItems = selectionOptions.map(({ value, label }) => ({ name: value, label }));

export function mountTokenFollowup(api: any, native: boolean) {
  cssPalette();
  function Cases() {
    const [values, setValues] = useState<Record<string, any>>({});
    const value = (id: string, fallback: any) => values[id] ?? fallback;
    const change = (id: string) => (next: any) => setValues(old => ({ ...old, [id]: next }));
    const box = (id: string, child: any) => h('div', { key: id, 'data-testid': id, style: { marginBottom: 16 } }, child);
    return h('div', { style: { padding: 16 } }, [
      box('empty', h(api.KjunEmpty, { text: '빈 상태 제목', description: '빈 상태 설명' })),
      ...selectionSizes.flatMap(size => ['group', 'filter'].map(family => {
        const id = `${family}-${size}`;
        return box(id, [h(family === 'group' ? api.KjunButtonGroup : api.KjunFilterGroup, {
          key: 'control', size, options: selectionOptions, value: value(id, 'a'), onValueChange: change(id), ariaLabel: id,
        }), h('output', { key: 'value' }, value(id, 'a'))]);
      })),
      box('tabs', h(api.KjunTabs, { items: tabItems, value: value('tabs', 'a'), onValueChange: change('tabs') })),
      ...choiceSizes.flatMap(size => [
        box(`checkbox-${size}`, h(api.KjunCheckbox, { size, value: value(`checkbox-${size}`, false), label: `선택 ${size}`, onValueChange: change(`checkbox-${size}`) })),
        box(`switch-${size}`, h(api.KjunSwitch, { size, value: value(`switch-${size}`, false), label: `설정 ${size}`, onValueChange: change(`switch-${size}`) })),
      ]),
      box('input', h(api.KjunInput, { value: value('input', ''), ariaLabel: '터치 입력', ...(native ? { onChangeText: change('input') } : { onChange: (event: any) => change('input')(event.target.value) }) })),
    ]);
  }
  createRoot(document.getElementById('root')!).render(h(api.KjunProvider, native ? { colors: palette(), fontFamily: 'sans-serif' } : null, h(Cases)));
}
