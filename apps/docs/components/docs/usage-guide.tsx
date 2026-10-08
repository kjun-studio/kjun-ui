'use client';
import Link from './doc-link';
import { useEffect } from 'react';
import { guideTopics, legacyGuideDestination, type GuideTopic } from '../../../../shared/document-navigation';
import { DesignComparisons } from './design-comparison';
import { ImplementationUsage } from './usage-source';
import { CatalogPreview } from './catalog-preview';
import { GuideExample } from './guide-example';
import { DataTable } from './data-table';
import {
  comparisons,
  layouts,
  writing,
  comparisonCase,
  writingCase,
} from '../../../../shared/visual-guides/usage-content';
import definitions from '@/lib/generated/visual-guides.json';
const paths = Object.fromEntries(
  Object.values(definitions).map((g) => [g.name, g.path]),
);
export function UsageGuide() {
  useEffect(() => {
    const redirect = () => {
      const destination = legacyGuideDestination(location.pathname, location.search, location.hash);
      if (destination) location.replace(destination);
    };
    redirect();
    window.addEventListener('hashchange', redirect);
    return () => window.removeEventListener('hashchange', redirect);
  }, []);
  return <>
    <div className="guide-topic-index">
      {guideTopics.map(topic => <section id={topic.id} key={topic.id}>
        <h2><Link href={topic.path}>{topic.title}</Link></h2>
        <p>{topic.description}</p>
        <ul>{topic.sections.map(([id, title]) => <li key={id}><Link href={topic.path + '#' + id}>{title}</Link></li>)}</ul>
      </section>)}
    </div>
    <GuideFoundations />
  </>;
}
function GuideFoundations() {
  return <p className="body-copy guide-foundations">
    <Link href="/layout">최대 폭·열 전환·스크롤·하단 CTA 배치</Link>와 <Link href="/elevation">레이어·Elevation 규칙</Link>을 함께 확인하세요.
  </p>;
}
export function UsageTopic({ topic }: { topic: GuideTopic }) {
  return <>
    <GuideFoundations />
    {topic.sections.map(([id]) => <GuideSection key={id} id={id} />)}
  </>;
}
function GuideSection({ id }: { id: string }) {
  const comparison = comparisons.find(item => item.id === id);
  if (comparison) return <section id={id}>
    <h2>{comparison.title}</h2>
    <p className="body-copy">{comparison.situation}</p>
    <DataTable headings={['컴포넌트', '선택할 상황', '책임과 차이']}
      rows={comparison.rows.map(([name, use, responsibility]) => [
        <Link key={name} href={paths[name]}>{name === 'KjunFeedbackProvider' ? 'Toast · 피드백 서비스' : name.slice(2)}</Link>,
        use, responsibility,
      ])} />
    <div className="guide-comparison-grid">{comparison.rows.map(([name]) =>
      <GuideExample key={name} name={name} scenario={comparisonCase(name)} destination={paths[name] + '#usage'} />,
    )}</div>
  </section>;
  const layout = layouts.find(item => item.id === id);
  if (layout) return <section id={id}>
    <h2>{layout.title}</h2><p className="body-copy">{layout.description}</p>
    <CatalogPreview name={layout.name} />
    <ImplementationUsage name={layout.name} />
  </section>;
  if (id === 'writing') return <WritingGuide />;
  return <DesignComparisons sectionIds={[id]} />;
}
function WritingGuide() {
  return (
      <section id="writing">
        <h2>문구 작성 원칙</h2>
        <p className="body-copy">
          사용자가 이해하고 다음 행동을 선택할 수 있는 문구를 작성하세요. 아래
          “피하기”는 문구를 비교하기 위한 예시입니다.
        </p>
        {writing.map((rule) => (
          <div className="writing-case" key={rule.name}>
            <h3>{rule.title}</h3>
            <p>{rule.explanation}</p>
            <div className="guide-comparison-grid">
              {[false, true].map((good) => {
                return (
                  <GuideExample
                    key={String(good)}
                    name={rule.name}
                    destination={paths[rule.name] + '#usage'}
                    scenario={writingCase(rule, good)}
                  />
                );
              })}
            </div>
          </div>
        ))}
        <h3>긴 콘텐츠와 확대 화면</h3>
        <p className="body-copy">
          긴 한국어 라벨은 의미 단위로 줄바꿈하고, 숫자는 부호·단위가 값과
          분리되지 않도록 확인하세요. 375px 보기에서는 실제 가용 폭으로 배치하며
          축소 배율을 사용하지 않습니다. 브라우저 200% 확대에서도 라벨과 행동을
          읽고 조작할 수 있는지 확인하세요. Native 기기의 시스템 글자 크기는
          별도 기기 검증이 필요합니다.
        </p>
        <p className="body-copy">
          줄바꿈이나 카드 전환은 소비자 배치와 공개 옵션으로 조절합니다.
          컴포넌트 내부 글자를 임의로 줄여 잘림을 숨기지 마세요.
        </p>
      </section>
  );
}
