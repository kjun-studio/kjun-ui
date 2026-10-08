import { createRoot } from 'react-dom/client';
import { KjunProvider, DsSearchInput } from '@kjun/native';
import { appColors } from './style-values';
import { SearchContracts } from './review-composition-search';
createRoot(document.getElementById('root')!).render(<KjunProvider colors={appColors}>
  <SearchContracts Search={DsSearchInput} />
</KjunProvider>);
