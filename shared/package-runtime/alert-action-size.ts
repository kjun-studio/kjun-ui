import type { ButtonSize } from '@kjun-ui/tokens';

/** Alert actions stay one button step below the alert's own control line. Framework-free so Vue can share it. */
export const alertActionSizes = { sm: 'xs', md: 'sm', lg: 'md' } as const satisfies Record<'sm' | 'md' | 'lg', ButtonSize>;

/** Popover actions default one step below md so a button never outweighs the small panel; an explicit size wins. */
export const popoverActionSize = 'sm' as const satisfies ButtonSize;
