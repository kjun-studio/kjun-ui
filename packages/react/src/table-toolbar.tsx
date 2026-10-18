import { tokens } from "@kjun-ui/tokens";
import type { TableToolbarProps } from "../../../shared/package-runtime/table-presentation";
import { KjunButton } from "./button";
import { KjunInput } from "./input";
export function TableToolbar<Row extends object>({ selectable, selected, toggleAll, clearSelection,
  renderSelectionToolbar, searchable, search, searchChange, searchPlaceholder, toolbar }: TableToolbarProps<Row>) {
  return <>
      {selectable && selected.length > 0 && (
        <div
          // No arrow-key navigation is provided, so this is a labelled group rather than an ARIA toolbar.
          role="group"
          aria-label="선택 작업"
          className="kjun-table-selection"
        >
          <strong>{selected.length}개 선택</strong>
          <KjunButton size="xs" variant="ghost" onClick={toggleAll}>
            전체 선택
          </KjunButton>
          <KjunButton
            size="xs"
            variant="ghost"
            onClick={clearSelection}
          >
            선택 해제
          </KjunButton>
          {renderSelectionToolbar?.(selected)}
        </div>
      )}
      {(searchable || toolbar) && (
        <div className="kjun-table-toolbar">
          {searchable && (
            <KjunInput
              size="sm"
              style={{ width: tokens.table.searchWidth, maxWidth: "100%" }}
              value={search}
              ariaLabel="표 검색"
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
