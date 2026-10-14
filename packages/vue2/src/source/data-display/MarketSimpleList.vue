<template>
  <div class="kjun-mobile-simple-list">
    <DsDataState
      :query-key="queryKey"
    :result-key="resultKey"
      :has-loaded-once="hasLoadedOnce"
      :error="error"
      loading-padding="none"
      @retry="$emit('retry')"
      :loading="loading"
      :empty="!initialLoading && rows.length === 0"
      :empty-text="emptyMessage"
    >
      <template #loading>
        <DsListSkeleton />
      </template>
      <template #empty>
        <DsEmpty class="kjun-mobile-simple-list__empty" :text="emptyMessage" :description="emptySubMessage" />
      </template>

      <div>
        <div
          v-for="row in rows"
          :key="row[rowKey]"
          class="kjun-market-simple-card kjun-mobile-simple-list__row kj-flex kj-items-center kj-justify-between kj-px-4 kj-py-4 kj-cursor-pointer hover:kj-bg-bg-hover kj-transition-colors"
          @click.stop="$emit('row-click', row)"
        >
          <!-- 종목 식별 로고 등 선행 표식 주입 seam (없으면 렌더 없음) -->
          <AssetIdentity class="kjun-market-card-left kj-min-w-0 kj-flex-1" :title="primaryLabel(row)" :gap="0"><template #leading><slot name="name-prefix" :row="row" /></template><template #title><div class="kjun-market-card-name kjun-mobile-simple-list__name kj-text-sm kj-font-medium kj-text-text-primary kj-flex kj-items-center kj-gap-1 kj-min-w-0">
              <span class="kjun-mobile-simple-list__label kj-truncate" :title="primaryLabel(row)">{{ primaryLabel(row) }}</span>
              <DsCollectionMark v-if="isInterest(row)" class="kj-flex-shrink-0" aria-label="관심" kind="interest" size="sm" active />
              <DsCollectionMark v-if="isFavorite(row)" class="kj-flex-shrink-0" aria-label="즐겨찾기" kind="favorite" size="sm" active />
              <!-- 도메인 종목명 표식(예: 위험 상태 뱃지) 주입 seam -->
              <slot name="name-suffix" :row="row" />
            </div></template><template #subtitle><div v-if="subMeta(row) || $scopedSlots['sub-meta']" class="kjun-market-card-sub1 kjun-mobile-simple-list__meta kj-text-xs kj-text-text-tertiary kj-mt-0.5 kj-truncate" :title="subMeta(row)">
              <slot name="sub-meta" :row="row">{{ subMeta(row) }}</slot>
            </div></template></AssetIdentity>

          <div class="kjun-market-card-right kjun-mobile-simple-list__quote kj-flex-shrink-0 kj-ml-3 kj-text-right">
            <div class="kjun-mobile-simple-list__price kj-text-sm kj-font-semibold kj-text-text-primary kj-tabular-nums">
              <DsSkeleton v-if="priceValue(row) == null" type="block" height="var(--_kjun-extension-financial-price-skeleton-height)" width="var(--_kjun-extension-financial-price-skeleton-width)" class="kj-inline-block" />
              <span v-else class="kjun-mobile-simple-list__price-line kj-inline-flex kj-items-center kj-justify-end kj-gap-1">
                <span :class="['kjun-price-cell', priceFlashClass(row), row.stale ? 'kj-text-text-tertiary' : '']">
                  <DsAnimatedNumber from-previous :value="priceValue(row)" :formatter="priceFormatter" />
                </span>
              </span>
            </div>
            <div class="kjun-mobile-simple-list__change kj-flex kj-flex-wrap kj-items-center kj-justify-end kj-gap-1.5 kj-mt-0.5">
              <!-- 가격 관련 표식은 와치리스트와 같이 보조 줄에 두어 현재가 정렬을 유지한다. -->
              <slot v-if="priceValue(row) != null" name="price-prefix" :row="row" />
              <template v-if="hasQuoteValue(row)">
                <DsBadge v-if="closingPrice && !row.stale" variant="secondary" size="xs">종가</DsBadge>
                <DsFreshness
                  v-else
                  :stale="!!row.stale"
                  :source="closingPrice ? 'close' : row.source"
                  :fetched-at="row.fetched_at"
                />
              </template>
              <DsSkeleton
                v-if="changeLoading(row)"
                type="block"
                height="var(--_kjun-extension-market-list-change-skeleton-height)"
                width="var(--_kjun-extension-market-list-change-skeleton-width)"
                class="kj-inline-block"
              />
              <DsSignedValue
                v-else-if="changeValue(row) != null"
                :value="changeValue(row)"
                class="kj-inline-flex kj-text-xs kj-font-medium"
                :stale="!!row.stale"
                :show-freshness="false"
                :class="[changeFlashClass(row)]"
                format="percent"
                is-raw
              />
              <span v-else class="kj-text-xs kj-text-text-tertiary">-</span>
            </div>
          </div>
        </div>
      </div>
    </DsDataState>

    <DsPagination
      v-if="pagination && pagination.total > pagination.size"
      class="kjun-market-simple-pagination"
      :current-page="pagination.page"
      :total-pages="Math.ceil(pagination.total / pagination.size)"
      :total-rows="pagination.total"
      :page-size="pagination.size"
      show-info
      @change="$emit('page-change', $event)"
    />

    <div
      v-if="showFooter && !initialLoading && rows.length > 0"
      class="kjun-mobile-simple-list__inset kj-px-4 kj-py-3 kj-flex kj-flex-wrap kj-gap-2 kj-items-center kj-justify-between kj-text-xs kj-text-text-tertiary"
    >
      <span v-if="calculatedAt">마지막 업데이트: {{ $formatDate(calculatedAt, { format: 'datetime' }) }}</span>
      <span v-else-if="footerNote">{{ footerNote }}</span>
      <span v-else />
      <span>총 {{ totalCount }}{{ unitLabel }}</span>
    </div>
  </div>
