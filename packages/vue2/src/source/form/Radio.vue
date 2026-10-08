<template>
  <label :class="wrapperClasses">
    <input
      type="radio"
      :checked="isChecked"
      :disabled="effectiveDisabled"
      :name="name || (radioGroup ? `ds-radio-group-${radioGroup._uid}` : undefined)"
      :value="val"
      class="sr-only"
      @change="handleChange"
    />
    <span :class="radioClasses">
      <span v-if="isChecked" :class="dotClasses"></span>
    </span>
    <span v-if="$slots.default || label" class="ds-choice-label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<script>
import { componentMixins } from "../../component-mixins.js";
export default {
  mixins: componentMixins,
  name: 'DsRadio',
  inject: {
    radioGroup: {
      default: null
    }
  },
  // DS 표준 v-model 계약: value = 선택된 값(v-model), val = 이 라디오 자신의 값.
  // DsRadioGroup 안에서는 그룹의 value를 따르므로 개별 v-model은 생략한다.
  model: {
    prop: 'value',
    event: 'input'
  },
  props: {
    value: {
      type: [String, Number, Boolean],
      default: null
    },
    val: {
      type: [String, Number, Boolean],
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
    name: {
      type: String,
      default: ''
    }
  },
  computed: {
    effectiveDisabled() { return this.disabled || !!this.radioGroup?.disabled },
    isChecked() {
      if (this.radioGroup) {
        return this.radioGroup.value === this.val
      }
      return this.value === this.val
    },
    wrapperClasses() {
      return ['ds-choice', { 'ds-choice--disabled': this.effectiveDisabled }]
    },
    radioClasses() {
      return ['ds-choice-control ds-radio', { 'ds-radio--checked': this.isChecked }]
    },
    dotClasses() {
      return 'ds-radio-dot'
    }
  },
  methods: {
    handleChange() {
      if (this.effectiveDisabled) return

      if (this.radioGroup) {
        this.radioGroup.change(this.val)
      } else {
        this.$emit('input', this.val)
        this.$emit('change', this.val)
      }
    }
  }
}
</script>
