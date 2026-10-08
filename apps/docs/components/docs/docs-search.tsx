'use client';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DsButton, DsInput, DsModal } from '@kjun-ui/react';
import { documents, categoryFor, searchDocuments } from '@/lib/discovery';
import { useDocsPlatform } from './docs-platform';

export function DocsSearch() {
  const platform = useDocsPlatform(), router = useRouter(), listId = useId();
  const [open, setOpen] = useState(false), [query, setQuery] = useState(''), [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);
  const [shortcut, setShortcut] = useState('⌘ / Ctrl K');
  const composing = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const results = useMemo(() => query.trim() ? searchDocuments(documents, query) : [], [query]);
  const changeOpen = (value: boolean) => {
    setOpen(value);
    if (!value) { setQuery(''); setActive(0); composing.current = false; }
  };
  const select = (index: number) => {
    if (composing.current || !results[index]) return;
    changeOpen(false);
    router.push(platform.href(results[index].href));
  };
  useEffect(() => {
    setReady(true);
    setShortcut(/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘K' : 'Ctrl K');
    const keydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && !event.isComposing) {
        event.preventDefault(); changeOpen(!open);
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    // Wait for the modal's focus scope to replace the previously active overlay.
    const frame = requestAnimationFrame(() => input.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [open]);
  useEffect(() => { document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' }); }, [active, listId, results]);
  return <>
    <DsButton disabled={!ready} variant="secondary" size="sm" prefixIcon="search" className="docs-search-trigger" ariaLabel="문서 검색"
      aria-haspopup="dialog" aria-expanded={open} onClick={() => changeOpen(true)}>
      <span>문서 검색</span><kbd>{shortcut}</kbd>
    </DsButton>
    <DsModal open={open} onOpenChange={changeOpen} title="문서 검색" ariaLabel="문서 검색" size="lg" closable={false}
      header={<span className="docs-search-heading"><span>문서 검색</span>
        <DsButton variant="ghost" size="sm" prefixIcon="x" ariaLabel="검색 닫기" onClick={() => changeOpen(false)} />
      </span>}>
      <div className="docs-search-dialog">
        <p className="sr-only" id={`${listId}-description`}>컴포넌트 이름, 용도 또는 API 속성으로 검색하세요.</p>
        <DsInput ref={input} value={query} onValueChange={value => { setQuery(value); setActive(0); }} prefixIcon="search"
          placeholder="이름, 용도, API 검색…" ariaLabel="문서 검색어" role="combobox" aria-autocomplete="list"
          aria-expanded={open} aria-controls={listId} aria-describedby={`${listId}-description`}
          aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
          onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }}
          onKeyDown={event => {
            if (composing.current || event.nativeEvent.isComposing || event.keyCode === 229) return;
            if (event.key === 'Enter') { event.preventDefault(); select(active); }
            if (results.length && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
              event.preventDefault(); setActive(value => (value + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length);
            }
          }} />
        <div className="search-summary" role="status">{query.trim() ? `${results.length}개 문서` : '예: 알림, 검색, 저장 폼, loadOptions'}</div>
        <div id={listId} role="listbox" aria-label="문서 검색 결과" className="docs-search-results">
          {results.map(({ document, match }, index) => <div key={document.id} id={`${listId}-${index}`} role="option"
            aria-selected={active === index} onMouseMove={() => setActive(index)} onMouseDown={event => event.preventDefault()} onClick={() => select(index)}>
            <span className="search-result-content">
              <span className="search-result-title"><strong>{document.title}</strong><span>{categoryFor(document.category)?.label || document.group}</span></span>
              <span className="search-result-description">{match.startsWith('API ·') ? match : document.description}</span>
            </span>
          </div>)}
        </div>
        {!results.length && <p className="docs-search-empty">{query.trim() ? '일치하는 문서가 없습니다. 다른 용도로 검색해 보세요.' : '검색어를 입력하세요.'}</p>}
        <p className="search-keyboard-hint">↑ ↓ 선택 <span>Enter 이동</span><span>Esc 닫기</span></p>
      </div>
    </DsModal>
  </>;
}
