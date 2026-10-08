<template>
  <DsTooltip :content="disabled || loading ? '' : tooltipContent" :placement="tooltipPlacement" :delay="tooltipDelay"
    :style="{ width: block ? '100%' : undefined }">
  <DsButton
    v-bind="buttonAttrs" :size="size" :variant="variant" prefix-icon="refresh" :block="block"
    :spin-on-loading="!reducedMotion && spinOnLoading"
    :loading="loading" :disabled="disabled" :aria-label="label"
    @click="$emit('refresh')"
  ><template v-if="mode === 'text'">{{ text }}</template></DsButton>
  </DsTooltip>
</template>
<script>
import DsButton from "./Button.vue";
import DsTooltip from "../data-display/Tooltip.vue";
import { componentMixins } from "../../component-mixins.js";
import { SIZES_EXTENDED, oneOf, ACTION_LABEL_MODES, REFRESH_VARIANTS } from '../tokens'
export default {
  mixins: componentMixins,
  components: { DsButton, DsTooltip },
  name: 'DsRefreshButton',
  inheritAttrs: false,
  props: {
    targetName: { type: String, default: '' },
    mode: { type: String, default: 'icon', validator: oneOf(ACTION_LABEL_MODES) },
    text: { type: String, default: '새로고침' },
    loading: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    block: { type: Boolean, default: false },
    size: { type: String, default: 'sm', validator: oneOf(SIZES_EXTENDED) },
    variant: { type: String, default: 'ghost', validator: oneOf(REFRESH_VARIANTS) },
    spinOnLoading: { type: Boolean, default: true },
    ariaLabel: { type: String, default: '' },
    tooltip: { type: String, default: null },
    tooltipPlacement: { type: String, default: 'top', validator: oneOf(['top', 'bottom', 'left', 'right']) },
    tooltipDelay: { type: Number, default: 0 },
  },
  data() { return { reducedMotion: true } },
  mounted() {
    this._motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)')
    this._motionChanged = () => { this.reducedMotion = this._motionMedia.matches }
    this._motionChanged()
    this._motionMedia.addEventListener('change', this._motionChanged)
  },
  beforeDestroy() { this._motionMedia?.removeEventListener('change', this._motionChanged) },
  computed: {
    label() { return this.ariaLabel || this.$attrs['aria-label'] || this.$attrs.title || [this.targetName, '새로고침'].filter(Boolean).join(' ') },
    buttonAttrs() { const { title, ...attrs } = this.$attrs; return attrs },
    tooltipContent() { return this.tooltip !== null ? this.tooltip : this.$attrs.title || (this.mode === 'icon' ? this.label : '') },
  },
}
</script>
