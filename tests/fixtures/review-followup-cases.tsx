import { useState, type ComponentType } from "react";

export function SearchCase({ Control }: { Control: ComponentType<any> }) {
  const [config, setConfig] = useState({ value: "initial", disabled: false, debounce: 1000, mounted: true, handler: "first" });
  const [events, setEvents] = useState<string[]>([]);
  Object.assign(window, { configureFollowup: (next: Partial<typeof config>) => setConfig(old => ({ ...old, ...next })) });
  return <>
    {config.mounted && <Control value={config.value} disabled={config.disabled} debounce={config.debounce} ariaLabel="검색"
      onValueChange={(value: string) => {
        setEvents(old => [...old, `${config.handler}:${value}`]);
        setConfig(old => ({ ...old, value }));
      }} />}
    <output data-testid="model">{config.value}</output>
    <output data-testid="events">{JSON.stringify(events)}</output>
  </>;
}

export function PaginationCase({ Control }: { Control: ComponentType<any> }) {
  const [size, setSize] = useState(10), [page, setPage] = useState(2);
  const [config, setConfig] = useState({ total: 30, showSizeSelector: true, showInfo: true });
  Object.assign(window, { configureFollowup: (next: Partial<typeof config>) => setConfig(old => ({ ...old, ...next })) });
  return <>
    <Control totalPages={Math.ceil(config.total / size)} totalRows={config.total} currentPage={page} pageSize={size}
      showSizeSelector={config.showSizeSelector} showInfo={config.showInfo} onPageSizeChange={setSize} onPageChange={setPage} />
    <output data-testid="model">{size}:{page}</output>
  </>;
}
