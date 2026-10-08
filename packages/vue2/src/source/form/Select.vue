<template>
  <div class="relative min-w-0" v-click-outside="close">
    <div class="ds-field-shell" :class="fieldSizeClass">
      <!-- Trigger -->
      <button
        ref="trigger"
        v-bind="$attrs"
        :id="fieldId"
        type="button"
        :class="triggerClasses"
        :style="compoundStyle"
        :data-time-segment="kjunCompoundControl ? 'true' : undefined"
        :disabled="disabled"
        role="combobox"
        :aria-expanded="isOpen && !kjunLayerBlocked ? 'true' : 'false'"
        aria-haspopup="listbox"
        :aria-controls="`select-options-${_uid}`"
        :aria-invalid="fieldInvalid ? 'true' : undefined"
        :aria-describedby="fieldDescribedby"
        :aria-labelledby="fieldLabelledby"
        :aria-label="ariaLabel || undefined"
        @click.stop="toggle"
        @keydown.down.prevent="openAndFocusFirst"
        @keydown.up.prevent="openAndFocusLast"
        @keydown.escape="handleEscape"
      >
        <slot name="selected" :option="selectedOption" :label="selectedLabel">
          <span v-if="selectedLabel" class="truncate">{{ selectedLabel }}</span>
          <span v-else class="ds-field-placeholder truncate">{{ placeholder }}</span>
        </slot>

        <DsIcon name="chevron-down" :style="kjunCompoundControl ? { width: 'var(--extension-time-picker-icon-size)', height: 'var(--extension-time-picker-icon-size)' } : undefined" :class="['ds-select-indicator shrink-0 text-text-tertiary transition-transform', isOpen && !kjunLayerBlocked ? 'rotate-180' : '']" />
      </button>
      <div v-if="clearable && hasValue" class="ds-field-suffix ds-select-clear">
        <DsButton variant="ghost" size="sm" class="ds-field-clear" prefix-icon="x" aria-label="선택 지우기" title="선택 지우기" :disabled="disabled" @click.stop="clear" />
      </div>
    </div>

    <transition name="ds-select-dropdown" :css="false" @before-enter="motionPrepare" @enter="motionEnter" @leave="motionLeave"
      @enter-cancelled="motionCancel" @leave-cancelled="motionCancel">
      <div v-kjun-layer="'popup'" v-if="isOpen" ref="dropdown" :style="dropdownStyle" class="fixed z-50 ds-field-menu flex flex-col overflow-hidden">
        <div v-if="$slots['menu-header'] || $scopedSlots['menu-header']" ref="menuHeader" class="shrink-0"><slot name="menu-header" /></div>
        <!-- Search -->
        <div v-if="searchable" ref="searchPanel" class="p-2 border-b border-border-primary shrink-0">
          <div class="ds-field-shell ds-field--md">
            <DsIcon name="search" class="ds-field-prefix" />
            <input
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              :placeholder="searchPlaceholder"
              aria-label="선택 항목 검색"
              class="ds-field ds-field--md ds-field--prefix"
              @compositionstart="composing = true"
              @compositionend="composing = false"
              @keydown="handleSearchKeydown"
            />
          </div>
        </div>

        <!-- Options -->
        <div ref="options" :id="`select-options-${_uid}`" class="min-h-0 max-h-menu-list-max-height overflow-y-auto" role="listbox" :aria-multiselectable="multiple ? 'true' : undefined" @keydown.down.prevent="focusNextOption" @keydown.up.prevent="focusPrevOption" @keydown.home.prevent="openAndFocusFirst" @keydown.end.prevent="openAndFocusLast" @keydown.enter.prevent="selectFocusedOption" @keydown.space.prevent="selectFocusedOption" @keydown.escape="handleEscape">
          <div v-if="loading" class="flex items-center justify-center gap-2 px-3 py-3 text-sm text-text-secondary" role="status"><DsSpinner size="sm" />검색 중...</div>
          <div
            v-for="(entry, index) in visibleEntries"
            :key="entry.key"
            :class="optionClasses(entry.option)"
            role="option"
            tabindex="-1"
            :aria-selected="isSelected(entry.option) ? 'true' : 'false'"
            :aria-disabled="disabled || isOptionDisabled(entry.option) ? 'true' : undefined"
            :ref="`option-${index}`"
            @click="select(entry.option)"
          >
            <slot name="option" :option="entry.option" :selected="isSelected(entry.option)">
              <span class="truncate">{{ getOptionLabel(entry.option) }}</span>
            </slot>
            <DsIcon v-if="isSelected(entry.option)" name="check" size="var(--extension-menu-icon-size)" class="text-brand flex-shrink-0" />
          </div>

          <DsButton v-if="hasMoreOptions" variant="ghost" size="sm" block @click.stop="showMoreOptions" @keydown.native.stop>더 보기</DsButton>
          <div v-if="!loading && filteredOptions.length === 0" class="px-3 py-2 text-sm text-text-tertiary text-center">
            결과가 없습니다
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { containsLayer } from "../../layer-host.js";
import { optionKey, nextOptionValue } from "../../../../../shared/package-runtime/options.ts";
import selectState from "./select-state.js";
import selectKeyboard from "./select-keyboard.js";
import { layerMotion } from "../../adapters/layer-motion.js";
import DsButton from "../primitives/Button.vue";
import DsIcon from "../../icon.js";
import DsSpinner from "../feedback/Spinner.vue";
import { componentMixins } from "../../component-mixins.js";
import { SIZES_CORE, oneOf } from '../tokens'
import fieldMixin from './fieldMixin'
import { computeFieldMenuPosition } from '../utils/position'

