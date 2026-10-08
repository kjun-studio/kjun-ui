// These are consuming-project examples, bundled only after installing the .tgz files.
import type { KjunFeedback } from "@kjun/tokens";
export type ExampleRenderer = (
  name: string,
  props?: Record<string, any>,
  children?: any,
  slots?: Record<string, any>
) => any;
export interface ExampleContext {
  h: ExampleRenderer;
  platform: string;
  values: Record<string, any>;
  set: (key: string, value: any) => void;
  feedback: KjunFeedback;
  domainColors?: Record<string, string>;
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  settings?: Record<string, any>;
}
export const buttonComparisons: Record<string, { caption: string; label?: string; props?: Record<string, any> }[]> = {
  "크기": ["xs", "sm", "md", "lg", "xl"].map(size => ({ caption: size, label: "저장", props: { size } })),
  "변형": ["primary", "secondary", "ghost", "danger", "danger-ghost", "success", "warning"].map(variant => ({ caption: variant, label: variant.includes("danger") ? "삭제" : "계속하기", props: { variant } })),
  "라벨·아이콘": [
    { caption: "짧은 문구", label: "저장" }, { caption: "한글", label: "변경 사항 저장" },
    { caption: "영문", label: "Save changes" },
    { caption: "앞 아이콘", label: "항목 추가", props: { prefixIcon: "plus" } },
    { caption: "뒤 아이콘", label: "다음", props: { suffixIcon: "arrow-right" } },
    { caption: "양쪽 아이콘", label: "항목 추가", props: { prefixIcon: "plus", suffixIcon: "arrow-right" } },
    { caption: "아이콘 전용", props: { prefixIcon: "plus", ariaLabel: "항목 추가" } },
  ],
  "상태": [
    { caption: "기본", label: "계속하기", props: { disabled: false, loading: false } },
    { caption: "로딩", label: "계속하기", props: { disabled: false, loading: true } },
    { caption: "비활성", label: "계속하기", props: { disabled: true, loading: false } },
  ],
};
export const formActionsComparisons: Record<string, { caption: string; props: Record<string, string | boolean> }[]> = {
  '크기': ['sm', 'md', 'lg'].map(size => ({ caption: size, props: { size } })),
  '변형': [
    { caption: '기본 취소 · 주요 확인', props: { cancelVariant: 'ghost', variant: 'primary' } },
    { caption: '보조 취소 · 위험 확인', props: { cancelVariant: 'secondary', variant: 'danger', confirmText: '삭제' } },
    { caption: '보조 취소 · 완료 확인', props: { cancelVariant: 'secondary', variant: 'success', confirmText: '완료' } },
  ],
  '표시': [
    { caption: '취소와 확인', props: { showCancel: true, showConfirm: true } },
    { caption: '확인만', props: { showCancel: false, showConfirm: true } },
    { caption: '취소만', props: { showCancel: true, showConfirm: false } },
  ],
};
export const inputComparisons: Record<string, { caption: string; props?: Record<string, any>; value?: string; suffix?: string }[]> = {
  "크기": ["sm", "md", "lg"].map(size => ({ caption: size, props: { size }, value: "장기 보유 자산" })),
  "상태": [
    { caption: "기본", value: "" }, { caption: "입력됨", value: "장기 보유 자산" },
    { caption: "오류", props: { error: true }, value: "" },
    { caption: "읽기 전용", props: { readOnly: true }, value: "장기 보유 자산" },
    { caption: "비활성", props: { disabled: true }, value: "장기 보유 자산" },
  ],
  "아이콘·단위": [
    { caption: "검색 아이콘", props: { prefixIcon: "search" }, value: "한빛테크" },
    { caption: "금액 단위", suffix: "원", value: "100,000" },
    { caption: "아이콘·지우기", props: { prefixIcon: "search", clearable: true }, value: "장기 보유 자산" },
  ],
};
export const defaultRows = [
  {
    id: "a",
    name: "긴 한국어 자산 이름",
    symbol: "AAA",
    price: 1234567,
    change: 2.35,
  },
  { id: "b", name: "두 번째 자산", symbol: "BBB", price: 98400, change: -1.25 },
  { id: "c", name: "세 번째 자산", symbol: "CCC", price: 6500, change: 0 },
];
export const columns = [
  { key: "name", label: "이름", sortable: true },
  {
    key: "price",
    label: "가격",
    type: "number",
    align: "right",
    sortable: true,
  },
  {
    key: "change",
    label: "변동",
    type: "number",
    align: "right",
    sortable: true,
  },
];
export const tableProjectRows = [
  { id: 'p1', name: '브랜드 웹사이트', owner: '김서연', status: '진행 중', progress: 72, budget: 4800000, due: '2026-10-08', summary: '메인 화면 검토를 마쳤습니다. 다음 작업은 모바일 화면과 접근성 점검입니다.' },
  { id: 'p2', name: '고객센터 개편', owner: '이도윤', status: '검토 대기', progress: 45, budget: 3200000, due: '2026-10-15', summary: '문의 분류와 검색 화면을 검토하고 있습니다. 담당자 승인 후 개발을 시작합니다.' },
  { id: 'p3', name: '결제 화면 개선', owner: '박하린', status: '완료', progress: 100, budget: 1600000, due: '2026-09-18', summary: '결제 단계와 오류 안내 개선을 완료했습니다. 검수 결과를 프로젝트 기록에 남겼습니다.' },
];
export const tableDocumentRows = [
  { id: 'd1', name: '서비스 소개서', category: '문서', owner: '김서연', updated: '2026-09-21' },
  { id: 'd2', name: '화면 설계안', category: '디자인', owner: '이도윤', updated: '2026-09-20' },
  { id: 'd3', name: '사용자 인터뷰', category: '리서치', owner: '박하린', updated: '2026-09-19' },
  { id: 'd4', name: '출시 체크리스트', category: '운영', owner: '최지우', updated: '2026-09-18' },
  { id: 'd5', name: '주간 성과 보고서', category: '분석', owner: '김서연', updated: '2026-09-17' },
  { id: 'd6', name: '고객 문의 모음', category: '운영', owner: '이도윤', updated: '2026-09-16' },
];
export const tableMetricRows = [
  { id: 'm1', name: '온라인 스토어', orders: 1248, revenue: 32480000, change: 12.4, progress: 86 },
  { id: 'm2', name: '모바일 앱', orders: 986, revenue: 25640000, change: 8.7, progress: 74 },
  { id: 'm3', name: '파트너 판매', orders: 432, revenue: 11232000, change: -3.2, progress: 58 },
  { id: 'm4', name: '오프라인 매장', orders: 216, revenue: 5616000, change: 0, progress: 42 },
];
export const tableExample = (settings: Record<string, any>) => {
  const design = settings.design || '기본';
  let data: Record<string, any>[] = defaultRows;
  let tableColumns: Record<string, any>[] = columns;
  if (design === '문서 목록') {
    data = tableDocumentRows;
    tableColumns = [
      { key: 'name', label: '문서 이름', sortable: true, width: 240 },
      { key: 'category', label: '분류', width: 100 },
      { key: 'owner', label: '작성자', width: 100 },
      { key: 'updated', label: '수정일', sortable: true, width: 140 },
    ];
  } else if (design === '프로젝트') {
    data = tableProjectRows;
    tableColumns = [
      { key: 'name', label: '프로젝트', sortable: true, width: 180 },
      { key: 'status', label: '상태', badge: true, width: 112 },
      { key: 'owner', label: '담당자', width: 80 },
      { key: 'progress', label: '진행률', sortable: true, width: 140 },
      { key: 'budget', label: '예산', sortable: true, align: 'right', width: 120 },
      { key: 'actions', label: '작업', width: 80 },
    ];
  } else if (design === '수치 비교') {
    data = tableMetricRows;
    tableColumns = [
      { key: 'name', label: '판매 채널', width: 180 },
      { key: 'orders', label: '주문 수', type: 'number', sortable: true, align: 'right', width: 100 },
      { key: 'revenue', label: '매출', sortable: true, align: 'right', width: 140 },
      { key: 'change', label: '전월 대비', sortable: true, align: 'right', width: 120 },
      { key: 'progress', label: '목표 달성', sortable: true, width: 140 },
    ];
  }
  if (settings.stickyHeader && design === '문서 목록') data = Array.from({ length: 18 }, (_, index) => ({ ...tableDocumentRows[index % tableDocumentRows.length], id: 'document-' + index, name: tableDocumentRows[index % tableDocumentRows.length].name + ' · ' + (index + 1) }));
  data = settings.data === 'empty' ? [] : data.map(row => settings.data === 'long' ? { ...row, name: row.name + ' · 긴 한국어 이름과 설명을 함께 표시합니다' } : row);
  return { data, columns: tableColumns, project: design === '프로젝트', metrics: design === '수치 비교',
    ariaLabel: design === '기본' ? '예제 데이터' : design,
    cardSections: design === '프로젝트' ? [
      { key: 'people', label: '담당', columns: ['owner'], layout: 'stack' },
      { key: 'metrics', label: '진행 현황', columns: ['progress', 'budget'], layout: 'grid' },
    ] : undefined,
  };
};
export const defaultOptions = [
  { value: "a", label: "사과" },
  { value: "b", label: "배", disabled: true },
  { value: "c", label: "체리" },
];
export const fieldOptions = (name: string, data?: unknown) => {
  const labels = name === "DsSelect" ? ["나만 보기", "전체 공개", "팀에 공개"] : ["한빛테크", "그린에너지", "오로라모빌리티"];
  return data === "empty" ? [] : defaultOptions.map((option, index) => ({ ...option,
    label: labels[index] + (data === "long" ? " · 긴 옵션 이름과 설명을 함께 표시합니다" : ""),
  }));
};
export const priceFormat = (value: number) =>
  value == null || !Number.isFinite(Number(value)) ? "—" : new Intl.NumberFormat("ko-KR").format(Number(value)) + "원";