</template>

<script>
import DsBadge from "../primitives/Badge.vue";
import DsCollectionMark from "./CollectionMark.vue";
import DsDataState from "../feedback/DataState.vue";
import DsEmpty from "./Empty.vue";
import DsFreshness from "./Freshness.vue";
import DsListSkeleton from "./ListSkeleton.vue";
import DsPagination from "../navigation/Pagination.vue";
import DsSignedValue from "./SignedValue.vue";
import DsSkeleton from "./Skeleton.vue";
import { componentMixins } from "../../component-mixins.js";
import AssetIdentity from '@kjun-adapter/AssetIdentity.js'
import queryDisplayMixin from '@kjun-adapter/queryDisplayMixin.js'
import DsAnimatedNumber from './AnimatedNumber.vue'
import { finiteSignedValue } from './signedValue'
import { getChangeRateTextClass } from './_marketFormat'

export default {
  mixins: [queryDisplayMixin, ...componentMixins],
  name: 'MarketSimpleList',
  components: { AssetIdentity, DsAnimatedNumber, DsBadge, DsCollectionMark, DsDataState, DsEmpty, DsFreshness, DsListSkeleton, DsPagination, DsSignedValue, DsSkeleton },
  props: {
    rows: { type: Array, default: () => [] },
    rowKey: { type: String, default: 'id' },
    loading: { type: Boolean, default: false },
    interestKeys: { type: Set, default: () => new Set() },
    favoriteKeys: { type: Set, default: () => new Set() },
    pagination: { type: Object, default: null },
    // 도메인 접근자
    primaryLabel: { type: Function, default: (row) => String(row && row.name != null ? row.name : '') },
    subMeta: { type: Function, default: () => '' },
    priceValue: { type: Function, required: true },
    changeValue: { type: Function, required: true },
    changeLoading: { type: Function, default: () => false },
    priceFormatter: { type: Function, required: true },
    closingPrice: { type: Boolean, default: false },
    emptyMessage: { type: String, default: '항목이 없습니다' },
    emptySubMessage: { type: String, default: '' },
    showFooter: { type: Boolean, default: true },
    calculatedAt: { type: String, default: null },
    footerNote: { type: String, default: '' },
    totalCount: { type: Number, default: 0 },
    unitLabel: { type: String, default: '개' },
  },
  methods: {
    isInterest(row) {
      return this.interestKeys.has(row[this.rowKey])
    },
    isFavorite(row) {
      return this.favoriteKeys.has(row[this.rowKey])
    },
    hasQuoteValue(row) {
      return finiteSignedValue(this.priceValue(row)) !== null ||
        (!this.changeLoading(row) && finiteSignedValue(this.changeValue(row)) !== null)
    },
    // 현재가 배경 플래시: 직전 새로고침 대비 틱 방향(상승=빨강/하락=파랑)
    priceFlashClass(row) {
      if (row.stale) return ''
      const dir = row._flash && row._flash.price
      return dir ? `kjun-price-flash-${dir}-bg-pop` : ''
    },
    // 등락률 갱신 강조는 투명으로 끝나 상시 배경을 남기지 않는다.
    changeFlashClass(row) {
      if (row.stale || !(row._flash && row._flash.change)) return ''
      return (this.changeValue(row) || 0) >= 0 ? 'kjun-price-flash-up-bg-pop' : 'kjun-price-flash-down-bg-pop'
    },
    getChangeRateTextClass,
  },
}
</script>

<style scoped>
.kjun-market-simple-pagination {
  border-top: 0;
}

/* 가격과 등락률의 오른쪽 끝을 일치시킨다. */
.kjun-price-cell {
  display: inline-block;
  padding: 0;
  border-radius: 0;
}
</style>
