<template>
  <div class="ds-popover-wrapper relative inline-block" ref="wrapper" v-click-outside="close" @focusout="onFocusOut">
    <div
      ref="trigger"
      @click.capture="onTriggerClick"
      @keydown="onTriggerKeydown"
      aria-haspopup="dialog"
      :aria-expanded="isOpen ? 'true' : 'false'"
    >
      <slot name="trigger" :open="isOpen" :panel-id="panelId"></slot>
    </div>

    <transition name="ds-popover" :css="false" @before-enter="motionPrepare" @enter="motionEnter" @leave="motionLeave"
      @enter-cancelled="motionCancel" @leave-cancelled="motionCancel">
      <div
        v-kjun-layer="'popup'" v-if="isOpen"
        ref="floating"
        :id="panelId"
        role="dialog"
        :aria-label="ariaLabel || undefined"
        tabindex="-1"
        :style="floatingStyle"
        class="ds-popover-panel kjun-content-popover fixed z-50"
        @keydown="onPanelKeydown"
      >
        <div class="kjun-popover-content" :data-no-padding="String(noPadding)"><slot :close="closeAndFocus"></slot></div>
      </div>
    </transition>
  </div>
</template>

<script>
import { tokens } from "@kjun-ui/tokens";
import { containsLayer } from "../../layer-host.js";
import { layerMotion } from "../../adapters/layer-motion.js";
import { componentMixins } from "../../component-mixins.js";
import { computeFloatingPosition } from '../utils/position'

const VIEWPORT_MARGIN = tokens.extensions.floating.viewportInset
const TRIGGER_GAP = tokens.extensions.floating.anchorGap

/**
 * 탭/클릭으로 여는 팝오버. hover 툴팁과 달리 모바일에서도 동작하고,
 * 긴 설명·상호작용 콘텐츠를 담는다(짧은 hover 힌트는 DsTooltip).
 * 위치는 DsTooltip과 동일한 computeFloatingPosition으로 flip + clamp 처리.
 */
