import Vue from 'vue';
import * as K from '@kjun-ui/vue2';
import { designOptions, setInputDesignColors } from './input-design-cases';
setInputDesignColors();
const vm = new Vue({
  data: () => ({ config: { size: 'md', disabled: false, readOnly: false, error: false }, value: '장기 보유 자산', changes: 0, selected: 'team', quantity: 5, time: '09:30' }),
  render(h) {
    const wrap = (id: string, child: any) => h('div', { attrs: { 'data-testid': id } }, [child]);
    const input = (props: any = {}, children: any[] = []) => h(K.KjunInput, { props: { ...this.config, readonly: this.config.readOnly, value: this.value, ...props }, on: { input: (v: string) => { this.changes++; this.value = v; } } }, children);
    const select = (component: any, label: string) => h(component, { props: { ...this.config, value: this.selected, options: designOptions, clearable: true, ariaLabel: label }, on: { input: (v: string) => { this.selected = v; } } });
    return h(K.KjunProvider, [h('div', { style: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '400px' } }, [
      wrap('input', h(K.KjunFormGroup, { props: { label: '목록 이름', hint: '공유할 이름을 입력하세요.', error: this.config.error ? '이름을 확인해 주세요.' : '' } }, [input({ clearable: true })])),
      wrap('affix', input({ clearable: true, ariaLabel: '금액' }, [h('span', { slot: 'prefix' }, '합계 금액'), h('span', { slot: 'suffix' }, 'KRW')])),
      wrap('textarea', h(K.KjunTextarea, { props: { ...this.config, readonly: this.config.readOnly, value: this.value, rows: 3, ariaLabel: '목록 설명' }, on: { input: (v: string) => { this.value = v; } } })),
      wrap('select', select(K.KjunSelect, '공개 범위')), wrap('combo', select(K.KjunCombobox, '범위 검색')),
      wrap('search', h(K.KjunSearchInput, { props: { ...this.config, value: '', ariaLabel: '자산 검색' } })),
      wrap('date', h(K.KjunDatePicker, { props: { ...this.config, value: '2026-09-20', ariaLabel: '시작일' } })),
      wrap('quantity', h(K.KjunQuantityStepper, { props: { ...this.config, value: this.quantity, min: 1, max: 20, ariaLabel: '수량' }, on: { input: (v: number) => { this.quantity = v; } } })),
      wrap('time', h(K.KjunTimePicker, { props: { ...this.config, value: this.time, ariaLabel: '알림 시각' }, on: { input: (v: string) => { this.time = v; } } })),
      wrap('button', h(K.KjunButton, { props: { size: this.config.size } }, '저장')),
      wrap('skeleton', h(K.KjunFormSkeleton, { props: { fields: ['목록 이름'], size: this.config.size } })),
      h('output', { attrs: { 'data-testid': 'value' } }, this.value),
      h('output', { attrs: { 'data-testid': 'changes' } }, this.changes),
    ])]);
  },
}).$mount('#root');
Object.assign(window, { configureInputDesign: (next: object) => { vm.config = { ...vm.config, ...next }; } });
