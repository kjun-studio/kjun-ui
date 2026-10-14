import { readFile, glob } from "node:fs/promises";
import path from "node:path";
import postcss from "postcss";
import selectorParser from "postcss-selector-parser";

// Names KJUN puts into namespaces it shares with the applying app: CSS classes, custom properties,
// keyframes and ids in the page, Vue's global component registry, provide/inject keys and instance
// members. Each must carry the kjun namespace so an app's same-named global can't reach KJUN, or the reverse.
// Tailwind variants (hover:, pagination:) prefix the utility; the utility itself carries the namespace.
const allowedClass = name => /^(kjun-|kj-)/.test(name.replace(/\[[^\]]*\]/g, "").split(":").pop());
const allowedProperty = name => /^--(_?kjun-|tw-)/.test(name);
// Vue scoped keyframes are renamed with the component's data-v-kjun- hash; kj- ones come from Tailwind.
const allowedKeyframes = name => /^(kjun-|kj-)/.test(name) || name.includes("data-v-kjun-");
const allowedId = name => /^kjun-/.test(name);

const sorted = set => [...set].sort();
const files = async (root, pattern) => Array.fromAsync(glob(pattern, { cwd: root }));
const read = (root, file) => readFile(path.join(root, file), "utf8");

async function auditCss(root) {
  const classes = new Set(), properties = new Set(), keyframes = new Set(), ids = new Set();
  const css = postcss.parse(await read(root, "packages/tokens/dist/styles.css"));
  css.walkAtRules(/keyframes$/, rule => { if (!allowedKeyframes(rule.params)) keyframes.add(rule.params); });
  css.walkDecls(decl => { if (decl.prop.startsWith("--") && !allowedProperty(decl.prop)) properties.add(decl.prop); });
  css.walkRules(rule => {
    if (rule.parent?.type === "atrule" && /keyframes$/.test(rule.parent.name)) return;
    selectorParser(selectors => selectors.walk(node => {
      if (node.type === "class" && !allowedClass(node.value)) classes.add(node.value);
      if (node.type === "id" && !allowedId(node.value)) ids.add(node.value);
    })).processSync(rule.selector);
  });
  return { classes, properties, keyframes, ids };
}

// Class names KJUN puts on its own markup, read from static class strings in the sources. An app rule for
// one of these names would restyle KJUN even when no KJUN CSS rule mentions it.
async function auditMarkupClasses(root) {
  const found = new Set();
  const sources = [
    ...await files(root, "packages/vue2/src/**/*.vue"),
    ...await files(root, "packages/vue2/src/**/*.js"),
    ...await files(root, "packages/react/src/**/*.tsx"),
    ...await files(root, "packages/react/src/**/*.ts"),
    ...await files(root, "shared/package-runtime/**/*.ts"),
    ...await files(root, "shared/package-runtime/**/*.tsx"),
  ];
  const attribute = /(?<![\w:-])(?:class|className|staticClass)\s*[=:]\s*"([^"{}]*)"/g;
  for (const file of sources) {
    const text = await read(root, file);
    for (const [, value] of text.matchAll(attribute))
      for (const name of value.split(/\s+/)) if (/^[a-z][\w-]*$/i.test(name) && !allowedClass(name)) found.add(name);
  }
  return found;
}

