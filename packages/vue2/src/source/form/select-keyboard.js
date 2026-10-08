import { isComposingKey } from "@kjun-ui/tokens";

export default {
  methods: {
    handleSearchKeydown(event) {
      if (isComposingKey(event, this.composing)) {
        event.stopPropagation();
        return;
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (event.key === 'ArrowDown') this.openAndFocusFirst();
        else this.openAndFocusLast();
      } else if (event.key === 'Escape') this.handleEscape(event);
    },
    openAndFocusFirst() {
      if (this.disabled) return
      this.requestOpen(true)
      this.$nextTick(() => this.isOpen && this.focusOption(this.enabledIndexes[0]))
    },
    openAndFocusLast() {
      if (this.disabled) return
      this.requestOpen(true)
      this.$nextTick(() => this.isOpen && this.focusOption(this.enabledIndexes[this.enabledIndexes.length - 1]))
    },
    focusNextOption() {
      const indexes = this.enabledIndexes
      this.focusOption(indexes[(indexes.indexOf(this.focusedIndex) + 1) % indexes.length])
    },
    focusPrevOption() {
      const indexes = this.enabledIndexes, current = indexes.indexOf(this.focusedIndex)
      this.focusOption(indexes[current <= 0 ? indexes.length - 1 : current - 1])
    },
    focusOption(index) {
      this.focusedIndex = index ?? -1
      const ref = this.$refs[`option-${index}`]
      const el = Array.isArray(ref) ? ref[0] : ref
      // fixed 목록의 포커스가 페이지 스크롤을 유발해 즉시 닫히지 않도록 한다.
      if (!el) return
      el.focus({ preventScroll: true })
      const list = el.parentElement
      const optionRect = el.getBoundingClientRect()
      const listRect = list.getBoundingClientRect()
      if (optionRect.bottom > listRect.bottom) list.scrollTop += optionRect.bottom - listRect.bottom
      else if (optionRect.top < listRect.top) list.scrollTop -= listRect.top - optionRect.top
    },
    selectFocusedOption() {
      const option = this.visibleOptions[this.focusedIndex]
      if (option !== undefined) this.select(option)
    },
  },
};
