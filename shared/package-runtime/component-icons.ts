import minus from '@kjun-ui/icons/icons/minus';
import cloudUpload from '@kjun-ui/icons/icons/cloud-upload';
import ban from '@kjun-ui/icons/icons/ban';
import layoutSidebarLeftCollapse from '@kjun-ui/icons/icons/layout-sidebar-left-collapse';
import layoutSidebarLeftExpand from '@kjun-ui/icons/icons/layout-sidebar-left-expand';
import exclamationMark from '@kjun-ui/icons/icons/exclamation-mark';
import type { KjunIconRegistry } from '@kjun-ui/icons';

// Outside the public default set; scoped to the components that draw them.
export const componentIcons: KjunIconRegistry = { minus, 'cloud-upload': cloudUpload, ban,
  'layout-sidebar-left-collapse': layoutSidebarLeftCollapse, 'layout-sidebar-left-expand': layoutSidebarLeftExpand,
  'exclamation-mark': exclamationMark };
