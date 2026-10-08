import { useTableModel as useSharedTableModel, type TableProps } from "../../../shared/package-runtime/table";
export { getValue } from "../../../shared/package-runtime/table";
export type { TableSort, TableColumn, TableCardSection, TablePagination } from "../../../shared/package-runtime/table";

export interface DsTableProps<Row extends object = Record<string, unknown>>
  extends TableProps<Row, number> {}

export function useTableModel<Row extends object>(props: DsTableProps<Row>) {
  return useSharedTableModel(props);
}
