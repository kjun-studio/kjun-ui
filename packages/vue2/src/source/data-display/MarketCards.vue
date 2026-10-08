<template>
  <div class="ds-market-cards">
    <!-- 지표 pill (가로 스크롤) -->
    <div v-if="pills.length > 0" class="metric-pills">
      <button
        v-for="pill in pills"
        :key="pill.key"
        :ref="`pill_${pill.key}`"
        type="button"
        :aria-pressed="String(selectedKey === pill.key)"
        :class="['metric-pill', selectedKey === pill.key ? 'metric-pill-active' : '']"
        @click.stop="selectPill(pill.key)"
      >
        {{ pill.label }}
        <span v-if="arrowVisible(pill)" class="pill-arrow">
          {{ sortOrder === 'desc' ? '↓' : '↑' }}
        </span>
      </button>
    </div>

    <slot
      name="list"
      :selected-key="selectedKey"
      :selected-pill="selectedPill"
      :metric-display="metricDisplay"
      :metric-value-class="metricValueClass"
    >
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
        <DsListSkeleton variant="compact" />
      </template>
      <template #empty>
        <DsEmpty :text="emptyMessage" :description="emptySubMessage" />
      </template>

      <!-- Like React and Native: the column label sits above the rows, outside their dividers. -->
      <div v-if="selectedPill" class="kjun-market-column-label">{{ selectedPill.label }}</div>
      <div class="divide-y divide-border">
        <div
          v-for="row in rows"
          :key="row[rowKey]"
          class="market-card flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-bg-hover transition-colors"
          @click.stop="$emit('row-click', row)"
        >
          <!-- 종목 식별 로고 등 선행 표식 주입 seam (없으면 렌더 없음) -->
          <AssetIdentity class="card-left min-w-0 flex-1" :title="primaryLabel(row)" :gap="0"><template #leading><slot name="name-prefix" :row="row" /></template><template #title><div class="card-name text-sm font-medium text-text-primary">
              <span class="truncate inline-block max-w-full align-middle" :title="primaryLabel(row)">{{ primaryLabel(row) }}</span>
              <DsCollectionMark v-if="isInterest(row)" class="ml-1" aria-label="관심" kind="interest" size="sm" active />
              <DsCollectionMark v-if="isFavorite(row)" class="ml-1" aria-label="즐겨찾기" kind="favorite" size="sm" active />
              <!-- 도메인 종목명 표식(예: 위험 상태 뱃지) 주입 seam -->
              <slot name="name-suffix" :row="row" />
            </div></template><template #subtitle><div v-if="subMeta(row)" class="card-subline text-xs text-text-tertiary truncate" :title="subMeta(row)">
              {{ subMeta(row) }}
            </div></template></AssetIdentity>

          <div class="card-right flex-shrink-0 ml-3 text-right">
            <template v-if="selectedPill && selectedPill.format === 'sparkline'">
              <DsSparkline :data="row[selectedKey] || []" :width="sparklineSize.width" :height="sparklineSize.height" />
            </template>
            <template v-else-if="selectedPill">
              <DsSkeleton
                v-if="metricLoading(row, selectedKey)"
                type="block"
                height="var(--extension-market-table-value-skeleton-height)"
                width="var(--extension-market-table-value-skeleton-width)"
                class="inline-block"
              />
              <!-- 등락률은 데스크탑 표와 동일하게 pill로 표시 (값이 있을 때만) -->
              <DsSignedValue
                v-else-if="isChangeMetric && row[selectedKey] != null"
                :value="row[selectedKey]"
                :formatter="() => metricDisplay(row)"
                :stale="!!row.stale"
                tone="pill"
                class="rounded-full"
              />
              <DsSkeleton
                v-else-if="isPriceMetric && row[selectedKey] == null"
                type="block"
                height="var(--extension-financial-price-skeleton-height)"
                width="var(--extension-financial-price-skeleton-width)"
                class="inline-block"
              />
              <div
                v-else
                :class="['metric-value text-sm font-semibold tabular-nums inline-flex items-center justify-end gap-1', metricValueClass(row), (isPriceMetric && row.stale) ? 'text-text-tertiary' : '']"
              >
                <!-- 도메인 표식(예: NXT) 주입 seam -->
                <slot name="metric-prefix" :row="row" :metric-key="selectedKey" :is-price="isPriceMetric" />
                {{ metricDisplay(row) }}
              </div>

            </template>
          </div>
        </div>
      </div>
    </DsDataState>

    <DsPagination
      v-if="pagination && pagination.total > pagination.size"
      class="ds-market-cards__pagination"
      :current-page="pagination.page"
      :total-pages="Math.ceil(pagination.total / pagination.size)"
      :total-rows="pagination.total"
      :page-size="pagination.size"
      show-info
      @change="$emit('page-change', $event)"
    />

    <div
      v-if="showFooter && !initialLoading && rows.length > 0"
      class="ds-market-cards__footer px-4 py-3 border-t border-border flex items-center justify-between text-xs text-text-tertiary"
    >
      <span v-if="calculatedAt">마지막 업데이트: {{ $formatDate(calculatedAt, { format: 'datetime' }) }}</span>
      <span v-else-if="footerNote">{{ footerNote }}</span>
      <span v-else />
      <span>총 {{ totalCount }}{{ unitLabel }}</span>
    </div>
    </slot>
  </div>
