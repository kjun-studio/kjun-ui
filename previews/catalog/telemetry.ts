export interface ExampleObserver {
  snapshot(values: Record<string, any>): void;
  event(name: string, phase: string, value: unknown): void;
}
export function plainValue(value: unknown, depth = 0, seen = new WeakSet<object>()): any {
  if (value == null || ['string', 'number', 'boolean'].includes(typeof value)) return value;
  if (depth > 4) return '[…]';
  if (value instanceof Error) return { name: value.name, message: value.message };
  if (typeof value === 'function') return '[callback]';
  if (typeof value !== 'object') return String(value);
  if (seen.has(value)) return '[circular]';
  seen.add(value);
  if ('nativeEvent' in value || 'target' in value) {
    const event = value as any;
    return { type: event.type, value: event.target?.value ?? event.nativeEvent?.text };
  }
  if (Array.isArray(value)) return value.slice(0, 100).map(item => plainValue(item, depth + 1, seen));
  return Object.fromEntries(Object.entries(value).slice(0, 50).map(([key, item]) => [key, plainValue(item, depth + 1, seen)]));
}
const cache = new WeakMap<ExampleObserver, WeakMap<Function, Map<string, Function>>>();
function traced(fn: Function, name: string, observer: ExampleObserver, swallow = false) {
  if (!cache.has(observer)) cache.set(observer, new WeakMap());
  const functions = cache.get(observer)!;
  if (!functions.has(fn)) functions.set(fn, new Map());
  const names = functions.get(fn)!;
  if (!names.has(name)) names.set(name, (...args: any[]) => {
    observer.event(name, '호출', plainValue(args));
    try {
      const result = fn(...args);
      if (result && typeof result.then === 'function') return result.then((value: any) => {
        observer.event(name, '완료', plainValue(value)); return value;
      }, (error: any) => {
        observer.event(name, error?.name === 'AbortError' ? '취소' : '실패', plainValue(error));
        if (!swallow) throw error;
      });
      if (result !== undefined) observer.event(name, '반환', plainValue(result));
      return result;
    } catch (error) {
      observer.event(name, '실패', plainValue(error));
      if (!swallow) throw error;
    }
  });
  return names.get(name)!;
}
export function eventName(component: string, key: string, platform: string) {
  if (platform === 'native' && key === 'onValueChange' && ['DsInput', 'DsTextarea'].includes(component)) return 'onChangeText';
  if (platform !== 'vue2' || !/^on[A-Z]/.test(key)) return key;
  const names: Record<string, string> = { onChangeCommit: 'change', onValueChange: 'input', onOpenChange: component === 'DsSelect' ? 'update:open' : 'input', onSelectionChange: 'selection-change', onExpandedRowsChange: 'update:expandedRows' };
  return names[key] || key.slice(2).replace(/^[A-Z]/, c => c.toLowerCase()).replace(/[A-Z]/g, c => '-' + c.toLowerCase());
}
export function instrumentRenderer(render: Function, observer: ExampleObserver, platform: string) {
  return (name: string, props: Record<string, any> = {}, children?: any, slots?: any) => {
    const mapped = { ...props };
    for (const [key, value] of Object.entries(props))
      if (typeof value === 'function' && (/^on[A-Z]/.test(key) || ['loadOptions', 'copyText', 'openUrl'].includes(key)))
        mapped[key] = traced(value, name + '.' + eventName(name, key, platform), observer, /^on[A-Z]/.test(key));
    return render(name, mapped, children, slots);
  };
}
const feedbackCache = new WeakMap<ExampleObserver, WeakMap<object, any>>();
export function instrumentFeedback(feedback: any, observer: ExampleObserver): any {
  if (!feedbackCache.has(observer)) feedbackCache.set(observer, new WeakMap());
  const entries = feedbackCache.get(observer)!;
  if (!entries.has(feedback)) entries.set(feedback, {
    toast: Object.fromEntries(Object.entries(feedback.toast).map(([key, fn]) => [key, traced(fn as Function, 'toast.' + key, observer)])),
    confirm: traced(feedback.confirm, 'confirm', observer), prompt: traced(feedback.prompt, 'prompt', observer),
  });
  return entries.get(feedback);
}
