import { build } from "esbuild";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Page } from "@playwright/test";
// @ts-ignore Node-only check also protects fixtures used outside the Playwright runner.
import { assertCurrentConsumer } from "../../scripts/package-state.mjs";

const cache = new Map<string, { script: string; css: string }>();
let consumer: ReturnType<typeof assertCurrentConsumer> | undefined;
export async function openFixture(
  page: Page,
  platform: string,
  query = "",
  family = "styles",
  mode = "production",
  standalone = false
) {
  const cacheKey = family + ":" + platform + ":" + mode + ":" + standalone;
  let fixture = cache.get(cacheKey);
  if (!fixture) {
    const { directory } = await (consumer ??= assertCurrentConsumer());
    const modules = directory + "/node_modules";
    const alias: Record<string, string> = {
      react: modules + "/react",
      "react-dom": modules + "/react-dom",
      vue: modules + "/vue/dist/vue.runtime.esm.js",
      "react-native": modules + "/react-native-web/dist/index.js",
      "react-native-svg":
        modules + "/react-native-svg/lib/module/ReactNativeSVG.web.js",
      "@kjun-ui/tokens/icons": modules + "/@kjun-ui/tokens/dist/icons.js",
    };
    for (const name of ["icons", "tokens", "react", "vue2", "native"])
      alias["@kjun-ui/" + name] = modules + "/@kjun-ui/" + name;
    alias["@kjun-ui/icons/defaults"] = modules + "/@kjun-ui/icons/dist/defaults.js";
    alias["@kjun-ui/icons/metadata"] = modules + "/@kjun-ui/icons/dist/metadata.js";
    alias["@kjun-ui/icons/all"] = modules + "/@kjun-ui/icons/dist/all.js";
    alias["@kjun-ui/icons/icons"] = modules + "/@kjun-ui/icons/dist/icons";
    const result = await build({
      entryPoints: [
        resolve(
          (family === "catalog" ? "previews/catalog/" : "tests/fixtures/" + family + "-") + platform +
            (platform === "vue2" ? ".ts" : ".tsx")
        ),
      ],
      bundle: true,
      write: false,
      format: "iife",
      platform: "browser",
      jsx: "automatic",
      alias,
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
        "process.env.NODE_ENV": JSON.stringify(mode),
        __DEV__: mode === "development" ? "true" : "false",
        global: "globalThis",
      },
    });
    fixture = {
      script: result.outputFiles[0].text,
      css: (await readFile(modules + "/@kjun-ui/tokens/dist/styles.css", "utf8")) +
        (family === "catalog" ? standalone
          ? '.catalog-root{padding:24px}.catalog-stack{display:flex;flex-direction:column;gap:16px}.catalog-group{display:flex;gap:12px;flex-wrap:wrap}'
          : await readFile("apps/docs/public/previews/demo.css", "utf8") : ""),
    };
    cache.set(cacheKey, fixture);
  }
  const { css, script } = fixture;
  await page.route("**/__style-contract**", (route) =>
    route.fulfill({
      contentType: "text/html; charset=utf-8",
      body:
        "<!doctype html><html><head><style>" +
        css +
        "</style></head><body>" +
        '<div id="root"></div><script>' +
        script.replaceAll("</script", "<\\/script") +
        "</script></body></html>",
    })
  );
  await page.goto("/__style-contract" + query);
}
