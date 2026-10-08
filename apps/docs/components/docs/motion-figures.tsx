'use client';
import { useEffect, useRef, type CSSProperties } from 'react';
import { DsButton as Button } from '@kjun-ui/react';
import { tokens } from '@kjun-ui/tokens';
import { useReducedMotion } from './motion-preference';
import { useMotionSpeed } from './motion-speed';
import { curveValue, progressAt, type CurveName } from './motion-curves';

type DistanceCard = {
  key: string; title: string; token: string; distance: number | null; axis: 'x' | 'y'; sign: 1 | -1;
  curve: CurveName; duration: number; target: string; note: string;
};
const d = tokens.motionDistance;
// One magnification for every fixed-distance card, so the cards compare at the real ratio.
const scale = 3;
const cards: DistanceCard[] = [
  { key: 'modal', title: 'Modal', token: 'motionDistance.modalEnter', distance: d.modalEnter, axis: 'y', sign: 1, curve: 'easeOut', duration: tokens.motion.layerEnter, target: '창',
    note: `아래에서 ${d.modalEnter}px 올라오며 나타나고, 퇴장할 때는 ${d.modalExit}px 내려가며 사라집니다.` },
  { key: 'popup', title: 'Popup', token: 'motionDistance.popup', distance: d.popup, axis: 'y', sign: -1, curve: 'easeOut', duration: tokens.motion.popupEnter, target: '팝업',
    note: '트리거 쪽에서 도착 방향으로 이동합니다. 위·좌·우 배치도 같은 거리입니다.' },
  { key: 'toast', title: 'Toast', token: 'motionDistance.toast', distance: d.toast, axis: 'y', sign: -1, curve: 'easeOut', duration: tokens.motion.toastEnter, target: '알림',
    note: '위에서 내려오며 나타나고, 퇴장은 같은 방향으로 되돌아가며 사라집니다.' },
  { key: 'drawer', title: 'Drawer', token: '패널 크기', distance: null, axis: 'x', sign: 1, curve: 'easeEmphasized', duration: tokens.motion.layerEnter, target: '패널',
    note: '먼 거리를 이동하므로 강조 감속을 씁니다. 상하 Drawer는 높이만큼 이동합니다.' },
];
// Equal time slices: frames bunch up where the curve slows down.
const onion = Array.from({ length: 8 }, (_, step) => step / 8);
const offset = (card: DistanceCard, remaining: number) => card.distance === null
  ? `translateX(${(remaining * 100).toFixed(1)}%)`
  : `translate${card.axis.toUpperCase()}(${(card.sign * card.distance * scale * remaining).toFixed(1)}px)`;

function DistanceStage({ card }: { card: DistanceCard }) {
  const target = useRef<HTMLDivElement>(null), animation = useRef<Animation | null>(null);
  const reduced = useReducedMotion(), { rate } = useMotionSpeed();
  useEffect(() => () => animation.current?.cancel(), []);
  function play() {
    animation.current?.cancel();
    if (reduced !== false || !target.current) return;
    animation.current = target.current.animate([
      { transform: offset(card, 1), opacity: card.distance === null ? 1 : 0 }, { transform: offset(card, 0), opacity: 1 },
    ], { duration: card.duration / rate, easing: curveValue(card.curve) });
  }
  const frames = onion.map(t => 1 - progressAt(curveValue(card.curve), t));
  return <article className="motion-distance-card" data-distance={card.key}>
    <h3>{card.title} <code>{card.token}</code></h3>
    <div className={`motion-distance-stage motion-distance-stage--${card.key}`}>
      <div className="motion-distance-space">
        {frames.map((remaining, index) => <div key={index} className="motion-distance-ghost" aria-hidden="true"
          style={{ transform: offset(card, remaining), opacity: 0.1 + index * 0.05 } as CSSProperties} />)}
        <div ref={target} className="motion-distance-target">{card.target}</div>
      </div>
      {card.distance !== null && <span className="motion-distance-scale">×{scale} 확대</span>}
    </div>
    <div className="motion-distance-meta">
      {card.distance !== null
        ? <span className="motion-distance-real"><i style={{ width: card.distance }} aria-hidden="true" />실제 {card.distance}px</span>
        : <span className="motion-distance-real">패널 너비만큼</span>}
      <Button size="xs" variant="ghost" prefixIcon="player-play" onClick={play} disabled={reduced !== false} aria-label={`${card.title} 등장 재생`}>재생</Button>
    </div>
    <p>{card.note} <span className="motion-distance-timing">{card.duration}ms · <code>motion.{card.curve}</code></span></p>
  </article>;
}

export function MotionDistanceFigure() {
  return <figure className="motion-figure motion-distances">
    <figcaption><strong>컴포넌트가 이동하는 거리</strong><span>흐린 잔상은 같은 시간 간격으로 찍은 위치입니다. 잔상이 도착 지점에 몰릴수록 끝에서 감속합니다. 고정 거리 견본은 모두 같은 배율(×{scale})로 확대해 실제 비율을 유지합니다.</span></figcaption>
    <div className="motion-distance-grid">{cards.map(card => <DistanceStage key={card.key} card={card} />)}</div>
    <div className="motion-measured-note">
      <strong>위치와 크기를 재는 전환</strong>
      <div><span><i className="motion-measured-indicator" />Tabs: 선택 항목의 위치와 폭</span><span><i className="motion-measured-height" />Accordion: 펼쳐지는 콘텐츠 높이</span><span><i className="motion-measured-reflow" />Toast: 남은 알림의 새 위치</span></div>
      <p>이 전환들은 고정 픽셀 거리 대신 실제 크기와 위치 차이를 따라갑니다.</p>
    </div>
  </figure>;
}
