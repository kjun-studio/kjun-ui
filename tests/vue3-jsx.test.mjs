import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { assertCurrentConsumer } from "../scripts/package-state.mjs";

// The Vue 3 package compiles JSX to its own h(): React-style conditional children must render nothing.
test("Vue 3 JSX renders false and null children as nothing and passes component children as slots", async () => {
  const { vue3Directory } = await assertCurrentConsumer();
  const modules = vue3Directory + "/node_modules";
  const output = await build({
    stdin: {
      contents: `
        import { createSSRApp, defineComponent } from 'vue';
        import { renderToString } from 'vue/server-renderer';
        const Box = defineComponent((_, { slots }) => () => <section>{slots.default?.()}{slots.extra?.()}</section>);
        export const render = () => renderToString(createSSRApp(() => <div>
          <span>{false}</span><span>{null}</span><span>{0}</span><b>{false && <i />}</b>
          <Box>text {false}</Box><Box>{{ default: () => 'slot', extra: () => <em>x</em> }}</Box>
        </div>));`,
      resolveDir: process.cwd(), loader: "tsx",
    },
    bundle: true, write: false, format: "esm", platform: "node",
    jsx: "transform", jsxFactory: "h", jsxFragment: "Fragment", inject: ["packages/vue3/src/runtime/jsx.ts"], tsconfigRaw: {},
    alias: { vue: modules + "/vue/index.mjs", "vue/server-renderer": modules + "/vue/server-renderer/index.mjs" },
    nodePaths: [modules], define: { "process.env.NODE_ENV": '"production"' },
  });
  const { render } = await import("data:text/javascript;base64," + Buffer.from(output.outputFiles[0].contents).toString("base64"));
  const html = (await render()).replace(/<!--.*?-->/g, "");
  assert.equal(html, "<div><span></span><span></span><span>0</span><b></b><section>text </section><section>slot<em>x</em></section></div>");
});

// JSX compiles to calls of the injected h(); a local binding named h (a parameter, variable or callback
// argument) silently replaces it inside that scope and breaks rendering there.
test("Vue 3 sources never bind a local name h that would shadow the JSX factory", async () => {
  const { readdir, readFile } = await import("node:fs/promises");
  const ts = (await import("typescript")).default;
  const shadows = [];
  for (const dir of ["packages/vue3/src", "packages/vue3/src/runtime"])
    for (const file of (await readdir(dir)).filter((name) => name.endsWith(".tsx"))) {
      const source = ts.createSourceFile(file, await readFile(dir + "/" + file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const visit = (node) => {
        if ((ts.isParameter(node) || ts.isVariableDeclaration(node)) && ts.isIdentifier(node.name) && node.name.text === "h")
          shadows.push(`${dir}/${file}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`);
        ts.forEachChild(node, visit);
      };
      visit(source);
    }
  assert.deepEqual(shadows, []);
});
