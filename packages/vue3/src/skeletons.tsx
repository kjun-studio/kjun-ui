import { defineComponent, type ExtractPublicPropTypes, type PropType } from "vue";
import { tokens, type InputSize } from "@kjun-ui/tokens";
import { KjunSkeleton } from "./display";
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
  loadingText: { type: String, default: "차트를 불러오는 중" },
  kind: { type: String as PropType<"grid" | "line" | "bar" | "donut" | "candle" | "matrix">, default: "line" },
  height: { type: [Number, String] as PropType<Length>, default: chart.height },
} as const;
export type KjunChartSkeletonProps = ExtractPublicPropTypes<typeof kjunChartSkeletonProps>;
export const KjunChartSkeleton = defineComponent({
  name: "KjunChartSkeleton",
  props: kjunChartSkeletonProps,
  setup(props) {
    const fill = "var(--_kjun-color-skeleton)";
    return () => {
      const { kind } = props;
      return (
        <div class="kjun-chart-skeleton" style={css({ height: props.height })} aria-hidden="true">
          <div class="kjun-chart-skeleton-status">{props.loadingText && <span>{props.loadingText}</span>}</div>
          {kind === "donut" ? (
            <div class="kjun-chart-skeleton-donut">
              <KjunSkeleton type="block" width={chart.donutLabelWidth} height={chart.donutLabelHeight} />
            </div>
          ) : (
            <svg viewBox="0 0 600 240" preserveAspectRatio="none" class="kjun-chart-skeleton-plot">
              <path d="M20 10V220H590 M20 65H590 M20 120H590 M20 175H590" fill="none" stroke="var(--_kjun-color-border)" stroke-width={1} />
              {/* A line kind previews its series; grid keeps only the axes. */}
              {kind === "line" && (
                <path d="M20 190 L100 160 L180 172 L260 120 L340 140 L420 96 L500 110 L590 64" fill="none" stroke={fill}
                  stroke-width={4} stroke-linecap="round" stroke-linejoin="round" />
              )}
              {kind === "matrix"
                ? Array.from({ length: 8 }, (_, row) => (
                    <g key={row}>
                      {Array.from({ length: 14 }, (_, col) => (
                        <rect key={col} x={24 + col * 40} y={12 + row * 26} width={36} height={22} rx={2} fill={fill}
                          opacity={(row + col + 2) % 3 === 0 ? 0.55 : 1} />
                      ))}
                    </g>
                  ))
                : (kind === "bar" || kind === "candle") && [60, 100, 85, 140, 110, 165, 180].map((h, i) => [
                    // The wick extends 15 past each end of the body and stays above the axis.
                    kind === "candle" && <path key={"wick" + i} d={`M${55 + i * 75} ${195 - h}V${225 - h / 2}`} fill="none" stroke={fill} stroke-width={4} />,
                    // Bars stand on the axis (y 220); candle bodies float within their wick.
                    <rect key={"body" + i} x={35 + i * 75} y={kind === "candle" ? 210 - h : 220 - h} width={kind === "candle" ? 28 : 42}
                      height={kind === "candle" ? h / 2 : h} rx={3} fill={fill} />,
                  ])}
            </svg>
          )}
        </div>
      );
    };
  },
});
