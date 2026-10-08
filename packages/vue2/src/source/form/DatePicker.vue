<template>
  <div class="ds-field-shell" :class="fieldSizeClass">
    <input
      v-bind="$attrs"
      :id="fieldId"
      type="date"
      :value="value"
      :min="min"
      :max="max"
      :disabled="disabled"
      :aria-label="ariaLabel || undefined"
      :aria-labelledby="fieldLabelledby"
      :aria-describedby="fieldDescribedby"
      :aria-invalid="fieldInvalid ? 'true' : undefined"
      :class="[inputClasses, showOverlay ? 'ds-datepicker-masked' : '']"
      @input="$emit('input', $event.target.value)"
      @change="$emit('change', $event.target.value)"
      @focus="focused = true"
      @blur="focused = false"
    />
    <!-- 브라우저 로케일 표기(MM/DD/YYYY) 대신 한국식 표기 오버레이.
         포커스 중에는 네이티브 세그먼트 키보드 편집이 보이도록 숨긴다 -->
    <span
      v-if="showOverlay"
      :class="overlayClasses"
      aria-hidden="true"
    >{{ displayText }}</span>
    <!-- Native와 같은 달력 아이콘. 클릭은 위에 겹친 투명한 브라우저 인디케이터가 받는다 -->
    <span class="ds-field-suffix ds-datepicker-icon" aria-hidden="true"><DsIcon name="calendar" :size="iconSize" /></span>
  </div>
</template>

<script>
import { componentMixins } from "../../component-mixins.js";
import DsIcon from "../../icon.js";
import { tokens } from '@kjun/tokens'
import { SIZES_CORE, oneOf } from '../tokens'
import fieldMixin from './fieldMixin'

export default {
  name: 'DsDatePicker',
  components: { DsIcon },
  inheritAttrs: false,
  mixins: [fieldMixin, ...componentMixins],
  props: {
    value: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: '날짜 선택'
    },
    min: {
      type: String,
      default: null
    },
    max: {
      type: String,
      default: null
    },
    size: {
      type: String,
      default: 'md',
      validator: oneOf(SIZES_CORE)
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      focused: false
    }
  },
  computed: {
    showOverlay() {
      return !this.focused
    },
    displayText() {
      if (!this.value) return this.placeholder
      // "YYYY-MM-DD" → "YYYY. MM. DD." (앱 전반의 한국식 날짜 표기와 통일)
      return this.value.replace(/-/g, '. ') + '.'
    },
    iconSize() {
      return String(tokens.input[this.size].iconSize)
    },
    inputClasses() {
      return [...this.fieldClasses, 'ds-datepicker-field']
    },
    overlayClasses() {
      const tone = this.value ? 'text-text-primary' : 'text-text-tertiary'
      return [
        'ds-datepicker-overlay absolute inset-y-0 flex items-center pointer-events-none whitespace-nowrap overflow-hidden',
        this.value ? '' : 'ds-field-placeholder',
        this.disabled ? 'text-text-disabled' : this.$attrs.readonly != null && this.$attrs.readonly !== false ? 'text-text-secondary' : tone,
      ].filter(Boolean).join(' ')
    }
  }
}
</script>

<style scoped>
/* 오버레이 표기 중에는 네이티브 로케일 텍스트를 숨긴다 (인디케이터는 유지) */
.ds-field.ds-datepicker-masked {
  color: transparent;
}
.ds-datepicker-overlay {
  left: var(--field-padding);
  right: calc(var(--field-padding) + var(--field-icon-size) + var(--field-affix-gap));
  font-size: var(--field-font-size);
  line-height: var(--field-line-height);
  font-weight: var(--_kjun-type-input-weight);
  letter-spacing: var(--_kjun-type-input-tracking);
}
.ds-datepicker-overlay.ds-field-placeholder {
  font-size: var(--field-placeholder-size);
}
/* 아이콘 자리만큼 오른쪽 여백을 비운다 */
.ds-field.ds-datepicker-field {
  padding-right: calc(var(--field-padding) + var(--field-icon-size) + var(--field-affix-gap) - var(--_kjun-border-control-width));
}
.ds-datepicker-icon { pointer-events: none; }
/* 브라우저 인디케이터는 그린 아이콘 위의 투명한 클릭 영역으로만 남긴다 */
input[type="date"]::-webkit-calendar-picker-indicator {
  position: absolute;
  top: 0;
  bottom: 0;
  right: var(--field-padding);
  width: var(--field-icon-size);
  height: auto;
  margin: 0;
  padding: 0;
  opacity: 0;
  cursor: pointer;
}
</style>
