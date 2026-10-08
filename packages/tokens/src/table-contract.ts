export interface TableSort {
  key: string;
  order: "asc" | "desc";
}

/** Retain the existing ascending → descending → original-order cycle. */
export function nextTableSort(current: TableSort | null, key: string): TableSort {
  if (current?.key !== key) return { key, order: "asc" };
  return current.order === "asc"
    ? { key, order: "desc" }
    : { key: "", order: "asc" };
}
