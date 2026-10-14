import type { App, Component } from "vue";
import * as components from "./components";

export interface KjunPluginOptions {
  /** Keep a component the app already registered under the same name. */
  skipExisting?: boolean;
}

const hyphenate = (name: string) => name.replace(/\B([A-Z])/g, "-$1").toLowerCase();

export default {
  install(app: App, { skipExisting = false }: KjunPluginOptions = {}) {
    for (const [name, component] of Object.entries(components) as [string, Component][]) {
      // Templates resolve <KjunButton> and <kjun-button> to either registration.
      const existing = app.component(name) ?? app.component(hyphenate(name));
      if (existing && existing !== component) {
        if (skipExisting) continue;
        console.warn("[kjun] " + name + " was already registered and is replaced by KJUN's component; install with { skipExisting: true } to keep it.");
      }
      app.component(name, component);
    }
  },
};
