import { tokens } from '@kjun/tokens'

export default {
  data() {
    return { isMobile: false, mediaQuery: null, hasHorizontalOverflow: false, isScrolledToRight: true }
  },
  computed: {
    showCardMode() {
      if (this.responsive === 'none') return false
      if (this.responsive === 'card') return this.isMobile
      if (!this.responsive && this.columns.length >= 4) return this.isMobile
      return false
    },
    showCompactMode() {
      return this.responsive === 'compact' && this.isMobile
    },
    visibleColumns() {
      if (!this.showCompactMode || !this.mobileColumns.length) return this.columns
      return this.columns.filter(col => this.mobileColumns.includes(col.key))
    },
    showRightScrollHint() {
      return this.hasHorizontalOverflow && !this.isScrolledToRight
    }
  },
  methods: {
    handleMediaChange(e) {
      this.isMobile = e.matches
      this.$nextTick(() => this.updateScrollHint())
    },
    handleTableScroll() {
      this.updateScrollHint()
    },
    updateScrollHint() {
      const wrapper = this.$refs.tableScrollWrapper
      if (!wrapper) {
        this.hasHorizontalOverflow = false
        this.isScrolledToRight = true
        return
      }

      const hasOverflow = wrapper.scrollWidth > wrapper.clientWidth + 1
      this.hasHorizontalOverflow = hasOverflow
      this.isScrolledToRight = !hasOverflow || wrapper.scrollLeft + wrapper.clientWidth >= wrapper.scrollWidth - 1
    },
  },
  mounted() {
    this.mediaQuery = window.matchMedia(`(width < ${tokens.table.mobileBreakpoint}px)`)
    this.isMobile = this.mediaQuery.matches
    this.mediaQuery.addEventListener('change', this.handleMediaChange)
    window.addEventListener('resize', this.updateScrollHint)
    this.$nextTick(() => this.updateScrollHint())
  },
  updated() {
    this.$nextTick(() => this.updateScrollHint())
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateScrollHint)
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.handleMediaChange)
    }
  }
}
