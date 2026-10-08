import { useState } from 'react';
import { allIcons } from '@kjun-ui/icons/all';
import { appColors } from './style-values';
export const iconRenderCases = Object.entries(allIcons).flatMap(([name, icon]) => [{ name, filled: false }, ...(icon.filled ? [{ name, filled: true }] : [])]);
export function IconRenderCases({ K, native = false }: { K: any; native?: boolean }) {
  const [offset, setOffset] = useState(0);
  Object.assign(window, { renderIconBatch: setOffset });
  return <K.KjunProvider icons={allIcons} {...(native ? { colors: appColors } : {})}>
    <div data-testid="icon-batch" data-offset={offset} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {iconRenderCases.slice(offset, offset + 120).map(({ name, filled }) => <div key={name + filled} data-icon={name} data-filled={filled}>
        <K.DsIcon name={name} filled={filled} size={24} />
      </div>)}
    </div>
  </K.KjunProvider>;
}
