<template>
  <div class="relative min-w-0" v-click-outside="close">
    <!-- Input Trigger -->
    <div class="ds-field-shell" :class="fieldSizeClass">
      <DsIcon name="search" class="ds-field-prefix" />
      <input
        ref="input"
        v-bind="$attrs"
        :id="fieldId"
        :value="inputDisplayValue"
        type="text"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="inputClasses"
        role="combobox"
        aria-autocomplete="list"
        :aria-label="ariaLabel || undefined"
        :aria-labelledby="fieldLabelledby"
        :aria-describedby="fieldDescribedby"
        :aria-invalid="fieldInvalid ? 'true' : undefined"
        :aria-expanded="String(isOpen)"
        :aria-controls="`combobox-options-${_uid}`"
        :aria-activedescendant="isOpen && highlightedIndex >= 0 ? `combobox-option-${_uid}-${highlightedIndex}` : undefined"
        @input="onInput($event.target.value)"
        @click="onPointerOpen"
      @focus="onFocus"
        @blur="onBlur"
        @compositionstart="composing = true"
        @compositionend="composing = false"
        @keydown.down="highlightNext"
        @keydown.up="highlightPrev"
        @keydown.home="highlightBoundary($event, false)"
        @keydown.end="highlightBoundary($event, true)"
        @keydown.enter="selectHighlighted"
        @keydown.esc="handleEscape"
      />
      <div
        v-if="showClear"
        class="ds-field-suffix"
      >
        <DsButton variant="ghost" size="sm" class="ds-field-clear" prefix-icon="x" aria-label="선택 지우기" title="선택 지우기" :disabled="disabled" @click.stop="clear" />
      </div>
    </div>

    <!-- Dropdown -->
    <transition name="ds-combobox-dropdown" :css="false" @before-enter="motionPrepare" @enter="motionEnter" @leave="motionLeave"
      @enter-cancelled="motionCancel" @leave-cancelled="motionCancel">
      <div v-kjun-layer.field="'popup'" v-if="isOpen" :id="`combobox-options-${_uid}`" role="listbox" class="absolute z-50 w-full mt-1 ds-field-menu max-h-menu-list-max-height overflow-y-auto">
        <div
          v-for="(option, index) in filteredOptions"
          :key="getOptionValue(option)"
          :id="`combobox-option-${_uid}-${index}`"
          role="option"
          :aria-selected="String(isSelected(option))"
          :aria-disabled="isOptionDisabled(option) ? 'true' : undefined"
          :class="optionClasses(option, index)"
          @mousedown.prevent="selectOption(option)"
        >
          <slot name="option" :option="option" :index="index">
            <span class="truncate">{{ getOptionLabel(option) }}</span>
          </slot>
          <DsIcon v-if="isSelected(option)" name="check" size="var(--extension-menu-icon-size)" class="text-brand flex-shrink-0" />
        </div>

        <div v-if="filteredOptions.length === 0" class="px-3 py-3 text-sm text-text-tertiary text-center">
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
import { componentMixins } from "../../component-mixins.js";
import { SIZES_CORE, oneOf } from '../tokens'
import fieldMixin from './fieldMixin'

