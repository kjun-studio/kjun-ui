import { createRoot } from 'react-dom/client';
import { View } from 'react-native';
import * as K from '@kjun-ui/native';
import { applyDemoColors, demoDomainPalettes, demoFont, demoPalettes } from '../../shared/demo-colors';

// Percent column widths in a narrow sheet: 0.21.0 ignored them on Native and drew three 160px columns.
applyDemoColors('default');
const rows = [{ id: 'm9', month: '9월', income: '3,200,000', spend: '2,140,000' }, { id: 'm10', month: '10월', income: '3,200,000', spend: '2,480,000' }];
const mixed = new URLSearchParams(location.search).has('mixed');
const columns = mixed
  ? [{ key: 'month', label: '월', width: 60 }, { key: 'income', label: '수입', width: '50%', align: 'right' }, { key: 'spend', label: '지출', align: 'right' }]
  : [{ key: 'month', label: '월', width: '40%' }, { key: 'income', label: '수입', width: '30%', align: 'right' }, { key: 'spend', label: '지출', width: '30%', align: 'right' }];
createRoot(document.getElementById('root')!).render(<K.KjunProvider colors={demoPalettes.default} domainColors={demoDomainPalettes.default} fontFamily={demoFont}>
  <View testID="sheet" style={{ width: 320 }}><K.KjunTable ariaLabel="월별 추이" responsive="none" columns={columns as any} data={rows} /></View>
</K.KjunProvider>);
