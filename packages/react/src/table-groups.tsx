import type { ReactNode } from "react";
import { tableGroupName, type TableCardsProps, type TableTotal } from "../../../shared/package-runtime/table-presentation";
import type { TableRowGroup } from "../../../shared/package-runtime/table-groups";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { KjunButton } from "./button";

/** A group's header line: its name, row count and, with two or more rows, its subtotals. Cards and list rows share it. */
function TableGroupHeader({ label, count, totals, toggle }: { label: ReactNode; count: string; totals: TableTotal[]; toggle: ReactNode }) {
  return (
    <div className="kjun-table-card-group">
      {toggle}
      <span>{label}</span>
      <span className="kjun-table-card-group-count">{count}</span>
      {totals.length > 0 && (
        <span className="kjun-table-card-group-total">
          {totals.map((total) => <span key={total.key}>{totals.length > 1 ? <>{total.label} {total.value}</> : total.value}</span>)}
        </span>
      )}
    </div>
  );
}

/** Groups as labelled groups, each a header line over its own list; ungrouped rows stay one list. */
export function useTableGroups<Row extends object>({ groupLabel, groupTotals, state, collapsed, toggleGroup }: Pick<TableCardsProps<Row>, "groupLabel" | "groupTotals" | "state" | "collapsed" | "toggleGroup">,
  className: string, itemsClass: string | undefined, item: (row: Row, index: number) => ReactNode) {
  const m = useKjunMessages();
  return (list: TableRowGroup<Row>[]) => list.map((group) => {
    const label = groupLabel?.(group), name = tableGroupName(label, group);
    const open = !collapsed?.includes(group.key);
    return (
      <div key={group.key} role="group" aria-label={name} className={className}>
        <TableGroupHeader label={label} count={m.groupCount(group.rows.length)} totals={group.rows.length > 1 ? groupTotals?.(group.rows) ?? [] : []}
          toggle={<KjunButton variant="ghost" size="xs" prefixIcon={open ? "chevron-down" : "chevron-right"} aria-expanded={open}
            ariaLabel={m.toggleGroup(name, open)} onClick={() => toggleGroup?.(group.key)} />} />
        {open && <div className={itemsClass} role="list">{group.rows.map((row) => item(row, state.rowIndex(row)))}</div>}
      </div>
    );
  });
}
