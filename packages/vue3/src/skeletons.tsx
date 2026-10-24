import { useKjunMessages } from "./runtime/messages";
import { defineComponent, type ExtractPublicPropTypes, type PropType } from "vue";
import { tokens, type InputSize } from "@kjun-ui/tokens";
import { KjunSkeleton, KjunSpinner } from "./display";
import { useLoadingReveal } from "./runtime/loading-reveal";
import {
  chartFramePath,
  chartFrameViewBox,
  chartMatrixMuted,
  chartSkeletonCount,
  chartSkeletonKind,
  type KjunChartSkeletonKind,
} from "../../../shared/package-runtime/chart-skeleton";
import { css } from "./runtime/style";

type Length = number | string;
const sizes = tokens.extensions.skeleton;

const kjunListSkeletonProps = {
  rows: { type: Number, default: 8 },
  variant: { type: String as PropType<"market" | "compact" | "notification">, default: "market" },
  avatar: { type: Boolean, default: true },
  avatarSize: { type: [Number, String] as PropType<Length>, default: sizes.listAvatarSize },
  quote: { type: Boolean, default: true },
} as const;
export type KjunListSkeletonProps = ExtractPublicPropTypes<typeof kjunListSkeletonProps>;
export const KjunListSkeleton = defineComponent({
  name: "KjunListSkeleton",
  props: kjunListSkeletonProps,
  setup(props) {
    return () => (
      <div aria-hidden="true">
        {Array.from({ length: props.rows }, (_, i) => (
          <div key={i} class="kjun-list-skeleton-row" data-variant={props.variant}>
            {props.avatar && <KjunSkeleton type="avatar" width={props.avatarSize} height={props.avatarSize} />}
            <div class="kjun-list-skeleton-label">
              <KjunSkeleton type="block" height={sizes.lineHeights.md} width={i % 2 ? "80%" : "65%"} />
              <KjunSkeleton type="block" height={sizes.lineHeights.sm} width="50%" />
            </div>
            {props.quote && (
              <div class="kjun-list-skeleton-quote">
                <KjunSkeleton type="block" height={sizes.quoteHeight} width={sizes.quoteWidth} />
                <KjunSkeleton type="block" height={sizes.lineHeights.sm} width={sizes.detailWidth} />
              </div>
            )}
          </div>
        ))}
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
} as const;
export type KjunFormSkeletonProps = ExtractPublicPropTypes<typeof kjunFormSkeletonProps>;
export const KjunFormSkeleton = defineComponent({
  name: "KjunFormSkeleton",
  props: kjunFormSkeletonProps,
  setup(props) {
    return () => {
      const input = tokens.input[props.size];
      return (
        <div aria-hidden="true" class="kjun-form-skeleton" data-columns={props.columns}
          style={{ "--_kjun-form-skeleton-radius": `${input.radius}px` }}>
          {props.fields.map((field, i) => (
            <div key={i}>
              {field ? (
                <div class="kjun-form-skeleton-label">{typeof field === "string" ? field : field.label}</div>
              ) : (
                // The bar sits in a label-line slot so the field starts where the real input will.
                <div class="kjun-form-skeleton-label-slot">
                  <KjunSkeleton type="block" height={sizes.formLabelHeight} width={sizes.formLabelWidth} />
                </div>
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
} as const;
export type KjunChartSkeletonProps = ExtractPublicPropTypes<typeof kjunChartSkeletonProps>;
export const KjunChartSkeleton = defineComponent({
  name: "KjunChartSkeleton",
  props: kjunChartSkeletonProps,
  setup(props) {
    const m = useKjunMessages();
    const revealed = useLoadingReveal(() => true, () => props.loadingDelay);
    return () => {
      const kind = chartSkeletonKind(props.kind),
        shown = revealed(),
        status = shown && (props.loadingText ?? m.value.chartLoading) ? "status" : undefined,
        rowCount = chartSkeletonCount(props.rows),
        columnCount = chartSkeletonCount(props.columns);
      return (
        <div class="kjun-chart-skeleton" data-kjun-chart-kind={kind} data-skeleton={props.skeleton ? undefined : "false"}
          aria-hidden={shown ? undefined : "true"} style={css({ height: props.height, visibility: shown ? undefined : "hidden" })}>
          {!props.skeleton ? (
            <div class="kjun-data-loading" data-kjun-chart-part="loading" role={status}>
              {/* The spinner's own status would announce "로딩 중" on top of (or instead of) the chart's text. */}
              <span aria-hidden="true"><KjunSpinner size="md" /></span>
              {(props.loadingText ?? m.value.chartLoading) && <p>{(props.loadingText ?? m.value.chartLoading)}</p>}
            </div>
          ) : [
            kind === "donut" ? (
              <div key="donut" class="kjun-chart-skeleton-donut" data-kjun-chart-part="donut" aria-hidden="true" />
            ) : kind === "matrix" ? (
              <div key="matrix" class="kjun-chart-skeleton-matrix" data-kjun-chart-part="matrix" aria-hidden="true"
                style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))` }}>
                {Array.from({ length: rowCount * columnCount }, (_, i) => (
                  <div key={i} class="kjun-chart-skeleton-cell" data-kjun-chart-part="cell"
                    data-muted={chartMatrixMuted(Math.floor(i / columnCount), i % columnCount) ? "" : undefined} />
                ))}
              </div>
            ) : (
              <svg key="plot" viewBox={chartFrameViewBox} preserveAspectRatio="none" class="kjun-chart-skeleton-plot" data-kjun-chart-part="plot" aria-hidden="true">
                {/* Only the frame is honest before data arrives; any series shape would be invented. */}
                <path d={chartFramePath} fill="none" stroke="var(--_kjun-color-chart-grid)" stroke-width={tokens.border.defaultWidth} vector-effect="non-scaling-stroke" />
              </svg>
            ),
            (props.loadingText ?? m.value.chartLoading) && (
              <div key="status" class="kjun-chart-skeleton-status" data-kjun-chart-part="status" role={status}><span>{(props.loadingText ?? m.value.chartLoading)}</span></div>
            ),
          ]}
        </div>
      );
    };
  },
});
