// Skeleton (0.19.0): line roles, list rows with trailing kinds, loading text and table loading shapes.
export const listRows = [{ id: 1, name: '가', price: 1 }, { id: 2, name: '나', price: 2 }];
export const tableColumns = [{ key: 'name', label: '이름' }, { key: 'price', label: '가격', align: 'right' }, { key: 'a', label: 'A' }, { key: 'b', label: 'B' }];
export function SkeletonDesignCases({ K }: { K: any }) {
  return <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, width: 360 }}>
    <div data-testid="line-caption"><K.KjunSkeleton type="line" role="caption" width={80} /></div>
    <div data-testid="row"><K.KjunListSkeleton variant="row" rows={2} /></div>
    <div data-testid="row-avatar"><K.KjunListSkeleton variant="row" rows={2} avatar trailing="switch" description={false} /></div>
    <div data-testid="status"><K.KjunListSkeleton variant="row" rows={1} loadingText="목록을 불러오는 중" /></div>
    <div data-testid="table-cards"><K.KjunTable ariaLabel="표" data={[]} columns={tableColumns} loading skeletonRows={1} responsive="card" /></div>
  </div>;
}
