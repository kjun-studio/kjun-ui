export default {
  data() {
    return { internalOpen: false, searchQuery: '', visibleLimit: this.optionPageSize, focusedIndex: -1, composing: false }
  },
  computed: {
    isOpen() { return !this.disabled && (typeof this.open === 'boolean' ? this.open : this.internalOpen) },
  },
  watch: {
    disabled(value) { if (value && typeof this.open !== 'boolean') this.internalOpen = false },
    optionPageSize(value) { this.visibleLimit = value },
    isOpen(next, previous) { this.syncOpen(next, previous) },
  },
  mounted() { if (this.isOpen) this.syncOpen(true, false) },
  methods: {
    syncOpen(next, previous) {
      if (next) {
        this.$nextTick(() => {
          if (!this.isOpen) return
          this.updateDropdownPosition()
          if (this.searchable) this.$refs.searchInput?.focus({ preventScroll: true })
          // After the layer host has placed the panel; re-parenting resets scroll.
          requestAnimationFrame(() => { if (this.isOpen) this.revealSelected() })
        })
        this.attachViewportListeners()
      } else {
        if (previous) {
          const restoreFocus = this.$refs.dropdown?.contains(document.activeElement)
          this.searchQuery = ''
          this.visibleLimit = this.optionPageSize
          this.focusedIndex = -1
          this.composing = false
          if (restoreFocus) this.$refs.trigger?.focus({ preventScroll: true })
        }
        this.detachViewportListeners()
      }
    },
    // Like React Aria's listbox, an opened list starts at the (first) selected option.
    // Only the list scrolls; focus stays where it is.
    revealSelected() {
      const list = this.$refs.options
      const index = this.visibleOptions.findIndex(option => this.isSelected(option))
      const option = index < 0 ? null : this.$refs[`option-${index}`]?.[0]
      if (!list || !option) return
      const offset = option.getBoundingClientRect().bottom - list.getBoundingClientRect().bottom
      if (offset > 0) list.scrollTop += offset
    },
  },
};
