<template>
  <div class="kjun-table-scroll" aria-hidden="true">
    <table class="kjun-market-table-grid" :style="layout.tableStyle">
      <colgroup>
        <col v-if="showActions" :style="{ width: geometry.actionsWidth + 'px' }" />
        <col v-for="(column, index) in layout.columns" :key="index" :class="column.className" :style="column.style" />
      </colgroup>
      <thead><tr>
        <th v-if="showActions" class="kjun-market-actions"><span class="kjun-market-skeleton-value"><DsSkeleton type="block" width="var(--extension-market-table-action-skeleton-width)" height="var(--extension-market-table-header-skeleton-height)" /></span></th>
        <th v-for="(col, index) in cols" :key="col.key || index" :class="alignClass && alignClass(col.align)" :style="{ textAlign: col.align }">{{ col.label }}</th>
      </tr></thead>
      <tbody><tr v-for="row in Math.max(0, rows)" :key="row">
        <td v-if="showActions" class="kjun-market-actions"><span class="kjun-market-skeleton-value"><DsSkeleton type="block" width="var(--extension-market-table-action-skeleton-width)" height="var(--extension-financial-price-skeleton-height)" /></span></td>
        <td v-for="(col, index) in cols" :key="col.key || index" :class="alignClass && alignClass(col.align)" :style="{ textAlign: col.align }">
          <div v-if="isIdentity(col.key)" class="kjun-market-skeleton-identity">
            <DsSkeleton type="block" width="80%" height="var(--extension-skeleton-line-heights-md)" /><DsSkeleton type="block" width="60%" height="var(--extension-skeleton-line-heights-sm)" />
          </div>
          <span v-else class="kjun-market-skeleton-value"><DsSkeleton type="block" width="var(--extension-financial-price-skeleton-width)" height="var(--extension-financial-price-skeleton-height)" /></span>
        </td>
      </tr></tbody>
    </table>
  </div>
</template>
<script>
import { marketGeometry, normalizeMarketColumns, webMarketLayout, isMarketIdentity } from "../../../../../shared/package-runtime/market-layout";
import DsSkeleton from "./Skeleton.vue";
import { componentMixins } from "../../component-mixins.js";
export default {
  mixins: componentMixins,
  components: { DsSkeleton },
  name: 'MarketTableSkeleton',
  props: {
    columns: { type: Array, default: () => [] },
    rows: { type: Number, default: 8 },
    showActions: { type: Boolean, default: false },
    alignClass: { type: Function, default: null },
    widthClass: { type: Function, default: null },
  },
  computed: {
    geometry() { return marketGeometry },
    cols() { return normalizeMarketColumns(this.columns) },
    layout() { return webMarketLayout(this.cols, this.showActions, this.widthClass) },
  },
  methods: { isIdentity: isMarketIdentity },
}
</script>
