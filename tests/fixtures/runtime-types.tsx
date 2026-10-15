import * as V from '@kjun-ui/vue3';
import * as R from '@kjun-ui/react';
import * as N from '@kjun-ui/native';

const vueSearch: V.KjunSearchInputProps[] = [{}, { loadOptions: undefined }, { loadOptions: async query => [{ name: query }] }];
const vueRows: V.KjunTableProps[] = [{ columns: [], rowClass: undefined }, { columns: [], rowClass: 'row' }, { columns: [], rowClass: () => 'row' }];
// @ts-expect-error A callback prop cannot be a string.
const invalidSearch: V.KjunSearchInputProps = { loadOptions: 'request' };
// @ts-expect-error Row classes accept functions or strings.
const invalidRowClass: V.KjunTableProps = { columns: [], rowClass: 2 };

const data = [{ id: 0, name: 'Zero', amount: 7 }];
const reactTable = <R.KjunTable data={data} columns={[{ key: 'amount', label: 'Amount', render: (_, row) => row.amount.toFixed() }]}
  maxHeight="50vh" onSelectionChange={rows => rows[0].amount.toFixed()} renderExpand={row => row.name} />;
const nativeTable = <N.KjunTable data={data} columns={[{ key: 'amount', label: 'Amount', render: (_, row) => row.amount.toFixed() }]}
  maxHeight={300} onSelectionChange={rows => rows[0].amount.toFixed()} renderExpand={row => row.name} />;
// @ts-expect-error Native height stays a native number.
const invalidNativeHeight: N.KjunTableProps = { columns: [], maxHeight: '50vh' };
const reactSearch = <R.KjunSearchInput value="" loadOptions={async () => [{ id: 0, amount: 7 }]} onSelect={option => option.amount.toFixed()} />;
const nativeSearch = <N.KjunSearchInput value="" loadOptions={async () => [{ id: 0, amount: 7 }]} onSelect={option => option.amount.toFixed()} />;
const reactCards = <R.KjunMarketCards rows={data} columns={[]} metricConfig={{}} storageNamespace="types" onRowClick={row => row.amount.toFixed()} />;
const nativeCards = <N.KjunMarketCards rows={data} columns={[]} metricConfig={{}} storageNamespace="types" onRowClick={row => row.amount.toFixed()} />;
