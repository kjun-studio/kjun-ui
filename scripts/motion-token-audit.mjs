import postcss from 'postcss';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, relative } from 'node:path';

// Motion must speak one language across platforms: token durations and token easing roles only.
const sources = ['packages/tokens/src', 'packages/vue2/src', 'packages/react/src', 'packages/native/src', 'shared/package-runtime'];
const scaleStep = /var\(--motion-(?:instant|quick|fast|normal)\)/;
const keywordEasing = /(?<![\w(-])(?:ease|ease-in|ease-out|ease-in-out)(?![\w-])/;

/** Each comma-separated transition/animation must name a token duration and a token easing role. */
export function auditMotionCss(source, file) {
  const issues = [];
  postcss.parse(source).walkDecls(/^(?:transition|animation)$/, d => {
    if (/^none\b/.test(d.value)) return;
    for (const part of d.value.split(/,(?![^()]*\))/).map(value => value.trim())) {
      const where = `${file}:${d.source.start.line} ${d.prop}: ${part}`;
      // Endless loops (shimmer, pulse) keep a symmetric in-out curve by design.
      const loop = /\binfinite\b/.test(part);
      if (/^all\b/.test(part)) issues.push(`${where} (name the animated properties)`);
      if (/(?<![\w-])\d*\.?\d+m?s\b/.test(part.replace(/\b0m?s\b/g, ''))) issues.push(`${where} (literal duration)`);
      if (!loop && keywordEasing.test(part.replace(/var\(--ease-[\w-]+\)/g, ''))) issues.push(`${where} (keyword easing)`);
      if (!loop && /var\(--motion-/.test(part) && !/var\(--ease-|\blinear\b|steps\(/.test(part)) issues.push(`${where} (missing token easing)`);
      if (/ease-out-expo|cubic-bezier\(/.test(part)) issues.push(`${where} (raw curve)`);
      // Scale steps only feed role tokens, so the same kind of change keeps one speed everywhere.
      if (scaleStep.test(part)) issues.push(`${where} (scale step instead of a motion role)`);
    }
  });
  return issues;
}

/** Utility classes and scripted animations must not carry their own timing. */
export function auditMotionScript(source, file) {
  const issues = [];
  source.split('\n').forEach((line, index) => {
    const where = `${file}:${index + 1}`;
    if (/\b(?:transition-all|duration-\d+|ease-(?:linear|in|out|in-out))\b(?![-\w(])/.test(line) && /class|['"`]/.test(line) && !/var\(--/.test(line))
      issues.push(`${where} utility timing`);
    if (/\bmotion\.(?:instant|quick|fast|normal)\b/.test(line)) issues.push(`${where} scale step instead of a motion role`);
    if (/easing:\s*['"`](?!linear)/.test(line) || /cubic-bezier\(/.test(line) || /ease-out-expo/.test(line))
      issues.push(`${where} raw easing`);
  });
  return issues;
}

async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? files(resolve(dir, entry.name)) : [resolve(dir, entry.name)]))).flat();
}

export async function auditMotion(root) {
  const issues = [];
  for (const dir of sources) for (const path of await files(resolve(root, dir))) {
    const file = relative(root, path);
    // Generated bindings declare the curves themselves.
    if (/tokens\/src\/(?:bindings\.css|index\.ts|tokens\.json)$/.test(file)) continue;
    const text = await readFile(path, 'utf8');
    if (file.endsWith('.css')) issues.push(...auditMotionCss(text, file));
    else if (file.endsWith('.vue')) {
      for (const match of text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) issues.push(...auditMotionCss(match[1], file));
      issues.push(...auditMotionScript(text.replace(/<style[^>]*>[\s\S]*?<\/style>/g, ''), file));
    } else if (/\.(?:[cm]?js|tsx?)$/.test(file)) issues.push(...auditMotionScript(text, file));
  }
  return issues;
}
