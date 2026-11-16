import { sampleImage, type ExampleTools } from "./example-tools";
export function renderExtensionExample(name: string, tools: ExampleTools): any {
  const { h, get, set, change, action, button, settings, disabled, error, platform, colors } = tools;
  switch (name) {
    case "KjunListRow":
    case "KjunListSection": {
      const leadingSize = ['xs', 'sm', 'md', 'lg'].includes(settings.leadingSize) ? settings.leadingSize : undefined;
      const iconColor = settings.iconColor ? platform === 'native' ? colors.brand : 'var(--kjun-brand)' : undefined;
      const iconBackground = settings.iconBackground ? platform === 'native' ? colors.secondary : 'var(--kjun-secondary)' : undefined;
      return h("KjunListSection", { title: "설정", description: "계정과 알림을 관리합니다.", variant: settings.variant }, [
        h("KjunListRow", { title: settings.long ? "모든 기기에서 사용할 프로필과 계정 표시 이름" : "프로필 설정", description: "이름과 사진을 변경합니다.", leadingSize, disabled, ...action(() => set("message", "프로필 설정 열기")) }, undefined, { leading: h("KjunAvatar", { name: "김하늘", size: leadingSize ?? "sm" }), actions: h("KjunButton", { variant: "secondary", size: "sm", ...action(() => set("message", "프로필 공유")) }, "공유") }),
        h("KjunListRow", { icon: "bell", leadingSize, iconColor, iconBackground, title: "알림 받기", description: "행 어디를 눌러도 켜고 끕니다.", disabled, checked: get("notifications", true), onCheckedChange: change("notifications") }),
        h("KjunListRow", { icon: "lock", leadingSize, iconColor, iconBackground, title: "비밀번호", chevron: true, disabled, ...action(() => set("message", "비밀번호 열기")) }, undefined, { trailing: "3개월 전 변경" }),
      ]);
    }
    case "KjunListGroup":
      return h("KjunListGroup", { variant: settings.variant }, [
        h("KjunListSection", { title: "계정" }, [h("KjunListRow", { title: "프로필", chevron: true, ...action(() => set("message", "프로필 열기")) }, undefined, { trailing: "김하늘" })]),
        h("KjunListSection", { title: "알림" }, [h("KjunListRow", { title: "푸시 알림", checked: get("push", true), onCheckedChange: change("push") })], { footer: "푸시 알림은 이 기기에서만 적용됩니다." }),
      ]);
    case "KjunListItem":
      return h("KjunListSection", { title: "화면" }, [
        h("KjunListItem", {}, h("KjunText", { tone: "secondary" }, "화면 테마는 기기 설정을 따릅니다.")),
        h("KjunListRow", { title: "글자 크기", chevron: true, ...action(() => set("message", "글자 크기 열기")) }),
      ]);
    case "KjunTopNavigation": {
      const leadingText = settings.leading === "긴 문구" ? "프로젝트 목록으로 돌아가기" : "";
      const save = (text: string) => h("KjunButton", { variant: "ghost", size: "sm", disabled, loading: settings.loading, ...action(() => set("message", text + " 요청")) }, text);
      const actions = settings.actions === "없음" ? undefined : settings.actions === "아이콘 조합" ? [
        h("KjunRefreshButton", { disabled, loading: settings.loading, onRefresh: () => set("message", "새로고침 요청") }),
        h("KjunMenuButton", { compact: true, variant: "ghost", ariaLabel: "더 보기", disabled, loading: settings.loading }, h("KjunDropdownItem", { ...action(() => set("message", "세부 정보 요청")) }, "세부 정보")),
        h("KjunIconToggle", { activeIcon: "heart", active: get("favorite", false), ariaLabel: "즐겨찾기", disabled, loading: settings.loading, onToggle: () => { set("favorite", !get("favorite", false)); set("message", "즐겨찾기 변경"); } }),
      ] : settings.actions === "여러 행동" ? [save("저장"), save("공유"), save("설정")] : save(settings.actions === "긴 문구" ? "Save changes and continue" : "저장");
      return h("KjunProvider", { safeArea: { top: settings.safeAreaTop } }, h("Box", { width: Number(settings.exampleWidth) }, h(name, { title: settings.long ? "팀과 함께 관리하는 프로젝트의 상세 설정" : "프로젝트 설정", description: settings.showDescription ? "변경할 내용을 선택하세요." : undefined }, undefined, {
        leading: settings.leading === "없음" ? undefined : h("KjunButton", { variant: "ghost", size: "sm", ariaLabel: leadingText || "뒤로 가기", prefixIcon: "arrow-left", disabled, ...action(() => set("message", "뒤로 가기 요청")) }, leadingText || undefined), actions,
      })));
    }
    case "KjunBottomNavigation":
      // The bar sits at the bottom of a screen, over the page colour, so its surface and shadow show.
      return h("KjunProvider", { safeArea: { bottom: settings.safeAreaBottom } }, h("Screen", { height: 280 }, [
        h("Scroll", {}, h("Inset", {}, h("Text", {}, "현재 위치: " + get("destination", "home")))),
        h(name, { iconStyle: settings.iconStyle, showLabels: settings.showLabels, value: get("destination", "home"), items: [{ key: "home", label: "홈", href: "#home", icon: "home" }, { key: "activity", label: settings.long ? "모든 프로젝트 활동 내역" : "활동", href: "#activity", icon: "list", badge: 3 }, { key: "settings", label: "설정", href: "#settings", icon: "settings" }], keyboardVisible: settings.keyboardVisible, hideOnKeyboard: settings.hideOnKeyboard, onNavigate: (key: string, event: any) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button > 0) return; event.preventDefault(); set("destination", key); } }),
      ]));
    case "KjunFloatingNavigation":
      return h("Stack", {}, [h("KjunProvider", { safeArea: { bottom: settings.safeAreaBottom } }, h(name, { value: get("destination", "home"), items: [{ key: "home", label: "홈", href: "#home", icon: "home" }, { key: "search", label: "검색", href: "#search", icon: "search", badge: settings.badges ? true : undefined }, { key: "activity", label: "알림", href: "#activity", icon: "bell", badge: settings.badges ? 3 : undefined }, { key: "profile", label: "내 정보", href: "#profile", icon: "user" }], keyboardVisible: settings.keyboardVisible, hideOnKeyboard: settings.hideOnKeyboard, onNavigate: (key: string, event: any) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button > 0) return; event.preventDefault(); set("destination", key); } })), h("Text", {}, "현재 위치: " + get("destination", "home"))]);
    case "KjunSideNavigation":
      // A sidebar column of a fixed width, as an app would give it; "활동" carries a badge and "문서" opens its children.
      return h("Stack", {}, [h("Box", { width: 240 }, h(name, { ariaLabel: "작업 공간", value: get("destination", "home"), items: [
        { key: "home", label: "홈", href: "#home", icon: "home" },
        { key: "activity", label: settings.long ? "모든 프로젝트 활동 내역" : "활동", href: "#activity", icon: "list", badge: 3 },
        { title: "문서", items: [
          { key: "projects", label: "프로젝트", icon: "folder", children: [{ key: "brand", label: "브랜드 웹사이트", href: "#brand" }, { key: "checkout", label: "결제 화면 개선", href: "#checkout" }] },
          { key: "archive", label: "보관함", href: "#archive", icon: "archive" },
        ] },
        { title: "관리", items: [{ key: "settings", label: "설정", href: "#settings", icon: "settings", disabled }] },
      ], onNavigate: (key: string, event: any) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button > 0) return; event.preventDefault?.(); set("destination", key); } })),
      h("Text", {}, "현재 위치: " + get("destination", "home"))]);
    case "KjunPressable":
      // The shape is the app's: a rounded, padded area that is neither a button nor a card.
      return h("Stack", {}, [h("Box", { width: 280 }, h(name, { ariaLabel: "추억 지도에서 보기", disabled, pressEffect: settings.pressEffect, focusRingInset: settings.focusRingInset,
        style: platform === "vue3" ? { borderRadius: "16px", overflow: "hidden" } : { borderRadius: 16, overflow: "hidden" }, ...action(() => set("message", "지도 열기")) },
        h("KjunCard", { title: "교토 3박 4일", subtitle: "사진 128장 · 7월 14일–17일", surface: "muted" }))),
      h("Text", {}, get("message", "누르기 전"))]);
    case "KjunBottomActionBar":
      return h("KjunProvider", { safeArea: { bottom: settings.safeAreaBottom } }, h(name, { description: settings.long ? "변경한 설정은 저장한 뒤 모든 기기에 적용됩니다. 저장이 완료될 때까지 화면을 유지해 주세요." : "저장하면 모든 기기에 적용됩니다.", keyboardVisible: settings.keyboardVisible, hideOnKeyboard: settings.hideOnKeyboard }, h("KjunFormActions", { confirmText: "변경 사항 저장", onConfirm: () => set("message", "저장 요청"), onCancel: () => set("message", "취소 요청") })));
    case "KjunCarousel": {
      const cards = [["이번 주 추천", "새로 나온 템플릿을 확인하세요"], ["팀 공간", "동료와 문서를 함께 정리합니다"], ["알림 정리", "중요한 소식만 받아 보세요"], ["보관함", "지난 작업을 다시 찾습니다"]].map(([title, subtitle], i) =>
        h("KjunCard", { title, subtitle, surface: "muted" }, undefined, { media: h("KjunImage", { src: sampleImage(i), alt: "", decorative: true, aspectRatio: 2 }) }));
      return h("Stack", {}, [h(name, { ...(settings.title ? { title: "추천 콘텐츠" } : { ariaLabel: "추천 콘텐츠" }), slideSize: settings.slideSize, gap: settings.gap, indicators: settings.indicators === "none" ? false : settings.indicators, controls: settings.controls, snapAlign: settings.snapAlign, bleed: settings.bleed, indicatorPlacement: settings.indicatorPlacement, ...(platform === "native" ? {} : { mouseDrag: settings.mouseDrag }),
        index: get("slide", 0), onIndexChange: change("slide") }, settings.slideSize === "auto" ? cards.map(card => h("Box", { width: 240 }, card)) : cards),
        h("Text", {}, `현재 슬라이드: ${get("slide", 0) + 1}`)]);
    }
    case "KjunImage":
      return h("Stack", {}, [h(name, { src: settings.imageState === "실패" ? "data:image/png;base64,invalid" : settings.imageState === "로딩" && !get("imageReady", false) ? undefined : sampleImage(get("imageVersion", 0)), alt: "산과 하늘을 표현한 프로젝트 표지", decorative: settings.decorative, aspectRatio: settings.aspectRatio, fit: settings.fit, onLoad: () => set("message", "이미지 로드 완료"), onError: () => set("message", "이미지 로드 실패") }, undefined, { fallback: settings.imageState === "로딩" && !get("imageReady", false) ? "이미지 주소를 준비합니다" : "이미지를 불러올 수 없습니다" }), settings.imageState === "로딩" && !get("imageReady", false) ? button("로컬 이미지 준비 · 2초", async () => { await new Promise(resolve => setTimeout(resolve, 2000)); set("imageReady", true); }) : null, button("이미지 주소 변경", () => set("imageVersion", get("imageVersion", 0) + 1))]);
    case "KjunAvatar":
      return h(name, { name: "김하늘", src: settings.imageState === "사진" ? sampleImage(0) : settings.imageState === "실패" ? "data:image/png;base64,invalid" : undefined, size: settings.size, shape: settings.shape, decorative: settings.decorative });
    case "KjunChip":
      return h("Group", {}, [get("removed", false) ? button("태그 복원", () => set("removed", false)) : h(name, { label: settings.long ? "팀에서 함께 사용하는 프로젝트 분류" : "프로젝트", icon: "folder", removable: settings.removable, disabled, size: settings.size, onRemove: () => set("removed", true) })]);
    case "KjunSlider":
      return h(name, { value: get("slider", settings.decimal ? .5 : 40), min: 0, max: settings.decimal ? 1 : 100, step: settings.decimal ? .1 : 1, disabled, label: "알림 음량", onValueChange: change("slider"), onChangeCommit: (value: number) => set("message", "확정: " + value) });
    case "KjunRangeSlider":
      return h(name, { value: get("range", settings.decimal ? [.2, .8] : [20, 80]), min: 0, max: settings.decimal ? 1 : 100, step: settings.decimal ? .1 : 1, disabled, label: "조회 범위", thumbLabels: ["시작 값", "끝 값"], onValueChange: change("range"), onChangeCommit: (value: number[]) => set("message", "확정: " + value.join(" ~ ")) });
    case "KjunTimePicker":
      return h("Box", { width: 360 }, h("KjunFormGroup", { label: "알림 시각", error: error ? "알림 시각을 선택해 주세요." : "" }, h(name, { value: get("time", null), precision: settings.precision, minuteStep: settings.minuteStep, secondStep: settings.secondStep, min: settings.bounded ? (settings.precision === "second" ? "09:30:15" : "09:30") : undefined, max: settings.bounded ? (settings.precision === "second" ? "18:30:45" : "18:30") : undefined, disabled, error, clearable: settings.clearable, size: settings.size, block: settings.block, ariaLabel: "알림 시각", onValueChange: change("time"), onChangeCommit: (value: string | null) => set("message", "선택: " + value) })));
    case "KjunZoneGauge": {
      // Zone colours are the app's own: KJUN draws them as given.
      const color = (role: string) => platform === "native" ? colors[role] : `var(--kjun-${role})`;
      return h("Box", { width: 480 }, h(name, { label: "PER 백분위", value: settings.missing ? null : Number(settings.value), size: settings.size, zoneLabels: settings.zoneLabels,
        zones: [{ to: 30, label: "저평가", color: color("info") }, { to: 70, label: "중립" }, { to: 100, label: "고평가", color: color("warning") }] }));
    }
    case "KjunStackedBar": {
      const color = (role: string) => platform === "native" ? colors[role] : `var(--kjun-${role})`;
      const values = settings.data === "작은 조각" ? [990, 5, 5] : settings.data === "모두 0" ? [0, 0, 0] : [12, 6, 2];
      return h("Box", { width: 480 }, h(name, { label: "애널리스트 의견", size: settings.size, legend: settings.legend, items: settings.data === "없음" ? null
        : [{ key: "bull", label: "강세", value: values[0], color: color("danger") }, { key: "flat", label: "중립", value: values[1] }, { key: "bear", label: "약세", value: values[2], color: color("info") }] }));
    }
    case "KjunSplitPane": {
      const vertical = settings.direction === "vertical";
      const pane = (title: string, subtitle: string) => h("KjunCard", { title, subtitle });
      return h("Stack", {}, [h("Box", { width: 560, height: vertical ? 320 : 180 }, h(name, { ariaLabel: "메시지 목록 크기", direction: settings.direction, size: get("split", 0.6), onSizeChange: change("split"), defaultSize: 0.6,
        minSize: settings.limits ? vertical ? [80, 80] : [160, 200] : undefined, disabled, onChangeCommit: (size: number) => set("message", "확정: " + size) }, undefined,
        { first: pane("메시지 목록", "첫 패널"), second: pane("상세 내용", "둘째 패널") })),
        h("Text", {}, `첫 패널 비율: ${Math.round(get("split", 0.6) * 100)}%`)]);
    }
    case "KjunColorPicker":
      return h("Box", { width: 360 }, h("KjunFormGroup", { label: "라벨 색", error: error ? "라벨 색을 선택해 주세요." : "" }, h(name, { value: get("color", settings.alpha ? "#3B82F6CC" : "#3B82F6"),
        swatches: settings.swatches ? ["#EF4444", "#F97316", "#EAB308", "#22C55E", "#14B8A6", "#3B82F6", "#8B5CF6", "#EC4899", "#64748B", "#111111"] : undefined, custom: settings.custom, alpha: settings.alpha, input: settings.input, clearable: settings.clearable, eyeDropper: settings.eyeDropper,
        recentColors: settings.recent ? get("recentColors", ["#0EA5E9", "#7C3AED"]) : undefined, onRecentColorsChange: settings.recent ? change("recentColors") : undefined,
        size: settings.size, disabled, error, ariaLabel: "라벨 색", onValueChange: change("color") })));
    case "KjunQuantityStepper":
      return h("Box", { width: 360 }, h("KjunFormGroup", { label: "주문 수량", error: error ? "주문 수량을 확인해 주세요." : "" }, h(name, { value: get("quantity", settings.decimal ? 1.25 : 2), min: settings.negative ? -10 : 0, max: 10, step: settings.decimal ? .1 : 1, precision: settings.decimal ? 2 : 0, disabled, error, size: settings.size, block: settings.block, ariaLabel: "주문 수량", onValueChange: change("quantity"), onChangeCommit: (value: number) => set("message", "확정: " + value), onInvalidInput: (draft: string) => set("message", "잘못된 수량: " + draft) })));
  }
}
