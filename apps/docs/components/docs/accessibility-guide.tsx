'use client';
import Link from './doc-link';
import { DsBadge as Badge } from '@kjun/react';
import { DsCard as Card } from '@kjun/react';
import { PlatformLoading, useDocsPlatform } from './docs-platform';
import { AccessibilityLoading, useAccessibilityData } from './accessibility-data';
import guides from '../../../../shared/component-guides.json';
import type { Definition, Status } from '../../../../shared/accessibility-guides/model';
import { apiAnchor, latestRun, statusFor, statusLabels, verificationHref } from '../../../../shared/accessibility-guides/selection';
export function ResultBadge({ result, stale, compact = false }: { result: { status: Status }; stale?: boolean; compact?: boolean }) {
  const text = (stale ? '재검증 필요 · 이전 ' : '') + statusLabels[result.status];
  return <Badge variant={stale ? "warning" : result.status === "failed" ? "danger" : result.status === "passed" ? "success" : "secondary"} className="accessibility-status" data-status={stale ? 'stale' : result.status}>
    {compact && stale ? <><span className="sr-only">재검증 필요 · </span>이전 {statusLabels[result.status]}</> : text}</Badge>;
}
function AccessibilityApi({ definition }: { definition: Definition }) {
  if (!definition.api.length) return null;
  return <p className="accessibility-api"><span>관련 API</span>{definition.api.map(member => <Link key={member}
    href={`${definition.component === 'KjunFeedbackProvider' ? '/feedback' : '/components/' + guides[definition.component as keyof typeof guides].slug}?platform=${definition.platform}#${apiAnchor(definition.platform, definition.component === 'KjunFeedbackProvider' ? 'methods' : 'props', member)}`}><code>{member}</code></Link>)}</p>;
}
export function AccessibilityDescription({ definition, showApi = true }: { definition: Definition; showApi?: boolean }) {
  return <div className="accessibility-description">
    <p>{definition.behavior}</p>
    <p className="accessibility-responsibility"><strong>적용 프로젝트의 책임</strong>{definition.responsibility}</p>
    {showApi && <AccessibilityApi definition={definition} />}
  </div>;
}
export function AccessibilityGuide({ name }: { name: string }) {
  const { platform } = useDocsPlatform();
  const accessibility = useAccessibilityData();
  const guide = guides[name as keyof typeof guides];
  const defs = platform && accessibility ? accessibility.definitions.filter(def => def.component === name && def.platform === platform) : [];
  const run = platform && accessibility ? latestRun(accessibility.runs, name, platform) : undefined;
  return <section id="accessibility" className="accessibility-guide">
    <h2>접근성·플랫폼 차이</h2>
    <p className="body-copy"><Link href="/accessibility">접근성 공통 가이드</Link>에서 키보드·포커스·이름·글자 확대와 적용 프로젝트의 책임을 확인하세요.</p>
    {guide && <p className="body-copy">{guide.differences}</p>}
    {!platform ? <PlatformLoading /> : !accessibility ? <AccessibilityLoading /> : <>
      <p className="body-copy">{defs[0]?.platformNote}</p>
      <p className="accessibility-results-note">{run?.stale
        ? '현재 패키지 또는 검사 정의가 기록과 달라 재검증이 필요합니다. 배지는 이전 검사 조건에서의 결과입니다.'
        : '배지는 명시된 검사 조건의 결과입니다. 구현 지원 여부와 별도로 확인하세요.'}</p>
      <div className="accessibility-items">{defs.map(def => <Card surface="muted" key={def.id} className="accessibility-item" data-accessibility-item={def.item}
        title={def.label} headerActions={<ResultBadge result={{ status: statusFor(def, run) }} stale={run?.stale} compact />}
        footer={<div className="accessibility-item-footer"><AccessibilityApi definition={def} />
          <Link className="accessibility-record-link" href={verificationHref(name, platform, run?.id, def.item)}
            aria-label={`${def.label} · 검증 기록 보기`}>검증 기록 보기</Link></div>}>
        <div className="accessibility-item-content">
          <AccessibilityDescription definition={def} showApi={false} />
          {!def.applicable && <p className="accessibility-responsibility"><strong>해당 없음 사유</strong>{def.reason}</p>}
        </div>
      </Card>)}</div>
    </>}
  </section>;
}
