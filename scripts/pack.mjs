import { mkdir, copyFile, writeFile, readdir, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { assertCurrentBuild, recordPackedState, packageNames } from "./package-state.mjs";
const root = resolve(import.meta.dirname, "..");
process.chdir(root);
await assertCurrentBuild();
await mkdir("artifacts", { recursive: true });
await mkdir("apps/docs/public/downloads", { recursive: true });
// Only the tarballs packed below are published; drop ones left by earlier versions or names.
for (const file of await readdir("apps/docs/public/downloads"))
  if (file.endsWith(".tgz")) await rm("apps/docs/public/downloads/" + file);
const names = packageNames;
const artifacts = [];
for (const name of names) {
  const result = JSON.parse(
    execFileSync(
      "npm",
      [
        "pack",
        "--workspace",
        "@kjun-ui/" + name,
        "--pack-destination",
        resolve("artifacts"),
        "--json",
      ],
      { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }
    )
  )[0];
  await copyFile(
    "artifacts/" + result.filename,
    "apps/docs/public/downloads/" + result.filename
  );
  artifacts.push({
    name: "@kjun-ui/" + name,
    version: result.version,
    file: result.filename,
    bytes: result.size,
    integrity: result.integrity,
  });
}
await writeFile(
  "artifacts/manifest.json",
  JSON.stringify(artifacts, null, 2) + "\n"
);
console.log(artifacts.map((p) => p.file).join("\n"));

await mkdir("apps/docs/lib/generated", { recursive: true });
await writeFile(
  "apps/docs/lib/generated/packages.json",
  JSON.stringify(artifacts, null, 2) + "\n"
);
await recordPackedState();
