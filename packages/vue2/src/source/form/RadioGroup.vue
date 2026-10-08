<template>
  <div :class="groupClasses" role="radiogroup" :aria-label="ariaLabel || undefined" :aria-disabled="disabled ? 'true' : undefined">
    <slot>
      <DsRadio
        v-for="option in options"
        :key="String(option.value)"
        :val="option.value"
        :label="option.label"
        :disabled="option.disabled"
      />
    </slot>
  </div>
</template>

<script>
import { componentMixins } from "../../component-mixins.js";
import DsRadio from './Radio.vue'

export default {
  mixins: componentMixins,
  name: 'DsRadioGroup',
  components: { DsRadio },
  provide() {
    return {
      radioGroup: this
    }
  },
  props: {
    disabled: { type: Boolean, default: false },
    ariaLabel: { type: String, default: '' },
    value: {
      type: [String, Number, Boolean],
      default: null
    },
    // [{ value, label, disabled? }] — 슬롯 없이 옵션 배열만으로 라디오 목록 렌더링
    options: {
      type: Array,
      default: () => []
    },
    direction: {
      type: String,
      default: 'horizontal',
      validator: (v) => ['horizontal', 'vertical'].includes(v)
    }
  },
  computed: {
    groupClasses() {
      return this.direction === 'vertical'
        ? 'flex flex-col gap-2'
        : 'flex flex-wrap gap-4'
    }
  },
  methods: {
    change(val) {
      if (this.disabled) return
      this.$emit('input', val)
      this.$emit('change', val)
    }
  }
}
</script>