export default {
  components: { DsButton, DsIcon },
  name: 'DsCombobox',
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
      type: [String, Number],
      default: null
    },
    options: {
      type: Array,
      default: () => []
    },
    placeholder: {
      type: String,
      default: '검색 또는 선택'
    },
    labelKey: {
      type: String,
      default: 'label'
    },
    valueKey: {
      type: String,
      default: 'value'
    },
    filterFn: {
      type: Function,
      default: null
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
    clearable: {
      type: Boolean,
      default: false
    },
    emptyText: {
      type: String,
      default: '결과가 없습니다'
    }
  },
  data() {
    return {
      isOpen: false,
      query: '',
      highlightedIndex: -1,
      composing: false,
      isSelecting: false
    }
  },
  computed: {
    hasValue() {
      return this.value !== null && this.value !== undefined && this.value !== ''
    },
    inputDisplayValue() {
      if (this.isOpen) return this.query
      if (this.hasValue) {
        const selected = this.options.find(o => this.getOptionValue(o) === this.value)
        return selected !== undefined ? this.getOptionLabel(selected) : ''
      }
      return ''
    },
    filteredOptions() {
      if (!this.query) return this.options

      if (this.filterFn) {
        return this.options.filter(o => this.filterFn(o, this.query))
      }

      const q = this.query.toLowerCase()
      return this.options.filter(o =>
        this.getOptionLabel(o).toLowerCase().includes(q)
      )
    },
    // Same contract as React/Native: the button follows the visible text (draft or selection).
    showClear() {
      return this.clearable && !this.disabled && this.inputDisplayValue !== ''
    },
    inputClasses() {
      return [...this.fieldClasses, 'ds-field--prefix', { 'ds-field--suffix': this.showClear, 'ds-field--open': this.isOpen }]
    }
  },
  watch: {
    disabled(value) { if (value) this.close() },
    filteredOptions() { this.highlightedIndex = -1 },
  },
  methods: {
    isOptionDisabled(option) {
      return this.disabled || !!(option && typeof option === 'object' && option.disabled)
    },
    getOptionLabel(option) {
      if (typeof option === 'string' || typeof option === 'number') return String(option)
      return option[this.labelKey]
    },
    getOptionValue(option) {
      if (typeof option === 'string' || typeof option === 'number') return option
      return option[this.valueKey]
    },
    isSelected(option) {
      return this.value === this.getOptionValue(option)
    },
    optionClasses(option, index) {
      return ['ds-field-option', { 'ds-field-option--highlighted': index === this.highlightedIndex }]
    },
    onInput(val) {
      this.query = val
      this.highlightedIndex = -1
      if (!this.isOpen) this.isOpen = true
      // 자유 입력을 허용하는 소비처(예: chain_key 제안+직접 입력)가 타이핑 값을 받을 수 있도록 노출.
      // 기존 v-model 계약(input=선택 확정)은 그대로 유지된다.
      this.$emit('search', val)
    },
    onPointerOpen() {
      if (this.disabled || this.isOpen) return
      this.clearRestoredFocus()
      this.onFocus()
    },
    onFocus() {
      clearTimeout(this._blurTimer)
      if (!this.canOpenOnFocus()) return
      if (this.disabled) return
      this.isOpen = true
      // 포커스 시 현재 선택된 값의 라벨을 query에 설정
      if (this.hasValue) {
        const selected = this.options.find(o => this.getOptionValue(o) === this.value)
        this.query = selected !== undefined ? this.getOptionLabel(selected) : ''
      } else {
        this.query = ''
      }
    },
    onBlur() {
      this.clearRestoredFocus()
      this.composing = false
      // mousedown.prevent로 인해 클릭 시에는 blur가 발생하지 않음
      clearTimeout(this._blurTimer)
      this._blurTimer = setTimeout(() => {
        if (!this.isSelecting) {
          this.close()
        }
      }, 150)
    },
    isComposingKey(event) {
      return this.composing || event?.isComposing || event?.keyCode === 229
    },
    handleEscape(event) {
      if (this.isComposingKey(event)) return
      if (this.isOpen) { event.preventDefault(); event.stopPropagation(); this.close() }
    },
    close() {
      clearTimeout(this._blurTimer)
      this.composing = false
      this.isOpen = false
      this.query = ''
      this.highlightedIndex = -1
    },
    selectOption(option) {
      if (this.isOptionDisabled(option)) return
      this.isSelecting = true
      const val = this.getOptionValue(option)
      this.$emit('input', val)
      this.$emit('change', val)
      this.close()
      this.$nextTick(() => {
        this.isSelecting = false
      })
    },
    clear() {
      if (this.disabled) return
      this.close()
      this.$emit('input', null)
      this.$emit('change', null)
      this.$emit('clear')
    },
    highlightNext(event) {
      if (this.isComposingKey(event) || this.disabled) return
      event.preventDefault()
      this.moveHighlight(1)
    },
    highlightPrev(event) {
      if (this.isComposingKey(event) || this.disabled) return
      event.preventDefault()
      this.moveHighlight(-1)
    },
    moveHighlight(direction) {
      if (this.disabled) return
      this.isOpen = true
      const start = this.highlightedIndex < 0 && direction < 0 ? this.filteredOptions.length : this.highlightedIndex
      for (let index = start + direction; index >= 0 && index < this.filteredOptions.length; index += direction) {
        if (!this.isOptionDisabled(this.filteredOptions[index])) { this.highlightedIndex = index; break }
      }
    },
    highlightBoundary(event, last) {
      // Preserve text-editing Home/End when no option is active.
      if (this.isComposingKey(event) || !this.isOpen || this.highlightedIndex < 0) return
      event.preventDefault()
      this.highlightedIndex = last ? this.filteredOptions.length : -1
      this.moveHighlight(last ? -1 : 1)
    },
    selectHighlighted(event) {
      if (this.isComposingKey(event) || this.disabled || !this.isOpen) return
      if (this.highlightedIndex >= 0 && this.highlightedIndex < this.filteredOptions.length) {
        event.preventDefault()
        this.selectOption(this.filteredOptions[this.highlightedIndex])
      }
    }
  },
  beforeDestroy() { clearTimeout(this._blurTimer) }
}
</script>

<style scoped></style>
