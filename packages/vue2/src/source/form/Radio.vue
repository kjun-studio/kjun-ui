<template>
  <label :class="wrapperClasses">
    <input
      type="radio"
      :checked="isChecked"
      :disabled="effectiveDisabled"
      :name="name || (kjunRadioGroup ? `kjun-radio-group-${kjunRadioGroup._uid}` : undefined)"
      :value="val"
      class="kj-sr-only"
      @change="handleChange"
    />
    <span :class="radioClasses">
      <span v-if="isChecked" :class="dotClasses"></span>
    </span>
    <span v-if="$slots.default || label" class="kjun-choice-label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<script>
import { componentMixins } from "../../component-mixins.js";
export default {
  mixins: componentMixins,
  name: 'KjunRadio',
  inject: {
    kjunRadioGroup: {
      default: null
    }
  },
  // DS 표준 v-model 계약: value = 선택된 값(v-model), val = 이 라디오 자신의 값.
  // KjunRadioGroup 안에서는 그룹의 value를 따르므로 개별 v-model은 생략한다.
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
    effectiveDisabled() { return this.disabled || !!this.kjunRadioGroup?.disabled },
    isChecked() {
      if (this.kjunRadioGroup) {
        return this.kjunRadioGroup.value === this.val
      }
      return this.value === this.val
    },
    wrapperClasses() {
      return ['kjun-choice', { 'kjun-choice--disabled': this.effectiveDisabled }]
    },
    radioClasses() {
      return ['kjun-choice-control kjun-radio', { 'kjun-radio--checked': this.isChecked }]
    },
    dotClasses() {
      return 'kjun-radio-dot'
    }
  },
  methods: {
    handleChange() {
      if (this.effectiveDisabled) return

      if (this.kjunRadioGroup) {
        this.kjunRadioGroup.change(this.val)
      } else {
        this.$emit('input', this.val)
        this.$emit('change', this.val)
      }
    }
  }
}
</script>
