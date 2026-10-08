<template>
  <div class="ds-accordion-item">
    <!-- Header -->
    <button
      type="button"
      :id="'accordion-header-' + itemId"
      class="kjun-accordion-trigger"
      :disabled="disabled"
      :aria-expanded="String(isItemOpen)"
      :aria-controls="'accordion-panel-' + itemId"
      @click.stop="toggle"
    >
      <div class="kjun-accordion-heading">
        <slot name="header">
          <span>{{ title }}</span>
        </slot>
      </div>
      <DsIcon name="chevron-down" :size="iconSize" class="kjun-accordion-chevron" :style="{ transform: isItemOpen ? 'rotate(180deg)' : undefined }" />
    </button>

    <!-- Content -->
    <transition
      name="ds-accordion-content"
      :css="false"
      @before-enter="prepareCollapse"
      @enter-cancelled="stopCollapse"
      @leave-cancelled="stopCollapse"
      @enter="onEnter"
      @after-enter="onAfterEnter"
      @leave="onLeave"
    >
      <div
        v-if="isItemOpen"
        ref="panel"
        :inert="!isItemOpen"
        :aria-hidden="!isItemOpen ? 'true' : null"
        :id="'accordion-panel-' + itemId"
        role="region"
        :aria-labelledby="'accordion-header-' + itemId"
        class="ds-accordion-content"
      >
        <div class="kjun-accordion-panel">
          <slot></slot>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { prepareCollapse, stopCollapse, moveCollapse } from "../../adapters/collapse-motion.js";
import DsIcon from "../../icon.js";
import { tokens } from "@kjun/tokens";
import { componentMixins } from "../../component-mixins.js";
let accordionItemUid = 0

export default {
  mixins: componentMixins,
  components: { DsIcon },
  name: 'DsAccordionItem',
  inject: {
    accordion: {
      default: null
    }
  },
  props: {
    title: {
      type: String,
      default: ''
    },
    defaultOpen: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      itemId: `accordion-item-${++accordionItemUid}`
    }
  },
  computed: {
    iconSize() { return tokens.extensions.accordion.iconSize },
    isItemOpen() {
      if (this.accordion) {
        return this.accordion.isOpen(this.itemId)
      }
      return false
    },

  },
  mounted() {
    if (this.defaultOpen && this.accordion) {
      this.accordion.registerDefault(this.itemId)
    }
  },
  beforeDestroy() {
    this.accordion?.unregisterItem(this.itemId)
    if (this.$refs.panel) stopCollapse(this.$refs.panel)
  },
  methods: {
    prepareCollapse, stopCollapse,
    toggle() {
      if (this.disabled) return
      if (this.accordion) {
        this.accordion.toggleItem(this.itemId)
      }
    },
    onEnter(el, done) { moveCollapse(el, true, done); },
    onAfterEnter(el) { el.style.height = ''; el.style.overflow = ''; },
    onLeave(el, done) { el.inert = true; moveCollapse(el, false, done); }

  }
}
</script>
