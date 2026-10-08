
import { componentMixins } from "./component-mixins.js";
import { defaultIcons, resolveIcon } from "../../../shared/package-runtime/icon-registry";
export default {
  mixins: componentMixins,
  name: "DsIcon",
  inject: { kjunIcons: { default: null } },
  inheritAttrs: false,
  props: {
    name: { type: String, required: true },
    size: { type: [String, Number], default: null },
    spin: Boolean,
    filled: Boolean,
  },
  render(h) {
    const attrs = { ...this.$attrs };
    const named = attrs["aria-label"] || attrs["aria-labelledby"];
    const { nodes, filled } = resolveIcon(this.kjunIcons?.() || defaultIcons, this.name, this.filled);
    const children = nodes.map(([tag, attrs]) => h(tag, { attrs }));
    if (named) { attrs.role = "img"; delete attrs["aria-hidden"]; }
    else { attrs["aria-hidden"] = "true"; delete attrs.role; }
    return h(
      "svg",
      {
        key: this.spin ? "spin" : "idle",
        class: ["kjun-icon", "ds-icon", { "kjun-spin": this.spin }],
        on: this.$listeners,
        attrs: {
          xmlns: "http://www.w3.org/2000/svg",
          viewBox: "0 0 24 24",
          width: this.size || "1em",
          height: this.size || "1em",
          fill: filled ? "currentColor" : "none",
          stroke: filled ? "none" : "currentColor",
          "stroke-width": 2,
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          "aria-hidden": named ? undefined : "true",
          role: named ? "img" : undefined,
          ...attrs,
        },
      },
      children,
    );
  },
};
