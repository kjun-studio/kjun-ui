import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tokens } from "@kjun-ui/tokens";
import type { TableToolbarProps } from "../../../shared/package-runtime/table-presentation";
import { KjunButton } from "./button";
import { KjunInput } from "./input";
import { KjunSelect } from "./select-control";
export function TableToolbar<Row extends object>({ selectable, selected, allSelected, toggleAll, clearSelection,
  renderSelectionToolbar, searchable, search, searchChange, searchPlaceholder, toolbar, sortOptions = [], sortValue, sortChange }: TableToolbarProps<Row>) {
  const m = useKjunMessages();
  const sorting = sortOptions.length > 0;
  return <>
      {selectable && selected.length > 0 ? (
        <div
          // No arrow-key navigation is provided, so this is a labelled group rather than an ARIA toolbar.
          role="group"
          aria-label={m.selectionActions}
          className="kjun-table-selection"
        >
          <KjunButton size="sm" variant="ghost" prefixIcon="x" ariaLabel={m.deselectAll} onClick={clearSelection} />
          <strong>{m.selectedItems(selected.length)}</strong>
          {!allSelected && (
            <KjunButton size="sm" variant="ghost" onClick={toggleAll}>
              {m.selectAll}
            </KjunButton>
          )}
          {renderSelectionToolbar?.(selected)}
        </div>
      ) : (searchable || sorting || toolbar) && (
        <div className="kjun-table-toolbar">
          {searchable && (
            <KjunInput
              size="sm"
              style={{ width: tokens.table.searchWidth, maxWidth: "100%" }}
              value={search}
              ariaLabel={m.searchTable}
              placeholder={searchPlaceholder}
              prefixIcon="search"
              clearable
              onValueChange={searchChange}
            />
          )}{" "}
          {/* Narrow layouts have no header row to sort by; the choice sits beside the search. */}
          {sorting && (
            <div className="kjun-table-sort">
              <KjunSelect size="sm" ariaLabel={m.sortBy} options={sortOptions} value={sortValue ?? ""} onValueChange={(value) => sortChange?.(String(value ?? ""))} />
            </div>
          )}
          {toolbar}
        </div>
      )}
  </>;
}
