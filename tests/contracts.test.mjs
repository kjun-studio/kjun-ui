import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { transform } from "esbuild";
import { defaultConfig, parseConfig, exampleCode } from "../shared/demo-config.ts";
test("preview protocol rejects malformed, unknown and incompatible settings", () => {
  for (const invalid of [
    null,
    [],
    { ...defaultConfig, palette: "unknown" },
    { ...defaultConfig, theme: "product" },
    { ...defaultConfig, disabled: "false" },
    { ...defaultConfig, component: "input", size: "xl" },
    { ...defaultConfig, component: "modal", size: "xs" },
    { ...defaultConfig, execute: "alert(1)" },
  ])
    assert.throws(() => parseConfig(invalid));
  assert.deepEqual(parseConfig({ ...defaultConfig, palette: "violet" }), {
    ...defaultConfig,
    palette: "violet",
  });
});

test("published token and CSS contracts contain no product palette", async () => {
  const api = await import("../packages/tokens/dist/index.js");
  for (const removed of ["themes", "themeNames", "getTheme"])
    assert.equal(removed in api, false);
  assert.equal("themes" in api.tokens, false);
  assert.ok(api.colorRoles.includes("brand"));
  assert.ok(api.colorRoles.includes("shadow"));
  for (const name of ["tokens", "react", "vue2", "native"]) {
    const css = (await readFile("packages/" + name + "/dist/styles.css", "utf8")).replace(/\/\*[\s\S]*?\*\//g, "");
    assert.doesNotMatch(css, /data-kjun-theme|kjun-theme/i);
    assert.doesNotMatch(css, /--kjun-[\w-]+\s*:/); // Values must come from the consuming app.
    assert.doesNotMatch(css.replaceAll("#0000", "transparent"), /#[\da-f]{3,8}\b|rgba?\(/i);
  }
});
test("all generated examples are syntactically valid for their target framework", async () => {
  const compiler = (await import("vue-template-compiler")).default;
  for (const platform of ["vue2", "react", "native"])
    for (const component of ["button", "input", "modal"]) {
      const c = parseConfig({
        ...defaultConfig,
        component,
        palette: "dark",
        size: "lg",
        error: true,
        loading: true,
        readOnly: true,
        iconOnly: true,
      });
      const code = exampleCode(platform, c);
      if (platform === "vue2") {
        const parts = compiler.parseComponent(code);
        assert.deepEqual(compiler.compile(parts.template.content).errors, []);
        await transform(parts.script.content, { loader: "js" });
      } else await transform(code, { loader: "tsx" });
    }
});
test("package exports resolve without workspace source references", async () => {
  for (const name of ["tokens", "vue2", "react", "native"]) {
    const pkg = JSON.parse(await readFile("packages/" + name + "/package.json", "utf8"));
    await readFile("packages/" + name + "/" + pkg.types);
    for (const format of ["import", "require"])
      for (const entry of ["types", "default"])
        await readFile("packages/" + name + "/" + pkg.exports["."][format][entry]);
    const js = await readFile("packages/" + name + "/dist/index.js", "utf8");
    assert.ok(!js.includes("/workspace/"));
  }
});

test('all distributed JavaScript, styles and declarations are independent of app values', async () => {
  const {readdir}=await import('node:fs/promises');
  for(const name of ['tokens','vue2','react','native']){
    const directory=new URL(`../packages/${name}/dist/`,import.meta.url);
    for(const file of await readdir(directory)){
      if(!/\.(?:js|cjs|css|ts)$/.test(file))continue;
      const text=(await readFile(new URL(file,directory),'utf8')).replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/.*$/gm,'');
      assert.doesNotMatch(text,/(?:["']@\/|from\s+["'][^"']*(?:\/frontend\/src\/|store\/api|AssetLogo)|\b(?:Pretendard|Inter|Roboto|Arial|system-ui|sans-serif)\b)/i,`${name}/${file} contains an app dependency or font default`);
      assert.doesNotMatch(text,/(?:#[0-9a-f]{6}\b|rgba?\(\s*\d)/i,`${name}/${file} contains a fixed paint value`);
    }
  }
});

test('icon contract includes every upstream outline and filled variant', async()=>{
 const {icons,filledIcons}=await import('../packages/tokens/dist/icons.js');
 const { icons: outline, filledIcons: filled } = await import('../packages/icons/dist/defaults.js');
 assert.equal(Object.keys(icons).length,153);assert.equal(Object.keys(filledIcons).length,2);
 assert.deepEqual(icons,outline);assert.deepEqual(filledIcons,filled);
 for(const nodes of [...Object.values(icons),...Object.values(filledIcons)])assert.ok(nodes.length>0);
});
