export default {
  data() { return { searchQuery: '', searchDebounceTimer: null } },
  methods: {
    cancelSearch() {
      clearTimeout(this.searchDebounceTimer)
      this.searchDebounceTimer = null
    },
    notifySearch(query) { this.$emit('search', query) },
    handleSearch() {
      this.cancelSearch()
      const query = this.searchQuery
      this.searchDebounceTimer = setTimeout(() => {
        this.searchDebounceTimer = null
        this.notifySearch(query)
      }, 300)
    },
    clearSearch() {
      this.cancelSearch()
      this.searchQuery = ''
      this.notifySearch('')
    },
  },
  beforeDestroy() { this.cancelSearch() },
}
