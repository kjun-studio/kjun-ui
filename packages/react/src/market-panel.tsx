import { tokens } from "@kjun-ui/tokens";
import { type ReactNode } from "react";
import { KjunCard } from "./display";

export function KjunMarketListPanel({
  controls,
  children,
}: {
  controls?: ReactNode;
  children: ReactNode;
}) {
  return (
    <KjunCard>
      <div>{controls}</div>
      <div style={{ marginTop: tokens.dimension.value16, borderTop: `${tokens.border.defaultWidth}px solid var(--_kjun-color-border)` }}>
        {children}
      </div>
    </KjunCard>
  );
}
