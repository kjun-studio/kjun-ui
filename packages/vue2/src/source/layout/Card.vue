<template>
  <div class="kjun-card ds-card" :style="cardStyle" :data-surface="surface" :data-padding="padding"
    :data-body-padding="resolvedBodyPadding" :data-border="String(border)" :data-dividers="String(dividers)" :data-elevation="elevation">
    <div v-if="hasContent('media')" class="kjun-card-media"><slot name="media" /></div>
    <div v-if="hasHeading() || hasContent('header-actions')" class="kjun-card-header" :data-description="!hasContent('header') && !!subtitle.trim()">
      <div v-if="hasHeading()" class="kjun-card-heading">
        <slot name="header">
          <h3 v-if="title">{{ title }}</h3>
          <p v-if="subtitle">{{ subtitle }}</p>
        </slot>
      </div>
      <div v-if="hasContent('header-actions')" class="kjun-card-actions"><slot name="header-actions" /></div>
    </div>
    <div v-if="hasContent('default')" class="kjun-card-body"><slot /></div>
    <div v-if="hasContent('footer')" class="kjun-card-footer"><slot name="footer" /></div>
  </div>
</template>

<script>
import { tokens } from "@kjun-ui/tokens";
import { componentMixins } from "../../component-mixins.js";
export default {
  mixins: componentMixins,
  name: "DesignCard",
  props: {
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    padding: { type: String, default: "md", validator: value => ['none', 'sm', 'md', 'lg'].includes(value) },
    bodyPadding: { type: String, default: undefined, validator: value => ['none', 'sm', 'md', 'lg'].includes(value) },
    radius: { type: String, default: "md", validator: value => ['none', 'sm', 'md', 'lg'].includes(value) },
    surface: { type: String, default: "default", validator: value => ['default', 'muted', 'accent', 'success', 'warning', 'danger', 'subtle', 'brand', 'glass'].includes(value) },
    elevation: { type: String, default: "flat", validator: value => ['flat', 'raised'].includes(value) },
    border: { type: Boolean, default: false },
    dividers: { type: Boolean, default: false },
  },
  methods: {
    hasContent(name) {
      return (this.$slots[name] || []).some(node => !node.isComment && (node.tag || (node.text && node.text.trim())));
    },
    hasHeading() { return this.hasContent('header') || !!this.title.trim() || !!this.subtitle.trim(); },
  },
  computed: {
    resolvedBodyPadding() { return this.bodyPadding ?? this.padding; },
    cardStyle() {
      return {
        '--_kjun-card-padding': `var(--_kjun-geometry-card-padding-${this.padding})`,
        '--_kjun-card-body-padding': `var(--_kjun-geometry-card-padding-${this.resolvedBodyPadding})`,
        borderRadius: `var(--_kjun-geometry-card-radii-${this.radius})`,
        boxShadow: `var(--_kjun-card-elevation-${this.elevation})`,
      };
    },
  },
};
</script>
