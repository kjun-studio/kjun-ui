<template>
  <div class="ds-table-query-state" :class="showCardMode ? '' : 'overflow-hidden'" :aria-busy="loading ? 'true' : 'false'">
    <!-- 선택 툴바 -->
    <div
      v-if="selectable && selected.length > 0"
      role="toolbar"
      aria-label="선택 작업"
      class="flex items-center gap-2 px-3 py-2 bg-selected-bg border-b border-brand/30 text-sm"
    >
      <span class="text-brand font-semibold">{{ selected.length }}개 선택</span>
      <span class="text-text-disabled">|</span>
      <button
        type="button"
        class="text-text-secondary hover:text-text-primary text-sm"
        @click.stop="toggleAll"
      >전체 선택</button>
      <button
        type="button"
        class="text-text-secondary hover:text-text-primary text-sm"
        @click.stop="clearSelection"
      >선택 해제</button>
      <div class="flex-1"></div>
      <slot name="selection-toolbar" :selected="selected"></slot>
    </div>

    <!-- Toolbar: 검색 + 커스텀 필터 -->
    <!-- Like React and Native: the shared sm search field on a surface toolbar, so the field stands out. -->
    <div v-if="searchable || $slots.toolbar" class="flex flex-wrap items-center gap-2 px-3 py-2 bg-card-bg border-b border-border-primary">
      <div v-if="searchable" class="flex-shrink-0 w-table-search-width max-w-full">
        <DsInput
          :value="searchQuery"
          size="sm"
          prefix-icon="search"
          clearable
          aria-label="표 검색"
          :placeholder="searchPlaceholder"
          @input="searchQuery = $event; handleSearch()"
          @clear="clearSearch"
        />
      </div>
      <slot name="toolbar"></slot>
    </div>

    <!-- 행 스켈레톤은 표/카드가 열 구조 안에서 그린다. 공통 상태는 오류와 갱신 피드백을 맡는다. -->
    <DsDataState
      :query-key="queryKey"
      :result-key="usesQueryState ? (hasCurrentResult ? queryKey : null) : undefined"
      :has-loaded-once="hasLoadedOnce"
      :error="error"
      :refreshing="queryRefreshing"
      loading-padding="none"
      v-on="$listeners.retry ? { retry: $listeners.retry } : {}"
    >
    <!-- 카드 모드: 모바일에서 각 행을 카드로 변환 -->
    <TableCards v-if="showCardMode"
      :loading="loading"
      :initial-loading="initialLoading"
      :skeleton-rows="skeletonRows"
      :empty-text="emptyText"
      :selectable="selectable"
      :expandable="expandable"
      :card-subtitle="cardSubtitle"
      :auto-card-title="autoCardTitle"
      :sorted-data="sortedData"
      :badge-columns="badgeColumns"
      :actions-column="actionsColumn"
      :inline-card-actions="inlineCardActions"
      :inline-card-columns="inlineCardColumns"
      :card-body-columns="cardBodyColumns"
      :card-section-groups="cardSectionGroups"
      :get-row-key="getRowKey"
      :get-value="getValue"
      :custom-row-class="customRowClass"
      :is-selected="isSelected"
      :toggle-row="toggleRow"
      :format-value="formatValue"
      :card-section-layout-class="cardSectionLayoutClass"
      :card-columns-for-section="cardColumnsForSection"
      :card-body-columns-for="cardBodyColumnsFor"
      :toggle-expand="toggleExpand"
      :is-expanded="isExpanded"
      :handle-row-key="handleRowKey"
      :handle-row-click="handleRowClick"
      :has-row-action="!!$listeners['row-click']"
    >
      <template v-for="(_, name) in $scopedSlots" v-slot:[name]="slotProps"><slot :name="name" v-bind="slotProps" /></template>
    </TableCards>

    <!-- 기존 테이블 (일반 + 컴팩트 모드) -->
    <div v-else class="ds-table-scroll-shell">
      <div
        ref="tableScrollWrapper"
        :class="[tableWrapperClasses, 'ds-table-scroll-wrapper']"
        :style="tableWrapperStyle"
        @scroll="handleTableScroll"
      >
      <table class="w-full ds-table-grid" :data-compact="String(compact)" :aria-label="ariaLabel || undefined">
        <thead :class="stickyHeader ? 'sticky top-0 z-10' : ''">
          <tr>
            <th
              v-if="selectable"
              scope="col"
              class="ds-table-action-cell text-center ds-table-header"
            >
              <TableCheck
                :checked="isAllSelected"
                :indeterminate="isIndeterminate"
                aria-label="전체 선택"
                @change="toggleAll"
              />
            </th>
            <th
              v-if="expandable"
              scope="col"
              class="ds-table-action-cell ds-table-header"
            ></th>
            <th
              v-for="col in visibleColumns"
              :key="col.key"
              scope="col"
              :class="headerCellClasses(col)"
              :style="col.width ? { width: col.width } : {}"
              :aria-sort="getAriaSort(col)"
              :tabindex="col.sortable && sortable ? 0 : undefined"
              :role="col.sortable ? 'columnheader' : undefined"
              @click="handleSort(col)"
              @keydown.enter.prevent="handleSort(col)"
              @keydown.space.prevent="handleSort(col)"
            >
              <div :class="['flex items-center gap-1', headerJustifyClass(col)]">
                <span>{{ col.label }}</span>
                <template v-if="col.sortable && sortable && sortKey === col.key">
                  <DsIcon :name="sortOrder === 'asc' ? 'sort-ascending' : 'sort-descending'" class="text-xs" />
                </template>
              </div>
            </th>
          </tr>
        </thead>

        <tbody :class="tbodyClasses">
          <!-- Loading -->
          <template v-if="initialLoading">
            <tr v-for="index in skeletonRows" :key="'loading-' + index" aria-hidden="true">
              <td v-if="selectable" class="ds-table-action-cell"><DsSkeleton type="block" height="var(--_kjun-geometry-table-selection-size)" width="var(--_kjun-geometry-table-selection-size)" /></td>
              <td v-if="expandable" class="ds-table-action-cell"></td>
              <td v-for="col in visibleColumns" :key="col.key"  :style="col.width ? { width: col.width } : {}">
                <DsSkeleton type="block" :height="tableGeometry.skeletonHeight + 'px'" :width="col.key === 'actions' ? tableGeometry.actionColumnWidth + 'px' : '75%'" />
              </td>
            </tr>
          </template>

          <!-- Empty -->
          <tr v-else-if="sortedData.length === 0">
            <td :colspan="expandColspan" class="ds-table-empty-cell text-center">
              <slot name="empty">
                <p class="text-sm text-text-secondary">{{ emptyText }}</p>
              </slot>
            </td>
          </tr>

          <!-- Data Rows -->
          <template
            v-else
            v-for="(row, idx) in sortedData"
          >
            <tr
              :key="getRowKey(row, idx)"
              :class="['kjun-table-row-action', rowClasses(row, idx)]"
              :tabindex="$listeners['row-click'] ? 0 : undefined"
              @keydown="handleRowKey($event, row, idx)"
              @click="handleRowClick(row, idx)"
            >
              <td v-if="selectable" class="ds-table-action-cell text-center">
                <TableCheck
                  :checked="isSelected(row)"
                  aria-label="행 선택"
                  @change="toggleRow(row)"
                  @click.stop
                />
              </td>
              <td v-if="expandable" class="ds-table-action-cell text-center">
                <!-- The shared xs ghost button, like React and Native, so the row keeps their height. -->
                <DsButton
                  variant="ghost"
                  size="xs"
                  :prefix-icon="isExpanded(row) ? 'chevron-down' : 'chevron-right'"
                  aria-label="행 확장"
                  :aria-expanded="String(isExpanded(row))"
                  @click.stop="toggleExpand(row)"
                />
              </td>
              <td
                v-for="col in visibleColumns"
                :key="col.key"
                :class="cellClasses(col, row)"
              >
                <slot :name="`cell-${col.key}`" :row="row" :value="getValue(row, col.key)" :index="idx">
                  <span v-if="col.pill" :class="pillClasses(getValue(row, col.key))">
                    {{ formatValue(getValue(row, col.key), col, row) }}
                  </span>
                  <template v-else>
                    {{ formatValue(getValue(row, col.key), col, row) }}
                  </template>
                </slot>
              </td>
            </tr>
            <!-- 확장행 -->
            <tr
              v-if="expandable && isExpanded(row)"
              :key="getRowKey(row, idx) + '-expand'"
              class="bg-bg-secondary"
            >
              <td :colspan="expandColspan" class="ds-table-expanded-cell">
                <slot name="expand" :row="row" :index="idx"></slot>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
      </div>
      <div v-if="showRightScrollHint" class="ds-table-scroll-fade" aria-hidden="true"></div>
    </div>

    <!-- Pagination -->
    <ds-pagination
      v-if="pagination && paginationTotalPages > 1"
      :current-page="pagination.page"
      :total-pages="paginationTotalPages"
      :total-rows="pagination.total"
      :page-size="pagination.pageSize || 20"
      :show-info="true"
      @change="handlePageChange"
    />
    </DsDataState>
  </div>
