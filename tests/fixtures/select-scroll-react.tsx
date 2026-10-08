import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DsCombobox, DsSelect, KjunProvider } from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';

const query = new URLSearchParams(location.search);
const options = Array.from({ length: query.has('empty') ? 0 : query.has('short') ? 2 : 24 }, (_, index) => ({
  value: String(index + 1),
  label: `항목 ${String(index + 1).padStart(2, '0')}${query.has('long') ? ' · 알림 수신 범위와 팀 공유 설정을 함께 확인하는 긴 선택 항목' : ''}`,
}));
applyDemoColors('default');

function SelectScrollCase() {
  const multiple = query.has('multiple');
  const [value, setValue] = useState<string | number | (string | number)[] | null>(multiple ? [] : null);
  return <KjunProvider>
    <div style={{ position: 'absolute', left: 16, top: query.has('low') ? innerHeight / 2 - 20 : 24, width: 'min(280px, calc(100vw - 32px))' }}>
      {query.has('combobox') ? <DsCombobox ariaLabel="검색 선택" value={typeof value === 'string' ? value : null}
        options={options} onValueChange={setValue} /> : <DsSelect ariaLabel="검사 선택" value={value} options={options}
        multiple={multiple} searchable={query.has('search')} optionPageSize={query.has('paged') ? 8 : 0}
        loading={query.has('loading')} menuHeader={query.has('search') ? <div data-testid="menu-header">항목 선택 안내</div> : undefined}
        onValueChange={setValue} />}
      <output data-testid="selection">{JSON.stringify(value)}</output>
    </div>
  </KjunProvider>;
}
createRoot(document.getElementById('root')!).render(<SelectScrollCase />);
