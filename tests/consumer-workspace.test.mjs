import test from "node:test";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import {
  access,
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import {
  cleanupConsumerWorkspaces,
  withConsumerWorkspace,
} from "../scripts/consumer-workspace.mjs";

const exists = (path) =>
  access(path).then(
    () => true,
    () => false,
  );
const json = (path) => readFile(path, "utf8").then(JSON.parse);

async function fixture(t) {
  const directory = await mkdtemp(resolve(tmpdir(), "kjun-consumer-test-"));
  const root = resolve(directory, "project"),
    tempRoot = resolve(directory, "tmp");
  await mkdir(resolve(root, "artifacts"), { recursive: true });
  await mkdir(tempRoot);
  t.after(() => rm(directory, { recursive: true, force: true }));
  const recordPath = resolve(root, "artifacts/consumer.json");
  const reports = [];
  return { root, tempRoot, recordPath, reports, report: (message) => reports.push(message) };
}

async function legacy(options, name, owner = options.root) {
  const directory = resolve(options.tempRoot, "kjun-consumer-" + name);
  await mkdir(resolve(directory, "node_modules"), { recursive: true });
  await writeFile(
    resolve(directory, "package.json"),
    JSON.stringify({
      name: "kjun-packed-consumer",
      private: true,
      dependencies: { "@kjun-ui/react": "file:" + resolve(owner, "artifacts/kjun-react.tgz") },
    }),
  );
  return directory;
}

async function current(options, directory) {
  const record = {
    directory,
    source: "old",
    manifest: [{ name: "@kjun-ui/react", integrity: "old" }],
  };
  await writeFile(options.recordPath, JSON.stringify(record));
  return record;
}

test("success publishes the new record before retiring the previous consumer", async (t) => {
  const options = await fixture(t);
  const previous = await legacy(options, "previous");
  const old = await current(options, previous);
  const next = await withConsumerWorkspace(async (directory) => {
    assert.ok(await exists(previous));
    assert.deepEqual(await json(options.recordPath), old);
    await writeFile(resolve(directory, "verified"), "packed package bytes");
    return { source: "new", manifest: [{ integrity: "new" }] };
  }, options);
  assert.equal(await exists(previous), false);
  assert.equal(await readFile(resolve(next, "verified"), "utf8"), "packed package bytes");
  assert.deepEqual(await json(options.recordPath), {
    directory: next,
    source: "new",
    manifest: [{ integrity: "new" }],
  });
  assert.deepEqual(await readdir(options.tempRoot), [next.split("/").at(-1)]);
});

test("failed verification discards only its candidate and retains the last success", async (t) => {
  const options = await fixture(t);
  const previous = await legacy(options, "previous");
  const old = await current(options, previous);
  let candidate;
  await assert.rejects(
    withConsumerWorkspace(async (directory) => {
      candidate = directory;
      await writeFile(resolve(directory, "partial-install"), "partial");
      throw Error("type verification failed");
    }, options),
    /type verification failed/,
  );
  assert.equal(await exists(candidate), false);
  assert.ok(await exists(previous));
  assert.deepEqual(await json(options.recordPath), old);
});

test("legacy cleanup preserves the referenced consumer, foreign projects and symlinks", async (t) => {
  const options = await fixture(t);
  const active = await legacy(options, "active");
  const old = await current(options, active);
  const obsolete = await legacy(options, "obsolete");
  const foreign = await legacy(options, "foreign", "/another-checkout");
  const unknown = resolve(options.tempRoot, "kjun-consumer-unrelated");
  await mkdir(unknown);
  const link = resolve(options.tempRoot, "kjun-consumer-symlink");
  await symlink(foreign, link);
  const result = await cleanupConsumerWorkspaces(options);
  assert.deepEqual(result.removed, [obsolete]);
  assert.deepEqual(result.failed, []);
  for (const directory of [active, foreign, unknown, link]) assert.ok(await exists(directory));
  assert.deepEqual(await json(options.recordPath), old);
  assert.deepEqual((await cleanupConsumerWorkspaces(options)).removed, []);
});

test("partially deleted owned folders are reclaimed without package or marker files", async (t) => {
  const options = await fixture(t);
  const key = createHash("sha256").update(options.root).digest("hex").slice(0, 16);
  const orphan = resolve(options.tempRoot, `kjun-consumer-${key}-retired-interrupted`);
  const foreign = resolve(options.tempRoot, "kjun-consumer-foreign-retired-interrupted");
  for (const directory of [orphan, foreign]) {
    await mkdir(resolve(directory, "node_modules"), { recursive: true });
    await writeFile(resolve(directory, "node_modules/remaining-file"), "remaining");
  }
  assert.deepEqual((await cleanupConsumerWorkspaces(options)).removed, [orphan]);
  assert.ok(await exists(foreign));
});

test("invalid success records stop cleanup before any directory is removed", async (t) => {
  const options = await fixture(t);
  const obsolete = await legacy(options, "obsolete");
  for (const value of ["{broken", "null", "{}", '{"directory":""}']) {
    await writeFile(options.recordPath, value);
    await assert.rejects(cleanupConsumerWorkspaces(options));
    assert.ok(await exists(obsolete));
  }
});

test("a damaged owner marker is reported and never silently deletes the directory", async (t) => {
  const options = await fixture(t);
  const directory = await legacy(options, "damaged");
  await writeFile(resolve(directory, ".kjun-consumer.json"), "{broken");
  const result = await cleanupConsumerWorkspaces(options);
  assert.deepEqual(result.failed, [directory]);
  assert.ok(await exists(directory));
  assert.ok(options.reports.some((message) => message.includes("다음 실행에서 재시도")));
});

async function isolated(t) {
  const options = await fixture(t);
  await mkdir(resolve(options.root, "scripts"));
  for (const name of ["consumer-workspace.mjs", "workflow-lock.mjs"]) {
    await copyFile(resolve("scripts", name), resolve(options.root, "scripts", name));
  }
  const children = [];
  t.after(async () => {
    for (const { child, done } of children) {
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
      await done;
    }
  });
  const start = (code) => {
    const env = { ...process.env };
    delete env.KJUN_WORKFLOW_OWNER;
    const prelude = `import {withConsumerWorkspace,cleanupConsumerWorkspaces} from './scripts/consumer-workspace.mjs';
      import {writeFile,readFile} from 'node:fs/promises';
      const options=${JSON.stringify({ root: options.root, tempRoot: options.tempRoot })};`;
    const child = spawn(process.execPath, ["--input-type=module", "-e", prelude + code], {
      cwd: options.root,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk;
    });
    child.stderr.on("data", (chunk) => {
      output += chunk;
    });
    const done = new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("close", (code, signal) => resolve({ code, signal, output }));
    });
    const result = { child, done };
    children.push(result);
    return result;
  };
  return { ...options, start };
}

