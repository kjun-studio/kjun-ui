import { sampleImage, type ExampleTools } from "./example-tools";
export function renderExtensionExample(name: string, tools: ExampleTools): any {
  const { h, get, set, change, action, button, settings, disabled, error, platform, colors } = tools;
  switch (name) {
    case "KjunListRow":
    case "KjunListSection": {
      const leadingSize = ['xs', 'sm', 'md', 'lg'].includes(settings.leadingSize) ? settings.leadingSize : undefined;
      const iconColor = settings.iconColor ? platform === 'native' ? colors.brand : 'var(--kjun-brand)' : undefined;
      const iconBackground = settings.iconBackground ? platform === 'native' ? colors.secondary : 'var(--kjun-secondary)' : undefined;
      // A details section reads label and value pairs; its rows are never pressed, and a total closes it.
      if (name === "KjunListSection" && settings.variant === "details") return h("KjunListSection", { title: "결제 정보", variant: "details" }, [
        h("KjunListRow", { title: "결제 수단" }, undefined, { trailing: "신한카드 (1234)" }),
        h("KjunListRow", { title: "승인 번호" }, undefined, { trailing: "30418827" }),
        h("KjunListRow", { title: "배송지" }, undefined, { trailing: settings.long ? "서울특별시 성동구 왕십리로 222, 한양대학교 제1공학관 304호" : "서울 성동구 왕십리로 222" }),
        h("KjunListRow", { title: "배송 메모", trailingPosition: "below" }, undefined, { trailing: "문 앞에 두고 벨은 누르지 말아 주세요." }),
        h("KjunListRow", { title: "총 결제 금액", emphasized: true }, undefined, { trailing: "29,000원" }),
      ]);
      return h("KjunListSection", { title: "설정", description: "계정과 알림을 관리합니다.", variant: settings.variant }, [
        h("KjunListRow", { title: settings.long ? "모든 기기에서 사용할 프로필과 계정 표시 이름" : "프로필 설정", description: "이름과 사진을 변경합니다.", leadingSize, current: settings.current || undefined, disabled, ...action(() => set("message", "프로필 설정 열기")) }, undefined, { leading: h("KjunAvatar", { name: "김하늘", size: leadingSize ?? "sm" }), actions: h("KjunButton", { variant: "secondary", size: "sm", ...action(() => set("message", "프로필 공유")) }, "공유") }),
        h("KjunListRow", { icon: "bell", leadingSize, iconColor, iconBackground, title: "알림 받기", description: "행 어디를 눌러도 켜고 끕니다.", disabled, checked: get("notifications", true), onCheckedChange: change("notifications") }),
        h("KjunListRow", { icon: "lock", leadingSize, iconColor, iconBackground, title: "비밀번호", chevron: true, disabled, ...action(() => set("message", "비밀번호 열기")) }, undefined, { trailing: "3개월 전 변경" }),
        // A row that opens its own content: the head is the button, the content sits outside it.
        ...(settings.expandable ? [h("KjunListRow", { icon: "device-mobile", leadingSize, iconColor, iconBackground, title: "로그인한 기기", disabled, expanded: get("devices", false), onExpandedChange: change("devices"),
          ...(platform === "vue3" ? {} : { expandedContent: h("KjunText", { tone: "secondary" }, "이 휴대폰 · 방금 전, 사무실 노트북 · 어제") }) }, undefined,
          { trailing: "2대", ...(platform === "vue3" ? { expanded: h("KjunText", { tone: "secondary" }, "이 휴대폰 · 방금 전, 사무실 노트북 · 어제") } : {}) })] : []),
      ]);
    }
    case "KjunListGroup":
      return h("KjunListGroup", { variant: settings.variant }, [
        h("KjunListSection", { title: "계정" }, [h("KjunListRow", { title: "프로필", chevron: true, ...action(() => set("message", "프로필 열기")) }, undefined, { trailing: "김하늘" })]),
        h("KjunListSection", { title: "알림" }, [h("KjunListRow", { title: "푸시 알림", checked: get("push", true), onCheckedChange: change("push") })], { footer: "푸시 알림은 이 기기에서만 적용됩니다." }),
        h("KjunListSection", { title: "연결된 기기" }, [
          h("KjunListRow", { title: "이 휴대폰", icon: "device-mobile" }, undefined, { trailing: "방금 전" }),
          h("KjunListRow", { title: "사무실 노트북", icon: "device-laptop" }, undefined, { trailing: "어제" }),
        ], { badge: h("KjunBadge", { count: 2 }) }),
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
        h(name, { iconStyle: settings.iconStyle, showLabels: settings.showLabels, value: get("destination", "home"), items: [{ key: "home", label: "홈", href: "#home", icon: "home" }, { key: "activity", label: settings.long ? "모든 프로젝트 활동 내역" : "활동", href: "#activity", icon: "list", badge: 3 }, { key: "settings", label: "설정", href: "#settings", icon: "settings" }], keyboardVisible: settings.keyboardVisible, hideOnKeyboard: settings.hideOnKeyboard, onNavigate: (key: string, event: any) => { event.preventDefault(); set("destination", key); } }),
      ]));
    case "KjunFloatingNavigation":
      return h("Stack", {}, [h("KjunProvider", { safeArea: { bottom: settings.safeAreaBottom } }, h(name, { value: get("destination", "home"), items: [{ key: "home", label: "홈", href: "#home", icon: "home" }, { key: "search", label: "검색", href: "#search", icon: "search", badge: settings.badges ? true : undefined }, { key: "activity", label: "알림", href: "#activity", icon: "bell", badge: settings.badges ? 3 : undefined }, { key: "profile", label: "내 정보", href: "#profile", icon: "user" }], keyboardVisible: settings.keyboardVisible, hideOnKeyboard: settings.hideOnKeyboard, onNavigate: (key: string, event: any) => { event.preventDefault(); set("destination", key); } })), h("Text", {}, "현재 위치: " + get("destination", "home"))]);
    case "KjunSideNavigation": {
      // A sidebar column of a fixed width, as an app would give it; "활동" carries a badge, "문서" opens its children and
      // "도움말" opens in a new tab. Icons only, the column narrows and widens again when a parent or group is pressed;
      // groups carry icons for a rail of groups, and with collapsibleGroups their titles open and close them.
      if (settings.spaces) return sideNavigationSpaces(tools);
      // chrome: a header and a footer with the collapse toggle, which narrows and widens the column itself.
      const collapsed = settings.chrome ? get("narrow", !!settings.collapsed) : !!settings.collapsed && !get("widened", false);
      return h("Stack", {}, [h("Box", { width: collapsed ? settings.railLabels ? 72 : 44 : 240 }, h(name, { ariaLabel: "작업 공간", value: get("destination", "home"), collapsed,
        collapsibleGroups: settings.collapsibleGroups, rail: settings.rail, railLabels: settings.railLabels, density: settings.density,
        collapsedParent: settings.collapsedParent, groupCounts: settings.groupCounts, collapseToggle: !!settings.chrome,
        onAction: (key: string, act: string) => set("destination", key + ":" + act),
        onCollapsedChange: (next: boolean) => settings.chrome ? set("narrow", next) : set("widened", !next), items: [
        { key: "home", label: "홈", href: "#home", icon: "home" },
        { key: "activity", label: settings.long ? "아주 긴 이름을 가진 프로젝트 활동 내역" : "활동", shortLabel: "활동", href: "#activity", icon: "list", badge: 3, badgeTone: settings.neutralBadges ? "neutral" : undefined },
        { title: "문서", icon: "file-text", limit: settings.limit ? 1 : undefined, items: [
          { key: "projects", label: "프로젝트", icon: "folder", children: [{ key: "brand", label: "브랜드 웹사이트", href: "#brand", badge: true }, { key: "checkout", label: "결제 화면 개선", href: "#checkout" },
            ...(settings.nested ? [{ key: "design", label: "디자인", children: [{ key: "tokens", label: "토큰", href: "#tokens" }, { key: "icons", label: "아이콘", href: "#icons" }] }] : [])] },
          { key: "archive", label: "보관함", href: "#archive", icon: "box", actions: settings.actions ? [{ key: "new", icon: "plus", label: "새 문서" }, { key: "more", icon: "dots", label: "더 보기" }] : undefined },
        ] },
        { key: "help", label: "도움말", href: "https://example.com/help", icon: "help-circle", target: "_blank" },
        // empty: a group people fill, shown with its empty line while it has no rows.
        ...(settings.empty ? [{ title: "즐겨찾기", icon: "star", items: [], empty: "즐겨찾기한 문서가 없습니다" }] : []),
        { title: "관리", icon: "adjustments", items: [{ key: "settings", label: "설정", href: "#settings", icon: "settings", disabled }] },
      ], onNavigate: (key: string, event: any) => { event.preventDefault?.(); set("destination", key); } }, undefined,
        settings.chrome ? { header: h("Text", {}, "KJ Studio"), footer: h("Text", {}, "계정") } : undefined)),
      h("Text", {}, "현재 위치: " + get("destination", "home"))]);
    }
    case "KjunSideNavigationLayout": {
      // The layout keeps the column's width (open, collapsed, or a drawer on a narrow screen); the page is the app's.
      // drawer: the breakpoint is set above this frame's width, so the menu opens from a button instead.
      const narrow = !!settings.drawer, collapsed = !!settings.collapsed;
      const menu = (state: any) => h("KjunSideNavigation", { ariaLabel: "작업 공간", value: get("destination", "home"), collapsed: state.collapsed, railLabels: settings.railLabels, items: [
        { key: "home", label: "홈", href: "#home", icon: "home" },
        { key: "activity", label: "활동", href: "#activity", icon: "list", badge: 3, badgeTone: "neutral" },
        { title: "문서", icon: "file-text", items: [{ key: "projects", label: "프로젝트", href: "#projects", icon: "folder" }, { key: "archive", label: "보관함", href: "#archive", icon: "box" }] },
      ], onNavigate: (key: string, event: any) => { event.preventDefault?.(); set("destination", key); state.closeDrawer(); } });
      return h("Box", { width: 640 }, h(name, { collapsed, railLabels: settings.railLabels, width: settings.width, breakpoint: narrow ? 100000 : 0, ...(platform === "native" ? {} : { sticky: false }),
        navOpen: get("navOpen", false), onNavOpenChange: change("navOpen") }, h("Stack", {}, [
        narrow ? button("메뉴 열기", () => set("navOpen", true)) : null,
        h("Text", {}, "현재 위치: " + get("destination", "home")),
      ]), { nav: menu }));
    }
    case "KjunPressable":
      // The shape is the app's: a rounded, padded area that is neither a button nor a card.
      return h("Stack", {}, [h("Box", { width: 280 }, h(name, { ariaLabel: "추억 지도에서 보기", disabled, pressEffect: settings.pressEffect, focusRingInset: settings.focusRingInset,
        style: platform === "vue3" ? { borderRadius: "16px", overflow: "hidden" } : { borderRadius: 16, overflow: "hidden" }, ...action(() => set("message", "지도 열기")) },
        h("KjunCard", { title: "교토 3박 4일", subtitle: "사진 128장 · 7월 14일–17일", surface: "muted" }))),
      h("Text", {}, get("message", "누르기 전"))]);
    case "KjunBottomActionBar":
      return h("KjunProvider", { safeArea: { bottom: settings.safeAreaBottom } }, h(name, { variant: settings.variant, description: settings.long ? "변경한 설정은 저장한 뒤 모든 기기에 적용됩니다. 저장이 완료될 때까지 화면을 유지해 주세요." : "저장하면 모든 기기에 적용됩니다.", keyboardVisible: settings.keyboardVisible, hideOnKeyboard: settings.hideOnKeyboard }, h("KjunFormActions", { confirmText: "변경 사항 저장", onConfirm: () => set("message", "저장 요청"), onCancel: () => set("message", "취소 요청") })));
    case "KjunCarousel": {
      const cards = [["이번 주 추천", "새로 나온 템플릿을 확인하세요"], ["팀 공간", "동료와 문서를 함께 정리합니다"], ["알림 정리", "중요한 소식만 받아 보세요"], ["보관함", "지난 작업을 다시 찾습니다"]].map(([title, subtitle], i) =>
        h("KjunCard", { title, subtitle, surface: "muted" }, undefined, { media: h("KjunImage", { src: sampleImage(i), alt: "", decorative: true, aspectRatio: 2 }) }));
      return h("Stack", {}, [h(name, { ...(settings.title ? { title: "추천 콘텐츠" } : { ariaLabel: "추천 콘텐츠" }), slideSize: settings.slideSize, ...(settings.minSlideWidth ? { minSlideWidth: 180 } : {}), gap: settings.gap, indicators: settings.indicators === "none" ? false : settings.indicators, controls: settings.controls, snapAlign: settings.snapAlign, bleed: settings.bleed, indicatorPlacement: settings.indicatorPlacement, ...(platform === "native" ? {} : { mouseDrag: settings.mouseDrag }),
        index: get("slide", 0), onIndexChange: change("slide") }, settings.slideSize === "auto" && !settings.minSlideWidth ? cards.map(card => h("Box", { width: 240 }, card)) : cards,
        settings.action ? { action: h("KjunButton", { variant: "ghost", size: "sm", ...action(() => set("message", "전체 보기")) }, "전체 보기") } : undefined),
        h("Text", {}, `현재 슬라이드: ${get("slide", 0) + 1}`)]);
    }
    case "KjunSteps": {
      // A wizard by default, a delivery trail when vertical: the vertical rows carry the time (meta) and a line of detail.
      const vertical = settings.orientation === "vertical";
      const wizard = ["약관 동의", "배송지", "결제", "주문 확인", "완료"].map(label => ({ label }));
      const trail = [["주문 접수", "11월 17일 09:12", "주문이 접수되었습니다"], ["상품 준비", "11월 17일 10:40", "판매자가 상품을 포장하고 있습니다"], ["배송 시작", "11월 17일 14:05", "서울 강서 허브에서 출발했습니다"], ["배송 중", "도착 예정 11월 18일", "기사님이 배송 중입니다"], ["배송 완료"]]
        .map(([label, meta, description]) => ({ label, meta, description }));
      const items = vertical ? trail : wizard;
      return h("Stack", {}, [h(name, { items, current: settings.current, currentStatus: settings.currentStatus, orientation: settings.orientation, layout: settings.layout, selectable: settings.selectable, ariaLabel: vertical ? "배송 진행" : "주문 진행",
        onStepSelect: (index: number) => set("message", items[index].label + " 단계 선택") })]);
    }
    case "KjunImage":
      return h("Stack", {}, [h(name, { src: settings.imageState === "실패" ? "data:image/png;base64,invalid" : settings.imageState === "로딩" && !get("imageReady", false) ? undefined : sampleImage(get("imageVersion", 0)), alt: "산과 하늘을 표현한 프로젝트 표지", decorative: settings.decorative, aspectRatio: settings.autoRatio ? "auto" : settings.aspectRatio, fit: settings.fit, shape: settings.shape, onLoad: () => set("message", "이미지 로드 완료"), onError: () => set("message", "이미지 로드 실패") }, undefined, { fallback: settings.imageState === "로딩" && !get("imageReady", false) ? "이미지 주소를 준비합니다" : "이미지를 불러올 수 없습니다" }), settings.imageState === "로딩" && !get("imageReady", false) ? button("로컬 이미지 준비 · 2초", async () => { await new Promise(resolve => setTimeout(resolve, 2000)); set("imageReady", true); }) : null, button("이미지 주소 변경", () => set("imageVersion", get("imageVersion", 0) + 1))]);
    case "KjunAvatar":
      return h(name, { name: "김하늘", src: settings.imageState === "사진" ? sampleImage(0) : settings.imageState === "실패" ? "data:image/png;base64,invalid" : undefined, size: settings.size, shape: settings.shape, decorative: settings.decorative });
    case "KjunAvatarGroup": {
      // Each person's colour is the app's own; the soft tone roles keep it right in dark mode too.
      const many = settings.people === "128명", count = settings.people === "3명" ? 3 : 5;
      const tone = (role: string) => platform === "native" ? colors[role] : `var(--kjun-${role.replace(/[A-Z]/g, c => "-" + c.toLowerCase())})`;
      return h(name, { items: ["김하늘", "이서준", "박지우", "최민서", "정도윤"].slice(0, count).map((name, i) => ({ key: "p" + i, name, color: tone(["infoBg", "warningBg", "successBg", "dangerBg", "selectedBg"][i]) })), max: 3, total: many ? 128 : undefined, ariaLabel: `참여자 ${many ? 128 : count}명`,
        size: settings.size, shape: settings.shape, pressable: settings.pressable, disabled, ...action(() => set("message", "참여자 목록 열기")) });
    }
    case "KjunChip":
      return h("Group", {}, [get("removed", false) ? button("태그 복원", () => set("removed", false)) : h(name, { label: settings.long ? "팀에서 함께 사용하는 프로젝트 분류" : "프로젝트", icon: "folder", removable: settings.removable, disabled, size: settings.size, onRemove: () => set("removed", true) })]);
    case "KjunSlider": case "KjunRangeSlider": {
      // One builder for both: the controls add size, marks, valueLabel, vertical, units and the two-way or gap settings.
      const range = name === "KjunRangeSlider", twoWay = !range && settings.twoWay;
      const min = twoWay ? -50 : 0, max = twoWay ? 50 : settings.decimal ? 1 : 100, step = settings.decimal && !twoWay ? .1 : 1;
      const unit = settings.unit ? (value: number) => settings.decimal ? Math.round(value * 100) + "%" : range ? value + "만" : (twoWay && value > 0 ? "+" : "") + value + "%" : undefined;
      const marks = settings.marks === "없음" ? undefined : [0, .25, .5, .75, 1].map(f => { const value = Math.round((min + f * (max - min)) * 100) / 100;
        return settings.marks === "라벨" && f % .5 === 0 ? { value, label: unit ? unit(value) : String(value) } : { value }; });
      const common = { min, max, step, disabled, size: settings.size, marks, valueLabel: settings.valueLabel, orientation: settings.vertical ? "vertical" : undefined, formatValue: unit };
      return range
        ? h(name, { ...common, value: get("range", settings.decimal ? [.2, .8] : [20, 80]), label: settings.unit ? "가격" : "조회 범위", thumbLabels: ["시작 값", "끝 값"],
          minStepsBetweenThumbs: settings.minSteps || undefined, formatRange: settings.unit && !settings.decimal ? (start: number, end: number) => `${start}만~${end}만 원` : undefined,
          onValueChange: change("range"), onChangeCommit: (value: number[]) => set("message", "확정: " + value.join(" ~ ")) })
        : h(name, { ...common, value: get("slider", settings.decimal && !twoWay ? .5 : twoWay ? 20 : 40), label: twoWay ? "밝기 보정" : "알림 음량", fillOrigin: twoWay ? 0 : undefined,
          onValueChange: change("slider"), onChangeCommit: (value: number) => set("message", "확정: " + value) });
    }
    case "KjunTimePicker":
      return h("Box", { width: 360 }, h("KjunFormGroup", { label: "알림 시각", error: error ? "알림 시각을 선택해 주세요." : "" }, h(name, { value: get("time", null), precision: settings.precision, minuteStep: settings.minuteStep, secondStep: settings.secondStep, min: settings.bounded ? (settings.precision === "second" ? "09:30:15" : "09:30") : undefined, max: settings.bounded ? (settings.precision === "second" ? "18:30:45" : "18:30") : undefined, disabled, error, clearable: settings.clearable, size: settings.size, block: settings.block, hourCycle: settings.hourCycle === "12" ? 12 : undefined, layout: settings.layout, trigger: settings.trigger === "기본" ? undefined : settings.trigger, ariaLabel: "알림 시각", onValueChange: change("time"), onChangeCommit: (value: string | null) => set("message", "선택: " + value) })));
    case "KjunZoneGauge": {
      // Zone colours are the app's own: KJUN draws them as given.
      const color = (role: string) => platform === "native" ? colors[role] : `var(--kjun-${role})`;
      return h("Box", { width: 480 }, h(name, { label: "PER 백분위", value: settings.missing ? null : Number(settings.value), size: settings.size, zoneLabels: settings.zoneLabels,
        zones: [{ to: 30, label: "저평가", color: color("info") }, { to: 70, label: "중립" }, { to: 100, label: "고평가", color: color("warning") }] }));
    }
    case "KjunStackedBar": {
      const color = (role: string) => platform === "native" ? colors[role] : `var(--kjun-${role})`;
      const values = settings.data === "작은 조각" ? [990, 5, 5] : settings.data === "모두 0" ? [0, 0, 0] : [12, 6, 2];
      return h("Box", { width: 480 }, h(name, { label: "애널리스트 의견", size: settings.size, legend: settings.legend, valueText: settings.summary ? "20명 · 강세 우위" : undefined, items: settings.data === "없음" ? null
        : [{ key: "bull", label: "강세", value: values[0], color: color("danger") }, { key: "flat", label: "중립", value: values[1] }, { key: "bear", label: "약세", value: values[2], color: color("info") }] }));
    }
    case "KjunSplitPane": {
      const vertical = settings.direction === "vertical", px = settings.unit === "px", rail = !!settings.collapsible;
      const pane = (title: string, subtitle: string) => h("KjunCard", { title, subtitle });
      const start = px ? 240 : 0.6, split = get("split", start), collapsed = rail && !!get("collapsed", false);
      // A collapsed list leaves a 48px rail; the app draws it from the collapsed value.
      const first = collapsed ? h("KjunIcon", { name: "list", size: 20 }) : pane("메시지 목록", "첫 패널");
      return h("Stack", {}, [h("Box", { width: 560, height: vertical ? 320 : 180 }, h(name, { ariaLabel: "메시지 목록 크기", direction: settings.direction, sizeUnit: px ? "px" : undefined,
        size: split, onSizeChange: change("split"), defaultSize: start,
        minSize: settings.limits ? vertical ? [80, 80] : [160, 200] : undefined, disabled, onChangeCommit: (size: number) => set("message", "확정: " + size),
        ...(rail ? { collapsible: true, collapsedSize: 48, collapsed, onCollapsedChange: change("collapsed") } : {}) }, undefined,
        { first, second: pane("상세 내용", "둘째 패널") })),
        h("Text", {}, collapsed ? "첫 패널: 접힘" : px ? `첫 패널 폭: ${split}px` : `첫 패널 비율: ${Math.round(split * 100)}%`)]);
    }
    case "KjunColorPicker":
      return h("Box", { width: 360 }, h("KjunFormGroup", { label: "라벨 색", error: error ? "라벨 색을 선택해 주세요." : "" }, h(name, { value: get("color", settings.alpha ? "#3B82F6CC" : "#3B82F6"),
        swatches: settings.swatches ? ["#EF4444", "#F97316", "#EAB308", "#22C55E", "#14B8A6", "#3B82F6", "#8B5CF6", "#EC4899", "#64748B", "#111111"] : undefined, custom: settings.custom, alpha: settings.alpha, input: settings.input, clearable: settings.clearable, eyeDropper: settings.eyeDropper,
        recentColors: settings.recent ? get("recentColors", ["#0EA5E9", "#7C3AED"]) : undefined, onRecentColorsChange: settings.recent ? change("recentColors") : undefined,
        size: settings.size, inline: settings.layout === "inline" || undefined, variant: settings.layout === "swatch" || settings.layout === "tool" ? "swatch" : undefined, icon: settings.layout === "tool" ? "typography" : undefined, disabled, error, ariaLabel: "라벨 색", onValueChange: change("color") })));
    case "KjunFileUpload": {
      const sample = (settings.sample === "여러 상태" ? [
        { id: "receipt", name: "영수증_11월.pdf", size: 245760, status: "done" },
        { id: "photo", name: "매장_외관_사진_2026.jpg", size: 4404019, status: "uploading", progress: 64 },
        { id: "license", name: "사업자등록증.pdf", size: 1153434, status: "error", error: "서버가 응답하지 않아 올리지 못했어요. 잠시 뒤 다시 시도해 주세요." },
        { id: "clients", name: "거래처_목록.xlsx", size: 327680, status: "queued" },
      ] : settings.sample === "사진" ? [
        { id: "front", name: "매장_외관.jpg", size: 4404019, status: "done", previewUrl: sampleImage(0) },
        { id: "inside", name: "매장_내부.jpg", size: 3145728, status: "uploading", progress: 64, previewUrl: sampleImage(1) },
        { id: "menu", name: "메뉴판.jpg", size: 2202009, status: "error", previewUrl: sampleImage(0) },
      ] : []).slice(0, settings.multiple === false ? 1 : 4);
      const files = get("files", sample) as any[];
      const add = (accepted: { name: string; size: number; type?: string }[]) => accepted.map(file => ({ id: file.name + "-" + Date.now(), name: file.name, size: file.size, type: file.type, status: "done" }));
      return h("Box", { width: 360 }, h("KjunFormGroup", { label: "증빙 자료", error: error ? "증빙 자료를 첨부해 주세요." : "" }, h(name, { files, accept: ".pdf,image/*,.xlsx", maxSize: 20 * 1024 * 1024, maxFiles: 5,
        multiple: settings.multiple, disabled, size: settings.size, trigger: settings.trigger, layout: settings.layout,
        onSelect: (accepted: any[]) => set("files", settings.multiple === false ? add(accepted) : [...files, ...add(accepted)]),
        onRemove: (id: string) => set("files", files.filter(file => file.id !== id)),
        onRetry: (id: string) => set("files", files.map(file => file.id === id ? { ...file, status: "done" } : file)),
        onPick: async () => [{ name: "영수증_12월.pdf", size: 245760, type: "application/pdf" }] })));
    }
    case "KjunQuantityStepper":
      return h("Box", { width: 360 }, h("KjunFormGroup", { label: "주문 수량", error: error ? "주문 수량을 확인해 주세요." : "" }, h(name, { value: get("quantity", settings.decimal ? 1.25 : 2), min: settings.negative ? -10 : 0, max: 10, step: settings.decimal ? .1 : 1, precision: settings.decimal ? 2 : 0, disabled, error, size: settings.size, block: settings.block, ariaLabel: "주문 수량", onValueChange: change("quantity"), onChangeCommit: (value: number) => set("message", "확정: " + value), onInvalidInput: (draft: string) => set("message", "잘못된 수량: " + draft) })));
    case "KjunNumberInput": {
      // The wording follows the format; the value is a normalized string ("1250000", "12.5") the app owns. Ranges are checked on commit,
      // and the error text reads like the built-in range message.
      const format = settings.unit || settings.prefix ? "number" : settings.format;
      const spec = settings.unit ? { label: "몸무게", suffix: "kg", value: "62.5", min: 0, max: 300, error: "300kg 이하로 입력해 주세요" }
        : settings.prefix ? { label: "단가", prefix: "$", value: "1234.50", min: 0, max: 100000, error: "100,000 이하로 입력해 주세요" }
        : format === "amount" ? { label: "보낼 금액", suffix: "원", value: "1250000", min: 1000, error: "1,000원 이상 입력해 주세요" }
        : format === "percent" ? { label: "목표 수익률", value: "12.5", max: 100, error: "100% 이하로 입력해 주세요" }
        : { label: "참여 인원", suffix: "명", value: "12480", min: 1, max: 100000, error: "100,000명 이하로 입력해 주세요" };
      const places = settings.prefix ? 2 : settings.unit ? Math.max(1, Number(settings.decimals)) : Number(settings.decimals) > 0 ? Number(settings.decimals) : undefined;
      return h("Box", { width: 360 }, h("KjunFormGroup", { label: spec.label, error: error ? spec.error : "" }, h(name, { value: get("amount", spec.value), format, decimals: places,
        prefix: spec.prefix, suffix: spec.suffix, min: spec.min, max: spec.max, readingAid: settings.readingAid, align: settings.align, size: settings.size, disabled, error, ariaLabel: spec.label, onValueChange: change("amount"), onChangeCommit: (value: string) => set("message", "확정: " + (value || "빈 값")) })));
    }
  }
}