</template>

<script>
import { tokens } from "@kjun-ui/tokens";
import DsCollectionMark from "./CollectionMark.vue";
import DsDataState from "../feedback/DataState.vue";
import DsEmpty from "./Empty.vue";
import DsListSkeleton from "./ListSkeleton.vue";
import DsPagination from "../navigation/Pagination.vue";
import DsSignedValue from "./SignedValue.vue";
import DsSkeleton from "./Skeleton.vue";
import { componentMixins } from "../../component-mixins.js";
import AssetIdentity from '@kjun-adapter/AssetIdentity.js'
import queryDisplayMixin from '@kjun-adapter/queryDisplayMixin.js'
import DsSparkline from './Sparkline.vue'
import {
  pillsFromColumns,
  formatMetricValue,
  getInvestorClass,
  loadFromStorage,
  saveToStorage,
} from './_marketFormat'

export default {
  mixins: [queryDisplayMixin, ...componentMixins],
  name: 'MarketCards',
  components: { AssetIdentity, DsSparkline, DsCollectionMark, DsDataState, DsEmpty, DsListSkeleton, DsPagination, DsSignedValue, DsSkeleton },
  props: {
    rows: { type: Array, default: () => [] },
    columns: { type: Array, required: true },
    rowKey: { type: String, default: 'id' },
    // 지표 선언 (라벨/포맷/정렬키/방향) 단일 출처
    metricConfig: { type: Object, required: true },
    // pill 제외 컬럼 (종목명/순위 등 비지표)
    excludeKeys: { type: Array, default: () => [] },
    // localStorage 네임스페이스 (예: 'coin:list', 'stock:mobile:screener')
    storageNamespace: { type: String, required: true },
    loading: { type: Boolean, default: false },
    interestKeys: { type: Set, default: () => new Set() },
    favoriteKeys: { type: Set, default: () => new Set() },
    sortKey: { type: String, default: null },
    sortOrder: { type: String, default: 'desc' },
    // 마운트/컬럼변경 시 기본 pill의 sort를 부모로 자동 전파할지.
    // false이면 반응형 목록의 재생성이나 컬럼 변경으로 부모 정렬을 덮어쓰지 않는다.
    emitSortOnMount: { type: Boolean, default: true },
    pagination: { type: Object, default: null },
    // 통화 분기 ('usd' | 'krw')
    currency: { type: String, default: 'krw' },
    // 도메인 라벨 접근자
    primaryLabel: { type: Function, default: (row) => String(row && row.name != null ? row.name : '') },
    subMeta: { type: Function, default: () => '' },
    // 어떤 metric key가 등락률 pill / 가격인지
    changeMetricKey: { type: String, default: 'change_rate' },
    priceMetricKeys: { type: Array, default: () => ['current_price', 'close_price'] },
    metricLoading: { type: Function, default: () => false },
    emptyMessage: { type: String, default: '항목이 없습니다' },
    emptySubMessage: { type: String, default: '' },
    showFooter: { type: Boolean, default: true },
    calculatedAt: { type: String, default: null },
    footerNote: { type: String, default: '' },
    totalCount: { type: Number, default: 0 },
    unitLabel: { type: String, default: '개' },
  },
  data() {
    return {
      // sortOrder는 부모가 단일 진실 저장소로 관리. 로컬 direction 상태를 두지 않아
      // arrow 표시와 실제 정렬이 엇갈리는 상황을 원천 차단한다.
      selectedKey: null,
    }
  },
  computed: {
    sparklineSize() { return { width: tokens.extensions.marketTable.sparklineWidth, height: tokens.extensions.marketTable.sparklineHeight } },
    pills() {
      return pillsFromColumns(this.columns, this.metricConfig, this.excludeKeys)
    },
    selectedPill() {
      return this.pills.find((p) => p.key === this.selectedKey) || this.pills[0] || null
    },
    isChangeMetric() {
      return this.selectedKey === this.changeMetricKey
    },
    isPriceMetric() {
      return this.priceMetricKeys.includes(this.selectedKey)
    },
    formatHelpers() {
      return {
        formatNumber: this.$formatNumber,
        formatKRW: this.$formatKRW,
        formatPrice: this.$formatPrice,
        formatBigKRW: this.$formatBigKRW,
        formatCompact: this.$formatCompact,
        formatPercent: this.$formatPercent,
      }
    },
  },
  mounted() {
    this.$nextTick(() => {
      if (this.selectedKey) this.scrollRefIntoView(`pill_${this.selectedKey}`)
    })
  },
  watch: {
    columns: {
      immediate: true,
      handler() {
        if (!this.pills.length) {
          this.selectedKey = null
          return
        }

        const pillStorageKey = `${this.storageNamespace}:pill`
        const stored = loadFromStorage(pillStorageKey, null)
        const validPill = stored && this.pills.some((p) => p.key === stored)

        if (validPill) {
          this.selectedKey = stored
        } else {
          const defaultPill = this.pills.find((p) => p.isDefaultSort) ||
            this.pills.find((p) => p.sortKey) || this.pills[0]
          this.selectedKey = defaultPill.key
          // stored가 있는데 invalid인 경우에만 기본값으로 덮어써 다음 복원이 제대로 되게 한다.
          if (stored) saveToStorage(pillStorageKey, this.selectedKey)
        }

        // 부모가 정렬을 관리하는 경우 표시 지표 복원만으로 정렬 요청을 보내지 않는다.
        if (!this.emitSortOnMount) return
        const activePill = this.pills.find((p) => p.key === this.selectedKey)
        // 부모가 이미 같은 기본 정렬을 가지면 진입 emit으로 방향을 반전시키지 않는다.
        if (activePill && activePill.sortKey && activePill.sortKey !== this.sortKey) {
          this.$emit('sort', activePill.sortKey)
        }
      },
    },
  },
  methods: {
    // pill 정렬 화살표 표시 여부.
    // 자동 정렬을 끈 경우 부모의 실제 정렬축과 일치하는 지표에만 화살표를 표시한다.
    arrowVisible(pill) {
      if (this.selectedKey !== pill.key || !pill.sortKey) return false
      return this.emitSortOnMount || pill.sortKey === this.sortKey
    },
    isInterest(row) {
      return this.interestKeys.has(row[this.rowKey])
    },
    isFavorite(row) {
      return this.favoriteKeys.has(row[this.rowKey])
    },
    selectPill(key) {
      const pill = this.pills.find((p) => p.key === key)
      if (!pill) return
      this.selectedKey = key
      saveToStorage(`${this.storageNamespace}:pill`, this.selectedKey)
      this.$nextTick(() => this.scrollRefIntoView(`pill_${key}`))
      // 부모 handleSort가 "같은 key 재발행 = 방향 반전"으로 처리하므로 재탭 토글은 부모에 위임
      if (pill.sortKey) this.$emit('sort', pill.sortKey)
    },
    scrollRefIntoView(refName) {
      const el = this.$refs[refName]
      const target = Array.isArray(el) ? el[0] : el
      if (target && typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
      }
    },
    metricDisplay(row) {
      if (!this.selectedPill) return '-'
      return formatMetricValue(row[this.selectedKey], this.selectedPill.format, { currency: this.currency }, this.formatHelpers)
    },
    metricValueClass(row) {
      if (!this.selectedPill) return ''
      const format = this.selectedPill.format
      if (format === 'percent' && this.isChangeMetric) {
        const num = Number(row[this.selectedKey])
        if (num > 0) return 'text-price-up'
        if (num < 0) return 'text-price-down'
        return ''
      }
      if (format === 'investor' || format === 'net_amount' || format === 'net_volume') {
        return getInvestorClass(row[this.selectedKey])
      }
      return ''
    },
    // 등락률 pill: 가격이 stale이면 부호색 대신 text-text-tertiary로 톤다운 (현재가 dim과 동일 규칙)

  },
}
</script>

