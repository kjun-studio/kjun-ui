import { createApp } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
// Same sections and DOM as surfaces-cases.tsx (React/Native).
createApp(() => <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', width: '360px', background: 'rgb(240, 240, 240)' }}>
  <div data-testid="bars"><K.KjunProvider>
    <K.KjunTopNavigation title="Plain header" surface={false} />
    <K.KjunTopNavigation title="Card header" />
    <K.KjunBottomNavigation ariaLabel="Plain tabs" surface={false} value="home" items={[{ key: 'home', label: 'Plain home', href: '#home' }]} />
    <K.KjunBottomActionBar description="Plain actions" surface={false}><K.KjunButton>Save</K.KjunButton></K.KjunBottomActionBar>
  </K.KjunProvider></div>
</div>).mount('#root');
