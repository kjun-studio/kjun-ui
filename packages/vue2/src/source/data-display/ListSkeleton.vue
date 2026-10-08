<template>
  <div class="ds-list-skeleton" aria-hidden="true">
    <div v-for="row in rows" :key="row" :class="['ds-list-skeleton__row', variant === 'market' ? 'mobile-simple-list__row' : '', `ds-list-skeleton__row--${variant}`]">
      <DsSkeleton v-if="avatar" type="avatar" :width="avatarSize" :height="avatarSize" class="shrink-0" />
      <div class="ds-list-skeleton__label">
        <DsSkeleton type="block" height="var(--extension-skeleton-line-heights-md)" :width="row % 2 ? '65%' : '80%'" />
        <DsSkeleton type="block" height="var(--extension-skeleton-line-heights-sm)" width="50%" />
      </div>
      <div v-if="quote" class="ds-list-skeleton__quote">
        <DsSkeleton type="block" height="var(--extension-skeleton-quote-height)" width="var(--extension-skeleton-quote-width)" />
        <DsSkeleton type="block" height="var(--extension-skeleton-line-heights-sm)" width="var(--extension-skeleton-detail-width)" />
      </div>
    </div>
  </div>
</template>

<script>
import { tokens } from "@kjun/tokens";
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
.ds-list-skeleton__row { display: flex; align-items: center; gap: var(--extension-skeleton-gap); min-height: var(--extension-skeleton-list-heights-market); padding: var(--extension-skeleton-list-market-padding-y) var(--extension-skeleton-list-market-padding-x); border-bottom: var(--_kjun-border-default-width) solid var(--border); }
.ds-list-skeleton__row--compact { min-height: var(--extension-skeleton-list-heights-compact); padding: var(--extension-skeleton-list-compact-padding-y) var(--extension-skeleton-list-compact-padding-x); }
.ds-list-skeleton__row--notification { min-height: var(--extension-skeleton-list-heights-notification); padding: var(--extension-skeleton-list-notification-padding-y) var(--extension-skeleton-list-notification-padding-x); }
.ds-list-skeleton__label { flex: 1; min-width: 0; display: grid; gap: var(--extension-skeleton-detail-gap); }
.ds-list-skeleton__quote { display: flex; flex-direction: column; align-items: flex-end; gap: var(--extension-skeleton-detail-gap); }
/* Market rows follow simple-list market rows: 16px all round, and 14/20 with a minimum height on narrow
   screens. Bars sit in the name and meta line slots, so rows keep the list's height when data arrives. */
.ds-list-skeleton__row--market { min-height: 0; padding: var(--_kjun-geometry-dimension-value16); }
.ds-list-skeleton__row--market :is(.ds-list-skeleton__label, .ds-list-skeleton__quote) {
  display: grid; grid-template-rows: var(--_kjun-type-label-line) var(--_kjun-type-caption-line);
  gap: var(--_kjun-geometry-dimension-value2); align-items: center;
}
.ds-list-skeleton__row--market .ds-list-skeleton__quote { justify-items: end; }
@media (width < token(responsive.market)) {
  .ds-list-skeleton__row--market { min-height: var(--extension-market-list-minimum-height); padding: var(--_kjun-geometry-dimension-value14) var(--_kjun-geometry-dimension-value20); }
  .ds-list-skeleton__row--market :is(.ds-list-skeleton__label, .ds-list-skeleton__quote) { grid-template-rows: var(--_kjun-type-input-line) var(--_kjun-type-body-line); }
}

</style>
