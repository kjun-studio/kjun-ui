'use client';
import { useEffect, useState } from 'react';
import { DsButton as Button } from '@kjun-ui/react';
import { defaultFigureDescription, type FigureSpec } from '../../../../shared/visual-guides/types';
interface FigureAsset {
  src: string;
  width: number;
  height: number;
  parts: { x: number; y: number; width: number; height: number }[];
}
interface FigureManifest {
  figures: Record<string, FigureAsset>;
}
let pending: Promise<FigureManifest> | undefined;
function loadFigures() {
  return (pending ||= fetch('/previews/guide-figures/manifest.json')
    .then((r) => {
      if (!r.ok) throw Error('도해 목록을 불러오지 못했습니다.');
      return r.json() as Promise<FigureManifest>;
    })
    .catch((error) => {
      pending = undefined;
      throw error;
    }));
}
export function AnatomyFigure({
  name,
  platform,
  figure,
}: {
  name: string;
  platform: string;
  figure: FigureSpec;
}) {
  const [asset, setAsset] = useState<FigureAsset>(),
    [failed, setFailed] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let current = true;
    setAsset(undefined);
    setFailed(false);
    loadFigures()
      .then((data) => {
        const result = data.figures[`${platform}/${name}/${figure.id}`];
        if (!result) throw Error('도해가 없습니다.');
        if (current) setAsset(result);
      })
      .catch(() => {
        if (current) setFailed(true);
      });
    return () => {
      current = false;
    };
  }, [name, platform, figure.id, retry]);
  const height = asset
    ? Math.max(asset.height, figure.parts.length * 40 + 16)
    : 0;
  const top = asset ? (height - asset.height) / 2 : 0;
  const graphic =
    asset && !failed ? (
      <div
        className="anatomy-graphic"
        style={{
          aspectRatio: `${asset.width + 128} / ${height}`,
        }}
      >
        <img
          key={asset.src + retry}
          loading="lazy"
          src={asset.src + '?v=' + retry}
          alt={`${name.replace(/^Ds/, '')} ${figure.label}. 번호별 영역 설명은 아래 목록을 참고하세요.`}
          onError={() => setFailed(true)}
          style={{
            top: `${(top / height) * 100}%`,
            height: `${(asset.height / height) * 100}%`,
            left: `${(64 / (asset.width + 128)) * 100}%`,
            width: `${(asset.width / (asset.width + 128)) * 100}%`,
          }}
        />
        <svg viewBox={`0 0 ${asset.width + 128} ${height}`} aria-hidden="true">
          {asset.parts.map((part, i) => {
            const y = Math.min(
              height - 20,
              28 +
                i *
                  Math.min(
                    52,
                    (height - 48) / Math.max(asset.parts.length - 1, 1),
                  ),
            );
            const right = part.x + part.width / 2 > asset.width * 0.6;
            const marker = right ? asset.width + 104 : 24;
            const lane = right ? asset.width + 78 : 50;
            const edge = part.x + 64 + (right ? part.width : 0);
            return (
              <g key={i}>
                <rect
                  x={part.x + 64}
                  y={part.y + top}
                  width={part.width}
                  height={part.height}
                  rx="3"
                  className="anatomy-bound"
                />
                <path
                  d={`M ${marker + (right ? -16 : 16)} ${y} H ${lane} V ${part.y + top + part.height / 2} H ${edge}`}
                  className="anatomy-leader"
                />
                <circle cx={marker} cy={y} r="14" />
                <text x={marker} y={y + 5} textAnchor="middle">
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    ) : (
      <p role="status">
        {failed
          ? '구조 이미지를 불러오지 못했습니다. 아래 영역 설명을 확인하세요.'
          : '구조 이미지를 불러오는 중…'}
      </p>
    );
  return (
    <figure className="anatomy-figure">
      <figcaption>
        <h3>{figure.label}</h3>
        {(figure.id !== 'default' || figure.description !== defaultFigureDescription) && <p>{figure.description}</p>}
      </figcaption>
      {graphic}
      {failed && <div className="guide-case-actions">
          <Button
            variant="secondary"
            onClick={() => {
              setFailed(false);
              setRetry((n) => n + 1);
            }}
          >
            이미지 다시 불러오기
          </Button>
      </div>}
      <Parts figure={figure} />
    </figure>
  );
}
function Parts({ figure }: { figure: FigureSpec }) {
  return (
    <ol className="anatomy-parts">
      {figure.parts.map((part, i) => (
        <li key={part.label}>
          <span className="anatomy-number">{i + 1}</span>
          <div>
            <strong>{part.label}</strong>{' '}
            <small>{part.optional ? '선택 영역' : '예제 구성'}</small>
            <p>{part.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
