import { Children, Fragment, isValidElement, useState, type ReactNode } from "react";
import { View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from "react-native";
import { tokens } from "@kjun-ui/tokens";
import { tilesCellWidth, tilesColumns, tilesGapStep, tilesProps, type TilesGap, type TilesMaxColumns, type TilesMinItem } from "../../../shared/package-runtime/tiles";
import { KText } from "./internal";
import { TileCellContext } from "./tiles-context";
export type { TilesGap, TilesMaxColumns, TilesMinItem };

export interface KjunTilesProps {
  /** Space between cells. auto is compact (16) in a container narrower than 768 and regular (24) from it. */
  gap?: TilesGap;
  /** A cell's narrowest width before a column is dropped: sm 160, md 240, lg 320. */
  minItem?: TilesMinItem;
  /** The most columns in a wide container. */
  maxColumns?: TilesMaxColumns;
  /** The list's name for screen readers. */
  ariaLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Each child is one cell; false, null and empty strings add none, and fragments count their children. */
  children?: ReactNode;
}

const gaps = { compact: tokens.space.stack.md, regular: tokens.space.stack.lg };

/** The cells: every child, fragments opened, with nothing for false, null and empty strings. */
function items(children: ReactNode, path = ""): [string, ReactNode][] {
  return Children.toArray(children).flatMap((child, i): [string, ReactNode][] => {
    // Children.toArray keys elements ".0", ".$id"; other children take "#i" so the two never clash.
    const key = path + (isValidElement(child) && child.key != null ? child.key : "#" + i);
    if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) return items(child.props.children, key + "/");
    return child === "" ? [] : [[key, child]];
  });
}

/** Same-width cards read as a list. Like Web, columns and gap follow the measured width of the list, not the window:
 *  cells go a row at a time, each an exact share of the width, and a short last row keeps that width.
 *  A KjunCard in a cell fills the cell's height; other elements keep their own (give them flex: 1). */
export function KjunTiles({ gap, minItem, maxColumns, ariaLabel, style, children }: KjunTilesProps) {
  const props = tilesProps(gap, minItem, maxColumns);
  const [width, setWidth] = useState(0);
  // Hidden only until the first real width, so the column count never jumps on screen; a later zero width
  // (a hidden tab) keeps the last layout instead of hiding again.
  const [measured, setMeasured] = useState(false);
  const onLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    if (next > 0) { setWidth(next); setMeasured(true); }
  };
  const space = gaps[tilesGapStep(props.gap, width, tokens.responsive.tilesGap)];
  const columns = tilesColumns(width, tokens.extensions.tiles.minItem[props.minItem], space, props.maxColumns);
  const cellWidth = tilesCellWidth(width, columns, space);
  const cells = items(children);
  const rows = Array.from({ length: Math.ceil(cells.length / columns) }, (_, n) => cells.slice(n * columns, n * columns + columns));
  // The width is measured inside the root, so padding or a border in the app's style never pushes cells out.
  return (
    <View role="list" aria-label={ariaLabel} style={[{ alignSelf: "stretch", minWidth: 0, opacity: measured ? 1 : 0 }, style]}>
      <View onLayout={onLayout} style={{ gap: space }}>
        {rows.map((row, n) => (
          <View key={n} style={{ flexDirection: "row", alignItems: "stretch", gap: space }}>
            {row.map(([key, child]) => (
              <View key={key} role="listitem" style={{ width: cellWidth, flexGrow: cellWidth == null ? 1 : 0, minWidth: 0 }}>
                <TileCellContext.Provider value={true}>
                  {typeof child === "string" || typeof child === "number" ? <KText>{child}</KText> : child}
                </TileCellContext.Provider>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}
