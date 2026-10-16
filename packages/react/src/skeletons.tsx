import { tokens, type InputSize } from "@kjun-ui/tokens";
import { type CSSProperties } from "react";
import { KjunSkeleton, KjunSpinner } from "./display";
import { useLoadingReveal } from "../../../shared/package-runtime/use-loading-reveal";
import {
  chartFramePath,
  chartFrameViewBox,
  chartMatrixMuted,
  chartSkeletonCount,
  type KjunChartSkeletonKind,
} from "../../../shared/package-runtime/chart-skeleton";
export interface KjunListSkeletonProps {
  rows?: number;
  variant?: "market" | "compact" | "notification";
  avatar?: boolean;
  avatarSize?: CSSProperties["width"];
  quote?: boolean;
}
export function KjunListSkeleton({
  rows = 8,
  variant = "market",
  avatar = true,
  avatarSize = tokens.extensions.skeleton.listAvatarSize,
  quote = true,
}: KjunListSkeletonProps) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="kjun-list-skeleton-row" data-variant={variant}>
          {avatar && (
            <KjunSkeleton type="avatar" width={avatarSize} height={avatarSize} />
          )}
          <div className="kjun-list-skeleton-label">
            <KjunSkeleton
              type="block"
              height={tokens.extensions.skeleton.lineHeights.md}
              width={i % 2 ? "80%" : "65%"}
            />
            <KjunSkeleton type="block" height={tokens.extensions.skeleton.lineHeights.sm} width="50%" />
          </div>
          {quote && (
            <div className="kjun-list-skeleton-quote">
              <KjunSkeleton type="block" height={tokens.extensions.skeleton.quoteHeight} width={tokens.extensions.skeleton.quoteWidth} />
              <KjunSkeleton type="block" height={tokens.extensions.skeleton.lineHeights.sm} width={tokens.extensions.skeleton.detailWidth} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
export interface KjunFormSkeletonProps {
  fields?: (string | { label?: string; height?: CSSProperties["height"] })[];
  columns?: number;
  multiline?: boolean;
  size?: InputSize;
}
export function KjunFormSkeleton({
  fields = ["", "", "", ""],
  columns = 1,
  multiline = false,
  size = "md",
}: KjunFormSkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className="kjun-form-skeleton"
      data-columns={columns}
      style={{ "--_kjun-form-skeleton-radius": `${tokens.input[size].radius}px` } as CSSProperties}
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
              <KjunSkeleton type="block" height={tokens.extensions.skeleton.formLabelHeight} width={tokens.extensions.skeleton.formLabelWidth} />
            </div>
          )}
          <KjunSkeleton
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
export interface KjunChartSkeletonProps {
  kind?: KjunChartSkeletonKind;
  height?: CSSProperties["height"];
  loadingText?: string;
  skeleton?: boolean;
  loadingDelay?: number;
  rows?: number;
  columns?: number;
}
export function KjunChartSkeleton({
  kind = "frame",
  height = tokens.extensions.chartSkeleton.height,
  loadingText = "차트를 불러오는 중",
  skeleton = true,
  loadingDelay = 0,
  rows = 8,
  columns = 14,
}: KjunChartSkeletonProps) {
  const revealed = useLoadingReveal(true, loadingDelay),
    status = revealed && loadingText ? "status" : undefined,
    rowCount = chartSkeletonCount(rows),
    columnCount = chartSkeletonCount(columns);
  return (
    <div
      className="kjun-chart-skeleton"
      data-kjun-chart-kind={kind}
      data-skeleton={skeleton ? undefined : "false"}
      aria-hidden={revealed ? undefined : true}
      style={{ height, visibility: revealed ? undefined : "hidden" }}
    >
      {!skeleton ? (
        <div className="kjun-data-loading" data-kjun-chart-part="loading" role={status}>
          {/* The spinner's own status would announce "로딩 중" on top of (or instead of) the chart's text. */}
          <span aria-hidden="true">
            <KjunSpinner size="md" />
          </span>
          {loadingText && <p>{loadingText}</p>}
        </div>
      ) : (
        <>
          {kind === "donut" ? (
            <div className="kjun-chart-skeleton-donut" data-kjun-chart-part="donut" aria-hidden="true" />
          ) : kind === "matrix" ? (
            <div
              className="kjun-chart-skeleton-matrix"
              data-kjun-chart-part="matrix"
              aria-hidden="true"
              style={{
                gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: rowCount * columnCount }, (_, i) => (
                <div
                  key={i}
                  className="kjun-chart-skeleton-cell"
                  data-kjun-chart-part="cell"
                  data-muted={chartMatrixMuted(Math.floor(i / columnCount), i % columnCount) ? "" : undefined}
                />
              ))}
            </div>
          ) : (
            <svg
              viewBox={chartFrameViewBox}
              preserveAspectRatio="none"
              className="kjun-chart-skeleton-plot"
              data-kjun-chart-part="plot"
              aria-hidden="true"
            >
              {/* Only the frame is honest before data arrives; any series shape would be invented. */}
              <path
                d={chartFramePath}
                fill="none"
                stroke="var(--_kjun-color-chart-grid)"
                strokeWidth={tokens.border.defaultWidth}
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          )}
          {loadingText && (
            <div className="kjun-chart-skeleton-status" data-kjun-chart-part="status" role={status}>
              <span>{loadingText}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
export { KjunMarketTableSkeleton } from "./market-skeleton";
export type { KjunMarketTableSkeletonProps } from "./market-skeleton";
