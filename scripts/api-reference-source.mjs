import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, relative } from "node:path";
import ts from "typescript";
import compiler from "vue-template-compiler";
const root = resolve(import.meta.dirname, "..");
const sourcePath = (file) => relative(root, file).replaceAll("\\", "/");
const parsed = (file, content) =>
  ts.createSourceFile(
    file,
    content,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.JS,
  );
const keyOf = (node) =>
  node && (ts.isIdentifier(node) || ts.isStringLiteral(node) ? node.text : undefined);
export function cleanType(type) {
  return type.replace(/import\(["'][^"']+["']\)\./g, "");
}
function literal(node) {
  if (!node) return undefined;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    return JSON.stringify(node.text);
  if (ts.isNumericLiteral(node)) return node.text;
  if (
    [ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword, ts.SyntaxKind.NullKeyword].includes(
      node.kind,
    )
  )
    return node.getText();
  if (
    ts.isPrefixUnaryExpression(node) &&
    node.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(node.operand)
  )
    return "-" + node.operand.text;
  if (ts.isArrayLiteralExpression(node)) {
    const values = node.elements.map(literal);
    return values.every((v) => v !== undefined) ? "[" + values.join(", ") + "]" : undefined;
  }
  if (ts.isObjectLiteralExpression(node)) {
    const props = node.properties.map((p) =>
      ts.isPropertyAssignment(p) && keyOf(p.name) && literal(p.initializer) !== undefined
        ? JSON.stringify(keyOf(p.name)) + ": " + literal(p.initializer)
        : undefined,
    );
    return props.every((v) => v !== undefined) ? "{" + props.join(", ") + "}" : undefined;
  }
}
export function reactContracts(platform) {
  const entry = resolve(root, `packages/${platform}/src/index.ts`);
  const program = ts.createProgram([entry], {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    skipLibCheck: true,
    esModuleInterop: true,
  });
  const checker = program.getTypeChecker();
  const resolveSymbol = (symbol) =>
    symbol?.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  function implementation(node) {
    if (!node) return;
    if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node))
      return node;
    if (ts.isVariableDeclaration(node)) return implementation(node.initializer);
    if (ts.isCallExpression(node)) return node.arguments.map(implementation).find(Boolean);
    if (ts.isIdentifier(node))
      return implementation(resolveSymbol(checker.getSymbolAtLocation(node))?.valueDeclaration);
  }
  const records = {};
  for (const symbol of checker.getExportsOfModule(
    checker.getSymbolAtLocation(program.getSourceFile(entry)),
  )) {
    const target = resolveSymbol(symbol),
      fn = implementation(target?.valueDeclaration);
    if (!fn || !symbol.name.startsWith("Ds")) continue;
    const defaults = {},
      seen = new Set();
    function collect(fn) {
      if (
        seen.has(fn) ||
        ![`packages/${platform}/src/`, "shared/package-runtime/"].some(prefix =>
          sourcePath(fn.getSourceFile().fileName).startsWith(prefix))
      )
        return;
      seen.add(fn);
      const param = fn.parameters[0];
      const bind = (name) => {
        if (!name || !ts.isObjectBindingPattern(name)) return;
        for (const element of name.elements) {
          const key = keyOf(element.propertyName || element.name),
            value = literal(element.initializer);
          if (key && value !== undefined && !defaults[key])
            defaults[key] = { value, source: sourcePath(element.getSourceFile().fileName) };
        }
      };
      bind(param?.name);
      const propsSymbol =
        param && ts.isIdentifier(param.name) ? checker.getSymbolAtLocation(param.name) : null;
      function visit(node) {
        if (node !== fn && ts.isFunctionLike(node)) return;
        if (
          ts.isVariableDeclaration(node) &&
          node.initializer &&
          propsSymbol &&
          checker.getSymbolAtLocation(node.initializer) === propsSymbol
        )
          bind(node.name);
        if (
          ts.isCallExpression(node) &&
          propsSymbol &&
          node.arguments.some((arg) => checker.getSymbolAtLocation(arg) === propsSymbol)
        ) {
          const helper = implementation(
            resolveSymbol(checker.getSymbolAtLocation(node.expression))?.valueDeclaration,
          );
          if (helper) collect(helper);
        }
        ts.forEachChild(node, visit);
      }
      visit(fn);
    }
    collect(fn);
    records[symbol.name] = { defaults, source: sourcePath(fn.getSourceFile().fileName) };
  }
  return records;
}
function strings(node) {
  if (!node) return [];
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return [node.text];
  if (ts.isConditionalExpression(node))
    return [...strings(node.whenTrue), ...strings(node.whenFalse)];
  if (ts.isTemplateExpression(node))
    return [node.head.text + node.templateSpans.map((span) => "*" + span.literal.text).join("")];
  return [];
}
function localImport(file, request) {
  const base = request.startsWith("@kjun-adapter/")
    ? resolve(root, "packages/vue2/src/adapters", request.slice(14))
    : request.startsWith(".")
      ? resolve(dirname(file), request)
      : null;
  return base && [base, base + ".js", base + ".vue"].find(existsSync);
}
export function vueContracts(file) {
  const events = new Map(),
    slots = new Map(),
    visited = new Set();
  function inspect(file) {
    if (visited.has(file)) return;
    visited.add(file);
    const content = readFileSync(file, "utf8"),
      sfc = file.endsWith(".vue") ? compiler.parseComponent(content) : null;
    const source = parsed(file, sfc ? sfc.script?.content || "" : content),
      imports = new Map();
    for (const statement of source.statements) {
      if (!ts.isImportDeclaration(statement)) continue;
      const target = localImport(file, statement.moduleSpecifier.text);
      if (target && statement.importClause?.name)
        imports.set(statement.importClause.name.text, target);
      const bindings = statement.importClause?.namedBindings;
      if (target && bindings && ts.isNamedImports(bindings))
        for (const item of bindings.elements) imports.set(item.name.text, target);
    }
    const recordEvents = (node) => {
      if (
        ts.isCallExpression(node) &&
        ((ts.isPropertyAccessExpression(node.expression) &&
          node.expression.name.text === "$emit") ||
          (ts.isIdentifier(node.expression) && node.expression.text === "$emit"))
      ) {
        for (const name of strings(node.arguments[0]))
          events.set(name, { name, source: sourcePath(file) });
      }
      if (
        ts.isPropertyAssignment(node) &&
        keyOf(node.name) === "mixins" &&
        ts.isArrayLiteralExpression(node.initializer)
      ) {
        for (const mixin of node.initializer.elements) {
          const target = imports.get(keyOf(mixin));
          if (target) inspect(target);
        }
      }
      ts.forEachChild(node, recordEvents);
    };
    recordEvents(source);
    if (!sfc?.template) return;
    const template = compiler.compile(sfc.template.content, { outputSourceRange: true }).ast,
      walked = new Set();
    function visit(node) {
      if (!node || walked.has(node)) return;
      walked.add(node);
      const attrs = node.attrsMap || {};
      for (const [key, value] of Object.entries(attrs))
        if (key.startsWith("@") || key.startsWith("v-on:")) recordEvents(parsed(file, value));
      if (node.tag === "slot") {
        const dynamic = attrs[":name"] || attrs["v-bind:name"];
        const names = dynamic
          ? strings(parsed("slot.js", "(" + dynamic + ")").statements[0]?.expression?.expression)
          : [attrs.name || "default"];
        const forwarded = !!attrs["v-bind"];
        for (const name of names.length ? names : ["*"]) {
          const data = Object.keys(attrs)
            .filter((k) => /^(:|v-bind:)/.test(k) && ![":name", "v-bind:name"].includes(k))
            .map((k) => k.replace(/^(:|v-bind:)/, ""));
          const previous = slots.get(name);
          slots.set(name, {
            name,
            source: sourcePath(file),
            data: [...new Set([...(previous?.data || []), ...data])],
            forwarded,
          });
        }
      }
      for (const child of node.children || []) visit(child);
      for (const child of Object.values(node.scopedSlots || {})) visit(child);
      for (const condition of node.ifConditions || []) visit(condition.block);
    }
    visit(template);
  }
  inspect(file);
  return { events: [...events.values()], slots: [...slots.values()] };
}
export function feedbackApiMembers() {
  const file = resolve(root, "packages/tokens/src/feedback.ts");
  const program = ts.createProgram([file], { target: ts.ScriptTarget.ES2020, skipLibCheck: true });
  const checker = program.getTypeChecker(),
    source = program.getSourceFile(file);
  const names = new Map(
    source.statements.filter(ts.isInterfaceDeclaration).map((node) => [node.name.text, node]),
  );
  const props = (name) => checker.getTypeAtLocation(names.get(name)).getProperties();
  const service = props("KjunFeedback"),
    toast = service.find((p) => p.name === "toast");
  return {
    methods: [
      ...service.filter((p) => p.name !== "toast").map((p) => p.name),
      ...checker
        .getTypeOfSymbolAtLocation(toast, names.get("KjunFeedback"))
        .getProperties()
        .map((p) => "toast." + p.name),
    ],
    options: ["ToastOptions", "ConfirmOptions", "PromptOptions"].flatMap((name) =>
      props(name).map((p) => name + "." + p.name),
    ),
  };
}
