/** The overflow chip stops at this count so its text always fits the circle; the group name keeps the real number. */
export const AVATAR_GROUP_OVERFLOW_CAP = 99;
const DEFAULT_MAX = 4;

export interface AvatarGroupModel { visible: number; overflow: number; overflowText: string; totalCount: number }

/** How many avatars a group draws, how many it folds into "+N", and the headcount it is named by. */
export function avatarGroupModel({ count, max = DEFAULT_MAX, total }: { count: number; max?: number; total?: number }): AvatarGroupModel {
  const cap = Number.isFinite(max) ? Math.max(1, Math.floor(max)) : DEFAULT_MAX;
  const visible = Math.min(count, cap);
  const totalCount = Math.max(Number.isFinite(total) ? total! : count, count);
  const overflow = totalCount - visible;
  const overflowText = overflow > 0 ? `+${Math.min(overflow, AVATAR_GROUP_OVERFLOW_CAP)}` : "";
  return { visible, overflow, overflowText, totalCount };
}
