<template>
  <div class="kjun-vue-tabs kjun-tabs" :data-variant="variant" :data-density="density">
    <!-- 배경(header)과 페이드 mask(scroller)를 분리: mask는 요소 배경까지 투명하게 깎아,
         sticky+불투명 배경 소비자(상세모달)에서 페이드 구간 뒤로 스크롤 콘텐츠가 비치는 것을 막는다 -->
    <div class="ds-tabs-header kjun-tabs-header">
      <div ref="scroller" :class="scrollerClasses" :style="maskStyle" role="tablist" :aria-label="ariaLabel" tabindex="-1" @scroll="updateOverflow">
        <button
          v-for="tab in normalizedTabs"
          :key="tab.name"
          :id="'tab-' + _uid + '-' + tab.name"
          type="button"
          role="tab"
          :aria-selected="String(value === tab.name)"
          :data-tab-name="tab.name"
          :aria-controls="registeredTabs.some(pane => pane.name === tab.name) ? 'tabpanel-' + _uid + '-' + tab.name : undefined"
          :disabled="tab.disabled"
          :tabindex="entryName === tab.name ? 0 : -1"
          :class="tabClasses(tab)"
          @click.stop="selectTab(tab.name)"
          @contextmenu="onTabContextMenu(tab, $event)"
          @touchstart="onTabTouchStart(tab, $event)"
          @touchmove="onTabTouchMove"
          @touchend="clearTabPress"
          @touchcancel="clearTabPress"
        >
          <DsIcon v-if="tab.icon" :name="tab.icon" :size="iconSize" />
          <span class="kjun-motion-label" :data-label="tab.label"><span>{{ tab.label }}</span></span>
          <span v-if="tab.badge || tab.badge === 0" class="kjun-tab-badge" :class="badgeClass(tab)">
            {{ tab.badge }}
          </span>
        </button>
        <span ref="indicator" class="kjun-tab-indicator" aria-hidden="true" hidden></span>
        <!-- 탭 끝 트레일링 액션 (예: 새 항목 추가). 탭과 함께 가로 스크롤된다. -->
        <slot name="actions"></slot>
      </div>
    </div>

    <!-- Tab Content -->
    <div v-if="$slots.default" class="kjun-tab-content">
      <slot></slot>
    </div>
  </div>
</template>

<script>
import { manageTabList } from "../../../../../shared/package-runtime/tab-keyboard";
import { selectionIndicator } from "../../adapters/selection-indicator.js";
import DsIcon from "../../icon.js";
import { componentMixins } from "../../component-mixins.js";
import { oneOf } from '../tokens'
import { tokens } from '@kjun/tokens'

// tab-menu(컨텍스트 메뉴) long-press 발동 시간(ms)과 스크롤로 간주할 이동 허용치(px)
const TAB_LONG_PRESS_MS = 500
const TAB_PRESS_MOVE_CANCEL_PX = 10

// underline은 선택선, pills는 중립 배경으로 현재 탭을 표시한다.
const TAB_VARIANTS = ['underline', 'pills']

