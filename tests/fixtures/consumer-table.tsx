/** @jsxImportSource vue */
import { KjunTable } from '@kjun-ui/vue3';
const rows = [{ id: 'first', amount: 7 }];
const table = <KjunTable data={rows} columns={[]} rowClass={row => {
  const amount: number = row.amount;
  // @ts-expect-error TSX must infer row fields from data too.
  const invalid: string = row.amount;
  return String(amount);
}} onRowClick={row => {
  // @ts-expect-error Unknown fields cannot be accepted by TSX listeners.
  row.missing;
}} onUpdate:selected={selected => selected[0].amount.toFixed()} />;