async function auditIds(root) {
  const found = new Set();
  const sources = [...await files(root, "packages/vue2/src/**/*.vue"), ...await files(root, "packages/react/src/**/*.tsx"), ...await files(root, "shared/package-runtime/**/*.tsx")];
  // Literal id prefixes: id="x", :id="`x-${...}`" or :id="'x-' + ...", id={`x-${...}`}.
  // Computed ids: gradientId() { return `x-${...}` }.
  const computed = /\w*[iI]d\s*\(\)\s*\{\s*return\s*[`'"]([a-z][\w-]*)/g;
  const literal = /(?<![:\w-])id="([a-z][\w-]*)|(?<![\w-]):id="\s*[`']([a-z][\w-]*)|(?<![\w-])id=\{\s*[`'"]([a-z][\w-]*)/g;
  for (const file of sources) {
    const text = await read(root, file);
    for (const [, prefix] of text.matchAll(computed)) if (!allowedId(prefix)) found.add(prefix);
    for (const match of text.matchAll(literal)) { const prefix = match[1] ?? match[2] ?? match[3]; if (!allowedId(prefix)) found.add(prefix); }
  }
  // React/Native: a useId() value becomes a DOM id; it must gain a kjun- prefix where it is created or
  // within the next few lines (const uid = useId(); const fieldId = "kjun-field-" + uid).
  for (const file of [...await files(root, "packages/react/src/**/*.tsx"), ...await files(root, "packages/native/src/**/*.tsx")]) {
    const lines = (await read(root, file)).split("\n");
    lines.forEach((line, index) => {
      const match = line.match(/(?:^|const|let|,)\s*(\w+)\s*=\s*([^,;=]*?)useId\(\)/);
      if (!match || /["'`]kjun-/.test(match[2])) return;
      const next = lines.slice(index, index + 4).join("\n");
      if (!new RegExp("[\"'`]kjun-[\\w-]*[\"'`]?\\s*\\+\\s*" + match[1] + "\\b|\\$\\{" + match[1] + "\\}").test(next) || !/kjun-/.test(next))
        found.add(file + ":" + (index + 1) + ":" + match[1]);
    });
  }
  return found;
}

async function auditVue(root) {
  const vueComponents = new Set(), provideKeys = new Set(), vueMembers = new Set();
  const plugin = await read(root, "packages/vue2/src/plugin.js");
  const registry = plugin.match(/const components = \{([\s\S]*?)\};/)?.[1] ?? "";
  for (const [name] of registry.matchAll(/\b[A-Z]\w+/g)) if (!/^Kjun[A-Z]/.test(name)) vueComponents.add(name);
  for (const file of [...await files(root, "packages/vue2/src/**/*.vue"), ...await files(root, "packages/vue2/src/**/*.js")]) {
    const text = await read(root, file);
    for (const [, body] of text.matchAll(/provide\(\)\s*\{\s*return\s*\{([^]*?)\};?\s*\}/g))
      for (const [, key] of body.matchAll(/(?:^|[,{]\s*)(\w+)\s*(?=[:,}]|$)/gm)) if (!/^kjun/.test(key)) provideKeys.add(key);
    for (const [, list] of text.matchAll(/inject:\s*\[([^\]]*)\]/g))
      for (const [, key] of list.matchAll(/["'](\w+)["']/g)) if (!/^kjun/.test(key)) provideKeys.add(key);
    for (const [, body] of text.matchAll(/inject:\s*\{([^]*?)\}\s*\}?,/g))
      for (const [, key] of body.matchAll(/(?:^|,)\s*(\w+)\s*:/g)) if (!/^kjun/.test(key) && key !== "default" && key !== "from") provideKeys.add(key);
    // Members on the shared component instance: '$'-built names and '$'/'_' method, computed and data keys.
    for (const [, name] of text.matchAll(/["']\$(\w+)["']\s*\+/g)) vueMembers.add("$" + name + "*");
    for (const [, name] of text.matchAll(/^\s{2,6}([$_]\w+)\s*(?:\(|:\s*(?:function|\(|\{))/gm)) vueMembers.add(name);
  }
  return { vueComponents, provideKeys, vueMembers };
}

async function auditExports(root) {
  const found = new Set();
  for (const file of ["packages/vue2/dist/index.d.ts", "packages/react/dist/index.d.ts", "packages/native/dist/index.d.ts"]) {
    const text = await read(root, file);
    for (const [name] of text.matchAll(/\bDs[A-Z]\w*/g)) found.add(name);
  }
  return found;
}

export async function auditGlobalNames({ root = process.cwd() } = {}) {
  const css = await auditCss(root);
  const markup = await auditMarkupClasses(root);
  const sourceIds = await auditIds(root);
  const vue = await auditVue(root);
  return {
    classes: sorted(new Set([...css.classes, ...markup])),
    properties: sorted(css.properties),
    keyframes: sorted(css.keyframes),
    ids: sorted(new Set([...css.ids, ...sourceIds])),
    vueComponents: sorted(vue.vueComponents),
    provideKeys: sorted(vue.provideKeys),
    vueMembers: sorted(vue.vueMembers),
    exports: sorted(await auditExports(root)),
  };
}
