import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tokens, type InputSize } from "@kjun-ui/tokens";
import { type CSSProperties } from "react";
import { KjunSkeleton, KjunSpinner } from "./display";
import { useLoadingReveal } from "../../../shared/package-runtime/use-loading-reveal";
import {
  chartFrameDefaults,
  chartFramePath,
  chartFrameStops,
  chartFrameViewBox,
  chartMatrixMuted,
  chartSkeletonCount,
  chartSkeletonKind,
  chartTickShift,
  type KjunChartSkeletonKind,
} from "../../../shared/package-runtime/chart-skeleton";
export interface KjunListSkeletonProps {
  rows?: number;
  /** "row" is the silhouette of KjunListRow: title and description lines, a text-start divider, no avatar unless asked. */
  variant?: "market" | "compact" | "notification" | "row";
  avatar?: boolean;
  avatarSize?: CSSProperties["width"];
  quote?: boolean;
}
export function KjunListSkeleton({
  rows = 8,
  variant = "market",
  avatar,
  avatarSize = tokens.extensions.skeleton.listAvatarSize,
  quote = true,
}: KjunListSkeletonProps) {
  if (variant === "row") return <ListRowSkeleton rows={rows} avatar={avatar ?? false} avatarSize={avatarSize} trailing={quote} />;
  avatar ??= true;
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
// KjunListRow's own geometry: bars sit in the title and description line boxes, so the list keeps its height.
function ListRowSkeleton({ rows, avatar, avatarSize, trailing }: { rows: number; avatar: boolean; avatarSize: CSSProperties["width"]; trailing: boolean }) {
  const type = tokens.typography;
  const slot = (role: "control" | "caption", w: CSSProperties["width"]) => (
    <div className="kjun-list-skeleton-slot" data-role={role}>
      <KjunSkeleton type="block" height={type[role].lineHeightPx / 2} width={w} />
    </div>
  );
  return (
    <div aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="kjun-list-skeleton-row" data-variant="row" data-leading={avatar || undefined}>
          {avatar && <div className="kjun-list-skeleton-leading"><KjunSkeleton type="avatar" width={avatarSize} height={avatarSize} /></div>}
          <div className="kjun-list-skeleton-label">
            {slot("control", i % 2 ? "55%" : "40%")}
            {slot("caption", "30%")}
          </div>
          {trailing && <div className="kjun-list-skeleton-trailing">{slot("control", tokens.extensions.skeleton.detailWidth)}</div>}
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
  /** Frame: horizontal grid lines of the app's chart, top to baseline (default 5). */
  gridLines?: number;
  /** Frame: x-axis tick labels (default 6). */
  xTicks?: number;
  /** Frame: y-axis label width in px (default 40); label bars fill it, less the label gap. */
  axisWidth?: number;
}
export function KjunChartSkeleton({
  kind: requestedKind = "frame",
  height = tokens.extensions.chartSkeleton.height,
  loadingText,
  skeleton = true,
  loadingDelay = 0,
  rows = 8,
  columns = 14,
  gridLines = chartFrameDefaults.gridLines,
  xTicks = chartFrameDefaults.xTicks,
  axisWidth = tokens.extensions.chartSkeleton.axisWidth,
}: KjunChartSkeletonProps) {
  const m = useKjunMessages();
  loadingText ??= m.chartLoading;
  const kind = chartSkeletonKind(requestedKind),
    revealed = useLoadingReveal(true, loadingDelay),
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
          <div className="kjun-chart-skeleton-area" aria-hidden="true">
            {kind === "donut" ? (
              <div className="kjun-chart-skeleton-donut" data-kjun-chart-part="donut" />
            ) : kind === "matrix" ? (
              <div
                className="kjun-chart-skeleton-matrix"
                data-kjun-chart-part="matrix"
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
              <div className="kjun-chart-skeleton-frame" style={{ "--_kjun-chart-axis": `${Math.max(0, axisWidth)}px`, "--_kjun-chart-steps": chartFrameStops(xTicks).length - 1 } as CSSProperties}>
                {/* Only the app's frame is honest before data arrives; any series shape would be invented. */}
                <svg viewBox={chartFrameViewBox} preserveAspectRatio="none" className="kjun-chart-skeleton-plot" data-kjun-chart-part="plot" aria-hidden="true">
                  <path d={chartFramePath(gridLines)} fill="none" stroke="var(--_kjun-color-chart-grid)" strokeWidth={tokens.border.defaultWidth} vectorEffect="non-scaling-stroke" />
                </svg>
                {axisWidth > 0 && chartFrameStops(gridLines).map((stop) => (
                  <div key={"y" + stop} className="kjun-chart-skeleton-label" data-axis="y" data-kjun-chart-part="label" style={{ "--_kjun-stop": stop } as CSSProperties} />
                ))}
                {chartFrameStops(xTicks).map((stop) => (
                  <div key={"x" + stop} className="kjun-chart-skeleton-label" data-axis="x" data-kjun-chart-part="label"
                    style={{ "--_kjun-stop": stop, "--_kjun-shift": `${chartTickShift(stop)}%` } as CSSProperties} />
                ))}
              </div>
            )}
          </div>
          {loadingText && (
            <div className="kjun-chart-skeleton-status" data-kjun-chart-part="status" role={status}>
              {loadingText}
            </div>
          )}
        </>
      )}
    </div>
  );
}
export { KjunMarketTableSkeleton } from "./market-skeleton";
export type { KjunMarketTableSkeletonProps } from "./market-skeleton";
