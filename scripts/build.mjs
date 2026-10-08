import { buildIcons } from './icon-build.mjs';
import { emitDeclarations, finalizeDeclarations } from "./declarations.mjs";
import { build } from "esbuild";
import { beginPackageBuild, finishPackageBuild, packageNames } from "./package-state.mjs";
import { componentModule } from "./vue-component.mjs";
import { createVueStyleTheme } from "../packages/vue2/style-theme.mjs";
import { responsiveCss } from "./responsive-css.mjs";
import { createHash } from "node:crypto";
import {
  readFile,
  writeFile,
  mkdir,
  copyFile,
  rm,
} from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
const require = createRequire(import.meta.url);
const compiler = require("vue-template-compiler");
const { compileStyle } = require("@vue/component-compiler-utils");
const transpile = require("vue-template-es2015-compiler");
const postcss = require("postcss"),
  tailwind = require("tailwindcss");
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
const vueRoot = resolve("packages/vue2/src");
const vueStyles = new Map();
const vuePlugin = {
  name: "vue2-precompile",
  setup(b) {
    b.onResolve({ filter: /^@kjun-adapter\// }, (args) => ({
      path: resolve(
        vueRoot,
        "adapters",
        args.path.slice("@kjun-adapter/".length)
      ),
    }));
    b.onLoad({ filter: /\.vue$/ }, async (args) => {
      const source = await readFile(args.path, "utf8");
      const d = compiler.parseComponent(source);
      const scopeId =
        "data-v-kjun-" +
        createHash("sha256")
          .update(args.path.replace(root, "."))
          .digest("hex")
          .slice(0, 8);
      const compiled = compiler.compile(d.template?.content || "<div/>", {
        whitespace: "condense",
      });
      if (compiled.errors.length) throw new Error(compiled.errors.join("\n"));
      const render = transpile(
        "var render = function(){" +
          compiled.render +
          "};var staticRenderFns=[" +
          compiled.staticRenderFns
            .map((s) => "function(){" + s + "}")
            .join(",") +
          "];"
      );
      const styles = [];
      for (const style of d.styles) {
        const contents = style.src
          ? await readFile(resolve(dirname(args.path), style.src), "utf8")
          : style.content;
        const compiledStyle = compileStyle({
          source: contents,
          filename: args.path,
          id: scopeId,
          scoped: !!style.scoped,
        });
        if (compiledStyle.errors.length)
          throw Error(compiledStyle.errors.join("\n"));
        styles.push(compiledStyle.code);
      }
      // Both bundle formats visit the same files; completion order is arbitrary.
      vueStyles.set(args.path, styles);
      return {
        loader: "js",
        resolveDir: dirname(args.path),
        contents: componentModule(d.script?.content || "export default {}", render, {
          filename: args.path,
          template: !!d.template,
          scopeId: d.styles.some(style => style.scoped) ? scopeId : undefined,
        }),
      };
    });
  },
};
for (const name of ["tokens", "vue2", "react", "native"]) {
  const dir = "packages/" + name;
  await mkdir(dir + "/dist", { recursive: true });
  const entry = dir + "/src/index." + (name === "vue2" ? "js" : "ts");
  for (const format of ["esm", "cjs"])
    await build({
      entryPoints: [entry],
      outfile: dir + "/dist/index." + (format === "esm" ? "js" : "cjs"),
      bundle: true,
      format,
      target: "es2018",
      jsx: "automatic",
      packages: "external",
      plugins: name === "vue2" ? [vuePlugin] : [],
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
    await writeFile(dir + '/dist/icons.js', "export { icons, filledIcons } from '@kjun/icons/defaults';\n");
    await writeFile(dir + '/dist/icons.cjs', "const { icons, filledIcons } = require('@kjun/icons/defaults'); exports.icons = icons; exports.filledIcons = filledIcons;\n");
    await writeFile(dir + '/dist/icons.d.ts', "export type { IconNode } from '@kjun/icons';\nexport { icons, filledIcons } from '@kjun/icons/defaults';\n");
    await copyFile(dir + "/src/tokens.json", dir + "/dist/tokens.json");
  }
  if (name === "vue2") {
    await copyFile(dir + "/src/index.d.ts", dir + "/dist/index.d.ts");
    // Thin aliases share component identities with the backwards-compatible root export.
    await writeFile(dir + "/dist/plugin.js", 'export { default } from "./index.js";\n');
    await writeFile(dir + "/dist/plugin.cjs", 'module.exports = require("./index.cjs").default;\n');
    await writeFile(dir + "/dist/plugin.d.ts", 'export { default } from "./index.js";\n');
  } else await emitDeclarations(name, entry);
}
const styleUtilities = JSON.parse(await readFile("packages/vue2/style-utilities.json", "utf8"));
const utilities = await postcss([
  tailwind({
    content: ["packages/vue2/src/**/*.vue", "packages/vue2/src/**/*.js"],
    important: ".kjun-scope",
    corePlugins: { preflight: false },
    theme: createVueStyleTheme(input, styleUtilities),
  }),
]).process("@tailwind base;\n@tailwind utilities;", { from: undefined });
// Utilities require Tailwind's per-element transform/ring/shadow defaults.
// Scope those defaults too, and replace Tailwind's built-in paint values.
const utilityRoot = postcss.parse(utilities.css);
utilityRoot.walkRules(rule => {
  if (rule.selector === "*, ::before, ::after") {
    rule.selector = ".kjun-scope, .kjun-scope *, .kjun-scope::before, .kjun-scope::after, .kjun-scope *::before, .kjun-scope *::after";
  } else if (rule.selector === "::backdrop") {
    rule.selector = ".kjun-scope::backdrop, .kjun-scope *::backdrop";
  } else return;
  rule.walkDecls("--tw-ring-color", decl => { decl.value = "var(--kjun-focus-ring)"; });
  rule.walkDecls("--tw-ring-offset-color", decl => { decl.value = "var(--kjun-surface)"; });
});
const forms = await readFile("packages/vue2/src/styles/forms.css", "utf8");
const scoped = await postcss([
  {
    postcssPlugin: "scope-kjun",
    Rule(rule) {
      if (rule.parent?.type === "atrule" && /keyframes/.test(rule.parent.name))
        return;
      rule.selectors = rule.selectors.map((s) => ".kjun-scope " + s);
    },
  },
]).process(forms + "\n" + [...new Set(
  [...vueStyles.keys()].sort().flatMap(path => vueStyles.get(path))
)].join("\n"), {
  from: undefined,
});
const styleFiles=JSON.parse(await readFile("shared/web-style-sources.json","utf8"));
const css=responsiveCss((await readFile("packages/tokens/src/bindings.css","utf8"))+"\n"+(await readFile("packages/tokens/src/reset.css","utf8"))+"\n"+utilityRoot.toString()+"\n"+scoped.css+"\n"+(await Promise.all(styleFiles.map(file=>readFile("packages/tokens/src/"+file,"utf8")))).join("\n"), input);
for (const name of ["tokens", "vue2", "react", "native"]) {
  await writeFile("packages/" + name + "/dist/styles.css", css);
  await copyFile(
    "licenses/Tabler-LICENSE",
    "packages/" + name + "/dist/Tabler-LICENSE"
  );
  await copyFile("LICENSE", "packages/" + name + "/dist/LICENSE");
}
execFileSync("node", ["scripts/roles.mjs"], { stdio: "inherit" });
execFileSync("node", ["scripts/api.mjs"], { stdio: "inherit" });
for (const name of ["tokens", "vue2", "react", "native"]) await finalizeDeclarations(name);
await finishPackageBuild(sourceFingerprint);
console.log("Built five independent packages: ESM, CJS, types and scoped CSS.");
