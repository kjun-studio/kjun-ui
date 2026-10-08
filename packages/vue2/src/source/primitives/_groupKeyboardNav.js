/**
 * 버튼 그룹(DsButtonGroup, DsFilterGroup)의 화살표 키 포커스 이동 믹스인.
 * 컨테이너에 @keydown="handleGroupKeydown"을 바인딩하면
 * ←/→는 이전/다음 버튼, Home/End는 처음/끝 버튼으로 포커스를 옮긴다 (순환).
 */
export default {
  methods: {
    handleGroupKeydown(e) {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return

      const buttons = Array.from(this.$el.querySelectorAll('button:not(:disabled)'))
      if (buttons.length === 0) return

      e.preventDefault()
      const current = buttons.indexOf(document.activeElement)
      let next
      if (e.key === 'Home') {
        next = 0
      } else if (e.key === 'End') {
        next = buttons.length - 1
      } else if (e.key === 'ArrowLeft') {
        next = current <= 0 ? buttons.length - 1 : current - 1
      } else {
        next = current === -1 || current === buttons.length - 1 ? 0 : current + 1
      }
      buttons[next].focus()
    }
  }
}
