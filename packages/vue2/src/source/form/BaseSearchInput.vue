<template>
  <div class="ds-field-shell w-full" :class="fieldSizeClass" v-click-outside="closeDropdown">
    <DsIcon name="search" class="ds-field-prefix" />
    <input
      ref="input"
      v-bind="$attrs"
      :id="fieldId"
      :value="displayValue"
      type="text"
      :role="isAutocomplete ? 'combobox' : undefined"
      :aria-expanded="isAutocomplete ? String(showDropdown) : undefined"
      :aria-controls="isAutocomplete ? `kjun-search-${_uid}` : undefined"
      :aria-activedescendant="highlightedIndex >= 0 ? `kjun-search-${_uid}-${highlightedIndex}` : undefined"
      :placeholder="placeholder"
      :aria-label="ariaLabel || placeholder"
      :aria-labelledby="fieldLabelledby"
      :aria-describedby="fieldDescribedby"
      :aria-invalid="fieldInvalid ? 'true' : undefined"
      :disabled="disabled"
      :class="inputClasses"
      @input="onInput($event.target.value)"
      @click="onPointerOpen"
      @focus="onFocus"
      @blur="onBlur"
      @compositionstart="composing = true"
      @compositionend="composing = false"
      @keydown.down="highlightNext"
      @keydown.up="highlightPrev"
      @keydown.home="highlightBoundary($event, 0)"
      @keydown.end="highlightBoundary($event, results.length - 1)"
      @keydown.enter="onEnter"
      @keydown.esc="onEscape"
    />
    <DsIcon
      v-if="isAutocomplete && searching && !(clearable && query)"
      name="loader-2"
      spin
      class="ds-field-suffix"
    />
    <div
      v-else-if="clearable && query"
      class="ds-field-suffix"
    >
      <DsButton variant="ghost" size="sm" class="ds-field-clear" prefix-icon="x" aria-label="검색어 지우기" title="검색어 지우기" :disabled="disabled" @click.stop="handleClear" />
    </div>

    <!-- Autocomplete dropdown -->
    <transition name="ds-search-dropdown" :css="false" @before-enter="motionPrepare" @enter="motionEnter" @leave="motionLeave"
      @enter-cancelled="motionCancel" @leave-cancelled="motionCancel">
      <div
        v-kjun-layer.field="'popup'" v-if="showDropdown"
        role="listbox" :id="`kjun-search-${_uid}`" :aria-label="ariaLabel || placeholder"
        class="absolute z-50 w-full mt-1 ds-field-menu max-h-menu-list-max-height overflow-y-auto"
      >
        <!-- Select와 같은 로딩 행: 스피너와 문구를 가운데 정렬한다 -->
        <div v-if="searching" class="flex items-center justify-center gap-2 px-3 py-3 text-sm text-text-secondary" role="status"><DsSpinner size="sm" />검색 중...</div>
        <!-- 요청 실패는 빈 결과와 구분해 오류로 알린다 -->
        <div v-else-if="failed" class="px-3 py-3 text-sm text-danger text-center" role="alert">{{ errorText }}</div>
        <template v-else-if="results.length > 0">
          <div
            v-for="(item, index) in results"
            :key="resultKey(item, index)"
            role="option" :id="`kjun-search-${_uid}-${index}`" :aria-selected="String(index === highlightedIndex)"
            :class="optionClasses(index)"
            @mousedown.prevent="selectItem(item)"
          >
            <slot name="item" :item="item" :index="index">
              <span class="break-words">{{ item[labelField] }}</span>
            </slot>
          </div>
        </template>
        <div v-else class="px-3 py-3 text-sm text-text-tertiary text-center">
          {{ emptyText }}
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { containsLayer } from "../../layer-host.js";
import { layerMotion } from "../../adapters/layer-motion.js";
import DsButton from "../primitives/Button.vue";
import DsIcon from "../../icon.js";
import DsSpinner from "../feedback/Spinner.vue";
import { componentMixins } from "../../component-mixins.js";
import { SIZES_CORE, oneOf } from '../tokens'
import fieldMixin from './fieldMixin'

const API_DEBOUNCE_MS = 300
const BLUR_DELAY_MS = 150
const MIN_SEARCH_CHARS = 2

