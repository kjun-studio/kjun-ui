export default {
  data() { return { internalExpandedRows: [] } },
  computed: {
    activeExpandedRows() {
      return this.expandedRows ?? this.internalExpandedRows
    },
  },
  methods: {
    toggleExpand(row) {
      const key = this.getRowKey(row, this.data.indexOf(row))
      const current = this.activeExpandedRows
      const isExpanded = current.includes(key)
      const next = isExpanded
        ? current.filter(k => k !== key)
        : [...(this.expandSingle ? [] : current), key]
      this.internalExpandedRows = next
      this.$emit(isExpanded ? 'row-collapse' : 'row-expand', row)
      this.$emit('update:expandedRows', next)
    },
    isExpanded(row) {
      const key = this.getRowKey(row, this.data.indexOf(row))
      return this.activeExpandedRows.includes(key)
    }
  },
}
