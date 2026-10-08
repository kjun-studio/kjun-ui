import { tokens } from "@kjun-ui/tokens";
import type { TableToolbarProps } from "../../../shared/package-runtime/table-presentation";
import { DsButton } from "./button";
import { DsInput } from "./input";
export function TableToolbar<Row extends object>({ selectable, selected, toggleAll, clearSelection,
  renderSelectionToolbar, searchable, search, searchChange, searchPlaceholder, toolbar }: TableToolbarProps<Row>) {
  return <>
      {selectable && selected.length > 0 && (
        <div
          role="toolbar"
          aria-label="선택 작업"
          className="kjun-table-selection"
        >
          <strong>{selected.length}개 선택</strong>
          <DsButton size="xs" variant="ghost" onClick={toggleAll}>
            전체 선택
          </DsButton>
          <DsButton
            size="xs"
            variant="ghost"
            onClick={clearSelection}
          >
            선택 해제
          </DsButton>
          {renderSelectionToolbar?.(selected)}
        </div>
      )}
      {(searchable || toolbar) && (
        <div className="kjun-table-toolbar">
          {searchable && (
            <DsInput
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
