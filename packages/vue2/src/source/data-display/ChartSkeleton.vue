<template>
  <div class="kjun-chart-skeleton" :style="{ height: cssHeight }" aria-hidden="true">
    <div class="kjun-chart-skeleton-status">
      <span v-if="loadingText">{{ loadingText }}</span>
    </div>
    <div v-if="kind === 'donut'" class="kjun-chart-skeleton__donut"><KjunSkeleton type="block" width="var(--_kjun-extension-chart-skeleton-donut-label-width)" height="var(--_kjun-extension-chart-skeleton-donut-label-height)" /></div>
    <svg v-else viewBox="0 0 600 240" preserveAspectRatio="none" class="kjun-chart-skeleton__plot">
      <path d="M20 10V220H590 M20 65H590 M20 120H590 M20 175H590" class="kjun-chart-skeleton__grid" />
      <!-- A line kind previews its series; grid keeps only the axes. -->
      <path v-if="kind === 'line'" d="M20 190 L100 160 L180 172 L260 120 L340 140 L420 96 L500 110 L590 64" class="kjun-chart-skeleton__line" />
      <template v-if="kind === 'matrix'"><g v-for="row in 8" :key="row"><rect v-for="col in 14" :key="col" :x="24 + (col - 1) * 40" :y="12 + (row - 1) * 26" width="36" height="22" rx="2" class="kjun-chart-skeleton__bar" :opacity="(row + col) % 3 === 0 ? 0.55 : 1" /></g></template>
      <template v-else-if="kind === 'bar' || kind === 'candle'">
        <g v-for="(height, index) in barHeights" :key="index">
          <path v-if="kind === 'candle'" :d="`M${55 + index * 75} ${195 - height}V${225 - height / 2}`" class="kjun-chart-skeleton__wick" />
          <rect :x="35 + index * 75" :y="kind === 'candle' ? 210 - height : 220 - height" :width="kind === 'candle' ? 28 : 42" :height="kind === 'candle' ? height / 2 : height" rx="3" class="kjun-chart-skeleton__bar" />
        </g>
      </template>
    </svg>
  </div>
</template>

<script>
import { tokens } from "@kjun-ui/tokens";
import KjunSkeleton from "./Skeleton.vue";
import { componentMixins } from "../../component-mixins.js";
const BAR_HEIGHTS = [60, 100, 85, 140, 110, 165, 180]
export default {
  mixins: componentMixins,
  components: { KjunSkeleton },
  name: 'KjunChartSkeleton',
  props: {
    loadingText: { type:String, default:"차트를 불러오는 중" },
    kind: { type: String, default: 'line', validator: value => ['grid', 'line', 'bar', 'donut', 'candle', 'matrix'].includes(value) },
    height: { type: [String, Number], default: () => tokens.extensions.chartSkeleton.height + 'px' },
  },
  computed: {
    cssHeight() { return typeof this.height === 'number' ? `${this.height}px` : this.height },
    barHeights() { return BAR_HEIGHTS },
  },
}
</script>

<style scoped>
.kjun-chart-skeleton { position:relative; display: flex; align-items: center; justify-content: center; width: 100%; min-width: 0; animation: kjun-chart-pulse var(--_kjun-motion-shimmer) ease-in-out infinite; }
.kjun-chart-skeleton__plot { width: 100%; height: 100%; }
.kjun-chart-skeleton__grid { fill: none; stroke: var(--_kjun-border); stroke-width: 1; }
.kjun-chart-skeleton__wick { fill: none; stroke: var(--_kjun-skeleton); stroke-width: 4; }
.kjun-chart-skeleton__line { fill: none; stroke: var(--_kjun-skeleton); stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
.kjun-chart-skeleton__bar { fill: var(--_kjun-skeleton); }
.kjun-chart-skeleton__donut { height: 80%; aspect-ratio: 1; border: var(--_kjun-extension-chart-skeleton-donut-thickness) solid var(--_kjun-skeleton); border-radius: 50%; display: flex; justify-content: center; align-items: center; }
@keyframes kjun-chart-pulse { 50% { opacity: 0.55; } }
@media (prefers-reduced-motion: reduce) { .kjun-chart-skeleton { animation: none; } }
</style>
