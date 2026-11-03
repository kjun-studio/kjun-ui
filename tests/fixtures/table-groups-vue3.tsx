import { createApp, defineComponent, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { groupColumns, groupConfig, groupSummary } from './table-groups-cases';
applyDemoColors('default');
createApp(defineComponent(() => {
  const config = ref({ ...groupConfig }), changes = ref<unknown[][]>([]);
  Object.assign(window, { configureTableGroups: (next: Partial<typeof groupConfig>) => { config.value = { ...config.value, ...next }; } });
  return () => <K.KjunProvider>
  <div style={{ padding: '16px', maxWidth: '560px', boxSizing: 'border-box' }}>
    <K.KjunTable ariaLabel="묶은 표" columns={groupColumns as any} {...config.value} summary={groupSummary}
      onUpdate:expandedGroups={values => { changes.value = [...changes.value, values]; if (config.value.accept && config.value.expandedGroups !== undefined) config.value.expandedGroups = values; }}>
      {{ group: ({ value }: any) => '상태: ' + String(value), expand: ({ row }: any) => '상세 ' + row.id }}
    </K.KjunTable>
    <output data-testid="group-changes">{JSON.stringify(changes.value)}</output>
  </div>
  </K.KjunProvider>;
})).mount('#root');
