import {
  rows,
  columns,
  options,
  priceFormat,
  tableExample,
  loadOptions,
  type ExampleTools,
} from "./example-tools";
export function renderDataExample(name: string, tools: ExampleTools): any {
  const {
    h,
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
    market,
    query,
    settings, rows, options,
  } = tools;
  switch (name) {
    case "DsEmpty":
      return h(
        name,
        {
          text: "항목이 없습니다",
          description: "조건을 바꾸거나 새 항목을 추가하세요.",
          icon: "search",
        },
        button("추가", () => message((JSON.parse(settings.visual || "{}").DsButton?.text || "추가") + " 요청"))
      );
    case "DsSkeleton":
      return h(name, { type: "card", animated: settings.animated, rows: 3 });
    case "DsListSkeleton":
      return h(name, { rows: 3, variant: "market", avatar: true });
    case "DsFormSkeleton":
      return h(name, { fields: ["", "", ""], size: settings.size || "md", multiline: !!settings.multiline, columns: 1 });
    case "DsChartSkeleton":
      return h(name, { kind: settings.kind, loadingText:settings.loadingText, height: 180 });
    case "DsMarketTableSkeleton":
      return h(name, {
        columns,
        rows: 3,
        showActions: true,
        alignClass: (v: string) => "text-" + (v || "left"),
        widthClass: () => "",
      });
    case "DsTooltip":
      return h(
        name,
        { content: "이 버튼의 도움말", delay: 100 },
        button("도움말", () => {})
      );
    case "DsPopover":
      return h(
        name,
        { noPadding:settings.noPadding, manualTrigger: true, ariaLabel: "추가 정보", open: get("popoverOpen", false), onOpenChange: change("popoverOpen") },
        [
          h("Text", { style: { lineHeight: platform === "native" ? 20 : "20px" } }, "팝오버 내용"),
          h("DsFormActions", { size: "md", showCancel: false, confirmText: "실행", onConfirm: () => message("팝오버 실행") }),
        ],
        { trigger: h("DsButton", { variant: "ghost", ...action(() => set("popoverOpen", !get("popoverOpen", false))) }, "추가 정보") }
      );
    case "DsDataState":
      return h("Stack", {}, [
        // Demo controls are peers, so none of them claims the primary emphasis.
        h("Group", {}, [
          h("DsButton", { variant: "secondary", ...action(() => {
            set("queryKey", "b");
            set("queryLoading", true);
          }) }, "조건 변경"),
          h("DsButton", { variant: "secondary", ...action(() => set("queryLoading", true)) }, "동일 조건 갱신"),
          h("DsButton", { variant: "secondary", ...action(() => {
            set("resultKey", query.queryKey);
            set("queryLoading", false);
            set("queryError", null);
          }) }, "조회 완료"),
          h("DsButton", { variant: "secondary", ...action(() => {
            set("queryLoading", false);
            set("queryError", "조회에 실패했습니다");
          }) }, "조회 실패"),
        ]),
        h(
          name,
          {
            ...query,
            preserveContent: settings.preserveContent,
            skeleton: settings.skeleton,
            empty: settings.empty,
            size: settings.size,
            loadingText: settings.loadingText,
            refreshingText: settings.refreshingText,
            emptyText: settings.emptyText,
            emptyIcon: settings.emptyIcon,
            emptyActionText: settings.emptyActionText,
            retryText: settings.retryText,
            onEmptyAction: () => message("조건 초기화 요청"),
            skeletonCount: 1,
            onRetry: () => {
              set("queryError", null);
              set("queryLoading", true);
            },
          },
          h(
            "DsCard",
            { title: "조회 결과", surface: "muted" },
            "이전 결과와 현재 조건을 구분합니다."
          )
        ),
      ]);
    case "DsErrorBoundary":
      return h("Stack", {}, [
        // Demo controls are peers, so none of them claims the fallback's primary emphasis.
        h("Group", {}, [
          h("DsButton", { variant: "secondary", ...action(() => set("renderFailure", true)) }, "오류 발생"),
          h("DsButton", { variant: "secondary", ...action(() => {
            set("renderFailure", false);
            set("boundaryRun", get("boundaryRun", 0) + 1);
            message("예제를 복구했습니다.");
          }) }, "예제 복구"),
        ]),
        h(name, {
          key: get("boundaryRun", 0),
          fallbackMessage: "예제를 표시할 수 없습니다",
          onReset: () => { set("renderFailure", false); message("다시 시도했습니다."); },
        }, h("ExampleFailure", { failed: get("renderFailure", false) })),
      ]);
    case "DsTable": {
      const example = tableExample(settings);
      const status = (row: any) => h('DsBadge', { size: 'sm', variant: row.status === '완료' ? 'success' : row.status === '검토 대기' ? 'warning' : 'primary', dot: true }, row.status);
      const progress = (row: any) => h('DsProgressCell', { value: row.progress, max: 100 });
      const money = (row: any, key: string) => h('DsPriceCell', { value: row[key], formatter: priceFormat });
      const delta = (row: any) => h('DsSignedValue', { value: row.change, format: 'percent', isRaw: true });
      const view = (row: any) => h('DsButton', { size: 'xs', variant: 'ghost', ariaLabel: row.name + ' 보기', ...action(() => message(row.name + ' 상세 보기')) }, '보기');
      const detail = (row: any) => example.project ? h('DsAlert', { type: 'info' }, row.summary + ' 담당자 ' + row.owner + ' · 마감 ' + row.due) : '상세: ' + row.name;
      const selectionAction = () => h('DsButton', { size: 'xs', variant: 'secondary', ...action(() => message(get('selected', []).map((row: any) => row.name).join(', ') + ' 선택 확인')) }, '선택 항목 확인');
      return h(
        name,
        {
          columns: example.columns,
          data: example.data,
          compact: settings.compact,
          striped: settings.striped,
          hoverable: settings.hoverable,
          stickyHeader: settings.stickyHeader,
          maxHeight: settings.stickyHeader ? 240 : undefined,
          selectable: settings.selectable,
          sortable: settings.sortable,
          selected: get("selected", []),
          onSelectionChange: change("selected"),
          expandable: settings.expandable,
          expandedRows: get("expanded", []),
          onExpandedRowsChange: change("expanded"),
          renderExpand: detail,
          renderSelectionToolbar: selectionAction,
          renderCell: (value: any, column: any, row: any) => {
            if (example.project && column.key === 'status') return status(row);
            if (example.project && column.key === 'actions') return view(row);
            if ((example.project || example.metrics) && column.key === 'progress') return progress(row);
            if (example.project && column.key === 'budget') return money(row, 'budget');
            if (example.metrics && column.key === 'revenue') return money(row, 'revenue');
            if (example.metrics && column.key === 'change') return delta(row);
            return column.type === 'number' ? new Intl.NumberFormat('ko-KR').format(Number(value)) : value;
          },
          responsive: settings.responsive,
          cardTitle: "name",
          cardSections: example.cardSections,
          ariaLabel: example.ariaLabel,
          loading,
          error: error ? "조회 오류" : null,
          hasLoadedOnce: true,
          searchable: settings.searchable,
          onSearch: (q: string) => message("프로젝트 검색: " + q),
          onSortChange: (s: any) => message("정렬 " + s.key + " " + s.order),
        },
        undefined,
        platform === 'vue2' ? {
          expand: ({ row }: any) => detail(row),
          'selection-toolbar': selectionAction,
          ...(example.project ? { 'cell-status': ({ row }: any) => status(row), 'cell-actions': ({ row }: any) => view(row), 'cell-budget': ({ row }: any) => money(row, 'budget') } : {}),
          ...(example.project || example.metrics ? { 'cell-progress': ({ row }: any) => progress(row) } : {}),
          ...(example.metrics ? { 'cell-revenue': ({ row }: any) => money(row, 'revenue'), 'cell-change': ({ row }: any) => delta(row) } : {}),
        } : {}
      );
    }
    case "DsKpiHero":
      return h(name, {
        label: "총 평가 금액",
        value: 123456789,
        suffix: "원",
        deltaAbsolute: 2345678,
        deltaPercent: 1.9,
        deltaDescription: "전일 대비",
        loading,
        animated: false,
        formatter: (n: number) => new Intl.NumberFormat("ko-KR").format(n),
        secondary: [
          {
            label: "수익률",
            value: 12.3,
            suffix: "%",
            decimals: 1,
            semantic: "price",
          },
        ],
      });
    case "DsKpiRow":
      return h(name, {
        loading, mobileSummary:settings.mobileSummary,
        items: [
          { label: "평가 금액", value: 1234567, suffix: "원" },
          {
            label: "수익률",
            value: 2.35,
            decimals: 2,
            suffix: "%",
            semantic: "price",
          },
          {
            label: "상태",
            value: "정상",
            valueKind: "text",
            badge: { text: "연결", variant: "success" },
          },
        ],
      });
    case "DsAnimatedNumber":
      return h("Stack", {}, [
        h(name, {
          value: get("number", 1234567),
          suffix: "원",
          fromPrevious: true,
        }),
        button("숫자 변경", () => set("number", get("number", 1234567) + 123)),
      ]);
    case "DsFreshness":
      return h(name, {
        stale: true,
        source: "close",
        fetchedAt: "2026-09-12T03:00:00Z",
      });
    case "DsPriceCell":
      return h(name, {
        value: 1234567,
        formatter: priceFormat,
        stale: settings.stale,
        showFreshness: true,
      });
    case "DsSignedValue":
      return h(
        "Group",
        {},
        [-1.25, 0, 2.35].map((value) =>
          h(name, {
            value,
            format: "percent",
            isRaw: true,
            loading,
            stale: settings.stale,
          })
        )
      );
    case "DsDeviation":
      return h(
        "Group",
        {},
        [-1.25, 0, 2.35].map((value) => h(name, { value, variant: "badge" }))
      );
    case "DsHeatmapCell":
      return h(
        "Group",
        {},
        [-1, -0.5, 0, 0.5, 1].map((value) =>
          h(name, { value, min: -1, max: 1, mode: "price" }, String(value))
        )
      );
    case "DsProgressCell":
      return h(name, { value: 42, max: 100, showLabel: true });
    case "DsCollectionMark":
      return h("Group", {}, [
        h(name, { kind: "favorite", active: true }),
        h(name, { kind: "interest", active: true }),
      ]);
    case "DsExecutionStatusBadge":
      return h(
        "Group",
        {},
        ["queued", "running", "completed", "failed"].map((status) =>
          h(name, { status })
        )
      );
    case "DsSparkline":
      return h(name, {
        data: [1, 4, 3, 7, 5, 8],
        width: 240,
        height: 64,
        fill: true,
        semantic: "price",
        ariaLabel: "추세",
      });
    case "DsMarketSimpleList":
      return h(name, {
        ...market,
        priceValue: (r: any) => r.price,
        changeValue: (r: any) => r.change,
      });
    case "DsMarketTable":
      return h(name, {
        ...market,
        onToggleFavorite: (r: any) => message("즐겨찾기 " + r.name),
        onToggleInterest: (r: any) => message("관심 " + r.name),
        onSort: (key: string) => message((market.columns.find(column => column.key === key)?.label || "선택한 항목") + " 기준으로 정렬했습니다."),
      });
    case "DsMarketCards":
      return h(name, {
        ...market,
        storageNamespace: "kjun-docs-market",
        metricConfig: {
          price: { label: "가격", format: "price", sortKey: "price" },
          change: { label: "변동", format: "percent", sortKey: "change" },
        },
        priceMetricKeys: ["price"],
        changeMetricKey: "change",
        onSort: (key: string) => message((market.columns.find(column => column.key === key)?.label || "선택한 항목") + " 기준으로 정렬했습니다."),
      });
    case "DsMarketListPanel":
      return h(name, {}, h("DsMarketSimpleList", { ...market, priceValue: (r: any) => r.price, changeValue: (r: any) => r.change }), {
        controls: h("DsFilterGroup", {
          value: "a",
          options,
          onValueChange: (v: any) => message(String(v)),
        }),
      });
    default:
      throw Error("Missing example: " + name);
  }
}
