import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve, relative } from "node:path";
const root = resolve(import.meta.dirname, "..");
const tokens = JSON.parse(
  await readFile(resolve(root, "packages/tokens/src/tokens.json"), "utf8")
);
async function walk(path) {
  const entries = await readdir(path, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? walk(resolve(path, entry.name))
          : [resolve(path, entry.name)]
      )
    )
  ).flat();
}
const files = (
  await Promise.all(
    ["tokens", "vue2", "react", "native"].map((name) =>
      walk(resolve(root, `packages/${name}/src`))
    )
  )
)
  .flat()
  .filter(
    (path) =>
      /\.(?:css|tsx?|vue|js)$/.test(path) &&
      !path.endsWith("/bindings.css") &&
      !path.endsWith("/tokens/src/index.ts")
  );
const contents = await Promise.all(
  files.map(async (path) => ({
    path: relative(root, path),
    text: await readFile(path, "utf8"),
  }))
);
const kebab = (role) => role.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
const roles = [...tokens.colorRoles, ...tokens.domainColorRoles].map(
  (role) => ({
    role,
    contract: tokens.domainColorRoles.includes(role) ? "domain" : "common",
    required: tokens.coreColorRoles.includes(role) || tokens.domainColorRoles.includes(role),
    fallback: tokens.colorRoleFallbacks[role] ?? null,
    variable: "--kjun-" + kebab(role),
    upstreamAliases: Object.entries(tokens.roleBindings)
      .filter(([, value]) => value === role)
      .map(([key]) => "--" + key),
    implementationFiles: contents
      .filter(
        (file) =>
          file.text.includes("var(--kjun-" + kebab(role) + ")") ||
          file.text.includes("var(--_kjun-color-" + kebab(role) + ")") ||
          new RegExp("(?:colors|c)\\." + role + "\\b").test(file.text) ||
          Object.entries(tokens.roleBindings).some(
            ([key, value]) =>
              value === role && file.text.includes("var(--" + key + ")")
          )
      )
      .map((file) => file.path),
  })
);
await writeFile(
  resolve(root, "apps/docs/lib/generated/roles.json"),
  JSON.stringify(roles, null, 2) + "\n"
);
console.log(
  `Recorded role bindings and implementation sites: ${roles.length} roles.`
);
