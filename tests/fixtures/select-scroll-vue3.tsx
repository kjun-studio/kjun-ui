import { createApp, defineComponent, ref } from 'vue';
import { KjunCombobox, KjunSelect, KjunProvider } from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';

const query = new URLSearchParams(location.search);
const options = Array.from({ length: query.has('empty') ? 0 : query.has('short') ? 2 : 24 }, (_, index) => ({
  value: String(index + 1),
  label: `항목 ${String(index + 1).padStart(2, '0')}${query.has('long') ? ' · 알림 수신 범위와 팀 공유 설정을 함께 확인하는 긴 선택 항목' : ''}`,
}));
applyDemoColors('default');
const multiple = query.has('multiple');
const value = ref<any>(multiple ? [] : null);
createApp(defineComponent(() => () => (
  <KjunProvider>
    <div style={{ position: 'absolute', left: '16px', top: query.has('low') ? innerHeight / 2 - 20 + 'px' : '24px', width: 'min(280px, calc(100vw - 32px))' }}>
      {query.has('combobox')
        ? <KjunCombobox ariaLabel="검색 선택" modelValue={typeof value.value === 'string' ? value.value : null} options={options}
            onUpdate:modelValue={(next: any) => { value.value = next; }} />
        : <KjunSelect ariaLabel="검사 선택" modelValue={value.value} options={options} multiple={multiple} searchable={query.has('search')}
            optionPageSize={query.has('paged') ? 8 : 0} loading={query.has('loading')} onUpdate:modelValue={(next: any) => { value.value = next; }}>
            {query.has('search') ? { menuHeader: () => <div data-testid="menu-header">항목 선택 안내</div> } : {}}
          </KjunSelect>}
      <output data-testid="selection">{JSON.stringify(value.value)}</output>
    </div>
  </KjunProvider>
))).mount('#root');
