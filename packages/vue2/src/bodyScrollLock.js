const owners = new Set()
let previousOverflow = ''

// 중첩 오버레이가 닫히는 순서와 관계없이 마지막 소유자가 원래 상태(전체화면 포함)를 복원한다.
export function createBodyScrollLock() {
  const owner = Symbol('body-scroll-lock')
  return {
    acquire() {
      if (owners.has(owner)) return
      if (!owners.size) previousOverflow = document.body.style.overflow
      owners.add(owner)
      document.body.style.overflow = 'hidden'
    },
    release() {
      if (!owners.delete(owner) || owners.size) return
      // 상위 페이지가 먼저 전체화면을 종료한 경우 그 해제를 덮어쓰지 않는다.
      if (document.body.style.overflow === 'hidden') document.body.style.overflow = previousOverflow
      previousOverflow = ''
    },
  }
}
