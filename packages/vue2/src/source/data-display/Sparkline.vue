<template>
  <svg
    :width="stretch ? '100%' : width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    :preserveAspectRatio="stretch ? 'none' : 'xMidYMid meet'"
    class="ds-sparkline"
  >
    <defs v-if="fill && points.length > 1">
      <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="lineColor" stop-opacity="0.3" />
        <stop offset="100%" :stop-color="lineColor" stop-opacity="0.05" />
      </linearGradient>
    </defs>

    <!-- 영역 채우기 -->
    <polygon
      v-if="fill && points.length > 1"
      :points="areaPoints"
      :fill="`url(#${gradientId})`"
    />

    <!-- 선 (stretch 시 비율 왜곡이 선 굵기에 전이되지 않도록 non-scaling-stroke) -->
    <polyline
      v-if="points.length > 1"
      :points="linePoints"
      fill="none"
      :stroke="lineColor"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
      :vector-effect="stretch ? 'non-scaling-stroke' : undefined"
    />

    <!-- 단일 포인트: 점으로 표시 -->
    <circle
      v-if="points.length === 1"
      :cx="width / 2"
      :cy="height / 2"
      r="2"
      :fill="lineColor"
    />
  </svg>
</template>

<script>
import { tokens } from "@kjun-ui/tokens";
import { componentMixins } from "../../component-mixins.js";
import { domainColorMixin } from "../../domain-colors.js";
let sparklineUid = 0

export default {
  mixins: [...componentMixins, domainColorMixin(vm => !vm.color && vm.semantic === 'price' && vm.data.length > 1 && vm.data[0] !== vm.data[vm.data.length - 1])],
  name: 'DsSparkline',
  props: {
    data: {
      type: Array,
      default: () => []
    },
    width: {
      type: Number,
      default: tokens.extensions.financial.sparklineWidth
    },
    height: {
      type: Number,
      default: tokens.extensions.financial.sparklineHeight
    },
    color: {
      type: String,
      default: null
    },
    semantic: {
      type: String,
      default: 'price',
      validator: value => ['price', 'status'].includes(value)
    },
    fill: {
      type: Boolean,
      default: true
    },
    strokeWidth: {
      type: Number,
      default: 1.5
    },
    // 컨테이너 전폭으로 늘려 그리기 (viewBox 비율 무시)
    stretch: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      uid: ++sparklineUid
    }
  },
  computed: {
    gradientId() {
      return `sparkline-grad-${this.uid}`
    },
    lineColor() {
      if (this.color) return this.color
      if (this.data.length < 2) return 'var(--text-tertiary)'
      const change = this.data[this.data.length - 1] - this.data[0]
      if (change === 0) return 'var(--text-tertiary)'
      if (this.semantic === 'status') return change > 0 ? 'var(--success)' : 'var(--danger)'
      return change > 0 ? 'var(--price-up)' : 'var(--price-down)'
    },
    points() {
      if (!this.data || this.data.length === 0) return []

      const padding = 2
      const w = this.width - padding * 2
      const h = this.height - padding * 2
      const min = Math.min(...this.data)
      const max = Math.max(...this.data)
      const range = max - min || 1

      return this.data.map((val, i) => {
        const x = padding + (i / Math.max(this.data.length - 1, 1)) * w
        const y = padding + h - ((val - min) / range) * h
        return { x, y }
      })
    },
    linePoints() {
      return this.points.map(p => `${p.x},${p.y}`).join(' ')
    },
    areaPoints() {
      if (this.points.length < 2) return ''
      const padding = 2
      const bottom = this.height - padding
      const first = this.points[0]
      const last = this.points[this.points.length - 1]
      return `${first.x},${bottom} ${this.linePoints} ${last.x},${bottom}`
    }
  }
}
</script>

<style scoped>
.ds-sparkline {
  display: inline-block;
  vertical-align: middle;
}
</style>
