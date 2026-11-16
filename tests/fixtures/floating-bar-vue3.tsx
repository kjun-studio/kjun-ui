import { createApp } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { barDescription, barMode } from './floating-bar-cases';

applyDemoColors('default');
createApp(() => <K.KjunProvider>
  <div data-testid="screen" style={{ width: '360px', height: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: '#CFE4F7' }}>
    <K.KjunBottomActionBar description={barDescription} safeArea={false} variant={barMode === 'docked' ? 'docked' : 'floating'}>
      <K.KjunButton variant="secondary">모음에 담기</K.KjunButton>
      <K.KjunButton variant="danger">삭제</K.KjunButton>
    </K.KjunBottomActionBar>
  </div>
</K.KjunProvider>).mount('#root');
