import { formatRelativeTime } from "../../../../shared/package-runtime/relative-time.ts";
export const formatNumber = (value, { decimals = 0 } = {}) => value == null || !Number.isFinite(Number(value)) ? '—' : new Intl.NumberFormat(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Number(value));
export const formatPercent = (value, { decimals = 2, isRaw = false, showSign = false } = {}) => value == null ? '—' : (showSign && Number(value) > 0 ? '+' : '') + formatNumber(Number(value) * (isRaw ? 1 : 100), { decimals }) + '%';
// Zero reads in the tertiary text role, like React and Native.
export const getSignedNumberClass = value => Number(value) > 0 ? 'text-price-up' : Number(value) < 0 ? 'text-price-down' : 'text-text-tertiary';
export const getSignedPillClass = (value, { base = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold num' } = {}) => base + ' ' + (Number(value) > 0 ? 'bg-price-up-bg text-price-up' : Number(value) < 0 ? 'bg-price-down-bg text-price-down' : 'bg-bg-secondary text-text-secondary');
export const formatters = {
  number: formatNumber, percent: formatPercent,
  date: value => value ? new Intl.DateTimeFormat().format(new Date(value)) : '—',
  // Shared with React and Native: the unit follows the elapsed time, in the package's Korean copy.
  relativeTime: value => value ? formatRelativeTime(value) : '—',
  price: formatNumber, KRW: formatNumber, bigKRW: formatNumber, compact: formatNumber,
};
export const formatterMixin = {
  inject: { kjunFormatters: { default: () => ({}) } },
  props: { formatters: { type: Object, default: () => ({}) } },
  methods: Object.fromEntries(Object.keys(formatters).map(key => ['$format'+key[0].toUpperCase()+key.slice(1), function(...args) {
    return (this.formatters[key] || this.kjunFormatters[key] || formatters[key])(...args);
  }])),
};
