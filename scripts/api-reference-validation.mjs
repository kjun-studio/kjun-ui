import { access } from "node:fs/promises";
import { resolve } from "node:path";
export const fail = (message) => {
  throw Error("API reference: " + message);
};
export function validateBindings(rows, expected, label) {
  if (
    !Array.isArray(expected) ||
    new Set(expected).size !== expected.length ||
    new Set(rows.map((r) => r.name)).size !== rows.length ||
    rows.length !== expected.length ||
    rows.some((p) => !expected.includes(p.name))
  )
    fail("stale or duplicate prop bindings " + label);
}
export async function validateItem(item, label, knownPaths, root) {
  if (!item.summary?.trim()) fail("missing summary " + label);
  if (item.type && (/import\(/.test(item.type) || /\/(workspace|Users|tmp)\//.test(item.type)))
    fail("private type path " + label);
  if (
    item.example &&
    (!knownPaths.has(item.example.split("#")[0]) || item.example.split("#")[1] !== "preview")
  )
    fail("invalid example " + label);
  for (const detail of item.details || [])
    if (!detail.label?.trim() || !detail.text?.trim()) fail("empty detail " + label);
  if (item.source) await access(resolve(root, item.source));
}
export function validateGenerated(stored, current) {
  if (stored !== current) fail("generated reference is stale; run api:generate");
}
export function validateFeedback(data, source) {
  const methods = data.methods.map((m) => m.name),
    options = data.options.flatMap((m) => m.name.split(" / "));
  for (const [names, known, kind] of [
    [methods, source.methods, "method"],
    [options, source.options, "option"],
  ]) {
    if (
      new Set(names).size !== names.length ||
      names.length !== known.length ||
      names.some((name) => !known.includes(name))
    )
      fail("unknown, duplicate or missing feedback " + kind);
  }
}
