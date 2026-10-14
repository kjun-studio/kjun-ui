<template>
  <span v-if="value === null || value === undefined" class="kj-text-text-disabled">-</span>

  <!-- badge variant: 신호 임계 초과 시 배지 + 경고 아이콘, 그 외 색상 텍스트 -->
  <span v-else-if="variant === 'badge'" class="kjun-deviation-badge">
    <!-- Every value shares the badge box and the icon slot so a column keeps its digits aligned, like React and Native. -->
    <KjunBadge :variant="isNeutral ? 'secondary' : value > 0 ? 'price-up' : 'price-down'" size="sm" :style="isSignal ? undefined : { background: 'transparent' }">{{ formatted }}</KjunBadge>
    <span v-if="!isSignal" class="kjun-deviation-signal-slot" aria-hidden="true"></span>
    <!-- Like React and Native: a 24px keyboard-reachable target around the 12px signal icon. -->
    <KjunTooltip v-if="isSignal" :content="signalTooltip">
      <span tabindex="0" role="img" aria-label="차익거래 기회" class="kjun-deviation-signal">
        <KjunIcon name="alert-triangle" size="var(--_kjun-extension-financial-warning-icon-size)" aria-hidden="true" />
      </span>
    </KjunTooltip>
  </span>

  <!-- text variant: 보조 괴리율 등 위계를 낮춰야 할 때 — pill 없이 색상 텍스트만 -->
  <span v-else-if="variant === 'text'" class="kjun-deviation kjun-type-control" :class="textColorClass">{{ formatted }}</span>

  <!-- pill variant(기본): 절대 괴리율 강도 4단계 농도 -->
  <span v-else class="kjun-deviation-pill kjun-deviation" :class="pillClass">{{ formatted }}</span>
</template>

<script>
import KjunBadge from "../primitives/Badge.vue";
import KjunIcon from "../../icon.js";
import KjunTooltip from "./Tooltip.vue";
import { componentMixins } from "../../component-mixins.js";
import { domainColorMixin } from "../../domain-colors.js";
import { DEVIATION_THRESHOLDS } from './deviation.js'

export default {
  mixins: [...componentMixins, domainColorMixin(vm => vm.value != null && !vm.isNeutral)],
  components: { KjunBadge, KjunIcon, KjunTooltip },
  name: 'KjunDeviation',
  props: {
    value: { type: Number, default: null },
    variant: {
      type: String,
      default: 'pill',
      validator: (v) => ['pill', 'badge', 'text'].includes(v),
    },
    // 차익거래 신호로 강조하는 괴리율 임계값(%) — badge 강조/아이콘 기준
    signalThreshold: { type: Number, default: DEVIATION_THRESHOLDS.high },
    decimals: { type: Number, default: 2 },
  },
  computed: {
    isNeutral() { return Math.abs(this.value) < DEVIATION_THRESHOLDS.negligible },
    formatted() {
      return this.kjunFormatPercent(this.value, { isRaw: true, showSign: true, decimals: this.decimals })
    },
    isSignal() {
      if (this.value === null || this.value === undefined) return false
      return Math.abs(this.value) >= this.signalThreshold
    },
    signalTooltip() {
      return `괴리율 ${this.signalThreshold}% 초과 — 차익거래 기회 가능`
    },
    textColorClass() {
      if (this.isNeutral) return 'kj-text-text-secondary'
      return this.value > 0 ? 'kj-text-price-up' : 'kj-text-price-down'
    },
    pillClass() {
      const abs = Math.abs(this.value)
      if (abs < DEVIATION_THRESHOLDS.negligible) return 'kjun-deviation-pill--neutral'
      const dir = this.value > 0 ? 'up' : 'down'
      if (abs < DEVIATION_THRESHOLDS.low) return `kjun-deviation-pill--${dir}-soft`
      if (abs < DEVIATION_THRESHOLDS.high) return `kjun-deviation-pill--${dir}-mid`
      return `kjun-deviation-pill--${dir}-strong`
    },
  },
}
</script>

<style scoped>
.kjun-deviation-badge {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--_kjun-extension-financial-badge-gap);
}
.kjun-deviation-pill {
  display: inline-flex;
  align-items: center;
  padding: var(--_kjun-extension-financial-pill-padding-y) var(--_kjun-extension-financial-pill-padding-x);
  border-radius: var(--_kjun-extension-financial-cell-radius);
  font-size: var(--_kjun-type-control-size);
  line-height: var(--_kjun-type-control-line);
  font-weight: var(--_kjun-type-control-weight);
  letter-spacing: var(--_kjun-type-control-tracking);
}
.kjun-deviation-pill--neutral     { background: var(--_kjun-bg-secondary); color: var(--_kjun-text-secondary); }
.kjun-deviation-pill--up-soft     { background: color-mix(in srgb, var(--_kjun-price-up)   8%, transparent); color: var(--_kjun-price-up); }
.kjun-deviation-pill--up-mid      { background: color-mix(in srgb, var(--_kjun-price-up)  14%, transparent); color: var(--_kjun-price-up); }
.kjun-deviation-pill--up-strong   { background: color-mix(in srgb, var(--_kjun-price-up)  22%, transparent); color: var(--_kjun-price-up); font-weight: var(--_kjun-type-number-lg-weight); }
.kjun-deviation-pill--down-soft   { background: color-mix(in srgb, var(--_kjun-price-down) 8%, transparent); color: var(--_kjun-price-down); }
.kjun-deviation-pill--down-mid    { background: color-mix(in srgb, var(--_kjun-price-down) 14%, transparent); color: var(--_kjun-price-down); }
.kjun-deviation-pill--down-strong { background: color-mix(in srgb, var(--_kjun-price-down) 22%, transparent); color: var(--_kjun-price-down); font-weight: var(--_kjun-type-number-lg-weight); }
</style>
