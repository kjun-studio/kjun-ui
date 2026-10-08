'use client';
import { cardDesignExamples } from '../../../../shared/card-examples';
import { GuideExample } from './guide-example';
export function CardExamples() {
  return <section id="card-designs">
    <h2>디자인 예제</h2>
    <p className="body-copy">내용에 맞게 헤더·미디어·본문·푸터를 구성하세요. 표면, 여백, 모서리, 테두리와 그림자는 독립적으로 선택합니다.</p>
    <div className="guide-comparison-grid detail-comparisons" data-layout="wide">
      {cardDesignExamples.map(scenario => <GuideExample key={scenario.id} name="DsCard" scenario={scenario} />)}
    </div>
  </section>;
}
