'use client';
import { useEffect, useRef, useState } from 'react';
import { DsButton as Button } from '@kjun/react';
import { tokens } from '@kjun/tokens';
import { useReducedMotion } from './motion-preference';
import { useMotionSpeed } from './motion-speed';

const travel = 200;

// Mirrors the package rule: a new target starts from the displayed position, never from the old origin.
export function MotionInterruptDemo() {
  const reduced = useReducedMotion(), { rate } = useMotionSpeed();
  const marker = useRef<HTMLSpanElement>(null), animation = useRef<Animation | null>(null);
  const [right, setRight] = useState(false);
  const [retargeted, setRetargeted] = useState<number | null>(null);
  useEffect(() => () => animation.current?.cancel(), []);
  function toggle() {
    const node = marker.current; if (!node) return;
    // A paused transition (slowed or inspected) is still mid-flight.
    const state = animation.current?.playState, running = state === 'running' || state === 'paused';
    const from = new DOMMatrix(getComputedStyle(node).transform).m41, to = right ? 0 : travel;
    animation.current?.cancel();
    setRight(!right);
    setRetargeted(running ? Math.round(from) : null);
    if (reduced !== false) return;
    animation.current = node.animate([{ transform: `translateX(${from}px)` }, { transform: `translateX(${to}px)` }],
      { duration: tokens.motion.indicator / rate, easing: tokens.motion.easeOut });
  }
  return <figure className="motion-figure motion-interrupt">
    <figcaption><strong>전환 도중 다시 조작하기</strong><span>이동하는 동안 다시 누르면 지금 보이는 위치에서 반대편으로 이어집니다. 화면 아래 재생 속도를 0.25×로 늦추면 확인하기 쉽습니다.</span></figcaption>
    <div className="motion-demo-actions">
      <Button size="sm" onClick={toggle} disabled={reduced === null}>{right ? '왼쪽으로' : '오른쪽으로'}</Button>
    </div>
    <div className="motion-interrupt-track" aria-hidden="true">
      <span ref={marker} className="motion-interrupt-marker" style={{ transform: `translateX(${right ? travel : 0}px)` }} />
    </div>
    <p className="motion-caption" role="status" data-interrupt-state={retargeted === null ? 'idle' : 'retargeted'}>
      {retargeted === null ? `motion.indicator ${tokens.motion.indicator}ms · motion.easeOut` : `${retargeted}px 지점에서 새 목표로 방향을 바꿨습니다. 처음 위치로 되돌아가지 않습니다.`}
    </p>
  </figure>;
}
