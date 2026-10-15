import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import ts from "typescript";
import { vue3Contracts } from "./vue3-api.mjs";
import { requireVue3Package } from "./vue3-runtime.mjs";
const root = resolve(import.meta.dirname, "..");
const ui = requireVue3Package();
// Components are the Kjun* runtime exports whose component name matches the export; composables are not.
const exports = Object.keys(ui)
  .filter((name) => /^Kjun/.test(name) && typeof ui[name] === "object" && ui[name]?.name === name)
  .sort();
const api = {};
const vue3 = vue3Contracts(exports);
for (const name of exports) {
  if (!vue3[name]) throw Error("missing Vue 3 export " + name);
  api[name] = { vue3: vue3[name].props, events: vue3[name].events, slots: vue3[name].slots };
}
for (const platform of ["react", "native"]) {
  const entry = resolve(root, `packages/${platform}/src/index.ts`);
  const program = ts.createProgram([entry], {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    esModuleInterop: true,
    skipLibCheck: true,
    strict: true,
  });
  const checker = program.getTypeChecker(),
    file = program.getSourceFile(entry),
    module = checker.getSymbolAtLocation(file);
  for (const symbol of checker.getExportsOfModule(module)) {
    const name = symbol.name;
    if (!exports.includes(name)) continue;
    const target =
      symbol.flags & ts.SymbolFlags.Alias
        ? checker.getAliasedSymbol(symbol)
        : symbol;
    const type = checker.getTypeOfSymbolAtLocation(
      target,
      target.valueDeclaration || file
    );
    let signature = type.getCallSignatures()[0],
      props;
    if (signature) {
      const param = signature.getParameters()[0];
      if (param)
        props = checker.getTypeOfSymbolAtLocation(
          param,
          param.valueDeclaration || file
        );
    } else {
      const ctor = type.getConstructSignatures()[0];
      const instance = ctor?.getReturnType();
      const member = instance?.getProperty("props");
      if (member) props = checker.getTypeOfSymbolAtLocation(member, file);
    }
    const rows = (props ? checker.getPropertiesOfType(props) : [])
      .filter(
        (p) =>
          [
            "children",
            "disabled",
            "onClick",
            "onPress",
            "onChange",
            "onChangeText",
            "className",
            "style",
            "min",
            "max",
            "placeholder",
            "readOnly",
            "rows",
            "required",
            "autoFocus",
            "onKeyDown",
            "type",
            "name",
            "id",
          ].includes(p.name) ||
          p.declarations?.some(
            (d) =>
              d
                .getSourceFile()
                .fileName.includes(`/packages/${platform}/src/`) ||
              d.getSourceFile().fileName.includes("/packages/tokens/") ||
              d.getSourceFile().fileName.includes("/shared/package-runtime/")
          )
      )
      .map((p) => ({
        name: p.name,
        type: checker.typeToString(
          checker.getTypeOfSymbolAtLocation(p, p.valueDeclaration || file),
          file,
          ts.TypeFormatFlags.NoTruncation
        ),
        required: !(p.flags & ts.SymbolFlags.Optional),
        default: "—",
        description: ts.displayPartsToString(
          p.getDocumentationComment(checker)
        ),
      }));
    api[name][platform] = rows;
  }
}
await mkdir(resolve(root, "apps/docs/lib/generated"), { recursive: true });
await writeFile(
  resolve(root, "apps/docs/lib/generated/api.json"),
  JSON.stringify(api, null, 2) + "\n"
);
console.log(
  `Generated actual API contracts: ${exports.length} exports across three platforms.`
);
