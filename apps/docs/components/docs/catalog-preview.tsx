"use client";
import { useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useDocsPlatform, PlatformLoading } from './docs-platform';
import { DsButton as Button, DsCard as Card } from '@kjun-ui/react';
import { CatalogSettings, LayoutPreviewHint } from './catalog-settings';
import { ExampleRunner } from './example-runner';
import { useCatalog } from './use-catalog';
import type { Settings } from '../../../../shared/example-registry';
import { platformNames, parseConfig, type PlatformName, type PaletteName, type ComponentName } from '../../../../shared/demo-config';
interface CatalogPreviewProps {
  name: string; detail?: boolean; initialPalette?: PaletteName; legacyComponent?: ComponentName; overrides?: Settings;
  layoutGuide?: 'columns' | 'cta';
}
export function CatalogPreview(props: CatalogPreviewProps) {
  const { platform } = useDocsPlatform();
  return platform ? <ResolvedCatalogPreview key={props.name} {...props} platform={platform} /> : <PlatformLoading />;
}
function ResolvedCatalogPreview({ name, platform, detail = false, initialPalette = 'default', legacyComponent, overrides = {}, layoutGuide }: CatalogPreviewProps & { platform: PlatformName }) {
  const model = useCatalog(name, platform, initialPalette, overrides, {}, false, detail);
  const title = `${platformNames[model.platform]} ${name} 예제`;
  useEffect(() => {
    if (!legacyComponent) return;
    const context = (document as any).modelContext;
    if (!context?.registerTool) return;
    const controller = new AbortController();
    const tool = {
      name: 'configure_component_preview', description: '현재 컴포넌트 예제의 플랫폼과 색상 예제, 상태를 변경합니다.',
      inputSchema: { type: 'object', properties: { platform: { type: 'string', enum: Object.keys(platformNames) }, config: { type: 'object' } }, required: ['platform', 'config'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input: any) {
        if (!input || typeof input !== 'object' || Object.keys(input).some(key => !['platform', 'config'].includes(key)) || !Object.keys(platformNames).includes(input.platform)) throw Error('지원하지 않는 플랫폼입니다.');
        const config = parseConfig(input.config);
        if (config.component !== legacyComponent) throw Error('현재 페이지의 컴포넌트만 설정할 수 있습니다.');
        const settings = Object.fromEntries(model.definition.controls.map(control => [control.key, control.key in config ? (config as any)[control.key] : control.default]));
        flushSync(() => model.configure(input.platform, { ...settings, ...overrides }, config.palette));
        return { platform: input.platform, config };
      },
    };
    try { Promise.resolve(context.registerTool(tool, { signal: controller.signal })).catch(() => {}); } catch {}
    return () => controller.abort();
  }, [legacyComponent, name]);
  const preview = <div className="preview-window" data-narrow={model.narrow}>
    {layoutGuide === 'columns' && <LayoutPreviewHint key={'hint-' + model.platform + model.reload + String(model.wide)} frame={model.frame} reading={!!model.config.settings.reading} wide={model.wide} />}
    {!model.ready && <output className="preview-loading">{model.failed ? '예제를 불러오지 못했습니다.' : '패키지 예제를 불러오는 중…'}{model.failed && <Button variant="secondary" onClick={model.retry}>다시 시도</Button>}</output>}
    <iframe ref={model.frame} key={model.platform + model.reload + String(model.wide)} title={title}
      src={`/previews/catalog-${model.platform}.html?component=${encodeURIComponent(name)}&session=${encodeURIComponent(model.session)}`}
      sandbox="allow-scripts allow-same-origin" onLoad={model.send} tabIndex={model.ready ? 0 : -1}
      style={{ height: detail ? Math.max(176, model.snapshot.height) : model.snapshot.height, opacity: model.ready ? 1 : 0, pointerEvents: model.ready ? "auto" : "none" }} />
  </div>;
  const settings = <CatalogSettings name={name} model={model} preview={preview} layoutGuide={layoutGuide} />;
  const events = (
    <details className="example-events"><summary>이벤트 기록 <span aria-live="polite">({model.events.length})</span></summary>
      <Button size="sm" variant="ghost" onClick={model.clearEvents}>기록 비우기</Button>
      {model.events.length ? <ol>{model.events.map(event => <li key={event.id}><strong>{event.id}. {event.name}</strong> · {event.phase}<pre>{JSON.stringify(event.value, null, 2)}</pre></li>)}</ol> : <p>{model.sources?.events ? '예제를 조작하면 실제 이벤트와 반환값이 여기에 표시됩니다.' : '이 예제는 기록할 이벤트가 없습니다.'}</p>}
    </details>
  );
  if (detail) return <ExampleRunner name={name} model={model} preview={preview} />;
  return <Card className="playground catalog-playground" padding="none" surface="muted" data-ready={model.ready} data-example={name}>
    <div className="playground-top">
      <span className="preview-platform">{platformNames[model.platform]}</span>
      <span className="package-label">@kjun-ui/{model.platform}</span>
    </div>
    {settings}
    {!model.wide && preview}
    {events}
  </Card>;
}
