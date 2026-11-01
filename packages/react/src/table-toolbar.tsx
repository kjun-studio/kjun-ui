import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tokens } from "@kjun-ui/tokens";
import type { TableToolbarProps } from "../../../shared/package-runtime/table-presentation";
import { KjunButton } from "./button";
import { KjunInput } from "./input";
export function TableToolbar<Row extends object>({ selectable, selected, allSelected, toggleAll, clearSelection,
  renderSelectionToolbar, searchable, search, searchChange, searchPlaceholder, toolbar }: TableToolbarProps<Row>) {
  const m = useKjunMessages();
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
      ) : (searchable || toolbar) && (
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
          {toolbar}
        </div>
      )}
  </>;
}
