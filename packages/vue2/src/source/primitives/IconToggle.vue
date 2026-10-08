<template>
  <!-- inline-flex keeps the wrapper free of a line box so rows and toolbars keep the toggle's own height. -->
  <DsTooltip :content="disabled || loading ? '' : hint" :placement="tooltipPlacement" :delay="tooltipDelay"
    :style="{ display: 'inline-flex', verticalAlign: 'middle' }">
  <button
    type="button"
    v-bind="$attrs"
    :class="buttonClasses"
    :data-size="size"
    :style="navigationStyle"
    :aria-label="ariaLabel"
    :aria-busy="String(loading)"
    :aria-pressed="String(active)"
    :disabled="disabled || loading"
    @click.stop="$emit('toggle')"
  >
    <DsIcon v-if="loading && kjunTopNavigation" name="loader-2" spin :size="iconSize" />
    <DsSpinner v-else-if="loading" size="sm" />
    <DsIcon
      v-else
      :name="active ? activeIcon : (inactiveIcon || activeIcon)"
      :filled="active"
      :size="iconSize"
      :class="iconClass"
    />
  </button>
  </DsTooltip>
</template>

<script>
import { componentMixins } from "../../component-mixins.js";
import DsIcon from '../../icon.js'
import DsSpinner from '../feedback/Spinner.vue'
import DsTooltip from '../data-display/Tooltip.vue'
import { CONTROL_ICON_SIZES, SIZES_EXTENDED, oneOf } from '../tokens'

export default {
  mixins: componentMixins,
  name: 'DsIconToggle',
  components: { DsIcon, DsSpinner, DsTooltip },
  inheritAttrs: false,
  inject: { kjunTopNavigation: { default: null } },
  props: {
    active: { type: Boolean, default: false },
    activeIcon: { type: String, required: true },
    inactiveIcon: { type: String, default: null },
    activeColorClass: { type: String, default: 'text-brand' },
    inactiveColorClass: { type: String, default: 'text-text-tertiary' },
    size: {
      type: String,
      default: 'md',
      validator: oneOf(SIZES_EXTENDED),
    },
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    ariaLabel: { type: String, required: true },
    // Defaults to ariaLabel, like RefreshButton; an empty string disables the hint.
    tooltip: { type: String, default: null },
    tooltipPlacement: { type: String, default: 'top', validator: oneOf(['top', 'bottom', 'left', 'right']) },
    tooltipDelay: { type: Number, default: 0 },
  },
  computed: {
    hint() { return this.tooltip !== null ? this.tooltip : this.ariaLabel },
    iconSize() { return String(this.kjunTopNavigation ? this.kjunTopNavigation.iconSize : CONTROL_ICON_SIZES[this.size]) },
    navigationStyle() {
      return this.kjunTopNavigation ? { width: this.kjunTopNavigation.controlSize + 'px', height: this.kjunTopNavigation.controlSize + 'px' } : undefined
    },
    buttonClasses() {
      // Loading blocks presses but stays legible; only disabled dims.
      return ['kjun-icon-toggle', 'ds-icon-toggle', this.disabled ? 'opacity-disabled cursor-not-allowed' : ''].filter(Boolean).join(' ')
    },
    iconClass() {
      return this.active ? this.activeColorClass : this.inactiveColorClass
    },
  },
}
</script>

<style scoped>
.ds-icon-toggle .ds-icon {
  transition: color var(--motion-control) var(--ease-out), transform var(--motion-control) var(--ease-out);
}

.ds-icon-toggle:not(:disabled):hover .ds-icon {
  transform: scale(1.12);
}

.ds-icon-toggle:not(:disabled):active .ds-icon {
  transform: scale(0.94);
}

</style>
