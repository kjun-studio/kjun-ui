import { computed, onBeforeUnmount, ref, watch } from "vue";
import { optionLabel, optionValue, type OptionValue, type SelectOption } from "../../../../shared/package-runtime/options";

// Vue forms of shared/package-runtime/{select,combobox,search-input}.ts.

/** A request does not change controlled state. Reset only on logical dismissal. */
export function useSelectState(controlled: () => boolean | undefined, disabled: () => boolean, pageSize: () => number, onOpenChange: (open: boolean) => void) {
  const internal = ref(false), query = ref(""), limit = ref(pageSize()), session = ref(0);
  const isControlled = () => typeof controlled() === "boolean";
  const open = computed(() => !disabled() && (isControlled() ? controlled()! : internal.value));
  watch(disabled, value => { if (value && !isControlled()) internal.value = false; });
  watch(open, (value, previous) => {
    if (previous && !value) { query.value = ""; limit.value = pageSize(); session.value++; }
  });
  watch(pageSize, value => { limit.value = value; });
  return {
    open, query, limit, session,
    changeOpen(next: boolean) {
      if (next === open.value || (next && disabled())) return;
      if (!isControlled()) internal.value = next;
      onOpenChange(next);
    },
    search(next: string) { query.value = next; limit.value = pageSize(); },
    showMore() { limit.value += pageSize(); },
  };
}

export function useComboboxModel<T extends SelectOption>(props: () => {
  value: OptionValue | null; options: T[]; labelKey: string; valueKey: string; disabled: boolean;
  filterFn?: (option: T, query: string) => boolean;
}, events: { change: (value: OptionValue | null) => void; search: (value: string) => void; clear: () => void }) {
  const selectedLabel = computed(() => {
    const { options, value, valueKey, labelKey } = props();
    const selected = options.find(option => optionValue(option, valueKey) === value);
    return selected !== undefined ? optionLabel(selected, labelKey) : "";
  });
  const query = ref(selectedLabel.value), open = ref(false);
  // Recreated option objects do not replace an in-progress search draft.
  // Separate sources compare by value: a new options array with the same selected label keeps the draft.
  watch([() => props().value, selectedLabel], () => { query.value = selectedLabel.value; });
  watch(() => props().disabled, value => { if (value) open.value = false; });
  return {
    open,
    displayValue: computed(() => open.value && !props().disabled ? query.value : selectedLabel.value),
    options: computed(() => {
      const { options, filterFn, labelKey } = props();
      return options.filter(option => filterFn ? filterFn(option, query.value)
        : optionLabel(option, labelKey).toLocaleLowerCase().includes(query.value.toLocaleLowerCase()));
    }),
    changeOpen(next: boolean) { if (next && !open.value) query.value = selectedLabel.value; open.value = next; },
    search(next: string, openOnInput: boolean) { query.value = next; if (openOnInput) open.value = true; events.search(next); },
    select(option: T) { events.change(optionValue(option, props().valueKey)); query.value = optionLabel(option, props().labelKey); open.value = false; },
    clear() { events.change(null); events.clear(); },
  };
}

export interface SearchInputModelProps<T> {
  value: string; disabled: boolean; debounce: number; minChars: number;
  loadOptions?: (query: string, context: { signal: AbortSignal }) => Promise<T[]>;
}
export function useSearchInputModel<T>(props: () => SearchInputModelProps<T>, open: () => boolean,
  events: { change: (value: string) => void; error: (error: unknown) => void }) {
  const query = ref(props().value), options = ref<T[]>([]) as { value: T[] }, loading = ref(false);
  // A failed request is its own state so the panel never reads it as an empty result.
  const failed = ref(false);
  let version = 0, timer: ReturnType<typeof setTimeout> | undefined;
  // An external value or input mode change supersedes a pending draft notification.
  watch(() => props().value, value => { clearTimeout(timer); query.value = value; }, { flush: "sync" });
  watch(() => [props().disabled, props().debounce, !!props().loadOptions], () => clearTimeout(timer), { flush: "sync" });
  let abort: AbortController | undefined, request: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => { abort?.abort(); clearTimeout(request); version++; };
  watch(() => [query.value, props().loadOptions, props().minChars, open(), props().disabled] as const, () => {
    cancel();
    const current = ++version, controller = new AbortController();
    abort = controller;
    failed.value = false;
    const { loadOptions, disabled, minChars } = props();
    if (!loadOptions || !open() || disabled || query.value.length < minChars) { options.value = []; loading.value = false; return; }
    loading.value = true; options.value = [];
    request = setTimeout(async () => {
      try {
        const result = await loadOptions(query.value, { signal: controller.signal });
        if (current === version && !controller.signal.aborted) options.value = result;
      } catch (error) {
        if (current === version && !controller.signal.aborted) { options.value = []; failed.value = true; events.error(error); }
      } finally {
        if (current === version && !controller.signal.aborted) loading.value = false;
      }
    }, 300);
  }, { immediate: true });
  onBeforeUnmount(() => { cancel(); clearTimeout(timer); });
  return {
    query, options, loading, failed,
    update(value: string) {
      query.value = value;
      clearTimeout(timer);
      const { loadOptions, debounce } = props();
      if (!loadOptions && debounce > 0) timer = setTimeout(() => events.change(value), debounce);
      else events.change(value);
    },
    clear() {
      clearTimeout(timer);
      query.value = "";
      // KjunInput already emits the empty value. Flush only a deferred plain input.
      if (!props().loadOptions && props().debounce > 0) events.change("");
    },
    select(label: string) { clearTimeout(timer); query.value = label; events.change(label); },
  };
}
