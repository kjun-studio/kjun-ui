import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { typeStyle } from "./typography";
import { tokens } from "@kjun-ui/tokens";
import type { TableToolbarProps } from "../../../shared/package-runtime/table-presentation";
import { KjunButton } from "./button";
import { KjunInput } from "./input";
import { KjunSelect } from "./select-control";
import { View } from "react-native";
import { KText } from "./internal";
import { useKjunStyles } from "./provider";
export function TableToolbar<Row extends object>({ selectable, selected, allSelected, toggleAll, clearSelection,
  renderSelectionToolbar, searchable, search, searchChange, searchPlaceholder, toolbar, sortOptions = [], sortValue, sortChange }: TableToolbarProps<Row>) {
  const m = useKjunMessages();
  const sorting = sortOptions.length > 0;
  const { colors } = useKjunStyles();
  const toolbarStyle = {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.dimension.value8,
    flexWrap: "wrap",
    // Touch buttons are 44pt tall, so both bars share that height plus their padding and selecting never moves the table.
    minHeight: Math.max(tokens.table.toolbarMinimumHeight, tokens.native.minimumTouchTarget + tokens.dimension.value8 * 2),
    paddingVertical: tokens.dimension.value8,
    paddingHorizontal: tokens.dimension.value12,
    backgroundColor: colors.secondary,
    borderBottomWidth: tokens.border.defaultWidth,
    borderBottomColor: colors.border,
  } as const;
  return <>
      {/* Like Web: the selection bar takes the toolbar's place at the same height. */}
      {selectable && selected.length > 0 ? (
        <View
          role="group"
          accessibilityLabel={m.selectionActions}
          style={[toolbarStyle, { backgroundColor: colors.brandSubtleBg, paddingLeft: tokens.dimension.value8 }]}
        >
          <KjunButton size="sm" variant="ghost" prefixIcon="x" ariaLabel={m.deselectAll} onPress={clearSelection} />
          <KText style={{ fontWeight: typeStyle('control').fontWeight, color: colors.brand, marginRight: "auto" }}>
            {m.selectedItems(selected.length)}
          </KText>
          {!allSelected && (
            <KjunButton size="sm" variant="ghost" onPress={toggleAll}>
              {m.selectAll}
            </KjunButton>
          )}
          {renderSelectionToolbar?.(selected)}
        </View>
      ) : (searchable || sorting || toolbar) && (
        // Like Web: the search toolbar sits on the surface so the filled search field stands out from it.
        <View style={{ ...toolbarStyle, backgroundColor: colors.surface }}>
          {searchable && (
            <View style={{ width: tokens.table.searchWidth, maxWidth: "100%" }}>
              <KjunInput
                size="sm"
                value={search}
                ariaLabel={m.searchTable}
                placeholder={searchPlaceholder}
                prefixIcon="search"
                clearable
                onChangeText={searchChange}
              />
            </View>
          )}
          {/* Like Web: narrow layouts have no header row to sort by, so the choice sits beside the search. */}
          {sorting ? (
            <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0, maxWidth: tokens.table.searchWidth }}>
              <KjunSelect size="sm" ariaLabel={m.sortBy} options={sortOptions} value={sortValue ?? ""} onValueChange={(value) => sortChange?.(String(value ?? ""))} />
            </View>
          ) : null}
          {toolbar}
        </View>
      )}
  </>;
}
