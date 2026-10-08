'use client';
import { useEffect, useState } from 'react';
import { DsButton } from '@kjun/react';
import { exampleSource, type ExampleSources } from '../../../../shared/example-code';
import type { IconSelection } from '../../../../shared/icon-catalog';
import type { PlatformName } from '../../../../shared/demo-config';
import { CodeBlock } from './code-block';
export function IconRegistrationCode({ selection, platform }: { selection: IconSelection; platform: PlatformName }) {
  const [open, setOpen] = useState(false), [attempt, setAttempt] = useState(0);
  const [sources, setSources] = useState<ExampleSources | null>(null), [error, setError] = useState('');
  useEffect(() => {
    if (!open || sources) return;
    const controller = new AbortController();
    setError('');
    fetch('/previews/sources/GuideIconSelection.json', { signal: controller.signal }).then(async response => {
      if (!response.ok) throw Error('등록 예제를 불러오지 못했습니다.');
      const data = await response.json() as ExampleSources;
      if (!controller.signal.aborted) setSources(data);
    }).catch(error => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, [open, sources, attempt]);
  return <details className="icon-registration-code" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>import·Provider 등록 예제</summary>
    {open && <>
      <p>프로젝트에 필요한 아이콘만 등록합니다. 색상·폰트 설정은 설치 안내를 따릅니다.</p>
      {sources ? <CodeBlock label={`${platform} · ${selection.name}`} copyLabel="등록 예제 복사"
        code={exampleSource(sources.sources[platform], platform, { ...selection }, {})} requestKey={JSON.stringify([platform, selection])} />
        : error ? <div role="alert"><p>{error}</p><DsButton onClick={() => setAttempt(value => value + 1)}>등록 예제 다시 시도</DsButton></div>
          : <p role="status">등록 예제를 불러오는 중입니다.</p>}
    </>}
  </details>;
}
