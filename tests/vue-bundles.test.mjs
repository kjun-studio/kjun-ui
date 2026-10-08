import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { gzipSync } from "node:zlib";
import { build } from "esbuild";
import { assertCurrentConsumer } from "../scripts/package-state.mjs";

test("a packed Vue named import excludes unrelated UI, while either plugin entry registers every component", async () => {
  const { directory } = await assertCurrentConsumer();
  const bundle = async source => {
    const result = await build({
      stdin: { contents: source, resolveDir: directory },
      bundle: true, minify: true, write: false, format: "esm", platform: "browser",
      external: ["vue"], define: { "process.env.NODE_ENV": '"production"' },
    });
    return result.outputFiles[0];
  };
  const [button, all, plugin] = await Promise.all([
    bundle("import {DsButton} from '@kjun/vue2'; console.log(DsButton);"),
    bundle("import * as ui from '@kjun/vue2'; console.log(ui);"),
    bundle("import plugin from '@kjun/vue2/plugin'; console.log(plugin);"),
  ]);
  assert.doesNotMatch(button.text, /ds-table-query-state|kjun-toast-stack|ds-modal-overlay/);
  assert.ok(button.contents.length < all.contents.length * .45, "Button must not pull in most of the UI library");
  assert.ok(gzipSync(button.contents).length < gzipSync(all.contents).length * .45);
  assert.match(plugin.text, /ds-table-query-state/);
  const require = createRequire(directory + "/package.json");
  const ui = require("@kjun/vue2");
  assert.equal(require("@kjun/vue2/plugin"), ui.default, "CJS entries share component identities");
  const registered = new Map();
  ui.default.install({ component: (name, component) => registered.set(name, component) });
  const publicNames = Object.keys(ui).filter(name => /^(Ds|Kjun)/.test(name));
  assert.deepEqual([...registered.keys()].sort(), publicNames.sort());
  for (const name of publicNames) assert.equal(registered.get(name), ui[name]);
  assert.equal(ui.DsButton.components.DsIcon, ui.DsIcon);
  assert.equal(ui.DsButton.components.DsTable, undefined);
});
