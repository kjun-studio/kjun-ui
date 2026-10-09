import type { ButtonSize } from '@kjun-ui/tokens';

/** Alert actions stay one button step below the alert's own control line. Framework-free so Vue can share it. */
export const alertActionSizes = { sm: 'xs', md: 'sm' } as const satisfies Record<'sm' | 'md', ButtonSize>;
