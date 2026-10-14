<template>
  <div :class="wrapperClasses">
    <svg :class="spinnerClasses" viewBox="0 0 24 24" fill="none">
      <!-- Same track and quarter arc as React and Native, with a size-specific stroke weight. -->
      <circle cx="12" cy="12" r="10" stroke="currentColor" :stroke-width="stroke" opacity=".25" />
      <path d="M22 12A10 10 0 0 0 12 2" stroke="currentColor" :stroke-width="stroke" />
    </svg>
    <span v-if="$slots.default || text" :class="textClasses">
      <slot>{{ text }}</slot>
    </span>
  </div>
</template>

<script>
import { tokens } from "@kjun-ui/tokens";
import { componentMixins } from "../../component-mixins.js";
import { SIZES_EXTENDED, oneOf } from '../tokens'

export default {
  mixins: componentMixins,
  name: 'KjunSpinner',
  props: {
    size: {
      type: String,
      default: 'md',
      validator: oneOf(SIZES_EXTENDED)
    },
    text: {
      type: String,
      default: ''
    }
  },
  computed: {
    stroke() { return (tokens.extensions.spinner.strokeWidths[this.size] * 24) / tokens.extensions.spinner.sizes[this.size] },
    wrapperClasses() {
      return 'kj-inline-flex kj-items-center'
    },
    spinnerClasses() {
      const sizes = {
        xs: 'kj-w-spinner-sizes-xs kj-h-spinner-sizes-xs',
        sm: 'kj-w-spinner-sizes-sm kj-h-spinner-sizes-sm',
        md: 'kj-w-spinner-sizes-md kj-h-spinner-sizes-md',
        lg: 'kj-w-spinner-sizes-lg kj-h-spinner-sizes-lg',
        xl: 'kj-w-spinner-sizes-xl kj-h-spinner-sizes-xl'
      }
      return ['kj-animate-spin kj-text-brand', sizes[this.size]].join(' ')
    },
    textClasses() {
      return 'kj-ml-2 kj-text-sm kj-text-text-secondary'
    }
  }
}
</script>
