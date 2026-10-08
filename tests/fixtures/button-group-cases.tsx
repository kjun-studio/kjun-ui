import { useState, type ComponentType } from 'react';
import { flushSync } from 'react-dom';
export const initialGroup = () => ({
  value: 'a', accept: true, disabled: false, fullWidth: false, width: 480, size: 'md', dir: 'ltr',
  options: [{ value: 'a', label: '일간' }, { value: 'b', label: '주간' }, { value: 'c', label: '전체 기간' }],
});
export function ButtonGroupCases({ Group }: { Group: ComponentType<any> }) {
  const [config, setConfig] = useState(initialGroup);
  const [events, setEvents] = useState<unknown[]>([]);
  Object.assign(window, { configureGroup: (next: object) => flushSync(() => setConfig(old => ({ ...old, ...next }))) });
  return <>
    <div data-testid="frame" dir={config.dir} style={{ width: config.width, maxWidth: '100%', margin: 24 }}>
      <Group {...config} ariaLabel="Period" onValueChange={(value: string) => {
        if (config.accept) setConfig(old => ({ ...old, value }));
        setEvents(old => [...old, ['value', value]]);
      }} onChange={(value: string) => setEvents(old => [...old, ['change', value]])} />
    </div>
    <output data-testid="value">{String(config.value)}</output><output data-testid="events">{JSON.stringify(events)}</output>
  </>;
}
