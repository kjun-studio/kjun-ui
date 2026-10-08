'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { DsButton, DsCard, DsIcon, DsInput, DsModal, DsSwitch } from '@kjun/react';
import { Choice } from './choice';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './disclosure';
import type { useCatalog } from './use-catalog';
import { runnerControlGroups, runnerHint } from './runner-controls';
import { paletteLabels, platformNames, type PaletteName } from '../../../../shared/demo-config';
import type { ExampleControl } from '../../../../shared/example-registry';

type Model = ReturnType<typeof useCatalog>;
function SettingControl({ control, model }: { control: ExampleControl; model: Model }) {
  const value = model.config.settings[control.key];
  if (control.kind === 'boolean') return <div className="runner-switch">
    <DsSwitch size="sm" value={!!value} label={control.label} onValueChange={next => model.changeSettings(control.key, next)} />
  </div>;
  if (control.kind === 'choice') return <Choice label={control.label} value={String(value)}
    options={control.options!.map(option => ({ value: option, label: option }))}
    onChange={next => model.changeSettings(control.key, next)} />;
  return <label className="choice example-field"><span className="control-label">{control.label}</span>
    <DsInput aria-label={control.label} size="sm" type={control.kind === 'number' ? 'number' : 'text'}
      value={String(value)} min={control.min} max={control.max} maxLength={2000}
      onChange={event => model.changeSettings(control.key, control.kind === 'number'
        ? Math.max(control.min!, Math.min(control.max!, Number(event.target.value))) : event.target.value)} />
  </label>;
}

function RunnerSettings({ name, model }: { name: string; model: Model }) {
  const groups = runnerControlGroups(name, model.config.settings, model.platform);
  return <div className="playground-settings runner-settings-grid">
    {groups.map(group => <fieldset className="runner-setting-group" key={group.id}>
      <legend>{group.label}</legend>
      <div className="runner-setting-fields">{group.controls.map(control => <SettingControl key={control.key} control={control} model={model} />)}</div>
    </fieldset>)}
    <fieldset className="runner-setting-group runner-environment"><legend>미리보기 환경</legend>
      <Choice label="색상 예제" value={model.config.palette} options={Object.entries(paletteLabels).map(([value, label]) => ({ value, label }))}
        onChange={value => model.palette(value as PaletteName)} />
      <p>문서에서 제공하는 색상 예제입니다.</p>
    </fieldset>
  </div>;
}

function RunnerEvents({ model }: { model: Model }) {
  return <details className="example-events runner-events"><summary>
    <span>이벤트 기록 <span className="runner-event-count" aria-live="polite">({model.events.length})</span></span>
    {model.events.length > 0 && <span className="runner-event-summary">{model.events.at(-1)!.name}</span>}
  </summary>
    <DsButton size="sm" variant="ghost" onClick={model.clearEvents}>기록 비우기</DsButton>
    {model.events.length ? <ol>{model.events.map(event => <li key={event.id}>
      <strong>{event.id}. {event.name}</strong><span className="runner-event-phase">{event.phase}</span>
      <pre>{JSON.stringify(event.value, null, 2)}</pre>
    </li>)}</ol> : <p>{model.sources?.events ? '예제를 조작하면 이벤트와 반환값이 여기에 표시됩니다.' : '이 예제는 기록할 이벤트가 없습니다.'}</p>}
  </details>;
}

export function ExampleRunner({ name, model, preview }: { name: string; model: Model; preview: ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    const frame = model.frame.current;
    if (!frame) return;
    const measure = () => setWidth(Math.round(frame.getBoundingClientRect().width));
    const observer = new ResizeObserver(measure);
    observer.observe(frame); measure();
    return () => observer.disconnect();
  }, [model.frame, model.wide, model.platform, model.reload]);
  const base = model.presetSettings;
  const changed = model.definition.controls.some(control => model.config.settings[control.key] !== base[control.key]);
  const count = runnerControlGroups(name, model.config.settings, model.platform).reduce((total, group) => total + group.controls.length, 0);
  const dimensions = width === null ? '너비 확인 중' : `${width}px`;
  const toolbar = (expanded = false) => <div className="runner-toolbar">
    <div className="runner-scenario">
      {model.definition.presets.length > 1 ? <Choice label="프리셋" value={model.preset}
        options={model.definition.presets.map(preset => ({ value: preset.id, label: preset.label }))}
        onChange={value => model.reset(value)} /> : <span className="runner-default">기본 예제</span>}
      {changed && <span className="runner-modified">설정 변경됨</span>}
    </div>
    <div className="runner-tools">
      <div className="runner-width-control">
        <DsButton variant="ghost" size="sm" aria-pressed={model.narrow}
          aria-label={model.narrow ? '기본 너비로 보기' : '375px 좁은 화면'} onClick={() => model.setNarrow(value => !value)}>
          <span>{model.narrow ? '좁은 너비' : '자동 너비'}</span>
        </DsButton>
        <output className="runner-dimensions" aria-label="실제 미리보기 너비">{dimensions}</output>
      </div>
      <DsButton variant="ghost" size="sm" aria-label="예제 초기화" title="현재 프리셋으로 초기화" onClick={() => model.reset()}>초기화</DsButton>
      {!expanded && <DsButton variant="ghost" size="sm" onClick={() => model.expand(true)}>넓게 보기</DsButton>}
    </div>
  </div>;
  const stage = <div className="runner-stage">
    {preview}
    <p className="runner-hint">{runnerHint(name)}</p>
    {model.narrow && width !== null && width < 375 && <p className="runner-width-note">현재 공간에 맞춰 {width}px로 표시합니다. 목표 너비는 375px입니다.</p>}
  </div>;
  return <DsCard className="playground catalog-playground example-runner" padding="none" surface="muted" data-ready={model.ready} data-example={name}>
    <div className="playground-top runner-heading">
      <div className="runner-title"><span className="runner-status-dot" data-ready={model.ready} data-failed={model.failed} aria-hidden="true" /><strong>미리보기</strong><span className="runner-platform" title={`@kjun/${model.platform}`}>{platformNames[model.platform]}</span></div>
    </div>
    {toolbar()}
    {!model.wide && stage}
    <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen} className="example-settings runner-settings">
      <div className="runner-settings-heading">
        <CollapsibleTrigger aria-label="예제 설정" className="runner-settings-trigger" suffixIcon="chevron-down">예제 설정</CollapsibleTrigger>
        <span>{count ? `${count}개 옵션` : '색상 환경'}</span>
      </div>
      <CollapsibleContent keepMounted><RunnerSettings name={name} model={model} /></CollapsibleContent>
    </Collapsible>
    <RunnerEvents model={model} />
    <DsModal open={model.wide} onOpenChange={model.expand} size="full" noPadding title={`${name.replace(/^Ds/, '')} · 넓게 보기`}>
      {model.wide && <div className="docs-dialog-content runner-wide">
        {toolbar(true)}
        <div className="runner-workspace">
          <div className="runner-workspace-preview">{stage}<RunnerEvents model={model} /></div>
          <aside className="runner-inspector" aria-label="확대 화면 예제 설정"><h3><DsIcon name="adjustments-horizontal" size={15} aria-hidden="true" />예제 설정</h3><RunnerSettings name={name} model={model} /></aside>
        </div>
      </div>}
    </DsModal>
  </DsCard>;
}
