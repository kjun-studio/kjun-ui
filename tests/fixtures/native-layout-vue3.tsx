import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { initial, renderCases } from './native-layout-cases';
import { adaptCase } from './case-adapter-vue3';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
const state = reactive({ ...initial });
createApp(defineComponent(() => () => <K.KjunProvider>
  <main style={{ padding: '16px', maxWidth: '800px' }}>{renderCases(adaptCase, { ...state }, (key, value) => { (state as any)[key] = value; })}</main>
</K.KjunProvider>)).mount('#root');
