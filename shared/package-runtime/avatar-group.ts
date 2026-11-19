/** The overflow chip stops at this count so its text always fits the circle; the group name keeps the real number. */
export const AVATAR_GROUP_OVERFLOW_CAP = 99;
const DEFAULT_MAX = 4;

export interface AvatarGroupModel { visible: number; overflow: number; overflowText: string; totalCount: number }

/**
 * How many avatars a group draws, how many it folds into "+N", and the headcount it is named by.
 * At xs and sm a three-character "+99" does not fit the circle, so the chip drops the "+" and shows "99".
 */
export function avatarGroupModel({ count, max = DEFAULT_MAX, total, size }: { count: number; max?: number; total?: number; size?: string }): AvatarGroupModel {
  const cap = Number.isFinite(max) ? Math.max(1, Math.floor(max)) : DEFAULT_MAX;
  const visible = Math.min(count, cap);
  const totalCount = Math.max(Number.isFinite(total) ? total! : count, count);
  const overflow = totalCount - visible;
  const full = overflow > 0 ? `+${Math.min(overflow, AVATAR_GROUP_OVERFLOW_CAP)}` : "";
  const overflowText = full.length > 2 && (size === "xs" || size === "sm") ? full.slice(1) : full;
  return { visible, overflow, overflowText, totalCount };
}
