'use client';
import Link from './doc-link';
import coverage from '@/lib/generated/coverage.json';
import { CoverageStatus } from './coverage-list';
import { baseline, exceptions, platformLabels, platforms, statusLabels, statusOrder, usedStatuses, type Platform, type Status } from './coverage-model';

const verdictLabels: Record<Status, string> = { supported: '지원', preview: '브라우저 미리보기', review: '확인 필요', unsupported: '미지원' };

function verdict() {
  const groups = statusOrder.map(status => ({ status, names: platforms.filter(platform => baseline[platform] === status).map(platform => platformLabels[platform]) }))
    .filter(group => group.names.length);
  const scope = exceptions.length ? `공개 컴포넌트 ${coverage.total}개 중 ${coverage.total - exceptions.length}개가` : `공개 컴포넌트 ${coverage.total}개 모두`;
  return `${scope} ${groups.map(group => `${group.names.join('·')}에서 ${verdictLabels[group.status]}`).join(', ')} 상태입니다.`;
}

function runtimeLabel(runtime: string) {
  return runtime === 'chromium' ? 'Chromium' : runtime === 'react-native-web' ? 'React Native Web' : runtime;
}

export function Summary() {
  return <section id="support-summary" aria-labelledby="coverage-summary-title">
    <h2 id="coverage-summary-title">지원·검증 요약</h2>
    <p className="coverage-verdict">{verdict()}</p>
    <div className="coverage-platforms">{coverage.summary.map(summary => {
      const platform = summary.platform as Platform;
      const counts = summary.counts as Record<Status, number>;
      const present = statusOrder.filter(status => counts[status] > 0);
      return <div className="coverage-platform" key={platform} data-coverage-summary={platform}>
        <div className="coverage-platform-head">
          <h3>{platformLabels[platform]}</h3>
          <span className="coverage-provided">{summary.provided} / {coverage.total}개 제공</span>
        </div>
        <div className="coverage-meter" role="img" aria-label={present.map(status => `${statusLabels[status]} ${counts[status]}개`).join(', ')}>
          {present.map(status => <span key={status} data-status={status} style={{ flexGrow: counts[status] }} />)}
        </div>
        <p className="coverage-platform-counts">{present.map(status => <span className="coverage-summary-state" key={status}><CoverageStatus status={status} /> {counts[status]}개</span>)}</p>
        <p className="coverage-runtime">검증 환경 · {summary.runtimes.map(runtimeLabel).join(', ') || '연결된 통과 기록 없음'}</p>
        {summary.devicesNotRun && <p className="coverage-device-notice">Native는 브라우저 미리보기입니다. <strong>iOS·Android 실제 기기와 시뮬레이터 검증은 수행하지 않았습니다.</strong></p>}
      </div>;
    })}</div>
    <div className="coverage-exceptions">
      <h3>기본 범위와 다른 컴포넌트</h3>
      {exceptions.length
        ? <ul>{exceptions.map(entry => <li key={entry.name}><Link href={entry.docs}>{entry.title}</Link></li>)}</ul>
        : <p>없음 · 모든 공개 컴포넌트가 위 기본 범위를 따릅니다.</p>}
    </div>
    <p className="coverage-basis">공개 컴포넌트 {coverage.total}개 기준이며 Provider·서비스·보조 API는 제외합니다. 검색과 분류는 이 수치를 바꾸지 않습니다. 현재 카탈로그 상태와 연결된 검증 기록을 보여 주며, 모든 상태 조합의 검증이나 최신 코드의 재검증을 보장하지 않습니다.</p>
  </section>;
}

export function Legend() {
  const descriptions: Record<Status, string> = {
    supported: '웹 검증 통과',
    preview: '브라우저 미리보기 · 기기 검증 아님',
    review: '검증 통과 기록 없음',
    unsupported: '구현 없음',
  };
  return <dl className="coverage-legend" aria-label="지원 상태 설명">{usedStatuses.map(status => <div key={status}>
    <dt><CoverageStatus status={status} /></dt><dd>{descriptions[status]}</dd>
  </div>)}</dl>;
}
