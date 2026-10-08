'use client';
import { useRef, useState } from 'react';
import { DsTabs, DsTabPane } from '@kjun/react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './disclosure';
import { designCases, designSections, designScenario, designWidths, type DesignCase } from '../../../../shared/visual-guides/design-cases';
import { usageGuideHref } from '../../../../shared/document-navigation';
import { DesignFigure } from './design-figure';
import { ImplementationUsage } from './usage-source';
import { GuideExample } from './guide-example';
import { useDocsPlatform, PlatformLoading } from './docs-platform';
import Link from './doc-link';
import catalog from '../../../../shared/component-catalog.json';
const componentPaths = Object.fromEntries(catalog.map(item => [item.name, item.docs]));

function DesignComparison({ item }: { item: DesignCase }) {
  const { platform } = useDocsPlatform();
  const [width, setWidth] = useState(375), [opened, setOpened] = useState(false);
  const execution = useRef<HTMLDivElement>(null);
  const run = () => {
    setOpened(true);
    requestAnimationFrame(() => {
      execution.current?.scrollIntoView({ block: 'start' });
      execution.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    });
  };
  return <article className="design-case" data-design-case={item.id}>
    <h3>{item.title}</h3><p className="body-copy">{item.situation}</p>
    {item.appliesWhen && <p className="body-copy"><strong>적용 조건</strong> · {item.appliesWhen}</p>}
    {item.caution && <p className="design-caption"><strong>주의</strong> · {item.caution}</p>}
    <DsTabs value={String(width)} onValueChange={value => setWidth(Number(value))} density="compact" ariaLabel={`${item.title} 화면 폭`}>

      <p className="design-caption">같은 화면 폭과 색상·서체에서 배치와 문구의 차이를 비교하세요.</p>
      {designWidths.map(value => <DsTabPane name={String(value)} label={value === 375 ? "좁은 화면 · 375px" : "넓은 화면 · 640px"} key={value}>
        {!platform ? <PlatformLoading /> : <div className="design-pair" data-width={value}>
          {(['before', 'after'] as const).map(side => <DesignFigure key={platform + side + value} item={item} side={side} width={value} platform={platform} onRun={run} />)}
        </div>}
      </DsTabPane>)}
    </DsTabs>
    <div ref={execution} className="design-execution">
      <Collapsible open={opened} onOpenChange={setOpened}>
        <CollapsibleTrigger variant="secondary">실행 예제 {opened ? '접기' : '보기'}</CollapsibleTrigger>
        <CollapsibleContent>
          {opened && <><p className="design-caption">{width}px의 실제 프레임에서 조작합니다. 프레임이 화면보다 넓으면 이 영역 안에서 가로로 스크롤할 수 있습니다.</p>
            <div className="design-runs">{(['before', 'after'] as const).map(side => <GuideExample key={width + side} name={item.name} scenario={designScenario(item, side, width)} destination={usageGuideHref(item.section)} />)}</div>
          </>}
        </CollapsibleContent>
      </Collapsible>
    </div>
    <ImplementationUsage name={item.name} />
    <p className="body-copy related-usage-links">관련 기본 사용법 · {item.components.map((name, index) => <span key={name}>
      {index > 0 && ' · '}<Link href={(name === 'KjunFeedbackProvider' ? '/feedback' : componentPaths[name]) + '#usage'}>{name === 'KjunFeedbackProvider' ? '피드백 서비스' : name.slice(2)}</Link>
    </span>)}</p>
  </article>;
}
export function DesignComparisons({ component, sectionIds }: { component?: string; sectionIds?: string[] }) {
  if (component) {
    const related = designCases.filter(item => item.components.includes(component));
    return related.length ? <div className="related-design-guides">
      <h3>관련 사용 가이드</h3>
      {related.map(item => <div id={'design-' + item.id} className="design-detail" key={item.id}>
        <Link href={usageGuideHref(item.section)}>{item.title}<span aria-hidden="true"> →</span></Link>
      </div>)}
    </div> : null;
  }
  return <>{designSections.filter(section => !sectionIds || sectionIds.includes(section.id)).map(section => <section id={section.id} key={section.id}>
    <h2>{section.title}</h2>{designCases.filter(item => item.section === section.id).map(item => <DesignComparison key={item.id} item={item} />)}
  </section>)}</>;
}
