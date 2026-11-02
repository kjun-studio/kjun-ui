import type { TableTotal } from "../../../shared/package-runtime/table-presentation";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";

/** The summary on narrow layouts: one closing block with each summarized column's total. */
export function TableTotals({ totals }: { totals?: TableTotal[] }) {
  const m = useKjunMessages();
  return totals?.length ? (
    <div className="kjun-table-totals" role="group" aria-label={m.tableTotal}>
      <span className="kjun-table-totals-title">{m.tableTotal}</span>
      {totals.map((total) => (
        <div key={total.key} className="kjun-table-totals-row">
          <span>{total.label}</span>
          <span className="kjun-table-totals-value">{total.value}</span>
        </div>
      ))}
    </div>
  ) : null;
}
