import { createApp, defineComponent, reactive } from 'vue';
import * as api from '@kjun-ui/vue3';
import { cssPalette } from './typography-values';
cssPalette();
const Cases = defineComponent(() => {
  const state = reactive({ checked: false, enabled: false, page: 1, text: '' });
  const box = (id: string, child: any) => <div key={id} data-testid={id} style={{ marginBottom: '20px' }}>{child}</div>;
  return () => <div style={{ padding: '16px' }}>
    {box('form', <>
      <api.KjunFormGroup label="입력 검사" hint="안내 문구">
        <api.KjunInput modelValue={state.text} onUpdate:modelValue={(value: string) => { state.text = value; }} ariaLabel="입력 검사" />
      </api.KjunFormGroup>
      <span>다음 항목</span>
    </>)}
    {box('button', <api.KjunButton prefixIcon="check">실행 가능</api.KjunButton>)}
    {box('disabled', <api.KjunButton disabled>실행 불가</api.KjunButton>)}
    {box('checkbox', <api.KjunCheckbox modelValue={state.checked} onUpdate:modelValue={(value: any) => { state.checked = value; }} size="sm" label="작은 선택" />)}
    {box('switch', <api.KjunSwitch modelValue={state.enabled} onUpdate:modelValue={(value: boolean) => { state.enabled = value; }} label="사용 설정" />)}
    {box('signed', <api.KjunSignedValue value={12} tone="pill" showFreshness={false} />)}
    {box('progress', <api.KjunProgressCell value={30} />)}
    {box('pagination', <api.KjunPagination currentPage={state.page} totalPages={3} onUpdate:page={(page: number) => { state.page = page; }} />)}
    <output data-testid="values">{`${state.checked}/${state.enabled}/${state.page}`}</output>
  </div>;
});
createApp(defineComponent(() => () => <api.KjunProvider><Cases /></api.KjunProvider>)).mount('#root');
