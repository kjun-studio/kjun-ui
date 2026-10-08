<template>
  <label :class="wrapperClasses">
    <!-- aria-checked에 String(): Vue 2는 false인 속성 바인딩을 DOM에서 제거해,
         role=switch에 aria-checked가 아예 없는 상태(ARIA 위반)가 된다 -->
    <button
      type="button"
      role="switch"
      :aria-checked="String(value)"
      :disabled="disabled"
      :class="switchClasses"
      :aria-label="ariaLabel || label || undefined"
      @click.stop="toggle"
    >
      <span :class="dotClasses"></span>
    </button>
    <span v-if="$slots.default || label" class="ds-choice-label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<script>
import { componentMixins } from "../../component-mixins.js";
import { SIZES_CORE, oneOf } from '../tokens'

export default {
  mixins: componentMixins,
  name: 'DsSwitch',
  props: {
    value: {
      type: Boolean,
      default: false
    },
    label: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      default: 'md',
      validator: oneOf(SIZES_CORE)
    },
    ariaLabel: {
      type: String,
      default: null
    }
  },
  computed: {
    wrapperClasses() {
      return ['ds-choice', { 'ds-choice--disabled': this.disabled }]
    },
    switchClasses() {
      return ['ds-switch', `ds-switch--${this.size}`, { 'ds-switch--on': this.value }]
    },
    dotClasses() {
      return 'ds-switch-thumb'
    }
  },
  methods: {
    toggle() {
      if (this.disabled) return
      this.$emit('input', !this.value)
      this.$emit('change', !this.value)
    }
  }
}
</script>
