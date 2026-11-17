// A details section ("Payment method / Visa"): short values on the end line, a long value that wraps from its start,
// a value on its own line under the label, and an emphasized total that closes the list.
export const detailRows = [['결제 수단', '신한카드 (1234)'], ['승인 번호', '30418827'], ['배송지', '서울특별시 성동구 왕십리로 222, 한양대학교 제1공학관 304호']];
export const belowRow = ['배송 메모', '문 앞에 두고 벨은 누르지 말아 주세요. 공동현관 비밀번호는 없습니다.'];
export const totalRow = ['총 결제 금액', '29,000원'];
export function ListDetailsCases({ K }: { K: any }) {
  return <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
    <div data-testid="details" style={{ width: 360 }}>
      <K.KjunListSection title="주문 정보" variant="details">
        {detailRows.map(([title, value]) => <K.KjunListRow key={title} title={title} trailing={value} />)}
        <K.KjunListRow title={belowRow[0]} trailing={belowRow[1]} trailingPosition="below" />
        <K.KjunListRow title={totalRow[0]} trailing={totalRow[1]} emphasized />
      </K.KjunListSection>
    </div>
    <div data-testid="default" style={{ width: 360 }}>
      <K.KjunListSection title="기본">
        {detailRows.slice(0, 2).map(([title, value]) => <K.KjunListRow key={title} title={title} trailing={value} />)}
      </K.KjunListSection>
    </div>
  </div>;
}
