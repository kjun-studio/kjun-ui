'use client';
import { tableDesignExamples } from '../../../../shared/table-examples';
import { GuideExample } from './guide-example';

export function TableExamples() {
  return <section id="table-designs">
    <h2>디자인 예제</h2>
    <p className="body-copy">목록의 목적에 맞게 행 밀도, 셀 내용, 선택과 상세 영역을 조합하세요. 각 예제에서 직접 정렬하거나 행을 조작할 수 있습니다.</p>
    <div className="guide-comparison-grid detail-comparisons" data-layout="wide">
      {tableDesignExamples.map(scenario => <GuideExample key={scenario.id} name="DsTable" scenario={scenario} />)}
    </div>
  </section>;
}
