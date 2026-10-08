import { tokens } from "@kjun-ui/tokens";
import DsSkeleton from "../source/data-display/Skeleton.vue";

export default {
  name: 'KjunAssetIdentity', inheritAttrs: false,
  inject: { kjunRenderIdentity: { default: null } },
  props: {
    assetType: String, assetKey: [String, Number], title: String, subtitle: String,
    logoName: String, logoSize: { type: Number, default: tokens.extensions.avatar.sm },
    gap: { type: Number, default: tokens.dimension.value8 }, layout: { type: String, default: 'stacked' },
    loading: Boolean, titleClass: { default: 'text-sm font-semibold text-text-primary' },
    subtitleClass: { default: 'text-xs text-text-secondary' },
  },
  render(h) {
    const props = { ...this.$attrs, ...this.$props };
    const custom = this.kjunRenderIdentity?.(h, props, this.$slots);
    if (custom != null) return custom;
    const label = this.loading
      ? h(DsSkeleton, { props: { type: 'block', width: tokens.extensions.skeleton.identityWidth + 'px', height: tokens.extensions.skeleton.identityHeight + 'px' } })
      : this.$slots.title || h('span', { class: ['block truncate', this.titleClass] }, this.title);
    const subtitle = this.$slots.subtitle || (this.subtitle && h('span', { class: ['block truncate', this.subtitleClass] }, this.subtitle));
    return h('div', { class: 'flex items-center min-w-0', style: { gap: this.gap + 'px' } }, [
      this.$slots.leading,
      h('div', { class: ['min-w-0', this.layout === 'inline' && 'flex items-center gap-2'] }, [label, subtitle]),
      this.$slots.trailing,
    ]);
  },
};
