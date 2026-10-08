<template>
  <div>
    <!-- Shared .kjun-progress-label gives the caption type and 8px gap React and Native use. -->
    <div v-if="showLabel" class="kjun-progress-label">
      <span v-if="label">{{ label }}</span>
      <span class="tabular-nums">{{ percentage }}%</span>
    </div>
    <div
      :class="trackClasses"
      role="progressbar"
      :aria-valuenow="percentage"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="label || undefined"
    >
      <div :class="barClasses" :style="{ width: `${percentage}%`, transition: 'width var(--motion-progress) var(--ease-out)' }"></div>
    </div>
    <div v-if="$slots.sublabel" class="kjun-progress-sub">
      <slot name="sublabel"></slot>
    </div>
  </div>
</template>

<script>
import { componentMixins } from "../../component-mixins.js";
import { SIZES_CORE, SEMANTIC_VARIANTS, oneOf } from '../tokens'

export default {
  mixins: componentMixins,
  name: 'DsProgress',
  props: {
    value: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 100
    },
    size: {
      type: String,
      default: 'md',
      validator: oneOf(SIZES_CORE)
    },
    variant: {
      type: String,
      default: 'primary',
      validator: oneOf(['primary', ...SEMANTIC_VARIANTS])
    },
    showLabel: {
      type: Boolean,
      default: false
    },
    label: {
      type: String,
      default: ''
    }
  },
  computed: {
    percentage() {
      return Math.round(Math.min(100, Math.max(0, (this.value / this.max) * 100)))
    },
    trackClasses() {
      const sizes = {
        sm: 'h-progress-heights-sm',
        md: 'h-progress-heights-md',
        lg: 'h-progress-heights-lg'
      }
      return ['w-full bg-bg-secondary rounded-full overflow-hidden', sizes[this.size]].join(' ')
    },
    barClasses() {
      const variants = {
        primary: 'bg-brand',
        success: 'bg-success',
        warning: 'bg-warning',
        danger: 'bg-danger',
        info: 'bg-info'
      }
      return ['h-full rounded-full', variants[this.variant]].join(' ')
    }
  }
}
</script>
