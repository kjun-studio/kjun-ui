import { buildIcons } from './icon-build.mjs';
import { emitDeclarations, finalizeDeclarations } from "./declarations.mjs";
import { build } from "esbuild";
import { beginPackageBuild, finishPackageBuild, packageNames } from "./package-state.mjs";
import { responsiveCss } from "./responsive-css.mjs";
import {
  readFile,
  writeFile,
  mkdir,
  copyFile,
  rm,
} from "node:fs/promises";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
const require = createRequire(import.meta.url);
const postcss = require("postcss");
const root = resolve(import.meta.dirname, "..");
process.chdir(root);
const sourceFingerprint = await beginPackageBuild();
// Invalidate certification before removing any generated output.
for (const name of packageNames) {
  await rm(`packages/${name}/dist`, { recursive: true, force: true });
}
await buildIcons();
const input = JSON.parse(
  await readFile("packages/tokens/src/tokens.json", "utf8")
);
for (const name of ["tokens", "vue3", "react", "native"]) {
  const dir = "packages/" + name;
  await mkdir(dir + "/dist", { recursive: true });
  const entry = dir + "/src/index.ts";
  for (const format of ["esm", "cjs"])
    await build({
      entryPoints: [entry],
      outfile: dir + "/dist/index." + (format === "esm" ? "js" : "cjs"),
      bundle: true,
      format,
      target: "es2018",
      // Vue 3 components are TSX render functions compiled to h(type, props, ...children);
      // vue/jsx-runtime is for type checking only and would pass children as a prop.
      ...(name === "vue3"
        // tsconfigRaw keeps the type-only `vue` path mapping out of the bundle: the package imports `vue`.
        ? { jsx: "transform", jsxFactory: "h", jsxFragment: "Fragment", inject: ["packages/vue3/src/runtime/jsx.ts"], tsconfigRaw: {} }
        : { jsx: "automatic" }),
      packages: "external",
      banner:
        format === "esm" && (name === "react" || name === "native")
          ? { js: '"use client";' }
          : undefined,
    });
  if (name === 'native') for (const format of ['esm', 'cjs']) await build({
    entryPoints: [entry],
    outfile: dir + '/dist/index.web.' + (format === 'esm' ? 'js' : 'cjs'),
    bundle: true, format, target: 'es2018', jsx: 'automatic', packages: 'external',
    resolveExtensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.js', '.json'],
    banner: format === 'esm' ? { js: '"use client";' } : undefined,
  });
  if (name === "tokens") {
    await writeFile(dir + '/dist/icons.js', "export { icons, filledIcons } from '@kjun-ui/icons/defaults';\n");
    await writeFile(dir + '/dist/icons.cjs', "const { icons, filledIcons } = require('@kjun-ui/icons/defaults'); exports.icons = icons; exports.filledIcons = filledIcons;\n");
    await writeFile(dir + '/dist/icons.d.ts', "export type { IconNode } from '@kjun-ui/icons';\nexport { icons, filledIcons } from '@kjun-ui/icons/defaults';\n");
    await copyFile(dir + "/src/tokens.json", dir + "/dist/tokens.json");
  }
  if (name === "vue3") {
    // The plugin subpath shares component identities with the root export.
    await writeFile(dir + "/dist/plugin.js", 'export { default } from "./index.js";\n');
    await writeFile(dir + "/dist/plugin.cjs", 'module.exports = require("./index.cjs").default;\n');
    await writeFile(dir + "/dist/plugin.d.ts", 'export { default } from "./index.js";\n');
  }
  await emitDeclarations(name, entry);
}
// Field and choice-control rules are written without the scope; the build places them under .kjun-scope.
const forms = await readFile("packages/tokens/src/forms.css", "utf8");
const scoped = await postcss([
  {
    postcssPlugin: "scope-kjun",
    Rule(rule) {
      if (rule.parent?.type === "atrule" && /keyframes/.test(rule.parent.name))
        return;
      rule.selectors = rule.selectors.map((s) => ".kjun-scope " + s);
    },
  },
]).process(forms, {
  from: undefined,
});
const styleFiles=JSON.parse(await readFile("shared/web-style-sources.json","utf8"));
const responsive=responsiveCss((await readFile("packages/tokens/src/bindings.css","utf8"))+"\n"+(await readFile("packages/tokens/src/reset.css","utf8"))+"\n"+scoped.css+"\n"+(await Promise.all(styleFiles.map(file=>readFile("packages/tokens/src/"+file,"utf8")))).join("\n"), input);
const css = responsive;
for (const name of ["tokens", "vue3", "react", "native"]) {
  await writeFile("packages/" + name + "/dist/styles.css", css);
  await copyFile(
    "licenses/Tabler-LICENSE",
    "packages/" + name + "/dist/Tabler-LICENSE"
  );
  await copyFile("LICENSE", "packages/" + name + "/dist/LICENSE");
}
execFileSync("node", ["scripts/roles.mjs"], { stdio: "inherit" });
execFileSync("node", ["scripts/api.mjs"], { stdio: "inherit" });
for (const name of ["tokens", "vue3", "react", "native"]) await finalizeDeclarations(name);
await finishPackageBuild(sourceFingerprint);
console.log("Built five independent packages: ESM, CJS, types and scoped CSS.");