</template>

<script>
import DsDataState from "../feedback/DataState.vue";
import DsIcon from "../../icon.js";
import DsInput from "../primitives/Input.vue";
import DsButton from "../primitives/Button.vue";
import DsPagination from "../navigation/Pagination.vue";
import DsSkeleton from "./Skeleton.vue";
import { componentMixins } from "../../component-mixins.js";
import { domainColorMixin } from "../../domain-colors.js";
import queryDisplayMixin from '@kjun-adapter/queryDisplayMixin.js'
import TableCards from './table/TableCards.vue'
import TableCheck from './table/TableCheck.vue'
import tableSelection from './_tableSelection'
import { isComposingKey, tokens } from '@kjun-ui/tokens'
import tableSorting from './table/sorting.js'
import tableLayout from './table/layout.js'
import tableSearch from './table/search.js'
import tableCards from './table/cards.js'
import tableExpansion from './table/expansion.js'
import tableViewport from './table/viewport.js'


export default {
  name: 'DsTable',
  components: { TableCards, TableCheck, DsButton, DsDataState, DsIcon, DsInput, DsPagination, DsSkeleton },
  mixins: [tableSelection, tableSorting, tableLayout, tableSearch, tableCards, tableExpansion, tableViewport, queryDisplayMixin, ...componentMixins,
    domainColorMixin(vm => !vm.initialLoading && vm.data.length > 0 && vm.columns.some(column => column.pill))],
  props: {
    skeletonRows: { type: Number, default: 8 },
    columns: {
      type: Array,
      required: true
    },
    data: {
      type: Array,
      default: () => []
    },
    rowKey: {
      type: String,
      default: 'id'
    },
    loading: {
      type: Boolean,
      default: false
    },
    emptyText: {
      type: String,
      default: '데이터가 없습니다'
    },
    sortable: {
      type: Boolean,
      default: true
    },
    hoverable: {
      type: Boolean,
      default: true
    },
    // v2 신규 Props
    searchable: {
      type: Boolean,
      default: false
    },
    searchPlaceholder: {
      type: String,
      default: '검색...'
    },
    stickyHeader: {
      type: Boolean,
      default: false
    },
    maxHeight: {
      type: [Number, String],
      default: null
    },
    pagination: {
      type: Object,
      default: null
    },
    compact: {
      type: Boolean,
      default: false
    },
    striped: {
      type: Boolean,
      default: false
    },
    ariaLabel: {
      type: String,
      default: null
    },
    responsive: {
      type: String,
      default: null,
      validator: v => v === null || ['card', 'compact', 'none'].includes(v)
    },
    mobileColumns: {
      type: Array,
      default: () => []
    },
    cardTitle: {
      type: String,
      default: null
    },
    cardSubtitle: {
      type: String,
      default: null
    },
    // 모바일 카드에서 레그·메트릭처럼 의미가 다른 필드를 섹션으로 묶을 때 사용한다.
    // 지정하지 않으면 기존 2열 카드 레이아웃을 유지해 다른 페이지의 표시를 바꾸지 않는다.
    cardSections: {
      type: Array,
      default: () => []
    },
    // Expandable
    expandable: {
      type: Boolean,
      default: false
    },
    expandedRows: {
      type: Array,
      default: undefined
    },
    expandSingle: {
      type: Boolean,
      default: false
    },
    // 행 단위 추가 클래스. 문자열 또는 (row, idx) => string 함수 — 상태별 행 강조(예: 에러 행 배경)에 사용
    rowClass: {
      type: [Function, String],
      default: null
    }
  },
  computed: {
    tableGeometry() { return tokens.table; },
    paginationTotalPages() {
      if (!this.pagination) return 0
      const pageSize = this.pagination.pageSize || 20
      return Math.ceil(this.pagination.total / pageSize)
    },
    expandColspan() {
      let count = this.visibleColumns.length
      if (this.expandable) count += 1
      if (this.selectable) count += 1
      return count
    },

  },
  methods: {
    getValue(row, key) {
      return key.split('.').reduce((o, k) => o && o[k], row)
    },
    getRowKey(row, idx) {
      return row[this.rowKey] ?? idx
    },
    formatValue(value, col, row) {
      if (value === null || value === undefined) return '-'

      // col.format 우선 적용
      if (col.format && typeof col.format === 'function') {
        return col.format(value, row)
      }

      if (col.type === 'number') {
        return typeof value === 'number' ? this.$formatNumber(value) : value
      }
      if (col.type === 'date') {
        return this.$formatDate(value, { format: 'date' })
      }
      if (col.type === 'datetime') {
        return this.$formatDate(value, { format: 'datetime' })
      }

      return value
    },
    handleRowClick(row, idx) {
      this.$emit('row-click', row, idx)
    },
    handleRowKey(event, row, idx) {
      if (!this.$listeners['row-click'] || event.target !== event.currentTarget || event.defaultPrevented || isComposingKey(event)) return
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        this.handleRowClick(row, idx)
      }
    },
    handlePageChange(page) {
      this.$emit('page-change', page)
    },

  },

}
</script>

<style scoped src="./table/table.css"></style>
