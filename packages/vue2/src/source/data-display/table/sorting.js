import { nextTableSort } from '@kjun/tokens'

export default {
  props: {
    sort: { type: Object, default: undefined },
    sortMode: { type: String, default: 'client', validator: value => ['client', 'server'].includes(value) },
  },
  data() {
    return { internalSort: { key: '', order: 'asc' } }
  },
  computed: {
    activeSort() { return this.sort === undefined ? this.internalSort : this.sort },
    sortKey() { return this.activeSort?.key || '' },
    sortOrder() { return this.activeSort?.order || 'asc' },
    sortedData() {
      if (!this.sortKey || !this.sortable || this.sortMode === 'server') return this.data
      return [...this.data].sort((a, b) => {
        const aVal = this.getValue(a, this.sortKey)
        const bVal = this.getValue(b, this.sortKey)
        if (aVal === bVal) return 0
        const result = aVal > bVal ? 1 : -1
        return this.sortOrder === 'asc' ? result : -result
      })
    },
  },
  methods: {
    handleSort(col) {
      if (!col.sortable || !this.sortable) return
      const next = nextTableSort(this.activeSort, col.key)
      if (this.sort === undefined) this.internalSort = next
      this.$emit('update:sort', next)
      this.$emit('sort-change', next)
    },
    getAriaSort(col) {
      if (!col.sortable || !this.sortable) return undefined
      if (this.sortKey !== col.key) return 'none'
      return this.sortOrder === 'asc' ? 'ascending' : 'descending'
    },
  },
}
