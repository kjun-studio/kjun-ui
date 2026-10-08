import { unionPropTypes } from "./vue-prop-type.mjs";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import ts from "typescript";
const root = resolve(import.meta.dirname, "..");
const require = createRequire(import.meta.url);
const ui = require(resolve(root, "packages/vue2/dist/index.cjs"));
const catalog = JSON.parse(
  await readFile(resolve(root, "shared/component-catalog.json"), "utf8")
);
const exports = Object.keys(ui)
  .filter((name) => /^(Ds|Kjun)/.test(name))
  .sort();
const overrides = {
  "DsTable.sort": "import('@kjun-ui/tokens').TableSort | null",
  "DsRangeSlider.value": "[number, number]",
  "DsRangeSlider.thumbLabels": "[string, string]",
  "DsTimePicker.value": "string | null",
  "DsBottomNavigation.items": "Array<{ key: string; label: string; href: string; icon?: string; badge?: string | number; disabled?: boolean }>",
  "DsSearchInput.loadOptions":
    "(query: string, context: { signal: AbortSignal }) => Promise<Record<string, unknown>[]>",
  "DsTable.formatters":
    "Record<string, (value: unknown, row: Record<string, unknown>) => string>",
  "KjunProvider.renderIdentity":
    "(h: CreateElement, props: Record<string, unknown>, slots: Record<string, VNode[] | undefined>) => VNode | null | undefined",
  "KjunProvider.icons": "import('@kjun-ui/icons').KjunIconRegistry",
  "KjunProvider.formatters": "Record<string, (...values: any[]) => string>",
};
function propsOf(component) {
  return Object.assign(
    {},
    ...(component.mixins || []).map(propsOf),
    component.props || {}
  );
}
function propType(name, key, prop) {
  if (overrides[name + "." + key]) return unionPropTypes([overrides[name + "." + key]], prop.default === null);
  if (Array.isArray(prop.validator?.values)) return prop.validator.values.map(value => JSON.stringify(value)).join(" | ");
  if (prop.validator) {
    const list = prop.validator.toString().match(/\[([^\]]+)\]\.includes/);
    if (list && /^\s*['"]/.test(list[1]))
      return [...list[1].matchAll(/['"]([^'"]+)['"]/g)]
        .map((x) => JSON.stringify(x[1]))
        .join(" | ");
  }
  const type = prop.type || prop;
  return unionPropTypes((Array.isArray(type) ? type : [type])
    .map(
      (t) =>
        ({
          String: "string",
          Number: "number",
          Boolean: "boolean",
          Array: "any[]",
          Object: "Record<string, any>",
          Function: "(...args: any[]) => any",
          Date: "Date",
        }[t?.name] || "unknown")
    ), prop.default === null);
}
const api = {};
let declaration =
  "// Generated from the compiled Vue component contracts by scripts/api.mjs.\n";
declaration +=
  'export type { KjunIconDefinition, KjunIconRegistry } from "@kjun-ui/icons";\nimport type { VueConstructor, CreateElement, VNode } from "vue";\nexport type { ShadowLayer, ElevationRole, CardElevation, TableSort, KjunColors, KjunDomainColors, ColorRole, DomainColorRole, ButtonSize, InputSize, ButtonVariant, KjunFeedback, ConfirmOptions, PromptOptions, ToastOptions } from "@kjun-ui/tokens";\n';
for (const name of exports) {
  const props = propsOf(ui[name]);
  const rows = Object.entries(props).map(([key, p]) => {
    const inferred = propType(name, key, p);
    const type = unionPropTypes([inferred], p.default === null);
    let value = p.default;
    if (typeof value === "function" && p.type !== Function) {
      try {
        value = value();
      } catch {
        value = "factory";
      }
    }
    if (typeof value === "function") value = "callback";
    return {
      name: key,
      type,
      required: !!p.required,
      default: value === undefined ? "—" : JSON.stringify(value),
      description: "",
    };
  });
  api[name] = { vue2: rows };
  declaration += `export interface ${name}Props {\n${rows
    .map(
      (p) => `  ${JSON.stringify(p.name)}${p.required ? "" : "?"}: ${p.type};`
    )
    .join("\n")}\n}\nexport const ${name}: VueConstructor;\n`;
  const source = catalog.find((x) => x.name === name)?.sources?.vue2;
  if (source) {
    const content = await readFile(
      resolve(root, source),
      "utf8"
    ).catch(() => "");
    api[name].events = [
      ...new Set(
        [...content.matchAll(/\$emit\(['"]([^'"]+)/g)].map((m) => m[1])
      ),
    ];
    api[name].slots = [
      ...new Set(
        [...content.matchAll(/<slot(?:\s+name=['"]([^'"]+))?/g)].map(
          (m) => m[1] || "default"
        )
      ),
    ];
  }
}
declaration +=
  "declare const plugin: { install(Vue: VueConstructor): void };\nexport default plugin;\n";
for (const target of [
  "packages/vue2/src/index.d.ts",
  "packages/vue2/dist/index.d.ts",
])
  await writeFile(resolve(root, target), declaration);
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
