import Vue from "vue";
import Kjun, { KjunProvider, KjunButton, KjunCard, type KjunCardProps } from "@kjun-ui/vue2";
import { cardColors, cssValues } from "./card-colors-values";

Vue.use(Kjun);
new Vue({
  data: () => ({ surface: "default" as KjunCardProps["surface"], changed: false, override: false, glass: false }),
  render(h) {
    const button = (label: string, click: () => void) => h(KjunButton, { on: { click } }, label);
    return h(KjunProvider, { style: cssValues(cardColors(this.changed, this.override)) }, [
      button("Toggle accent", () => { this.surface = this.surface === "default" ? "accent" : "default"; }),
      button("Use subtle", () => { this.surface = "subtle"; }),
      button("Toggle colors", () => { this.changed = !this.changed; }),
      button("Toggle overrides", () => { this.override = !this.override; }),
      button("Toggle glass", () => { this.glass = !this.glass; }),
      h("div", { attrs: { "data-testid": "card" }, style: { width: "320px" } }, [
        h(KjunCard, { props: { surface: this.glass ? "glass" : this.surface, border: true } }, "Project card"),
      ]),
    ]);
  },
}).$mount("#root");
