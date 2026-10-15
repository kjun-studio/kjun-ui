import Module, { createRequire } from "node:module";
import { resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const vue3 = resolve(root, "packages/vue3") + sep;
// The repository keeps Vue 2 as `vue` until it is removed; packages/vue3 resolves Vue 3 from vue3-runtime.
const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if ((request === "vue" || request.startsWith("vue/")) && parent?.filename?.startsWith(vue3))
    request = request.replace(/^vue/, "vue3-runtime");
  return resolveFilename.call(this, request, parent, ...rest);
};
export const requireVue3Package = () => createRequire(import.meta.url)(resolve(vue3, "dist/index.cjs"));
