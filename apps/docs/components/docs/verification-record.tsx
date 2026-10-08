'use client';
import { useEffect, useState } from 'react';
import { DsCard as Card } from '@kjun-ui/react';
import coverage from '@/lib/generated/coverage.json';
import type { Platform, RunSummary } from '../../../../shared/accessibility-guides/model';
export function executionTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'medium', timeStyle: 'medium', hour12: false }).format(new Date(value)) + ' KST';
}
export function RunEnvironment({ run, platform }: { run: RunSummary; platform: Platform }) {
  return <section id="verification-environment" className="verification-environment">
    <h2>실행 환경·원본 기록</h2>
    <p>실행일 · <time dateTime={run.startedAt}>{executionTime(run.startedAt)}</time></p>
    <p>완료 시각 · <time dateTime={run.finishedAt}>{executionTime(run.finishedAt)}</time></p>
    <p>{platform === 'native' ? 'Native Web · ' : ''}{run.environment.browser} · {run.environment.os} · {run.environment.architecture}</p>
    <p>Node {run.environment.node} · Playwright {run.environment.playwright} · {run.environment.viewport.width}×{run.environment.viewport.height} · {run.environment.locale} · {run.environment.timezone}</p>
    <p>{Object.entries(run.environment.runtimes).map(([name, version]) => `${name} ${version}`).join(' · ')}</p>
    <p>iOS 기기: 미실행 · Android 기기: 미실행 · 스크린리더 발화: 미실행</p>
    <p>독립 소비 환경에 설치한 packed 패키지로 실행했습니다. 자동 DOM·키보드 검사는 위 환경에 한정됩니다.</p>
    {run.stale && <p className="verification-stale" role="status"><strong>재검증 필요</strong> · 현재 패키지 버전·무결성 또는 검사 정의가 이 기록과 다릅니다. 아래는 당시 결과입니다.</p>}
    {run.setupError && <p className="verification-failure">실행 중단 · {run.setupError}</p>}
    <a className="text-link" href={run.download} download>원본 실행 기록 다운로드 (.json)</a>
    <details><summary>검증한 패키지 버전·무결성</summary><dl className="verification-packages">{run.packages.map(pkg => <div key={pkg.name}>
      <dt>{pkg.name} · {pkg.version}</dt><dd><code>{pkg.integrity}</code></dd>
    </div>)}<div><dt>검사 정의</dt><dd><code>{run.definitionHash}</code></dd></div></dl></details>
  </section>;
}
type LegacyRecord = typeof coverage.records[number];
export function LegacyEvidence({ record, component, platform }: { record: LegacyRecord; component: string; platform: Platform }) {
  const [original, setOriginal] = useState('원문을 불러오는 중…');
  const entry = coverage.components.find(entry => entry.name === component);
  const associated = entry?.recordId === record.id;
  useEffect(() => {
    const controller = new AbortController(); setOriginal('원문을 불러오는 중…');
    fetch(record.download, { signal: controller.signal }).then(response => { if (!response.ok) throw Error('원문을 불러올 수 없습니다.'); return response.text(); }).then(setOriginal).catch(error => { if (!controller.signal.aborted) setOriginal(String(error)); });
    return () => controller.abort();
  }, [record.download]);
  return <section id="verification-environment">
    <h2>구현 검증 기록</h2>
    <Card surface="muted" className="verification-legacy">
      <h3>{record.title}</h3><p>기록일 · <time dateTime={record.date}>{record.date}</time></p>
      <p>원문에 적힌 기록일을 유지합니다. 새 자동검사의 실행일이나 현재 패키지의 접근성 통과 기록을 뜻하지 않습니다.</p>
      {associated ? <p>연결된 구현 환경 · {entry.platforms[platform].runtime === 'react-native-web' ? 'Native Web' : entry.platforms[platform].runtime} · {component}</p>
        : <p role="status">이 구현 기록은 선택한 대상에 연결되어 있지 않습니다.</p>}
      <p>iOS·Android 기기: 미실행 · 접근성 자동검사 결과는 별도 실행 기록에서 확인하세요.</p>
      <p>당시 버전·검사 범위·제약은 아래 원문 기준입니다. 패키지 무결성과 항목별 접근성 결과는 이 역사 기록에 수집되어 있지 않습니다.</p>
      <a href={record.download} download>구현 검증 원문 다운로드 (.md)</a>
      <details><summary>당시 환경·결과·제약 원문 보기</summary><pre className="verification-original">{original}</pre></details>
    </Card>
  </section>;
}
