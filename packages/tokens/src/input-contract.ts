/** DOM, React and Native keyboard events share this small interaction contract. */
export interface InputKeyEvent {
  key?: string;
  keyCode?: number;
  isComposing?: boolean;
  defaultPrevented?: boolean;
  nativeEvent?: { key?: string; keyCode?: number; isComposing?: boolean };
}
export function isComposingKey(event: InputKeyEvent, composing = false) {
  return composing || !!event.isComposing || !!event.nativeEvent?.isComposing ||
    event.keyCode === 229 || event.nativeEvent?.keyCode === 229;
}
export function quantityKeyAction(event: InputKeyEvent, composing: boolean, dirty: boolean) {
  if (event.defaultPrevented || isComposingKey(event, composing)) return null;
  switch (event.key ?? event.nativeEvent?.key) {
    case "Enter": return "commit";
    // The first Escape cancels an edit; a later Escape belongs to the parent layer.
    case "Escape": return dirty ? "cancel" : null;
    case "ArrowUp": return "increment";
    case "ArrowDown": return "decrement";
    default: return null;
  }
}

/** Decimal arithmetic used by the three consuming platform implementations. */
export function decimalPlaces(value: number) {
  const [mantissa, exponent = "0"] = String(value).toLowerCase().split("e");
  return Math.max(0, (mantissa.split(".")[1]?.length || 0) - Number(exponent));
}
export function scaledDecimal(text: string, precision: number): number | null {
  if (!Number.isInteger(precision) || precision < 0 || precision > 6 || text.length > 100) return null;
  const match = text.trim().match(/^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))$/);
  if (!match) return null;
  const fraction = match[3] || match[4] || "";
  const digits = (match[2] || "0") + fraction.slice(0, precision).padEnd(precision, "0");
  const rounded = Number(digits) + (Number(fraction[precision] || "0") >= 5 ? 1 : 0);
  if (!Number.isSafeInteger(rounded)) return null;
  return rounded === 0 ? 0 : rounded * (match[1] === "-" ? -1 : 1);
}
function scaleNumber(value: number, precision: number) {
  if (!Number.isInteger(precision) || precision < 0 || precision > 6 || !Number.isFinite(value) || decimalPlaces(value) > precision) return null;
  // toFixed expands exponent notation; parsing does not use binary multiplication.
  return scaledDecimal(value.toFixed(precision), precision);
}
export interface NumberDomainOptions { min?: number; max?: number; step?: number; precision?: number }
export function createNumberDomain({ min = 0, max, step = 1, precision = 0 }: NumberDomainOptions = {}) {
  const factor = 10 ** precision;
  const low = scaleNumber(min, precision), increment = scaleNumber(step, precision);
  const high = max === undefined ? Number.MAX_SAFE_INTEGER : scaleNumber(max, precision);
  const valid = Number.isInteger(precision) && precision >= 0 && precision <= 6 && low !== null && high !== null && increment !== null && increment > 0 && high >= low;
  const clamp = (value: number) => Math.min(high!, Math.max(low!, value));
  const fromDraft = (draft: string) => {
    const scaled = scaledDecimal(draft, precision);
    return valid && scaled !== null ? clamp(scaled) / factor : null;
  };
  const accepts = (value: number) => valid && scaleNumber(value, precision) !== null && value >= min && (max === undefined || value <= max);
  const move = (value: number, direction: number) => {
    const start = scaleNumber(value, precision);
    if (!valid || start === null || !Number.isFinite(direction)) return value;
    const next = direction > 0 ? Math.min(high!, start + increment! * direction) : Math.max(low!, start + increment! * direction);
    return clamp(next) / factor;
  };
  const snap = (value: number) => {
    if (!valid || !Number.isFinite(value)) return min;
    const scaled = Math.max(low!, Math.min(high!, value * factor));
    const index = Math.min(Math.floor((high! - low!) / increment!), Math.max(0, Math.round((scaled - low!) / increment!)));
    return (low! + index * increment!) / factor;
  };
  return { valid, accepts, fromDraft, move, snap, min, max, step, precision };
}
export function createSliderDomain(min = 0, max = 100, step = 1) {
  const precision = Math.max(decimalPlaces(min), decimalPlaces(max), decimalPlaces(step));
  const domain = createNumberDomain({ min, max, step, precision });
  return { ...domain, valid: domain.valid && min < max && Number.isSafeInteger((scaleNumber(max, precision) ?? NaN) - (scaleNumber(min, precision) ?? NaN)) };
}
export function sliderKey(key: string, value: number, min: number, max: number, step: number) {
  if (key === "Home") return min;
  if (key === "End") return max;
  const delta: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 };
  return key in delta ? value + delta[key] * step : null;
}
export type TimePrecision = "minute" | "second";
export interface TimeDomainOptions { precision?: TimePrecision; minuteStep?: number; secondStep?: number; min?: string; max?: string }
export function parseTime(value: string, precision: TimePrecision) {
  const pattern = precision === "second" ? /^(\d{2}):(\d{2}):(\d{2})$/ : /^(\d{2}):(\d{2})$/;
  const match = value.match(pattern);
  if (!match) return null;
  const [hour, minute, second] = [Number(match[1]), Number(match[2]), Number(match[3] || 0)];
  return hour < 24 && minute < 60 && second < 60 ? hour * 3600 + minute * 60 + second : null;
}
export function formatTime(value: number, precision: TimePrecision) {
  const parts = [Math.floor(value / 3600), Math.floor(value / 60) % 60, value % 60];
  return parts.slice(0, precision === "second" ? 3 : 2).map(n => String(n).padStart(2, "0")).join(":");
}
export function createTimeDomain({ precision = "minute", minuteStep = 1, secondStep = 1, min, max }: TimeDomainOptions = {}) {
  const lower = min === undefined ? 0 : parseTime(min, precision);
  const upper = max === undefined ? (precision === "second" ? 86399 : 86340) : parseTime(max, precision);
  const valid = ["minute", "second"].includes(precision) && [minuteStep, secondStep].every(n => Number.isInteger(n) && n >= 1 && n <= 59) && lower !== null && upper !== null && lower <= upper;
  const times: number[] = [];
  if (valid) for (let hour = 0; hour < 24; hour++) for (let minute = 0; minute < 60; minute += minuteStep) for (let second = 0; second < (precision === "second" ? 60 : 1); second += secondStep) {
    const time = hour * 3600 + minute * 60 + second;
    if (time >= lower! && time <= upper!) times.push(time);
  }
  const part = (time: number, index: number) => index === 0 ? Math.floor(time / 3600) : index === 1 ? Math.floor(time / 60) % 60 : time % 60;
  const options = (value: string | null, index: number) => {
    const current = value === null ? null : parseTime(value, precision);
    return Array.from(new Set(times.filter(time => current === null || Array.from({ length: index }, (_, i) => i).every(i => part(time, i) === part(current, i))).map(time => part(time, index))));
  };
  const select = (value: string | null, index: number, selected: number) => {
    const current = value === null ? null : parseTime(value, precision);
    const candidates = times.filter(time => part(time, index) === selected && (current === null || Array.from({ length: index }, (_, i) => i).every(i => part(time, i) === part(current, i))));
    if (!candidates.length) return value;
    const exact = current === null ? undefined : candidates.find(time => [0, 1, 2].every(i => i === index || part(time, i) === part(current, i)));
    return formatTime(exact ?? candidates[0], precision);
  };
  return { valid: valid && times.length > 0, options, select, part, parse: (value: string) => parseTime(value, precision), accepts: (value: string | null) => value === null || times.includes(parseTime(value, precision) ?? -1) };
}
