import { useState } from 'react';
// KjunTimePicker cases for React and Native (Vue 3 mirrors this in time-picker-vue3.tsx).
export const tpCases: { id: string; initial: string | null; props: Record<string, unknown> }[] = [
  { id: 'tp-basic', initial: null, props: { ariaLabel: '알림', minuteStep: 15 } },
  { id: 'tp-twelve', initial: '13:15', props: { ariaLabel: '퇴근', hourCycle: 12 } },
  { id: 'tp-bounds', initial: '09:00', props: { ariaLabel: '영업', min: '09:00', max: '18:00', minuteStep: 30 } },
  { id: 'tp-readonly', initial: '08:00', props: { ariaLabel: '고정', readOnly: true } },
];

function Case({ K, id, initial, props }: { K: any; id: string; initial: string | null; props: Record<string, unknown> }) {
  const [value, setValue] = useState<string | null>(initial);
  const [commits, setCommits] = useState<(string | null)[]>([]);
  return <div data-testid={id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <K.KjunTimePicker value={value} {...props} onValueChange={setValue} onChangeCommit={(v: string | null) => setCommits(old => [...old, v])} />
    <output data-testid={id + '-value'}>{value ?? 'none'}</output>
    <output data-testid={id + '-commits'}>{JSON.stringify(commits)}</output>
  </div>;
}

/** An outside <label for> reaching the first segment through id (web only). */
function LabelCase({ K }: { K: any }) {
  const [value, setValue] = useState<string | null>('10:00');
  return <div data-testid="tp-label"><label htmlFor="tp-outside">출발 시각</label>
    <K.KjunTimePicker id="tp-outside" ariaLabel="출발" value={value} onValueChange={setValue} /></div>;
}

export function TimePickerCases({ K, native = false, providerProps = {} }: { K: any; native?: boolean; providerProps?: Record<string, any> }) {
  return <K.KjunProvider {...providerProps}><div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 16, width: 360, paddingBottom: 480 }}>
    {tpCases.map(c => <Case key={c.id} K={K} {...c} />)}
    {!native && <LabelCase K={K} />}
  </div></K.KjunProvider>;
}
