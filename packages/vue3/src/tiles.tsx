import { Comment, Fragment, Text, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNode, type VNodeChild } from "vue";
import { defineComponent } from "./runtime/component";
import { tilesProps, type TilesGap, type TilesMaxColumns, type TilesMinItem } from "../../../shared/package-runtime/tiles";
export type { TilesGap, TilesMaxColumns, TilesMinItem };

type SlotNode = VNode | string | number | boolean | null | undefined | SlotNode[];
/** The cells: every node, v-for and template fragments and render-function arrays opened, with nothing for comments
 *  (v-if), false, null and blank text. Keys keep the fragment path so a node inside a fragment never shares a key with one outside it. */
function items(nodes: SlotNode[] | undefined, path = ""): [string, VNode | string | number][] {
  return (nodes ?? []).flatMap((node, i): [string, VNode | string | number][] => {
    if (node == null || typeof node === "boolean") return [];
    if (Array.isArray(node)) return items(node, path + "." + i + "/");
    if (typeof node === "string" || typeof node === "number") return String(node).trim() ? [[path + "." + i, node]] : [];
    const key = path + (node.key != null ? String(node.key) : "." + i);
    if (node.type === Fragment) return items(node.children as SlotNode[], key + "/");
    return node.type === Comment || (node.type === Text && !String(node.children).trim()) ? [] : [[key, node]];
  });
}

const kjunTilesProps = {
  /** Space between cells. auto is compact (16) in a container narrower than 768 and regular (24) from it. */
  gap: { type: String as PropType<TilesGap>, default: "auto" },
  /** A cell's narrowest width before a column is dropped: sm 160, md 240, lg 320. */
  minItem: { type: String as PropType<TilesMinItem>, default: "md" },
  /** The most columns in a wide container. */
  maxColumns: { type: [Number, String] as PropType<TilesMaxColumns | `${TilesMaxColumns}`>, default: 4 },
} as const;
export type KjunTilesProps = ExtractPublicPropTypes<typeof kjunTilesProps>;
/** Same-width cards read as a list. Columns and gap follow the container, not the screen. Like KjunStack it is not KJUN
 *  markup (data attributes, no kjun- class), so app children keep their own styles. id, aria-*, class and style fall through to the root. */
export const KjunTiles = defineComponent({
  name: "KjunTiles",
  props: kjunTilesProps,
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots }) {
    return () => {
      const resolved = tilesProps(props.gap, props.minItem, props.maxColumns);
      return (
        <div role="list" data-kjun-tiles="" data-gap={resolved.gap} data-min-item={resolved.minItem} data-max-columns={resolved.maxColumns}>
          <div data-kjun-tiles-grid="">
            {items(slots.default?.() as SlotNode[] | undefined).map(([key, node]) => <div key={key} data-kjun-tile="" role="listitem">{node}</div>)}
          </div>
        </div>
      );
    };
  },
});
