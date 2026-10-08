<template>
    <div
      v-kjun-layer="'window'" v-if="motionPresent"
      class="ds-modal-overlay"
      @click.self="handleOverlayClick"
    >
      <div
        :class="modalClasses"
        :style="containerStyle"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="labelledByHeading() ? `modal-title-${_uid}` : undefined"
        :aria-label="dialogLabel()"
        @click.stop
      >
        <!-- Header -->
        <div v-if="showHeader" class="ds-modal-header">
          <!-- id를 래퍼에 둬서 #header 슬롯(커스텀 헤더)에서도 aria-labelledby가 유효 -->
          <div :id="`modal-title-${_uid}`" class="ds-modal-title">
            <slot name="header">
              <h3>{{ title }}</h3>
            </slot>
          </div>
          <button
            v-if="closable"
            class="ds-modal-close"
            @click="close"
            type="button"
            aria-label="닫기"
          >
            <DsIcon name="x" size="var(--_kjun-geometry-modal-close-icon-size)" />
          </button>
        </div>

        <!-- Body -->
        <div :class="bodyClasses">
          <slot></slot>
        </div>

        <!-- Footer -->
        <div v-if="showFooter || $slots.footer" class="ds-modal-footer">
          <slot name="footer"><DsFormActions
            :size="footerSize"
            cancel-variant="secondary"
            :show-cancel="showCancelButton"
            :show-confirm="showConfirmButton"
            :cancel-text="cancelText"
            :confirm-text="confirmText"
            :confirm-disabled="confirmDisabled"
            :loading="loading"
            :variant="confirmVariant"
            @cancel="cancel"
            @confirm="confirm"
          /></slot>
        </div>
      </div>
    </div>
</template>

<script>
import { layerMotion } from "../../adapters/layer-motion.js";
import DsFormActions from "../form/FormActions.vue";
import DsIcon from "../../icon.js";
import { componentMixins } from "../../component-mixins.js";
import { createFocusTrap } from '../../focusTrap'
import { createBodyScrollLock } from '../../bodyScrollLock'

