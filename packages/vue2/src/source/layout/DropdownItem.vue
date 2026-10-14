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
    <KjunIcon v-if="icon" :name="icon" class="kjun-dropdown-icon kj-w-menu-icon-size kj-h-menu-icon-size kj-flex-shrink-0" />
    <span class="kjun-dropdown-label"><slot></slot></span>
    <span v-if="selected !== null" class="kj-flex-shrink-0 kj-inline-flex" aria-hidden="true">
      <KjunIcon name="check" class="kj-w-menu-icon-size kj-h-menu-icon-size kj-text-brand" :class="{ 'kj-invisible': !selected }" />
    </span>
  </button>
</template>

<script>
import KjunIcon from "../../icon.js";
import { componentMixins } from "../../component-mixins.js";
export default {
  mixins: componentMixins,
  components: { KjunIcon },
  name: 'KjunDropdownItem',
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
      const base = 'kjun-dropdown-item kj-w-full kj-flex kj-items-center kj-text-left kj-transition-colors'

      const variants = {
        default: 'kj-text-text-primary',
        danger: 'kj-text-danger'
      }

      const disabled = this.disabled ? 'kj-opacity-disabled kj-cursor-not-allowed' : ''

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
