// Skeleton (0.19.0): line roles, list rows with trailing kinds, loading text and table loading shapes.
// Review r1: paragraph roles, bounded counts, form action bars, market table loading text and a root style.
export const listRows = [{ id: 1, name: '가', price: 1 }, { id: 2, name: '나', price: 2 }];
export const tableColumns = [{ key: 'name', label: '이름' }, { key: 'price', label: '가격', align: 'right' }, { key: 'a', label: 'A' }, { key: 'b', label: 'B' }];
export function SkeletonDesignCases({ K }: { K: any }) {
  return <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, width: 360 }}>
    <div data-testid="line-caption"><K.KjunSkeleton type="line" role="caption" width={80} /></div>
    <div data-testid="row"><K.KjunListSkeleton variant="row" rows={2} /></div>
    <div data-testid="row-avatar"><K.KjunListSkeleton variant="row" rows={2} avatar trailing="switch" description={false} /></div>
    <div data-testid="status"><K.KjunListSkeleton variant="row" rows={1} loadingText="목록을 불러오는 중" /></div>
    <div data-testid="table-cards"><K.KjunTable ariaLabel="표" data={[]} columns={tableColumns} loading skeletonRows={1} responsive="card" /></div>
    <div data-testid="text-caption"><K.KjunSkeleton type="text" rows={3} role="caption" /></div>
    <div data-testid="table-unbounded"><K.KjunSkeleton type="table" rows={Infinity} columns={1e9} /></div>
    <div data-testid="form-actions"><K.KjunFormSkeleton fields={['']} actions={2} /></div>
    <div data-testid="market-status"><K.KjunMarketTableSkeleton columns={[{ key: 'name', label: '이름' }]} rows={Infinity} loadingText="표를 불러오는 중" /></div>
    <div data-testid="stat"><K.KjunSkeleton type="stat" animated={false} /></div>
    <div data-testid="styled"><K.KjunSkeleton type="block" height={20} style={{ marginTop: 12 }} /></div>
  </div>;
}
