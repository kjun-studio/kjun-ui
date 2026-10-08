'use client';
import { useState } from 'react';
import Link from './doc-link';
import { DsButton as Button } from '@kjun-ui/react';
import { DsCard as Card } from '@kjun-ui/react';
import { DsBadge as Badge } from '@kjun-ui/react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './disclosure';
import { DsTable } from '@kjun-ui/react';
import coverage from '@/lib/generated/coverage.json';
import { verificationHref } from '../../../../shared/accessibility-guides/selection';
import { categories, categoryFor } from '@/lib/discovery';
import { isException, platformLabels, platforms, statusLabels, type Entry } from './coverage-model';
export { platformLabels, platforms, statusLabels };


/** Services report package availability with the same badge language as component states. */
export function Availability({ provided }: { provided: boolean }) {
  return <Badge variant={provided ? "success" : "secondary"} className="coverage-status" data-status={provided ? "supported" : "unsupported"}>{provided ? '제공' : '미제공'}</Badge>;
}
export function CoverageStatus({ status }: { status: string }) {
  return <Badge variant={status === "supported" ? "success" : status === "preview" ? "info" : status === "review" ? "warning" : "secondary"} className="coverage-status" data-status={status}>{statusLabels[status as keyof typeof statusLabels]}</Badge>;
}
function Difference({ entry, mode, open, toggle }: { entry: Entry; mode: string; open: boolean; toggle(): void }) {
  const id = `coverage-${mode}-${entry.name}`;
  const record = coverage.records.find(record => record.id === entry.recordId)!;
  return <Collapsible open={open} onOpenChange={toggle} className="coverage-difference">
    {!open && <p className="coverage-excerpt">{entry.differences}</p>}
    <CollapsibleTrigger variant="ghost" size="sm" id={`${id}-trigger`}
      aria-label={`${entry.title} 플랫폼 차이·근거 ${open ? '접기' : '펼치기'}`} aria-controls={id} aria-expanded={open}>
      {open ? '접기' : '차이·근거'}
    </CollapsibleTrigger>
    <CollapsibleContent id={id} aria-labelledby={`${id}-trigger`} keepMounted>
      <p>{entry.differences}</p>
      <div className="coverage-detail-links">
        <Link href={`${entry.docs}#api`}>{entry.title} 상세 API</Link>
        {platforms.map(platform => <Link key={platform} href={verificationHref(entry.name, platform, entry.recordId)}
          aria-label={`${entry.title} ${platformLabels[platform]} 검증 기록 보기`}>{platformLabels[platform]} 검증 기록</Link>)}
        <a href={`#record-${record.id}`}>원본 기록 · {record.title}</a>
      </div>
    </CollapsibleContent>
  </Collapsible>;
}

function ComponentCard({ entry, expanded, toggle }: { entry: Entry; expanded: Set<string>; toggle(name: string): void }) {
  return <Card surface="muted" role="listitem" className="coverage-component-card" data-coverage-component={entry.name}>
    <h3 className="coverage-name"><Link href={entry.docs} className="coverage-component-link">{entry.title}</Link>
      <span className="coverage-category">{categoryFor(entry.category)?.label}</span></h3>
    <dl className="coverage-platform-list">{platforms.map(platform => <div key={platform}>
      <dt>{platformLabels[platform]}</dt><dd><CoverageStatus status={entry.states[platform]} /></dd>
    </div>)}</dl>
    <Difference entry={entry} mode="card" open={expanded.has(entry.name)} toggle={() => toggle(entry.name)} />
  </Card>;
}

/** Phones browse the unfiltered catalog by category; a search or category shows its matches directly. */
function GroupedCards({ entries, expanded, toggle }: { entries: Entry[]; expanded: Set<string>; toggle(name: string): void }) {
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const groups = categories.map(category => ({ category, items: entries.filter(entry => entry.category === category.id) })).filter(group => group.items.length);
  const allOpen = groups.every(group => open.has(group.category.id));
  const change = (id: string, next: boolean) => setOpen(previous => {
    const result = new Set(previous); if (next) result.add(id); else result.delete(id); return result;
  });
  return <>
    <div className="coverage-group-tools">
      <Button variant="ghost" size="sm" onClick={() => setOpen(allOpen ? new Set() : new Set(groups.map(group => group.category.id)))}>{allOpen ? '모두 접기' : '모두 펼치기'}</Button>
    </div>
    {groups.map(({ category, items }) => {
      const differing = items.filter(isException).length;
      return <Collapsible key={category.id} className="coverage-group" data-coverage-group={category.id}
        open={open.has(category.id)} onOpenChange={next => change(category.id, next)}>
        <CollapsibleTrigger variant="ghost" size="md" block className="coverage-group-trigger" suffixIcon={open.has(category.id) ? 'chevron-up' : 'chevron-down'}
          aria-label={`${category.label} ${items.length}개 ${open.has(category.id) ? '접기' : '펼치기'}`}>
          <span className="coverage-group-title">{category.label}</span>
          <span className="coverage-group-meta">{items.length}개 · {differing ? `예외 ${differing}개` : '모두 기본 범위'}</span>
        </CollapsibleTrigger>
        <CollapsibleContent keepMounted>
          <div role="list" aria-label={`${category.label} 컴포넌트 지원 목록`} className="coverage-card-list">
            {items.map(entry => <ComponentCard key={entry.name} entry={entry} expanded={expanded} toggle={toggle} />)}
          </div>
        </CollapsibleContent>
      </Collapsible>;
    })}
  </>;
}

export function CoverageList({ entries, expanded, toggle, grouped = false }: { entries: Entry[]; expanded: Set<string>; toggle(name: string): void; grouped?: boolean }) {
  return <>
    <div className="coverage-table-view">
      <DsTable<Entry> ariaLabel="컴포넌트 플랫폼 지원 비교" responsive="none" rowKey="name" hoverable={false}
        columns={[
          { key: 'name', label: '컴포넌트', width: '22%', render: (_, entry) => <span data-coverage-component={entry.name} className="coverage-name">
            <Link href={entry.docs} className="coverage-component-link">{entry.title}</Link>
            <span className="coverage-category">{categoryFor(entry.category)?.label}</span>
          </span> },
          ...platforms.map(platform => ({ key: platform, label: platformLabels[platform], width: '12%', align: 'center' as const, render: (_: unknown, entry: Entry) => <CoverageStatus status={entry.states[platform]} /> })),
          { key: 'differences', label: '플랫폼 차이·근거', render: (_, entry) => <Difference entry={entry} mode="table" open={expanded.has(entry.name)} toggle={() => toggle(entry.name)} /> },
        ]} data={entries} />
    </div>
    <div className="coverage-card-view">
      {grouped ? <GroupedCards entries={entries} expanded={expanded} toggle={toggle} />
        : <div role="list" aria-label="컴포넌트 플랫폼 지원 목록" className="coverage-card-list">
          {entries.map(entry => <ComponentCard key={entry.name} entry={entry} expanded={expanded} toggle={toggle} />)}
        </div>}
    </div>
  </>;
}
