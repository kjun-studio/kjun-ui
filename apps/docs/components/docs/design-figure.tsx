'use client';
import { useEffect, useState } from 'react';
import { DsButton as Button } from '@kjun-ui/react';
import type { DesignCase, DesignSide } from '../../../../shared/visual-guides/design-cases';

interface Asset {
  src: string;
  width: number;
  height: number;
  parts: { x: number; y: number; width: number; height: number }[];
}
interface Manifest { figures: Record<string, Asset> }
let pending: Promise<Manifest> | undefined;
function loadFigures() {
  return pending ||= fetch('/previews/design-figures/manifest.json').then(r => {
    if (!r.ok) throw Error('도해 목록을 불러오지 못했습니다.');
    return r.json() as Promise<Manifest>;
  }).catch(error => { pending = undefined; throw error; });
}
export function DesignFigure({ item, side, width, platform, onRun }: {
  item: DesignCase; side: DesignSide; width: number; platform: string; onRun: () => void;
}) {
  const [asset, setAsset] = useState<Asset>(), [failed, setFailed] = useState(false), [retry, setRetry] = useState(0);
  const label = side === 'before' ? '전 · 피해야 할 구성' : '후 · 권장 구성';
  useEffect(() => {
    let current = true;
    setAsset(undefined); setFailed(false);
    loadFigures().then(data => {
      const next = data.figures[`${platform}/${item.id}/${side}/${width}`];
      if (!next) throw Error('도해가 없습니다.');
      if (current) setAsset(next);
    }).catch(() => { if (current) setFailed(true); });
    return () => { current = false; };
  }, [platform, item.id, side, width, retry]);
  const graphic = asset && !failed ? (
    <div className="design-graphic" style={{ aspectRatio: `${asset.width + 48}/${asset.height}` }}>
      <img src={asset.src + '?v=' + retry} loading="lazy"
        width={asset.width} height={asset.height} onError={() => setFailed(true)}
        alt={`${item.title} — ${label}. ${item[side]} 번호별 해설은 아래에 있습니다.`}
        style={{ left: `${24 / (asset.width + 48) * 100}%`, width: `${asset.width / (asset.width + 48) * 100}%` }} />
      <svg viewBox={`0 0 ${asset.width + 48} ${asset.height}`} aria-hidden="true">
        {asset.parts.map((box, index) => {
          const right = box.x + box.width / 2 > asset.width * 0.6, marker = right ? asset.width + 36 : 12;
          const y = Math.max(14, Math.min(asset.height - 14, box.y + (index % 2 ? box.height - 12 : 12)));
          const edge = box.x + 24 + (right ? box.width : 0);
          return <g key={index}>
            <rect className="design-bound" x={box.x + 24} y={box.y} width={box.width} height={box.height} rx="3" />
            <path className="design-leader" d={`M ${marker + (right ? -10 : 10)} ${y} H ${edge}`} />
            <circle cx={marker} cy={y} r="10" /><text x={marker} y={y + 4} textAnchor="middle">{index + 1}</text>
          </g>;
        })}
      </svg>
    </div>
  ) : <p className="design-image-status" role="status">{failed ? '비교 이미지를 불러오지 못했습니다. 아래 해설과 실행 예제를 확인하세요.' : '비교 이미지를 불러오는 중…'}</p>;
  const explanations = <ol className="design-points">{item.points.map((point, index) => <li key={point.title}>
    <span className="anatomy-number">{index + 1}</span><div><strong>{point.title}</strong><p>{point[side]}</p></div>
  </li>)}</ol>;
  return <figure className="design-figure" data-side={side}>
    <figcaption><strong>{label}</strong><p>{item[side]}</p></figcaption>
    {graphic}
    <div className="guide-case-actions">
      {failed && <Button variant="secondary" size="sm" onClick={() => setRetry(n => n + 1)}>이미지 다시 불러오기</Button>}
      <Button variant="ghost" size="sm" onClick={onRun}>실행 예제 보기</Button>
    </div>
    {explanations}
  </figure>;
}
