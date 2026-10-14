<template>
  <div class="kjun-accordion-item">
    <!-- Header -->
    <button
      type="button"
      :id="'kjun-accordion-header-' + itemId"
      class="kjun-accordion-trigger"
      :disabled="disabled"
      :aria-expanded="String(isItemOpen)"
      :aria-controls="'kjun-accordion-panel-' + itemId"
      @click.stop="toggle"
    >
      <div class="kjun-accordion-heading">
        <slot name="header">
          <span>{{ title }}</span>
        </slot>
      </div>
      <KjunIcon name="chevron-down" :size="iconSize" class="kjun-accordion-chevron" :style="{ transform: isItemOpen ? 'rotate(180deg)' : undefined }" />
    </button>

    <!-- Content -->
    <transition
      name="kjun-accordion-content"
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
        :id="'kjun-accordion-panel-' + itemId"
        role="region"
        :aria-labelledby="'kjun-accordion-header-' + itemId"
        class="kjun-accordion-content"
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
import KjunIcon from "../../icon.js";
import { tokens } from "@kjun-ui/tokens";
import { componentMixins } from "../../component-mixins.js";
let accordionItemUid = 0

export default {
  mixins: componentMixins,
  components: { KjunIcon },
  name: 'KjunAccordionItem',
  inject: {
    kjunAccordion: {
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
      if (this.kjunAccordion) {
        return this.kjunAccordion.isOpen(this.itemId)
      }
      return false
    },

  },
  mounted() {
    if (this.defaultOpen && this.kjunAccordion) {
      this.kjunAccordion.registerDefault(this.itemId)
    }
  },
  beforeDestroy() {
    this.kjunAccordion?.unregisterItem(this.itemId)
    if (this.$refs.panel) stopCollapse(this.$refs.panel)
  },
  methods: {
    prepareCollapse, stopCollapse,
    toggle() {
      if (this.disabled) return
      if (this.kjunAccordion) {
        this.kjunAccordion.toggleItem(this.itemId)
      }
    },
    onEnter(el, done) { moveCollapse(el, true, done); },
    onAfterEnter(el) { el.style.height = ''; el.style.overflow = ''; },
    onLeave(el, done) { el.inert = true; moveCollapse(el, false, done); }

  }
}
</script>