// 모바일 가상 키보드 상승 구간 동안 viewport resize/scroll에 의한 자동 닫힘을 보류하는 시간
const VIEWPORT_KEYBOARD_GRACE_MS = 400

import { tokens } from "@kjun-ui/tokens";

export default {
  components: { DsButton, DsIcon, DsSpinner },
  name: 'DsSelect',
  inheritAttrs: false,
  mixins: [selectState, selectKeyboard, fieldMixin, ...componentMixins, layerMotion("popup")],
  inject: {
    kjunCompoundControl: { default: null },
    dsFormGroup: {
      default: null
    }
  },
  directives: {
    'click-outside': {
      bind(el, binding) {
        el._clickOutside = (e) => {
          // 선택창 헤더에서 화면이 교체되면 원래 클릭 대상은 이미 제거되어 새 선택창의 외부 클릭이 아니다.
          if (e.target?.isConnected && !containsLayer(el, e.target)) {
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
  props: {
    value: {
      type: [String, Number, Array],
      default: null
    },
    options: {
      type: Array,
      default: () => []
    },
    placeholder: {
      type: String,
      default: '선택'
    },
    // 시각적 label 없이 인라인으로 쓸 때의 접근 이름(DsFormGroup 안에서는 aria-labelledby가 우선)
    ariaLabel: {
      type: String,
      default: ''
    },
    labelKey: {
      type: String,
      default: 'label'
    },
    valueKey: {
      type: String,
      default: 'value'
    },
    size: {
      type: String,
      default: 'md',
      validator: oneOf(SIZES_CORE)
    },
    disabled: {
      type: Boolean,
      default: false
    },
    searchable: {
      type: Boolean,
      default: false
    },
    open: { type: Boolean, default: undefined },
    loading: { type: Boolean, default: false },
    searchPlaceholder: { type: String, default: '검색...' },
    optionPageSize: { type: Number, default: 0 },
    clearable: {
      type: Boolean,
      default: false
    },
    multiple: {
      type: Boolean,
      default: false
    },
    error: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      dropdownStyle: {}
    }
  },
  computed: {
    selectedOption() {
      return this.options.find(option => this.getOptionValue(option) === this.value) ?? null
    },
    hasValue() {
      if (this.multiple) {
        return Array.isArray(this.value) && this.value.length > 0
      }
      return this.value !== null && this.value !== undefined && this.value !== ''
    },
    selectedLabel() {
      if (this.multiple) {
        if (!Array.isArray(this.value) || this.value.length === 0) return ''
        if (this.value.length === 1) {
          const opt = this.options.find(o => this.getOptionValue(o) === this.value[0])
          return opt !== undefined ? this.getOptionLabel(opt) : ''
        }
        return `${this.value.length}개 선택됨`
      }

      const selected = this.options.find(o => this.getOptionValue(o) === this.value)
      return selected !== undefined ? this.getOptionLabel(selected) : ''
    },
    optionEntries() {
      return this.options.map((option, index) => {
        const key = optionKey(option, this.valueKey, index)
        return { option, index, key }
      })
    },
    filteredEntries() {
      if (!this.searchQuery) return this.optionEntries
      const query = this.searchQuery.trim().toLowerCase()
      return this.optionEntries
        .filter(({ option }) => this.getOptionSearchText(option).includes(query))
        .sort((a, b) => this.getSearchRank(a.option, query) - this.getSearchRank(b.option, query) || a.index - b.index)
    },
    filteredOptions() { return this.filteredEntries.map(entry => entry.option) },
    visibleEntries() {
      if (this.loading) return []
      return this.optionPageSize > 0 ? this.filteredEntries.slice(0, this.visibleLimit) : this.filteredEntries
    },
    visibleOptions() { return this.visibleEntries.map(entry => entry.option) },
    hasMoreOptions() { return !this.loading && this.visibleOptions.length < this.filteredOptions.length },
    enabledIndexes() { return this.visibleOptions.flatMap((option, index) => this.isOptionDisabled(option) ? [] : [index]) },
    compoundStyle() {
      if (!this.kjunCompoundControl) return undefined
      const spec = tokens.input[this.kjunCompoundControl()]
      // Padding comes from compound-controls.css, which also aligns the first time value with field text.
      return { height: spec.height + "px", borderRadius: spec.radius + "px" }
    },
    triggerClasses() {
      return [...this.fieldClasses, 'ds-field--select', {
        'ds-field--open': this.isOpen && !this.kjunLayerBlocked,
        'ds-field--clearable': this.clearable && this.hasValue,
      }]
    },
  },
  watch: {
    searchQuery(value) {
      this.visibleLimit = this.optionPageSize
      this.focusedIndex = -1
      if (this.$refs.options) this.$refs.options.scrollTop = 0
      this.$emit('search', value)
    },
    visibleOptions() {
      if (this.isOpen) this.$nextTick(this.updateDropdownPosition)
    },
  },
  beforeDestroy() {
    this.detachViewportListeners()
  },
  methods: {
    showMoreOptions() {
      this.visibleLimit += this.optionPageSize
    },
    getOptionLabel(option) {
      if (typeof option === 'string' || typeof option === 'number') return String(option)
      return option[this.labelKey]
    },
    getOptionValue(option) {
      if (typeof option === 'string' || typeof option === 'number') return option
      return option[this.valueKey]
    },
    getOptionSearchText(option) {
      if (typeof option === 'string' || typeof option === 'number') {
        return String(option).toLowerCase()
      }
      return [
        this.getOptionLabel(option),
        option.base,
        option.symbol,
        option.name,
        option.displayName,
      ].filter(Boolean).join(' ').toLowerCase()
    },
    getSearchRank(option, query) {
      const label = this.getOptionLabel(option).toLowerCase()
      const base = typeof option === 'object' && option.base
        ? String(option.base).toLowerCase()
        : ''
      const symbol = typeof option === 'object' && option.symbol
        ? String(option.symbol).toLowerCase()
        : ''

      const exactName = [option.name, option.displayName].some(name => String(name || '').toLowerCase() === query)
      if (base === query || symbol === query || label === query || exactName) return 0
      if (
        label.startsWith(`${query}/`) ||
        label.startsWith(`${query}-`) ||
        label.startsWith(`${query}_`) ||
        label.startsWith(`${query} `)
      ) {
        return 1
      }
      if (label.startsWith(query) || base.startsWith(query) || symbol.startsWith(query)) return 2
      return 3
    },
    isOptionDisabled(option) {
      if (typeof option === 'object') return option.disabled
      return false
    },
    isSelected(option) {
      const val = this.getOptionValue(option)
      if (this.multiple) {
        return Array.isArray(this.value) && this.value.includes(val)
      }
      return this.value === val
    },
    optionClasses() {
      return 'ds-field-option'
    },
    requestOpen(next) {
      if (next === this.isOpen || (next && this.disabled)) return
      if (typeof this.open !== 'boolean') this.internalOpen = next
      this.$emit('update:open', next)
    },
    toggle() { this.requestOpen(!this.isOpen) },
    handleEscape(event) { if (this.isOpen) { event.stopPropagation(); this.close() } },
    close() {
      this.requestOpen(false)
    },
    select(option) {
      if (this.disabled || this.loading || this.isOptionDisabled(option)) return

      const next = nextOptionValue(this.value, option, this.valueKey, this.multiple)
      this.$emit('input', next)
      this.$emit('change', next)
      if (!this.multiple) this.close()
    },
    clear() {
      if (this.disabled) return
      this.$emit('input', this.multiple ? [] : null)
      this.$emit('change', this.multiple ? [] : null)
      this.$emit('clear')
    },
    updateDropdownPosition() {
      const { trigger, dropdown, options, searchPanel, menuHeader } = this.$refs
      if (!trigger || !dropdown || !options) return
      const menuStyle = getComputedStyle(dropdown)
      const menuInsets = ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth']
        .reduce((sum, key) => sum + parseFloat(menuStyle[key]), 0)
      const listHeight = Math.min(options.scrollHeight, parseFloat(getComputedStyle(options).maxHeight))
      const naturalHeight = listHeight + (searchPanel?.offsetHeight || 0) + (menuHeader?.offsetHeight || 0) + menuInsets
      const position = computeFieldMenuPosition(trigger.getBoundingClientRect(), naturalHeight)
      dropdown.dataset.motionPlacement = position.top < trigger.getBoundingClientRect().top ? 'top' : 'bottom'
      this.dropdownStyle = Object.fromEntries(Object.entries(position).map(([key, value]) => [key, `${value}px`]))
    },
    attachViewportListeners() {
      // 키보드가 올라오면 visual viewport가 줄며 resize(및 input을 보이게 하려는 scroll)
      // 이벤트가 자동 발생하는데, 이를 사용자 동작으로 오인해 닫으면 키보드가 떴다가
      // 즉시 사라진다. 키보드 상승 구간 동안에는 viewport 변화로 인한 닫힘을 보류한다.
      this._suppressViewportClose = this.searchable
      if (this._suppressViewportClose) {
        this._viewportGraceTimer = setTimeout(() => {
          this._suppressViewportClose = false
        }, VIEWPORT_KEYBOARD_GRACE_MS)
      }
      // 스크롤 시 드롭다운을 닫는다. 위치를 따라가게 하면 브라우저 스크롤 이벤트의
      // 비동기 배치(passive/rAF) 때문에 트리거보다 한두 프레임 늦게 움직여 어긋나 보인다.
      this._onScroll = (event) => {
        if (this._suppressViewportClose) {
          this.updateDropdownPosition()
          return
        }
        // 드롭다운 내부 스크롤(옵션 목록 스크롤)은 무시
        const dropdownEl = this.$refs.dropdown
        if (dropdownEl && event.target && dropdownEl.contains(event.target)) return
        this.close()
      }
      this._onResize = () => this.updateDropdownPosition()
      window.addEventListener('scroll', this._onScroll, true)
      window.addEventListener('resize', this._onResize)
      window.visualViewport?.addEventListener('resize', this._onResize)
      window.visualViewport?.addEventListener('scroll', this._onResize)
    },
    detachViewportListeners() {
      if (this._viewportGraceTimer) {
        clearTimeout(this._viewportGraceTimer)
        this._viewportGraceTimer = null
      }
      this._suppressViewportClose = false
      if (this._onScroll) {
        window.removeEventListener('scroll', this._onScroll, true)
        this._onScroll = null
      }
      if (this._onResize) {
        window.removeEventListener('resize', this._onResize)
        window.visualViewport?.removeEventListener('resize', this._onResize)
        window.visualViewport?.removeEventListener('scroll', this._onResize)
        this._onResize = null
      }
    }
  }
}
</script>
<style scoped>
.ds-select-clear {
  right: calc(var(--field-padding) + var(--field-icon-size) + var(--field-affix-gap));
}
.ds-select-indicator {
  font-size: var(--field-icon-size);
}
</style>
