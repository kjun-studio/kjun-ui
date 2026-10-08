'use client';
import { useEffect, useRef, useState } from 'react';
import { DsButton as Button } from '@kjun-ui/react';
import { tokens } from '@kjun-ui/tokens';
import { useReducedMotion } from './motion-preference';
import { useMotionSpeed } from './motion-speed';
import { curveInfo, curveValue, progressAt, reachMs, type CurveName } from './motion-curves';

const dot = 16, fallbackDistance = 160;
const curves: CurveName[] = ['easeLinear', 'easeOut', 'easeEmphasized', 'easeIn'];
// One shared plot: overlaid curves show their differences better than separate thumbnails.
const graph = { width: 240, height: 144, inset: 8 };
const graphPoint = (x: number, y: number) => [graph.inset + x * (graph.width - 2 * graph.inset), graph.height - graph.inset - y * (graph.height - 2 * graph.inset)] as const;
const graphPath = (curve: CurveName) => Array.from({ length: 49 }, (_, index) => {
  const [x, y] = graphPoint(index / 48, progressAt(curveValue(curve), index / 48));
  return `${index ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
}).join(' ');

function CurveGraph({ playhead }: { playhead: (index: number) => (node: SVGCircleElement | null) => void }) {
  const [x0, y0] = graphPoint(0, 0), [x1, y1] = graphPoint(1, 1), [, y90] = graphPoint(0, 0.9);
  return <svg className="motion-demo-graph" viewBox={`0 0 ${graph.width} ${graph.height}`} aria-hidden="true">
    <rect x={x0} y={y1} width={x1 - x0} height={y0 - y1} />
    <line className="motion-demo-graph-guide" x1={x0} x2={x1} y1={y90} y2={y90} />
    <text x={x0 + 4} y={y90 - 4}>90%</text>
    {curves.map(curve => <path key={curve} data-curve={curve} d={graphPath(curve)} />)}
    {curves.map((curve, index) => <circle key={curve} data-curve={curve} ref={playhead(index)} cx={x0} cy={y0} r="3.5" />)}
  </svg>;
}

const Swatch = ({ curve }: { curve: CurveName }) =>
  <svg className="motion-demo-swatch" viewBox="0 0 24 8" aria-hidden="true"><line data-curve={curve} x1="1" x2="23" y1="4" y2="4" /></svg>;

export function MotionCurveComparison() {
  const reduced = useReducedMotion();
  const { rate } = useMotionSpeed();
  const duration = Math.round(tokens.motion.layerEnter / rate);
  const track = useRef<HTMLDivElement>(null);
  const dots = useRef<(HTMLSpanElement | null)[]>([]);
  const heads = useRef<(SVGCircleElement | null)[]>([]);
  const animations = useRef<Animation[]>([]);
  const frame = useRef(0), generation = useRef(0);
  const [distance, setDistance] = useState(fallbackDistance);
  const [atEnd, setAtEnd] = useState(false);
  const [playing, setPlaying] = useState(false);
  // Samples travel the full track width, so the comparison uses the space the page gives it.
  useEffect(() => {
    const node = track.current; if (!node) return;
    const measure = () => setDistance(Math.max(0, node.clientWidth - dot));
    measure();
    const observer = new ResizeObserver(measure); observer.observe(node);
    return () => observer.disconnect();
  }, []);
  function placeHeads(t: number, forward: boolean) {
    curves.forEach((curve, index) => {
      const head = heads.current[index]; if (!head) return;
      const progress = progressAt(curveValue(curve), t);
      const [x, y] = graphPoint(t, forward ? progress : 1 - progress);
      head.setAttribute('cx', x.toFixed(1)); head.setAttribute('cy', y.toFixed(1));
    });
  }
  function cancel() {
    generation.current += 1; cancelAnimationFrame(frame.current);
    animations.current.forEach(animation => animation.cancel()); animations.current = [];
  }
  useEffect(() => { if (reduced) { cancel(); setPlaying(false); placeHeads(atEnd ? 1 : 0, true); } }, [reduced]);
  useEffect(() => () => cancel(), []);
  // Real components retarget from the displayed position; the demo does the same when reversed mid-flight.
  function run(to: 'end' | 'start', restart: boolean) {
    const from = dots.current.map(dot => restart ? (to === 'end' ? 0 : distance) : dot ? new DOMMatrix(getComputedStyle(dot).transform).m41 : 0);
    cancel(); setAtEnd(to === 'end');
    if (reduced !== false) { setPlaying(false); placeHeads(1, to === 'end'); return; }
    const current = generation.current, target = to === 'end' ? distance : 0;
    animations.current = curves.flatMap((curve, index) => {
      const dot = dots.current[index];
      return dot ? [dot.animate([{ transform: `translateX(${from[index]}px)` }, { transform: `translateX(${target}px)` }], { duration, easing: curveValue(curve) })] : [];
    });
    setPlaying(true);
    const tick = () => {
      const time = Number(animations.current[0]?.currentTime ?? duration);
      placeHeads(Math.min(1, time / duration), to === 'end');
      if (generation.current === current && time < duration) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    void Promise.allSettled(animations.current.map(animation => animation.finished)).then(() => {
      if (generation.current === current) { setPlaying(false); placeHeads(1, to === 'end'); }
    });
  }
  const state = playing ? 'playing' : atEnd ? 'complete' : 'initial';
  return <figure className="motion-figure motion-curve-demo" data-distance={distance}>
    <figcaption><strong>같은 시간·같은 거리에서 곡선 비교</strong><span>모든 견본이 같은 거리를 <code>motion.layerEnter</code> {tokens.motion.layerEnter}ms 동안 이동합니다. 눈금은 거리의 90% 지점이고, 그 옆 시간은 곡선마다 그 지점에 닿는 시점입니다.</span></figcaption>
    <div className="motion-demo-actions">
      <Button size="sm" onClick={() => run('end', true)} disabled={reduced === null}>{atEnd ? '다시 비교하기' : '비교 재생'}</Button>
      <Button size="sm" variant="secondary" onClick={() => run('start', false)} disabled={!playing}>도중에 되돌리기</Button>
      <Button size="sm" variant="ghost" onClick={() => { cancel(); setAtEnd(false); setPlaying(false); placeHeads(0, true); }} disabled={!atEnd && !playing}>처음으로</Button>
    </div>
    <div className="motion-demo-plot">
      <CurveGraph playhead={index => node => { heads.current[index] = node; }} />
      <p>가로축은 시간, 세로축은 이동한 거리입니다. 곡선이 일찍 위로 솟을수록 빨리 도착한 것처럼 보입니다.</p>
    </div>
    <div className="motion-demo-rows">
      {curves.map((curve, index) => <div className="motion-demo-row" key={curve} data-curve={curve}>
        <div className="motion-demo-label"><Swatch curve={curve} /><strong>{curveInfo[curve].label}</strong><code>motion.{curve}</code><span>{curveInfo[curve].use}</span></div>
        <div className="motion-demo-track" ref={index ? undefined : track} aria-hidden="true">
          <span className="motion-demo-tick"><span>90% · {reachMs(curve, tokens.motion.layerEnter)}ms</span></span>
          <span ref={node => { dots.current[index] = node; }} className="motion-demo-dot" style={{ transform: `translateX(${atEnd ? distance : 0}px)` }} />
        </div>
      </div>)}
      <div className="motion-demo-endpoints" aria-hidden="true"><span>시작 · 0ms</span><span>도착 · {tokens.motion.layerEnter}ms</span></div>
      <div className="motion-demo-row" data-curve="reduced">
        <div className="motion-demo-label"><strong>동작 줄이기</strong><span>이동 없이 결과 상태로 바뀝니다.</span></div>
        <div><span className="motion-demo-result" data-state={atEnd ? 'end' : 'start'} aria-hidden="true">{atEnd ? '도착 상태' : '시작 상태'}</span></div>
      </div>
    </div>
    <p className="motion-caption" role="status" data-curve-state={state}>
      {playing ? '곡선 견본이 이동 중이며, 동작 줄이기는 이미 결과 상태입니다.' : atEnd ? '모든 견본이 도착 상태입니다.' : '모든 견본이 시작 상태입니다.'}
      {reduced && ' 시스템의 동작 줄이기가 켜져 있어 모든 견본이 이동 없이 결과를 표시합니다.'}
    </p>
    <p className="motion-figure-note">숫자 변화는 <code>motion.number</code> {tokens.motion.number}ms 감속 보간을 사용합니다. Spinner는 일정한 속도로 회전하고 Skeleton은 강조가 왕복합니다.</p>
  </figure>;
}
