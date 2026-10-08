<template>
  <span v-if="value === null || value === undefined" class="text-text-disabled">-</span>

  <!-- badge variant: 신호 임계 초과 시 배지 + 경고 아이콘, 그 외 색상 텍스트 -->
  <span v-else-if="variant === 'badge'" class="ds-deviation-badge">
    <!-- Every value shares the badge box and the icon slot so a column keeps its digits aligned, like React and Native. -->
    <DsBadge :variant="isNeutral ? 'secondary' : value > 0 ? 'price-up' : 'price-down'" size="sm" :style="isSignal ? undefined : { background: 'transparent' }">{{ formatted }}</DsBadge>
    <span v-if="!isSignal" class="kjun-deviation-signal-slot" aria-hidden="true"></span>
    <!-- Like React and Native: a 24px keyboard-reachable target around the 12px signal icon. -->
    <DsTooltip v-if="isSignal" :content="signalTooltip">
      <span tabindex="0" role="img" aria-label="차익거래 기회" class="kjun-deviation-signal">
        <DsIcon name="alert-triangle" size="var(--extension-financial-warning-icon-size)" aria-hidden="true" />
      </span>
    </DsTooltip>
  </span>

  <!-- text variant: 보조 괴리율 등 위계를 낮춰야 할 때 — pill 없이 색상 텍스트만 -->
  <span v-else-if="variant === 'text'" class="ds-deviation kjun-type-control" :class="textColorClass">{{ formatted }}</span>

  <!-- pill variant(기본): 절대 괴리율 강도 4단계 농도 -->
  <span v-else class="ds-deviation-pill ds-deviation" :class="pillClass">{{ formatted }}</span>
</template>

<script>
import DsBadge from "../primitives/Badge.vue";
import DsIcon from "../../icon.js";
import DsTooltip from "./Tooltip.vue";
import { componentMixins } from "../../component-mixins.js";
import { domainColorMixin } from "../../domain-colors.js";
import { DEVIATION_THRESHOLDS } from './deviation.js'

export default {
  mixins: [...componentMixins, domainColorMixin(vm => vm.value != null && !vm.isNeutral)],
  components: { DsBadge, DsIcon, DsTooltip },
  name: 'DsDeviation',
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
      return this.$formatPercent(this.value, { isRaw: true, showSign: true, decimals: this.decimals })
    },
    isSignal() {
      if (this.value === null || this.value === undefined) return false
      return Math.abs(this.value) >= this.signalThreshold
    },
    signalTooltip() {
      return `괴리율 ${this.signalThreshold}% 초과 — 차익거래 기회 가능`
    },
    textColorClass() {
      if (this.isNeutral) return 'text-text-secondary'
      return this.value > 0 ? 'text-price-up' : 'text-price-down'
    },
    pillClass() {
      const abs = Math.abs(this.value)
      if (abs < DEVIATION_THRESHOLDS.negligible) return 'ds-deviation-pill--neutral'
      const dir = this.value > 0 ? 'up' : 'down'
      if (abs < DEVIATION_THRESHOLDS.low) return `ds-deviation-pill--${dir}-soft`
      if (abs < DEVIATION_THRESHOLDS.high) return `ds-deviation-pill--${dir}-mid`
      return `ds-deviation-pill--${dir}-strong`
    },
  },
}
</script>

<style scoped>
.ds-deviation-badge {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--extension-financial-badge-gap);
}
.ds-deviation-pill {
  display: inline-flex;
  align-items: center;
  padding: var(--extension-financial-pill-padding-y) var(--extension-financial-pill-padding-x);
  border-radius: var(--extension-financial-cell-radius);
  font-size: var(--_kjun-type-control-size);
  line-height: var(--_kjun-type-control-line);
  font-weight: var(--_kjun-type-control-weight);
  letter-spacing: var(--_kjun-type-control-tracking);
}
.ds-deviation-pill--neutral     { background: var(--bg-secondary); color: var(--text-secondary); }
.ds-deviation-pill--up-soft     { background: color-mix(in srgb, var(--price-up)   8%, transparent); color: var(--price-up); }
.ds-deviation-pill--up-mid      { background: color-mix(in srgb, var(--price-up)  14%, transparent); color: var(--price-up); }
.ds-deviation-pill--up-strong   { background: color-mix(in srgb, var(--price-up)  22%, transparent); color: var(--price-up); font-weight: var(--_kjun-type-number-lg-weight); }
.ds-deviation-pill--down-soft   { background: color-mix(in srgb, var(--price-down) 8%, transparent); color: var(--price-down); }
.ds-deviation-pill--down-mid    { background: color-mix(in srgb, var(--price-down) 14%, transparent); color: var(--price-down); }
.ds-deviation-pill--down-strong { background: color-mix(in srgb, var(--price-down) 22%, transparent); color: var(--price-down); font-weight: var(--_kjun-type-number-lg-weight); }
</style>
