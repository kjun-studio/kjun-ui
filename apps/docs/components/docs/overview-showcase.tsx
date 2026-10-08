'use client';
import { useEffect, useRef, useState } from 'react';
import { DsIcon as Icon } from '@kjun/react';
import Link from './doc-link';
import { overviewScenes } from '../../../../previews/presentation/registry.mjs';

function SceneTile({ scene }: { scene: typeof overviewScenes[number] }) {
  const [failed, setFailed] = useState(false);
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (image.current?.complete && !image.current.naturalWidth) setFailed(true);
  }, []);
  return <Link href={scene.destination} className="overview-scene" data-overview-scene={scene.id}>
    <div className="overview-scene-image">
      {failed ? <span className="thumbnail-unavailable">미리보기를 불러오지 못했습니다</span> :
        <img ref={image} src={`/previews/overview/${scene.id}.png`} alt={scene.alt} width={1280} height={800} decoding="async" onError={() => setFailed(true)} />}
    </div>
    <div className="overview-scene-caption">
      <strong>{scene.title} <Icon name="arrow-right" size={14} aria-hidden="true" /></strong>
      <p>{scene.description}</p>
    </div>
  </Link>;
}

export function OverviewShowcase() {
  return <div className="overview-showcase" aria-label="컴포넌트로 구성한 화면">
    {overviewScenes.map(scene => <SceneTile key={scene.id} scene={scene} />)}
  </div>;
}