// Spaces and a menu panel: a collapsed side navigation with names picks the space, a compact one lists that space's pages.
// Choosing a space opens its first page; both values are the app's.
const sidePages: Record<string, any[]> = {
  home: [{ key: "overview", label: "개요", href: "#overview", icon: "chart-bar" }, { key: "requests", label: "받은 요청", href: "#requests", icon: "bell", badge: 4 }],
  projects: [{ key: "board", label: "보드", href: "#board", icon: "clipboard-list" },
    { title: "즐겨찾기", items: [{ key: "brand", label: "브랜드 웹사이트", href: "#brand", icon: "world", badge: 8 }, { key: "checkout", label: "결제 화면 개선", href: "#checkout", icon: "currency-won" }] },
    { title: "보관", items: [{ key: "archive", label: "보관함", href: "#archive", icon: "box" }] }],
  team: [{ key: "members", label: "구성원", href: "#members", icon: "user" }, { key: "invites", label: "초대", href: "#invites", icon: "mail", badge: true }],
  settings: [{ key: "profile", label: "프로필", href: "#profile", icon: "user" }, { key: "billing", label: "결제", href: "#billing", icon: "wallet" }],
};
function sideNavigationSpaces({ h, get, set }: ExampleTools) {
  const space = get("space", "projects"), destination = get("destination", "board");
  return h("Stack", {}, [h("Group", { style: { alignItems: "flex-start", flexWrap: "nowrap" } }, [
    h("Box", { width: 72 }, h("KjunSideNavigation", { ariaLabel: "공간", value: space, collapsed: true, railLabels: true, items: [
      { key: "home", label: "홈", href: "#home", icon: "home" }, { key: "projects", label: "프로젝트", href: "#projects", icon: "folder" },
      { key: "team", label: "팀", href: "#team", icon: "building", badge: true }, { key: "settings", label: "설정", href: "#settings", icon: "settings" },
    ], onNavigate: (key: string, event: any) => { event.preventDefault?.(); set("space", key); set("destination", sidePages[key][0].key); } })),
    h("Box", { width: 240 }, h("KjunSideNavigation", { ariaLabel: "메뉴", value: destination, density: "compact", items: sidePages[space],
      onNavigate: (key: string, event: any) => { event.preventDefault?.(); set("destination", key); } })),
  ]), h("Text", {}, "현재 위치: " + space + " / " + destination)]);
}
