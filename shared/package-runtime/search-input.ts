import { useEffect, useLayoutEffect, useRef, useState } from "react";

export interface SearchInputModelProps<T> {
  value: string;
  disabled?: boolean;
  debounce?: number;
  loadOptions?: (query: string, context: { signal: AbortSignal }) => Promise<T[]>;
  minChars?: number;
  onValueChange?: (value: string) => void;
  onSearchError?: (error: unknown) => void;
}

export function useSearchInputModel<T>({
  value, disabled = false, debounce = 0, loadOptions, minChars = 2,
  onValueChange, onSearchError,
}: SearchInputModelProps<T>, open: boolean) {
  const [query, setQuery] = useState(value),
    [options, setOptions] = useState<T[]>([]),
    [loading, setLoading] = useState(false),
    // A failed request is its own state so the panel never reads it as an empty result.
    [failed, setFailed] = useState(false),
    version = useRef(0),
    notify = useRef(onSearchError);
  notify.current = onSearchError;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const notifyValue = useRef(onValueChange);
  notifyValue.current = onValueChange;
  // An external value or input mode change supersedes a pending draft notification.
  useLayoutEffect(() => {
    clearTimeout(timer.current);
    setQuery(value);
  }, [value]);
  useLayoutEffect(() => {
    clearTimeout(timer.current);
    return () => clearTimeout(timer.current);
  }, [disabled, debounce, !!loadOptions]);
  useEffect(() => {
    const current = ++version.current,
      abort = new AbortController();
    setFailed(false);
    if (!loadOptions || !open || disabled || query.length < minChars) {
      setOptions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setOptions([]);
    const timer = setTimeout(async () => {
      try {
        const result = await loadOptions(query, { signal: abort.signal });
        if (current === version.current && !abort.signal.aborted)
          setOptions(result);
      } catch (error) {
        if (current === version.current && !abort.signal.aborted) {
          setOptions([]);
          setFailed(true);
          notify.current?.(error);
        }
      } finally {
        if (current === version.current && !abort.signal.aborted)
          setLoading(false);
      }
    }, 300);
    return () => {
      abort.abort();
      clearTimeout(timer);
      ++version.current;
    };
  }, [query, loadOptions, minChars, open, disabled]);
  const update = (v: string) => {
    setQuery(v);
    clearTimeout(timer.current);
    if (!loadOptions && debounce > 0)
      timer.current = setTimeout(() => notifyValue.current?.(v), debounce);
    else onValueChange?.(v);
  };
  const clear = () => {
    clearTimeout(timer.current);
    setQuery("");
    // DsInput already emits the empty value. Flush only a deferred plain input.
    if (!loadOptions && debounce > 0) onValueChange?.("");
  };
  return {
    query, options, loading, failed, update, clear,
    select: (label: string) => {
      clearTimeout(timer.current);
      setQuery(label);
      onValueChange?.(label);
    },
  };
}
