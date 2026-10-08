<template>
  <div class="inline-block" ref="wrapper" v-click-outside="close">
    <div ref="trigger" draggable="false" @click.capture="toggle" @keydown="onTriggerKeydown" :aria-haspopup="triggerId ? undefined : 'menu'" :aria-expanded="triggerId ? undefined : String(isOpen)">
      <slot name="trigger"></slot>
    </div>

    <transition name="ds-dropdown" :css="false" @before-enter="motionPrepare" @enter="motionEnter" @leave="motionLeave"
      @enter-cancelled="motionCancel" @leave-cancelled="motionCancel">
      <div v-kjun-layer="'popup'" v-if="isOpen" :id="menuId || undefined" ref="menu" draggable="false" :style="menuStyle" :class="menuClass" class="fixed z-50 min-w-menu-minimum-width max-w-[calc(100vw-2*var(--extension-floating-viewport-inset))] overflow-y-auto ds-field-menu select-none" role="menu" :aria-labelledby="triggerId || undefined" @keydown="onMenuKeydown">
        <slot></slot>
      </div>
    </transition>
  </div>
</template>

<script>
import { tokens } from "@kjun-ui/tokens";
import { containsLayer } from "../../layer-host.js";
import { layerMotion } from "../../adapters/layer-motion.js";
import { componentMixins } from "../../component-mixins.js";
// fixed 포지셔닝 메뉴가 뷰포트 가장자리에 붙지 않도록 유지하는 최소 여백(px)
const VIEWPORT_MARGIN = tokens.extensions.floating.viewportInset
// Before the first layout, estimate a single option from the shared contract.
const MIN_MENU_HEIGHT = tokens.extensions.menu.optionHeight
let activeDropdown = null

