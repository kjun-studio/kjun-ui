import * as V from '@kjun/vue2';
import * as R from '@kjun/react';
import * as N from '@kjun/native';

const vueSearch: V.DsSearchInputProps[] = [{}, { loadOptions: null }, { loadOptions: async query => [{ name: query }] }];
const vueIdentity: V.KjunProviderProps[] = [{}, { renderIdentity: null }, { renderIdentity: () => null }, { renderIdentity: () => undefined }];
const vueRows: V.DsTableProps[] = [{ columns: [], rowClass: null }, { columns: [], rowClass: 'row' }, { columns: [], rowClass: () => 'row' }];
// @ts-expect-error A callback prop cannot be a string.
const invalidSearch: V.DsSearchInputProps = { loadOptions: 'request' };
// @ts-expect-error An identity callback cannot be a number.
const invalidIdentity: V.KjunProviderProps = { renderIdentity: 1 };
// @ts-expect-error Row classes accept functions, strings or null.
const invalidRowClass: V.DsTableProps = { columns: [], rowClass: 2 };

const data = [{ id: 0, name: 'Zero', amount: 7 }];
const reactTable = <R.DsTable data={data} columns={[{ key: 'amount', label: 'Amount', render: (_, row) => row.amount.toFixed() }]}
  maxHeight="50vh" onSelectionChange={rows => rows[0].amount.toFixed()} renderExpand={row => row.name} />;
const nativeTable = <N.DsTable data={data} columns={[{ key: 'amount', label: 'Amount', render: (_, row) => row.amount.toFixed() }]}
  maxHeight={300} onSelectionChange={rows => rows[0].amount.toFixed()} renderExpand={row => row.name} />;
// @ts-expect-error Native height stays a native number.
const invalidNativeHeight: N.DsTableProps = { columns: [], maxHeight: '50vh' };
const reactSearch = <R.DsSearchInput value="" loadOptions={async () => [{ id: 0, amount: 7 }]} onSelect={option => option.amount.toFixed()} />;
const nativeSearch = <N.DsSearchInput value="" loadOptions={async () => [{ id: 0, amount: 7 }]} onSelect={option => option.amount.toFixed()} />;
const reactCards = <R.DsMarketCards rows={data} columns={[]} metricConfig={{}} storageNamespace="types" onRowClick={row => row.amount.toFixed()} />;
const nativeCards = <N.DsMarketCards rows={data} columns={[]} metricConfig={{}} storageNamespace="types" onRowClick={row => row.amount.toFixed()} />;
