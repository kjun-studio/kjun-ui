import { tokens } from "@kjun-ui/tokens";
/**
 * 플로팅 요소(툴팁·팝오버) 위치 계산 — fixed 좌표계 기준.
 *
 * 선호 면(placement)에 공간이 부족하면 반대 면으로 flip하고,
 * 교차축으로는 트리거 중심에 맞추되 뷰포트 밖으로 나가지 않게 clamp한다.
 * 화살표는 트리거 중심을 가리키되 박스 안쪽으로 clamp한 오프셋을 함께 돌려준다.
 *
 * @param {DOMRect} trigger  트리거 요소의 getBoundingClientRect()
 * @param {DOMRect} floating 플로팅 요소의 getBoundingClientRect()
 * @param {{placement?: 'top'|'bottom'|'left'|'right', gap?: number, margin?: number, arrowSize?: number, flip?: boolean}} options
 * @returns {{top: number, left: number, placement: string, arrow: {left?: number, top?: number}}}
 */
const SIDES = ['top', 'bottom', 'left', 'right']
const OPPOSITE = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

function fitsOnSide(side, trigger, floating, gap, margin, vw, vh) {
  switch (side) {
    case 'top': return trigger.top - gap - floating.height >= margin
    case 'bottom': return trigger.bottom + gap + floating.height <= vh - margin
    case 'left': return trigger.left - gap - floating.width >= margin
    case 'right': return trigger.right + gap + floating.width <= vw - margin
    default: return true
  }
}

export function computeFloatingPosition(trigger, floating, options = {}) {
  const { placement = 'top', gap = tokens.extensions.floating.anchorGap, margin = tokens.extensions.floating.viewportInset, arrowSize = tokens.extensions.tooltip.arrowSize, flip = true } = options
  const vw = window.innerWidth
  const vh = window.innerHeight

  let side = SIDES.includes(placement) ? placement : 'top'
  // flip: 선호 면이 안 들어가고 반대 면이 들어가면 뒤집는다
  if (
    flip && !fitsOnSide(side, trigger, floating, gap, margin, vw, vh) &&
    fitsOnSide(OPPOSITE[side], trigger, floating, gap, margin, vw, vh)
  ) {
    side = OPPOSITE[side]
  }

  const centerX = trigger.left + trigger.width / 2
  const centerY = trigger.top + trigger.height / 2
  const arrow = {}
  let top
  let left

  if (side === 'top' || side === 'bottom') {
    top = side === 'top' ? trigger.top - floating.height - gap : trigger.bottom + gap
    left = clamp(centerX - floating.width / 2, margin, vw - floating.width - margin)
    arrow.left = clamp(centerX - left, arrowSize, floating.width - arrowSize)
  } else {
    left = side === 'left' ? trigger.left - floating.width - gap : trigger.right + gap
    top = clamp(centerY - floating.height / 2, margin, vh - floating.height - margin)
    arrow.top = clamp(centerY - top, arrowSize, floating.height - arrowSize)
  }

  return { top, left, placement: side, arrow }
}

/** 입력 목록은 앵커 위·아래 중 넓은 공간을 사용하고, 부족한 높이는 내부 스크롤로 처리한다. */
export function computeFieldMenuPosition(trigger, naturalHeight, options = {}) {
  const { gap = tokens.extensions.floating.fieldGap, margin = tokens.extensions.floating.viewportInset } = options
  const viewport = window.visualViewport
  const topEdge = (viewport?.offsetTop || 0) + margin
  const leftEdge = (viewport?.offsetLeft || 0) + margin
  const bottomEdge = topEdge + (viewport?.height || window.innerHeight) - margin * 2
  const rightEdge = leftEdge + (viewport?.width || window.innerWidth) - margin * 2
  const spaceAbove = Math.max(0, Math.min(trigger.top, bottomEdge) - topEdge - gap)
  const spaceBelow = Math.max(0, bottomEdge - Math.max(trigger.bottom, topEdge) - gap)
  const openAbove = naturalHeight > spaceBelow && spaceAbove > spaceBelow
  const height = Math.min(naturalHeight, openAbove ? spaceAbove : spaceBelow)
  // Narrow triggers (time segments) keep a readable list, like React's .kjun-select-panel and Native field panels.
  const width = Math.min(Math.max(trigger.width, tokens.extensions.menu.minimumWidth), rightEdge - leftEdge)
  const top = openAbove ? trigger.top - gap - height : trigger.bottom + gap
  return {
    top: clamp(top, topEdge, bottomEdge - height),
    left: clamp(trigger.left, leftEdge, rightEdge - width),
    width,
    maxHeight: height,
  }
}
