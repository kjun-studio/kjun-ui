<template>
  <DsModal
    :value="visible"
    size="sm"
    :closable="!loading"
    :close-on-overlay="!loading"
    :close-on-esc="!loading"
    @close="handleCancel"
  >
    <template #header>
      <div class="flex items-center gap-2.5">
        <!-- data-icon: DsIcon이 $attrs를 SVG에 펼치므로 컴포넌트 수정 없이
             아이콘 이름이 DOM에 드러난다. e2e가 trash → alert-circle 회귀를
             감시하는 데 쓴다. -->
        <!-- 헤더 슬롯에서도 기본 아이콘 크기를 명시해 글자 크기 상속과 분리한다. -->
        <DsIcon :name="iconName" :data-icon="iconName" :class="iconColorClass" :size="iconSize" />
        <h3 class="text-lg font-semibold text-text-primary">{{ title }}</h3>
      </div>
    </template>

    <p class="text-sm leading-relaxed text-text-secondary">{{ message }}</p>

    <template #footer>
      <DsButton variant="ghost" :disabled="loading" @click.stop="handleCancel">
        {{ cancelText }}
      </DsButton>
      <DsButton :variant="confirmVariant" :loading="loading" @click.stop="handleConfirm">
        {{ confirmText }}
      </DsButton>
    </template>
  </DsModal>
</template>

<script>
import { tokens } from "@kjun/tokens";
import DsButton from "../primitives/Button.vue";
import DsIcon from "../../icon.js";
import DsModal from "../layout/Modal.vue";
import { componentMixins } from "../../component-mixins.js";
import { createLogger } from '@kjun-adapter/logger.js'

const logger = createLogger('components.design-system.feedback.ConfirmModal')

// 아이콘은 DsAlert(Alert.vue의 TYPE_MAP)와 같은 어휘를 쓴다.
// danger에 trash를 쓰지 않는 이유: 제목이 이미 "삭제"라고 말하므로 아이콘이
// 같은 말을 반복한다. alert-triangle은 warning 전용으로 남긴다.
const TYPE_MAP = {
  warning: { icon: 'alert-triangle', color: 'text-warning-accent', variant: 'primary' },
  danger: { icon: 'alert-circle', color: 'text-danger-accent', variant: 'danger' },
  info: { icon: 'info-circle', color: 'text-info-accent', variant: 'primary' }
}

export default {
  mixins: componentMixins,
  components: { DsButton, DsIcon, DsModal },
  name: 'DsConfirmModal',
  data() {
    return {
      visible: false,
      loading: false,
      title: '확인',
      message: '',
      type: 'warning',
      confirmText: '확인',
      cancelText: '취소',
      onConfirm: null,
      onCancel: null
    }
  },
  computed: {
    iconSize() { return String(tokens.iconSizes.default) },
    normalizedType() {
      return TYPE_MAP[this.type] ? this.type : 'warning'
    },
    iconName() {
      return TYPE_MAP[this.normalizedType].icon
    },
    iconColorClass() {
      return TYPE_MAP[this.normalizedType].color
    },
    confirmVariant() {
      return TYPE_MAP[this.normalizedType].variant
    }
  },
  methods: {
    open(options = {}) {
      this.title = options.title || '확인'
      this.message = options.message || ''
      this.type = options.type || 'warning'
      this.confirmText = options.confirmText || '확인'
      this.cancelText = options.cancelText || '취소'
      this.onConfirm = options.onConfirm || null
      this.onCancel = options.onCancel || null
      this.loading = false
      this.visible = true

      return new Promise((resolve, reject) => {
        this._resolve = resolve
        this._reject = reject
      })
    },
    async handleConfirm() {
      try {
        if (this.onConfirm) {
          this.loading = true
          await this.onConfirm()
        }
        this.visible = false
        if (this._resolve) this._resolve(true)
      } catch (error) {
        logger.error('Confirm action failed:', error)
        if (this._reject) this._reject(error)
      } finally {
        this.loading = false
      }
    },
    handleCancel() {
      if (this.loading) return
      this.visible = false
      if (this.onCancel) this.onCancel()
      if (this._resolve) this._resolve(false)
    }
  }
}
</script>
