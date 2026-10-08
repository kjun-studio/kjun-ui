<template>
  <div class="min-w-0">
    <div class="ds-field-shell" :class="fieldSizeClass" :style="affixStyle" :data-disabled="disabled || undefined">
      <div v-if="$slots.prefix || prefixIcon" ref="prefix" class="ds-field-prefix">
        <slot name="prefix">
          <ds-icon v-if="prefixIcon" :name="prefixIcon" />
        </slot>
      </div>

      <input
        ref="input"
        v-bind="$attrs"
        :id="fieldId"
        :type="type"
        :value="value"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="fieldRequired"
        :min="min"
        :max="max"
        :step="step"
        :inputmode="inputmode"
        :autocomplete="autocomplete"
        :aria-invalid="fieldInvalid ? 'true' : undefined"
        :aria-label="ariaLabel || undefined"
        :aria-labelledby="ariaLabelledby"
        :aria-describedby="ariaDescribedby"
        :class="inputClasses"
        @input="handleInput"
        @change="$emit('change', $event.target.value)"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
        @compositionstart="composing = true"
        @compositionend="composing = false"
        @keypress="$emit('keypress', $event)"
      />

      <div v-if="$slots.suffix || suffixIcon || clearable" ref="suffix" class="ds-field-suffix">
        <DsButton
          v-if="clearable && value"
          variant="ghost"
          size="sm"
          class="ds-field-clear"
          prefix-icon="x"
          aria-label="입력 지우기"
          title="입력 지우기"
          :disabled="disabled || readonly"
          @click.stop="handleClear"
        />
        <slot name="suffix">
          <ds-icon v-if="suffixIcon" :name="suffixIcon" class="text-text-tertiary" />
        </slot>
      </div>
    </div>
    <p v-if="showFieldErrorMessage" :id="`input-error-${_uid}`" class="ds-field-error" role="alert">{{ errorMessage }}</p>
  </div>
</template>

<script>
import { isComposingKey } from "@kjun/tokens";
import DsButton from "./Button.vue";
import DsIcon from "../../icon.js";
import { componentMixins } from "../../component-mixins.js";
import { SIZES_CORE, oneOf } from '../tokens'
import fieldMixin from '../form/fieldMixin'

export default {
  components: { DsButton, DsIcon },
  name: 'DsInput',
  inheritAttrs: false,
  mixins: [fieldMixin, ...componentMixins],
  inject: {
    dsFormGroup: {
      default: null
    }
  },
  props: {
    value: {
      type: [String, Number],
      default: ''
    },
    type: {
      type: String,
      default: 'text'
    },
    placeholder: {
      type: String,
      default: ''
    },
    size: {
      type: String,
      default: 'md',
      validator: oneOf(SIZES_CORE)
    },
    disabled: {
      type: Boolean,
      default: false
    },
    readonly: {
      type: Boolean,
      default: false
    },
    required: {
      type: Boolean,
      default: undefined
    },
    error: {
      type: Boolean,
      default: false
    },
    errorMessage: {
      type: String,
      default: null
    },
    clearable: {
      type: Boolean,
      default: false
    },
    prefixIcon: {
      type: String,
      default: null
    },
    suffixIcon: {
      type: String,
      default: null
    },
    // Number input attributes
    min: {
      type: [Number, String],
      default: null
    },
    max: {
      type: [Number, String],
      default: null
    },
    step: {
      type: [Number, String],
      default: null
    },
    // HTML5 attributes
    inputmode: {
      type: String,
      default: null,
      validator: (v) => ['none', 'text', 'decimal', 'numeric', 'tel', 'search', 'email', 'url'].includes(v)
    },
    autocomplete: {
      type: String,
      default: null
    },
    // DsFormGroup으로 감쌀 수 없는 위치(테이블 셀 인라인 입력 등)에서
    // 내부 input에 직접 접근 가능 이름을 부여한다. (래퍼 div fall-through 방지)
    ariaLabel: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      focused: false,
      composing: false,
      prefixWidth: 0,
      suffixWidth: 0,
    }
  },
  computed: {
    affixStyle() {
      return { '--input-prefix-width': `${this.prefixWidth}px`, '--input-suffix-width': `${this.suffixWidth}px` }
    },
    ariaLabelledby() {
      return this.fieldLabelledby
    },
    ariaDescribedby() {
      return this.fieldDescribedby
    },
    inputClasses() {
      const hasPrefix = this.$slots.prefix || this.prefixIcon
      // Reserve the suffix space only while something shows there, like React; the clear button needs a value.
      const hasSuffix = this.$slots.suffix || this.suffixIcon || (this.clearable && this.value)
      return [...this.fieldClasses, 'ds-input-native', { 'ds-field--prefix': hasPrefix, 'ds-field--suffix': hasSuffix }]
    }
  },
  mounted() {
    // 단위 슬롯·지우기 버튼은 내용에 따라 폭이 달라져 고정 패딩으로 예약할 수 없다.
    this._affixObserver = new ResizeObserver(this.measureAffixes)
    this._observedAffixes = new Set()
    this.observeAffixes()
  },
  updated() {
    this.observeAffixes()
  },
  beforeDestroy() {
    this._affixObserver?.disconnect()
  },
  methods: {
    observeAffixes() {
      if (!this._affixObserver) return
      const elements = [this.$refs.prefix, this.$refs.suffix].filter(Boolean)
      for (const element of this._observedAffixes) {
        if (!elements.includes(element)) {
          this._affixObserver.unobserve(element)
          this._observedAffixes.delete(element)
        }
      }
      for (const element of elements) {
        if (!this._observedAffixes.has(element)) {
          this._affixObserver.observe(element)
          this._observedAffixes.add(element)
        }
      }
      this.measureAffixes()
    },
    measureAffixes() {
      this.prefixWidth = this.$refs.prefix?.getBoundingClientRect().width || 0
      this.suffixWidth = this.$refs.suffix?.getBoundingClientRect().width || 0
    },
    handleInput(e) {
      this.$emit('input', e.target.value)
    },
    handleFocus(e) {
      this.focused = true
      this.$emit('focus', e)
    },
    handleBlur(e) {
      this.focused = false
      this.composing = false
      this.$emit('blur', e)
    },
    handleKeydown(e) {
      this.$emit('keydown', e)
      if (e.key === 'Enter' && !e.defaultPrevented && !isComposingKey(e, this.composing)) {
        this.$emit('enter', e)
      }
    },
    handleClear() {
      if (this.disabled || this.readonly) return
      this.$emit('input', '')
      this.$emit('change', '')
      this.$emit('clear')
      this.$refs.input.focus()
    },
    focus() {
      this.$refs.input.focus()
    },
    blur() {
      this.$refs.input.blur()
    },
    select() {
      this.$refs.input.select()
    }
  }
}
</script>
