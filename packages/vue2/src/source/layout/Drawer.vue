<template>
    <div
      v-kjun-layer="'window'" v-if="motionPresent"
      class="kjun-drawer-overlay"
      @click.self="handleOverlayClick"
    >
      <div class="kjun-drawer-scrim" aria-hidden="true"></div>
      <div :class="drawerClasses" :style="drawerStyle" role="dialog" aria-modal="true" :aria-labelledby="title ? `drawer-title-${_uid}` : undefined" @click.stop>
        <!-- Header -->
        <div v-if="title || $slots.header" class="kjun-drawer-header">
          <slot name="header">
            <h3 :id="`drawer-title-${_uid}`" class="kjun-drawer-title">{{ title }}</h3>
          </slot>
          <button
            v-if="closable"
            type="button"
            class="kjun-drawer-close"
            aria-label="닫기"
            @click.stop="close"
          >
            <DsIcon name="x" size="var(--extension-drawer-close-icon-size)" />
          </button>
        </div>

        <!-- Body -->
        <div :class="['kjun-drawer-body', noPadding ? 'kjun-drawer-body-no-padding' : '']">
          <slot></slot>
        </div>

        <!-- Footer -->
        <div v-if="$slots.footer" class="kjun-drawer-footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
</template>

<script>
import { tokens } from "@kjun-ui/tokens";
import { layerMotion } from "../../adapters/layer-motion.js";
import DsIcon from "../../icon.js";
import { componentMixins } from "../../component-mixins.js";
import { createFocusTrap } from '../../focusTrap'
import { createBodyScrollLock } from '../../bodyScrollLock'

export default {
  mixins: [...componentMixins, layerMotion("drawer")],
  components: { DsIcon },
  name: 'DsDrawer',
  props: {
    value: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
    position: {
      type: String,
      default: 'right',
      validator: (v) => ['left', 'right', 'top', 'bottom'].includes(v)
    },
    width: {
      type: String,
      default: () => tokens.extensions.drawer.width + 'px'
    },
    closable: {
      type: Boolean,
      default: true
    },
    closeOnOverlay: {
      type: Boolean,
      default: true
    },
    closeOnEsc: {
      type: Boolean,
      default: true
    },
    noPadding: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      focusTrap: createFocusTrap(),
      scrollLock: createBodyScrollLock(),
    }
  },
  computed: {
    drawerClasses() {
      return [
        'kjun-drawer-panel',
        `kjun-drawer-${this.position}`
      ].join(' ')
    },
    drawerStyle() {
      // bottom sheet는 화면 전체 폭을 쓰고 높이는 CSS max-height로 제한한다.
      if (this.position === 'bottom' || this.position === 'top') {
        return {}
      }
      return { width: this.width, maxWidth: '100vw' }
    }
  },
  watch: {
    value(newVal) {
      if (newVal) this._closeRequested = false
      if (newVal) {
        this.scrollLock.acquire()
        if (this.closeOnEsc) {
          document.addEventListener('keydown', this.handleEscKey)
        }
        this.$nextTick(() => {
          const drawerEl = this.$el.querySelector('[role="dialog"]')
          if (drawerEl) {
            this.focusTrap.activate(drawerEl)
          }
        })
      } else {
        document.removeEventListener('keydown', this.handleEscKey)
      }
    }
  },
  beforeDestroy() {
    this.scrollLock.release()
    document.removeEventListener('keydown', this.handleEscKey)
    this.focusTrap.deactivate()
  },
  methods: {
    close() {
      if (this._closeRequested || !this.value) return
      this._closeRequested = true
      this.$emit('input', false)
      this.$emit('close')
    },
    handleOverlayClick() {
      if (this.closeOnOverlay) {
        this.close()
      }
    },
    handleEscKey(event) {
      if (!event.defaultPrevented && event.key === 'Escape' && this.value && this.focusTrap.isTop()) {
        event.preventDefault()
        this.close()
      }
    }
  }
}
</script>

<style scoped>
.kjun-drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--_kjun-active-layer);
}

/* The scrim fades on its own layer so the panel stays opaque while it travels. Clicks reach the overlay. */
.kjun-drawer-scrim {
  position: absolute;
  inset: 0;
  background: var(--_kjun-color-overlay);
  pointer-events: none;
}

.kjun-drawer-panel {
  border-radius: var(--extension-drawer-radius);
  position: fixed;
  top: 0;
  bottom: 0;
  background: var(--card-bg, var(--_kjun-color-surface));
  /* border removed per design system policy */
  box-shadow: var(--_kjun-drawer-elevation-right);
  display: flex;
  flex-direction: column;
}

.kjun-drawer-right {
  right: 0;
}

.kjun-drawer-left {
  box-shadow: var(--_kjun-drawer-elevation-left);
  left: 0;
}

/* bottom sheet: 화면 하단에 붙고 최대 높이 제한, 상단 모서리 라운드 */
.kjun-drawer-bottom {
  top: auto;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  max-height: 85vh;
  border-top-left-radius: var(--extension-drawer-bottom-radius);
  border-top-right-radius: var(--extension-drawer-bottom-radius);
  box-shadow: var(--_kjun-drawer-elevation-bottom);
}

.kjun-drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--extension-drawer-padding-y) var(--extension-drawer-padding-x);
  border-bottom: var(--_kjun-border-default-width) solid var(--border-primary, var(--_kjun-color-surface));
  flex-shrink: 0;
}

.kjun-drawer-title {
  margin: 0;
  font-size: var(--_kjun-type-section-title-size);
  color: var(--text-primary);
  line-height: var(--_kjun-type-section-title-line);
  font-weight: var(--_kjun-type-section-title-weight);
  letter-spacing: var(--_kjun-type-section-title-tracking);
}

.kjun-drawer-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--extension-drawer-close-size);
  height: var(--extension-drawer-close-size);
  background: transparent;
  border: none;
  border-radius: var(--extension-drawer-close-radius);
  cursor: pointer;
  color: var(--text-secondary);
  transition: background-color var(--motion-control) var(--ease-out), color var(--motion-control) var(--ease-out);
}

.kjun-drawer-close:hover {
  background: var(--bg-secondary, var(--_kjun-color-surface));
  color: var(--text-primary);
}

.kjun-drawer-body {
  padding: var(--extension-drawer-body-padding);
  flex: 1;
  overflow-y: auto;
  color: var(--text-primary);
}

.kjun-drawer-body-no-padding {
  padding: 0;
}

.kjun-drawer-footer {
  padding: var(--extension-drawer-padding-y) var(--extension-drawer-padding-x);
  border-top: var(--_kjun-border-default-width) solid var(--border-primary, var(--_kjun-color-surface));
  flex-shrink: 0;
}

/* Scrollbar styling */
.kjun-drawer-body::-webkit-scrollbar {
  width: var(--extension-scrollbar-width);
}
.kjun-drawer-body::-webkit-scrollbar-track {
  background: transparent;
}
.kjun-drawer-body::-webkit-scrollbar-thumb {
  background: var(--border-secondary, var(--_kjun-color-surface));
  border-radius: var(--_kjun-geometry-radius-radius9999);
}

/* Shared drawer threshold controls the mobile layout. */
@media (width <= token(responsive.drawer)) {
  .kjun-drawer-panel {
    width: 100vw !important;
  }
}
.kjun-drawer-top { left:0; right:0; top:0; bottom:auto; width:100%; max-height:90dvh; box-shadow:var(--_kjun-drawer-elevation-top); }
</style>
