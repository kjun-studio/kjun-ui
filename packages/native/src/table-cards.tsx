import { tokens } from "@kjun-ui/tokens";
import { typeStyle } from "./typography";
import {
View
} from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { DsSkeleton } from "./display";
import { KText,content } from "./internal";
import { useKjunStyles } from "./provider";
import type { TableCardsProps } from "../../../shared/package-runtime/table-presentation";
export function TableCards<Row extends object>({ initialLoading, skeletonRows, state, onRowClick, selectable,
  checkbox, cell, expandable, expand, renderExpand, emptyContent, emptyText, layout }: TableCardsProps<Row>) {
  const { colors } = useKjunStyles();
  const { title, subtitle, badges, inline, sections, actions, columnsForSection } = layout;
  return (
    <View style={{ gap: tokens.extensions.tableCard.gap, padding: tokens.extensions.tableCard.listPadding }}>
      {initialLoading
        ? Array.from({ length: skeletonRows }, (_, i) => (
            <DsSkeleton key={i} type="card" />
          ))
        : state.rows.map((row, i) => (
            <Pressable
              key={state.key(row, i)}
              accessible={false}
              onPress={() => onRowClick?.(row, i)}
              style={({ pressed }) => ({
                padding: tokens.extensions.tableCard.padding,
                borderWidth: tokens.border.defaultWidth,
                borderColor: colors.border,
                borderRadius: tokens.extensions.tableCard.radius,
                backgroundColor: pressed ? colors.hover : colors.background,
              })}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: tokens.extensions.tableCard.gap,
                  marginBottom: tokens.dimension.value8,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    flex: 1,
                    alignItems: "center",
                    gap: tokens.extensions.tableCard.gap,
                    minWidth: 0,
                  }}
                >
                  {selectable && checkbox(row, i)}
                  {title && <View style={{ flex: 1, minWidth: 0 }}>{cell(title, row, i, "title")}</View>}
                </View>
                {badges.length ? (
                  <View style={{ flexDirection: "row", gap: tokens.extensions.tableCard.fieldGap }}>
                    {badges.map((col) => (
                      <View key={col.key}>{cell(col, row, i)}</View>
                    ))}
                  </View>
                ) : subtitle ? (
                  cell(subtitle, row, i)
                ) : null}
                {inline.length > 0 && (
                  <View style={{ flexDirection: "row", gap: tokens.extensions.tableCard.fieldGap }}>
                    {inline.map((col) => (
                      <View key={col.key}>{cell(col, row, i)}</View>
                    ))}
                  </View>
                )}
              </View>
              {sections.map((section, index) => {
                const cols = columnsForSection(row, section);
                return cols.length ? (
                  <View
                    key={section.key || index}
                    style={{
                      borderTopWidth: index ? tokens.border.defaultWidth : 0,
                      borderTopColor: colors.border,
                      paddingTop: index ? tokens.dimension.value12 : 0,
                      marginTop: index ? tokens.dimension.value12 : 0,
                    }}
                  >
                    {section.label && (
                      <KText
                        style={{
                          ...typeStyle('controlSmall'),

                          color: colors.textTertiary,
                          marginBottom: tokens.dimension.value6,
                        }}
                      >
                        {section.label}
                      </KText>
                    )}
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: section.layout === "metrics" ? tokens.extensions.tableCard.gap : tokens.extensions.tableCard.metricGap,
                      }}
                    >
                      {cols.map((col) => (
                        <View
                          key={col.key}
                          style={{
                            flexBasis:
                              col.fullWidthInCard || section.layout === "stack"
                                ? "100%"
                                : section.layout === "metrics"
                                ? "30%"
                                : "47%",
                            flexGrow: 1,
                            minWidth: 0,
                            gap: tokens.extensions.tableCard.valueGap,
                          }}
                        >
                          <KText
                            style={{
                              ...typeStyle("meta"),
                              color: colors.textTertiary,
                              textAlign: section.labelAlign,
                            }}
                          >
                            {col.label}
                          </KText>
                          {cell(col, row, i)}
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null;
              })}
              {expandable && expand(row, i)}
              {expandable && state.expanded.includes(state.key(row, i)) && (
                <View
                  style={{
                    borderTopWidth: tokens.border.defaultWidth,
                    borderTopColor: colors.border,
                    paddingTop: tokens.dimension.value8,
                    marginTop: tokens.dimension.value4,
                  }}
                >
                  {content(renderExpand?.(row, i))}
                </View>
              )}
              {actions && !actions.inlineInCard && (
                <View
                  style={{
                    borderTopWidth: tokens.border.defaultWidth,
                    borderTopColor: colors.border,
                    paddingTop: tokens.dimension.value8,
                    marginTop: tokens.dimension.value8,
                    alignItems: "flex-end",
                  }}
                >
                  {/* The wrapper holds the end edge; a DsButton's own flex-start would otherwise pull it left. */}
                  <View style={{ alignSelf: "flex-end" }}>{cell(actions, row, i)}</View>
                </View>
              )}
            </Pressable>
          ))}
      {!initialLoading && !state.rows.length && (
        <View style={{ padding: tokens.extensions.tableCard.emptyPadding, alignItems: "center" }}>
          {content(emptyContent || emptyText, {
            color: colors.textTertiary,
          })}
        </View>
      )}
    </View>
  );
}
