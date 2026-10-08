import { UsageBuilder, type UsageInput } from './builder';
import { defaultRows } from '../../previews/catalog/example-tools';

export function generate(input: UsageInput) {
  const b = new UsageBuilder(input), s = input.settings;
  b.data('rows', defaultRows);
  b.data('response', s.response);
  const loadOptions = b.declare('loadOptions', `async function loadOptions(query, { signal }) {
  await new Promise((resolve, reject) => {
    const finish = () => {
      signal.removeEventListener("abort", abort);
      resolve();
    };
    const timer = setTimeout(finish, response === "느린 응답" ? 1500 : 150);
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException("취소", "AbortError"));
    };
    if (signal.aborted) abort();
    else signal.addEventListener("abort", abort, { once: true });
  });
  if (response === "요청 실패") throw Error("검색 요청에 실패했습니다");
  if (response === "빈 결과") return [];
  return rows
    .filter(row => row.name.includes(query) || row.symbol.includes(query.toUpperCase()))
    .map(row => response === "긴 결과"
      ? { ...row, name: row.name + " · 긴 한국어 이름과 추가 설명을 함께 표시합니다" }
      : row);
}`);
  return b.finish(b.node(b.native ? 'View' : 'div', { style: { width: b.native ? 360 : '360px', maxWidth: '100%' } }, b.node('DsFormGroup', { label: '자산 검색', hint: '이름이나 종목 코드를 입력하세요.' }, b.node('DsSearchInput', {
    value: b.state('search', ''), onValueChange: b.update('search'), loadOptions,
    ...b.props('clearable', 'size', 'debounce', 'error', 'minChars', 'disabled'),
    labelField: 'name', ariaLabel: '자산 검색', placeholder: '한국어 또는 AAA 검색',
    onSelect: b.handler('selectAsset', 'row', b.result('row.name')),
    onSearchError: b.handler('searchError', '', b.result('"검색 오류"')),
  }))));
}
