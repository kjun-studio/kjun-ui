import { Children, Fragment, isValidElement, type AriaAttributes, type CSSProperties, type ReactElement, type ReactNode } from "react";
import { tilesProps, type TilesGap, type TilesMaxColumns, type TilesMinItem } from "../../../shared/package-runtime/tiles";
export type { TilesGap, TilesMaxColumns, TilesMinItem };

export interface KjunTilesProps extends AriaAttributes {
  /** Space between cells. auto is compact (16) in a container narrower than 768 and regular (24) from it. */
  gap?: TilesGap;
  /** A cell's narrowest width before a column is dropped: sm 160, md 240, lg 320. */
  minItem?: TilesMinItem;
  /** The most columns in a wide container. */
  maxColumns?: TilesMaxColumns;
  id?: string;
  className?: string;
  style?: CSSProperties;
  /** Each child is one cell; false, null and empty strings add none, and fragments count their children. */
  children?: ReactNode;
}

/** The cells: every child, fragments opened, with nothing for false, null and empty strings. Keys keep the
 *  fragment path so a child inside a fragment never shares a key with one outside it. */
function items(children: ReactNode, path = ""): [string, ReactNode][] {
  return Children.toArray(children).flatMap((child, i): [string, ReactNode][] => {
    // Children.toArray keys elements ".0", ".$id"; other children take "#i" so the two never clash.
    const key = path + (isValidElement(child) && child.key != null ? child.key : "#" + i);
    if (isValidElement(child) && child.type === Fragment) return items((child as ReactElement<{ children?: ReactNode }>).props.children, key + "/");
    return child === "" ? [] : [[key, child]];
  });
}

/** Same-width cards read as a list. Columns and gap follow the container, not the screen. Like KjunStack it is not KJUN
 *  markup (data attributes, no kjun- class), so app children keep their own styles. */
export function KjunTiles({ gap, minItem, maxColumns, id, className, style, children, ...aria }: KjunTilesProps) {
  const props = tilesProps(gap, minItem, maxColumns);
  return (
    <div {...aria} id={id} className={className || undefined} style={style} role="list"
      data-kjun-tiles="" data-gap={props.gap} data-min-item={props.minItem} data-max-columns={props.maxColumns}>
      <div data-kjun-tiles-grid="">
        {items(children).map(([key, child]) => <div key={key} data-kjun-tile="" role="listitem">{child}</div>)}
      </div>
    </div>
  );
}
