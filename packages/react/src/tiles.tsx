import type { HTMLAttributes, ReactNode, Ref } from "react";
import { tilesProps, type TilesGap, type TilesMaxColumns, type TilesMinItem } from "../../../shared/package-runtime/tiles";
import { tileItems } from "../../../shared/package-runtime/tiles-children";
export type { TilesGap, TilesMaxColumns, TilesMinItem };

/** Other div attributes (aria-*, data-*, id, events) pass to the root, as on KjunStack; the root keeps role="list". */
export interface KjunTilesProps extends Omit<HTMLAttributes<HTMLDivElement>, "role" | "children"> {
  /** Space between cells. auto is compact (16) in a container narrower than 768 and regular (24) from it. */
  gap?: TilesGap;
  /** A cell's narrowest width before a column is dropped: sm 160, md 240, lg 320. */
  minItem?: TilesMinItem;
  /** The most columns in a wide container. */
  maxColumns?: TilesMaxColumns;
  ref?: Ref<HTMLDivElement>;
  /** Each child is one cell; false, null and blank strings add none, and fragments count their children. */
  children?: ReactNode;
}

/** Same-width cards read as a list. Columns and gap follow the container, not the screen. Like KjunStack it is not KJUN
 *  markup (data attributes, no kjun- class), so app children keep their own styles. */
export function KjunTiles({ gap, minItem, maxColumns, className, children, ...rest }: KjunTilesProps) {
  const props = tilesProps(gap, minItem, maxColumns);
  return (
    <div {...rest} className={className || undefined} role="list"
      data-kjun-tiles="" data-gap={props.gap} data-min-item={props.minItem} data-max-columns={props.maxColumns}>
      <div data-kjun-tiles-grid="">
        {tileItems(children).map(([key, child]) => <div key={key} data-kjun-tile="" role="listitem">{child}</div>)}
      </div>
    </div>
  );
}
