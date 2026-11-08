import { useState } from 'react';
// KjunColorPicker cases for React and Native (Vue 3 mirrors this in color-picker-vue3.tsx).
export const cpSwatches = ['#EF4444', '#F97316', '#22C55E', '#3B82F6', '#8B5CF6', '#111111', '#FFFFFF'];
export const cpBadSwatches = ['nope', '#22C55E', ...cpSwatches];

function Case({ K, id, initial, controlled, native, props }: { K: any; id: string; initial: string | null; controlled?: boolean; native?: boolean; props: Record<string, any> }) {
  const [value, setValue] = useState<string | null>(initial);
  const [changes, setChanges] = useState<(string | null)[]>([]);
  const [commits, setCommits] = useState<(string | null)[]>([]);
  const own = controlled ? { value } : { defaultValue: initial };
  return <div data-testid={id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <K.KjunColorPicker {...own} {...props}
      onValueChange={(v: string | null) => { setValue(v); setChanges(old => [...old, v]); }}
      onChangeCommit={(v: string | null) => setCommits(old => [...old, v])} />
    <output data-testid={id + '-changes'}>{JSON.stringify(changes)}</output>
    <output data-testid={id + '-commits'}>{JSON.stringify(commits)}</output>
    {controlled && <K.KjunButton variant="secondary" {...{ [native ? 'onPress' : 'onClick']: () => setValue('#FF0000') }}>외부 변경</K.KjunButton>}
  </div>;
}

export function ColorPickerCases({ K, native = false, providerProps = {} }: { K: any; native?: boolean; providerProps?: Record<string, any> }) {
  const [submitted, setSubmitted] = useState('');
  return <K.KjunProvider {...providerProps}><div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 16, width: 360, paddingBottom: 480 }}>
    <Case K={K} id="cp-full" initial="#3B82F680" props={{ ariaLabel: '라벨 색', custom: true, alpha: true, input: true, clearable: true, swatches: cpSwatches }} />
    <Case K={K} id="cp-swatches" initial="#22C55E" props={{ ariaLabel: '태그 색', clearable: true, swatches: cpBadSwatches }} />
    <Case K={K} id="cp-custom" initial={null} props={{ ariaLabel: '강조색', custom: true, input: true }} />
    <Case K={K} id="cp-gray" initial="#3B82F6" props={{ ariaLabel: '회색 확인', custom: true }} />
    <Case K={K} id="cp-controlled" initial="#3B82F6" controlled native={native} props={{ ariaLabel: '제어 색', custom: true, input: true }} />
    <Case K={K} id="cp-alpha-off" initial="#3B82F680" controlled native={native} props={{ ariaLabel: '알파 끔', input: true }} />
    <div data-testid="cp-states" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <K.KjunColorPicker ariaLabel="비활성" defaultValue="#3B82F6" disabled swatches={cpSwatches} />
      <K.KjunColorPicker ariaLabel="오류" defaultValue="#3B82F6" error swatches={cpSwatches} />
      {native ? <K.KjunColorPicker ariaLabel="읽기 전용" defaultValue="#3B82F6" readOnly swatches={cpSwatches} />
        : <form onSubmit={e => { e.preventDefault(); setSubmitted(String(new FormData(e.currentTarget).get('color'))); }}>
          <K.KjunColorPicker ariaLabel="읽기 전용" defaultValue="#3B82F6" readOnly name="color" swatches={cpSwatches} />
          <button type="submit">제출</button>
        </form>}
      <output data-testid="cp-submitted">{submitted}</output>
    </div>
    <div data-testid="cp-sizes" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(['sm', 'md', 'lg'] as const).map(size => <K.KjunColorPicker key={size} size={size} ariaLabel={'크기 ' + size} defaultValue="#3B82F6" swatches={cpSwatches} />)}
    </div>
  </div></K.KjunProvider>;
}
