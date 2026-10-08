export default {
  computed: {
    tableWrapperClasses() {
      const classes = ['overflow-x-auto']
      if (this.maxHeight) {
        classes.push('overflow-y-auto')
      }
      return classes.join(' ')
    },
    tableWrapperStyle() {
      if (!this.maxHeight) return {}
      const val = typeof this.maxHeight === 'number' ? `${this.maxHeight}px` : this.maxHeight
      return { maxHeight: val }
    },
    tbodyClasses() {
      const classes = ['divide-y divide-border-primary']
      if (this.striped) {
        classes.push('ds-table-striped')
      }
      return classes.join(' ')
    },

  },
  methods: {
    headerCellClasses(col) {
      const px = ''
      const base = `${px} text-left ds-table-header`
      const sortable = col.sortable && this.sortable ? 'cursor-pointer hover:bg-bg-hover select-none' : ''
      const align = col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''
      return [base, sortable, align].filter(Boolean).join(' ')
    },
    headerJustifyClass(col) {
      if (col.align === 'right') return 'justify-end'
      if (col.align === 'center') return 'justify-center'
      return ''
    },
    pillClasses(value) {
      const num = typeof value === 'string' ? parseFloat(value) : value
      if (typeof num !== 'number' || isNaN(num) || num === 0) return 'ds-table-pill'
      return num > 0 ? 'ds-table-pill ds-table-pill-up' : 'ds-table-pill ds-table-pill-down'
    },
    cellClasses(col, row) {
      const px = ''
      const align = col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''
      const numeric = col.type === 'number' ? 'tabular-nums' : ''
      const secondary = col.secondary ? 'ds-table-secondary' : ''

      // col.cellClass 지원
      let custom = ''
      if (col.cellClass) {
        if (typeof col.cellClass === 'function') {
          custom = col.cellClass(this.getValue(row, col.key), row)
        } else {
          custom = col.cellClass
        }
      }

      // cellClass가 텍스트 색을 지정하면 기본 text-text-primary를 뺀다 — 유틸리티 클래스는
      // 특이도가 같아 스타일시트 순서로 승부가 나므로, 기본색이 커스텀 색을 조용히 덮을 수 있다
      const hasCustomTextColor = this.hasTextColorClass(custom)
      const base = hasCustomTextColor ? `${px} text-sm` : `${px} text-sm text-text-primary`

      return [base, align, numeric, secondary, custom].filter(Boolean).join(' ')
    },
    hasTextColorClass(classString) {
      if (!classString) return false
      // text- 접두 중 색상이 아닌 유틸리티(정렬/크기/줄바꿈)는 제외
      const nonColor = /^text-(left|right|center|justify|2?xs|3xs|sm|base|lg|\d?xl|nowrap|wrap|ellipsis|clip)$/
      return String(classString)
        .split(/\s+/)
        .some(cls => cls.startsWith('text-') && !nonColor.test(cls))
    },
    // 소비자가 준 행 클래스 — 테이블 행과 카드가 공유한다
    customRowClass(row, idx) {
      return typeof this.rowClass === 'function' ? this.rowClass(row, idx) : this.rowClass
    },
    rowClasses(row, idx) {
      const base = 'transition-colors'
      const hoverable = this.hoverable ? 'hover:bg-bg-hover cursor-pointer' : ''
      const striped = this.striped && idx % 2 === 1 ? 'bg-bg-secondary/30' : ''
      const selected = this.selectable && this.isSelected(row) ? 'bg-selected-bg' : ''
      return [base, hoverable, striped, selected, this.customRowClass(row, idx)]
        .filter(Boolean)
        .join(' ')
    },
  },
}
