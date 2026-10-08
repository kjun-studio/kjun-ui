'use client';
import { useEffect, useState } from 'react';
import type { KjunIconRegistry } from '@kjun-ui/icons';
import { loadIcon, loadIconCatalog } from '../../../../shared/icon-data';
import type { IconEntry } from '../../../../shared/icon-catalog';
export function useIconCatalogData() {
  const [catalog, setCatalog] = useState<IconEntry[]>([]);
  const [error, setError] = useState(''), [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    loadIconCatalog(controller.signal).then(value => { if (!controller.signal.aborted) setCatalog(value); }).catch(error => {
      if (!controller.signal.aborted) setError(String(error.message));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);
  return { catalog, loading, error, retry: () => setAttempt(value => value + 1) };
}
export function useIconPage(names: string[]) {
  const key = [...new Set(names)].sort().join(',');
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; icons: KjunIconRegistry; failed: string[] }>({ key: '', icons: {}, failed: [] });
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let active = true;
    setLoading(true);
    const requested = key ? key.split(',') : [];
    Promise.allSettled(requested.map(loadIcon)).then(results => {
      if (!active) return;
      const icons: Record<string, Awaited<ReturnType<typeof loadIcon>>> = {}, failed: string[] = [];
      results.forEach((value, i) => {
        if (value.status === 'fulfilled') icons[requested[i]] = value.value;
        else failed.push(requested[i]);
      });
      setResult({ key, icons, failed }); setLoading(false);
    });
    return () => { active = false; };
  }, [key, attempt]);
  return { icons: key === result.key ? result.icons : {}, failed: key === result.key ? result.failed : [],
    loading: loading || key !== result.key, retry: () => setAttempt(value => value + 1) };
}
