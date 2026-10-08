import { tokens } from '@kjun/tokens';

export type CurveName = 'easeLinear' | 'easeOut' | 'easeEmphasized' | 'easeIn';
export const curveInfo: Record<CurveName, { label: string; use: string }> = {
  easeLinear: { label: '일정 속도', use: '비교 기준선 · 퇴장 페이드' },
  easeOut: { label: '표준 감속', use: '선택선·펼침·Modal·팝업 등장' },
  easeEmphasized: { label: '강조 감속', use: 'Drawer처럼 먼 거리를 이동하는 등장' },
  easeIn: { label: '가속', use: '퇴장 이동' },
};

function controls(value: string) {
  const numbers = value.match(/-?(?:\d+\.?\d*|\.\d+)/g)?.map(Number) || [];
  return numbers.length === 4 ? numbers : [0, 0, 1, 1];
}
function cubic(t: number, first: number, second: number) {
  const inverse = 1 - t;
  return 3 * inverse * inverse * t * first + 3 * inverse * t * t * second + t * t * t;
}

/** Progress of a cubic-bezier curve at elapsed-time fraction x. */
export function progressAt(value: string, x: number) {
  const [x1, y1, x2, y2] = controls(value);
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  let low = 0, high = 1;
  for (let step = 0; step < 24; step++) {
    const middle = (low + high) / 2;
    if (cubic(middle, x1, x2) < x) low = middle; else high = middle;
  }
  return cubic((low + high) / 2, y1, y2);
}

/** Fraction of the duration after which the curve has covered target of the distance. */
export function reachFraction(value: string, target = 0.9) {
  let low = 0, high = 1;
  for (let step = 0; step < 24; step++) {
    const middle = (low + high) / 2;
    if (progressAt(value, middle) < target) low = middle; else high = middle;
  }
  return high;
}

export const curveValue = (name: CurveName) => tokens.motion[name];
export const reachMs = (name: CurveName, duration: number) => Math.round(reachFraction(curveValue(name)) * duration);
