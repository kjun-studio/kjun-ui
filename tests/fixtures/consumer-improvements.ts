// Packed Vue declaration regressions: null is distinct from zero, and row inference must never become any.
const nullTab: V.TabItem = { name: 'first', label: 'First', badge: null };
const nullPane: V.KjunTabPaneProps = { name: 'first', label: 'First', badge: null };
const loadingKpi: V.KpiRowItem = { label: 'Pending', loading: true, value: undefined, badge: null };
const missingKpi: V.KpiRowItem = { label: 'Missing', value: null, missingText: 'Unavailable' };
const missingProgress: V.KjunProgressProps = { value: null };
const unknownProgress: V.KjunProgressProps = { indeterminate: true };
const controlledMenu: InstanceType<typeof V.KjunMenuButton>['$props'] = {
  open: false, 'onUpdate:open': value => { const opened: boolean = value; },
};
const menuItem: InstanceType<typeof V.KjunDropdownItem>['$props'] = {
  onClick: event => { const actual: MouseEvent | KeyboardEvent = event; event.stopPropagation(); },
};
const inferredTable = new V.KjunTable({ data: [item], columns: [],
  rowClass: row => {
    const amount: number = row.amount;
    // @ts-expect-error The row inferred from data cannot become any.
    const invalid: string = row.amount;
    return String(amount);
  },
  formatValue: (value, column, row) => row.amount.toFixed(),
  onRowClick: row => {
    // @ts-expect-error Nonexistent row fields must be rejected.
    row.missing;
  },
  'onUpdate:selected': rows => {
    const amount: number = rows[0].amount;
    // @ts-expect-error The selected rows retain the data type.
    const invalid: string = rows[0].amount;
  },
});
type InferredRow = Parameters<NonNullable<typeof inferredTable.$slots.expand>>[0]['row'];
const inferredRow: InferredRow = item;
// @ts-expect-error Expanded rows retain the concrete shape inferred from data.
const wrongExpandedRow: InferredRow = { amount: 'wrong' };
type RowTable = InstanceType<typeof V.KjunTable<typeof item>>;
declare const rowTable: RowTable;
rowTable.$emit('update:selected', [item]);
// @ts-expect-error Typed template refs must reject malformed selection payloads.
rowTable.$emit('update:selected', [{ amount: 'wrong' }]);
const rowSlots: V.KjunTableSlots<typeof item> = {
  cell: ({ row, column }) => { column.format?.(row.amount, row); return row.amount.toFixed(); },
  'cell-amount': ({ row }) => row.amount.toFixed(),
  expand: ({ row }) => {
    // @ts-expect-error Expand scope must not become any.
    row.missing;
    return row.amount.toFixed();
  },
  selectionToolbar: ({ selected }) => selected[0].amount.toFixed(),
};
// @ts-expect-error An existing non-row prop union must still be enforced.
const badTable: V.KjunTableProps<typeof item> = { data: [item], columns: [], sortMode: 'unknown' };
const formattedSlider: V.KjunSliderProps = { modelValue: 0, showValue: false, formatValue: value => `${value}%` };
const stickyTabs: V.KjunTabsProps = { stickyHeader: true, stickyOffset: '2rem', items: [nullTab] };

// React accessibility additions must survive every packed declaration format.
const mixedCheckbox: R.KjunCheckboxProps<string> = { value: ['one'], val: 'two', indeterminate: true };
const reactFormattedSlider: R.KjunSliderProps = { value: 10, formatValue: value => {
  const numeric: number = value;
  // @ts-expect-error Formatting receives numbers, not a preformatted string or any.
  const text: string = value;
  return `${numeric}시`;
} };
const reactFormattedRange: R.KjunRangeSliderProps = { value: [10, 20], formatValue: value => `${value}시`,
  onValueChange: value => { const tuple: [number, number] = value; },
};
// @ts-expect-error Mixed state is boolean, not the ARIA string literal.
const invalidMixedCheckbox: R.KjunCheckboxProps = { value: false, indeterminate: 'mixed' };
// @ts-expect-error The formatter must return a string.
const invalidSliderFormatter: R.KjunSliderProps = { value: 10, formatValue: value => value };
