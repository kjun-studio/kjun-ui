<template>
  <textarea
    :id="fieldId"
    :value="value"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :required="fieldRequired"
    :rows="rows"
    :style="{ minHeight: `max(var(--field-height), calc(${Number(rows)} * var(--_kjun-type-input-line) + var(--field-textarea-padding-y) * 2 + 2 * var(--_kjun-border-control-width)))` }"
    :class="textareaClasses"
    :aria-label="ariaLabel || undefined"
    :aria-invalid="fieldInvalid ? 'true' : undefined"
    :aria-labelledby="fieldLabelledby"
    :aria-describedby="fieldDescribedby"
    @input="handleInput"
    @change="$emit('change', $event.target.value)"
    @focus="$emit('focus', $event)"
    @blur="$emit('blur', $event)"
  ></textarea>
</template>

<script>
import { componentMixins } from "../../component-mixins.js";
import fieldMixin from './fieldMixin'
import { SIZES_CORE, oneOf } from '../tokens'

export default {
  name: 'DsTextarea',
  mixins: [fieldMixin, ...componentMixins],
  inject: {
    dsFormGroup: {
      default: null
    }
  },
  props: {
    size: { type: String, default: 'md', validator: oneOf(SIZES_CORE) },
    value: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: ''
    },
    rows: {
      type: [Number, String],
      default: 3
    },
    disabled: {
      type: Boolean,
      default: false
    },
    readonly: {
      type: Boolean,
      default: false
    },
    error: {
      type: Boolean,
      default: false
    },
    resize: {
      type: String,
      default: 'vertical',
      validator: (v) => ['none', 'vertical', 'horizontal', 'both'].includes(v)
    }
  },
  computed: {
    textareaClasses() {
      const resizeClasses = {
        none: 'resize-none',
        vertical: 'resize-y',
        horizontal: 'resize-x',
        both: 'resize'
      }

      return [...this.fieldClasses, 'ds-field--textarea', resizeClasses[this.resize]]
    }
  },
  methods: {
    handleInput(e) {
      this.$emit('input', e.target.value)
    }
  }
}
</script>
