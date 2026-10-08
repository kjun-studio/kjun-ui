import { UsageBuilder, expr, type UsageInput } from './builder';
import { tableExample } from '../../previews/catalog/example-tools';

export function tableUsageExample(input: UsageInput) {
  const b = new UsageBuilder(input), s = input.settings, example = tableExample(s);
  b.domainColors = example.metrics;
  const selected = b.state('selected', []), expanded = b.state('expanded', []);
  const report = (name: string, args: string, value: string) => b.handler(name, args, b.result(value));
  const slots: Record<string, string> = {};
  const cases: string[] = [];
  if (example.project || example.metrics) {
    b.declare('formatPrice', 'function formatPrice(value) {\n  return new Intl.NumberFormat("ko-KR").format(Number(value)) + "원";\n}');
    const progress = b.node('DsProgressCell', { value: expr('row.progress'), max: 100 });
    if (b.vue) slots['cell-progress'] = progress;
    else cases.push(`if (column.key === "progress") return ${progress};`);
  }
  if (example.project) {
    const status = b.node('DsBadge', { size: 'sm', dot: true, variant: expr('row.status === "완료" ? "success" : row.status === "검토 대기" ? "warning" : "primary"') }, b.text(expr('row.status')));
    const money = b.node('DsPriceCell', { value: expr('row.budget'), formatter: expr('formatPrice') });
    const view = report('viewProject', 'row', 'row.name + " 상세 보기"');
    const action = b.button('보기', b.call(view, 'row'), { size: 'xs', variant: 'ghost', ariaLabel: expr('row.name + " 보기"') });
    if (b.vue) Object.assign(slots, { 'cell-status': status, 'cell-budget': money, 'cell-actions': action });
    else cases.push(`if (column.key === "status") return ${status};`, `if (column.key === "budget") return ${money};`, `if (column.key === "actions") return ${action};`);
  }
  if (example.metrics) {
    const money = b.node('DsPriceCell', { value: expr('row.revenue'), formatter: expr('formatPrice') });
    const delta = b.node('DsSignedValue', { value: expr('row.change'), format: 'percent', isRaw: true });
    if (b.vue) Object.assign(slots, { 'cell-revenue': money, 'cell-change': delta });
    else cases.push(`if (column.key === "revenue") return ${money};`, `if (column.key === "change") return ${delta};`);
  }
  const detail = example.project
    ? b.node('DsAlert', { type: 'info' }, b.text(expr('row.summary + " 담당자 " + row.owner + " · 마감 " + row.due')))
    : b.text(expr('"상세: " + row.name'));
  const selection = b.button('선택 항목 확인', report('confirmSelection', '', b.read('selected') + '.map(row => row.name).join(", ") + " 선택 확인"'), { size: 'xs', variant: 'secondary' });
  const vueCells = Object.entries(slots).map(([key, body]) => `<template #${key}="{ row }">\n${body}\n</template>`).join('\n');
  return b.finish(b.node('DsTable', {
    columns: b.data('columns', example.columns), data: b.data('rows', example.data),
    ...b.props('selectable', 'sortable', 'expandable', 'responsive', 'loading', 'searchable', 'compact', 'striped', 'hoverable', 'stickyHeader'),
    maxHeight: s.stickyHeader ? 240 : undefined,
    selected, onSelectionChange: b.update('selected'), expandedRows: expanded, onExpandedRowsChange: b.update('expanded'),
    renderExpand: b.vue ? undefined : expr(`row => ${example.project ? '(' + detail + ')' : '"상세: " + row.name'}`),
    renderCell: !b.vue && cases.length ? expr(`(value, column, row) => {\n${cases.join('\n')}\nreturn column.type === "number" ? new Intl.NumberFormat("ko-KR").format(Number(value)) : value;\n}`) : undefined,
    renderSelectionToolbar: b.vue ? undefined : expr(`() => (${selection})`),
    cardTitle: 'name', cardSections: example.cardSections, ariaLabel: example.ariaLabel,
    error: s.error ? '조회 오류' : null, hasLoadedOnce: true,
    onSearch: report('search', 'query', '"프로젝트 검색: " + query'),
    onSortChange: report('sort', 'sort', '"정렬 " + sort.key + " " + sort.order'),
  }, b.vue ? vueCells : '', b.vue ? { expand: detail, 'selection-toolbar': selection } : {}));
}
