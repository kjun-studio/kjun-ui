import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");

// An icon a component draws by a fixed name must reach every app: either it is in the default set every KjunProvider
// registers, or the component brings it itself through componentIcons. Otherwise an app that registers only the
// defaults sees the "unknown icon" fallback (a question mark), as KjunSideNavigation's collapse toggle once did.
test("every icon name written into a component is in the default set or in componentIcons", async () => {
  const defaults = new Set(JSON.parse(await read("packages/icons/src/default-names.json")).outline);
  const scoped = new Set([...(await read("shared/package-runtime/component-icons.ts")).matchAll(/@kjun-ui\/icons\/icons\/([a-z0-9-]+)/g)].map(match => match[1]));
  const missing = [];
  for (const platform of ["react", "vue3", "native"]) {
    const dir = `packages/${platform}/src/`;
    for (const file of (await readdir(new URL("../" + dir, import.meta.url), { recursive: true })).filter(name => /\.tsx?$/.test(name))) {
      const source = await read(dir + file);
      // <KjunIcon ... name="x"> and name={condition ? "x" : "y"}: the string literals of the name attribute.
      for (const [, value] of source.matchAll(/<KjunIcon\b[^>]*?\bname=(\{[^}]*\}|"[^"]*")/g))
        // A literal compared in the condition (kind === "favorite" ? ...) is not an icon name.
        for (const [, name] of value.replace(/[!=]==\s*"[^"]*"/g, "").matchAll(/"([a-z0-9-]+)"/g))
          if (!defaults.has(name) && !scoped.has(name)) missing.push(`${dir}${file}: ${name}`);
    }
  }
  assert.deepEqual(missing, []);
});
