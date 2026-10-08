<template>
  <div class="kjun-form-actions">
    <DsButton v-if="showCancel" :size="size" :variant="cancelVariant" :disabled="cancelDisabled" @click="$emit('cancel')">{{ cancelText }}</DsButton>
    <DsButton v-if="showConfirm" :size="size" :variant="variant" :loading="loading" :disabled="confirmDisabled" @click="$emit('confirm')">{{ confirmText }}</DsButton>
  </div>
</template>
<script>
import DsButton from "../primitives/Button.vue";
import { componentMixins } from "../../component-mixins.js";
import { SIZES_CORE, oneOf, FORM_CONFIRM_VARIANTS, REFRESH_VARIANTS } from '../tokens'
import { observeFormActions } from '../../../../../shared/package-runtime/form-actions'
export default {
  mixins: componentMixins,
  components: { DsButton },
  name: 'DsFormActions',
  mounted() { this._stopActionsLayout = observeFormActions(this.$el) },
  beforeDestroy() { this._stopActionsLayout?.() },
  props: {
    confirmText: { type: String, default: '저장' },
    cancelText: { type: String, default: '취소' },
    size: { type: String, default: 'lg', validator: oneOf(SIZES_CORE) },
    loading: { type: Boolean, default: false },
    confirmDisabled: { type: Boolean, default: false },
    cancelDisabled: { type: Boolean, default: false },
    showConfirm: { type: Boolean, default: true },
    showCancel: { type: Boolean, default: true },
    variant: { type: String, default: 'primary', validator: oneOf(FORM_CONFIRM_VARIANTS) },
    cancelVariant: { type: String, default: 'ghost', validator: oneOf(REFRESH_VARIANTS) },
  },
}
</script>
