import { createApp, defineComponent, reactive } from 'vue';
import * as api from '@kjun-ui/vue3';
import { cssPalette } from './typography-values';
cssPalette();
// Same constants as token-followup-common.tsx, which imports React.
const selectionSizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const choiceSizes = ['sm', 'md', 'lg'] as const;
const selectionOptions = [{ value: 'a', label: '첫 번째 WWW' }, { value: 'b', label: '두 번째 MMM' }];
const tabItems = selectionOptions.map(({ value, label }) => ({ name: value, label }));
const Cases = defineComponent(() => {
  const values = reactive<Record<string, any>>({});
  const value = (id: string, fallback: any) => values[id] ?? fallback;
  const change = (id: string) => (next: any) => { values[id] = next; };
  const box = (id: string, child: any) => <div key={id} data-testid={id} style={{ marginBottom: '16px' }}>{child}</div>;
  return () => <div style={{ padding: '16px' }}>
    {box('empty', <api.KjunEmpty text="빈 상태 제목" description="빈 상태 설명" />)}
    {selectionSizes.flatMap(size => ['group', 'filter'].map(family => {
      const id = `${family}-${size}`, Control: any = family === 'group' ? api.KjunButtonGroup : api.KjunFilterGroup;
      return box(id, <>
        <Control size={size} options={selectionOptions} modelValue={value(id, 'a')} onUpdate:modelValue={change(id)} ariaLabel={id} />
        <output>{value(id, 'a')}</output>
      </>);
    }))}
    {box('tabs', <api.KjunTabs items={tabItems} modelValue={value('tabs', 'a')} onUpdate:modelValue={change('tabs')} />)}
    {choiceSizes.flatMap(size => [
      box(`checkbox-${size}`, <api.KjunCheckbox size={size} modelValue={value(`checkbox-${size}`, false)} label={`선택 ${size}`} onUpdate:modelValue={change(`checkbox-${size}`)} />),
      box(`switch-${size}`, <api.KjunSwitch size={size} modelValue={value(`switch-${size}`, false)} label={`설정 ${size}`} onUpdate:modelValue={change(`switch-${size}`)} />),
    ])}
    {box('input', <api.KjunInput modelValue={value('input', '')} ariaLabel="터치 입력" onUpdate:modelValue={change('input')} />)}
  </div>;
});
createApp(defineComponent(() => () => <api.KjunProvider><Cases /></api.KjunProvider>)).mount('#root');
