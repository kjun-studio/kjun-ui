import { useEffect, useRef, useState } from "react";

export interface MarketMetric {
  label: string;
  format?: string;
  sortKey?: string | null;
  formatter?: (value: unknown) => string;
}
export interface MetricStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}
export interface MarketCardsModelProps {
  columns: { key: string; sortable?: boolean; defaultSort?: boolean }[];
  metricConfig: Record<string, MarketMetric>;
  excludeKeys?: string[];
  storageNamespace: string;
  storage?: MetricStorage;
  sortKey?: string | null;
  emitSortOnMount?: boolean;
  onSort?: (key: string) => void;
}

export function useMarketCardsModel(
  props: MarketCardsModelProps,
  persistence: () => MetricStorage | undefined
) {
  const {
    columns,
    metricConfig,
    excludeKeys = [],
    storageNamespace,
    sortKey,
    emitSortOnMount = true,
  } = props;
  const pills = columns
    .filter((c) => !excludeKeys.includes(c.key) && metricConfig[c.key])
    .map((c) => ({
      key: c.key,
      ...metricConfig[c.key],
      sortKey: c.sortable ? metricConfig[c.key].sortKey : null,
      isDefaultSort: c.defaultSort,
    }));
  const [key, setKey] = useState(""),
    restoreSignature = JSON.stringify([storageNamespace, pills]);
  const mounted = useRef("");
  const save = (key: string) => {
    try {
      persistence()?.setItem(storageNamespace + ":pill", key);
    } catch {}
  };
  useEffect(() => {
    if (mounted.current === restoreSignature) return;
    mounted.current = restoreSignature;
    let stored: string | null = null;
    try {
      stored = persistence()?.getItem(storageNamespace + ":pill") || null;
    } catch {}
    const selected =
      pills.find((p) => p.key === stored) ||
      pills.find((p) => p.isDefaultSort) ||
      pills.find((p) => p.sortKey) ||
      pills[0];
    setKey(selected?.key || "");
    if (stored && selected?.key !== stored) save(selected?.key || "");
    if (emitSortOnMount && selected?.sortKey && selected.sortKey !== sortKey)
      props.onSort?.(selected.sortKey);
  }, [restoreSignature]);
  const pill = pills.find((p) => p.key === key) || pills[0];
  return {
    pills,
    key: pill?.key || "",
    pill,
    select: (key: string) => {
      const selected = pills.find((p) => p.key === key);
      if (!selected) return;
      setKey(key);
      save(key);
      if (selected.sortKey) props.onSort?.(selected.sortKey);
    },
  };
}
