import { useState, type ComponentType, type ReactNode } from "react";

export const tableRows = [{ id: 2, name: "Two" }, { id: 0, name: "Zero" }, { id: 1, name: "One" }];
export function TableCase({ Control, detail }: { Control: ComponentType<any>; detail: (id: number) => ReactNode }) {
  const [config, setConfig] = useState({ expanded: [] as number[], controlled: true, accept: true, single: false });
  const [events, setEvents] = useState<number[][]>([]);
  Object.assign(window, { configureState: (next: Partial<typeof config>) => setConfig(old => ({ ...old, ...next })) });
  return <>
    <Control data={tableRows} columns={[{ key: "name", label: "Name" }]} responsive="card" expandable
      expandedRows={config.controlled ? config.expanded : undefined} expandSingle={config.single}
      onExpandedRowsChange={(expanded: number[]) => {
        setEvents(old => [...old, expanded]);
        if (config.accept) setConfig(old => ({ ...old, expanded }));
      }} renderExpand={(row: { id: number }) => detail(row.id)} />
    <output data-testid="expanded">{JSON.stringify(config.expanded)}</output>
    <output data-testid="events">{JSON.stringify(events)}</output>
  </>;
}
