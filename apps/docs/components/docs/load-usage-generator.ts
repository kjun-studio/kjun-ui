import { usageCategory, type UsageGenerator } from '../../../../shared/usage-examples';

const loaded = new Map<string, Promise<{ generate: UsageGenerator }>>();
let loadSequence = 0;
export async function loadBrowserUsageGenerator(name: string): Promise<UsageGenerator> {
  const group = usageCategory(name);
  let request = loaded.get(group);
  if (!request) {
    // Each category is a self-contained ESM bundle. A fresh URL also retries a
    // browser-cached failed import, including failures in its dependencies.
    const url = `${location.origin}/previews/usage/${group}.js?load=${Date.now()}-${++loadSequence}`;
    request = import(/* @vite-ignore */ url).catch(error => { loaded.delete(group); throw error; });
    loaded.set(group, request!);
  }
  const module = await request!;
  return input => {
    if (input.name !== name) throw Error('기본 사용 코드 대상 불일치');
    return module.generate(input);
  };
}
