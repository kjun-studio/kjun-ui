import { createApp } from 'vue';
import * as K from '@kjun-ui/vue3';
import { setRootValues } from './style-values';
import { hero } from './kpi-secondary-values';
setRootValues();
createApp(() => <K.KjunProvider><div style={{ padding: '16px' }}><K.KjunKpiHero {...hero} /></div></K.KjunProvider>).mount('#root');
