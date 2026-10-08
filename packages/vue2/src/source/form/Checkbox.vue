<template>
  <label :class="wrapperClasses">
    <input
      type="checkbox"
      :checked="isChecked"
      :disabled="disabled"
      :value="val"
      class="sr-only"
      @change="handleChange"
    />
    <span :class="checkboxClasses">
      <DsIcon v-if="isChecked" name="check" :size="checkMarkSize" />
    </span>
    <span v-if="$slots.default || label" class="ds-choice-label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<script>
import DsIcon from "../../icon.js";
import { componentMixins } from "../../component-mixins.js";
import { SIZES_CORE, oneOf } from '../tokens'
import { tokens } from '@kjun-ui/tokens'

export default {
  mixins: componentMixins,
  components: { DsIcon },
  name: 'DsCheckbox',
  // DS 표준 v-model 계약: prop은 value, 이벤트는 input (change는 호환용으로 함께 emit)
  model: {
    prop: 'value',
    event: 'input'
  },
  props: {
    value: {
      type: [Boolean, Array],
      default: false
    },
    val: {
      type: [String, Number, Boolean, Object],
      default: null
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
    }
  },
  computed: {
    isChecked() {
      if (Array.isArray(this.value)) {
        return this.value.includes(this.val)
      }
      return this.value
    },
    wrapperClasses() {
      return ['ds-choice', { 'ds-choice--disabled': this.disabled }]
    },
    checkboxClasses() {
      return ['ds-choice-control ds-checkbox', `ds-checkbox--${this.size}`, { 'ds-checkbox--checked': this.isChecked }]
    },
    checkMarkSize() {
      return tokens.extensions.checkbox.iconSizes[this.size] + 'px'
    }
  },
  methods: {
    handleChange() {
      if (this.disabled) return

      let next
      if (Array.isArray(this.value)) {
        next = [...this.value]
        const idx = next.indexOf(this.val)
        if (idx > -1) {
          next.splice(idx, 1)
        } else {
          next.push(this.val)
        }
      } else {
        next = !this.value
      }
      this.$emit('input', next)
      this.$emit('change', next)
    }
  }
}
</script>
