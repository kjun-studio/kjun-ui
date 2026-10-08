import type { Definition, Platform, Result, ResultSummary, Status } from './model';
export const statusLabels: Record<Status, string> = { passed: '통과', failed: '실패', 'not-run': '미실행', 'not-applicable': '해당 없음' };
export function latestRun<R extends { results: ResultSummary[] }>(runs: R[], component: string, platform: Platform) {
  return runs.find(run => run.results.some(result => result.component === component && result.platform === platform && result.startedAt)) || runs[0];
}
export function resultFor(def: Definition, run?: { results: Result[] }): Result {
  return run?.results.find(result => result.id === def.id) || {
    id: def.id, component: def.component, platform: def.platform, item: def.item,
    status: def.applicable ? 'not-run' : 'not-applicable', startedAt: null, finishedAt: null,
    procedure: def.procedure, expected: def.expected, actual: def.reason || '연결된 자동 실행 기록이 없습니다.',
    reason: def.reason || '이 검사에 해당하는 실행 결과가 없습니다.', observations: [],
  };
}
export function statusFor(def: Definition, run?: { results: ResultSummary[] }): Status {
  return run?.results.find(result => result.id === def.id)?.status || (def.applicable ? 'not-run' : 'not-applicable');
}
export function verificationHref(component: string, platform: Platform, record?: string, item?: string) {
  const query = new URLSearchParams({ component, platform });
  if (record) query.set('record', record);
  return '/verification?' + query + (item ? '#' + item : '');
}
export function apiAnchor(platform: string, group: string, member: string) {
  return `api-${platform}-${group}-${member.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}
