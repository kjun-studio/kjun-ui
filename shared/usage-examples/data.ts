import { UsageBuilder, expr, type UsageInput } from './builder';
import { tableUsageExample } from './table';
import { defaultRows, columns, defaultOptions } from '../../previews/catalog/example-tools';

export function generate(input: UsageInput) {
  const b = new UsageBuilder(input), { name, settings: s } = input;
  const rows = () => b.data('rows', s.data === 'empty' ? [] : defaultRows.map(row => s.data === 'long' ? { ...row, name: row.name + ' · 긴 한국어 자산 이름과 설명을 함께 표시합니다' } : row));
  const notify = (name: string, args: string, value: string) => b.handler(name, args, b.result(value));
  const formatter = () => b.declare('formatPrice', 'function formatPrice(value) {\n  return value == null || !Number.isFinite(Number(value)) ? "—" : new Intl.NumberFormat("ko-KR").format(Number(value)) + "원";\n}');
  b.domainColors = ['DsKpiHero', 'DsKpiRow', 'DsSignedValue', 'DsDeviation', 'DsHeatmapCell', 'DsSparkline', 'DsMarketSimpleList', 'DsMarketTable', 'DsMarketCards', 'DsMarketListPanel'].includes(name);
  let content: string;
  switch (name) {
    case 'DsIcon': content = b.group([b.node(name, { name: 'heart', size: 28 }), b.node(name, { name: 'heart', filled: true, size: 28 }), b.node(name, { name: 'refresh', spin: s.spin, size: 28 })]); break;
    case 'DsBadge':
      b.domainColors = true;
      content = b.group(['default', 'primary', 'success', 'warning', 'danger', 'price-up', 'price-down'].map(variant => b.node(name, { variant, dot: true }, b.text(variant)))); break;
    case 'DsSpinner': content = b.node(name, { size: 'md', text: '조회 중' }); break;
    case 'DsEmpty': content = b.node(name, { text: '항목이 없습니다', description: '조건을 바꾸거나 새 항목을 추가하세요.', icon: 'search' }, b.button('추가', notify('add', '', '"추가 요청"'))); break;
    case 'DsSkeleton': content = b.node(name, { type: 'card', animated: s.animated, rows: 3 }); break;
    case 'DsListSkeleton': content = b.node(name, { rows: 3, variant: 'market', avatar: true }); break;
    case 'DsFormSkeleton': content = b.node(name, { fields: ['', '', ''], columns: 1, size: s.size || 'md', multiline: s.multiline }); break;
    case 'DsChartSkeleton': content = b.node(name, { kind:s.kind, loadingText:s.loadingText, height:180 }); break;
    case 'DsMarketTableSkeleton':
      content = b.node(name, { columns: b.data('columns', columns), rows: 3, showActions: true }); break;
    case 'DsTable': return tableUsageExample(input);
    case 'DsDataState': {
      const queryKey = b.state('queryKey', s.queryState === '조건 변경' ? 'b' : 'a');
      const resultKey = b.state('resultKey', ['최초 로딩', '최초 실패'].includes(String(s.queryState)) ? null : 'a');
      const loading = b.state('queryLoading', ['최초 로딩', '조건 변경', '동일 조건 갱신'].includes(String(s.queryState)));
      const error = b.state('queryError', ['갱신 실패', '최초 실패'].includes(String(s.queryState)) ? '조회에 실패했습니다' : null);
      content = b.group([
        b.button('조건 변경', b.handler('changeQuery', '', b.set('queryKey', '"b"') + '\n' + b.set('queryLoading', 'true')), { variant: 'secondary' }),
        b.button('동일 조건 갱신', b.handler('refresh', '', b.set('queryLoading', 'true')), { variant: 'secondary' }),
        b.button('조회 완료', b.handler('complete', '', b.set('resultKey', b.read('queryKey')) + '\n' + b.set('queryLoading', 'false') + '\n' + b.set('queryError', 'null')), { variant: 'secondary' }),
        b.button('조회 실패', b.handler('fail', '', b.set('queryLoading', 'false') + '\n' + b.set('queryError', '"조회에 실패했습니다"')), { variant: 'secondary' }),
        b.node(name, { queryKey, resultKey, loading, error, hasLoadedOnce: !['최초 로딩', '최초 실패'].includes(String(s.queryState)), ...b.props('preserveContent', 'skeleton', 'empty', 'size', 'loadingText', 'refreshingText', 'emptyText', 'emptyIcon', 'emptyActionText', 'retryText'), skeletonCount: 1,
          onEmptyAction: notify('resetConditions', '', '"조건 초기화 요청"'),
          onRetry: b.handler('retry', '', b.set('queryError', 'null') + '\n' + b.set('queryLoading', 'true')),
        }, b.node('DsCard', { title: '조회 결과', surface: 'muted' }, b.native ? '{"이전 결과와 현재 조건을 구분합니다."}' : b.text('이전 결과와 현재 조건을 구분합니다.'))),
      ]); break;
    }
    case 'DsKpiHero': content = b.node(name, { label: '총 평가 금액', value: 123456789, suffix: '원', deltaAbsolute: 2345678, deltaPercent: 1.9, deltaDescription: '전일 대비', loading: s.loading, animated: false,
      formatter: b.declare('formatNumber', 'const formatNumber = value => new Intl.NumberFormat("ko-KR").format(value);'),
      secondary: [{ label: '수익률', value: 12.3, suffix: '%', decimals: 1, semantic: 'price' }],
    }); break;
    case 'DsKpiRow': content = b.node(name, { loading: s.loading, mobileSummary:s.mobileSummary, items: b.data('items', [{ label: '평가 금액', value: 1234567, suffix: '원' }, { label: '수익률', value: 2.35, decimals: 2, suffix: '%', semantic: 'price' }, { label: '상태', value: '정상', valueKind: 'text', badge: { text: '연결', variant: 'success' } }]) }); break;
    case 'DsAnimatedNumber': content = b.group([b.node(name, { value: b.state('number', 1234567), suffix: '원', fromPrevious: true }), b.button('숫자 변경', b.handler('increase', '', b.set('number', b.read('number') + ' + 123')))]); break;
    case 'DsFreshness': content = b.node(name, { stale: true, source: 'close', fetchedAt: '2026-09-12T03:00:00Z' }); break;
    // Vue's functional PriceCell returns siblings, so the SFC needs a parent.
    case 'DsPriceCell': content = b.group([b.node(name, { value: 1234567, formatter: formatter(), stale: s.stale, showFreshness: true })]); break;
    case 'DsSignedValue': content = b.group([-1.25, 0, 2.35].map(value => b.node(name, { value, format: 'percent', isRaw: true, ...b.props('loading', 'stale') }))); break;
    case 'DsDeviation': content = b.group([-1.25, 0, 2.35].map(value => b.node(name, { value, variant: 'badge' }))); break;
    case 'DsHeatmapCell': content = b.group([-1, -.5, 0, .5, 1].map(value => b.node(name, { value, min: -1, max: 1, mode: 'price' }, b.text(String(value))))); break;
    case 'DsProgressCell': content = b.node(name, { value: 42, max: 100, showLabel: true }); break;
    case 'DsCollectionMark': b.domainColors = true; content = b.group(['favorite', 'interest'].map(kind => b.node(name, { kind, active: true }))); break;
    case 'DsExecutionStatusBadge': content = b.group(['queued', 'running', 'completed', 'failed'].map(status => b.node(name, { status }))); break;
    case 'DsSparkline': content = b.node(name, { data: [1, 4, 3, 7, 5, 8], width: 240, height: 64, fill: true, semantic: 'price', ariaLabel: '추세' }); break;
    case 'DsMarketSimpleList': case 'DsMarketTable': case 'DsMarketCards': case 'DsMarketListPanel': {
      const market: Record<string, unknown> = { rows: rows(), columns: b.data('columns', columns.map((col, i) => ({ ...col, type: ['text', 'price', 'percent'][i] }))),
        primaryLabel: b.declare('primaryLabel', 'const primaryLabel = row => row.name;'), subMeta: b.declare('subMeta', 'const subMeta = row => row.symbol;'),
        totalCount: expr('rows.length'), hasLoadedOnce: true, loading: s.loading, error: s.error ? '조회 오류' : null, priceFormatter: formatter(),
        formatMetric: b.declare('formatMetric', `function formatMetric(value, format) {
  if (value == null || value === "") return "—";
  if (format !== "price" && format !== "percent") return String(value);
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  if (format === "price") return new Intl.NumberFormat("ko-KR").format(number) + "원";
  return (number > 0 ? "+" : "") + number.toFixed(2) + "%";
}`), showActions: true,
        onRowClick: notify('selectRow', 'row', 'row.name'),
      };
      if (b.vue) {
        delete market.formatMetric;
        market.formatters = b.declare('formatters', `const formatters = {
  KRW: value => formatMetric(value, "price"),
  price: value => formatMetric(value, "price"),
  percent: value => formatMetric(value, "percent"),
};`);
      }
      if (name === 'DsMarketTable') content = b.node(name, { ...market,
        onToggleFavorite: notify('favorite', 'row', '"즐겨찾기 " + row.name'), onToggleInterest: notify('interest', 'row', '"관심 " + row.name'), onSort: notify('sort', 'key', '(columns.find(column => column.key === key)?.label || "선택한 항목") + " 기준으로 정렬했습니다."') });
      else if (name === 'DsMarketCards') content = b.node(name, { ...market, storageNamespace: 'my-market',
        metricConfig: { price: { label: '가격', format: 'price', sortKey: 'price' }, change: { label: '변동', format: 'percent', sortKey: 'change' } }, priceMetricKeys: ['price'], changeMetricKey: 'change', onSort: notify('sort', 'key', '(columns.find(column => column.key === key)?.label || "선택한 항목") + " 기준으로 정렬했습니다."') });
      else {
        const list = b.node('DsMarketSimpleList', { ...market, priceValue: b.declare('priceValue', 'const priceValue = row => row.price;'), changeValue: b.declare('changeValue', 'const changeValue = row => row.change;') });
        content = name === 'DsMarketSimpleList' ? list : b.node(name, {}, list, { controls: b.node('DsFilterGroup', { value: b.state('filter', 'a'), onValueChange: b.update('filter'), options: b.data('options', defaultOptions) }) });
      }
      break;
    }
    default: throw Error('기본 사용 코드 생성기 누락: ' + name);
  }
  return b.finish(content);
}
