import {
  buttonComparisons,
  formActionsComparisons,
  inputComparisons,
  fieldOptions,
  rows,
  columns,
  options,
  priceFormat,
  searchLoader,
  type ExampleTools,
} from "./example-tools";
export function renderControlExample(name: string, tools: ExampleTools): any {
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
    singleField,
    market,
    query,
    settings, rows, options,
    domainColors,
  } = tools;
  switch (name) {
    case "DsButton": {
      const cases = buttonComparisons[String(settings.comparison)];
      if (cases) return h("Group", {}, cases.map(item => h("Stack", {}, [
        h("Text", {}, item.caption),
        h("Group", {}, [h(name, { size: settings.size, variant: settings.variant, disabled, loading,
          ...item.props, ...action(() => set("count", get("count", 0) + 1)),
        }, item.label)]),
      ])));
      return h("Stack", {}, [h("Group", {}, [h(name, {
        size: settings.size, variant: settings.variant, disabled, loading,
        block: settings.block, ...(settings.iconOnly ? { prefixIcon: "plus", ariaLabel: "항목 추가" } : {}),
        ...action(() => set("count", get("count", 0) + 1)),
      }, settings.iconOnly ? undefined : "계속하기")]),
      h("Text", {}, get("count", 0) ? get("count", 0) + "번 실행했습니다" : "버튼을 눌러보세요")]);
    }
    case "DsIcon":
      return h("Group", {}, [
        h(name, { name: "heart", size: 28 }),
        h(name, { name: "heart", filled: true, size: 28 }),
        h(name, { name: "star", filled: true, size: 28 }),
        h(name, { name: "refresh", spin: settings.spin, size: 28 }),
      ]);
    case "DsBadge":
      return h(
        "Group",
        {},
        [
          "default",
          "primary",
          "success",
          "warning",
          "danger",
          "price-up",
          "price-down",
        ].map((variant) => h(name, { variant, dot: true }, variant))
      );
    case "DsSpinner":
      return h(name, { size: "md", text: "조회 중" });
    case "DsAlert":
      return h(name, {
        variant: settings.tone, size: settings.size, title: settings.title,
        closable: settings.closable, onClose: () => message("알림 닫힘"),
      }, settings.body, settings.action
        ? { actions: h("DsButton", { variant: "secondary", ...action(() => message("재시도 요청")) }, "다시 시도") }
        : {});
    case "DsProgress":
      return h("Stack", {}, [
        h(name, {
          value: get("progress", 42),
          showLabel: true,
          label: "완료율",
        }),
        button("진행", () => set("progress", (get("progress", 42) + 10) % 101)),
      ]);
    case "DsInput": {
      const cases = inputComparisons[String(settings.comparison)];
      if (cases) return h("Box", { width: 360 }, h("FieldStack", {}, cases.map((item, index) => h("DsFormGroup", {
        label: item.caption, error: item.props?.error ? "목록 이름을 입력해 주세요." : "",
      }, h(name, { size: settings.size, value: get("inputCase" + index, item.value || ""),
        onValueChange: change("inputCase" + index), placeholder: "목록 이름", ...item.props,
      }, undefined, item.suffix ? { suffix: h("Text", {}, item.suffix) } : {})))));
      return h("Box", { width: 360 }, h("DsFormGroup", { label: "목록 이름", hint: "동료가 구분할 수 있는 이름을 입력하세요.", error: error ? "목록 이름을 입력해 주세요." : "" },
        h(name, { value: get("input", ""), onValueChange: change("input"), size: settings.size, disabled,
          readOnly: settings.readOnly, error, clearable: true, placeholder: "예: 장기 보유 자산" })));
    }
    case "DsFormGroup":
      return h(
        name,
        {
          label: settings.label,
          hint: settings.hint,
          required: settings.required,
          error: settings.errorMessage,
        },
        input()
      );
    case "DsFormActions": {
      const props = Object.fromEntries(['size', 'variant', 'cancelVariant', 'confirmText', 'cancelText', 'showCancel', 'showConfirm', 'cancelDisabled'].map(key => [key, settings[key]]));
      const cases = formActionsComparisons[String(settings.comparison)] || [{ caption: '', props: {} }];
      return h('Box', { width: Number(settings.exampleWidth || 360) },
        h('Stack', {}, cases.map(item => h('Stack', {}, [item.caption ? h('Text', {}, item.caption) : null,
          h(name, { ...props, loading, confirmDisabled: disabled, ...item.props,
            onConfirm: () => message('확인'), onCancel: () => message('취소') }),
        ]))));
    }
    case "DsCheckbox":
      return h(name, {
        value: get("checked", false),
        onValueChange: change("checked"),
        label: "알림 받기",
        disabled,
      });
    case "DsSwitch":
      return h(name, {
        value: get("switch", false),
        onValueChange: change("switch"),
        label: "자동 갱신",
        disabled,
      });
    case "DsRadio":
      return h(
        "DsRadioGroup",
        { value: get("radio", "a"), onValueChange: change("radio") },
        [
          h(name, { val: "a", label: "첫 선택", disabled }),
          h(name, { val: "c", label: "다음 선택" }),
        ]
      );
    case "DsRadioGroup":
      return h(name, {
        value: get("radio", "a"),
        options,
        ...(platform === "vue2" ? { disabled } : {}),
        ariaLabel: "과일 라디오",
        onValueChange: change("radio"),
      });
    case "DsTextarea":
      return singleField("목록 설명", "목록의 목적을 간단히 설명해 주세요.", h(name, {
        value: get("textarea", ""),
        onValueChange: change("textarea"),
        placeholder: "목록의 목적과 공유할 내용을 입력하세요.",
        ariaLabel: "목록 설명",
        rows: 3,
        size: settings.size,
        disabled,
        error,
      }), error ? "목록 설명을 입력해 주세요." : "");
    case "DsSelect":
      return singleField("공개 범위", "선택한 범위의 사용자만 목록을 볼 수 있습니다.", h(name, {
        value: get("select", settings.multiple ? [] : null),
        multiple: settings.multiple,
        size: settings.size,
        open: get("selectOpen", false),
        onOpenChange: change("selectOpen"),
        onValueChange: change("select"),
        options: fieldOptions(name, settings.data),
        ariaLabel: "공개 범위",
        searchable: settings.searchable,
        clearable: settings.clearable,
        disabled,
        loading,
        error,
      }), error ? "공개 범위를 선택해 주세요." : "");
    case "DsCombobox":
      return singleField("자산 선택", "자산 이름을 입력해 후보를 찾아보세요.", h(name, {
        value: get("combo", null),
        onValueChange: change("combo"),
        options: fieldOptions(name, settings.data),
        ariaLabel: "자산 선택",
        clearable: true,
        size: settings.size,
        error,
        disabled,
      }), error ? "목록에 있는 자산을 선택해 주세요." : "");
    case "DsSearchInput":
      return singleField("자산 검색", "이름이나 종목 코드를 입력하세요.", h(name, {
        value: get("search", ""),
        onValueChange: change("search"),
        loadOptions: searchLoader(settings.response),
        clearable: settings.clearable,
        size: settings.size,
        debounce: settings.debounce,
        error,
        labelField: "name",
        ariaLabel: "자산 검색",
        placeholder: "한국어 또는 AAA 검색",
        minChars: settings.minChars,
        disabled,
        onSelect: (r: any) => message(r.name),
        onSearchError: () => message("검색 오류"),
      }), error ? "검색어를 다시 확인해 주세요." : "");
    case "DsDatePicker":
      return singleField("시작일", "목록을 사용하기 시작할 날짜를 선택하세요.", h(name, {
        value: get("date", "2026-09-12"),
        onValueChange: change("date"),
        min: "2026-09-01",
        max: "2026-09-30",
        ariaLabel: "시작일",
        size: settings.size,
        disabled,
        error,
      }), error ? "시작일을 선택해 주세요." : "");
    case "DsButtonGroup":
      return h(name, {
        size: settings.size,
        fullWidth: settings.fullWidth,
        value: get("group", "a"),
        options,
        onValueChange: change("group"),
        ariaLabel: "과일 보기",
        disabled,
      });
    case "DsFilterGroup":
      return h(name, {
        value: get("filters", ["a"]),
        multiple: true,
        options,
        onValueChange: change("filters"),
        ariaLabel: "과일 필터",
        disabled,
      });
    case "DsTabs":
    case "DsTabPane":
      return h(
        "DsTabs",
        { ariaLabel: "예제 보기", value: get("tab", "one"), onValueChange: change("tab"), variant: settings.variant, density: settings.density },
        [
          h("DsTabPane", { name: "one", label: "첫 탭" }, "첫 내용"),
          h("DsTabPane", { name: "two", label: "둘째 탭" }, "둘째 내용"),
          h(
            "DsTabPane",
            { name: "blocked", label: "비활성 탭", disabled: true },
            "비활성 내용"
          ),
        ]
      );
    case "DsDropdown":
    case "DsDropdownItem":
    case "DsDropdownDivider":
      return h("DsDropdown", { disabled }, menuItems(), {
        trigger: button("메뉴 열기", () => {}),
      });
    case "DsMenuButton":
      return h(name, { label: "작업 메뉴", size: settings.size, variant: settings.variant, compact: settings.compact, disabled, loading }, menuItems());
    case "DsAccordion":
    case "DsAccordionItem":
      return h("DsAccordion", { tone: settings.tone, multiple: settings.multiple }, [
        h("DsAccordionItem", { title: "첫 항목", disabled: !!settings.itemDisabled }, "첫 내용"),
        h("DsAccordionItem", { title: "둘째 항목" }, "둘째 내용"),
      ]);
    case "DsModal":
    case "DsDrawer":
      return h("Stack", {}, [
        button(name === "DsModal" ? "모달 열기" : "패널 열기", () =>
          set("open", true)
        ),
        h(
          name,
          {
            open: get("open", false),
            onOpenChange: change("open"),
            title: settings.title || "작업 확인",
            ...(name === "DsModal" ? {
              size: settings.size || "md", confirmText: settings.confirmText || "확인", showFooter: true,
              loading, confirmDisabled: disabled,
              onConfirm: () => { set("open", false); message("저장했습니다"); },
            } : {}),
          },
          h("Stack", {}, [
            input(),
            // A secondary body action leaves the footer's confirm as the layer's one primary action.
            h("DsButton", { variant: "secondary", ...action(() =>
              feedback.toast.info("열린 레이어의 영역 알림", { duration: 0 })
            ) }, "알림 표시"),
          ])
        ),
      ]);
    case "DsBreadcrumb":
      return h(name, {
        items: [
          { label: "홈", to: "#home", href: "#home" },
          { label: "목록", to: "#list", href: "#list" },
          { label: "현재 위치" },
        ],
        onNavigate: () => message("탐색"),
      });
    case "DsPagination":
      return h(name, {
        currentPage: get("page", 1),
        totalPages: 10,
        totalRows: 195,
        pageSize: get("pageSize", 20),
        showInfo: true,
        showSizeSelector: true,
        onPageChange: change("page"),
        onPageSizeChange: (n: number) => { set("pageSize", n); message("페이지 크기 " + n); },
      });
    case "DsIconToggle": {
      const kind = settings.usage === "즐겨찾기" ? "favorite" : settings.usage === "관심" ? "interest" : null;
      const label = kind === "favorite" ? "즐겨찾기" : "관심";
      return h(name, {
        active: get("active", false),
        activeIcon: kind === "favorite" ? "star" : "heart",
        ariaLabel: kind ? "예제 항목 " + label + (get("active", false) ? " 해제" : " 등록") : "좋아요",
        ...(kind ? platform === "vue2" ? { activeColorClass: "text-" + kind }
          : { activeColor: platform === "native" ? domainColors[kind] : `var(--kjun-${kind})` } : {}),
        size: settings.size,
        disabled,
        loading,
        onToggle: () => set("active", !get("active", false)),
      });
    }
    case "DsCopyButton":
      return h(name, {
        value: "KJUN UI",
        text: "복사",
        disabled,
        copyText: async (value: string) => {
          message("프로젝트 복사 콜백: " + value);
        },
        onCopied: () => message("복사 완료"),
      });
    case "DsRefreshButton":
      return h(name, {
        targetName: "목록",
        mode: settings.mode,
        size: settings.size,
        loading,
        disabled,
        onRefresh: () => message("갱신 요청"),
      });
    case "DsExternalLink":
      return h(
        name,
        {
          href: "https://example.com",
          label: "외부 페이지",
          openUrl: () => message("프로젝트 링크 열기 콜백"),
        },
        "외부 페이지"
      );
    case "DsScrollFade":
      return h(
        name,
        {},
        h(
          "ScrollItems",
          {},
          Array.from({ length: 12 }, (_, i) =>
            h(
              "DsButton",
              { variant: "secondary", size: "sm", key: i },
              "항목 " + (i + 1)
            )
          )
        )
      );
    case "KjunProvider":
      return h("DsCard", { title: "프로젝트 영역" }, input());
    case "KjunFeedbackProvider":
      return h("Group", {}, [
        ...(["전체", "Toast"].includes(settings.service) ? [button("Toast 표시", () =>
          feedback.toast[settings.tone === "danger" ? "error" : settings.tone as "success"](settings.message, {
            title: settings.title, duration: settings.duration, closable: settings.closable,
          }))] : []),
        ...(["전체", "Confirm"].includes(settings.service) ? [button("Confirm 요청", async () => {
          try {
            const confirmed = await feedback.confirm({ title: settings.confirmTitle, message: settings.confirmMessage,
              type: settings.tone, confirmText: settings.confirmText, cancelText: settings.cancelText,
              onConfirm: async () => {
                if (settings.confirmAction !== "즉시 완료") await new Promise(resolve => setTimeout(resolve, 600));
                if (settings.confirmAction === "비동기 실패") throw Error("저장에 실패했습니다");
              },
            });
            message(String(confirmed));
            return confirmed;
          } catch (error) { message(String(error)); return { error: String(error) }; }
        })] : []),
        ...(["전체", "Prompt"].includes(settings.service) ? [button("Prompt 요청", async () => {
          const result = await feedback.prompt({ title: settings.promptTitle, message: settings.promptMessage,
            type: settings.tone, confirmText: settings.confirmText, cancelText: settings.cancelText,
            initialValue: settings.initialValue,
            validator: settings.validate ? value => value.trim().length > 1 || "두 글자 이상 입력하세요." : undefined,
          });
          message(String(result));
          return result;
        })] : []),
      ]);
    default:
      throw Error("Missing example: " + name);
  }
}
