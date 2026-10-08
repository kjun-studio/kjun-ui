'use client';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from './doc-link';
import { DsInput as Input } from '@kjun/react';
import { DsButton as Button } from '@kjun/react';
import { DsCard as Card } from '@kjun/react';
import { categories, components, searchDocuments } from '@/lib/discovery';
import coverage from '@/lib/generated/coverage.json';
import { Availability, CoverageList, platforms, platformLabels } from './coverage-list';
import { Legend, Summary } from './coverage-summary';

const byName = new Map(coverage.components.map(entry => [entry.name, entry]));
const validCategory = (value: string | null) => categories.some(category => category.id === value) ? value! : '';
function ServicesAndRecords() {
  return <>
    <section id="services">
      <h2>설정·피드백 서비스</h2>
      <p className="body-copy">패키지의 제공 여부입니다. 개별 테스트 통과를 의미하지 않으며, 공개 컴포넌트 {coverage.total}개 집계에서 제외합니다.</p>
      <div className="coverage-services">{coverage.services.map(service => <Card surface="muted" key={service.name} className="coverage-service" data-coverage-service={service.name}>
        <h3>{service.name}</h3><p>{service.description}</p>
        <dl className="coverage-platform-list">{platforms.map(platform => <div key={platform}><dt>{platformLabels[platform]}</dt><dd><Availability provided={service.platforms.includes(platform)} /></dd></div>)}</dl>
        <Link href={service.docs}>{service.linkLabel}</Link>
      </Card>)}</div>
    </section>
    <section id="verification">
      <h2>검증 기록</h2>
      <p className="body-copy">기록일은 원문에 적힌 날짜이며 최종 검증일이 아닙니다. 연결 수는 현재 카탈로그의 공개 컴포넌트 기준입니다. 당시 범위와 제약은 원문에서 확인하세요.</p>
      <div className="coverage-records">{coverage.records.map(record => <Card surface="muted" key={record.id} id={`record-${record.id}`} className="coverage-record" tabIndex={-1}>
        <h3>{record.title}</h3>
        <p>기록일 · <time dateTime={record.date}>{record.date}</time></p>
        <p>연결된 컴포넌트 {record.componentCount}개</p>
        <a href={record.download} download aria-label={`${record.title} 원문 다운로드`}>원문 다운로드 (.md)</a>
      </Card>)}</div>
    </section>
  </>;
}

export function Coverage() {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [category, setCategory] = useState(validCategory(params.get('category')));
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const locationSearch = params.toString();
  useEffect(() => {
    const restore = () => {
      const current = new URLSearchParams(location.search);
      setQuery(current.get('q') || ''); setCategory(validCategory(current.get('category')));
    };
    restore();
    window.addEventListener('popstate', restore);
    window.addEventListener('pageshow', restore);
    return () => { window.removeEventListener('popstate', restore); window.removeEventListener('pageshow', restore); };
  }, [locationSearch]);
  const update = (nextQuery: string, nextCategory: string, replace = false) => {
    setQuery(nextQuery); setCategory(nextCategory);
    const url = new URL(location.href);
    if (nextQuery) url.searchParams.set('q', nextQuery); else url.searchParams.delete('q');
    if (nextCategory) url.searchParams.set('category', nextCategory); else url.searchParams.delete('category');
    if (url.href !== location.href) window.history[replace ? 'replaceState' : 'pushState'](window.history.state, '', url);
  };
  const results = useMemo(() => {
    const entries = query.trim() ? searchDocuments(components, query).map(result => byName.get(result.document.component!)!) : coverage.components;
    return entries.filter(entry => !category || entry.category === category);
  }, [query, category]);
  const toggle = (name: string) => setExpanded(previous => {
    const next = new Set(previous); if (next.has(name)) next.delete(name); else next.add(name); return next;
  });
  return <div className="coverage-page">
    <Summary />
    <section id="coverage">
      <h2>컴포넌트 목록</h2>
      <form className="coverage-search" role="search" aria-label="지원 현황 검색" onSubmit={event => { event.preventDefault(); update(query, category); }}>
        <label htmlFor="coverage-query" className="sr-only">컴포넌트 검색</label>
        <div><Input prefixIcon="search" id="coverage-query" aria-label="컴포넌트 검색어" placeholder="이름, 한국어 별칭, 용도, API" value={query} onChange={event => update(event.target.value, category, true)} /></div>
      </form>
      <div className="coverage-filters" role="group" aria-label="컴포넌트 분류">
        {[{ id: '', label: '전체', count: coverage.total }, ...categories].map(item => <Button key={item.id} size="sm" variant={category === item.id ? 'primary' : 'secondary'}
          aria-pressed={category === item.id} onClick={() => update(query, item.id)}>{item.label} <span>{item.count}</span></Button>)}
      </div>
      <div className="coverage-results"><p role="status" aria-live="polite">{results.length}개 컴포넌트 / 전체 {coverage.total}개</p>
        {(query || category) && <Button variant="ghost" size="sm" onClick={() => update('', '')}>검색·분류 초기화</Button>}
        <Legend />
      </div>
      {results.length ? <CoverageList entries={results} expanded={expanded} toggle={toggle} grouped={!query.trim() && !category} /> : <div className="coverage-empty">
        <h3>일치하는 컴포넌트가 없습니다</h3><p>다른 검색어를 입력하거나 분류를 변경해 보세요.</p>
        <Button variant="secondary" onClick={() => update('', '')}>전체 컴포넌트 보기</Button>
      </div>}
    </section>
    <ServicesAndRecords />
  </div>;
}
