<template>
  <span class="ds-animated-number"
    ><span v-if="prefix" class="ds-animated-number__affix">{{ prefix }}</span
    ><span class="ds-animated-number__num">{{ display }}</span
    ><span v-if="suffix" class="ds-animated-number__affix">{{ suffix }}</span
  ></span>
</template>

<script>
import { componentMixins } from "../../component-mixins.js";
import { createNumberMotion } from "../../../../../shared/package-runtime/number-motion.ts";
export default {
  mixins: componentMixins,
  name: 'AnimatedNumber',
  props: {
    value: { type: [Number, String], required: true },
    decimals: { type: Number, default: 0 },
    prefix: { type: String, default: '' },
    suffix: { type: String, default: '' },
    animated: { type: Boolean, default: true },
    fromPrevious: { type: Boolean, default: false },
    formatter: { type: Function, default: null },
  },
  data() { return { raw: this.value }; },
  computed: {
    display() {
      return typeof this.raw === 'string' ? this.raw : this.formatter
        ? this.formatter(this.raw) : this.$formatNumber(this.raw, { decimals: this.decimals });
    },
  },
  watch: { value: 'updateMotion', animated: 'updateMotion', fromPrevious: 'updateMotion' },
  mounted() {
    this._media = window.matchMedia('(prefers-reduced-motion: reduce)');
    this._motion = createNumberMotion(value => { this.raw = value; });
    this._media.addEventListener('change', this.updateMotion);
    this.updateMotion();
  },
  beforeDestroy() {
    this._motion?.cancel();
    this._media?.removeEventListener('change', this.updateMotion);
  },
  methods: {
    updateMotion() { this._motion?.update(this.value, this.animated, this.fromPrevious, this._media.matches); },
  },
}
</script>

<style scoped>
.ds-animated-number { font-variant-numeric: tabular-nums; font-family: var(--font-numeric); }
.ds-animated-number__affix:first-child { margin-right: var(--_kjun-geometry-dimension-value4); }
.ds-animated-number__affix:last-child { margin-left: var(--_kjun-geometry-dimension-value4); }
</style>
