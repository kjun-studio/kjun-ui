<template>
  <div class="kjun-form-group">
    <label v-if="label" :id="labelId" :for="id" :class="labelClasses">
      {{ label }}
      <span v-if="required" class="kj-text-danger kj-ml-0.5">*</span>
    </label>

    <div :class="{ 'kj-mt-form-label-gap': label }">
      <slot></slot>
    </div>

    <div v-if="error" :id="errorId" class="kjun-form-error" role="alert">
      <KjunIcon name="alert-circle" size="var(--_kjun-extension-form-message-icon-size)" class="kj-mr-1.5 kj-flex-shrink-0" />
      {{ error }}
    </div>
    <div v-else-if="hint" :id="hintId" class="kjun-form-hint">
      {{ hint }}
    </div>
  </div>
</template>

<script>
import KjunIcon from "../../icon.js";
import { componentMixins } from "../../component-mixins.js";
export default {
  mixins: componentMixins,
  components: { KjunIcon },
  name: 'KjunFormGroup',
  // 내부 Kjun 입력 컴포넌트(KjunInput/KjunSelect/KjunTextarea)가 inject로 받아
  // aria-labelledby/aria-describedby를 자동 연결한다.
  provide() {
    return {
      kjunFormGroup: this
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
      return 'kj-block kj-text-sm kj-font-medium kj-text-text-primary'
    },
    labelId() {
      return this.label ? `kjun-form-label-${this._uid}` : null
    },
    errorId() {
      if (!this.error) return null
      return this.id ? `${this.id}-error` : `kjun-form-error-${this._uid}`
    },
    hintId() {
      if (!this.hint) return null
      return this.id ? `${this.id}-hint` : `kjun-form-hint-${this._uid}`
    },
    describedById() {
      return this.errorId || this.hintId
    }
  }
}
</script>

<style scoped>
.kjun-form-error {
  display: flex;
  align-items: flex-start;
  font-size: var(--_kjun-type-caption-size);
  color: var(--_kjun-danger);
  margin-top: var(--_kjun-extension-form-message-gap);
  line-height: var(--_kjun-type-caption-line);
  font-weight: var(--_kjun-type-caption-weight);
  letter-spacing: var(--_kjun-type-caption-tracking);
}

.kjun-form-hint {
  font-size: var(--_kjun-type-caption-size);
  color: var(--_kjun-text-secondary);
  margin-top: var(--_kjun-extension-form-message-gap);
  line-height: var(--_kjun-type-caption-line);
  font-weight: var(--_kjun-type-caption-weight);
  letter-spacing: var(--_kjun-type-caption-tracking);
}
</style>
