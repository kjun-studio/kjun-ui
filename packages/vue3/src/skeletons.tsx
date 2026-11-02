import { useKjunMessages } from "./runtime/messages";
import { defineComponent, type ExtractPublicPropTypes, type PropType } from "vue";
import { tokens, type InputSize } from "@kjun-ui/tokens";
import { KjunSkeleton, KjunSpinner } from "./display";
import { useSkeletonPhase } from "./skeleton-phase";
import { useLoadingReveal } from "./runtime/loading-reveal";
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
import { css } from "./runtime/style";

type Length = number | string;
const sizes = tokens.extensions.skeleton;

const kjunListSkeletonProps = {
  rows: { type: Number, default: 8 },
  /** "row" is the silhouette of KjunListRow: title and description lines, a text-start divider, no avatar unless asked. */
  variant: { type: String as PropType<"market" | "compact" | "notification" | "row">, default: "market" },
  /** Defaults to true, or false for the row variant. */
  avatar: { type: Boolean, default: undefined },
  avatarSize: { type: [Number, String] as PropType<Length>, default: sizes.listAvatarSize },
  quote: { type: Boolean, default: true },
  /** Row variant: draws the description line. */
  description: { type: Boolean, default: true },
  /** Row variant: what ends the row, a value, a switch or a chevron; quote={false} leaves it empty. */
  trailing: { type: String as PropType<"value" | "switch" | "chevron">, default: "value" },
  /** Announces loading to screen readers (a status); the skeleton itself stays silent. */
  loadingText: { type: String, default: undefined },
} as const;
export type KjunListSkeletonProps = ExtractPublicPropTypes<typeof kjunListSkeletonProps>;
export const KjunListSkeleton = defineComponent({
  name: "KjunListSkeleton",
  props: kjunListSkeletonProps,
  setup(props) {
    // Like React: the row variant uses KjunListRow's line boxes; other variants take each slot's line height from CSS.
    const row = (i: number) => {
      const avatar = props.avatar ?? false;
      return (
        <div key={i} class="kjun-list-skeleton-row" data-variant="row" data-leading={avatar || undefined}>
          {avatar && <div class="kjun-list-skeleton-leading"><KjunSkeleton type="avatar" width={props.avatarSize} height={props.avatarSize} /></div>}
          <div class="kjun-list-skeleton-label">
            <KjunSkeleton type="line" role="control" width={i % 2 ? "55%" : "40%"} />
            {props.description && <KjunSkeleton type="line" role="caption" width="30%" />}
          </div>
          {props.quote && (
            <div class="kjun-list-skeleton-trailing" data-kind={props.trailing}>
              {props.trailing === "switch" ? <KjunSkeleton type="avatar" width={tokens.extensions.switch.widths.md} height={tokens.extensions.switch.heights.md} />
                : <KjunSkeleton type="line" role="control" width={props.trailing === "chevron" ? tokens.iconSizes.default : sizes.detailWidth} />}
            </div>
          )}
        </div>
      );
    };
    const quoteRow = (i: number) => (
      <div key={i} class="kjun-list-skeleton-row" data-variant={props.variant}>
        {(props.avatar ?? true) && <KjunSkeleton type="avatar" width={props.avatarSize} height={props.avatarSize} />}
        <div class="kjun-list-skeleton-label">
          <KjunSkeleton type="line" width={i % 2 ? "80%" : "65%"} />
          <KjunSkeleton type="line" width="50%" />
        </div>
        {props.quote && (
          <div class="kjun-list-skeleton-quote">
            <KjunSkeleton type="line" width={sizes.quoteWidth} />
            <KjunSkeleton type="line" width={sizes.detailWidth} />
          </div>
        )}
      </div>
    );
    return () => (
      <div aria-hidden={props.loadingText ? undefined : "true"} role={props.loadingText ? "status" : undefined}>
        {props.loadingText && <span class="kjun-sr-only">{props.loadingText}</span>}
        {Array.from({ length: props.rows }, (_, i) => props.variant === "row" ? row(i) : quoteRow(i))}
      </div>
    );
  },
});

type FormSkeletonField = string | { label?: string; height?: Length };
const kjunFormSkeletonProps = {
  fields: { type: Array as PropType<FormSkeletonField[]>, default: () => ["", "", "", ""] },
  columns: { type: Number, default: 1 },
  multiline: { type: Boolean, default: false },
  size: { type: String as PropType<InputSize>, default: "md" },
  /** Announces loading to screen readers (a status); the skeleton itself stays silent. */
  loadingText: { type: String, default: undefined },
} as const;
export type KjunFormSkeletonProps = ExtractPublicPropTypes<typeof kjunFormSkeletonProps>;
export const KjunFormSkeleton = defineComponent({
  name: "KjunFormSkeleton",
  props: kjunFormSkeletonProps,
  setup(props) {
    return () => {
      const input = tokens.input[props.size];
      return (
        <div aria-hidden={props.loadingText ? undefined : "true"} role={props.loadingText ? "status" : undefined} class="kjun-form-skeleton" data-columns={props.columns}
          style={{ "--_kjun-form-skeleton-radius": `${input.radius}px` }}>
          {props.loadingText && <span class="kjun-sr-only">{props.loadingText}</span>}
          {props.fields.map((field, i) => (
            <div key={i}>
              {field ? (
                <div class="kjun-form-skeleton-label">{typeof field === "string" ? field : field.label}</div>
              ) : (
                // The bar sits in the label's line box so the field starts where the real input will.
                <KjunSkeleton type="line" role="label" width={sizes.formLabelWidth} />
              )}
              <KjunSkeleton type="block" height={
                typeof field === "object" && field.height != null ? field.height
                  : props.multiline ? input.lineHeight * 3 + input.textareaPaddingY * 2 + 2 * tokens.border.controlWidth
                  : input.height} />
            </div>
          ))}
        </div>
      );
    };
  },
});

