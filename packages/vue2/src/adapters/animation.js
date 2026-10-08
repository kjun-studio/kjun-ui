// 숫자 카운트업 애니메이션 (프레임워크 독립). DsAnimatedNumber 등에서 사용.
import { tokens } from "@kjun-ui/tokens";
const COUNT_UP_DURATION_MS = tokens.motion.number

/**
 * fromValue에서 targetValue까지 ease-out-cubic으로 보간한다.
 * 매 프레임 원시 숫자를 콜백에 넘기며, 포맷팅(₩/%/소수점)은 호출측이 담당한다.
 * @param {number} targetValue 최종 도달 값
 * @param {(current: number) => void} applyDisplay 매 프레임 호출 콜백(원시 숫자)
 * @param {number} [fromValue=0] 시작 값 (기본 0 — KpiHero 인트로 카운트업)
 * @returns {{ cancel: () => void }} 외부에서 중단할 수 있는 핸들
 */
export function startCountUp(targetValue, applyDisplay, fromValue = 0) {
  const safeTarget = Number.isFinite(targetValue) ? targetValue : 0
  const from = Number.isFinite(fromValue) ? fromValue : 0
  const start = performance.now()
  let rafHandle = null

  const step = (now) => {
    const elapsed = now - start
    const progress = Math.min(elapsed / COUNT_UP_DURATION_MS, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    applyDisplay(from + (safeTarget - from) * eased)
    if (progress < 1) {
      rafHandle = requestAnimationFrame(step)
    } else {
      rafHandle = null
    }
  }

  rafHandle = requestAnimationFrame(step)
  return { cancel: () => rafHandle && cancelAnimationFrame(rafHandle) }
}
