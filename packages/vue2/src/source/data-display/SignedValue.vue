<template>
  <span class="ds-signed-value" :class="valueClass" :aria-busy="String(loading)">
    <DsSkeleton v-if="loading" type="block" width="var(--extension-financial-signed-skeleton-width)" height="1lh" class="inline-block align-top" />
    <template v-else>{{ display }}<DsFreshness v-if="showFreshness && stale && number !== null" stale class="ml-financial-affix-gap" /></template>
  </span>
</template>
<script>
import DsFreshness from "./Freshness.vue";
import DsSkeleton from "./Skeleton.vue";
import { componentMixins } from "../../component-mixins.js";
import { domainColorMixin } from "../../domain-colors.js";
import { finiteSignedValue } from './signedValue'
import { getSignedNumberClass, getSignedPillClass } from '@kjun-adapter/formatters.js'
import { oneOf, SIGNED_VALUE_FORMATS, SIGNED_VALUE_TONES } from '../tokens'
const SIGNED_PILL_BASE = 'inline-block px-financial-pill-padding-x py-financial-pill-padding-y rounded-financial-pill-radius text-xs font-semibold'
export default {
  mixins: [...componentMixins, domainColorMixin(vm => !vm.loading && !vm.stale && vm.number !== null)],
  components: { DsFreshness, DsSkeleton },
  name: 'DsSignedValue',
  props: {
    value: { type: [Number, String], default: null },
    format: { type: String, default: 'number', validator: oneOf(SIGNED_VALUE_FORMATS) },
    isRaw: { type: Boolean, default: false },
    decimals: { type: Number, default: 2 },
    prefix: { type: String, default: '' },
    suffix: { type: String, default: '' },
    showSign: { type: Boolean, default: true },
    tone: { type: String, default: 'plain', validator: oneOf(SIGNED_VALUE_TONES) },
    loading: { type: Boolean, default: false },
    stale: { type: Boolean, default: false },
    // 같은 시세의 신선도를 부모가 이미 표시하면 배지만 생략하고 stale 색상은 유지한다.
    showFreshness: { type: Boolean, default: true },
    formatter: { type: Function, default: null },
  },
  computed: {
    number() { return finiteSignedValue(this.value) },
    valueClass() {
      if (this.loading || this.number === null) return 'text-text-secondary'
      if (this.stale) return (this.tone === 'pill' ? SIGNED_PILL_BASE + ' ' : '') + 'text-text-tertiary'
      return this.tone === 'pill' ? getSignedPillClass(this.number, { base: SIGNED_PILL_BASE }) : getSignedNumberClass(this.number)
    },
    display() {
      if (this.number === null) return '—'
      if (this.formatter) return this.formatter(this.number)
      const text = this.format === 'percent'
        ? this.$formatPercent(this.number, { decimals: this.decimals, isRaw: this.isRaw, showSign: this.showSign })
        : (this.showSign && this.number > 0 ? '+' : '') + this.$formatNumber(this.number, { decimals: this.decimals })
      return this.prefix + text + this.suffix
    },
  },
}
</script>
