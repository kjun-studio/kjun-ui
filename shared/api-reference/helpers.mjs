export const detail = (summary, fields) => ({
  summary,
  details: Object.entries(fields).map(([label, text]) => ({ label, text })),
});
export const event = (
  summary,
  when,
  args = "없음",
  result = "반환값은 사용하지 않습니다.",
  state = "별도의 값 갱신이 필요하지 않습니다.",
) => detail(summary, { "발생 시점": when, 전달값: args, 반환값: result, "상태 책임": state });
export const slot = (
  summary,
  args = "제공 데이터 없음",
  caution = "표시 콘텐츠를 제공합니다. 업무 상태는 소비자가 관리합니다.",
) => detail(summary, { "슬롯 데이터": args, "사용 계약": caution });
export const fields = (name, summary, rows) => ({
  name,
  summary,
  fields: rows.map(([name, type, summary]) => ({ name, type, summary })),
});
