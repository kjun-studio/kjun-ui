import { tokens, type InputSize } from "@kjun/tokens";
import { Fragment,type CSSProperties } from "react";
import { DsSkeleton } from "./display";
export interface DsListSkeletonProps {
  rows?: number;
  variant?: "market" | "compact" | "notification";
  avatar?: boolean;
  avatarSize?: CSSProperties["width"];
  quote?: boolean;
}
export function DsListSkeleton({
  rows = 8,
  variant = "market",
  avatar = true,
  avatarSize = tokens.extensions.skeleton.listAvatarSize,
  quote = true,
}: DsListSkeletonProps) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="kjun-list-skeleton-row" data-variant={variant}>
          {avatar && (
            <DsSkeleton type="avatar" width={avatarSize} height={avatarSize} />
          )}
          <div className="kjun-list-skeleton-label">
            <DsSkeleton
              type="block"
              height={tokens.extensions.skeleton.lineHeights.md}
              width={i % 2 ? "80%" : "65%"}
            />
            <DsSkeleton type="block" height={tokens.extensions.skeleton.lineHeights.sm} width="50%" />
          </div>
          {quote && (
            <div className="kjun-list-skeleton-quote">
              <DsSkeleton type="block" height={tokens.extensions.skeleton.quoteHeight} width={tokens.extensions.skeleton.quoteWidth} />
              <DsSkeleton type="block" height={tokens.extensions.skeleton.lineHeights.sm} width={tokens.extensions.skeleton.detailWidth} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
export interface DsFormSkeletonProps {
  fields?: (string | { label?: string; height?: CSSProperties["height"] })[];
  columns?: number;
  multiline?: boolean;
  size?: InputSize;
}
export function DsFormSkeleton({
  fields = ["", "", "", ""],
  columns = 1,
  multiline = false,
  size = "md",
}: DsFormSkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className="kjun-form-skeleton"
      data-columns={columns}
      style={{ "--form-skeleton-radius": `${tokens.input[size].radius}px` } as CSSProperties}
    >
      {fields.map((field, i) => (
        <div key={i}>
          {field ? (
            <div className="kjun-form-skeleton-label">
              {typeof field === "string" ? field : field.label}
            </div>
          ) : (
            // The bar sits in a label-line slot so the field starts where the real input will.
            <div className="kjun-form-skeleton-label-slot">
              <DsSkeleton type="block" height={tokens.extensions.skeleton.formLabelHeight} width={tokens.extensions.skeleton.formLabelWidth} />
            </div>
          )}
          <DsSkeleton
            type="block"
            height={
              typeof field === "object" && field.height != null
                ? field.height
                : multiline
                ? tokens.input[size].lineHeight * 3 + tokens.input[size].textareaPaddingY * 2 + 2 * tokens.border.controlWidth
                : tokens.input[size].height
            }
          />
        </div>
      ))}
    </div>
  );
}
export interface DsChartSkeletonProps {
  loadingText?: string;
  kind?: "grid" | "line" | "bar" | "donut" | "candle" | "matrix";
  height?: CSSProperties["height"];
}
export function DsChartSkeleton({
  loadingText = "차트를 불러오는 중",
  kind = "line",
  height = tokens.extensions.chartSkeleton.height,
}: DsChartSkeletonProps) {
  return (
    <div className="kjun-chart-skeleton" style={{ height }} aria-hidden="true">
      <div className="kjun-chart-skeleton-status">
        {loadingText && <span>{loadingText}</span>}
      </div>
      {kind === "donut" ? (
        <div className="kjun-chart-skeleton-donut">
          <DsSkeleton type="block" width={tokens.extensions.chartSkeleton.donutLabelWidth} height={tokens.extensions.chartSkeleton.donutLabelHeight} />
        </div>
      ) : (
        <svg
          viewBox="0 0 600 240"
          preserveAspectRatio="none"
          className="kjun-chart-skeleton-plot"
        >
          <path
            d="M20 10V220H590 M20 65H590 M20 120H590 M20 175H590"
            fill="none"
            stroke="var(--_kjun-color-border)"
            strokeWidth={1}
          />
          {/* A line kind previews its series; grid keeps only the axes. */}
          {kind === "line" && (
            <path d="M20 190 L100 160 L180 172 L260 120 L340 140 L420 96 L500 110 L590 64" fill="none" stroke="var(--_kjun-color-skeleton)" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
          )}
          {kind === "matrix"
            ? Array.from({ length: 8 }, (_, row) => (
                <g key={row}>
                  {Array.from({ length: 14 }, (_, col) => (
                    <rect
                      key={col}
                      x={24 + col * 40}
                      y={12 + row * 26}
                      width={36}
                      height={22}
                      rx={2}
                      fill="var(--_kjun-color-skeleton)"
                      opacity={(row + col + 2) % 3 === 0 ? 0.55 : 1}
                    />
                  ))}
                </g>
              ))
            : (kind === "bar" || kind === "candle") &&
              [60, 100, 85, 140, 110, 165, 180].map((h, i) => (
                <Fragment key={i}>
                  {kind === "candle" && (
                    <path
                      // The wick extends 15 past each end of the body and stays above the axis.
                      d={`M${55 + i * 75} ${195 - h}V${225 - h / 2}`}
                      fill="none"
                      stroke="var(--_kjun-color-skeleton)"
                      strokeWidth={4}
                    />
                  )}
                  <rect
                    x={35 + i * 75}
                    // Bars stand on the axis (y 220); candle bodies float within their wick.
                    y={kind === "candle" ? 210 - h : 220 - h}
                    width={kind === "candle" ? 28 : 42}
                    height={kind === "candle" ? h / 2 : h}
                    rx={3}
                    fill="var(--_kjun-color-skeleton)"
                  />
                </Fragment>
              ))}
        </svg>
      )}
    </div>
  );
}
export { DsMarketTableSkeleton } from "./market-skeleton";
export type { DsMarketTableSkeletonProps } from "./market-skeleton";