export default {
  mixins: [...componentMixins, layerMotion("modal")],
  components: { DsFormActions, DsIcon },
  name: 'DsModal',
  props: {
    footerSize: { type: String, default: 'md' },
    // v-model 지원
    value: {
      type: Boolean,
      default: false
    },
    // 제목
    title: {
      type: String,
      default: ''
    },
    ariaLabel: {
      type: String,
      default: ''
    },
    // 크기
    size: {
      type: String,
      default: 'md',
      validator: (value) => ['sm', 'md', 'lg', 'xl', 'full'].includes(value)
    },
    // 닫기 버튼 표시
    closable: {
      type: Boolean,
      default: true
    },
    // 오버레이 클릭시 닫기
    closeOnOverlay: {
      type: Boolean,
      default: true
    },
    // ESC 키로 닫기
    closeOnEsc: {
      type: Boolean,
      default: true
    },
    // 헤더 표시
    showHeader: {
      type: Boolean,
      default: true
    },
    // 푸터 표시
    showFooter: {
      type: Boolean,
      default: false
    },
    // 확인 버튼 표시
    showConfirmButton: {
      type: Boolean,
      default: true
    },
    // 취소 버튼 표시
    showCancelButton: {
      type: Boolean,
      default: true
    },
    // 확인 버튼 텍스트
    confirmText: {
      type: String,
      default: '확인'
    },
    // 취소 버튼 텍스트
    cancelText: {
      type: String,
      default: '취소'
    },
    // 확인 버튼 비활성화
    confirmDisabled: {
      type: Boolean,
      default: false
    },
    // 로딩 상태
    loading: {
      type: Boolean,
      default: false
    },
    // 본문 패딩 제거
    noPadding: {
      type: Boolean,
      default: false
    },
    // 고정 높이 (예: "80vh"). 지정 시 컨텐츠/탭 전환과 무관하게 프레임 높이를 고정하고 body가 스크롤된다.
    height: {
      type: String,
      default: ''
    },
    // 확인 버튼 스타일
    confirmVariant: {
      type: String,
      default: 'primary',
      validator: (value) => ['primary', 'danger', 'success'].includes(value)
    }
  },
  data() {
    return {
      focusTrap: createFocusTrap(),
      scrollLock: createBodyScrollLock(),
    }
  },
  computed: {
    modalClasses() {
      const base = 'ds-modal-container'

      const sizes = {
        sm: 'ds-modal-sm',
        md: 'ds-modal-md',
        lg: 'ds-modal-lg',
        xl: 'ds-modal-xl',
        full: 'ds-modal-full'
      }

      return [base, sizes[this.size], this.height ? 'ds-modal-fixed' : ''].filter(Boolean).join(' ')
    },
    containerStyle() {
      return this.height ? { height: this.height } : null
    },
    bodyClasses() {
      return [
        'ds-modal-body',
        this.noPadding ? 'ds-modal-body-no-padding' : ''
      ].filter(Boolean).join(' ')
    },
  },
  watch: {
    value: 'syncOpenState'
  },
  mounted() {
    this.syncOpenState(this.value)
  },
  beforeDestroy() {
    this.scrollLock.release()
    document.removeEventListener('keydown', this.handleEscKey)
    this.focusTrap.deactivate()
  },
  methods: {
    // Slots are refreshed during rendering rather than tracked by computed values.
    labelledByHeading() {
      return this.showHeader && !this.ariaLabel.trim() &&
        !!(this.title.trim() || this.$slots.header || this.$scopedSlots.header)
    },
    dialogLabel() {
      return this.ariaLabel.trim() ||
        (this.labelledByHeading() ? undefined : this.title.trim() || '대화상자')
    },
    syncOpenState(newVal) {
      if (newVal) this._closeRequested = false
      if (newVal) {
        this.scrollLock.acquire()
        document.addEventListener('keydown', this.handleEscKey)
        this.$nextTick(() => {
          if (!this.value || this._isDestroyed) return
          const modalEl = this.$el.querySelector('[role="dialog"]')
          if (modalEl) {
            this.focusTrap.activate(modalEl)
          }
        })
      } else {
        document.removeEventListener('keydown', this.handleEscKey)
      }
    },
    close() {
      if (this._closeRequested || !this.value) return
      this._closeRequested = true
      this.$emit('input', false)
      this.$emit('close')
    },
    confirm() {
      this.$emit('confirm')
    },
    cancel() {
      this.$emit('cancel')
      this.close()
    },
    handleOverlayClick() {
      if (this.closeOnOverlay) {
        this.close()
      }
    },
    handleEscKey(event) {
      // closeOnOverlay와 동일하게 매 이벤트마다 현재 값을 읽는다.
      // closeOnEsc가 열린 뒤 조건부로 바뀌는 경우(예: 폼 단계 → 니모닉 단계)에도
      // 반영되어야 하므로, 리스너 등록 시점의 값을 캡처해 두면 안 된다.
      if (!event.defaultPrevented && event.key === 'Escape' && this.value && this.closeOnEsc && this.focusTrap.isTop()) {
        event.preventDefault()
        this.close()
      }
    }
  }
}
</script>

<style scoped>
/* Overlay */
.ds-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--overlay);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: var(--_kjun-active-layer);
  padding: var(--_kjun-geometry-modal-mobile-inset);
}