const chart = tokens.extensions.chartSkeleton;
const kjunChartSkeletonProps = {
  kind: { type: String as PropType<KjunChartSkeletonKind>, default: "frame" },
  height: { type: [Number, String] as PropType<Length>, default: chart.height },
  loadingText: { type: String, default: undefined },
  skeleton: { type: Boolean, default: true },
  loadingDelay: { type: Number, default: 0 },
  rows: { type: Number, default: 8 },
  columns: { type: Number, default: 14 },
  /** Frame: horizontal grid lines of the app's chart, top to baseline. */
  gridLines: { type: Number, default: chartFrameDefaults.gridLines },
  /** Frame: x-axis tick labels. */
  xTicks: { type: Number, default: chartFrameDefaults.xTicks },
  /** Frame: y-axis label width in px; label bars fill it, less the label gap. */
  axisWidth: { type: Number, default: chart.axisWidth },
} as const;
export type KjunChartSkeletonProps = ExtractPublicPropTypes<typeof kjunChartSkeletonProps>;
export const KjunChartSkeleton = defineComponent({
  name: "KjunChartSkeleton",
  props: kjunChartSkeletonProps,
  setup(props) {
    const m = useKjunMessages();
    const revealed = useLoadingReveal(() => true, () => props.loadingDelay);
    const phase = useSkeletonPhase(() => props.skeleton);
    return () => {
      const kind = chartSkeletonKind(props.kind),
        shown = revealed(),
        status = shown && (props.loadingText ?? m.value.chartLoading) ? "status" : undefined,
        rowCount = chartSkeletonCount(props.rows),
        columnCount = chartSkeletonCount(props.columns);
      return (
        <div ref={phase} class="kjun-chart-skeleton" data-kjun-chart-kind={kind} data-skeleton={props.skeleton ? undefined : "false"}
          aria-hidden={shown ? undefined : "true"} style={css({ height: props.height, visibility: shown ? undefined : "hidden" })}>
          {!props.skeleton ? (
            <div class="kjun-data-loading" data-kjun-chart-part="loading" role={status}>
              {/* The spinner's own status would announce "로딩 중" on top of (or instead of) the chart's text. */}
              <span aria-hidden="true"><KjunSpinner size="md" /></span>
              {(props.loadingText ?? m.value.chartLoading) && <p>{(props.loadingText ?? m.value.chartLoading)}</p>}
            </div>
          ) : [
            // Like React: the drawing area grows and the loading text is a caption under it.
            <div key="area" class="kjun-chart-skeleton-area" aria-hidden="true">
              {kind === "donut" ? (
                <div class="kjun-chart-skeleton-donut" data-kjun-chart-part="donut" />
              ) : kind === "matrix" ? (
                <div class="kjun-chart-skeleton-matrix" data-kjun-chart-part="matrix"
                  style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))` }}>
                  {Array.from({ length: rowCount * columnCount }, (_, i) => (
                    <div key={i} class="kjun-chart-skeleton-cell" data-kjun-chart-part="cell"
                      data-muted={chartMatrixMuted(Math.floor(i / columnCount), i % columnCount) ? "" : undefined} />
                  ))}
                </div>
              ) : (
                <div class="kjun-chart-skeleton-frame" style={{ "--_kjun-chart-axis": `${Math.max(0, props.axisWidth)}px`, "--_kjun-chart-steps": chartFrameStops(props.xTicks).length - 1 }}>
                  {/* Only the app's frame is honest before data arrives; any series shape would be invented. */}
                  <svg viewBox={chartFrameViewBox} preserveAspectRatio="none" class="kjun-chart-skeleton-plot" data-kjun-chart-part="plot" aria-hidden="true">
                    <path d={chartFramePath(props.gridLines)} fill="none" stroke="var(--_kjun-color-chart-grid)" stroke-width={tokens.border.defaultWidth} vector-effect="non-scaling-stroke" />
                  </svg>
                  {props.axisWidth > 0 && chartFrameStops(props.gridLines).map(stop => (
                    <div key={"y" + stop} class="kjun-chart-skeleton-label" data-axis="y" data-kjun-chart-part="label" style={{ "--_kjun-stop": stop }} />
                  ))}
                  {chartFrameStops(props.xTicks).map(stop => (
                    <div key={"x" + stop} class="kjun-chart-skeleton-label" data-axis="x" data-kjun-chart-part="label"
                      style={{ "--_kjun-stop": stop, "--_kjun-shift": `${chartTickShift(stop)}%` }} />
                  ))}
                </div>
              )}
            </div>,
            (props.loadingText ?? m.value.chartLoading) && (
              <div key="status" class="kjun-chart-skeleton-status" data-kjun-chart-part="status" role={status}>{(props.loadingText ?? m.value.chartLoading)}</div>
            ),
          ]}
        </div>
      );
    };
  },
});
