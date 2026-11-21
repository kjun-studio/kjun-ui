import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// React Native Web 0.21 warns "props.pointerEvents is deprecated. Use style.pointerEvents" for every View that takes the prop,
// so Native components set it in style (React Native supports both). react-native-svg's Svg is not a React Native View and keeps the prop.
test("Native components set pointerEvents in style, not as a View prop", () => {
  const root = "packages/native/src", found = [];
  for (const name of readdirSync(root, { recursive: true })) {
    if (!/\.tsx?$/.test(name)) continue;
    readFileSync(join(root, name), "utf8").split("\n").forEach((line, index) => {
      if (/\bpointerEvents=/.test(line) && !/<Svg\b[^>]*\bpointerEvents=/.test(line)) found.push(`${name}:${index + 1}`);
    });
  }
  assert.deepEqual(found, []);
});
