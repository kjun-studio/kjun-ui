import { useEffect, useState } from "react";
import { tableGroupExpansion, type TableRowGroup } from "./table-groups";

/** Shared React/Native state; Vue uses the same framework-free transition rules. */
export function useTableGroupExpansion<Row extends object>(groups: TableRowGroup<Row>[] | null, groupBy: string | undefined,
  expanded: unknown[] | undefined, onChange: ((values: unknown[]) => void) | undefined) {
  const [internal, setInternal] = useState<{ field?: string; collapsed: string[] }>({ field: groupBy, collapsed: [] });
  useEffect(() => { setInternal({ field: groupBy, collapsed: [] }); }, [groupBy]);
  const state = tableGroupExpansion(groups, expanded, internal.field === groupBy ? internal.collapsed : []);
  return {
    collapsed: state.collapsed,
    toggleGroup(key: string) {
      const next = state.toggle(key);
      if (!next) return;
      if (expanded === undefined) setInternal({ field: groupBy, collapsed: next.collapsed });
      onChange?.(next.expanded);
    },
  };
}