export default {
  components: { DsButton, DsIcon, DsSpinner },
  name: 'DsSearchInput',
  inheritAttrs: false,
  mixins: [fieldMixin, ...componentMixins, layerMotion("popup")],
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
  props: {
    value: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: '검색...'
    },
    // 접근 가능한 이름(미지정 시 placeholder로 폴백) — 시각적 label이 없는 검색창의 스크린리더 대응
    ariaLabel: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    clearable: {
      type: Boolean,
      default: true
    },
    debounce: {
      type: Number,
      default: 0
    },
    size: {
      type: String,
      default: 'md',
      validator: oneOf(SIZES_CORE)
    },
    loadOptions: { type: Function, default: null },
    itemKey: {
      type: String,
      default: 'id'
    },
    labelField: {
      type: String,
      default: 'name'
    },
    minChars: {
      type: Number,
      default: MIN_SEARCH_CHARS
    },
    emptyText: {
      type: String,
      default: '결과가 없습니다'
    },
    errorText: {
      type: String,
      default: '검색하지 못했습니다. 다시 시도해 주세요.'
    }
  },
  data() {
    return {
      debounceTimer: null,
      searchTimer: null,
      results: [],
      searching: false,
      failed: false,
      isOpen: false,
      highlightedIndex: -1,
      composing: false,
      query: this.value
    }
  },
  watch: {
    value(value) {
      clearTimeout(this.debounceTimer)
      if (value === this.query) return
      this.query = value
      if (this.isAutocomplete && this.isOpen && !this.disabled) this.debouncedSearch(value)
    },
    disabled() {
      clearTimeout(this.debounceTimer)
      this.composing = false
      this.closeDropdown()
    },
    debounce() { clearTimeout(this.debounceTimer) },
    minChars() {
      if (this.isAutocomplete && this.isOpen && !this.disabled) this.debouncedSearch(this.query)
    },
    loadOptions() {
      clearTimeout(this.debounceTimer)
      if (this.isAutocomplete && this.isOpen && !this.disabled) this.debouncedSearch(this.query)
      else {
        this.closeDropdown()
        this.results = []
      }
    },
  },
  computed: {
    isAutocomplete() {
      return !!this.loadOptions
    },
    displayValue() {
      return this.query
    },
    showDropdown() {
      return !this.disabled && this.isAutocomplete && this.isOpen && (
        this.searching || this.results.length > 0 || this.query.length >= this.minChars
      )
    },
    inputClasses() {
      return [...this.fieldClasses, 'ds-field--prefix ds-field--suffix']
    }
  },
  methods: {
    resultKey(item, index) {
      const value = typeof item === 'object' ? item[this.itemKey] : item
      return typeof value === 'string' || typeof value === 'number'
        ? `${typeof value}:${value}` : `index:${index}`
    },
    onInput(val) {
      if (this.disabled) return
      this.query = val
      if (this.isAutocomplete) {
        this.highlightedIndex = -1
        if (!this.isOpen) this.isOpen = true
        this.$emit('input', val)
        this.debouncedSearch(val)
      } else {
        if (this.debounce > 0) {
          clearTimeout(this.debounceTimer)
          this.debounceTimer = setTimeout(() => {
            if (!this.disabled && !this.isAutocomplete) this.$emit('input', val)
          }, this.debounce)
        } else {
          this.$emit('input', val)
        }
      }
    },
    debouncedSearch(val) {
      clearTimeout(this.searchTimer)
      this._searchController?.abort()
      this._requestId = (this._requestId || 0) + 1
      this.results = []
      this.failed = false
      this.highlightedIndex = -1
      if (val.length < this.minChars) {
        this.results = []
        this.searching = false
        return
      }
      this.searching = true
      this.searchTimer = setTimeout(() => {
        this.fetchResults(val)
      }, API_DEBOUNCE_MS)
    },
    async fetchResults(query) {
      this._searchController?.abort()
      const controller = new AbortController()
      this._searchController = controller
      const requestId = this._requestId = (this._requestId || 0) + 1
      try {
        const result = await this.loadOptions(query, { signal: controller.signal })
        if (controller.signal.aborted || requestId !== this._requestId || this.query !== query || query.length < this.minChars) return
        this.results = Array.isArray(result) ? result : []
      } catch (error) {
        if (!controller.signal.aborted && requestId === this._requestId) {
          this.results = []
          this.failed = true
          this.$emit('search-error', error)
        }
      } finally {
        if (requestId === this._requestId) this.searching = false
      }
    },
    selectItem(item) {
      if (this.disabled || this.searching || this.query.length < this.minChars) return
      const label = item[this.labelField] || ''
      this.query = label
      this.$emit('input', label)
      this.$emit('select', item)
      this.closeDropdown()
    },
    highlightBoundary(event, index) {
      if (this.isComposingKey(event) || this.disabled || this.searching || !this.isAutocomplete || !this.isOpen || !this.results.length) return
      event.preventDefault()
      this.highlightedIndex = index
      this.scrollToHighlighted()
    },
    highlightNext(event) {
      if (this.isComposingKey(event) || this.disabled || this.searching || !this.isAutocomplete || !this.isOpen) return
      event.preventDefault()
      if (this.highlightedIndex < this.results.length - 1) {
        this.highlightedIndex++
        this.scrollToHighlighted()
      }
    },
    highlightPrev(event) {
      if (this.isComposingKey(event) || this.disabled || this.searching || !this.isAutocomplete || !this.isOpen) return
      event.preventDefault()
      if (this.highlightedIndex > 0) {
        this.highlightedIndex--
        this.scrollToHighlighted()
      }
    },
    onEnter(event) {
      if (this.isComposingKey(event) || this.disabled || this.searching || !this.isAutocomplete || !this.isOpen) return
      event.preventDefault()
      if (this.highlightedIndex >= 0 && this.highlightedIndex < this.results.length) {
        this.selectItem(this.results[this.highlightedIndex])
      }
    },
    isComposingKey(event) {
      return this.composing || event?.isComposing || event?.keyCode === 229
    },
    onEscape(event) {
      if (this.isComposingKey(event) || this.disabled) return
      if (this.isAutocomplete && this.isOpen) {
        event.preventDefault()
        event.stopPropagation()
        this.closeDropdown()
      } else if (!this.isAutocomplete) {
        this.handleClear()
      }
    },
    scrollToHighlighted() {
      this.$nextTick(() => {
        const dropdown = this.$el.querySelector('.overflow-y-auto')
        const items = dropdown?.children
        const highlighted = items?.[this.highlightedIndex]
        if (highlighted) {
          highlighted.scrollIntoView({ block: 'nearest' })
        }
      })
    },
    onPointerOpen() {
      if (this.disabled || this.isOpen) return
      this.clearRestoredFocus()
      this.onFocus()
    },
    onFocus() {
      clearTimeout(this._blurTimer)
      if (!this.canOpenOnFocus()) return
      if (!this.isAutocomplete) return
      this.query = this.value || ''
      this.isOpen = true
      if (this.query.length >= this.minChars) {
        this.debouncedSearch(this.query)
      }
    },
    onBlur() {
      this.clearRestoredFocus()
      this.composing = false
      if (!this.isAutocomplete) return
      this._blurTimer = setTimeout(() => {
        this.closeDropdown()
      }, BLUR_DELAY_MS)
    },
    closeDropdown() {
      clearTimeout(this._blurTimer)
      clearTimeout(this.searchTimer)
      this._searchController?.abort()
      this._requestId = (this._requestId || 0) + 1
      this.searching = false
      this.isOpen = false
      this.highlightedIndex = -1
    },
    optionClasses(index) {
      return ['ds-field-option', { 'ds-field-option--highlighted': index === this.highlightedIndex }]
    },
    handleClear() {
      if (this.disabled) return
      clearTimeout(this.debounceTimer)
      clearTimeout(this.searchTimer)
      this.results = []
      this.query = ''
      this.$emit('input', '')
      this.$emit('clear')
      if (this.isAutocomplete) {
        this.closeDropdown()
      }
    },
    focus() {
      this.$refs.input?.focus()
    }
  },
  beforeDestroy() {
    this._searchController?.abort()
    this._requestId = (this._requestId || 0) + 1
    clearTimeout(this.debounceTimer)
    clearTimeout(this.searchTimer)
    clearTimeout(this._blurTimer)
  }
}
</script>

<style scoped></style>
