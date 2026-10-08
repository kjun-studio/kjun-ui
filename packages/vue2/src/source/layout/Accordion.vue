<template>
  <div class="ds-accordion kjun-accordion" :data-tone="tone">
    <slot></slot>
  </div>
</template>

<script>
import { componentMixins } from "../../component-mixins.js";
export default {
  mixins: componentMixins,
  name: 'DsAccordion',
  provide() {
    return {
      accordion: this
    }
  },
  props: {
    multiple: {
      type: Boolean,
      default: false
    },
    tone: {
      type: String,
      default: 'card',
      validator: (v) => ['card', 'muted'].includes(v)
    }
  },
  data() {
    return {
      openItems: []
    }
  },
  watch: {
    multiple(value) { if (!value && this.openItems.length > 1) this.openItems = this.openItems.slice(-1) }
  },
  methods: {
    toggleItem(id) {
      const idx = this.openItems.indexOf(id)
      if (idx > -1) {
        this.openItems.splice(idx, 1)
      } else {
        if (!this.multiple) {
          this.openItems = [id]
        } else {
          this.openItems.push(id)
        }
      }
    },
    isOpen(id) {
      return this.openItems.includes(id)
    },
    registerDefault(id) {
      if (!this.openItems.includes(id) && (this.multiple || !this.openItems.length)) {
        this.openItems.push(id)
      }
    },
    unregisterItem(id) {
      this.openItems = this.openItems.filter(item => item !== id)
    }
  }
}
</script>