export const metricFormat = (value: unknown, format: string) => {
  if (value == null || value === "") return "—";
  if (format !== "price" && format !== "percent") return String(value);
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  if (format === "price") return new Intl.NumberFormat("ko-KR").format(number) + "원";
  return (number > 0 ? "+" : "") + number.toFixed(2) + "%";
};
export const loaderCache = new Map<string, typeof loadOptions>();
export const loadOptions = async (query: string, { signal }: { signal: AbortSignal }, response = "정상") => {
  await new Promise<void>((resolve, reject) => {
    const done = () => { signal.removeEventListener("abort", abort); resolve(); };
    const id = setTimeout(done, response === "느린 응답" ? 1500 : 150);
    const abort = () => { clearTimeout(id); reject(new DOMException("취소", "AbortError")); };
    if (signal.aborted) abort(); else signal.addEventListener("abort", abort, { once: true });
  });
  if (response === "요청 실패") throw Error("검색 요청에 실패했습니다");
  if (response === "빈 결과") return [];
  return defaultRows.filter(row => row.name.includes(query) || row.symbol.includes(query.toUpperCase()))
    .map(row => response === "긴 결과" ? { ...row, name: row.name + " · 긴 한국어 이름과 추가 설명을 함께 표시합니다" } : row);
};
export const searchLoader = (response: string) => {
  if (!loaderCache.has(response)) loaderCache.set(response, (query, context) => loadOptions(query, context, response));
  return loaderCache.get(response)!;
};
export const sampleImage = (version: number) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" fill="' + (version % 2 ? '#E3EBF5' : '#E2EDE8') + '"/><circle cx="480" cy="90" r="36" fill="#F5C77A"/><path d="M0 360L180 100L360 360Z" fill="#678B82"/><path d="M240 360L460 150L640 360Z" fill="#456D68"/></svg>');
export const rows = defaultRows;
export const options = defaultOptions;

