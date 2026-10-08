import { typeStyle } from "./typography";
import { tokens } from "@kjun-ui/tokens";
import type { TableToolbarProps } from "../../../shared/package-runtime/table-presentation";
import { DsButton } from "./button";
import { DsInput } from "./input";
import { View } from "react-native";
import { KText } from "./internal";
import { useKjunStyles } from "./provider";
export function TableToolbar<Row extends object>({ selectable, selected, toggleAll, clearSelection,
  renderSelectionToolbar, searchable, search, searchChange, searchPlaceholder, toolbar }: TableToolbarProps<Row>) {
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
          accessibilityRole="toolbar"
          accessibilityLabel="선택 작업"
          style={[toolbarStyle, { backgroundColor: colors.selectedBg }]}
        >
          <KText style={{ fontWeight: typeStyle('control').fontWeight, color: colors.brand }}>
            {selected.length}개 선택
          </KText>
          <DsButton size="xs" variant="ghost" onPress={toggleAll}>
            전체 선택
          </DsButton>
          <DsButton
            size="xs"
            variant="ghost"
            onPress={clearSelection}
          >
            선택 해제
          </DsButton>
          {renderSelectionToolbar?.(selected)}
        </View>
      )}
      {(searchable || toolbar) && (
        // Like Web: the search toolbar sits on the surface so the filled search field stands out from it.
        <View style={{ ...toolbarStyle, backgroundColor: colors.surface }}>
          {searchable && (
            <View style={{ width: tokens.table.searchWidth, maxWidth: "100%" }}>
              <DsInput
                size="sm"
                value={search}
                ariaLabel="표 검색"
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
