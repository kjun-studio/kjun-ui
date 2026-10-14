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
  name: 'KjunBadge',
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
      const base = 'kjun-badge kj-max-w-full kj-min-w-0 kj-inline-flex kj-items-center kj-whitespace-normal kj-font-semibold kj-rounded-badge'

      const variants = {
        default: 'kj-bg-bg-secondary kj-text-text-secondary',
        secondary: 'kj-bg-bg-secondary kj-text-text-secondary',
        primary: 'kj-bg-brand-subtle-bg kj-text-brand-hover',
        success: 'kj-bg-success-bg kj-text-success',
        warning: 'kj-bg-warning-bg kj-text-warning',
        danger: 'kj-bg-danger-bg kj-text-danger',
        info: 'kj-bg-info-bg kj-text-info',
        // 시세/손익 배지 — 한국식/미국식 테마 토큰을 그대로 따른다 (success/danger 혼용 금지)
        'price-up': 'kj-bg-price-up-bg kj-text-price-up',
        'price-down': 'kj-bg-price-down-bg kj-text-price-down'
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
