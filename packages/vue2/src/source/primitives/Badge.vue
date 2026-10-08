<template>
  <span :class="badgeClasses" :style="badgeStyle">
    <span v-if="dot" class="kjun-badge-dot" aria-hidden="true"></span>
    <slot></slot>
  </span>
</template>

<script>
import { tokens } from "@kjun-ui/tokens";
import { componentMixins } from "../../component-mixins.js";
import { domainColorMixin } from "../../domain-colors.js";
import { SIZES_EXTENDED, SEMANTIC_VARIANTS, oneOf } from '../tokens'

export default {
  mixins: [...componentMixins, domainColorMixin(vm => vm.variant.startsWith('price-'))],
  name: 'DsBadge',
  props: {
    variant: {
      type: String,
      default: 'default',
      validator: oneOf(['default', 'secondary', 'primary', ...SEMANTIC_VARIANTS, 'price-up', 'price-down'])
    },
    size: {
      type: String,
      default: 'sm',
      validator: oneOf(SIZES_EXTENDED)
    },
    dot: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    badgeStyle() { const { x, y } = tokens.extensions.badge.padding[this.size]; return { padding: `${y}px ${x}px`, gap: tokens.extensions.badge.gap + "px" }; },
    badgeClasses() {
      const base = 'ds-badge max-w-full min-w-0 inline-flex items-center whitespace-normal font-semibold rounded-badge'

      const variants = {
        default: 'bg-bg-secondary text-text-secondary',
        secondary: 'bg-bg-secondary text-text-secondary',
        primary: 'bg-brand-subtle-bg text-brand-hover',
        success: 'bg-success-bg text-success',
        warning: 'bg-warning-bg text-warning',
        danger: 'bg-danger-bg text-danger',
        info: 'bg-info-bg text-info',
        // 시세/손익 배지 — 한국식/미국식 테마 토큰을 그대로 따른다 (success/danger 혼용 금지)
        'price-up': 'bg-price-up-bg text-price-up',
        'price-down': 'bg-price-down-bg text-price-down'
      }

      const sizes = {
        xs: 'kjun-type-control-small',
        sm: 'kjun-type-control-small',
        md: 'kjun-type-control-small',
        lg: 'kjun-type-control',
        xl: 'kjun-type-control-large'
      }

      return [base, variants[this.variant], sizes[this.size]].join(' ')
    }
  }
}
</script>
