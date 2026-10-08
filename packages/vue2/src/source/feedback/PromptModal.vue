<template>
  <DsModal
    :value="visible"
    :title="title"
    :closable="true"
    size="sm"
    @close="cancel"
  >
    <p v-if="message" class="text-sm text-text-secondary mb-3">{{ message }}</p>
    <DsInput
      ref="inputRef"
      v-model="inputValue"
      :placeholder="placeholder"
      :aria-label="title"
      :error-message="errorMessage"
      @enter="confirm"
    />
    <template #footer>
      <DsFormActions
        size="lg"
        variant="primary"
        cancel-variant="ghost"
        :cancel-text="cancelText"
        :confirm-text="confirmText"
        @cancel="cancel"
        @confirm="confirm"
      />
    </template>
  </DsModal>
</template>

<script>
import DsFormActions from "../form/FormActions.vue";
import DsInput from "../primitives/Input.vue";
import DsModal from "../layout/Modal.vue";
import { componentMixins } from "../../component-mixins.js";
export default {
  mixins: componentMixins,
  components: { DsFormActions, DsInput, DsModal },
  name: 'DsPromptModal',
  data() {
    return {
      visible: false,
      title: '입력',
      message: '',
      placeholder: '',
      confirmText: '확인',
      cancelText: '취소',
      inputValue: '',
      errorMessage: '',
      validator: null,
    }
  },
  methods: {
    open(options = {}) {
      const opts = typeof options === 'string' ? { message: options } : options
      this.title = opts.title || '입력'
      this.message = opts.message || ''
      this.placeholder = opts.placeholder || ''
      this.confirmText = opts.confirmText || '확인'
      this.cancelText = opts.cancelText || '취소'
      this.inputValue = opts.initialValue || ''
      this.errorMessage = ''
      this.validator = typeof opts.validator === 'function' ? opts.validator : null
      this.visible = true
      this.$nextTick(() => {
        const input = this.$refs.inputRef
        if (input && typeof input.focus === 'function') input.focus()
      })
      return new Promise((resolve) => { this._resolve = resolve })
    },
    confirm() {
      if (this.validator) {
        const verdict = this.validator(this.inputValue)
        if (verdict !== true) {
          this.errorMessage = typeof verdict === 'string' ? verdict : '입력값이 올바르지 않습니다'
          return
        }
      }
      const value = this.inputValue
      this.visible = false
      if (this._resolve) this._resolve(value)
    },
    cancel() {
      this.visible = false
      if (this._resolve) this._resolve(null)
    },
  },
}
</script>
