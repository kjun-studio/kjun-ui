<template>
  <DsDropdown
    ref="dropdown"
    :placement="placement"
    :disabled="disabled || loading"
    :menu-id="menuId"
    :trigger-id="triggerId"
    menu-class="ds-menu-button__menu"
    class="ds-menu-button inline-flex"
    @open="onOpen"
    @close="onClose"
  >
    <template #trigger>
      <DsTooltip
        v-if="tooltip"
        :content="isOpen ? '' : tooltip"
        :placement="tooltipPlacement"
        :delay="tooltipDelay"
      >
        <DsButton
          :id="triggerId"
          :size="size"
          :variant="variant"
          :disabled="disabled"
          :loading="loading"
          :prefix-icon="iconOnly ? 'dots-vertical' : undefined"
          :suffix-icon="iconOnly ? undefined : isOpen ? 'chevron-up' : 'chevron-down'"
          :aria-label="accessibleLabel"
          aria-haspopup="menu"
          :aria-expanded="String(isOpen)"
          :aria-controls="isOpen ? menuId : undefined"
          class="kjun-menu-button"
          @click.stop
        >
          <template v-if="!iconOnly"><slot name="label">{{ label }}</slot></template>
        </DsButton>
      </DsTooltip>
      <DsButton
        :id="triggerId"
        v-else
        :size="size"
        :variant="variant"
        :disabled="disabled"
        :loading="loading"
        :prefix-icon="iconOnly ? 'dots-vertical' : undefined"
        :suffix-icon="iconOnly ? undefined : isOpen ? 'chevron-up' : 'chevron-down'"
        :aria-label="accessibleLabel"
        aria-haspopup="menu"
        :aria-expanded="String(isOpen)"
        :aria-controls="isOpen ? menuId : undefined"
        class="kjun-menu-button"
        @click.stop
      >
        <template v-if="!iconOnly"><slot name="label">{{ label }}</slot></template>
      </DsButton>
    </template>
    <slot></slot>
  </DsDropdown>
</template>

<script>
import DsButton from "./Button.vue";
import DsDropdown from "../layout/Dropdown.vue";
import DsTooltip from "../data-display/Tooltip.vue";
import { componentMixins } from "../../component-mixins.js";
import { SIZES_EXTENDED, oneOf } from '../tokens'

// "값/모드를 골라 실행하는" 메뉴 버튼 — 트리거(라벨+chevron)와 DsDropdown 배선을 표준화한다.
// 버튼이 아닌 임의 트리거(테이블 행 long-press 등)는 DsDropdown을 직접 사용한다.
// compact는 라벨을 접근성 이름으로 유지하는 정사각형 더보기 버튼이다.
export default {
  mixins: componentMixins,
  components: { DsButton, DsDropdown, DsTooltip },
  name: 'DsMenuButton',
  props: {
    // 트리거 라벨 텍스트. 아이콘/스와치 등 비텍스트 라벨은 #label 슬롯 사용.
    label: {
      type: String,
      default: ''
    },
    size: {
      type: String,
      default: 'md',
      validator: oneOf(SIZES_EXTENDED)
    },
    variant: {
      type: String,
      default: 'secondary'
    },
    // true면 텍스트 대신 dots-vertical 아이콘을 표시한다.
    compact: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    // hover 힌트. 메뉴가 열려 있는 동안은 자동 억제된다.
    tooltip: {
      type: String,
      default: ''
    },
    tooltipPlacement: {
      type: String,
      default: 'top',
      validator: (v) => ['top', 'bottom', 'left', 'right'].includes(v)
    },
    tooltipDelay: {
      type: Number,
      default: 0
    },
    ariaLabel: {
      type: String,
      default: ''
    },
    placement: {
      type: String,
      default: 'bottom-start'
    }
  },
  data() {
    return {
      isOpen: false
    }
  },
  computed: {
    triggerId() {
      return `ds-menu-button-trigger-${this._uid}`
    },
    menuId() {
      return `ds-menu-button-menu-${this._uid}`
    },
    iconOnly() { return this.compact || (!this.label && !this.$slots.label && !this.$scopedSlots.label) },
    accessibleLabel() { return this.ariaLabel || this.label || this.tooltip || (this.iconOnly ? '메뉴' : undefined) }
  },
  methods: {
    onOpen() {
      this.isOpen = true
      this.$emit('open')
    },
    onClose() {
      this.isOpen = false
      this.$emit('close')
    },
    // 패널형 콘텐츠(DsDropdownItem이 아닌 슬롯)에서 선택 후 수동으로 닫을 때 사용
    close() {
      this.$refs.dropdown?.close()
    }
  }
}
</script>

<style scoped>
</style>
