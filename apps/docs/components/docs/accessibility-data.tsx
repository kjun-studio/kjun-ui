'use client';
import { useEffect, useState } from 'react';
import type { Result, RunSummary, VerificationData } from '../../../../shared/accessibility-guides/model';

// The retained run records are large; keep them out of the shared document bundle so
// every page hydrates without waiting for them.
let loaded: VerificationData | null = null;
let pending: Promise<VerificationData> | undefined;
function loadAccessibility() {
  return pending ||= import('@/lib/generated/accessibility.json').then(module => {
    loaded = module.default as unknown as VerificationData;
    return loaded;
  });
}

export function useAccessibilityData() {
  const [data, setData] = useState(loaded);
  useEffect(() => {
    if (data) return;
    let live = true;
    loadAccessibility().then(next => { if (live) setData(next); });
    return () => { live = false; };
  }, [data]);
  return data;
}

// Full evidence for one run comes from its original downloadable record.
const records = new Map<string, Promise<Result[]>>();
export function useRunResults(run: RunSummary | undefined) {
  const [state, setState] = useState<{ id: string; results: Result[] } | null>(null);
  useEffect(() => {
    if (!run) return;
    let live = true;
    const pending = records.get(run.id) ?? fetch(run.download).then(response => {
      if (!response.ok) throw Error('Accessibility record ' + response.status);
      return response.json() as Promise<{ results: Result[] }>;
    }).then(record => record.results);
    records.set(run.id, pending);
    pending.then(results => { if (live) setState({ id: run.id, results }); }, () => records.delete(run.id));
    return () => { live = false; };
  }, [run]);
  return run && state?.id === run.id ? state.results : undefined;
}

export function AccessibilityLoading() {
  return <p className="platform-loading" role="status">접근성 검증 기록을 불러오는 중…</p>;
}