async function waitFor(path) {
  const deadline = Date.now() + 10000;
  while (!(await exists(path))) {
    if (Date.now() > deadline) throw Error("Timed out: " + path);
    await delay(25);
  }
}

test(
  "SIGKILL leftovers are reclaimed by the next run without losing the current consumer",
  { timeout: 15000 },
  async (t) => {
    const options = await isolated(t);
    const active = await legacy(options, "active");
    const old = await current(options, active);
    const run = options.start(`await withConsumerWorkspace(async directory => {
    await writeFile('ready', directory); await new Promise(() => setInterval(()=>{},1000));
  }, options);`);
    await waitFor(resolve(options.root, "ready"));
    const orphan = await readFile(resolve(options.root, "ready"), "utf8");
    run.child.kill("SIGKILL");
    assert.equal((await run.done).signal, "SIGKILL");
    const result = await options.start("await cleanupConsumerWorkspaces(options);").done;
    assert.equal(result.code, 0, result.output);
    assert.equal(await exists(orphan), false);
    assert.ok(await exists(active));
    assert.deepEqual(await json(options.recordPath), old);
  },
);

test(
  "cleanup waits for an active verification and preserves its published result",
  { timeout: 15000 },
  async (t) => {
    const options = await isolated(t);
    const owner = options.start(`await withConsumerWorkspace(async directory => {
    await writeFile('ready', directory);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await writeFile(directory+'/verified','ok'); return {source:'new'};
  }, options);`);
    await waitFor(resolve(options.root, "ready"));
    const cleaner = options.start("await cleanupConsumerWorkspaces(options);");
    const verified = await owner.done,
      cleaned = await cleaner.done;
    assert.equal(verified.code, 0, verified.output);
    assert.equal(cleaned.code, 0, cleaned.output);
    assert.match(cleaned.output, /KJUN 대기/);
    const record = await json(options.recordPath);
    assert.equal(record.source, "new");
    assert.equal(await readFile(resolve(record.directory, "verified"), "utf8"), "ok");
  },
);
