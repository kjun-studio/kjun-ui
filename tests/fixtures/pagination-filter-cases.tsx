import { useLayoutEffect, useState } from 'react';
// Pagination (layout, disabled, formatter) and FilterGroup (counts, scroll) for React and Native; the page sets the options.
import { statusOptions } from './pagination-filter-options';
export function PaginationFilterCases({ K }: { K: any }) {
  const [c, setConfig] = useState<any>({ layout: 'auto', disabled: false, page: 1, pageSize: 20, filter: 'done' });
  const [log, setLog] = useState<number[]>([]);
  useLayoutEffect(() => { Object.assign(window, { configureCases: (next: object) => setConfig((old: object) => ({ ...old, ...next })) }); }, []);
  const go = (page: number) => { setLog(l => [...l, page]); setConfig((old: object) => ({ ...old, page })); };
  return <div style={{ padding: 24, width: 720 }}>
    <div data-testid="pagination">
      <K.KjunPagination page={c.page} totalPages={1000} totalRows={19990} pageSize={c.pageSize} showInfo showSizeSelector layout={c.layout} disabled={c.disabled}
        formatter={(n: number) => n.toLocaleString('en-US')} onPageChange={go}
        onPageSizeChange={(pageSize: number) => setConfig((old: object) => ({ ...old, pageSize }))} />
    </div>
    <output data-testid="log">{log.join(',')}</output>
    <div data-testid="filters" style={{ width: 240 }}>
      <K.KjunFilterGroup ariaLabel="상태 필터" scroll value={c.filter} options={statusOptions}
        onValueChange={(filter: unknown) => setConfig((old: object) => ({ ...old, filter }))} />
    </div>
  </div>;
}
