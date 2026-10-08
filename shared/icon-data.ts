import { tablerVersion, type KjunIconDefinition } from '@kjun/icons';
import type { IconEntry } from './icon-catalog';
const base = `/previews/icons/${tablerVersion}/`;
const pending = new Map<string, Promise<KjunIconDefinition>>();
export const validIconName = (name: unknown): name is string => typeof name === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) && name.length <= 100;
export async function loadIconCatalog(signal?: AbortSignal): Promise<IconEntry[]> {
  const response = await fetch(base + 'catalog.json', { signal });
  if (!response.ok) throw Error('아이콘 검색 정보를 불러오지 못했습니다.');
  return await response.json() as IconEntry[];
}
export function loadIcon(name: string): Promise<KjunIconDefinition> {
  if (!validIconName(name)) return Promise.reject(Error('잘못된 아이콘 이름입니다.'));
  if (!pending.has(name)) {
    const request = fetch(base + encodeURIComponent(name) + '.json').then(async response => {
      if (!response.ok) throw Error(`${name} 도형을 불러오지 못했습니다.`);
      const definition = await response.json() as Partial<KjunIconDefinition> | null;
      if (!definition || !Array.isArray(definition.outline) || !definition.outline.length) throw Error('잘못된 아이콘 데이터입니다.');
      return definition as KjunIconDefinition;
    }).catch(error => { pending.delete(name); throw error; });
    pending.set(name, request);
  }
  return pending.get(name)!;
}
