import { createRequire } from "node:module";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
// Scripts that read component options load the built CommonJS package.
export const requireVue3Package = () => createRequire(import.meta.url)(resolve(root, "packages/vue3/dist/index.cjs"));
