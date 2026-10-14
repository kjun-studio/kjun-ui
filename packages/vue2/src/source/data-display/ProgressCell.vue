<template>
  <div class="kjun-progress-cell">
    <div class="kjun-progress-cell-bar" :style="{ height: `${height}px` }">
      <div
        class="kjun-progress-cell-fill"
        :style="{ width: `${percent}%`, backgroundColor: barColor }"
      ></div>
    </div>
    <span v-if="showLabel" class="kjun-progress-cell-label">
      {{ Math.round(percent) }}%
    </span>
  </div>
</template>

<script>
import { tokens } from "@kjun-ui/tokens";
import { componentMixins } from "../../component-mixins.js";
const AUTO_THRESHOLDS = {
  LOW: 30,
  MID: 70
}

export default {
  mixins: componentMixins,
  name: 'KjunProgressCell',
  props: {
    value: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 100
    },
    showLabel: {
      type: Boolean,
      default: true
    },
    color: {
      type: String,
      default: 'auto',
      validator: v => ['auto', 'brand', 'success', 'danger', 'warning', 'custom'].includes(v)
    },
    // color="custom"일 때 사용할 실제 색상 값 (코인 accent 등 토큰 외 색상 주입용)
    customColor: {
      type: String,
      default: ''
    },
    height: {
      type: Number,
      default: tokens.extensions.financial.progressHeight
    }
  },
  computed: {
    percent() {
      if (this.max <= 0) return 0
      return Math.min(Math.max((this.value / this.max) * 100, 0), 100)
    },
    barColor() {
      if (this.color === 'custom' && this.customColor) {
        return this.customColor
      }
      if (this.color !== 'auto') {
        const colorMap = {
          brand: 'var(--_kjun-brand)',
          success: 'var(--_kjun-success)',
          danger: 'var(--_kjun-danger)',
          warning: 'var(--_kjun-warning)'
        }
        return colorMap[this.color]
      }
      if (this.percent < AUTO_THRESHOLDS.LOW) return 'var(--_kjun-danger)'
      if (this.percent < AUTO_THRESHOLDS.MID) return 'var(--_kjun-warning)'
      return 'var(--_kjun-success)'
    }
  }
}
</script>

<style scoped>
.kjun-progress-cell {
  display: flex;
  align-items: center;
  gap: var(--_kjun-extension-financial-progress-gap);
  min-width: var(--_kjun-extension-financial-progress-minimum-width);
}

.kjun-progress-cell-bar {
  flex: 1;
  background: var(--_kjun-bg-tertiary);
  border-radius: var(--_kjun-extension-financial-progress-radius);
  overflow: hidden;
}

.kjun-progress-cell-fill {
  height: 100%;
  border-radius: var(--_kjun-extension-financial-progress-radius);
  transition: width var(--_kjun-motion-progress) var(--_kjun-ease-out);
}

.kjun-progress-cell-label {
  font-size: var(--_kjun-type-caption-size);
  color: var(--_kjun-text-secondary);
  min-width: var(--_kjun-extension-financial-progress-label-width);
  text-align: right;
  font-variant-numeric: tabular-nums;
  line-height: var(--_kjun-type-caption-line);
  font-weight: var(--_kjun-type-caption-weight);
  letter-spacing: var(--_kjun-type-caption-tracking);
}
</style>
