<template>
  <div
    v-if="computedTotalPages > 1 || showSizeSelector || (showInfo && totalRows > 0)"
    class="px-pagination-padding pagination-wide:px-6 py-pagination-padding border-t border-border flex flex-col pagination:flex-row pagination:items-center pagination:justify-between gap-pagination-gap"
  >
    <!-- Info (optional) -->
    <div v-if="showInfo && totalRows > 0" class="text-sm text-text-secondary">
      {{ startRow }} - {{ endRow }} / {{ $formatNumber(totalRows) }}개
    </div>
    <div v-else-if="!showInfo" class="hidden pagination:block"></div>

    <div class="kjun-pagination-controls flex items-center gap-2">
      <!-- Page Size Selector (optional) -->
      <div v-if="showSizeSelector" class="kjun-pagination-size"><DsSelect
        size="sm"
        aria-label="페이지당 항목 수"
        :value="pageSize"
        :options="pageSizeOptions.map(value => ({ value, label: `${value}개씩` }))"
        @input="onPageSizeChange"
      /></div>

      <!-- Page Buttons: Mobile compact -->
      <div v-if="computedTotalPages > 1" class="kjun-pagination-mobile flex pagination:hidden items-center gap-pagination-item-gap">
        <button
          type="button"
          :class="buttonClasses(false)"
          :disabled="computedCurrentPage <= 1"
          aria-label="이전 페이지"
          @click="changePage(computedCurrentPage - 1)"
        >
          <DsIcon size="var(--extension-pagination-icon-size)" name="chevron-left" />
        </button>
        <span class="px-pagination-label-padding-x text-sm text-text-primary whitespace-nowrap">
          <strong>{{ computedCurrentPage }}</strong> / {{ computedTotalPages }}
        </span>
        <button
          type="button"
          :class="buttonClasses(false)"
          :disabled="computedCurrentPage >= computedTotalPages"
          aria-label="다음 페이지"
          @click="changePage(computedCurrentPage + 1)"
        >
          <DsIcon size="var(--extension-pagination-icon-size)" name="chevron-right" />
        </button>
      </div>

      <!-- Page Buttons: Desktop full -->
      <div v-if="computedTotalPages > 1" class="hidden pagination:flex items-center gap-pagination-item-gap">
        <!-- First -->
        <button
          v-if="showFirstLast"
          type="button"
          :class="buttonClasses(false)"
          :disabled="computedCurrentPage <= 1"
          aria-label="첫 페이지"
          @click="changePage(1)"
        >
          <DsIcon size="var(--extension-pagination-icon-size)" name="chevrons-left" />
        </button>
        <!-- Previous -->
        <button
          type="button"
          :class="buttonClasses(false)"
          :disabled="computedCurrentPage <= 1"
          aria-label="이전 페이지"
          @click="changePage(computedCurrentPage - 1)"
        >
          <DsIcon size="var(--extension-pagination-icon-size)" name="chevron-left" />
        </button>

        <!-- Page Numbers -->
        <template v-for="(pageNum, index) in pages">
          <span
            v-if="pageNum === '...'"
            :key="'ellipsis-' + index"
            class="px-2 text-text-tertiary"
          >
            ...
          </span>
          <button
            v-else
            :key="'page-' + pageNum"
            type="button"
            :class="buttonClasses(pageNum === computedCurrentPage)"
            @click="changePage(pageNum)"
          >
            {{ pageNum }}
          </button>
        </template>

        <!-- Next -->
        <button
          type="button"
          :class="buttonClasses(false)"
          :disabled="computedCurrentPage >= computedTotalPages"
          aria-label="다음 페이지"
          @click="changePage(computedCurrentPage + 1)"
        >
          <DsIcon size="var(--extension-pagination-icon-size)" name="chevron-right" />
        </button>
        <!-- Last -->
        <button
          v-if="showFirstLast"
          type="button"
          :class="buttonClasses(false)"
          :disabled="computedCurrentPage >= computedTotalPages"
          aria-label="마지막 페이지"
          @click="changePage(computedTotalPages)"
        >
          <DsIcon size="var(--extension-pagination-icon-size)" name="chevrons-right" />
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import DsIcon from "../../icon.js";
import DsSelect from "../form/Select.vue";
import { componentMixins } from "../../component-mixins.js";
export default {
  mixins: componentMixins,
  components: { DsIcon, DsSelect },
  name: 'DsPagination',
  props: {
    // Primary prop (preferred)
    currentPage: {
      type: Number,
      default: null
    },
    // Alias for backward compatibility
    page: {
      type: Number,
      default: null
    },
    totalPages: {
      type: Number,
      required: true
    },
    // Optional features
    totalRows: {
      type: Number,
      default: 0
    },
    pageSize: {
      type: Number,
      default: 20
    },
    pageSizeOptions: {
      type: Array,
      default: () => [10, 20, 50, 100]
    },
    siblingCount: {
      type: Number,
      default: 1
    },
    showInfo: {
      type: Boolean,
      default: false
    },
    showSizeSelector: {
      type: Boolean,
      default: false
    },
    showFirstLast: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    // Support both currentPage and page props
    computedCurrentPage() {
      return this.currentPage ?? this.page ?? 1
    },
    computedTotalPages() {
      return this.totalPages
    },
    startRow() {
      return (this.computedCurrentPage - 1) * this.pageSize + 1
    },
    endRow() {
      return Math.min(this.computedCurrentPage * this.pageSize, this.totalRows)
    },
    pages() {
      const result = []
      const left = Math.max(1, this.computedCurrentPage - this.siblingCount)
      const right = Math.min(this.computedTotalPages, this.computedCurrentPage + this.siblingCount)

      if (left > 1) {
        result.push(1)
        if (left > 2) result.push('...')
      }

      for (let i = left; i <= right; i++) {
        result.push(i)
      }

      if (right < this.computedTotalPages) {
        if (right < this.computedTotalPages - 1) result.push('...')
        result.push(this.computedTotalPages)
      }

      return result
    }
  },
  methods: {
    buttonClasses(isActive) {
      const base = 'ds-pagination-button flex items-center justify-center text-sm rounded-pagination-radius transition-colors'
      const active = isActive
        ? 'bg-brand text-on-brand'
        : 'text-text-secondary hover:bg-bg-hover disabled:opacity-disabled disabled:cursor-not-allowed'
      return [base, active].join(' ')
    },
    changePage(newPage) {
      if (newPage < 1 || newPage > this.computedTotalPages || newPage === this.computedCurrentPage) return
      // Emit multiple events for flexibility
      this.$emit('update:currentPage', newPage)
      this.$emit('update:page', newPage)
      this.$emit('change', newPage)
    },
    onPageSizeChange(newSize) {
      const size = parseInt(newSize, 10)
      this.$emit('update:page-size', size)
      // Reset to page 1 when page size changes
      this.$emit('update:currentPage', 1)
      this.$emit('update:page', 1)
      this.$emit('change', 1)
    }
  }
}
</script>

<style scoped>
.ds-pagination-button {
  width: var(--extension-pagination-item-size);
  height: var(--extension-pagination-item-size);
  flex-shrink: 0;
}
</style>