export default {
  mixins: [...componentMixins, layerMotion("popup")],
  name: 'DsDropdown',
  directives: {
    'click-outside': {
      bind(el, binding) {
        el._clickOutside = (e) => {
          if (!containsLayer(el, e.target)) {
            binding.value()
          }
        }
        document.addEventListener('click', el._clickOutside)
      },
      unbind(el) {
        document.removeEventListener('click', el._clickOutside)
      }
    }
  },
  provide() {
    return {
      dropdown: this
    }
  },
  // 중첩 드롭다운(팝오버형 메뉴 안의 DsMenuButton 등)에서 조상 드롭다운을 식별한다.
  // 자기 자신의 provide는 inject 해석에서 제외되므로 가장 가까운 조상이 잡힌다.
  inject: {
    parentDropdown: { from: 'dropdown', default: null }
  },
  props: {
    disabled: { type: Boolean, default: false },
    menuId: { type: String, default: '' },
    triggerId: { type: String, default: '' },
    menuClass: { type: [String, Array, Object], default: '' },
    placement: {
      type: String,
      default: 'bottom-start',
      validator: (v) => ['bottom-start', 'bottom-end', 'top-start', 'top-end'].includes(v)
    }
  },
  data() {
    return {
      isOpen: false,
      menuStyle: {}
    }
  },
  watch: {
    disabled(value) {
      if (value) this.close()
    },
    isOpen(val) {
      if (val) {
        this.$nextTick(() => this.updatePosition())
      }
      this.$emit(val ? 'open' : 'close')
    }
  },
  beforeDestroy() {
    if (activeDropdown === this) {
      activeDropdown = null
    }
  },
  methods: {
    isTriggerDisabled() {
      return this.disabled || Boolean(this.$refs.trigger?.querySelector('button')?.disabled)
    },
    onTriggerKeydown(event) {
      if (this.isTriggerDisabled()) return
      if (event.key === 'Escape' && this.isOpen) {
        this.closeOnEscape(event)
      } else if (['ArrowDown', 'Enter', ' '].includes(event.key)) {
        event.preventDefault()
        event.stopPropagation()
        if (this.isOpen && event.key !== 'ArrowDown') this.close()
        else this.openAndFocusFirst()
      }
    },
    onMenuKeydown(event) {
      // 중첩 메뉴의 이동·닫기 키가 조상 메뉴까지 조작하지 않도록 소유자를 확인한다.
      if (event.target.closest('[role="menu"]') !== this.$refs.menu) return
      if (event.key === 'Escape') {
        this.closeOnEscape(event)
        return
      }
      if (event.key === 'Tab') {
        this.close()
        return
      }
      const handlers = {
        ArrowDown: this.focusNext,
        ArrowUp: this.focusPrev,
        Home: this.focusFirst,
        End: this.focusLast
      }
      if (!handlers[event.key]) return
      event.preventDefault()
      event.stopPropagation()
      handlers[event.key]()
    },
    closeOnEscape(event) {
      if (!this.isOpen) return
      event.preventDefault()
      event.stopPropagation()
      this.close()
      this.$refs.trigger?.querySelector('button:not(:disabled), [href], [tabindex]:not([tabindex="-1"])')?.focus({ preventScroll: true })
    },
    toggle() {
      if (this.isTriggerDisabled()) return
      if (this.isOpen) {
        this.close()
      } else {
        this.open()
      }
    },
    // 프로그래밍 방식 열기(예: long-press). 첫 항목 포커스 없이 열어 터치에서 포커스 링이 생기지 않게 한다.
    // 이미 열린 상태에서 다시 호출되면 isOpen watcher가 돌지 않으므로, 트리거 위치 변경(다른 행 long-press)을
    // 따라가도록 매번 명시적으로 재배치한다.
    open() {
      if (this.isTriggerDisabled()) return
      // 싱글톤 규칙: 열린 다른 드롭다운은 닫는다 — 단, 그것이 내 조상(중첩 호스트)이면
      // 닫는 순간 조상 메뉴(v-if)가 unmount되며 나까지 사라지므로 유지한다.
      if (activeDropdown && activeDropdown !== this && activeDropdown !== this.parentDropdown) {
        activeDropdown.close()
      }
      activeDropdown = this
      this.isOpen = true
      this.$nextTick(() => this.updatePosition())
    },
    close() {
      if (activeDropdown === this) {
        // 중첩 드롭다운이 닫힐 때는 아직 열려 있는 조상에게 싱글톤 소유권을 돌려준다.
        activeDropdown = this.parentDropdown && this.parentDropdown.isOpen ? this.parentDropdown : null
      }
      this.isOpen = false
    },
    openAndFocusFirst() {
      if (this.isTriggerDisabled()) return
      this.open()
      this.$nextTick(() => {
        // v-kjun-layer moves the mounted menu on its own next tick. Moving a
        // focused element clears browser focus, so focus only after that move.
        this.$nextTick(() => {
          if (this.isOpen && !this._isDestroyed) this.focusFirst()
        })
      })
    },
    focusFirst() {
      const items = this.getMenuItems()
      if (items.length > 0) items[0].focus()
    },
    focusLast() {
      const items = this.getMenuItems()
      if (items.length) items[items.length - 1].focus()
    },
    focusNext() {
      const items = this.getMenuItems()
      if (items.length === 0) return
      const current = items.indexOf(document.activeElement)
      const next = current < items.length - 1 ? current + 1 : 0
      items[next].focus()
    },
    focusPrev() {
      const items = this.getMenuItems()
      if (items.length === 0) return
      const current = items.indexOf(document.activeElement)
      const prev = current > 0 ? current - 1 : items.length - 1
      items[prev].focus()
    },
    getMenuItems() {
      const menu = this.$refs.menu
      if (!menu) return []
      return Array.from(menu.querySelectorAll('[role="menuitem"]:not(:disabled), [role="menuitemradio"]:not(:disabled)'))
        .filter(item => item.closest('[role="menu"]') === menu)
    },
    updatePosition() {
      this.menuStyle = this.computeMenuStyle()
      // auto-width 메뉴는 내용이 넓으면 뷰포트 가장자리(0px)까지 채운다(shrink-to-fit) —
      // 실측 rect로 여백 침범을 확인해 침범한 쪽을 VIEWPORT_MARGIN에 핀 고정한다.
      this.$nextTick(() => {
        const menu = this.$refs.menu
        if (!menu) return
        const rect = menu.getBoundingClientRect()
        const style = { ...this.menuStyle }
        if (rect.left < VIEWPORT_MARGIN) {
          style.left = `${VIEWPORT_MARGIN}px`
        }
        if (rect.right > window.innerWidth - VIEWPORT_MARGIN) {
          style.right = `${VIEWPORT_MARGIN}px`
        }
        this.menuStyle = style
      })
    },
    computeMenuStyle() {
      if (!this.$refs.trigger) return {}
      const rect = this.$refs.trigger.getBoundingClientRect()
      // isOpen 직후 $nextTick에서 호출되므로 메뉴 DOM이 존재한다. 폭은 max-w 캡이 반영된 실측값.
      const menuWidth = this.$refs.menu ? this.$refs.menu.offsetWidth : 0
      const menuHeight = this.$refs.menu ? this.$refs.menu.offsetHeight : MIN_MENU_HEIGHT
      const gap = tokens.extensions.floating.anchorGap
      const belowSpace = window.innerHeight - rect.bottom - gap - VIEWPORT_MARGIN
      const aboveSpace = rect.top - gap - VIEWPORT_MARGIN
      const useTop = this.placement.startsWith('bottom')
        ? belowSpace < menuHeight && aboveSpace > belowSpace
        : !(aboveSpace < menuHeight && belowSpace > aboveSpace)
      if (this.$refs.menu) this.$refs.menu.dataset.motionPlacement = useTop ? "top" : "bottom"
      const style = {}

      if (useTop) {
        style.bottom = `${window.innerHeight - rect.top + gap}px`
        style.maxHeight = `${Math.max(0, Math.min(tokens.extensions.floating.maxHeight, aboveSpace))}px`
      } else {
        style.top = `${rect.bottom + gap}px`
        style.maxHeight = `${Math.max(0, Math.min(tokens.extensions.floating.maxHeight, belowSpace))}px`
      }

      // 트리거 정렬 좌표를 그대로 쓰면 좁은 화면(모바일)에서 메뉴가 뷰포트 밖으로 잘린다 — 경계 안으로 클램프.
      const maxStartOffset = window.innerWidth - menuWidth - VIEWPORT_MARGIN
      if (this.placement.endsWith('end')) {
        const right = window.innerWidth - rect.right
        style.right = `${Math.max(VIEWPORT_MARGIN, Math.min(right, maxStartOffset))}px`
      } else {
        style.left = `${Math.max(VIEWPORT_MARGIN, Math.min(rect.left, maxStartOffset))}px`
      }

      return style
    }
  }
}
</script>

<style scoped></style>
