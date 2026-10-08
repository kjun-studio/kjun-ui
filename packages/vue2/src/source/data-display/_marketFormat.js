import { getSignedNumberClass, getSignedPillClass } from '@kjun-adapter/formatters.js'

// 시세 목록 테이블/카드(주식·코인 등)가 공유하는 도메인 중립 포맷·색상·플래시·상태영속 유틸.
// 지표 선언(라벨/포맷 타입/정렬 방향/정렬 키)은 도메인별 metricConfig가 주입하고,
// 이 모듈은 그 config를 받아 pill 목록 생성·값 포맷·정렬 방향 결정·플래시 색상을 담당한다.
//
// 과거 주식 전용이던 _stockCardFormatters.js에서 도메인 중립 부분만 끌어올린 것.
// 주식 어댑터는 이 모듈을 재노출해 기존 import 경로를 유지한다.

// --- 부호 색상 (등락률/순매수 등) ---
export { getSignedNumberClass, getSignedPillClass }

// 등락률·투자자 순매수 등 부호별 텍스트 색상
export function getInvestorClass(value) {
  return getSignedNumberClass(value)
}

// 상세 카드의 지표 pill은 배경을 유지한다.
export function getChangeRatePillClass(rate) {
  return getSignedPillClass(rate, {
    base: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold num',
  })
}

export function getChangeRateTextClass(rate, stale = false) {
  return `inline-flex items-center text-xs font-medium num ${stale ? 'text-text-tertiary' : getSignedNumberClass(rate)}`
}

// --- pill 목록 (모바일 카드 지표 로테이션) ---
// columns에서 metricConfig에 선언된 key만 추출. excludeKeys로 종목명/섹터 등 비지표 컬럼을 제외한다.
// 모바일 pill은 값 표시와 정렬 제어를 겸하므로, 데스크톱과 동일하게 column.sortable이
// 명시된 지표만 정렬키를 가진다. 비정렬 지표도 값 확인용 pill로는 남겨둔다.
export function pillsFromColumns(columns, metricConfig, excludeKeys = []) {
  const exclude = new Set(excludeKeys)
  return columns
    .filter((c) => !exclude.has(c.key))
    .map((c) => {
      const cfg = metricConfig[c.key]
      if (!cfg) return null
      return {
        key: c.key,
        ...cfg,
        sortKey: c.sortable === true ? cfg.sortKey : null,
        isDefaultSort: c.defaultSort === true,
      }
    })
    .filter(Boolean)
}

// --- 단위 변환 포맷터 (한국식 억/만주) ---
export function formatNetAmount(value, formatNumber) {
  if (value === null || value === undefined) return '-'
  const sign = value >= 0 ? '+' : ''
  const absValue = Math.abs(value) / 100000000
  return sign + formatNumber(absValue, { decimals: 0 }) + '억'
}

export function formatNetVolume(value, formatNumber) {
  if (value === null || value === undefined) return '-'
  const sign = value >= 0 ? '+' : ''
  const absValue = Math.abs(value) / 10000
  return sign + formatNumber(absValue, { decimals: 0 }) + '만주'
}

export function formatTradeAmount(value, formatNumber) {
  if (value === null || value === undefined) return '-'
  const absValue = value / 100000000
  return formatNumber(absValue, { decimals: 0 }) + '억'
}

