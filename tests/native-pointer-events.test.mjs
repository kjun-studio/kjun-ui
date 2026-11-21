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

// RN Web 0.21 passes inline style.pointerEvents through as CSS, where "none" and "auto" work but "box-none" and "box-only" are not
// values, so the View takes every press (an overlay host over a modal blocks its buttons). Only a StyleSheet.create style compiles them.
test("Native box-none and box-only pointerEvents live in StyleSheet.create styles", () => {
  const root = "packages/native/src", found = [];
  for (const name of readdirSync(root, { recursive: true })) {
    if (!/\.tsx?$/.test(name)) continue;
    readFileSync(join(root, name), "utf8").split("\n").forEach((line, index) => {
      if (/pointerEvents:\s*["'`]box-(none|only)/.test(line) && !/StyleSheet\.create\(/.test(line)) found.push(`${name}:${index + 1}`);
    });
  }
  assert.deepEqual(found, []);
});
