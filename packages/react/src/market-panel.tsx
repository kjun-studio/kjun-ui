import { tokens } from "@kjun/tokens";
import { type ReactNode } from "react";
import { DsCard } from "./display";

export function DsMarketListPanel({
  controls,
  children,
}: {
  controls?: ReactNode;
  children: ReactNode;
}) {
  return (
    <DsCard>
      <div>{controls}</div>
      <div style={{ marginTop: tokens.dimension.value16, borderTop: `${tokens.border.defaultWidth}px solid var(--_kjun-color-border)` }}>
        {children}
      </div>
    </DsCard>
  );
}
