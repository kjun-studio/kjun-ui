<template>
  <div v-if="visible" :class="['ds-alert', 'ds-alert-' + normalizedType, 'kjun-alert']"
    :data-size="sizeKey" :style="toneStyle" :role="normalizedType === 'danger' ? 'alert' : 'status'">
    <span class="kjun-alert-icon ds-alert-icon" :style="{ color: toneStyle.color }">
      <DsIcon :name="iconName" :size="iconSize" />
    </span>
    <div class="kjun-alert-content">
      <h4 v-if="hasTitle()" class="kjun-alert-title"><slot name="title">{{ title }}</slot></h4>
      <div v-if="hasSlot('default')" class="kjun-alert-description"><slot /></div>
      <AlertActions v-if="hasSlot('actions')" :size="actionSize"><slot name="actions" /></AlertActions>
    </div>
    <button v-if="closable" type="button" aria-label="알림 닫기" class="kjun-alert-close" @click="close">
      <DsIcon name="x" :size="closeIconSize" />
    </button>
  </div>
</template>

<script>
import { tokens } from "@kjun-ui/tokens";
import DsIcon from "../../icon.js";
import { componentMixins } from "../../component-mixins.js";
import { SEMANTIC_VARIANTS, SIZES_CORE, oneOf } from '../tokens';
import { alertActionSizes } from "../../../../../shared/package-runtime/alert-action-size";

// Scopes the action size to the actions slot, not to buttons inside the message.
const AlertActions = {
  name: 'AlertActions',
  props: { size: { type: String, required: true } },
  provide() { return { kjunActionSize: () => this.size }; },
  render(h) { return h('div', { class: 'kjun-alert-actions' }, this.$slots.default); },
};

const VARIANTS = ['primary', ...SEMANTIC_VARIANTS];
const ICONS = { primary: 'info-circle', info: 'info-circle', success: 'circle-check', warning: 'alert-triangle', danger: 'alert-circle' };
const role = name => `var(--_kjun-color-${name})`;

export default {
  mixins: componentMixins,
  components: { DsIcon, AlertActions },
  name: 'DsAlert',
  props: {
    type: { type: String, default: 'info', validator: oneOf([...SEMANTIC_VARIANTS, 'error']) },
    variant: { type: String, default: null, validator: v => v === null || oneOf([...VARIANTS, 'error'])(v) },
    size: { type: String, default: 'md', validator: oneOf(SIZES_CORE) },
    title: { type: String, default: '' },
    closable: { type: Boolean, default: false },
  },
  data() { return { visible: true }; },
  computed: {
    iconSize() { return String(tokens.extensions.alert.iconSizes[this.sizeKey]); },
    closeIconSize() { return String(tokens.extensions.alert.closeIconSize); },
    normalizedType() {
      const raw = this.variant || this.type;
      const mapped = raw === 'error' ? 'danger' : raw;
      return VARIANTS.includes(mapped) ? mapped : 'info';
    },
    // lg intentionally retains the md layout for compatibility.
    sizeKey() { return this.size === 'sm' ? 'sm' : 'md'; },
    toneStyle() {
      const tone = this.normalizedType, primary = tone === 'primary';
      return {
        background: role(primary ? 'brand-subtle-bg' : tone + '-bg'),
        borderColor: role(primary ? 'brand-light' : tone + '-light'),
        color: role(primary ? 'brand' : tone + '-accent'),
      };
    },
    iconName() { return ICONS[this.normalizedType]; },
    actionSize() { return alertActionSizes[this.sizeKey]; },
  },
  methods: {
    hasSlot(name) {
      // Render-function consumers may pass slots only as scopedSlots.
      const nodes = this.$scopedSlots[name] ? this.$scopedSlots[name]() : this.$slots[name];
      return [].concat(nodes || []).some(node => node && !node.isComment && (node.tag || (node.text && node.text.trim())));
    },
    hasTitle() { return this.hasSlot('title') || !!this.title.trim(); },
    close() { this.visible = false; this.$emit('close'); },
  },
};
</script>
