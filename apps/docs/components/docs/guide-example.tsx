'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from './doc-link';
import { useDocsPlatform, PlatformLoading } from './docs-platform';
import { useCatalog } from './use-catalog';
import { DsButton as Button, DsCard as Card } from '@kjun/react';
import type { GuideCase } from '../../../../shared/visual-guides/types';
import type { PaletteName, PlatformName } from '../../../../shared/demo-config';
const repeatedDescriptions = new Set([
  '사용 예제의 초기 설정입니다. 패키지 기본값은 API 표에서 확인하세요.',
  '공개 size 속성의 비교 설정입니다.',
  '이 컴포넌트의 입력 또는 행동을 비활성화합니다.',
  '공개 loading 속성으로 진행 중 상태를 표시합니다.',
  '공개 error 속성이 담당하는 오류 상태입니다.',
  '소비자가 관리하는 값을 예제의 초기 상태로 제공합니다.',
  '기존 예제 프리셋으로 상태 전이를 확인합니다.',
  '실행 비교를 연 뒤 트리거로 내용을 확인합니다. 닫기와 키보드 동작도 함께 확인하세요.',
]);
type Entry = { ready: boolean; failed: boolean; enter: () => void; retry: () => void };
export function GuideExample({
  name,
  scenario,
  destination = '#usage',
  mode = 'interactive',
  startOnRequest = false,
  executionKey = "",
  palette = 'default',
}: {
  name: string;
  scenario: GuideCase;
  destination?: string;
  mode?: 'comparison' | 'interactive';
  startOnRequest?: boolean;
  executionKey?: string;
  palette?: PaletteName;
}) {
  const { platform } = useDocsPlatform();
  const host = useRef<HTMLDivElement>(null),
    [visible, setVisible] = useState(false),
    [opened, setOpened] = useState(false);
  const entryButton = useRef<HTMLButtonElement>(null);
  const [entry, setEntry] = useState<Entry | null>(null);
  const entryChanged = useCallback((next: Entry | null) => setEntry(next), []);
  const retryFocus = () => entryButton.current?.focus();
  const layer =
    name === 'GuideDeleteConfirmation' ||
    /Modal|Drawer|Popover|Tooltip|Dropdown|MenuButton|FeedbackProvider/.test(
      name,
    );
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '150px' },
    );
    if (host.current) observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  const content = !platform ? (
        <div style={{ minHeight: scenario.viewportHeight }}><PlatformLoading /></div>
      ) : visible && (!(layer || startOnRequest) || opened) ? (
        <Running
          key={platform + scenario.id + name + executionKey + palette}
          name={name}
          platform={platform}
          scenario={scenario}
          destination={destination}
          mode={mode}
          palette={palette}
          onEntryChange={entryChanged}
          onRetryFocus={retryFocus}
        />
      ) : (
        <div className="guide-example-placeholder" style={{ minHeight: scenario.viewportHeight }}>
          {layer || startOnRequest ? '위의 실행 버튼으로 예제를 열어 주세요.' : '실행 화면을 불러올 위치입니다.'}
        </div>
      );
  return (
    <Card role="article" className="guide-example" padding="none" surface={mode === 'comparison' ? 'default' : 'muted'} radius={mode === 'comparison' ? 'none' : 'md'} data-mode={mode} data-guide-case={scenario.id}>
      <div className="guide-example-content" ref={host}>
      <header>
        <h4>{scenario.label}</h4>
        {(mode === 'interactive' || !repeatedDescriptions.has(scenario.description)) && <p>{scenario.description}</p>}
      </header>
      {(layer || startOnRequest) && <div className="guide-case-actions">
        <Button ref={entryButton} variant="secondary" disabled={!platform}
          onClick={() => {
            if (entry?.ready) entry.enter();
            else if (entry?.failed) entry.retry();
            else { setOpened(true); setVisible(true); }
          }}>
          {entry?.ready ? '예제로 이동' : entry?.failed ? '실행 예제 다시 시도' : opened ? '실행 예제 준비 중' : startOnRequest ? '실행 예제 열기' : '실행 비교 열기'}
        </Button>
      </div>}
      {content}
      </div>
    </Card>
  );
}
function Running({
  name,
  platform,
  scenario,
  destination,
  mode,
  palette,
  onEntryChange,
  onRetryFocus,
}: {
  name: string;
  platform: PlatformName;
  scenario: GuideCase;
  destination: string;
  mode: 'comparison' | 'interactive';
  palette: PaletteName;
  onEntryChange: (entry: Entry | null) => void;
  onRetryFocus: () => void;
}) {
  const model = useCatalog(
    name,
    platform,
    palette,
    scenario.settings,
    scenario.values,
    true,
  );
  const [frameReset, setFrameReset] = useState(0);
  const reset = () => {
    // Discard the old document so layer cleanup cannot return focus into it.
    // The reset control stays mounted in the parent document.
    setFrameReset(value => value + 1);
    model.reset();
  };
  useEffect(() => {
    const frame = model.frame.current, doc = frame?.contentDocument;
    if (!model.ready || !frame || !doc) return;
    let pending = 0;
    const revealFocus = () => {
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(() => {
        if (document.activeElement !== frame) return;
        const active = doc.activeElement;
        if (!active || active === doc.body) return;
        const inner = active.getBoundingClientRect(), outer = frame.getBoundingClientRect();
        const header = Math.max(0, ...['.topbar', '.document-shortcuts'].map(selector =>
          document.querySelector(selector)?.getBoundingClientRect().bottom || 0));
        const top = outer.top + inner.top, bottom = outer.top + inner.bottom;
        const offset = top < header + 8 ? top - header - 8 : bottom > innerHeight - 8 ? bottom - innerHeight + 8 : 0;
        if (offset) window.scrollBy({ top: offset, behavior: 'instant' });
      });
    };
    doc.addEventListener('focusin', revealFocus);
    return () => { cancelAnimationFrame(pending); doc.removeEventListener('focusin', revealFocus); };
  }, [model.ready, model.reload, frameReset]);
  useEffect(() => {
    onEntryChange({ ready: model.ready, failed: model.failed, retry: model.retry, enter: () => {
      if (!model.ready) return;
      const doc = model.frame.current?.contentDocument;
      const first = Array.from(doc?.querySelectorAll<HTMLElement>('button,input,select,textarea,a[href],[tabindex]') || [])
        .find(node => node.tabIndex >= 0 && !node.hasAttribute('disabled') && node.getAttribute('aria-disabled') !== 'true' && node.getClientRects().length > 0);
      const target = first || doc?.body;
      if (target) { if (!first) target.tabIndex = -1; target.focus(); }
    } });
    return () => onEntryChange(null);
  }, [model.ready, model.failed, model.session, model.reload, onEntryChange]);
  const retry = () => { onRetryFocus(); model.retry(); };
  const interacted = useRef(-1);
  useEffect(() => {
    if (
      model.ready &&
      scenario.action &&
      !scenario.action.includes(':') &&
      interacted.current !== model.config.revision
    ) {
      interacted.current = model.config.revision;
      model.interact(scenario.action);
    }
  }, [model.ready, model.config.revision, scenario.action]);
  return (
    <div
      className="guide-running"
      data-ready={model.ready}
      data-platform={platform}
    >
      <div className="guide-frame">
        {!model.ready && (
          <p role="status">
            {model.failed
              ? '실행 화면을 불러오지 못했습니다.'
              : '실행 화면을 불러오는 중…'}
          </p>
        )}
        <iframe
          ref={model.frame}
          key={`${platform}:${model.reload}:${frameReset}`}
          title={`${scenario.label} · ${name} · ${platform}`}
          src={`/previews/catalog-${platform}.html?component=${encodeURIComponent(name)}&session=${encodeURIComponent(model.session)}`}
          onLoad={model.send}
          sandbox="allow-scripts allow-same-origin"
          tabIndex={model.ready ? 0 : -1}
          style={{
            ...(scenario.viewportWidth ? { width: scenario.viewportWidth, minWidth: scenario.viewportWidth } : {}),
            height: scenario.viewportHeight ?? (model.ready ? Math.max(100, model.snapshot.height) : 120),
            visibility: model.ready ? 'visible' : 'hidden',
          }}
        />
      </div>
      {mode === 'interactive' ? <><div className="guide-case-actions">
        <Button size="sm" variant="ghost" onClick={reset}>
          초기화
        </Button>
        {model.failed && (
          <Button size="sm" variant="secondary" onClick={retry}>
            다시 시도
          </Button>
        )}
        <Link href={destination}>상세 예제</Link>
      </div>
      </> : model.failed && <Button size="sm" variant="secondary" onClick={retry}>다시 시도</Button>}
    </div>
  );
}