/* Container */
.ds-modal-container {
  background: var(--card-bg);
  border-radius: var(--_kjun-geometry-modal-radius);
  /* border removed per design system policy */
  box-shadow: var(--_kjun-modal-elevation);
  max-height: calc(100dvh - 2 * var(--_kjun-geometry-modal-mobile-inset));
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Sizes */
.ds-modal-sm {
  width: var(--_kjun-geometry-modal-widths-sm);
  max-width: 100%;
}

.ds-modal-md {
  width: var(--_kjun-geometry-modal-widths-md);
  max-width: 100%;
}

.ds-modal-lg {
  width: var(--_kjun-geometry-modal-widths-lg);
  max-width: 100%;
}

.ds-modal-xl {
  width: var(--_kjun-geometry-modal-widths-xl);
  max-width: 100%;
}

.ds-modal-full {
  width: calc(100vw - 2 * var(--_kjun-geometry-modal-mobile-inset));
  height: calc(100vh - 2 * var(--_kjun-geometry-modal-mobile-inset));
  height: calc(100dvh - 2 * var(--_kjun-geometry-modal-mobile-inset));
  max-width: none;
  max-height: none;
}

/* Header */
.ds-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--_kjun-geometry-modal-header-padding-y) var(--_kjun-geometry-modal-padding);
  border-bottom: var(--_kjun-border-default-width) solid var(--border-primary);
  flex-shrink: 0;
}

.ds-modal-title {
  flex: 1;
  min-width: 0;
  padding-right: var(--_kjun-geometry-modal-title-action-gap);
  overflow-wrap: anywhere;
  font-size: var(--_kjun-geometry-modal-title-size);
  color: var(--text-primary);
  line-height: var(--_kjun-geometry-modal-title-line-height);
  font-weight: var(--_kjun-geometry-modal-title-weight);
  letter-spacing: var(--_kjun-type-section-title-tracking);
}

.ds-modal-title h3 {
  margin: 0;
  font: inherit;
}

.ds-modal-close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--_kjun-geometry-modal-close-size);
  height: var(--_kjun-geometry-modal-close-size);
  background: transparent;
  border: none;
  border-radius: var(--_kjun-geometry-modal-close-radius);
  cursor: pointer;
  color: var(--text-secondary);
  transition: background-color var(--motion-control) var(--ease-out), color var(--motion-control) var(--ease-out);
}

.ds-modal-close:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

/* Body */
.ds-modal-body {
  padding: var(--_kjun-geometry-modal-padding);
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  color: var(--text-primary);
}

.ds-modal-body-no-padding {
  padding: 0;
}

/* 고정 높이 모달(height prop): 컨텐츠 양과 무관하게 body가 프레임을 채우며 스크롤한다 */
.ds-modal-fixed .ds-modal-body {
  max-height: none;
}

/* Footer */
.ds-modal-footer {
  padding: var(--_kjun-geometry-modal-header-padding-y) var(--_kjun-geometry-modal-padding);
  border-top: var(--_kjun-border-default-width) solid var(--border-primary);
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--_kjun-geometry-modal-footer-gap);
  flex-shrink: 0;
}

/* Scrollbar styling */
.ds-modal-body::-webkit-scrollbar {
  width: var(--extension-scrollbar-width);
}

.ds-modal-body::-webkit-scrollbar-track {
  background: transparent;
}

.ds-modal-body::-webkit-scrollbar-thumb {
  background: var(--border-secondary);
  border-radius: var(--_kjun-geometry-radius-radius9999);
}

.ds-modal-body::-webkit-scrollbar-thumb:hover {
  background: var(--border-strong);
}

/* Shared modal threshold controls the full-width mobile layout. */
@media (width <= token(responsive.modal)) {
  .ds-modal-sm,
  .ds-modal-md,
  .ds-modal-lg,
  .ds-modal-xl {
    width: calc(100vw - 2 * var(--_kjun-geometry-modal-mobile-inset)) !important;
    max-height: 85vh;
    max-height: 85dvh;
  }

  /* 고정 높이를 지정하지 않은 일반 모달은 헤더·본문·푸터를 함께 스크롤한다. */
  .ds-modal-container:not(.ds-modal-fixed):not(.ds-modal-full) {
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .ds-modal-container:not(.ds-modal-fixed):not(.ds-modal-full) .ds-modal-body {
    flex: 0 0 auto;
    min-height: auto;
    overflow-y: visible;
  }
}
</style>
