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
    <KjunCard className="kjun-market-list-panel">
      <div>{controls}</div>
      <div className="kjun-market-list-panel-list">{children}</div>
    </KjunCard>
  );
}