<style scoped>
/* 가로 스크롤 pill의 스크롤바 숨김은 Tailwind 유틸리티로 표현 불가해 scoped style을 사용한다. */
.metric-pills {
  display: flex;
  gap: var(--_kjun-geometry-dimension-value8);
  overflow-x: auto;
  padding: var(--_kjun-geometry-dimension-value10) var(--_kjun-geometry-dimension-value16);
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.metric-pills::-webkit-scrollbar {
  display: none;
}
.metric-pill {
  flex: 0 0 auto;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 0;
  padding: var(--_kjun-geometry-dimension-value8) var(--_kjun-geometry-dimension-value16);
  border-radius: var(--_kjun-geometry-radius-radius9999);
  font-size: var(--_kjun-type-label-size);
  white-space: nowrap;
  cursor: pointer;
  transition: background-color var(--motion-control) var(--ease-out), color var(--motion-control) var(--ease-out);
  line-height: var(--_kjun-type-label-line);
  font-weight: var(--_kjun-type-label-weight);
  letter-spacing: var(--_kjun-type-label-tracking);
}
.metric-pill:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--focus-ring);
}
.metric-pill-active {
  background: var(--brand);
  color: var(--on-brand);
  font-weight: var(--_kjun-type-number-lg-weight);
}
.pill-arrow {
  margin-left: var(--_kjun-geometry-dimension-value4);
  font-size: var(--_kjun-type-caption-size);
  line-height: var(--_kjun-type-caption-line);
  font-weight: var(--_kjun-type-caption-weight);
  letter-spacing: var(--_kjun-type-caption-tracking);
}
</style>
