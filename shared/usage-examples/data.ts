import { UsageBuilder, expr, type UsageInput } from './builder';
import { tableUsageExample } from './table';
import { defaultRows, columns, defaultOptions, sparklineSample } from '../../previews/catalog/example-tools';

export function generate(input: UsageInput) {
  const b = new UsageBuilder(input), { name, settings: s } = input;
  const rows = () => b.data('rows', s.data === 'empty' ? [] : defaultRows.map(row => s.data === 'long' ? { ...row, name: row.name + ' · 긴 한국어 자산 이름과 설명을 함께 표시합니다' } : row));
  const notify = (name: string, args: string, value: string) => b.handler(name, args, b.result(value));
  const formatter = () => b.declare('formatPrice', 'function formatPrice(value) {\n  return value == null || !Number.isFinite(Number(value)) ? "—" : new Intl.NumberFormat("ko-KR").format(Number(value)) + "원";\n}');
  b.domainColors = ['KjunKpiHero', 'KjunKpiRow', 'KjunSignedValue', 'KjunDeviation', 'KjunHeatmapCell', 'KjunSparkline', 'KjunMarketSimpleList', 'KjunMarketTable', 'KjunMarketCards', 'KjunMarketListPanel'].includes(name);
  let content: string;
  switch (name) {
    case 'KjunIcon': content = b.group([b.node(name, { name: 'heart', size: 28 }), b.node(name, { name: 'heart', filled: true, size: 28 }), b.node(name, { name: 'refresh', spin: s.spin, size: 28 })]); break;
    case 'KjunBadge':
      b.domainColors = true;
      content = b.group(['default', 'primary', 'success', 'warning', 'danger', 'price-up', 'price-down'].map(variant => b.node(name, { variant, dot: true }, b.text(variant)))); break;
    case 'KjunSpinner': content = b.node(name, { size: 'md', text: '조회 중' }); break;
    case 'KjunEmpty': content = b.node(name, { text: '항목이 없습니다', description: '조건을 바꾸거나 새 항목을 추가하세요.', icon: 'search' }, b.button('추가', notify('add', '', '"추가 요청"'))); break;
    case 'KjunSkeleton': {
      const type = s.type || 'card', role = ['text', 'line'].includes(String(type)) && s.role && s.role !== 'auto' ? s.role : undefined;
      content = b.node(name, { type, role, animated: s.animated, rows: 3 }); break;
    }
    case 'KjunListSkeleton': {
      const variant = s.variant || 'row';
      content = b.node(name, { rows: 3, variant, avatar: s.avatar !== false, trailing: variant === 'row' ? s.trailing || 'value' : undefined }); break;
    }
    case 'KjunFormSkeleton': content = b.node(name, { fields: ['', '', ''], columns: 1, size: s.size || 'md', multiline: s.multiline, actions: Number(s.actions ?? 2) }); break;
    case 'KjunChartSkeleton': content = b.node(name, { kind:s.kind, skeleton:s.skeleton, loadingText:s.loadingText, height:180 }); break;
    case 'KjunMarketTableSkeleton':
      content = b.node(name, { columns: b.data('columns', columns), rows: 3, showActions: true }); break;
    case 'KjunTable': return tableUsageExample(input);
    case 'KjunDataState': {
      const queryKey = b.state('queryKey', s.queryState === '조건 변경' ? 'b' : 'a');
      const resultKey = b.state('resultKey', ['최초 로딩', '최초 실패'].includes(String(s.queryState)) ? null : 'a');
      const loading = b.state('queryLoading', ['최초 로딩', '조건 변경', '동일 조건 갱신'].includes(String(s.queryState)));
      const error = b.state('queryError', ['갱신 실패', '최초 실패'].includes(String(s.queryState)) ? '조회에 실패했습니다' : null);
      content = b.group([
        b.button('조건 변경', b.handler('changeQuery', '', b.set('queryKey', '"b"') + '\n' + b.set('queryLoading', 'true')), { variant: 'secondary' }),
        b.button('동일 조건 갱신', b.handler('refresh', '', b.set('queryLoading', 'true')), { variant: 'secondary' }),
        b.button('조회 완료', b.handler('complete', '', b.set('resultKey', b.read('queryKey')) + '\n' + b.set('queryLoading', 'false') + '\n' + b.set('queryError', 'null')), { variant: 'secondary' }),
        b.button('조회 실패', b.handler('fail', '', b.set('queryLoading', 'false') + '\n' + b.set('queryError', '"조회에 실패했습니다"')), { variant: 'secondary' }),
        b.node(name, { queryKey, resultKey, loading, error, hasLoadedOnce: !['최초 로딩', '최초 실패'].includes(String(s.queryState)), ...b.props('preserveContent', 'skeleton', 'empty', 'size', 'loadingText', 'refreshingText', 'emptyText', 'emptyDescription', 'emptyIcon', 'emptyActionText', 'retryText'), skeletonCount: 1,
          onEmptyAction: notify('resetConditions', '', '"조건 초기화 요청"'),
          onRetry: b.handler('retry', '', b.set('queryError', 'null') + '\n' + b.set('queryLoading', 'true')),
        }, b.node('KjunCard', { title: '조회 결과', surface: 'muted' }, b.native ? '{"이전 결과와 현재 조건을 구분합니다."}' : b.text('이전 결과와 현재 조건을 구분합니다.'))),
      ]); break;
    }
    // labelAside puts the mask toggle on the label line; masked hides every amount.
    case 'KjunKpiHero': content = b.node(name, { label: '총 평가 금액', value: 123456789, suffix: '원', deltaAbsolute: 2345678, deltaPercent: 1.9, deltaDescription: '전일 대비', loading: s.loading, animated: false,
      formatter: b.declare('formatNumber', 'const formatNumber = value => new Intl.NumberFormat("ko-KR").format(value);'),
      secondary: [{ label: '수익률', value: 12.3, suffix: '%', decimals: 1, semantic: 'price' }], masked: b.state('hidden', false),
    }, '', { labelAside: b.node('KjunIconToggle', { active: expr(b.read('hidden')), activeIcon: 'eye-off', inactiveIcon: 'eye', size: 'xs', ariaLabel: '금액 가리기',
      onToggle: b.handler('toggleHidden', '', b.set('hidden', '!' + b.read('hidden'))) }) }); break;
    case 'KjunKpiRow': content = b.node(name, { loading: s.loading, mobileSummary:s.mobileSummary, items: b.data('items', [{ label: '평가 금액', value: 1234567, suffix: '원' }, { label: '수익률', value: 2.35, decimals: 2, suffix: '%', semantic: 'price' }, { label: '상태', value: '정상', valueKind: 'text', badge: { text: '연결', variant: 'success' } }]) }); break;
    case 'KjunAnimatedNumber': content = b.group([b.node(name, { value: b.state('number', 1234567), suffix: '원', fromPrevious: true }), b.button('숫자 변경', b.handler('increase', '', b.set('number', b.read('number') + ' + 123')))]); break;
    // Vue's functional PriceCell returns siblings, so the SFC needs a parent.
    case 'KjunPriceCell': content = b.group([b.node(name, { value: b.state('price', 84200), formatter: formatter(), stale: s.stale, flash: true }),
      b.button('오름', b.handler('rise', '', b.set('price', b.read('price') + ' + 100'))), b.button('내림', b.handler('fall', '', b.set('price', b.read('price') + ' - 100')))]); break;
    case 'KjunSignedValue': content = b.group([-1.25, 0, 2.35].map(value => b.node(name, { value, format: 'percent', ...b.props('loading', 'stale') }))); break;
    case 'KjunDeviation': content = b.group([-1.25, 0, 2.35].map(value => b.node(name, { value, variant: 'badge' }))); break;
    case 'KjunHeatmapCell': content = b.group([-4, -1, 0, 2, 6, 10].map(value => b.node(name, { value, min: -5, max: 10, center: 0, mode: 'price' }, b.text((value > 0 ? '+' : '') + value + '%')))); break;
    case 'KjunProgressCell': content = b.group([b.node(name, { value: 42, max: 100, showLabel: true, ariaLabel: 'A팀 진척' }), b.node(name, { value: 12, max: 20, valueText: '12/20건', ariaLabel: 'B팀 진척' })]); break;
    case 'KjunCollectionMark': b.domainColors = true; content = b.group(['favorite', 'interest'].map(kind => b.node(name, { kind, active: true }))); break;
    case 'KjunExecutionStatusBadge': content = b.group(['queued', 'running', 'completed', 'failed'].map(status => b.node(name, { status }))); break;
    case 'KjunSparkline': {
      const spark = sparklineSample(String(s.data ?? '상승'));
      content = b.node(name, { data: spark.data, width: 240, height: 64, variant: s.variant === 'bar' ? 'bar' : undefined, fill: s.fill === false ? false : undefined,
        stretch: s.stretch ? true : undefined, semantic: 'price', baseline: s.baseline === false ? undefined : spark.baseline, ariaLabel: spark.label }); break;
    }
    case 'KjunMarketSimpleList': case 'KjunMarketTable': case 'KjunMarketCards': case 'KjunMarketListPanel': {
      // Each view gets only the props it takes (Vue would pass the rest to the root element as attributes).
      // Declarations are made in the order the code shows them, so each builder call runs once, in prop order.
      const marketColumns = () => b.data('columns', columns.map((col, i) => ({ ...col, type: ['text', 'price', 'percent'][i] })));
      const rowText = () => ({ primaryLabel: b.declare('primaryLabel', 'const primaryLabel = row => row.name;'), subMeta: b.declare('subMeta', 'const subMeta = row => row.symbol;'),
        totalCount: expr('rows.length'), hasLoadedOnce: true, loading: s.loading, error: s.error ? '조회 오류' : null });
      const formatMetric = () => b.declare('formatMetric', `function formatMetric(value, format) {
  if (value == null || value === "") return "—";
  if (format !== "price" && format !== "percent") return String(value);
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  if (format === "price") return new Intl.NumberFormat("ko-KR").format(number) + "원";
  return (number > 0 ? "+" : "") + number.toFixed(2) + "%";
}`);
      const selectRow = () => notify('selectRow', 'row', 'row.name');
      const sortNotice = () => notify('sort', 'key', '(columns.find(column => column.key === key)?.label || "선택한 항목") + " 기준으로 정렬했습니다."');
      if (name === 'KjunMarketTable') {
        // MarketTable keeps its own output: the shared props, then its flash price column over the plain one.
        const market = { rows: rows(), columns: marketColumns(), ...rowText(), priceFormatter: formatter(), formatMetric: formatMetric(), showActions: true, onRowClick: selectRow() };
        content = b.node(name, { ...market, columns: b.data('columns', columns.map((col, i) => ({ ...col, type: ['text', 'price', 'percent'][i], ...(i === 1 ? { flash: true } : {}) }))),
          onToggleFavorite: notify('favorite', 'row', '"즐겨찾기 " + row.name'), onToggleInterest: notify('interest', 'row', '"관심 " + row.name'), onSort: sortNotice() });
      }
      else if (name === 'KjunMarketCards') {
        const cardRows = rows(), cardColumns = marketColumns(), text = rowText(), format = formatMetric();
        content = b.node(name, { rows: cardRows, columns: cardColumns, ...text, formatMetric: format, onRowClick: selectRow(), storageNamespace: 'my-market',
          metricConfig: { price: { label: '가격', format: 'price', sortKey: 'price' }, change: { label: '변동', format: 'percent', sortKey: 'change' } }, priceMetricKeys: ['price'], changeMetricKey: 'change', onSort: sortNotice() });
      } else {
        const listRows = rows(), text = rowText(), priceFormatter = formatter(), select = selectRow();
        const list = b.node('KjunMarketSimpleList', { rows: listRows, ...text, priceFormatter, onRowClick: select, priceValue: b.declare('priceValue', 'const priceValue = row => row.price;'), changeValue: b.declare('changeValue', 'const changeValue = row => row.change;') });
        content = name === 'KjunMarketSimpleList' ? list : b.node(name, {}, list, { controls: b.node('KjunFilterGroup', { value: b.state('filter', 'a'), onValueChange: b.update('filter'), options: b.data('options', defaultOptions) }) });
      }
      break;
    }
    default: throw Error('기본 사용 코드 생성기 누락: ' + name);
  }
  return b.finish(content);
}
