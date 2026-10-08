<template>
  <button
    type="button"
    draggable="false"
    :class="itemClasses"
    :disabled="disabled"
    :role="selected === null ? 'menuitem' : 'menuitemradio'"
    :aria-checked="selected === null ? undefined : String(selected)"
    :data-variant="variant"
    tabindex="-1"
    @click="handleClick"
    @mousemove="handlePointer"
  >
    <DsIcon v-if="icon" :name="icon" class="ds-dropdown-icon w-menu-icon-size h-menu-icon-size flex-shrink-0" />
    <span class="ds-dropdown-label"><slot></slot></span>
    <span v-if="selected !== null" class="flex-shrink-0 inline-flex" aria-hidden="true">
      <DsIcon name="check" class="w-menu-icon-size h-menu-icon-size text-brand" :class="{ invisible: !selected }" />
    </span>
  </button>
</template>

<script>
import DsIcon from "../../icon.js";
import { componentMixins } from "../../component-mixins.js";
export default {
  mixins: componentMixins,
  components: { DsIcon },
  name: 'DsDropdownItem',
  inject: ['dropdown'],
  props: {
    variant: {
      type: String,
      default: 'default',
      validator: (v) => ['default', 'danger'].includes(v)
    },
    icon: {
      type: String,
      default: null
    },
    disabled: {
      type: Boolean,
      default: false
    },
    // null은 실행 항목, true/false는 현재 값을 고르는 단일 선택 항목이다.
    selected: {
      type: Boolean,
      default: null
    }
  },
  computed: {
    itemClasses() {
      const base = 'ds-dropdown-item w-full flex items-center text-left transition-colors'

      const variants = {
        default: 'text-text-primary',
        danger: 'text-danger'
      }

      const disabled = this.disabled ? 'opacity-disabled cursor-not-allowed' : ''

      return [base, variants[this.variant], disabled].filter(Boolean).join(' ')
    }
  },
  methods: {
    // The pointer takes over the current item so keyboard focus and hover never mark two items.
    handlePointer() {
      if (!this.disabled && document.activeElement !== this.$el) this.$el.focus({ preventScroll: true })
    },
    handleClick(e) {
      if (this.disabled) return
      this.$emit('click', e)
      this.dropdown.close()
    }
  }
}
</script>

<style scoped>
@media (pointer: coarse) {
  button {
    min-height: var(--_kjun-geometry-native-minimum-touch-target);
    -webkit-user-drag: none;
    touch-action: manipulation;
  }
}
</style>
