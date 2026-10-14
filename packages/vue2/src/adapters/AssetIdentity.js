import { tokens } from "@kjun-ui/tokens";
import KjunSkeleton from "../source/data-display/Skeleton.vue";

export default {
  name: 'KjunAssetIdentity', inheritAttrs: false,
  inject: { kjunRenderIdentity: { default: null } },
  props: {
    assetType: String, assetKey: [String, Number], title: String, subtitle: String,
    logoName: String, logoSize: { type: Number, default: tokens.extensions.avatar.sm },
    gap: { type: Number, default: tokens.dimension.value8 }, layout: { type: String, default: 'stacked' },
    loading: Boolean, titleClass: { default: 'kj-text-sm kj-font-semibold kj-text-text-primary' },
    subtitleClass: { default: 'kj-text-xs kj-text-text-secondary' },
  },
  render(h) {
    const props = { ...this.$attrs, ...this.$props };
    const custom = this.kjunRenderIdentity?.(h, props, this.$slots);
    if (custom != null) return custom;
    const label = this.loading
      ? h(KjunSkeleton, { props: { type: 'block', width: tokens.extensions.skeleton.identityWidth + 'px', height: tokens.extensions.skeleton.identityHeight + 'px' } })
      : this.$slots.title || h('span', { class: ['kj-block kj-truncate', this.titleClass] }, this.title);
    const subtitle = this.$slots.subtitle || (this.subtitle && h('span', { class: ['kj-block kj-truncate', this.subtitleClass] }, this.subtitle));
    return h('div', { class: 'kj-flex kj-items-center kj-min-w-0', style: { gap: this.gap + 'px' } }, [
      this.$slots.leading,
      h('div', { class: ['kj-min-w-0', this.layout === 'inline' && 'kj-flex kj-items-center kj-gap-2'] }, [label, subtitle]),
      this.$slots.trailing,
    ]);
  },
};