export default {
  mixins: [...componentMixins, layerMotion("popup")],
  name: 'DsPopover',
  directives: {
    'click-outside': {
      bind(el, binding) {
        el._clickOutside = (e) => {
          if (e.target?.isConnected && !containsLayer(el, e.target)) binding.value()
        }
        document.addEventListener('click', el._clickOutside)
      },
      unbind(el) {
        document.removeEventListener('click', el._clickOutside)
      }
    }
  },
  props: {
    noPadding: { type: Boolean, default: false },
    value: { type: Boolean, default: false },
    manualTrigger: { type: Boolean, default: false },
    matchTriggerWidth: { type: Boolean, default: false },
    maxHeight: { type: String, default: () => `min(60vh, ${tokens.extensions.floating.maxHeight}px)` },
    flip: { type: Boolean, default: true },
    focusOnOpen: { type: Boolean, default: false },
    ariaLabel: { type: String, default: '' },
    placement: {
      type: String,
      default: 'bottom',
      validator: (v) => ['top', 'bottom', 'left', 'right'].includes(v)
    }
  },
  data() {
    return {
      isOpen: false,
      floatingStyle: {}
    }
  },
  computed: {
    panelId() { return `ds-popover-${this._uid}` }
  },
  watch: {
    value(value) { this.isOpen = value },
    isOpen(val) {
      if (val) {
        this.$nextTick(() => {
          if (!this.isOpen) return
          this.updatePosition()
          if (this.focusOnOpen) this.focusContent()
          this._resizeObserver = new ResizeObserver(() => this.updatePosition())
          if (this.$refs.floating) this._resizeObserver.observe(this.$refs.floating)
        })
        window.addEventListener('scroll', this.updatePosition, true)
        window.addEventListener('resize', this.updatePosition)
        window.visualViewport?.addEventListener('resize', this.updatePosition)
        window.visualViewport?.addEventListener('scroll', this.updatePosition)
      } else {
        this.removePositionListeners()
      }
      this.$emit('input', val)
      this.$emit(val ? 'open' : 'close')
    }
  },
  mounted() {
    if (this.value) this.isOpen = true
  },
  methods: {
    onTriggerClick() {
      if (!this.manualTrigger) this.toggle()
    },
    onTriggerKeydown(event) {
      if (event.key === 'Escape' && this.isOpen) {
        event.stopPropagation()
        this.closeAndFocus()
      } else if (!this.manualTrigger && ['Enter', ' '].includes(event.key)) {
        event.preventDefault()
        this.toggle()
      }
    },
    onPanelKeydown(event) {
      // 팝오버 조작 중 차트의 Escape·삭제·실행 취소 단축키로 이벤트가 새지 않게 한다.
      event.stopPropagation()
      if (event.key !== 'Escape') return
      const nestedMenu = event.target.closest?.('[role="menu"], [role="listbox"]')
      if (nestedMenu || this.$refs.floating?.querySelector('[role="menu"], [role="listbox"]')) return
      event.preventDefault()
      this.closeAndFocus()
    },
    onFocusOut(event) {
      if (event.relatedTarget && !containsLayer(this.$el, event.relatedTarget)) this.close()
    },
    focusContent() {
      if (!this.isOpen) return
      if (this.$refs.trigger?.contains(document.activeElement)) this._returnFocus = document.activeElement
      this.$refs.floating?.focus({ preventScroll: true })
    },
    toggle() {
      this.isOpen = !this.isOpen
    },
    close() {
      this.isOpen = false
    },
    closeAndFocus() {
      this.close()
      if (this._returnFocus?.isConnected) this._returnFocus.focus({ preventScroll: true })
    },
    updatePosition() {
      const triggerEl = this.$refs.trigger
      const floatingEl = this.$refs.floating
      if (!triggerEl || !floatingEl) return

      const trigger = triggerEl.getBoundingClientRect()
      const dimensions = { width: 'var(--extension-popover-width)', maxWidth: `calc(100vw - ${VIEWPORT_MARGIN * 2}px)` }
      if (this.matchTriggerWidth) dimensions.width = `${trigger.width}px`
      if (this.maxHeight) {
        const viewport = window.visualViewport
        const bottom = (viewport?.offsetTop || 0) + (viewport?.height || window.innerHeight)
        const available = this.placement === 'bottom' && !this.flip
          ? Math.max(0, bottom - trigger.bottom - TRIGGER_GAP - VIEWPORT_MARGIN)
          : (viewport?.height || window.innerHeight) - VIEWPORT_MARGIN * 2
        dimensions.maxHeight = `min(${this.maxHeight}, ${available}px)`
      }
      // 폭·높이 제한을 먼저 적용해야 실제 패널 크기로 위치를 계산할 수 있다.
      Object.assign(floatingEl.style, dimensions)
      const { top, left, placement } = computeFloatingPosition(
        trigger,
        floatingEl.getBoundingClientRect(),
        { placement: this.placement, flip: this.flip, gap: TRIGGER_GAP, margin: VIEWPORT_MARGIN }
      )
      floatingEl.dataset.motionPlacement = placement
      // backdrop-filter/transform 조상은 fixed 요소의 containing block이 된다.
      // 계산값은 뷰포트 좌표이므로 해당 조상의 원점을 빼 실제 CSS 좌표로 변환한다.
      const offsetParent = floatingEl.offsetParent
      const offsetRect = offsetParent
        && offsetParent !== document.body
        && offsetParent !== document.documentElement
        ? offsetParent.getBoundingClientRect()
        : null
      const adjustedTop = offsetRect ? top - offsetRect.top : top
      const adjustedLeft = offsetRect ? left - offsetRect.left : left
      this.floatingStyle = {
        ...dimensions,
        top: `${Math.round(adjustedTop)}px`,
        left: `${Math.round(adjustedLeft)}px`
      }
    },
    removePositionListeners() {
      this._resizeObserver?.disconnect()
      window.removeEventListener('scroll', this.updatePosition, true)
      window.removeEventListener('resize', this.updatePosition)
      window.visualViewport?.removeEventListener('resize', this.updatePosition)
      window.visualViewport?.removeEventListener('scroll', this.updatePosition)
    },
  },
  beforeDestroy() {
    this.removePositionListeners()
  }
}
</script>

<style scoped>
.ds-popover-panel { display: flex; flex-direction: column; outline: none; overflow:auto; }
</style>
