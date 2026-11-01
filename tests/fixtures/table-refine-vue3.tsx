import { createApp, defineComponent, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { refineColumns, refineRows } from './table-refine-cases';
applyDemoColors('default');
const selected = ref<object[]>([]);
const pageScroll = new URLSearchParams(location.search).has('page');
createApp(defineComponent(() => () => <K.KjunProvider>
  <div style={{ padding: '24px', width: '640px', paddingBottom: pageScroll ? '1600px' : '24px' }}>
    <K.KjunTable ariaLabel="정리된 표" columns={refineColumns as any} data={refineRows} selectable selected={selected.value} onUpdate:selected={(rows: object[]) => { selected.value = rows; }}
      expandable searchable striped stickyHeader maxHeight={pageScroll ? undefined : 320} responsive="none">{{ expand: ({ row }: any) => '상세 ' + row.name }}</K.KjunTable>
  </div>
</K.KjunProvider>)).mount('#root');
