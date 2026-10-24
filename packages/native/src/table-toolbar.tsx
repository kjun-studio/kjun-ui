import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { typeStyle } from "./typography";
import { tokens } from "@kjun-ui/tokens";
import type { TableToolbarProps } from "../../../shared/package-runtime/table-presentation";
import { KjunButton } from "./button";
import { KjunInput } from "./input";
import { View } from "react-native";
import { KText } from "./internal";
import { useKjunStyles } from "./provider";
export function TableToolbar<Row extends object>({ selectable, selected, toggleAll, clearSelection,
  renderSelectionToolbar, searchable, search, searchChange, searchPlaceholder, toolbar }: TableToolbarProps<Row>) {
  const m = useKjunMessages();
  const { colors } = useKjunStyles();
  const toolbarStyle = {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.dimension.value8,
    flexWrap: "wrap",
    paddingVertical: tokens.dimension.value8,
    paddingHorizontal: tokens.dimension.value12,
    backgroundColor: colors.secondary,
    borderBottomWidth: tokens.border.defaultWidth,
    borderBottomColor: colors.border,
  } as const;
  return <>
      {selectable && selected.length > 0 && (
        <View
          role="group"
          accessibilityLabel={m.selectionActions}
          style={[toolbarStyle, { backgroundColor: colors.selectedBg }]}
        >
          <KText style={{ fontWeight: typeStyle('control').fontWeight, color: colors.brand }}>
            {m.selectedItems(selected.length)}
          </KText>
          <KjunButton size="xs" variant="ghost" onPress={toggleAll}>
            {m.selectAll}
          </KjunButton>
          <KjunButton
            size="xs"
            variant="ghost"
            onPress={clearSelection}
          >
            {m.deselectAll}
          </KjunButton>
          {renderSelectionToolbar?.(selected)}
        </View>
      )}
      {(searchable || toolbar) && (
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
          {toolbar}
        </View>
      )}
  </>;
}
