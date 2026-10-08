'use client';
import Link from '@/components/docs/doc-link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DsInput as Input } from '@kjun-ui/react';
import { DsButton as Button } from '@kjun-ui/react';
import { DsCard as Card } from '@kjun-ui/react';
import { categories, components, categoryFor, searchDocuments, type DiscoveryDocument } from '@/lib/discovery';

function GalleryCard({ document }: { document: DiscoveryDocument }) {
  const [failed, setFailed] = useState(false);
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (image.current?.complete && !image.current.naturalWidth) setFailed(true);
  }, []);
  return <Link href={document.path} className="gallery-card-link" data-component-card={document.component} aria-label={`${document.title} 문서`}>
    <Card border padding="none" className="gallery-card">
      <div className="gallery-thumbnail">
        {failed ? <span className="thumbnail-unavailable">미리보기를 불러오지 못했습니다</span> :
          <img ref={image} src={document.thumbnail} alt="" width={1280} height={800} loading="lazy" decoding="async" onError={() => setFailed(true)} />}
      </div>
      <div className="gallery-card-content">
        <span className="gallery-card-category">{categoryFor(document.category)?.label}</span>
        <h2>{document.title}</h2><p>{document.description}</p>
        {document.parent && <span className="gallery-parent">{document.parent.slice(2)}의 구성 요소</span>}
      </div>
    </Card>
  </Link>;
}

export function ComponentGallery() {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [category, setCategory] = useState(categories.some(item => item.id === params.get('category')) ? params.get('category')! : '');
  const locationSearch = params.toString();
  useEffect(() => {
    const restore = () => {
      const current = new URLSearchParams(window.location.search);
      setQuery(current.get('q') || '');
      setCategory(categories.some(item => item.id === current.get('category')) ? current.get('category')! : '');
    };
    restore();
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, [locationSearch]);
  const update = (nextQuery: string, nextCategory: string, replace = false) => {
    setQuery(nextQuery); setCategory(nextCategory);
    const params = new URLSearchParams(window.location.search);
    if (nextQuery) params.set('q', nextQuery); else params.delete('q');
    if (nextCategory) params.set('category', nextCategory); else params.delete('category');
    const url = '/components' + (params.size ? '?' + params : '') + window.location.hash;
    if (url !== window.location.pathname + window.location.search + window.location.hash)
      window.history[replace ? 'replaceState' : 'pushState'](window.history.state, '', url);
  };
  const results = useMemo(() => searchDocuments(components, query)
    .filter(result => !category || result.document.category === category), [query, category]);
  return <div className="component-gallery">
    <form className="gallery-search" onSubmit={event => { event.preventDefault(); update(query, category); }} role="search" aria-label="컴포넌트 검색">
      <Input prefixIcon="search" aria-label="컴포넌트 검색어" placeholder="이름, 용도, API로 검색" value={query}
        onChange={event => update(event.target.value, category, true)} />
    </form>
    <div className="gallery-filters" aria-label="컴포넌트 분류">
      {[{ id: '', label: '전체', count: components.length }, ...categories].map(item => <Button key={item.id} size="sm"
        variant={category === item.id ? 'primary' : 'secondary'} aria-pressed={category === item.id}
        onClick={() => update(query, item.id)}>{item.label}<span>{item.count}</span></Button>)}
    </div>
    <div className="gallery-summary"><p role="status">{results.length}개 컴포넌트</p>
      {(query || category) && <Button variant="ghost" size="sm" onClick={() => update('', '')}>검색·필터 초기화</Button>}
    </div>
    <p className="gallery-note">대표 이미지는 형태를 알아보기 쉽게 확대했습니다. 실제 크기는 상세 예제에서 확인하세요.<br />이미지는 React 예제입니다. 각 문서에서 선택한 플랫폼의 예제를 직접 조작할 수 있습니다. <Link href="/catalog">플랫폼별 지원 범위</Link></p>
    {results.length ? <div className="gallery-grid">{results.map(({ document }) => <GalleryCard key={document.id} document={document} />)}</div> :
      <div className="gallery-empty"><h2>일치하는 컴포넌트가 없습니다</h2><p>다른 용도로 검색하거나 분류를 변경해 보세요.</p>
        <Button variant="secondary" onClick={() => update('', '')}>전체 컴포넌트 보기</Button></div>}
  </div>;
}

export function CategoryLinks() {
  return <div className="category-links">{categories.map(category => {
    const representative = components.find(document => document.category === category.id && !document.parent);
    return <Link key={category.id} href={`/components?category=${category.id}`}>
      <span className="category-thumbnail">{representative && <img src={representative.thumbnail} alt="" width={1280} height={800} loading="lazy" decoding="async" />}</span>
      <span className="category-text"><span><strong>{category.label}</strong><span>{category.count}</span></span><p>{category.description}</p></span>
    </Link>;
  })}</div>;
}
