'use client';
import { useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { DsButton as Button, DsIcon as Icon, DsInput as Input, DsSelect, DsRadioGroup, KjunProvider } from '@kjun/react';
import { tokens } from '@kjun/tokens';
import { useIconCatalogData, useIconPage } from './use-icon-data';
import { iconPageSize, searchIcons, selectIcon, type IconEntry, type IconSelection } from '../../../../shared/icon-catalog';
import { iconSelectionScenario } from '../../../../shared/icon-examples';
import { GuideExample } from './guide-example';
import Link from './doc-link';
import { IconRegistrationCode } from './icon-registration-code';
import { CodeBlock } from './code-block';
import { useDocsPlatform } from './docs-platform';

// The detail preview shows the selected shape, so it follows the document's light/dark mode.
const darkQuery = '(prefers-color-scheme: dark)';
const subscribeScheme = (change: () => void) => { const query = matchMedia(darkQuery); query.addEventListener('change', change); return () => query.removeEventListener('change', change); };
const count = (value: number) => value.toLocaleString('ko-KR');
const useDocumentPalette = () => useSyncExternalStore(subscribeScheme, () => matchMedia(darkQuery).matches ? 'dark' as const : 'default' as const, () => 'default' as const);

export function IconCatalog() {
  const { platform } = useDocsPlatform();
  const palette = useDocumentPalette();
  const data = useIconCatalogData(), { catalog } = data;
  const [draft, setDraft] = useState(''), [query, setQuery] = useState(''), [page, setPage] = useState(1);
  const [selection, setSelection] = useState<IconSelection | null>(null), [notice, setNotice] = useState('');
  const composing = useRef(false), title = useRef<HTMLHeadingElement>(null), detail = useRef<HTMLHeadingElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const focusedCard = useRef<HTMLElement | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(1);
  const results = useMemo(() => searchIcons(catalog, query), [catalog, query]);
  const pages = Math.max(1, Math.ceil(results.length / iconPageSize));
  const visible = results.slice((page - 1) * iconPageSize, page * iconPageSize);
  const shapes = useIconPage([...visible.map(entry => entry.name), ...(selection ? [selection.name] : [])]);
  const selected = catalog.find(entry => entry.name === selection?.name);
  const selectionKey = JSON.stringify([platform, selection]);
  // Keep the detail in DOM reading order immediately after the selected row.
  useLayoutEffect(() => {
    const element = grid.current;
    if (!element) return;
    const measure = () => setColumns(getComputedStyle(element).gridTemplateColumns.split(' ').length);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    const old = focusedCard.current;
    if (old && !old.isConnected && document.activeElement === document.body) title.current?.focus();
    if (old && !old.isConnected) focusedCard.current = null;
  }, [results, page]);
  const search = (value: string) => { setQuery(value); setPage(1); };
  const choose = (entry: IconEntry) => {
    const fallback = !!selection?.filled && !entry.filled;
    setSelection(selectIcon(selection, entry));
    setNotice(`${entry.name} 선택. ${fallback ? '채움형을 지원하지 않아 선형으로 전환했습니다.' : entry.label}`);
  };
  const selectedIndex = visible.findIndex(entry => entry.name === selected?.name);
  const detailIndex = selectedIndex < 0 ? visible.length : Math.min(visible.length, Math.ceil((selectedIndex + 1) / columns) * columns);
  const cards = visible.map(entry => <div className="icon-tile" key={entry.name}>
    <Button className="icon-card" block variant="secondary" disabled={!platform} ariaLabel={entry.name + ' · ' + entry.label}
      aria-pressed={entry.name === selection?.name} aria-controls={entry.name === selection?.name ? 'icon-detail' : undefined} onClick={() => choose(entry)}>
      {shapes.icons[entry.name] ? <Icon name={entry.name} size={24} aria-hidden="true" /> : <span aria-hidden="true">{shapes.loading ? '…' : '!'}</span>}
    </Button>
    <span className="icon-official">{entry.name}</span><span>{entry.label}</span>
    {entry.filled && <span className="icon-support">채움형 지원</span>}
  </div>);
  const selectedDetail = selection && selected ? <div className="icon-detail" id="icon-detail" key="selected-detail">
    <h3 ref={detail} tabIndex={-1}>선택한 아이콘 상세</h3>
    <p role="status" className="sr-only">{notice}</p>
    {!results.some(entry => entry.name === selected.name) && <p className="icon-selection-hint">현재 검색 결과 밖의 선택입니다. 상세와 설정은 유지됩니다.</p>}
    {selectedIndex < 0 && results.some(entry => entry.name === selected.name) && <p className="icon-selection-hint">이전 페이지의 선택입니다. 상세와 설정은 유지됩니다.</p>}
    <div className="icon-detail-content">
      <GuideExample name="GuideIconSelection" scenario={iconSelectionScenario(selection)} executionKey={selectionKey} destination="/components/icon#api" mode="comparison" palette={palette} />
      <div className="icon-detail-settings">
        <div className="icon-name"><CodeBlock code={selected.name} label={selected.label} copyLabel="이름 복사" requestKey={selectionKey}
          copySuccess="이름을 복사했습니다" copyFailure="복사하지 못했습니다. 공식 이름을 직접 선택해 주세요." /></div>
        <div className="icon-options">
          <div><p>크기</p><DsSelect ariaLabel="아이콘 크기" value={selection.size}
            options={Object.entries(tokens.iconSizes).map(([role, size]) => ({ value: size, label: `${size} · ${role}` }))}
            onValueChange={value => setSelection({ ...selection, size: Number(value) })} /></div>
          <div><p>형태</p><DsRadioGroup ariaLabel="아이콘 형태" value={selection.filled ? 'filled' : 'outline'}
            options={[{ value: 'outline', label: '선형' }, { value: 'filled', label: '채움형', disabled: !selected.filled }]}
            onValueChange={value => setSelection({ ...selection, filled: value === 'filled' })} /></div>
        </div>
        <p id="icon-filled-hint">{selected.filled ? '선형과 채움형을 모두 지원합니다.' : '이 아이콘은 선형만 지원합니다.'}</p>
        <p className="icon-detail-link"><Link href="/components/icon#api">Icon API</Link></p>
        {platform && <IconRegistrationCode selection={selection} platform={platform} />}
        {notice.includes('선형으로 전환') && <p className="icon-selection-hint">채움형을 지원하지 않아 선형으로 전환했습니다.</p>}
      </div>
    </div>
  </div> : null;
  cards.splice(detailIndex, 0, ...(selectedDetail ? [selectedDetail] : []));
  return <KjunProvider icons={shapes.icons}><section id="catalog">
    <h2>아이콘 목록·검색</h2>
    <p className="body-copy">선형 {count(catalog.length)}개 · 채움형 {count(catalog.filter(entry => entry.filled).length)}개. 아이콘을 선택하면 크기·형태를 확인하고 이름을 복사할 수 있습니다.</p>
    {data.loading && <p role="status">아이콘 검색 정보를 불러오는 중입니다.</p>}
    {data.error && <div role="alert"><p>{data.error}</p><Button onClick={data.retry}>검색 정보 다시 시도</Button></div>}
    <div className="icon-search">
      <label htmlFor="icon-query">이름·한국어 용도 검색</label>
      <Input ref={input} id="icon-query" className="icon-search-input" prefixIcon="search" disabled={!platform} value={draft} placeholder="예: arrow left, 즐겨찾기, 설정"
        suffix={draft ? <Button size="sm" variant="ghost" ariaLabel="검색 초기화" title="검색 초기화" prefixIcon="x" disabled={!platform} onClick={() => { setDraft(''); search(''); input.current?.focus(); }} /> : undefined}
        onChange={event => {
        const value = event.target.value; setDraft(value); if (!composing.current) search(value);
      }} onCompositionStart={() => { composing.current = true; }} onCompositionEnd={event => {
        composing.current = false; setDraft(event.currentTarget.value); search(event.currentTarget.value);
      }} />
    </div>
    <p className="icon-catalog-hint">목록의 도형은 React 기준입니다. 선택 상세에는 현재 플랫폼의 실제 출력을 표시합니다.</p>
    <div className="icon-catalog-layout">
      <div className="icon-results">
        <div className="icon-results-heading">
          <h3 ref={title} tabIndex={-1}>검색 결과 <span aria-live="polite">{count(results.length)}개</span></h3>
          {selection && <Button size="sm" variant="ghost" onClick={() => detail.current?.focus()}>선택한 아이콘 상세로 이동</Button>}
        </div>
        {!data.loading && !data.error && !results.length && <p>일치하는 아이콘이 없습니다. 다른 이름이나 용도를 입력하거나 검색을 초기화하세요.</p>}
        {shapes.loading && <p role="status">현재 페이지의 아이콘을 불러오는 중입니다.</p>}
        {shapes.failed.length > 0 && <div role="alert"><p>아이콘 {shapes.failed.length}개의 도형을 불러오지 못했습니다.</p><Button onClick={shapes.retry}>도형 다시 시도</Button></div>}
        <div className="icon-grid" ref={grid} onFocusCapture={event => { if ((event.target as HTMLElement).closest('.icon-card')) focusedCard.current = event.target as HTMLElement; }}>{cards}</div>
        {pages > 1 && <nav className="icon-pagination" aria-label="아이콘 목록 페이지">
          <Button variant="secondary" disabled={!platform} aria-disabled={page <= 1} onClick={() => { if (page > 1) setPage(page - 1); }}>이전 페이지</Button>
          <span role="status">{page} / {count(pages)} 페이지</span>
          <Button variant="secondary" disabled={!platform} aria-disabled={page >= pages} onClick={() => { if (page < pages) setPage(page + 1); }}>다음 페이지</Button>
        </nav>}
      </div>
    </div>
  </section></KjunProvider>;
}
