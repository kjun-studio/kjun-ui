<template>
  <div class="kjun-market-table-frame" :class="embedded ? '' : 'kj-bg-surface-card kj-rounded-card'">
    <KjunDataState
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
        <KjunMarketTableSkeleton :columns="columns" :show-actions="showActions" :align-class="alignClass" :width-class="widthClass" />
      </template>

      <template #empty>
        <KjunEmpty :text="emptyMessage" :description="emptySubMessage" />
      </template>

      <!-- Like React and Native: the trailing edge fades while columns still overflow it. -->
      <div ref="scroller" class="kjun-table-scroll" :data-fade-end="fadeEnd || undefined">
        <table class="kjun-market-table-grid" :style="layout.tableStyle">
          <colgroup>
            <col v-if="showActions" :style="{ width: geometry.actionsWidth + 'px' }" />
            <col v-for="(column, index) in layout.columns" :key="index" :class="column.className" :style="column.style" />
          </colgroup>
          <!-- Header -->
          <thead class="kj-bg-surface-card kj-sticky kj-top-0 kj-z-10">
            <tr>
              <!-- 관심/즐겨찾기 액션 컬럼 -->
              <th v-if="showActions" class="kjun-market-actions">
                <span class="kjun-market-actions-mark"><KjunCollectionMark kind="interest" size="md" /></span>
                <span class="kjun-market-actions-mark"><KjunCollectionMark kind="favorite" size="md" /></span>
              </th>

              <th
                v-for="col in columns"
                :key="col.key"
                :style="{ textAlign: col.align }"
                :class="[
                  'kj-px-3 kj-py-3 kj-text-xs kj-font-medium kj-text-text-tertiary kj-whitespace-nowrap',
                  alignClass(col.align),
                  col.sortable ? 'kj-cursor-pointer hover:kj-text-text-primary kj-select-none' : ''
                ]"
                @click="col.sortable ? $emit('sort', col.key) : null"
              >
                <span class="kj-inline-flex kj-items-center kj-gap-1">
                  {{ col.label }}
                  <!-- Like React and Native: one sort icon size, in the header text colour. -->
                  <KjunIcon
                    v-if="col.sortable && sortKey === col.key"
                    :name="sortOrder === 'asc' ? 'sort-ascending' : 'sort-descending'"
                    :size="geometry.sortIconSize"
                  />
                  <KjunIcon
                    v-else-if="col.sortable"
                    name="arrows-sort"
                    :size="geometry.sortIconSize"
                  />
                </span>
              </th>
            </tr>
          </thead>

          <!-- Body -->
          <tbody class="kj-bg-surface-card kj-divide-y kj-divide-border">
            <tr
              v-for="row in rows"
              :key="row[rowKey]"
              class="kj-group kj-cursor-pointer kj-transition-colors hover:kj-bg-bg-hover"
              @click="$emit('row-click', row)"
            >
              <!-- 관심/즐겨찾기 토글 -->
              <td v-if="showActions" class="kjun-market-actions">
                <div class="kj-flex kj-items-center kj-justify-center">
                  <KjunIconToggle
                    size="xs"
                    :active="isInterest(row)"
                    @toggle="$emit('toggle-interest', row)"
                    active-icon="heart"
                    active-color-class="kj-text-interest"
                    :aria-label="[rowActionLabel(row), '관심', isInterest(row) ? '해제' : '등록'].filter(Boolean).join(' ')"
                    :loading="togglingInterest === row[rowKey]"
                  />
                  <KjunIconToggle
                    size="xs"
                    :active="isFavorite(row)"
                    @toggle="$emit('toggle-favorite', row)"
                    active-icon="star"
                    active-color-class="kj-text-favorite"
                    :aria-label="[rowActionLabel(row), '즐겨찾기', isFavorite(row) ? '해제' : '등록'].filter(Boolean).join(' ')"
                    :loading="togglingFavorite === row[rowKey]"
                  />
                </div>
              </td>

              <td
                v-for="col in columns"
                :key="col.key"
                :style="{ textAlign: col.align }"
                :class="[
                  'kj-px-3 kj-py-3.5 kj-text-sm kj-whitespace-nowrap',
                  alignClass(col.align),
                  weightClass(col)
                ]"
              >
                <KjunSkeleton
                  v-if="cellLoading(row, col)"
                  type="block"
                  height="var(--_kjun-extension-market-table-value-skeleton-height)"
                  width="var(--_kjun-extension-market-table-value-skeleton-width)"
                  class="kj-inline-block"
                />
                <!-- 도메인 셀 슬롯 우선 (#cell-{key}). flashClass를 함께 넘겨 슬롯이 그린 셀도 동일 펄스 -->
                <slot
                  v-else-if="hasCellSlot(col.key)"
                  :name="`cell-${col.key}`"
                  :row="row"
                  :column="col"
                  :flash-class="flashCellClass(row, col)"
                />

                <div v-else-if="isIdentity(col.key)" class="kjun-market-identity">
                  <div class="kjun-market-identity-text">
                    <div class="kjun-market-name"><span>{{ identityLabel(row) }}</span></div>
                    <div v-if="identityMeta(row)" class="kjun-market-meta">{{ identityMeta(row) }}</div>
                  </div>
                </div>

                <!-- 내장 타입 렌더러 -->
                <KjunSparkline
                  v-else-if="col.type === 'sparkline'"
                  :data="row[col.key] || []"
                  :width="sparklineSize.width"
                  :height="sparklineSize.height"
                />

                <template v-else-if="col.type === 'price'">
                  <span class="kj-inline-flex kj-items-center kj-justify-end kj-gap-1">
                    <KjunPriceCell
                      :value="row[col.key]"
                      :formatter="priceFormatter"
                      :stale="!!row.stale"
                      :show-freshness="false"
                      :source="row.source"
                      :fetched-at="row.fetched_at"
                      :flash-class="flashCellClass(row, col)"
                    />
                  </span>
                </template>

                <template v-else-if="col.type === 'percent'">
                  <KjunSignedValue
                    v-if="row[col.key] != null"
                    :value="row[col.key]"
                    class="kj-inline-flex"
                    :stale="!!row.stale"
                    :show-freshness="false"
                    :class="[flashCellClass(row, col)]"
                    format="percent"
                    is-raw
                  />
                  <span v-else class="kj-text-text-tertiary">-</span>
                </template>

                <template v-else-if="col.type === 'investor'">
                  <span v-if="row[col.key] == null" class="kj-text-text-tertiary">—</span>
                  <span v-else :class="getInvestorClass(row[col.key])">
                    {{ row[col.key] >= 0 ? '+' : '' }}{{ kjunFormatBigKRW(row[col.key]) }}
                  </span>
                </template>

                <template v-else-if="col.type === 'net_amount' || col.type === 'net_volume'">
                  <span :class="getInvestorClass(row[col.key])">{{ cellText(row, col) }}</span>
                </template>

                <!-- trade_amount / bigAmount / ratio / compact / 기본: 색 없는 텍스트 -->
                <template v-else>{{ cellText(row, col) }}</template>
                <KjunFreshness
                  v-if="freshnessColumnKey(row) === col.key"
                  :stale="!!row.stale"
                  :source="row.source"
                  :fetched-at="row.fetched_at"
                  class="kj-ml-1"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </KjunDataState>

    <!-- Pagination -->
    <KjunPagination
      v-if="pagination && pagination.total > pagination.size"
      :current-page="pagination.page"
      :total-pages="Math.ceil(pagination.total / pagination.size)"
      :total-rows="pagination.total"
      :page-size="pagination.size"
      show-info
      @change="$emit('page-change', $event)"
    />

    <!-- 푸터는 실제 목록이 있을 때만 (로딩/빈 상태에서 '총 0개' 잡음 방지) -->
    <div
      v-if="showFooter && !initialLoading && rows.length > 0"
      class="kj-px-4 kj-py-3 kj-border-t kj-border-border kj-flex kj-items-center kj-justify-between kj-text-xs kj-text-text-tertiary"
    >
      <span v-if="calculatedAt">마지막 업데이트: {{ kjunFormatDate(calculatedAt, { format: 'datetime' }) }}</span>
      <span v-else-if="footerNote">{{ footerNote }}</span>
      <span v-else />
      <span>총 {{ totalCount }}{{ unitLabel }}</span>
    </div>
  </div>
</template>

<script>
import { tokens } from "@kjun-ui/tokens";
import { marketGeometry, webMarketLayout, legacyMarketWidthClass, isMarketIdentity } from "../../../../../shared/package-runtime/market-layout";
import { watchTrailingOverflow } from "../../../../../shared/package-runtime/trailing-overflow";
import KjunEmpty from "./Empty.vue";
import KjunCollectionMark from "./CollectionMark.vue";
import KjunDataState from "../feedback/DataState.vue";
import KjunIconToggle from "../primitives/IconToggle.vue";
import KjunFreshness from "./Freshness.vue";
import KjunIcon from "../../icon.js";
import KjunMarketTableSkeleton from "./MarketTableSkeleton.vue";
import KjunPagination from "../navigation/Pagination.vue";
import KjunPriceCell from "./PriceCell.vue";
import KjunSignedValue from "./SignedValue.vue";
import KjunSkeleton from "./Skeleton.vue";
import { componentMixins } from "../../component-mixins.js";
import { domainColorMixin } from "../../domain-colors.js";
import queryDisplayMixin from '@kjun-adapter/queryDisplayMixin.js'
import KjunSparkline from './Sparkline.vue'
import { finiteSignedValue } from './signedValue'
import {
  flashCellClass,
  getChangeRateTextClass,
  getInvestorClass,
  formatNetAmount,
  formatNetVolume,
  formatTradeAmount,
} from './_marketFormat'

// 내장 타입 중 우측정렬 숫자로 취급할 것들 (numeric 기본 판정)
const NUMERIC_TYPES = new Set([
  'price', 'percent', 'investor', 'net_amount', 'net_volume', 'trade_amount', 'bigAmount', 'ratio', 'compact',
])

export default {
  mixins: [queryDisplayMixin, ...componentMixins, domainColorMixin(vm => vm.showActions && vm.rows.length > 0 && !vm.loading)],
  name: 'KjunMarketTable',
  components: { KjunEmpty, KjunSparkline, KjunCollectionMark, KjunDataState, KjunIconToggle, KjunFreshness, KjunIcon, KjunMarketTableSkeleton, KjunPagination, KjunPriceCell, KjunSignedValue, KjunSkeleton },
  props: {
    rows: { type: Array, default: () => [] },
    columns: { type: Array, required: true },
    rowKey: { type: String, default: 'id' },
    loading: { type: Boolean, default: false },
    cellLoading: { type: Function, default: () => false },
    // 관심/즐겨찾기 액션 컬럼
    showActions: { type: Boolean, default: false },
    interestKeys: { type: Set, default: () => new Set() },
    favoriteKeys: { type: Set, default: () => new Set() },
    togglingInterest: { type: [String, Number], default: null },
    togglingFavorite: { type: [String, Number], default: null },
    // 정렬 상태 (3단계는 부모가 관리, 여기선 표시만)
    sortKey: { type: String, default: null },
    sortOrder: { type: String, default: 'desc' },
    pagination: { type: Object, default: null },
    // 현재가 type='price' 셀의 tween 포맷터(₩/$ 등)
    priceFormatter: { type: Function, default: null },
    // bigAmount type의 통화 분기 ('usd' | 'krw')
    currency: { type: String, default: 'krw' },
    embedded: { type: Boolean, default: false },
    emptyMessage: { type: String, default: '항목이 없습니다' },
    emptySubMessage: { type: String, default: '' },
    // 푸터
    showFooter: { type: Boolean, default: true },
    calculatedAt: { type: String, default: null },
    footerNote: { type: String, default: '' },
    totalCount: { type: Number, default: 0 },
    unitLabel: { type: String, default: '개' },
  },
  data() { return { fadeEnd: false } },
  mounted() { this.watchScroller() },
  updated() { if (this.$refs.scroller !== this.watchedScroller) this.watchScroller() },
  beforeDestroy() { this.stopScroller?.() },
  computed: {
    sparklineSize() { return { width: tokens.extensions.marketTable.sparklineWidth, height: tokens.extensions.marketTable.sparklineHeight } },
    geometry() { return marketGeometry },
    layout() { return webMarketLayout(this.columns, this.showActions, this.widthClass) },
  },
  methods: {
    // The scroller appears after loading, so the watcher follows whichever element is current.
    watchScroller() {
      this.stopScroller?.()
      this.watchedScroller = this.$refs.scroller
      this.stopScroller = this.watchedScroller ? watchTrailingOverflow(this.watchedScroller, hidden => { this.fadeEnd = hidden }) : null
    },
    isIdentity: isMarketIdentity,
    identityLabel(row) { return row.stock_name || row.name || row.symbol || '' },
    identityMeta(row) { const meta = row.stock_code || row.symbol || ''; return meta === this.identityLabel(row) ? '' : meta },
    isInterest(row) {
      return this.interestKeys.has(row[this.rowKey])
    },
    isFavorite(row) {
      return this.favoriteKeys.has(row[this.rowKey])
    },
    // 하트/별 아이콘 전용 버튼의 접근 가능한 이름용 — 주식(stock_name)·코인(name/symbol) 공용
    rowActionLabel(row) {
      return row.stock_name || row.name || row.symbol || ''
    },
    hasCellSlot(key) {
      return !!this.$scopedSlots[`cell-${key}`]
    },
    // 가격·파생 등락률은 같은 시세 상태를 공유하므로 실제 표시되는 셀 하나에만 배지를 둔다.
    freshnessColumnKey(row) {
      if (!row.stale) return null
      const available = this.columns.filter(column =>
        (column.type === 'price' || column.type === 'percent') &&
        !this.cellLoading(row, column) && finiteSignedValue(row[column.key]) !== null,
      )
      return (available.find(column => column.type === 'price') || available[0])?.key ?? null
    },
    alignClass(align) {
      if (align === 'center') return 'kj-text-center'
      if (align === 'right') return 'kj-text-right'
      return 'kj-text-left'
    },
    isNumeric(col) {
      // 명시 numeric 우선, 없으면 내장 숫자 타입으로 판정
      return col.numeric != null ? col.numeric : NUMERIC_TYPES.has(col.type)
    },
    widthClass: legacyMarketWidthClass,
    weightClass(col) {
      if (col.weight === 'semibold') return 'kj-font-semibold'
      if (col.weight === 'medium') return 'kj-font-medium'
      if (col.weight === 'none') return ''
      // Like React and Native: without an explicit weight, numbers keep the body weight of the row.
      return ''
    },
    // 색 없는 텍스트 셀 포맷 (trade_amount / bigAmount / ratio / compact / 기본)
    cellText(row, col) {
      const value = row[col.key]
      if (value === null || value === undefined || value === '') return '-'
      switch (col.type) {
        case 'net_amount':
          return formatNetAmount(value, this.kjunFormatNumber)
        case 'net_volume':
          return formatNetVolume(value, this.kjunFormatNumber)
        case 'trade_amount':
          return formatTradeAmount(value, this.kjunFormatNumber)
        case 'bigAmount':
          return this.currency === 'usd' ? this.kjunFormatCompact(value) : this.kjunFormatBigKRW(value)
        case 'compact':
          return this.kjunFormatCompact(value)
        case 'ratio':
          // 0/falsy는 의미 없는 비율로 보고 '-' (기존 주식 표 동작 보존)
          return value ? this.kjunFormatNumber(value, { decimals: col.decimals != null ? col.decimals : 2 }) : '-'
        default:
          return value
      }
    },
    flashCellClass(row, column) {
      return row.stale ? '' : flashCellClass(row, column, { plain: true })
    },
    getChangeRateTextClass,
    getInvestorClass,
  },
}
</script>

<style scoped>
/* 도메인 슬롯의 가격도 여백 없는 숫자로 맞춰 열의 오른쪽 기준선을 유지한다. */
.kjun-market-table-frame ::v-deep .kjun-price-cell {
  padding: 0;
  border-radius: 0;
}
</style>
