import { resolve } from "node:path";
import ts from "typescript";
import { requireVue3Package } from "./vue3-runtime.mjs";

const root = resolve(import.meta.dirname, "..");
const clean = (text) => text.replace(/import\(["'][^"']+["']\)\./g, "").replace(/ \| undefined$/, "");

function defaultValue(prop) {
  let value = prop.default;
  if (typeof value === "function" && prop.type !== Function) {
    try { value = value(); } catch { value = "factory"; }
  }
  if (typeof value === "function") value = "callback";
  return value === undefined ? "—" : JSON.stringify(value);
}

/**
 * Vue 3 component contracts: prop and slot types from the TypeScript instance type ($props, $slots),
 * required flags and defaults from the runtime prop options, and events from the declared emits.
 */
export function vue3Contracts(names) {
  const config = ts.getParsedCommandLineOfConfigFile(resolve(root, "packages/vue3/tsconfig.json"), {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} });
  const program = ts.createProgram(config.fileNames, { ...config.options, noEmit: true });
  const checker = program.getTypeChecker(), entry = program.getSourceFile(resolve(root, "packages/vue3/src/index.ts"));
  const ui = requireVue3Package(), contracts = {};
  const text = (type) => clean(checker.typeToString(type, entry, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope));
  for (const exported of checker.getExportsOfModule(checker.getSymbolAtLocation(entry))) {
    if (!names.includes(exported.name)) continue;
    const symbol = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
    const component = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration || entry);
    const instance = component.getConstructSignatures()[0]?.getReturnType();
    const member = (name) => { const property = instance?.getProperty(name); return property && checker.getTypeOfSymbolAtLocation(property, entry); };
    const propsType = member("$props"), slotsType = member("$slots"), runtime = ui[exported.name];
    const source = "packages/vue3/src/" + symbol.valueDeclaration.getSourceFile().fileName.split("/packages/vue3/src/")[1];
    const props = Object.entries(runtime.props || {}).map(([name, prop]) => {
      const property = propsType?.getProperty(name);
      return {
        name,
        type: property ? text(checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(property, entry))) : "unknown",
        required: !!prop.required,
        default: defaultValue(prop),
        description: property ? ts.displayPartsToString(property.getDocumentationComment(checker)) : "",
      };
    });
    const slot = (name, type) => {
      const call = checker.getNonNullableType(type).getCallSignatures()[0], scope = call?.getParameters()[0];
      const fields = scope ? checker.getPropertiesOfType(checker.getTypeOfSymbolAtLocation(scope, entry)).map((field) => field.name) : [];
      return { name, data: fields, source };
    };
    const slots = slotsType ? [
      ...checker.getPropertiesOfType(slotsType).map((property) => slot(property.name, checker.getTypeOfSymbolAtLocation(property, entry))),
      // Only template-literal keys (cell-${string}) are declared slots; a plain string index means none were declared.
      ...checker.getIndexInfosOfType(slotsType).filter((info) => info.keyType.flags & ts.TypeFlags.TemplateLiteral)
        .map((info) => slot(text(info.keyType).replace(/^`(.*)\$\{string\}`$/, "$1<key>"), info.type)),
    ] : [];
    contracts[exported.name] = { props, events: Object.keys(runtime.emits || {}).map((name) => ({ name, source })), slots };
  }
  return contracts;
}
