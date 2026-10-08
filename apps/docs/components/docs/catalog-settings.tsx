'use client';
import { useEffect, useState, type ReactNode, type RefObject } from 'react';
import { DsButton, DsInput, DsModal, DsSwitch } from '@kjun/react';
import { Choice } from './choice';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './disclosure';
import type { useCatalog } from './use-catalog';
import { visibleControls } from '../../../../shared/example-registry';
import { paletteLabels, type PaletteName } from '../../../../shared/demo-config';
import rules from '../../../../shared/foundation-layout.json';

type CatalogModel = ReturnType<typeof useCatalog>;
export function CatalogSettings({ name, model, preview, layoutGuide }: {
  name: string; model: CatalogModel; preview: ReactNode; layoutGuide?: 'columns' | 'cta';
}) {
  // The CTA preview owns its live long-copy and keyboard actions.
  const controls = visibleControls(name, model.config.settings, model.platform)
    .filter(control => layoutGuide !== 'cta' || !['long', 'keyboardVisible'].includes(control.key));
  const primaryKey = layoutGuide === 'columns' ? 'reading' : 'overlay';
  const switches = (primary: boolean) => controls.filter(control => control.kind === 'boolean' &&
    (!layoutGuide || (control.key === primaryKey) === primary)).map(control =>
    <DsSwitch key={control.key} size="sm" value={!!model.config.settings[control.key]}
      onValueChange={value => model.changeSettings(control.key, value)} label={control.label} />);
  const advanced = <>
    <div className="playground-settings">
      <Choice label="색상 예제" value={model.config.palette} options={Object.entries(paletteLabels).map(([value, label]) => ({ value, label }))} onChange={value => model.palette(value as PaletteName)} />
      <Choice label="프리셋" value={model.preset} options={model.definition.presets.map(p => ({ value: p.id, label: p.label }))} onChange={value => model.reset(value)} />
      {controls.filter(c => c.kind !== 'boolean').map(control => control.kind === 'choice' ?
        <Choice key={control.key} label={control.label} value={String(model.config.settings[control.key])} options={control.options!.map(value => ({ value, label: value }))} onChange={value => model.changeSettings(control.key, value)} /> :
        <label className="choice example-field" key={control.key}><span className="control-label">{control.label}</span><DsInput aria-label={control.label} type={control.kind === 'number' ? 'number' : 'text'} value={String(model.config.settings[control.key])} min={control.min} max={control.max} maxLength={2000}
          onChange={event => model.changeSettings(control.key, control.kind === 'number' ? Math.max(control.min!, Math.min(control.max!, Number(event.target.value))) : event.target.value)} /></label>)}
      {!layoutGuide && <DsButton variant="ghost" aria-label="예제 초기화" onClick={() => model.reset()}>초기화</DsButton>}
    </div>
    <div className="example-controls state-toggles">{switches(false)}</div>
  </>;
  const sizeToggle = <DsButton className={layoutGuide ? 'layout-size-toggle' : undefined} variant="secondary" size="sm" aria-pressed={model.narrow}
    onClick={() => model.setNarrow(value => !value)}>{model.narrow ? '기본 너비로 보기' : '375px 좁은 화면'}</DsButton>;
  const title = layoutGuide === 'columns' ? '열 전환 비교' : layoutGuide === 'cta' ? '하단 CTA와 안전 영역' : name.replace(/^Ds/, '');
  return <>
    {layoutGuide ? <>
      <div className="layout-primary-controls">{switches(true)}
        <DsButton size="sm" variant="ghost" aria-label="예제 초기화" onClick={() => model.reset()}>초기화</DsButton>
      </div>
      <Collapsible className="example-settings layout-advanced-settings">
        <CollapsibleTrigger className="example-settings-trigger" suffixIcon="chevron-down">세부 설정</CollapsibleTrigger>
        <CollapsibleContent keepMounted>{advanced}</CollapsibleContent>
      </Collapsible>
    </> : advanced}
    <div className="example-view-toolbar" data-layout-tools={layoutGuide}>
      {sizeToggle}
      <DsButton className={layoutGuide ? 'layout-expand' : undefined} variant="secondary" size="sm" onClick={() => model.expand(true)}>넓게 보기</DsButton>
      <DsModal open={model.wide} onOpenChange={model.expand} size="full" title={`${title} · 넓게 보기`}>
        <div className={`docs-dialog-content example-wide${layoutGuide ? ' layout-guide-wide' : ''}`}>
          <p>현재 입력·선택값을 유지합니다. Escape 또는 닫기 버튼으로 돌아갑니다.</p>
          {sizeToggle}
          {model.wide && preview}
        </div>
      </DsModal>
    </div>
  </>;
}

export function LayoutPreviewHint({ frame, reading, wide }: { frame: RefObject<HTMLIFrameElement | null>; reading: boolean; wide: boolean }) {
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const measure = () => setWidth(Math.round(element.getBoundingClientRect().width));
    const observer = new ResizeObserver(measure);
    observer.observe(element); measure();
    return () => observer.disconnect();
  }, [frame]);
  const twoColumns = !reading && width !== null && width >= rules.columnsFrom;
  return <div className="layout-preview-hint">
    <p>{reading ? `읽기·입력 모드는 최대 ${rules.readingMax}px의 한 열을 유지합니다.` : twoColumns ?
      '두 열 배치입니다. 좁은 화면으로 바꿔도 입력값과 읽기 순서가 유지되는지 확인하세요.' : <>
        한 열 배치입니다. 두 열은 가용 폭 {rules.columnsFrom}px 이상에서 표시합니다.
        {!wide && <><span className="layout-expand-hint"> ‘넓게 보기’에서 두 열과 비교하세요.</span>
          <span className="layout-diagram-hint"> 두 열의 구성은 위 도식에서 확인하세요.</span></>}
      </>}</p>
  </div>;
}
