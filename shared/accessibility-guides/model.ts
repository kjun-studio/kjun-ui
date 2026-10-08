export type Platform = 'vue2' | 'react' | 'native';
export type Item = 'keyboard' | 'labeling' | 'focus';
export type Status = 'passed' | 'failed' | 'not-run' | 'not-applicable';
export interface Definition {
  id: string; component: string; platform: Platform; item: Item; label: string;
  profile: string; behavior: string; responsibility: string; platformNote: string;
  api: string[]; applicable: boolean; reason: string | null; procedure: string; expected: string; limitation: string;
}
export interface PackageRecord { name: string; version: string; integrity: string; file: string; bytes: number }
export interface Result {
  id: string; component: string; platform: Platform; item: Item; status: Status;
  startedAt: string | null; finishedAt: string | null; procedure: string; expected: string;
  actual: string; reason: string | null; observations: string[];
}
export interface Run {
  schemaVersion: number; id: string; startedAt: string; finishedAt: string; definitionHash: string;
  environment: { os: string; architecture: string; node: string; browser: string; playwright: string; runtimes: Record<string, string>; viewport: { width: number; height: number }; locale: string; timezone: string };
  packages: PackageRecord[]; results: Result[]; setupError: string | null;
  devices: { ios: string; android: string }; screenReader: string;
  download: string; stale?: boolean;
}
/** Generated docs data keeps statuses; the full record is fetched from `download`. */
export type ResultSummary = Pick<Result, 'id' | 'component' | 'platform' | 'item' | 'status' | 'startedAt'>;
export type RunSummary = Omit<Run, 'results'> & { results: ResultSummary[] };
export interface VerificationData {
  definitionHash: string; definitions: Definition[]; packages: PackageRecord[]; runs: RunSummary[];
}
