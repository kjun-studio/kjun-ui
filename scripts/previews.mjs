import { foundationPreviewCss } from "../shared/foundation-examples.ts";
import { build } from "esbuild";
import { assertCurrentConsumer } from "./package-state.mjs";
import { generateExamples } from "./examples.mjs";
import { buildUsageGenerators } from "./usage-examples.mjs";
await generateExamples();
await buildUsageGenerators();
import {
  mkdir,
  readFile,
  writeFile,
  copyFile,
  cp,
  readdir,
} from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
process.chdir(root);
const { directory: consumer } = await assertCurrentConsumer();
const modules = consumer + "/node_modules";
const out = resolve("apps/docs/public/previews");
await mkdir(out, { recursive: true });
await mkdir("apps/docs/public/fonts", { recursive: true });
for (const [name, family] of [
  ["inter", "Inter"],
  ["42dot-sans", "42dot Sans"],
]) {
  const src = resolve("node_modules/@fontsource-variable/" + name),
    target = "apps/docs/public/fonts/" + name;
  await mkdir(target, { recursive: true });
  await cp(src + "/files", target + "/files", { recursive: true });
  await writeFile(
    target + "/index.css",
    (
      await readFile(src + "/index.css", "utf8")
    ).replaceAll(family + " Variable", family)
  );
  await copyFile(src + "/LICENSE", target + "/LICENSE");
}
await copyFile(
  "node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  "apps/docs/public/fonts/PretendardVariable.woff2"
);
await copyFile(
  "licenses/Pretendard-LICENSE",
  "apps/docs/public/fonts/Pretendard-LICENSE"
);
await writeFile(
  "apps/docs/public/fonts/fonts.css",
  '@import url("./inter/index.css");\n@import url("./42dot-sans/index.css");\n@font-face{font-family:Pretendard;font-style:normal;font-weight:100 900;font-display:swap;src:url("./PretendardVariable.woff2") format("woff2-variations")}'
);
await copyFile(
  modules + "/@kjun/tokens/dist/styles.css",
  out + "/components.css"
);
await writeFile(
  out + "/demo.css",
  ".catalog-example[data-component=\"DsPopover\"] .catalog-render{display:flex;justify-content:center}" +
  "@media(max-width:480px){.catalog-root:has(.catalog-example[data-component=\"DsAlert\"]){padding:16px}}" +
  foundationPreviewCss + "html,body{margin:0;background:transparent;font-size:16px}body{font-family:Inter,Pretendard,system-ui,sans-serif}button,input{font:inherit}.demo-stage{box-sizing:border-box;min-height:260px;padding:28px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;background:var(--kjun-surface)}.demo-control{display:flex;justify-content:center;width:100%}.demo-field{width:100%;max-width:320px}.catalog-root{padding:24px;background:var(--kjun-surface);color:var(--kjun-text);min-height:0;box-sizing:border-box}.catalog-example{max-width:760px;margin:0;min-width:0}.catalog-example+.catalog-example{margin-top:24px}.catalog-render{width:100%;min-width:0}.catalog-stack{display:flex;flex-direction:column;gap:16px}.catalog-group{display:flex;flex-wrap:wrap;align-items:center;gap:12px}.catalog-example>output{display:block;margin-top:12px;font-size:12px}.demo-stage output{font-size:12px;color:var(--kjun-text-secondary);line-height:20px;text-align:center}.kjun-modal-dialog{display:flex;flex-direction:column;min-height:0;max-height:inherit;height:inherit}"
);
const aliases = {
  react: modules + "/react",
  "react-dom": modules + "/react-dom",
  vue: modules + "/vue/dist/vue.runtime.esm.js",
  "react-native": modules + "/react-native-web/dist/index.js",
  "react-native-svg":
    modules + "/react-native-svg/lib/module/ReactNativeSVG.web.js",
};
for (const name of ["icons", "tokens", "vue2", "react", "native"])
  aliases["@kjun/" + name] = modules + "/@kjun/" + name;
aliases["@kjun/icons/defaults"] = modules + "/@kjun/icons/dist/defaults.js";
aliases["@kjun/icons/metadata"] = modules + "/@kjun/icons/dist/metadata.js";
aliases["@kjun/icons/all"] = modules + "/@kjun/icons/dist/all.js";
aliases["@kjun/icons/icons"] = modules + "/@kjun/icons/dist/icons";
for (const name of ["vue2", "react", "native"]) aliases["@kjun/" + name + "/styles.css"] = modules + "/@kjun/" + name + "/dist/styles.css";
aliases["@kjun/tokens/icons"] = modules + "/@kjun/tokens/dist/icons.js";
for (const entry of [
  "vue2",
  "react",
  "native",
  "typography",
  "catalog/vue2",
  "catalog/react",
  "catalog/native",
]) {
  const name = entry.replace("catalog/", "catalog-");
  await build({
    entryPoints: [
      "previews/" + entry + (entry.endsWith("vue2") ? ".ts" : ".tsx"),
    ],
    outfile: out + "/" + name + ".js",
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2020",
    jsx: "automatic",
    minify: true,
    alias: aliases,
    mainFields: ["browser", "module", "main"],
    resolveExtensions: [
      ".web.tsx",
      ".web.ts",
      ".web.js",
      ".tsx",
      ".ts",
      ".js",
      ".json",
    ],
    define: {
      "process.env.NODE_ENV": '"production"',
      __DEV__: "false",
      // React Native Web의 애니메이션 정리 경로는 global을 참조한다.
      global: "globalThis",
    },
  });
  await writeFile(
    out + "/" + name + ".html",
    '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>KJUN ' +
      name +
      ' preview</title><link rel="stylesheet" href="/fonts/fonts.css"><link rel="stylesheet" href="./components.css"><link rel="stylesheet" href="./demo.css"></head><body><div id="root"></div><script type="module" src="./' +
      name +
      '.js"></script></body></html>'
  );
}
console.log("All catalog previews built from installed tarballs.");
const fontFaces = [];
for (const name of ["inter", "42dot-sans"])
  fontFaces.push(
    (
      await readFile("apps/docs/public/fonts/" + name + "/index.css", "utf8")
    ).replaceAll("url(./files/", "url(/fonts/" + name + "/files/")
  );
fontFaces.push(
  '@font-face{font-family:Pretendard;font-style:normal;font-weight:100 900;font-display:swap;src:url(/fonts/PretendardVariable.woff2) format("woff2-variations")}'
);
await writeFile(
  "apps/docs/app/fonts.generated.css",
  "/* Generated by scripts/previews.mjs. */\n" + fontFaces.join("\n")
);
