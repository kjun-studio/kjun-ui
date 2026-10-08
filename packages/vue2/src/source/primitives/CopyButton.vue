<template>
  <button
    type="button"
    :class="buttonClasses"
    :style="buttonStyle"
    :data-inline="String(inline)"
    :disabled="disabled"
    :aria-label="ariaLabel || text || '복사'"
    @click.stop="copyToClipboard"
  >
    <DsIcon :name="copied ? 'check' : 'copy'" :size="iconSize" :class="copied ? 'text-success' : ''" />
    <span v-if="text && !inline">{{ copied ? successText : text }}</span>
    <span v-if="!kjunFeedback" class="kjun-sr-only" role="status">{{ copied ? successText : failed ? '복사 실패' : '' }}</span>
  </button>
</template>

<script>
import DsIcon from "../../icon.js";
import { componentMixins } from "../../component-mixins.js";
import { tokens } from '@kjun/tokens'
import { CONTROL_ICON_SIZES } from '../tokens'

export default {
  mixins: componentMixins,
  components: { DsIcon },
  name: 'DsCopyButton',
  props: {
    ariaLabel: { type: String, default: '' },
    copyText: { type: Function, default: null },
    value: {
      type: String,
      required: true
    },
    text: {
      type: String,
      default: null
    },
    successText: {
      type: String,
      default: '복사됨'
    },
    inline: {
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      default: 'sm',
      validator: (v) => ['xs', 'sm', 'md'].includes(v)
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      copied: false,
      failed: false,
      copiedTimer: null
    }
  },
  computed: {
    iconSize() {
      return String(CONTROL_ICON_SIZES[this.size])
    },
    buttonClasses() {
      // 색·hover·focus-visible·disabled는 React와 같은 .kjun-copy-button 규칙을 공유한다.
      return ['kjun-copy-button', this.size === 'xs' ? 'text-xs' : 'text-sm']
    },
    buttonStyle() {
      const d = tokens.dimension
      // 높이는 Button 크기 체계를 따르고, 가로 여백만 크기별로 둔다.
      return { minHeight: tokens.button.heights[this.size] + 'px', paddingBlock: 0, paddingInline: { xs: d.value4, sm: d.value8, md: d.value12 }[this.size] + 'px' }
    }
  },
  methods: {
    async copyToClipboard() {
      if (this.disabled || this.copied) return

      try {
        if (this.copyText) {
          await this.copyText(this.value)
        } else if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(this.value)
        } else {
          this._fallbackCopy(this.value)
        }
        this.copied = true
        this.failed = false
        this.$toast.success(this.successText)
        this.$emit('copied', this.value)

        clearTimeout(this.copiedTimer)
        this.copiedTimer = setTimeout(() => {
          this.copied = false
        }, 1500)
      } catch (err) {
        this.failed = true
        this.$toast.error('복사 실패')
        this.$emit('copy-error', err)
      }
    },
    _fallbackCopy(text) {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px'
      document.body.appendChild(ta)
      try {
        ta.select()
        if (!document.execCommand('copy')) throw Error('Clipboard copy failed')
      } finally { document.body.removeChild(ta) }
    }
  },
  beforeDestroy() {
    clearTimeout(this.copiedTimer)
  }
}
</script>
