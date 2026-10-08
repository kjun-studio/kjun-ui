<template>
  <button
    :type="htmlType"
    class="kjun-button"
    :style="buttonStyle"
    :disabled="disabled || effectiveLoading"
    :aria-busy="effectiveLoading || undefined"
    :aria-label="ariaLabel || undefined"
    :data-variant="variant"
    :data-size="buttonSize"
    :data-disabled="String(disabled)"
    @click.stop="handleClick"
  >
    <ds-icon v-if="prefixIcon" :name="prefixIconName" :spin="effectiveLoading"
      :filled="!effectiveLoading && prefixIconFilled" :size="iconSize" />
    <span class="kjun-button-label" :style="{ opacity: overlayLoading ? 0 : 1 }"><slot /></span>
    <ds-icon v-if="suffixIcon" :name="effectiveLoading && !prefixIcon ? 'loader-2' : suffixIcon"
      :filled="!effectiveLoading && suffixIconFilled" :spin="effectiveLoading && !prefixIcon"
      :size="iconSize" :style="{ opacity: effectiveLoading && prefixIcon ? 0 : 1 }" />
    <span v-if="overlayLoading" class="kjun-button-loader" aria-hidden="true">
      <ds-icon name="loader-2" spin :size="iconSize" />
    </span>
  </button>
</template>
<script>
import DsIcon from "../../icon.js";
import { componentMixins } from "../../component-mixins.js";
import { tokens } from '@kjun-ui/tokens';
import { SIZES_EXTENDED, oneOf } from '../tokens'

export default {
  mixins: componentMixins,
  components: { DsIcon },
  name: 'DsButton',
  inject: { kjunTopNavigation: { default: null }, kjunActionSize: { default: null } },
  props: {
    // primary/secondary/ghost/danger-ghost는 버튼 전용 인터랙션 variant
    variant: {
      type: String,
      default: 'primary',
      validator: oneOf(['primary', 'secondary', 'ghost', 'danger', 'danger-ghost', 'success', 'warning'])
    },
    size: {
      type: String,
      default: 'md',
      validator: oneOf(SIZES_EXTENDED)
    },
    htmlType: {
      type: String,
      default: 'button'
    },
    disabled: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    block: {
      type: Boolean,
      default: false
    },
    prefixIcon: {
      type: String,
      default: null
    },
    suffixIcon: {
      type: String,
      default: null
    },
    prefixIconFilled: {
      type: Boolean,
      default: false
    },
    suffixIconFilled: {
      type: Boolean,
      default: false
    },
    ariaLabel: {
      type: String,
      default: null
    },
    spinOnLoading: {
      type: Boolean,
      default: null
    }
  },
  data() {
    return {
      hasSlotContent: false,
      extendedLoading: false,
    }
  },
  watch: {
    loading(newVal) {
      clearTimeout(this._extendTimer)
      if (newVal) {
        this._loadingStartedAt = Date.now()
        this.extendedLoading = true
      } else {
        const remaining = Math.max(0, tokens.button.loadingMinimum - (Date.now() - (this._loadingStartedAt || 0)))
        this._extendTimer = setTimeout(() => { this.extendedLoading = false }, remaining)
      }
    },
  },
  created() {
    if (this.loading) {
      this._loadingStartedAt = Date.now()
      this.extendedLoading = true
    }
  },
  beforeDestroy() { clearTimeout(this._extendTimer) },
  computed: {
    // An explicit size wins; unsized buttons follow their action container.
    buttonSize() {
      // Read size first so a later explicit size re-evaluates this value.
      const size = this.size
      const explicit = Object.prototype.hasOwnProperty.call(this.$options.propsData || {}, 'size')
      return (!explicit && this.kjunActionSize && this.kjunActionSize()) || size
    },
    effectiveLoading() { return this.loading || this.extendedLoading },
    overlayLoading() { return this.effectiveLoading && !this.prefixIcon && !this.suffixIcon },
    prefixIconName() {
      const spin = this.spinOnLoading === null ? this.prefixIcon === 'refresh' : this.spinOnLoading
      return this.effectiveLoading && !spin ? 'loader-2' : this.prefixIcon
    },
    isIconOnly() { return !this.hasSlotContent && !!(this.prefixIcon || this.suffixIcon || this.effectiveLoading) },
    iconSize() { return String(this.kjunTopNavigation ? this.kjunTopNavigation.iconSize : tokens.button.iconSizes[this.buttonSize]) },
    buttonStyle() {
      const height = Math.max(tokens.button.heights[this.buttonSize], this.kjunTopNavigation ? this.kjunTopNavigation.controlSize : 0)
      const contentHeight = Math.max(this.hasSlotContent ? tokens.button.typography[this.buttonSize].lineHeightPx : 0,
        this.prefixIcon || this.suffixIcon || (!this.hasSlotContent && this.effectiveLoading) ? Number(this.iconSize) : 0)
      // Icon glyphs carry their own side bearing, so the icon side takes a tighter inset.
      const paddingX = tokens.button.paddingX[this.buttonSize]
      const iconSide = tokens.button.iconSidePaddingX[this.buttonSize]
      return {
        height: height + 'px', minHeight: height + 'px',
        width: this.block ? '100%' : this.isIconOnly ? height + 'px' : undefined,
        minWidth: this.hasSlotContent && !this.block ? tokens.button.minWidths[this.buttonSize] + 'px' : undefined,
        padding: this.isIconOnly ? 0 : '0 ' + (this.suffixIcon ? iconSide : paddingX) + 'px 0 '
          + (this.prefixIcon ? iconSide : paddingX) + 'px',
        fontSize: tokens.button.typography[this.buttonSize].fontSizePx / 16 + 'rem',
        lineHeight: tokens.button.typography[this.buttonSize].lineHeightPx / 16 + 'rem',
        fontWeight: tokens.button.typography[this.buttonSize].fontWeight,
        letterSpacing: tokens.button.typography[this.buttonSize].letterSpacingEm + 'em',
        borderRadius: tokens.button.radii[this.buttonSize] + 'px',
        gap: this.hasSlotContent ? tokens.button.contentGaps[this.buttonSize] + 'px' : 0,
        ...(this.kjunTopNavigation ? { height: 'auto', maxWidth: '100%',
          paddingBlock: Math.max(0, (height - contentHeight) / 2) + 'px' } : {}),
      }
    },
  },
  mounted() {
    this.checkSlotContent()
  },
  updated() {
    this.checkSlotContent()
  },
  methods: {
    checkSlotContent() {
      const slotNodes = this.$slots.default
      this.hasSlotContent = Array.isArray(slotNodes) && slotNodes.some(
        node => node.tag || (node.text && node.text.trim())
      )
    },
    handleClick(e) {
      if (!this.disabled && !this.effectiveLoading) {
        this.$emit('click', e)
      }
    }
  }
}
</script>
