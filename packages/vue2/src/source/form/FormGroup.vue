<template>
  <div class="ds-form-group">
    <label v-if="label" :id="labelId" :for="id" :class="labelClasses">
      {{ label }}
      <span v-if="required" class="text-danger ml-0.5">*</span>
    </label>

    <div :class="{ 'mt-form-label-gap': label }">
      <slot></slot>
    </div>

    <div v-if="error" :id="errorId" class="ds-form-error" role="alert">
      <DsIcon name="alert-circle" size="var(--extension-form-message-icon-size)" class="mr-1.5 flex-shrink-0" />
      {{ error }}
    </div>
    <div v-else-if="hint" :id="hintId" class="ds-form-hint">
      {{ hint }}
    </div>
  </div>
</template>

<script>
import DsIcon from "../../icon.js";
import { componentMixins } from "../../component-mixins.js";
export default {
  mixins: componentMixins,
  components: { DsIcon },
  name: 'DsFormGroup',
  // 내부 Ds 입력 컴포넌트(DsInput/DsSelect/DsTextarea)가 inject로 받아
  // aria-labelledby/aria-describedby를 자동 연결한다.
  provide() {
    return {
      dsFormGroup: this
    }
  },
  props: {
    label: {
      type: String,
      default: ''
    },
    id: {
      type: String,
      default: null
    },
    required: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: ''
    },
    hint: {
      type: String,
      default: ''
    }
  },
  computed: {
    labelClasses() {
      return 'block text-sm font-medium text-text-primary'
    },
    labelId() {
      return this.label ? `ds-form-label-${this._uid}` : null
    },
    errorId() {
      if (!this.error) return null
      return this.id ? `${this.id}-error` : `ds-form-error-${this._uid}`
    },
    hintId() {
      if (!this.hint) return null
      return this.id ? `${this.id}-hint` : `ds-form-hint-${this._uid}`
    },
    describedById() {
      return this.errorId || this.hintId
    }
  }
}
</script>

<style scoped>
.ds-form-error {
  display: flex;
  align-items: flex-start;
  font-size: var(--_kjun-type-caption-size);
  color: var(--danger);
  margin-top: var(--extension-form-message-gap);
  line-height: var(--_kjun-type-caption-line);
  font-weight: var(--_kjun-type-caption-weight);
  letter-spacing: var(--_kjun-type-caption-tracking);
}

.ds-form-hint {
  font-size: var(--_kjun-type-caption-size);
  color: var(--text-secondary);
  margin-top: var(--extension-form-message-gap);
  line-height: var(--_kjun-type-caption-line);
  font-weight: var(--_kjun-type-caption-weight);
  letter-spacing: var(--_kjun-type-caption-tracking);
}
</style>
