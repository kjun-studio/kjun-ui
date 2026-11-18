import { useState, type ReactNode } from "react";
import { View, type LayoutChangeEvent, type StyleProp, type ViewProps, type ViewStyle } from "react-native";
import { tokens } from "@kjun-ui/tokens";
import { tilesCellWidth, tilesColumns, tilesGapStep, tilesProps, type TilesGap, type TilesMaxColumns, type TilesMinItem } from "../../../shared/package-runtime/tiles";
import { tileItems } from "../../../shared/package-runtime/tiles-children";
import { KText } from "./internal";
import { TileCellContext } from "./tiles-context";
export type { TilesGap, TilesMaxColumns, TilesMinItem };

/** Other View props (testID, nativeID, onLayout…) pass to the root, as on KjunStack; the root keeps role="list". */
export interface KjunTilesProps extends Omit<ViewProps, "style" | "children" | "role"> {
  /** Space between cells. auto is compact (16) in a container narrower than 768 and regular (24) from it. */
  gap?: TilesGap;
  /** A cell's narrowest width before a column is dropped: sm 160, md 240, lg 320. */
  minItem?: TilesMinItem;
  /** The most columns in a wide container. */
  maxColumns?: TilesMaxColumns;
  /** The list's name for screen readers. */
  ariaLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Each child is one cell; false, null and blank strings add none, and fragments count their children. */
  children?: ReactNode;
}

const gaps = { compact: tokens.space.stack.md, regular: tokens.space.stack.lg };

/** Same-width cards read as a list. Like Web, columns and gap follow the measured width of the list, not the window:
 *  cells wrap row by row, each an exact share of the width, and a short last row keeps that width.
 *  A KjunCard in a cell fills the cell's height; other elements keep their own (give them flex: 1). */
export function KjunTiles({ gap, minItem, maxColumns, ariaLabel, style, children, ...rest }: KjunTilesProps) {
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
  // Floored to a hundredth so the cells and gaps of a row never add up past the width and wrap early.
  const cell = cellWidth == null ? "100%" as const : Math.floor(cellWidth * 100) / 100;
  // One wrapping row, not a View per row: a change of column count (the first measurement, a rotation) keeps every
  // cell under the same parent, so none remounts and loses its state. Cells in a line stretch to its tallest one.
  // The width is measured inside the root, so padding or a border in the app's style never pushes cells out.
  return (
    <View {...rest} role="list" aria-label={ariaLabel} style={[{ alignSelf: "stretch", minWidth: 0, opacity: measured ? 1 : 0 }, style]}>
      <View onLayout={onLayout} style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "stretch", rowGap: space, columnGap: space }}>
        {tileItems(children).map(([key, child]) => (
          <View key={key} role="listitem" style={{ width: cell, minWidth: 0 }}>
            <TileCellContext.Provider value={true}>
              {typeof child === "string" || typeof child === "number" ? <KText>{child}</KText> : child}
            </TileCellContext.Provider>
          </View>
        ))}
      </View>
    </View>
  );
}
