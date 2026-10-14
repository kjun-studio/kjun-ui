<template>
  <div class="kjun-list-skeleton" aria-hidden="true">
    <div v-for="row in rows" :key="row" :class="['kjun-list-skeleton__row', variant === 'market' ? 'kjun-mobile-simple-list__row' : '', `kjun-list-skeleton__row--${variant}`]">
      <DsSkeleton v-if="avatar" type="avatar" :width="avatarSize" :height="avatarSize" class="kj-shrink-0" />
      <div class="kjun-list-skeleton__label">
        <DsSkeleton type="block" height="var(--_kjun-extension-skeleton-line-heights-md)" :width="row % 2 ? '65%' : '80%'" />
        <DsSkeleton type="block" height="var(--_kjun-extension-skeleton-line-heights-sm)" width="50%" />
      </div>
      <div v-if="quote" class="kjun-list-skeleton__quote">
        <DsSkeleton type="block" height="var(--_kjun-extension-skeleton-quote-height)" width="var(--_kjun-extension-skeleton-quote-width)" />
        <DsSkeleton type="block" height="var(--_kjun-extension-skeleton-line-heights-sm)" width="var(--_kjun-extension-skeleton-detail-width)" />
      </div>
    </div>
  </div>
</template>

<script>
import { tokens } from "@kjun-ui/tokens";
import DsSkeleton from "./Skeleton.vue";
import { componentMixins } from "../../component-mixins.js";
export default {
  mixins: componentMixins,
  components: { DsSkeleton },
  name: 'ListSkeleton',
  props: {
    rows: { type: Number, default: 8 },
    variant: { type: String, default: 'market', validator: value => ['market', 'compact', 'notification'].includes(value) },
    avatar: { type: Boolean, default: true },
    avatarSize: { type: String, default: () => tokens.extensions.skeleton.listAvatarSize + 'px' },
    quote: { type: Boolean, default: true },
  },
}
</script>

<style scoped>
.kjun-list-skeleton__row { display: flex; align-items: center; gap: var(--_kjun-extension-skeleton-gap); min-height: var(--_kjun-extension-skeleton-list-heights-market); padding: var(--_kjun-extension-skeleton-list-market-padding-y) var(--_kjun-extension-skeleton-list-market-padding-x); border-bottom: var(--_kjun-border-default-width) solid var(--_kjun-border); }
.kjun-list-skeleton__row--compact { min-height: var(--_kjun-extension-skeleton-list-heights-compact); padding: var(--_kjun-extension-skeleton-list-compact-padding-y) var(--_kjun-extension-skeleton-list-compact-padding-x); }
.kjun-list-skeleton__row--notification { min-height: var(--_kjun-extension-skeleton-list-heights-notification); padding: var(--_kjun-extension-skeleton-list-notification-padding-y) var(--_kjun-extension-skeleton-list-notification-padding-x); }
.kjun-list-skeleton__label { flex: 1; min-width: 0; display: grid; gap: var(--_kjun-extension-skeleton-detail-gap); }
.kjun-list-skeleton__quote { display: flex; flex-direction: column; align-items: flex-end; gap: var(--_kjun-extension-skeleton-detail-gap); }
/* Market rows follow simple-list market rows: 16px all round, and 14/20 with a minimum height on narrow
   screens. Bars sit in the name and meta line slots, so rows keep the list's height when data arrives. */
.kjun-list-skeleton__row--market { min-height: 0; padding: var(--_kjun-geometry-dimension-value16); }
.kjun-list-skeleton__row--market :is(.kjun-list-skeleton__label, .kjun-list-skeleton__quote) {
  display: grid; grid-template-rows: var(--_kjun-type-label-line) var(--_kjun-type-caption-line);
  gap: var(--_kjun-geometry-dimension-value2); align-items: center;
}
.kjun-list-skeleton__row--market .kjun-list-skeleton__quote { justify-items: end; }
@media (width < token(responsive.market)) {
  .kjun-list-skeleton__row--market { min-height: var(--_kjun-extension-market-list-minimum-height); padding: var(--_kjun-geometry-dimension-value14) var(--_kjun-geometry-dimension-value20); }
  .kjun-list-skeleton__row--market :is(.kjun-list-skeleton__label, .kjun-list-skeleton__quote) { grid-template-rows: var(--_kjun-type-input-line) var(--_kjun-type-body-line); }
}

</style>
