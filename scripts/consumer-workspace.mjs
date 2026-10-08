import { createHash, randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { acquireWorkflowLock } from "./workflow-lock.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const PREFIX = "kjun-consumer-";
const MARKER = ".kjun-consumer.json";
const FORMAT_VERSION = 1;
const CLEANUP_NICENESS = 10;
const execFileAsync = promisify(execFile);

// 작은 파일 수백만 개를 Node의 병렬 fs.rm으로 지우면 CPU를 점유하므로 낮은 우선순위로 삭제한다.
async function removeDirectory(directory) {
  await execFileAsync("nice", [
    "-n",
    String(CLEANUP_NICENESS),
    "rm",
    "--recursive",
    "--force",
    "--one-file-system",
    "--",
    directory,
  ]);
}

async function jsonIfPresent(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

async function workspaceManager({ root = ROOT, tempRoot = tmpdir(), report = console.log } = {}) {
  root = await realpath(root);
  tempRoot = await realpath(tempRoot);
  const recordPath = resolve(root, "artifacts/consumer.json");
  const prefix = PREFIX + createHash("sha256").update(root).digest("hex").slice(0, 16) + "-";

  async function owns(directory) {
    if (dirname(directory) !== tempRoot || !basename(directory).startsWith(PREFIX)) return false;
    const stat = await lstat(directory);
    if (!stat.isDirectory() || stat.isSymbolicLink()) return false;
    const marker = await jsonIfPresent(resolve(directory, MARKER));
    if (marker !== undefined) return marker?.version === FORMAT_VERSION && marker.root === root;
    // mkdtemp 직후 강제 종료돼도 checkout별 접두사로 미완성 폴더를 회수한다.
    if (basename(directory).startsWith(prefix)) return true;
    // 이전 형식은 이름만 믿지 않고 설치 대상 tarball이 이 checkout 소속인지 확인한다.
    const pkg = await jsonIfPresent(resolve(directory, "package.json"));
    const packages = Object.entries(pkg?.dependencies || {}).filter(([name]) =>
      name.startsWith("@kjun/"),
    );
    return (
      pkg?.name === "kjun-packed-consumer" &&
      pkg.private === true &&
      packages.length > 0 &&
      packages.every(
        ([, value]) =>
          typeof value === "string" &&
          value.startsWith("file:") &&
          dirname(resolve(directory, value.slice(5))) === resolve(root, "artifacts"),
      )
    );
  }

  async function cleanup() {
    // 기록이 손상됐으면 현재 사용 폴더를 추측해 지우지 않는다.
    const record = await jsonIfPresent(recordPath);
    if (
      record !== undefined &&
      (!record || typeof record.directory !== "string" || !record.directory)
    ) {
      throw Error("consumer.json에 유효한 directory가 없어 임시 폴더 정리를 중단합니다.");
    }
    const active = record
      ? await realpath(record.directory).catch((error) => {
          if (error.code === "ENOENT") return resolve(record.directory);
          throw error;
        })
      : null;
    const result = { active, removed: [], failed: [] };
    // 대량 삭제가 동시에 디스크를 점유하지 않도록 폴더별로 순차 처리한다.
    for (const entry of await readdir(tempRoot, { withFileTypes: true })) {
      if (!entry.isDirectory() || !entry.name.startsWith(PREFIX)) continue;
      const directory = resolve(tempRoot, entry.name);
      if (directory === active) continue;
      try {
        if (!(await owns(directory))) continue;
        report(`[KJUN 정리] ${directory}`);
        // 삭제 중 package.json·marker가 먼저 사라져도 다음 실행에서 소유권을 판별한다.
        const retired = entry.name.startsWith(prefix)
          ? directory
          : resolve(tempRoot, prefix + "retired-" + randomUUID());
        if (retired !== directory) await rename(directory, retired);
        await removeDirectory(retired);
        result.removed.push(directory);
      } catch (error) {
        result.failed.push(directory);
        report(`[KJUN 정리 경고] ${directory}: ${error.message} — 다음 실행에서 재시도합니다.`);
      }
    }
    return result;
  }

  async function create() {
    const directory = await mkdtemp(resolve(tempRoot, prefix));
    await writeFile(resolve(directory, MARKER), JSON.stringify({ version: FORMAT_VERSION, root }));
    return directory;
  }

  async function publish(directory, record) {
    await mkdir(dirname(recordPath), { recursive: true });
    const pending = recordPath + "." + randomUUID() + ".tmp";
    try {
      await writeFile(pending, JSON.stringify({ ...record, directory }, null, 2) + "\n");
      // 후속 검사에는 이전 성공 기록 또는 새 성공 기록만 보이게 한다.
      await rename(pending, recordPath);
    } catch (error) {
      await rm(pending, { force: true }).catch(() => {});
      throw error;
    }
  }

  return { cleanup, create, publish, report };
}

export async function cleanupConsumerWorkspaces(options) {
  const lock = await acquireWorkflowLock("consumers:cleanup");
  try {
    return await (await workspaceManager(options)).cleanup();
  } finally {
    await lock.release();
  }
}

export async function withConsumerWorkspace(verify, options) {
  const lock = await acquireWorkflowLock("verify:consumers");
  try {
    const manager = await workspaceManager(options);
    await manager.cleanup();
    const directory = await manager.create();
    let published = false;
    try {
      const record = await verify(directory);
      await manager.publish(directory, record);
      published = true;
      await manager.cleanup();
      return directory;
    } finally {
      if (!published) {
        await removeDirectory(directory).catch((error) => {
          manager.report(
            `[KJUN 정리 경고] ${directory}: ${error.message} — 다음 실행에서 재시도합니다.`,
          );
        });
      }
    }
  } finally {
    await lock.release();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await cleanupConsumerWorkspaces();
  console.log(
    `[KJUN 정리 완료] 삭제 ${result.removed.length}개, 실패 ${result.failed.length}개, 보존 ${result.active || "없음"}`,
  );
  if (result.failed.length) process.exitCode = 1;
}
