import ts from "typescript";

// Keep imports at module scope and initialize the SFC inside a pure factory.
// This also covers validators and other local setup calls in the component options.
export function componentModule(script, render, { filename, template, scopeId }) {
  const source = ts.createSourceFile(filename, script, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const imports = [], body = [];
  let hasDefault = false;
  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement)) imports.push(statement.getFullText(source));
    else if (ts.isExportAssignment(statement) && !statement.isExportEquals) {
      if (hasDefault) throw Error("Duplicate Vue component export: " + filename);
      hasDefault = true;
      body.push("const __component = " + statement.expression.getText(source) + ";");
    } else {
      if (ts.isExportDeclaration(statement) || statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword))
        throw Error("Unsupported Vue component named export: " + filename);
      body.push(statement.getFullText(source));
    }
  }
  if (!hasDefault) throw Error("Missing Vue component default export: " + filename);
  return imports.join("\n") + "\nexport default /* @__PURE__ */ (() => {\n" +
    body.join("\n") + "\n" + (template ? render + "\n__component.render=render;__component.staticRenderFns=staticRenderFns;\n" : "") +
    (scopeId ? "__component._scopeId=" + JSON.stringify(scopeId) + ";\n" : "") +
    "return __component;\n})();";
}
