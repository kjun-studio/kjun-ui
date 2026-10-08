import { metricFormat } from "../catalog/example-tools";
import * as K from '@kjun-ui/react';
import { row, stack, rows, price, DataTable, noop } from './common';
const market = { rows, rowKey: 'id', primaryLabel: (r: typeof rows[number]) => r.name, subMeta: (r: typeof rows[number]) => r.symbol, hasLoadedOnce: true, showFooter: false };
const marketColumns: K.MarketColumn[] = [{ key: 'name', label: '자산' }, { key: 'price', label: '현재가', type: 'price', align: 'right' }, { key: 'change', label: '등락률', type: 'percent', align: 'right' }];
const metric = metricFormat;
const surface = (children: React.ReactNode, inset = true) => <div style={{ background: 'var(--_kjun-color-surface)', borderRadius: 12, padding: inset ? 16 : 0 }}>{children}</div>;
export function data(name: string) {
  switch (name) {
    case 'DsTable': return <DataTable />;
    case 'DsMarketTable': return <K.DsMarketTable {...market} columns={marketColumns} priceFormatter={price} formatMetric={metric} />;
    case 'DsMarketSimpleList': return <K.DsMarketSimpleList {...market} priceValue={r => r.price} changeValue={r => r.change} priceFormatter={price} />;
    case 'DsMarketCards': return <K.DsMarketCards {...market} columns={marketColumns} metricConfig={{ price: { label: '현재가', format: 'price' }, change: { label: '등락률', format: 'percent' } }} excludeKeys={['name']} storageNamespace="presentation" emitSortOnMount={false} formatMetric={metric} changeMetricKey="change" priceMetricKeys={["price"]} sortKey="change" storage={{ getItem: () => "change", setItem: noop }} />;
    case 'DsMarketListPanel': return <K.DsMarketListPanel controls={<K.DsFilterGroup value="all" options={[{ value: 'all', label: '전체 자산' }, { value: 'favorite', label: '관심 목록' }]} ariaLabel="자산 분류" />}><K.DsMarketSimpleList {...market} priceValue={r => r.price} changeValue={r => r.change} priceFormatter={price} /></K.DsMarketListPanel>;
    case 'DsKpiHero': return <K.DsKpiHero label="전체 자산" value={12845000} suffix="원" deltaPercent={2.35} deltaDescription="지난달 대비" animated={false} secondary={[{ label: '투자 원금', value: 12000000, suffix: '원' }]} />;
    case 'DsKpiRow': return <K.DsKpiRow mobileSummary={false} items={[{ label: '전체 자산', value: '1,284만 원', animated: false }, { label: '수익률', value: 2.35, suffix: '%', decimals: 2, showSign: true, semantic: 'price', animated: false }, { label: '보유 종목', value: 12, suffix: '개', animated: false }]} />;
    case 'DsAnimatedNumber': return <div className="presentation-number"><K.DsAnimatedNumber value={12845000} suffix="원" animated={false} /></div>;
    case 'DsPriceCell': return stack(<><K.DsPriceCell value={84200} formatter={price} /><K.DsPriceCell value={36850} formatter={price} /></>);
    case 'DsSignedValue': return row(<><K.DsSignedValue value={2.35} format="percent" isRaw /><K.DsSignedValue value={-1.25} format="percent" isRaw /><K.DsSignedValue value={0} format="percent" isRaw /></>);
    case 'DsDeviation': return row(<><K.DsDeviation value={2.35} variant="pill" /><K.DsDeviation value={-1.25} variant="pill" /><K.DsDeviation value={0} variant="pill" /></>);
    case 'DsHeatmapCell': return <div className="presentation-heatmap">{[-2.4, -.8, .6, 1.8, 2.6, 4.2].map(v => <K.DsHeatmapCell key={v} value={v} min={-5} max={5} mode="price">{v > 0 ? '+' : ''}{v}%</K.DsHeatmapCell>)}</div>;
    case 'DsProgressCell': return surface(stack(<><K.DsProgressCell value={72} /><K.DsProgressCell value={38} /></>));
    case 'DsCollectionMark': return row(<><K.DsCollectionMark kind="favorite" active size="lg" /><K.DsCollectionMark kind="interest" active size="lg" /><K.DsCollectionMark kind="favorite" size="lg" /></>);
    case 'DsExecutionStatusBadge': return row(<><K.DsExecutionStatusBadge status="completed" label="완료" size="lg" /><K.DsExecutionStatusBadge status="running" label="실행 중" size="lg" /><K.DsExecutionStatusBadge status="failed" label="실패" size="lg" /></>);
    case 'DsFreshness': return stack(<><div className="presentation-quote"><span>한빛테크</span>{row(<><K.DsPriceCell value={84200} formatter={price} /><K.DsFreshness stale source="거래소" fetchedAt="2026-09-14T00:20:00Z" formatter={() => '09:20 갱신'} /></>)}</div><div className="presentation-quote"><span>새봄에너지</span><K.DsPriceCell value={36850} formatter={price} /></div></>);
    case 'DsSparkline': return <K.DsSparkline data={[18, 24, 21, 30, 26, 39, 35, 43, 40, 49]} width={320} height={100} fill ariaLabel="자산 가격 추이" />;
    case 'DsSkeleton': return <K.DsSkeleton type="card" height={200} />;
    case 'DsListSkeleton': return surface(<K.DsListSkeleton rows={3} variant="notification" avatar />, false);
    case 'DsFormSkeleton': return surface(<K.DsFormSkeleton fields={['목록 이름', '공개 범위']} />);
    case 'DsChartSkeleton': return surface(<K.DsChartSkeleton kind="line" height={200} />);
    case 'DsMarketTableSkeleton': return surface(<K.DsMarketTableSkeleton columns={marketColumns} rows={3} showActions />, false);
    case 'DsSpinner': return row(<><K.DsSpinner text="조회 중" /><K.DsSpinner size="sm" text="저장 중" /></>);
    case 'DsProgress': return stack(<><K.DsProgress value={72} label="파일 업로드" showLabel /><K.DsProgress value={100} label="검토 완료" showLabel variant="success" /></>);
    case 'DsAlert': return stack(<><K.DsAlert type="success" title="변경 사항을 저장했습니다">팀원이 업데이트된 목록을 볼 수 있습니다.</K.DsAlert><K.DsAlert type="warning" title="공개 범위를 확인하세요">선택한 팀원에게 목록이 공유됩니다.</K.DsAlert></>);
    case 'DsEmpty': return <K.DsEmpty icon="search" text="조건에 맞는 자산이 없습니다" description="검색어나 필터를 변경해 보세요."><K.DsButton variant="secondary">필터 초기화</K.DsButton></K.DsEmpty>;
    case 'DsDataState': return <K.DsDataState error="자산 목록을 불러오지 못했습니다." onRetry={noop} />;
    case 'DsErrorBoundary': return <K.DsErrorBoundary fallbackMessage="화면을 불러오지 못했습니다"><BrokenScene /></K.DsErrorBoundary>;
  }
}
function BrokenScene(): never { throw Error('presentation: expected boundary example'); }
