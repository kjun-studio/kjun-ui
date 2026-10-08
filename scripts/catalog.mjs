import { readFile, access, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";
const root = resolve(import.meta.dirname, "..");
const json = async (path) =>
  JSON.parse(await readFile(resolve(root, path), "utf8"));
const [catalog, api, guides, dependencies] = await Promise.all(
  [
    "shared/component-catalog.json",
    "apps/docs/lib/generated/api.json",
    "shared/component-guides.json",
    "shared/component-dependencies.json",
  ].map(json)
);
const fail = (message) => {
  throw Error("Catalog contract: " + message);
};
if (new Set(catalog.map(x => x.name)).size !== catalog.length) fail("duplicate component name");
if (new Set(catalog.map(x => x.source)).size !== catalog.length) fail("duplicate implementation mapping");
const helpers = await json("shared/platform-helpers.json");
const publicNames = catalog
  .filter((x) => x.kind !== "internal")
  .map((x) => x.name);
const names = [...publicNames, "KjunProvider", "KjunFeedbackProvider"];
const exampleRoot = resolve(root, "previews/catalog");
const examples = (
  await Promise.all(
    (await readdir(exampleRoot))
      .filter((file) => /^example.*\.ts$/.test(file))
      .map((file) => readFile(resolve(exampleRoot, file), "utf8"))
  )
).join("\n");
for (const entry of catalog) {
  for (const platform of ["vue2", "react", "native"])
    if (
      entry.platforms[platform]?.status !== "implemented" ||
      entry.platforms[platform]?.verification !== "passed"
    )
      fail("incomplete platform " + platform + " " + entry.name);
  if (!entry.verificationEvidence)
    fail("missing verification record " + entry.name);
  await access(resolve(root, entry.verificationEvidence));
  for (const platform of ["vue2", "react", "native"]) {
    if (!entry.sources?.[platform]) fail("missing platform source " + entry.name);
    await access(resolve(root, entry.sources[platform]));
  }
  if (!dependencies[entry.name]) fail("untracked imports " + entry.name);
  if (entry.kind === "internal" && !names.includes(entry.owner))
    fail("missing internal owner " + entry.name);
  if (!entry.docs || !entry.example || !entry.tests?.length)
    fail("missing evidence links " + entry.name);
  for (const path of [entry.example, ...entry.tests])
    await access(resolve(root, path));
  if (
    entry.kind !== "internal" &&
    (!guides[entry.name] ||
      entry.docs !== "/components/" + guides[entry.name].slug)
  )
    fail("missing docs " + entry.name);
}
for (const platform of ["vue2", "react", "native"]) {
  const file = resolve(root, `packages/${platform}/dist/index.d.ts`);
  const program = ts.createProgram([file], {
    skipLibCheck: true,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    module: ts.ModuleKind.ESNext,
  });
  const checker = program.getTypeChecker(),
    symbol = checker.getSymbolAtLocation(program.getSourceFile(file));
  const symbols = checker.getExportsOfModule(symbol),
    exported = symbols.map((x) => x.name);
  const runtimeNames = symbols
    .filter((s) => {
      const target =
        s.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(s) : s;
      return target.flags & ts.SymbolFlags.Value;
    })
    .map((s) => s.name)
    .filter((name) => /^(Ds|Kjun)/.test(name));
  for (const name of runtimeNames)
    if (
      !names.includes(name) &&
      !helpers.some(
        (item) => item.name === name && item.platform === platform && item.docs
      )
    )
      fail("undocumented runtime export " + platform + " " + name);
  for (const helper of helpers.filter((item) => item.platform === platform))
    if (!exported.includes(helper.name)) fail("missing helper " + helper.name);
  for (const name of names) {
    if (!exported.includes(name))
      fail(`missing ${platform} type export ${name}`);
    if (!api[name]?.[platform]) fail(`missing ${platform} API ${name}`);
    if (!new RegExp(`case ["']${name}["']:`).test(examples))
      fail("missing runnable example " + name);
  }
  const bundle = await readFile(
    resolve(root, `packages/${platform}/dist/index.js`),
    "utf8"
  );
  if (
    /(?:from\s+["']@\/|\/frontend\/src\/|searchUrl|theme\s*[:=]\s*["'][\w-]+["'])/.test(
      bundle
    )
  )
    fail("app dependency in " + platform);
}
const require = createRequire(import.meta.url),
  vue = require(resolve(root, "packages/vue2/dist/index.cjs")),
  react = require(resolve(root, "packages/react/dist/index.cjs"));
for (const name of names)
  for (const [platform, ui] of [
    ["vue2", vue],
    ["react", react],
  ])
    if (!ui[name]) fail("runtime export " + platform + " " + name);
for (const internal of catalog.filter((x) => x.kind === "internal"))
  if (vue[internal.name] || react[internal.name])
    fail("internal exported " + internal.name);
console.log(
  `Catalog aligned: ${catalog.length} implementations, ${publicNames.length} public components, 5 internal owners, three platforms, API/docs/examples/tests.`
);