// --- 값 포맷 (format 타입별) ---
// ctx: 도메인 컨텍스트. 현재는 통화 분기에 사용 ({ currency: 'usd' | 'krw' }).
// helpers: Vue 프로토타입 포맷터 번들($formatNumber 등)을 주입받는다.
export function formatMetricValue(value, format, ctx, helpers) {
  const { formatNumber, formatKRW, formatPrice, formatBigKRW, formatCompact, formatPercent } = helpers
  const currency = (ctx && ctx.currency) || 'krw'

  if (value === null || value === undefined) return '-'

  switch (format) {
    case 'price':
      return currency === 'usd' ? formatPrice(value) : formatKRW(value, { showSymbol: false })
    case 'percent':
      return formatPercent(value, { isRaw: true, showSign: true })
    case 'ratio':
      return formatNumber(value, { decimals: 2 })
    case 'bigAmount':
      return currency === 'usd' ? formatCompact(value) : formatBigKRW(value)
    case 'compact':
      return formatCompact(value)
    case 'investor': {
      const sign = value >= 0 ? '+' : ''
      return sign + formatBigKRW(value)
    }
    case 'net_amount':
      return formatNetAmount(value, formatNumber)
    case 'net_volume':
      return formatNetVolume(value, formatNumber)
    case 'trade_amount':
      return formatTradeAmount(value, formatNumber)
    case 'sparkline':
      return null // 카드 템플릿에서 DsSparkline 분기 렌더
    default:
      return String(value)
  }
}

// --- 현재가 틱 플래시 ---
// 폴링 갱신 시 직전값 대비 방향을 계산해 row._flash = { price, change }로 싣는다.
// CSS 클래스(price-flash-*-bg-*)는 클래스 제거→재추가로 재발화하므로 호출부가 일정 시간 뒤 _flash를 비운다.

// 현재가 틱 방향: 상승 'up' / 하락 'down' / 변동 없음 null
export function priceFlashDir(before, after) {
  if (before == null || after == null) return null
  if (after > before) return 'up'
  if (after < before) return 'down'
  return null
}

// 등락률 부호 반전 여부: 양↔음 전환 시 방향, 그 외 null
export function changeSignFlip(before, after) {
  if (before == null || after == null) return null
  const wasUp = before >= 0
  const isUp = after >= 0
  if (wasUp === isUp) return null
  return isUp ? 'up' : 'down'
}

// 셀 단위 플래시 클래스. column.flash 메타('price'|'change')와 row._flash를 결합한다.
// price 셀: 틱 방향 색(평소 투명 고스트 pill에 -bg-pop으로 틴트 펄스)
// change 셀: pill은 기존 틴트로, plain 목록은 투명으로 돌아간다.
export function flashCellClass(row, column, { plain = false } = {}) {
  const flash = row && row._flash
  if (!flash || !column.flash) return ''
  if (column.flash === 'price') {
    return flash.price ? `price-flash-${flash.price}-bg-pop` : ''
  }
  if (column.flash === 'change') {
    if (!flash.change) return ''
    const direction = (row[column.key] || 0) >= 0 ? 'up' : 'down'
    return `price-flash-${direction}-${plain ? 'bg-pop' : 'bg-strong'}`
  }
  return ''
}

// 직전값 스냅샷 대비 신규 목록에 _flash를 세팅한다(호출부 공통 로직 추출).
// prevMap: { [rowKeyValue]: { price, change } }, rows: 새 목록, opts로 필드명 지정.
// 변경된 row가 하나라도 있으면 true 반환(호출부가 클리어 타이머를 걸도록).
export function applyFlash(rows, prevMap, { rowKey, priceField, changeField, setter }) {
  let changed = false
  rows.forEach((row) => {
    const before = prevMap[row[rowKey]]
    if (!before) return
    const price = priceFlashDir(before.price, row[priceField])
    const change = changeSignFlip(before.change, row[changeField])
    if (price || change) {
      setter(row, '_flash', { price, change })
      changed = true
    }
  })
  return changed
}

// 폴링 직전 prev 스냅샷 생성
export function snapshotPrices(rows, { rowKey, priceField, changeField }) {
  const map = {}
  rows.forEach((row) => {
    map[row[rowKey]] = { price: row[priceField], change: row[changeField] }
  })
  return map
}

// --- localStorage 헬퍼 (모바일 카드의 네임스페이스별 pill/direction 영속화용) ---

export function loadFromStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const value = window.localStorage.getItem(key)
    return value || fallback
  } catch {
    // localStorage 접근 불가(보안 정책, 시크릿 모드 등) — 기본값으로 fallback
    return fallback
  }
}

export function saveToStorage(key, value) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // localStorage가 꽉 찼거나 비활성화 — 조용히 무시 (UI 동작은 지속)
  }
}
