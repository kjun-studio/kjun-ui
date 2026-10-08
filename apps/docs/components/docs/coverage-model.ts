import coverage from '@/lib/generated/coverage.json';

export const platforms = ['vue2', 'react', 'native'] as const;
export type Platform = typeof platforms[number];
export const platformLabels: Record<Platform, string> = { vue2: 'Vue 2', react: 'React', native: 'Native Web' };
export const statusLabels = { supported: '지원', preview: '미리보기', review: '확인 필요', unsupported: '미지원' };
export type Status = keyof typeof statusLabels;
export type Entry = typeof coverage.components[number];
export const statusOrder: Status[] = ['supported', 'preview', 'review', 'unsupported'];

/** The most common state per platform is the page's baseline; everything else is an exception. */
export const baseline = Object.fromEntries(platforms.map(platform => {
  const counts = coverage.summary.find(summary => summary.platform === platform)!.counts as Record<Status, number>;
  return [platform, statusOrder.reduce((best, status) => counts[status] > counts[best] ? status : best, statusOrder[0])];
})) as Record<Platform, Status>;
export const isException = (entry: Entry) => platforms.some(platform => entry.states[platform] !== baseline[platform]);
export const exceptions = coverage.components.filter(isException);
export const usedStatuses = statusOrder.filter(status => coverage.components.some(entry => platforms.some(platform => entry.states[platform] === status)));