export default {
  mixins: componentMixins,
  components: { DsIcon },
  name: 'DsTabs',
  provide() {
    return {
      tabsContainer: this
    }
  },
  props: {
    ariaLabel: { type: String, default: '탭' },
    value: {
      type: String,
      default: ''
    },
    // Props-based tabs (alternative to compound DsTab components)
    items: {
      type: Array,
      default: () => []
      // Expected format: [{ name: 'tab1', label: 'Tab 1', icon: 'home', badge: '3', badgeVariant: 'danger', disabled: false }]
      // badgeVariant를 지정한 상태만 의미 색상을 쓰며, 일반 개수는 중립 텍스트로 표시한다.
    },
    density: {
      type: String,
      default: 'comfortable',
      validator: (v) => ['comfortable', 'compact'].includes(v),
    },
    variant: {
      type: String,
      default: 'underline',
      validator: oneOf(TAB_VARIANTS),
    },
  },
  data() {
    return {
      registeredTabs: [],
      // 탭 strip이 가로로 넘칠 때 가장자리 페이드로 "더 있음"을 알린다
      overflowLeft: false,
      overflowRight: false,
    }
  },
  created() {
    // tab-menu long-press 추적용 비반응 필드 (템플릿 미사용이라 data에 두지 않는다)
    this._tabPress = null
    this._tabPressTimer = null
  },
  computed: {
    entryName() { return this.normalizedTabs.find(tab => tab.name === this.value && !tab.disabled)?.name || this.initialCandidate },
    iconSize() { return tokens.extensions.tabs.iconSize },
    initialCandidate() { return this.normalizedTabs.find(tab => !tab.disabled)?.name },
    // Merge props-based items and registered child tabs
    tabs() {
      return this.items.length > 0 ? this.items : this.registeredTabs
    },
    // Normalize tabs to use 'name' (support 'name', 'value', and 'id' as identifier)
    normalizedTabs() {
      return this.tabs.map(tab => ({
        ...tab,
        name: tab.name || tab.value || tab.id  // Support 'name', 'value', and 'id'
      }))
    },
    scrollerClasses() { return 'ds-tabs-scroller kjun-tabs-list' },
    // 색을 칠하지 않고 strip 자체 alpha를 페이드 → 모달/페이지 등 어떤 배경에서도 맞는다
    maskStyle() {
      const fade = tokens.extensions.scrollFade.width
      let mask = null
      if (this.overflowLeft && this.overflowRight) {
        mask = `linear-gradient(to right, transparent, currentColor ${fade}px, currentColor calc(100% - ${fade}px), transparent)`
      } else if (this.overflowRight) {
        mask = `linear-gradient(to right, currentColor calc(100% - ${fade}px), transparent)`
      } else if (this.overflowLeft) {
        mask = `linear-gradient(to right, transparent, currentColor ${fade}px)`
      }
      return mask ? { maskImage: mask, WebkitMaskImage: mask } : {}
    },
  },
  watch: {
    value: { immediate: true, handler: 'queueInitialTab' },
    initialCandidate: { immediate: true, handler: 'queueInitialTab' },
  },
  mounted() {
    this._keyboard = manageTabList(this.$refs.scroller, name => this.selectTab(name))
    this._indicator = selectionIndicator(this.$refs.scroller, this.$refs.indicator, true)
    this.$nextTick(this.updateOverflow)
    window.addEventListener('resize', this.updateOverflow)
  },
  updated() {
    if (this._tabPress && !this.canOpenTabMenu(this._tabPress.name)) this.clearTabPress()
    this.syncTabOrder()
    this._indicator?.update()
    // 탭 개수 변동/라벨 변경 후 오버플로우 재계산
    this.$nextTick(this.updateOverflow)
  },
  beforeDestroy() {
    this._keyboard?.()
    this._indicator?.destroy()
    window.removeEventListener('resize', this.updateOverflow)
    this.clearTabPress()
  },
  methods: {
    queueInitialTab() {
      if (this.value !== '') this._initialRequests?.clear()
      if (this._initialPending) return
      this._initialPending = true
      // Child registrations update one at a time. Select from the settled batch.
      this.$nextTick(() => {
        this._initialPending = false
        if (!this._isDestroyed) {
          this.syncTabOrder()
          this.requestInitialTab()
        }
      })
    },
    syncTabOrder() {
      if (this.items.length) return
      const order = new Map((this.$slots.default || []).map((node, index) => [node.componentInstance?._uid, index]))
      const sorted = [...this.registeredTabs].sort((a, b) => (order.get(a.registrationId) ?? Infinity) - (order.get(b.registrationId) ?? Infinity))
      if (sorted.some((tab, index) => tab !== this.registeredTabs[index])) this.registeredTabs = sorted
    },
    requestInitialTab() {
      if (!this._initialRequests) this._initialRequests = new Set()
      if (this.value !== '') { this._initialRequests.clear(); return }
      const candidate = this.initialCandidate
      if (!candidate || this._initialRequests.has(candidate)) return
      this._initialRequests.add(candidate)
      this.selectTab(candidate)
    },
    // scrollWidth > clientWidth면 넘침. 좌/우 페이드는 현재 스크롤 위치로 판정한다
    updateOverflow() {
      const el = this.$refs.scroller
      if (!el) return
      const left = el.scrollLeft > 1
      const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
      if (left !== this.overflowLeft) this.overflowLeft = left
      if (right !== this.overflowRight) this.overflowRight = right
    },
    registerTab(tab) {
      this.registeredTabs.push(tab)
    },
    updateTab(tab) {
      const idx = this.registeredTabs.findIndex(t => t.registrationId === tab.registrationId)
      if (idx > -1) this.registeredTabs.splice(idx, 1, tab)
    },
    unregisterTab(registrationId) {
      const idx = this.registeredTabs.findIndex(t => t.registrationId === registrationId)
      if (idx > -1) {
        this.registeredTabs.splice(idx, 1)
      }
    },
    selectTab(name) {
      const tab = this.normalizedTabs.find(tab => tab.name === name)
      if (!tab || tab.disabled) return
      this.$emit('input', name)
      this.$emit('change', name)
    },
    // --- tab-menu: 탭 우클릭/long-press 컨텍스트 메뉴 이벤트 ---
    // 'tab-menu' 리스너가 있는 소비자에서만 동작한다. 없는 곳은 네이티브 우클릭 그대로.
    canOpenTabMenu(name) {
      return !!this.$listeners['tab-menu'] && this.normalizedTabs.some(tab => tab.name === name && !tab.disabled)
    },
    onTabContextMenu(tab, event) {
      if (!this.canOpenTabMenu(tab.name)) return
      event.preventDefault()
      this.$emit('tab-menu', {
        name: tab.name, x: event.clientX, y: event.clientY, pointer: 'mouse',
      })
    },
    onTabTouchStart(tab, event) {
      this.clearTabPress()
      if (!this.canOpenTabMenu(tab.name)) return
      const touch = event.touches && event.touches[0]
      if (!touch) return
      this._tabPress = { name: tab.name, x: touch.clientX, y: touch.clientY }
      this._tabPressTimer = setTimeout(() => {
        const press = this._tabPress
        this.clearTabPress()
        if (press && this.canOpenTabMenu(press.name)) this.$emit('tab-menu', { ...press, pointer: 'touch' })
      }, TAB_LONG_PRESS_MS)
    },
    onTabTouchMove(event) {
      if (!this._tabPressTimer || !this._tabPress) return
      const touch = event.touches && event.touches[0]
      if (!touch) return
      // 일정 거리 이상 움직이면 스크롤 의도로 보고 long-press를 취소한다.
      const dx = Math.abs(touch.clientX - this._tabPress.x)
      const dy = Math.abs(touch.clientY - this._tabPress.y)
      if (dx > TAB_PRESS_MOVE_CANCEL_PX || dy > TAB_PRESS_MOVE_CANCEL_PX) {
        this.clearTabPress()
      }
    },
    clearTabPress() {
      if (this._tabPressTimer) {
        clearTimeout(this._tabPressTimer)
        this._tabPressTimer = null
      }
      this._tabPress = null
    },
    tabClasses() {
      return ['ds-tab kjun-tab', this.$listeners['tab-menu'] ? 'select-none' : '']
    },
    // 상태의 의미 색상은 보존하되 배지 배경은 사용하지 않는다.
    badgeClass(tab) {
      switch (tab.badgeVariant) {
        case 'danger':
          return 'text-danger'
        case 'warning':
          return 'text-warning'
        case 'success':
          return 'text-success'
        case 'brand':
          return 'text-brand-hover'
        default:
          return ''
      }
    }
  }
}
</script>

<style scoped>
.ds-tabs-scroller { -ms-overflow-style:none; }
.ds-tabs-scroller::-webkit-scrollbar { display:none; }
.ds-tabs-scroller:focus-within { mask-image:none !important; -webkit-mask-image:none !important; }
</style>
