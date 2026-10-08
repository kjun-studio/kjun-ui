// frontend/src/components/design-system/data-display/_tableSelection.js
/**
 * DsTable 행 선택 mixin
 * selectable prop 활성화 시 체크박스 + 선택 툴바 제공
 */
export default {
  props: {
    selectable: {
      type: Boolean,
      default: false
    },
    selected: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    isAllSelected() {
      return this.sortedData.length > 0 &&
        this.sortedData.every(row => this.isSelected(row))
    },
    isIndeterminate() {
      // 현재 페이지에 표시된 행 중 선택된 수만 계산 (서버사이드 페이지네이션 대응)
      const visibleSelected = this.sortedData.filter(row => this.isSelected(row)).length
      return visibleSelected > 0 && visibleSelected < this.sortedData.length
    }
  },
  methods: {
    _getRowId(row) {
      return row[this.rowKey]
    },
    isSelected(row) {
      // API 재조회 시 객체 참조가 바뀌므로 rowKey 기준으로 비교
      const id = this._getRowId(row)
      return this.selected.some(r => this._getRowId(r) === id)
    },
    toggleRow(row) {
      const id = this._getRowId(row)
      const next = this.isSelected(row)
        ? this.selected.filter(r => this._getRowId(r) !== id)
        : [...this.selected, row]
      this.$emit('selection-change', next)
    },
    toggleAll() {
      const next = this.isAllSelected ? [] : [...this.sortedData]
      this.$emit('selection-change', next)
    },
    clearSelection() {
      this.$emit('selection-change', [])
    }
  }
}
