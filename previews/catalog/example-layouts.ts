import { columns, priceFormat, type ExampleTools } from "./example-tools";
export function renderLayoutExample(name: string, tools: ExampleTools): any {
  const { h, get, set, change, action, feedback, settings, rows } = tools;
  switch (name) {
    case "GuideSettingsForm": {
      const invalid = get("invalid", settings.validation),
        long = settings.content === "긴 콘텐츠";
      const save = () => {
        if (!get("formName", "").trim()) {
          set("invalid", true);
          return;
        }
        set("invalid", false);
        feedback.toast.success("변경 사항을 저장했습니다.");
      };
      return h("FieldStack", {}, [
        h(
          "DsFormGroup",
          {
            id: "settings-name",
            label: long ? "함께 사용하는 자산 목록에 표시할 긴 한국어 이름" : "목록 이름",
            required: true,
            hint: "동료가 구분할 수 있는 이름을 입력하세요.",
            error: invalid ? "목록 이름을 입력해 주세요." : "",
          },
          h("DsInput", {
            id: "settings-name",
            value: get("formName", ""),
            onValueChange: change("formName"),
            error: !!invalid,
            size: "lg",
            placeholder: "예: 장기 보유 자산",
          }),
        ),
        h(
          "DsFormGroup",
          {
            id: "settings-visibility",
            label: "공개 범위",
            hint: "선택한 범위의 사용자만 목록을 볼 수 있습니다.",
          },
          h("DsSelect", {
            value: get("visibility", "private"),
            onValueChange: change("visibility"),
            ariaLabel: "공개 범위",
            size: "lg",
            options: [
              { value: "private", label: "나만 보기" },
              {
                value: "team",
                label: long ? "프로젝트에 참여한 모든 팀원에게 공개하기" : "팀에 공개",
              },
            ],
          }),
        ),
        h("DsFormActions", {
          size: "lg",
          confirmText: "변경 사항 저장",
          cancelText: "입력 초기화",
          onConfirm: save,
          onCancel: () => {
            set("formName", "");
            set("visibility", "private");
            set("invalid", false);
          },
        }),
      ]);
    }
    case "GuideSearchToolbar": {
      const query = get("search", ""),
        filter = get("filter", "all");
      const results = rows.filter(
        (r: any) =>
          (!query || r.name.includes(query) || r.symbol.includes(query.toUpperCase())) &&
          (filter !== "up" || r.change > 0),
      );
      return h("Stack", {}, [
        h(
          "DsFormGroup",
          { label: "자산 검색", hint: "이름이나 종목 코드를 입력하세요." },
          h("DsSearchInput", {
            value: query,
            onValueChange: change("search"),
            minChars: 1,
            clearable: true,
            size: "sm",
            labelField: "name",
            ariaLabel: "자산 검색",
            loadOptions: async (q: string, { signal }: { signal: AbortSignal }) => {
              if (signal.aborted) throw new DOMException("취소", "AbortError");
              return rows.filter(
                (r: any) => r.name.includes(q) || r.symbol.includes(q.toUpperCase()),
              );
            },
            onSelect: (r: any) => set("chosen", r.name),
          }),
        ),
        h("Group", {}, [
          h("DsFilterGroup", {
            value: filter,
            onValueChange: change("filter"),
            size: "sm",
            ariaLabel: "목록 필터",
            options: [
              { value: "all", label: "전체" },
              {
                value: "up",
                label:
                  settings.content === "긴 콘텐츠"
                    ? "전일 대비 가격이 상승한 자산만 보기"
                    : "상승 자산",
              },
            ],
          }),
          h(
            "DsButton",
            {
              variant: "secondary",
              size: "sm",
              ...action(() => {
                set("search", "");
                set("filter", "all");
              }),
            },
            "필터 초기화",
          ),
        ]),
        h(
          "Text",
          {},
          get("chosen", "") ? "선택한 자산: " + get("chosen", "") : results.length + "개 결과",
        ),
        ...results.map((r: any) => h("Text", {}, r.name + " · " + r.symbol)),
      ]);
    }
    case "GuideAssetList": {
      const status = get("status", settings.status),
        empty = status === "빈 결과";
      const data =
        settings.content === "긴 콘텐츠"
          ? rows.map((r: any) => ({
              ...r,
              name: r.name + " · 장기 보유 중인 국내외 자산의 상세 이름",
              price: r.price * 1000,
            }))
          : rows;
      const price = (row: any) => h("DsPriceCell", { value: row.price, formatter: priceFormat });
      const delta = (row: any) =>
        h("DsSignedValue", { value: row.change, format: "percent", isRaw: true });
      return h("Stack", {}, [
        h(
          "DsDataState",
          {
            queryKey: "assets",
            resultKey: ["최초 로딩", "실패"].includes(status) ? null : "assets",
            hasLoadedOnce: !["최초 로딩", "실패"].includes(status),
            loading: status === "최초 로딩",
            error: status === "실패" ? "자산 목록을 불러오지 못했습니다." : null,
            skeleton: true,
            onRetry: () => set("status", "정상"),
          },
          empty
            ? h(
                "DsEmpty",
                {
                  text: "조건에 맞는 자산이 없습니다",
                  description: "필터를 초기화해 전체 목록을 확인하세요.",
                  icon: "search",
                },
                h(
                  "DsButton",
                  { variant: "secondary", ...action(() => set("status", "정상")) },
                  "필터 초기화",
                ),
              )
            : h(
                "DsTable",
                {
                  data,
                  columns,
                  ariaLabel: "자산 목록",
                  responsive: "card",
                  cardTitle: "name",
                  sortable: true,
                  renderCell: (value: any, col: any, row: any) =>
                    col.key === "price" ? price(row) : col.key === "change" ? delta(row) : value,
                },
                undefined,
                {
                  "cell-price": ({ row }: any) => price(row),
                  "cell-change": ({ row }: any) => delta(row),
                },
              ),
        ),
      ]);
    }
  }
}
