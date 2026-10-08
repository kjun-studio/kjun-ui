'use client';
import { useEffect, useRef, useState } from 'react';
import { DsButton as Button, DsIcon as Icon, DsTabs, DsTabPane } from '@kjun/react';
import Link from './doc-link';
import { useDocsPlatform, PlatformLoading } from './docs-platform';
import { useCatalog } from './use-catalog';
import { styleMotionPreview, setPreviewClock } from './motion-preview-layout';
import { useMotionSpeed } from './motion-speed';
import { tokens } from '@kjun/tokens';
import { motionScenarios } from '../../../../shared/motion-examples';
import type { PlatformName } from '../../../../shared/demo-config';

type MotionExample = typeof motionScenarios[number];
const motion = tokens.motion as unknown as Record<string, number | string>;
const timingLabel = ([duration, curve]: MotionExample['timing'][number]) =>
  `${duration} ${motion[duration]}ms · ${curve ?? '감속 보간'}`;

export function MotionPlayground() {
  const { platform } = useDocsPlatform();
  const [selected, setSelected] = useState(motionScenarios[0].scenario.id);
  return <div className="motion-playground">
    <DsTabs value={selected} onValueChange={setSelected} density="compact" ariaLabel="모션 예제">
      {motionScenarios.map(entry => <DsTabPane key={entry.scenario.id} name={entry.scenario.id} label={entry.tab} disabled={!platform}>
        {selected === entry.scenario.id && (platform
          ? <MotionPreview key={platform + selected} entry={entry} platform={platform} />
          : <div className="motion-playground-loading"><PlatformLoading /></div>)}
      </DsTabPane>)}
    </DsTabs>
  </div>;
}

function MotionPreview({ entry: { name, scenario, destination, hint, timing }, platform }: {
  entry: MotionExample; platform: PlatformName;
}) {
  const { rate } = useMotionSpeed();
  const model = useCatalog(name, platform, 'default', scenario.settings, scenario.values, true);
  const resetButton = useRef<HTMLButtonElement>(null);
  const [frameReset, setFrameReset] = useState(0);
  const [styled, setStyled] = useState(false);
  const ready = model.ready && styled;
  useEffect(() => { const view = model.frame.current?.contentWindow; if (ready && view) setPreviewClock(view, rate); }, [ready, rate, model.reload, frameReset]);
  const reset = () => { setStyled(false); setFrameReset(value => value + 1); model.reset(); };
  const retry = () => { resetButton.current?.focus(); setStyled(false); model.retry(); };
  useEffect(() => {
    const frame = model.frame.current, doc = frame?.contentDocument;
    if (!ready || !frame || !doc) return;
    let pending = 0;
    const revealFocus = () => {
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(() => {
        if (document.activeElement !== frame) return;
        const active = doc.activeElement;
        if (!active || active === doc.body) return;
        const inner = active.getBoundingClientRect(), outer = frame.getBoundingClientRect();
        const header = Math.max(0, ...['.topbar', '.document-shortcuts'].map(selector => document.querySelector(selector)?.getBoundingClientRect().bottom || 0));
        const top = outer.top + inner.top, bottom = outer.top + inner.bottom;
        const offset = top < header + 8 ? top - header - 8 : bottom > innerHeight - 8 ? bottom - innerHeight + 8 : 0;
        if (offset) window.scrollBy({ top: offset, behavior: 'instant' });
      });
    };
    doc.addEventListener('focusin', revealFocus);
    return () => { cancelAnimationFrame(pending); doc.removeEventListener('focusin', revealFocus); };
  }, [ready, model.reload, frameReset]);
  const [component, title] = scenario.label.split(' · ');
  return <article className="motion-preview" data-guide-case={scenario.id}>
    <header className="motion-preview-heading">
      <div className="motion-preview-title"><h3>{title}</h3><span>{component}</span></div>
      <Button ref={resetButton} size="sm" variant="ghost" prefixIcon="refresh" aria-label="초기화" title="초기화" onClick={reset} />
      <p>{hint}</p>
      <div className="motion-preview-meta">
        <ul className="motion-preview-tokens" aria-label="사용하는 모션 토큰">{timing.map(item => <li key={item[0]}><code>{timingLabel(item)}</code></li>)}</ul>
      </div>
    </header>
    <div className="motion-preview-stage guide-running" data-ready={ready} data-platform={platform} aria-busy={!ready && !model.failed}>
      {!ready && <div className="motion-preview-status" data-failed={model.failed}>
        <p role="status">{model.failed ? '실행 화면을 불러오지 못했습니다.' : '예제를 준비하고 있습니다…'}</p>
        {model.failed && <Button size="sm" variant="secondary" onClick={retry}>다시 시도</Button>}
      </div>}
      <iframe ref={model.frame} key={`${model.reload}:${frameReset}`} title={`${scenario.label} · ${platform}`}
        src={`/previews/catalog-${platform}.html?component=${encodeURIComponent(name)}&session=${encodeURIComponent(model.session)}`}
        onLoad={() => {
          const doc = model.frame.current?.contentDocument;
          if (doc) { styleMotionPreview(doc, scenario.id); setStyled(true); }
          model.send();
        }} sandbox="allow-scripts allow-same-origin" tabIndex={ready ? 0 : -1} />
    </div>
    <div className="motion-preview-footer">
      <Link href={destination} aria-label={`${component} 상세 문서`}>상세 문서 <Icon name="arrow-right" size={14} aria-hidden="true" /></Link>
    </div>
  </article>;
}
