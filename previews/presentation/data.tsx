import { metricFormat } from "../catalog/example-tools";
import * as K from '@kjun-ui/react';
import { row, stack, rows, price, DataTable, noop } from './common';
const market = { rows, rowKey: 'id', primaryLabel: (r: typeof rows[number]) => r.name, subMeta: (r: typeof rows[number]) => r.symbol, hasLoadedOnce: true, showFooter: false };
const marketColumns: K.MarketColumn[] = [{ key: 'name', label: '자산' }, { key: 'price', label: '현재가', type: 'price', align: 'right' }, { key: 'change', label: '등락률', type: 'percent', align: 'right' }];
const metric = metricFormat;
const surface = (children: React.ReactNode, inset = true) => <div style={{ background: 'var(--_kjun-color-surface)', borderRadius: 12, padding: inset ? 16 : 0 }}>{children}</div>;
export function data(name: string) {
  switch (name) {
    case 'KjunTable': return <DataTable />;
    case 'KjunMarketTable': return <K.KjunMarketTable {...market} columns={marketColumns} priceFormatter={price} formatMetric={metric} />;
    case 'KjunMarketSimpleList': return <K.KjunMarketSimpleList {...market} priceValue={r => r.price} changeValue={r => r.change} priceFormatter={price} />;
    case 'KjunMarketCards': return <K.KjunMarketCards {...market} columns={marketColumns} metricConfig={{ price: { label: '현재가', format: 'price' }, change: { label: '등락률', format: 'percent' } }} excludeKeys={['name']} storageNamespace="presentation" emitSortOnMount={false} formatMetric={metric} changeMetricKey="change" priceMetricKeys={["price"]} sortKey="change" storage={{ getItem: () => "change", setItem: noop }} />;
    case 'KjunMarketListPanel': return <K.KjunMarketListPanel controls={<K.KjunFilterGroup value="all" options={[{ value: 'all', label: '전체 자산' }, { value: 'favorite', label: '관심 목록' }]} ariaLabel="자산 분류" />}><K.KjunMarketSimpleList {...market} priceValue={r => r.price} changeValue={r => r.change} priceFormatter={price} /></K.KjunMarketListPanel>;
    case 'KjunKpiHero': return <K.KjunKpiHero label="전체 자산" value={12845000} suffix="원" deltaPercent={2.35} deltaDescription="지난달 대비" animated={false} secondary={[{ label: '투자 원금', value: 12000000, suffix: '원' }]} />;
    case 'KjunKpiRow': return <K.KjunKpiRow mobileSummary={false} items={[{ label: '전체 자산', value: '1,284만 원', animated: false }, { label: '수익률', value: 2.35, suffix: '%', decimals: 2, showSign: true, semantic: 'price', animated: false }, { label: '보유 종목', value: 12, suffix: '개', animated: false }]} />;
    case 'KjunAnimatedNumber': return <div className="presentation-number"><K.KjunAnimatedNumber value={12845000} suffix="원" animated={false} /></div>;
    case 'KjunPriceCell': return stack(<><K.KjunPriceCell value={84200} formatter={price} /><K.KjunPriceCell value={36850} formatter={price} /></>);
    case 'KjunSignedValue': return row(<><K.KjunSignedValue value={2.35} format="percent" isRaw /><K.KjunSignedValue value={-1.25} format="percent" isRaw /><K.KjunSignedValue value={0} format="percent" isRaw /></>);
    case 'KjunDeviation': return row(<><K.KjunDeviation value={2.35} variant="pill" /><K.KjunDeviation value={-1.25} variant="pill" /><K.KjunDeviation value={0} variant="pill" /></>);
    case 'KjunHeatmapCell': return <div className="presentation-heatmap">{[-2.4, -.8, .6, 1.8, 2.6, 4.2].map(v => <K.KjunHeatmapCell key={v} value={v} min={-5} max={5} mode="price">{v > 0 ? '+' : ''}{v}%</K.KjunHeatmapCell>)}</div>;
    case 'KjunProgressCell': return surface(stack(<><K.KjunProgressCell value={72} /><K.KjunProgressCell value={38} /></>));
    case 'KjunCollectionMark': return row(<><K.KjunCollectionMark kind="favorite" active size="lg" /><K.KjunCollectionMark kind="interest" active size="lg" /><K.KjunCollectionMark kind="favorite" size="lg" /></>);
    case 'KjunExecutionStatusBadge': return row(<><K.KjunExecutionStatusBadge status="completed" label="완료" size="lg" /><K.KjunExecutionStatusBadge status="running" label="실행 중" size="lg" /><K.KjunExecutionStatusBadge status="failed" label="실패" size="lg" /></>);
    case 'KjunFreshness': return stack(<><div className="presentation-quote"><span>한빛테크</span>{row(<><K.KjunPriceCell value={84200} formatter={price} /><K.KjunFreshness stale source="거래소" fetchedAt="2026-09-14T00:20:00Z" formatter={() => '09:20 갱신'} /></>)}</div><div className="presentation-quote"><span>새봄에너지</span><K.KjunPriceCell value={36850} formatter={price} /></div></>);
    case 'KjunSparkline': return <K.KjunSparkline data={[18, 24, 21, 30, 26, 39, 35, 43, 40, 49]} width={320} height={100} fill ariaLabel="자산 가격 추이" />;
    case 'KjunSkeleton': return <K.KjunSkeleton type="card" height={200} />;
    case 'KjunListSkeleton': return surface(<K.KjunListSkeleton rows={3} variant="notification" avatar />, false);
    case 'KjunFormSkeleton': return surface(<K.KjunFormSkeleton fields={['목록 이름', '공개 범위']} />);
    case 'KjunChartSkeleton': return surface(<K.KjunChartSkeleton kind="frame" height={200} />);
    case 'KjunMarketTableSkeleton': return surface(<K.KjunMarketTableSkeleton columns={marketColumns} rows={3} showActions />, false);
    case 'KjunSpinner': return row(<><K.KjunSpinner text="조회 중" /><K.KjunSpinner size="sm" text="저장 중" /></>);
    case 'KjunProgress': return stack(<><K.KjunProgress value={72} label="파일 업로드" showLabel /><K.KjunProgress value={100} label="검토 완료" showLabel variant="success" /></>);
    case 'KjunAlert': return stack(<><K.KjunAlert type="success" title="변경 사항을 저장했습니다">팀원이 업데이트된 목록을 볼 수 있습니다.</K.KjunAlert><K.KjunAlert type="warning" title="공개 범위를 확인하세요">선택한 팀원에게 목록이 공유됩니다.</K.KjunAlert></>);
    case 'KjunEmpty': return <K.KjunEmpty icon="search" text="조건에 맞는 자산이 없습니다" description="검색어나 필터를 변경해 보세요."><K.KjunButton variant="secondary">필터 초기화</K.KjunButton></K.KjunEmpty>;
    case 'KjunDataState': return <K.KjunDataState error="자산 목록을 불러오지 못했습니다." onRetry={noop} />;
    case 'KjunErrorBoundary': return <K.KjunErrorBoundary fallbackMessage="화면을 불러오지 못했습니다"><BrokenScene /></K.KjunErrorBoundary>;
  }
}
function BrokenScene(): never { throw Error('presentation: expected boundary example'); }
