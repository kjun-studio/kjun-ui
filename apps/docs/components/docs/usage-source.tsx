'use client';
import { useEffect, useState } from 'react';
import { DsButton as Button } from '@kjun/react';
import { CodeBlock } from './code-block';
import Link from './doc-link';
import { useDocsPlatform, PlatformLoading } from './docs-platform';
import { loadBrowserUsageGenerator } from './load-usage-generator';
import { presetConfig } from '../../../../shared/example-registry';
import { implementationExamples, implementationConfig } from '../../../../shared/implementation-examples';
import type { UsageExample } from '../../../../shared/usage-examples';
import type { PlatformName } from '../../../../shared/demo-config';

export function BasicUsage({ name }: { name: string }) {
  return <section id="usage">
    <h2>기본 사용법</h2>
    <p className="body-copy">컴포넌트의 기본 연결 예제입니다. 위 미리보기에서 변경한 설정과 입력값은 이 코드에 반영되지 않습니다.</p>
    <UsageSource name={name} />
  </section>;
}

export function ImplementationUsage({ name }: { name: string }) {
  const example = implementationExamples[name];
  if (!example) return null;
  return <div className="implementation-usage" data-implementation={name}>
    <h3>구현 방법</h3>
    <p className="body-copy">{example.description}</p>
    <UsageSource name={name} implementation />
  </div>;
}

function UsageSource({ name, implementation = false }: { name: string; implementation?: boolean }) {
  const { platform } = useDocsPlatform();
  return platform ? <ResolvedSource key={name + ':' + platform} name={name} platform={platform} implementation={implementation} /> : <PlatformLoading />;
}

function ResolvedSource({ name, platform, implementation }: { name: string; platform: PlatformName; implementation: boolean }) {
  const [usage, setUsage] = useState<UsageExample | null>(null);
  const [failed, setFailed] = useState(false), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setUsage(null); setFailed(false);
    const config = implementation ? implementationConfig(name) : presetConfig(name);
    loadBrowserUsageGenerator(name).then(generate => generate({ name, platform, settings: config.settings, values: config.values }))
      .then(value => { if (active) setUsage(value); }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [name, platform, implementation, attempt]);
  return <div className="usage-source" data-code-platform={platform}>
    {usage ? <>
      <CodeBlock code={usage.code} label={`${platform === 'vue2' ? 'Vue 2' : platform === 'native' ? 'React Native' : 'React'} · ${implementation ? '구현 예제' : '기본 사용법'}`}
        copyLabel={implementation ? '구현 코드 복사' : '기본 코드 복사'} requestKey={`${name}:${platform}:${attempt}`} />
      <div className="usage-setup-links">
        <p><Link href="/getting-started#connect">공통 설정: 시작하기</Link></p>
        {(usage.feedback || usage.domainColors) && <p><span>이 예제에 필요한 설정</span>
          {usage.feedback && <Link href="/getting-started#feedback-setup">피드백 Provider 설정</Link>}
          {usage.domainColors && <Link href="/getting-started#domain-colors">금융·즐겨찾기 색상 설정</Link>}
        </p>}
      </div>
    </> : <div className="usage-code-status" role={failed ? 'alert' : 'status'}>
      <p>{failed ? '사용 코드를 불러오지 못했습니다.' : '사용 코드를 불러오는 중…'}</p>
      {failed && <Button variant="secondary" onClick={() => setAttempt(value => value + 1)}>코드 다시 불러오기</Button>}
    </div>}
  </div>;
}
