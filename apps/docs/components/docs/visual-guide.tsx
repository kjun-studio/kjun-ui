'use client';
import { useDocsPlatform, PlatformLoading } from './docs-platform';
import Link from './doc-link';
import { DesignComparisons } from './design-comparison';
import { AnatomyFigure } from './anatomy-figure';
import { GuideExample } from './guide-example';
import { CardExamples } from './card-examples';
import { TableExamples } from './table-examples';
import { ComponentDimensions } from './component-dimensions';
import definitions from '@/lib/generated/visual-guides.json';
import { usageGuideHref } from '../../../../shared/document-navigation';
import { recommendations } from '../../../../shared/visual-guides/usage-content';
import type { VisualGuide } from '../../../../shared/visual-guides/types';
const guides = definitions as unknown as Record<string, VisualGuide>;
const compactComponents = new Set([
  'DsButtonGroup', 'DsCopyButton', 'DsRefreshButton', 'DsIconToggle', 'DsChip',
  'DsCheckbox', 'DsRadio', 'DsSwitch', 'DsBadge', 'DsIcon', 'DsAvatar', 'DsSpinner',
  'DsDivider', 'DsCollectionMark',
]);
const buttonComparisons = [
  ['button-variants', '변형'], ['button-sizes', '크기'], ['button-states', '상태'],
  ['button-labels', '라벨·아이콘'], ['button-block', '전체 너비 · 375px'],
];
export function VisualSections({ name }: { name: string }) {
  const { platform } = useDocsPlatform(),
    guide = guides[name];
  if (!platform)
    return (
      <>
        <section id="anatomy">
          <h2>구조</h2>
          <PlatformLoading />
        </section>
        <section id="states">
          <h2>상태·크기</h2>
          <PlatformLoading />
        </section>
      </>
    );
  const data = guide.platforms[platform];
  return (
    <>
      {name === 'DsTable' && <TableExamples />}
      {name === 'DsCard' && <CardExamples />}
      <section id="anatomy">
        <h2>구조</h2>
        {data.figures.map((figure) => (
          <AnatomyFigure
            key={platform + figure.id}
            name={name}
            platform={platform}
            figure={figure}
          />
        ))}
      </section>
      <section id="states">
        <h2>상태·크기</h2>
        <p className="body-copy">{data.note}</p>
        <ComponentDimensions name={name} />
        {['DsButton', 'DsInput', 'DsTabs', 'DsTabPane'].includes(name) && <p className="body-copy"><Link href="/interaction">상태·상호작용</Link>에서 조작·선택·비활성·읽기 전용·작업 진행의 차이를 직접 확인하세요.</p>}
        <p className="guide-note">
          아래는 비교용 설정입니다. 속성을 생략했을 때의 기본값은 API에서 확인하세요.
        </p>
        {name === 'DsButton' ? <div className="guide-comparison-grid detail-comparisons" data-layout="wide">
          {buttonComparisons.map(([id, label]) => {
            const scenario = data.states.find(item => item.id === id)!;
            return <GuideExample key={platform + id} name={name} mode="comparison" scenario={{ ...scenario, label }} />;
          })}
        </div> : <>
        <h3>상태 비교</h3>
        {data.states.length === 1 && (
          <p>
            이 예제에는 별도로 비교할 공개 상태 속성이 없습니다. 콘텐츠와 동작은
            실행 예제에서 확인하세요.
          </p>
        )}
        <div className="guide-comparison-grid detail-comparisons" data-layout={compactComponents.has(name) ? 'compact' : 'wide'}>
          {data.states.map((scenario) => (
            <GuideExample
              key={platform + scenario.id}
              name={name}
              scenario={scenario}
              mode="comparison"
            />
          ))}
        </div>
        {!!data.sizes.length && (
          <>
            <h3>크기 비교</h3>
            <p>
              패키지 size 기본값: <code>{data.sizeDefault}</code>. 가용 폭
              안에서 실제 크기로 표시합니다.
            </p>
            <div className="guide-comparison-grid detail-comparisons" data-layout={compactComponents.has(name) ? 'compact' : 'wide'}>
              {data.sizes.map((scenario) => (
                <GuideExample
                  key={platform + scenario.id}
                  name={name}
                  scenario={scenario}
                  mode="comparison"
                />
              ))}
            </div>
          </>
        )}
        </>}
      </section>
      <DesignComparisons component={name} />
    </>
  );
}
export function UsageAdvice({ name, advice }: { name: string; advice?: [string, string] }) {
  const guide = guides[name],
    pair = advice ?? recommendations[name];
  return (
    <div className="visual-usage-advice">
      {pair && (
        <div className="usage-guides">
          <div>
            <h3>권장</h3>
            <p>{pair[0]}</p>
          </div>
          <div>
            <h3>피하기</h3>
            <p>{pair[1]}</p>
          </div>
        </div>
      )}
      <Link href={usageGuideHref(guide.related)}>
        관련 선택 기준·배치 사례 보기 →
      </Link>
    </div>
  );
}