export function createExampleTools(c: ExampleContext) {
  const {
    h,
    platform,
    values,
    set,
    feedback,
    disabled = false,
    loading = false,
    error = false,
    settings = {},
  } = c;
  const get = (key: string, fallback: any) => Object.prototype.hasOwnProperty.call(values, key) ? values[key] : fallback,
    change = (key: string) => (value: any) => set(key, value);
  const rows = settings.data === "empty" ? [] : defaultRows.map(row => settings.data === "long" ? { ...row, name: row.name + " · 긴 한국어 자산 이름과 설명을 함께 표시합니다" } : row);
  const options = settings.data === "empty" ? [] : defaultOptions.map(option => settings.data === "long" ? { ...option, label: option.label + " · 긴 옵션 이름과 설명을 함께 표시합니다" } : option);
  const action = (fn: () => void) =>
    platform === "native" ? { onPress: fn } : { onClick: fn };
  const button = (label: string, fn: () => void) =>
    h("DsButton", action(fn), label);
  const message = (text: string) => set("message", text);
  // The error text replaces the hint so an error state never relies on the border color alone.
  const singleField = (label: string, hint: string, child: any, errorText = "") => h("Box", { width: 360 }, h("DsFormGroup", { label, hint, error: errorText }, child));
  const input = () =>
    h("DsInput", {
      value: get("input", ""),
      onValueChange: change("input"),
      ariaLabel: settings.label ? undefined : "입력 예제",
      placeholder: "내용을 입력하세요",
      disabled: settings.childDisabled ?? disabled,
      error: !!settings.errorMessage || error,
      clearable: true,
      size: settings.size || "md",
      readOnly: settings.readOnly || false,
      errorMessage: error ? "내용을 입력해 주세요." : "",
    });
  const menuItems = () => [
    h(
      "DsDropdownItem",
      { disabled: !!settings.itemDisabled, ...action(() => message("첫 항목 선택")) },
      "첫 항목"
    ),
    h("DsDropdownDivider"),
    h("DsDropdownItem", { disabled: true }, "비활성 항목"),
    h(
      "DsDropdownItem",
      { variant: "danger", ...action(() => message("마지막 항목 선택")) },
      "마지막 항목"
    ),
  ];
  const market = {
    rows,
    columns: [
      { ...columns[0], type: "text" },
      { ...columns[1], type: "price" },
      { ...columns[2], type: "percent" },
    ],
    primaryLabel: (r: any) => r.name,
    subMeta: (r: any) => r.symbol,
    totalCount: rows.length,
    hasLoadedOnce: true,
    loading,
    error: error ? "조회 오류" : null,
    priceFormatter: priceFormat,
    formatMetric: platform === "vue2" ? undefined : metricFormat,
    formatters: platform === "vue2" ? {
      KRW: (value: unknown) => metricFormat(value, "price"),
      price: (value: unknown) => metricFormat(value, "price"),
      percent: (value: unknown) => metricFormat(value, "percent"),
    } : undefined,
    onRowClick: (r: any) => message(r.name),
    showActions: true,
  };
  const query = {
    queryKey: get("queryKey", settings.queryState === "조건 변경" ? "b" : "a"),
    resultKey: get("resultKey", ["최초 로딩", "최초 실패"].includes(settings.queryState) ? null : "a"),
    loading: get("queryLoading", ["최초 로딩", "조건 변경", "동일 조건 갱신"].includes(settings.queryState)),
    error: get("queryError", ["갱신 실패", "최초 실패"].includes(settings.queryState) ? "조회에 실패했습니다" : null),
    hasLoadedOnce: !["최초 로딩", "최초 실패"].includes(settings.queryState),
  };

  return {
    h,
    domainColors: c.domainColors || {},
    platform,
    values,
    set,
    feedback,
    disabled,
    loading,
    error,
    get,
    change,
    action,
    button,
    message,
    input,
    menuItems,
    singleField,
    market,
    query,
    settings,
    rows,
    options,
  };
}
export type ExampleTools = ReturnType<typeof createExampleTools>;

export const cardTableRows = [{ id: "a", name: "서비스 소개서", owner: "김민서" }, { id: "b", name: "화면 설계서", owner: "이도윤" }, { id: "c", name: "운영 가이드", owner: "박서연" }];
export const cardTableColumns = [{ key: "name", label: "문서", sortable: true }, { key: "owner", label: "작성자" }];
export const cardMediaSource = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="320" viewBox="0 0 800 320"><rect width="800" height="320" fill="#e7edea"/><rect x="150" y="44" width="230" height="250" rx="16" fill="#fff"/><rect x="174" y="72" width="110" height="14" rx="7" fill="#34775e"/><path d="M174 118h182M174 148h182M174 178h130" stroke="#d9e3dd" stroke-width="10" stroke-linecap="round"/><rect x="410" y="88" width="240" height="186" rx="16" fill="#34775e"/><rect x="434" y="112" width="90" height="64" rx="8" fill="#d6e5bd"/><rect x="536" y="112" width="90" height="64" rx="8" fill="#a9cebe"/><path d="M434 210h168M434 236h106" stroke="#fff" stroke-opacity=".6" stroke-width="10" stroke-linecap="round"/></svg>');
