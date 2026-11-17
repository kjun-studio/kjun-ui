import { useState } from 'react';
// KjunFileUpload cases for React and Native (Vue 3 mirrors this in file-upload-vue3.tsx). Each case logs its callbacks
// as JSON in <output data-testid="<id>-log">. A fake uploader moves files one step per press of "<id>-advance".
const MB = 1024 * 1024;
type Log = Record<string, unknown>[];
export const fuPicks = [
  { name: 'a.pdf', size: 1024, type: 'application/pdf' },
  { name: 'b.hwp', size: 10, type: 'application/x-hwp' },
  { name: 'big.pdf', size: 21 * MB, type: 'application/pdf' },
];
const done = (id: string, name: string, size: number) => ({ id, name, size, status: 'done' });

function useCase(initial: any[]) {
  const [files, setFiles] = useState<any[]>(initial);
  const [log, setLog] = useState<Log>([]);
  const push = (entry: Record<string, unknown>) => setLog(list => [...list, entry]);
  const handlers = {
    onSelect: (accepted: any[], rejected: any[]) => {
      push({ select: { accepted: accepted.map(f => f.name), rejected: rejected.map(r => [r.file.name, r.reason]) } });
      setFiles(list => fuAccepted(list, accepted));
    },
    onRemove: (id: string) => { push({ remove: id }); setFiles(list => list.filter(f => f.id !== id)); },
    onRetry: (id: string) => { push({ retry: id }); setFiles(list => list.map(f => f.id === id ? { ...f, status: 'uploading', progress: 10 } : f)); },
  };
  return { files, setFiles, log, handlers, push };
}

function Case({ K, id, native, initial = [], picks = fuPicks, props = {}, form, pickMode }: {
  K: any; id: string; native: boolean; initial?: any[]; picks?: any[] | null; props?: Record<string, any>; form?: Record<string, any>; pickMode?: 'slow' | 'throw';
}) {
  const { files, setFiles, log, handlers, push } = useCase(initial);
  const advance = () => setFiles(fuAdvance);
  // fu-slow and fu-throw log each onPick call so a test can count them.
  const onPick = async () => {
    if (pickMode) push({ pick: true });
    if (pickMode === 'throw') throw new Error('picker failed');
    if (pickMode === 'slow') await new Promise(resolve => setTimeout(resolve, 300));
    return picks;
  };
  const field = <K.KjunFileUpload files={files} {...handlers} {...props} onPick={native ? onPick : undefined} />;
  return <div data-testid={id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {form ? <K.KjunFormGroup {...form}>{field}</K.KjunFormGroup> : field}
    <button type="button" data-testid={id + '-advance'} onClick={advance}>advance</button>
    <output data-testid={id + '-log'}>{JSON.stringify(log)}</output>
  </div>;
}

const limits = { accept: '.pdf,image/*,.xlsx', maxSize: 20 * MB, maxFiles: 5 };
/** Every case, shared with the Vue 3 fixture. */
export const fuCases: { id: string; props: Record<string, any>; initial?: any[]; form?: Record<string, any>; picks?: any[] | null; pickMode?: 'slow' | 'throw' }[] = [
  { id: 'fu-basic', props: limits },
  { id: 'fu-form', props: limits, form: { label: '증빙 자료', required: true, error: '필수 항목이에요' } },
  { id: 'fu-filled', props: limits, initial: [
    { id: 'up', name: '매장_외관_사진_2026.jpg', size: 4.2 * MB, status: 'uploading', progress: 64 },
    done('long', '2026년_4분기_정산_보고서_재무팀_검토_완료본_최종.pdf', 18.6 * MB),
    { id: 'fail', name: '사업자등록증.pdf', size: 1.1 * MB, status: 'error' },
    { id: 'wait', name: '거래처_목록.xlsx', size: 320 * 1024, status: 'queued' },
  ] },
  { id: 'fu-single', props: { ...limits, multiple: false }, initial: [done('only', '계약서.pdf', 2 * MB)] },
  { id: 'fu-full', props: { ...limits, maxFiles: 2 }, initial: [done('one', '1.pdf', MB), done('two', '2.pdf', MB)] },
  { id: 'fu-disabled', props: { ...limits, disabled: true }, initial: [done('locked', '결재본.pdf', MB)] },
  { id: 'fu-progress', props: limits, initial: [
    { id: 'p-none', name: 'none.pdf', size: MB, status: 'uploading' },
    { id: 'p-low', name: 'low.pdf', size: MB, status: 'uploading', progress: -5 },
    { id: 'p-high', name: 'high.pdf', size: MB, status: 'uploading', progress: 140 },
  ] },
  { id: 'fu-cancel', props: limits, picks: null },
  { id: 'fu-slow', props: limits, pickMode: 'slow' },
  { id: 'fu-throw', props: limits, pickMode: 'throw' },
];
/** The fake uploader's step: queued → uploading 40% → done, or error for names containing "fail". */
export const fuAdvance = (list: any[]) => list.map(f => f.status === 'queued' ? { ...f, status: 'uploading', progress: 40 }
  : f.status === 'uploading' ? { ...f, status: f.name.includes('fail') ? 'error' : 'done', progress: undefined } : f);
export const fuAccepted = (list: any[], accepted: any[]) =>
  [...list, ...accepted.map((f, i) => ({ id: f.name + '-' + (list.length + i), name: f.name, size: f.size, type: f.type, status: 'queued' }))];

export function FileUploadCases({ K, native = false, providerProps = {} }: { K: any; native?: boolean; providerProps?: Record<string, any> }) {
  return <K.KjunProvider {...providerProps}><div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 16, width: 360 }}>
    {fuCases.map(c => <Case key={c.id} K={K} native={native} id={c.id} props={c.props} initial={c.initial} form={c.form} pickMode={c.pickMode} picks={c.picks === undefined ? fuPicks : c.picks} />)}
  </div></K.KjunProvider>;
}
