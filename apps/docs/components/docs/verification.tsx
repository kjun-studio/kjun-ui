'use client';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from './doc-link';
import { DsCard as Card } from '@kjun-ui/react';
import { DsSelect } from '@kjun-ui/react';
import { PlatformLoading, useDocsPlatform } from './docs-platform';
import coverage from '@/lib/generated/coverage.json';
import { AccessibilityDescription, ResultBadge } from './accessibility-guide';
import { AccessibilityLoading, useAccessibilityData, useRunResults } from './accessibility-data';
import { LegacyEvidence, RunEnvironment, executionTime } from './verification-record';
import { latestRun, resultFor, statusFor, statusLabels, verificationHref } from '../../../../shared/accessibility-guides/selection';
const targets = [...coverage.components.map(entry => ({ name: entry.name, title: entry.title, docs: entry.docs })), { name: 'KjunFeedbackProvider', title: '피드백 서비스', docs: '/feedback' }];
// Stable option lists keep an open selector intact when run evidence arrives and re-renders the page.
const targetOptions = targets.map(target => ({ value: target.name, label: target.title }));
export function Verification() {
  const params = useSearchParams(), search = params.toString();
  const { platform } = useDocsPlatform();
  const accessibility = useAccessibilityData();
  const [selection, setSelection] = useState({ component: params.get('component') || 'DsButton', record: params.get('record') || '' });
  useEffect(() => {
    const restore = () => { const q = new URLSearchParams(location.search); setSelection({ component: q.get('component') || 'DsButton', record: q.get('record') || '' }); };
    restore(); window.addEventListener('popstate', restore); window.addEventListener('pageshow', restore);
    return () => { window.removeEventListener('popstate', restore); window.removeEventListener('pageshow', restore); };
  }, [search]);
  const legacy = coverage.records.find(record => record.id === selection.record);
  const run = !platform || !accessibility ? undefined : selection.record
    ? accessibility.runs.find(run => run.id === selection.record) : latestRun(accessibility.runs, selection.component, platform);
  const runResults = useRunResults(legacy ? undefined : run);
  const recordOptions = useMemo(() => [{ value: 'latest', label: '최근 실행 기록' },
    ...(accessibility?.runs ?? []).map(record => ({ value: record.id, label: `접근성 · ${executionTime(record.startedAt)}${record.stale ? ' · 재검증 필요' : ''}` })),
    ...coverage.records.map(record => ({ value: record.id, label: `구현 · ${record.date} · ${record.title}` }))], [accessibility]);
  if (!platform) return <PlatformLoading />;
  if (!accessibility) return <AccessibilityLoading />;
  const target = targets.find(target => target.name === selection.component);
  const defs = accessibility.definitions.filter(def => def.component === selection.component && def.platform === platform);
  const update = (component: string, record: string) => {
    setSelection({ component, record });
    const url = verificationHref(component, platform, record);
    window.history.pushState(window.history.state, '', url);
  };
  const missingRecord = !!selection.record && !run && !legacy;
  return <div className="verification-page">
    <section id="verification-target">
      <h2>대상·검증 기록</h2>
      <p className="body-copy">공개 컴포넌트 {coverage.components.length}개와 피드백 서비스의 세 항목을 같은 기준으로 연결합니다. 문서 플랫폼 선택은 이 페이지에도 적용됩니다.</p>
      <div className="verification-selectors">
        <div><label>대상</label><DsSelect value={selection.component} ariaLabel="대상" searchable
          options={targetOptions}
          onValueChange={value => { if (typeof value === 'string') update(value, ''); }} /></div>
        <div><label>기록</label><DsSelect value={selection.record || 'latest'} ariaLabel="기록"
          options={recordOptions}
          onValueChange={value => { if (typeof value === 'string') update(selection.component, value === 'latest' ? '' : value); }} /></div>
      </div>
      <p><strong>{selection.component} · {platform === 'native' ? 'Native Web' : platform === 'vue2' ? 'Vue 2' : 'React'}</strong></p>
      {target && <p><Link href={target.docs + '#accessibility'}>상세 접근성 설명</Link> · <Link href={verificationHref(target.name, platform, run?.id || legacy?.id)}>이 대상·플랫폼·기록의 직접 링크</Link></p>}
      {!target && <p role="alert">알 수 없는 대상입니다. 위 목록에서 대상을 선택하세요.</p>}
      {missingRecord && <p role="alert">기록을 찾을 수 없습니다. 요청한 기록: <code>{selection.record}</code>. 다른 기록으로 자동 대체하지 않았습니다.</p>}
      {!run && !legacy && !missingRecord && <p role="status">자동검사가 아직 실행되지 않았습니다.</p>}
      {run && <p className="verification-counts" aria-label="선택 대상 결과 요약">{Object.entries(statusLabels).map(([status, label]) => <span key={status}>{label} {defs.filter(def => statusFor(def, run) === status).length}</span>)}</p>}
    </section>
    {target && !missingRecord && <>
      {legacy ? <LegacyEvidence record={legacy} component={target.name} platform={platform} /> : run ? <RunEnvironment run={run} platform={platform} /> : <section id="verification-environment"><h2>실행 환경·원본 기록</h2><p>미실행 · 연결된 환경·버전·실행 시각·원본 기록이 없습니다.</p></section>}
      {run && !legacy && !runResults ? <AccessibilityLoading /> : defs.map(def => {
        const result = resultFor(def, legacy || !runResults ? undefined : { results: runResults });
        return <section key={def.id} id={def.item} className="verification-result" data-verification-item={def.item}>
          <div className="accessibility-item-heading"><h2>{def.label}</h2><ResultBadge result={result} stale={!legacy && run?.stale} /></div>
          {legacy ? <p>구현 기록은 이 항목의 자동검사 결과를 포함하지 않습니다. <Link href={verificationHref(target.name, platform, undefined, def.item)}>최근 접근성 검사 확인</Link></p> : null}
          <AccessibilityDescription definition={def} />
          <Card surface="muted" className="verification-check">
            <p className="verification-id">검사 ID · <code>{def.id}</code></p>
            <dl><dt>검사 조건</dt><dd>{result.procedure}</dd><dt>예상 결과</dt><dd>{result.expected}</dd><dt>실제 결과</dt><dd>{result.actual}</dd></dl>
            {result.startedAt && <p>항목 실행 시각 · <time dateTime={result.startedAt}>{executionTime(result.startedAt)}</time></p>}
            {result.reason && <div className={result.status === 'failed' ? 'verification-failure' : ''}><strong>{result.status === 'failed' ? '실패 사유·후속 확인' : '사유'}</strong><pre>{result.reason.split('\nCall log:')[0].split(/\n\s+at /)[0]}</pre>
              {result.status === 'failed' && <details><summary>실패 원본 상세</summary><pre>{result.reason}</pre></details>}
            </div>}
            {!!result.observations.length && <details><summary>실제 관찰 기록 ({result.observations.length})</summary><pre>{result.observations.join('\n\n')}</pre></details>}
            <p>{def.limitation}</p>
          </Card>
        </section>;
      })}
    </>}
  </div>;
}
