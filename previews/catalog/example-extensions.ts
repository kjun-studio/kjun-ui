import { sampleImage, type ExampleTools } from "./example-tools";
export function renderExtensionExample(name: string, tools: ExampleTools): any {
  const { h, get, set, change, action, button, settings, disabled, error, platform } = tools;
  switch (name) {
    case "DsListRow":
    case "DsListSection":
      return h("DsListSection", { title: "설정", description: "계정과 알림을 관리합니다." }, [
        h("DsListRow", { title: settings.long ? "모든 기기에서 사용할 프로필과 계정 표시 이름" : "프로필 설정", description: "이름과 사진을 변경합니다.", disabled, ...action(() => set("message", "프로필 설정 열기")) }, undefined, { leading: h("DsAvatar", { name: "김하늘", size: "sm" }), actions: h("DsButton", { variant: "ghost", size: "sm", ...action(() => set("message", "프로필 공유")) }, "공유") }),
        h("DsListRow", { title: "알림 받기", description: "중요한 변경 사항을 알려드립니다." }, undefined, { actions: h("DsSwitch", { value: get("notifications", true), onValueChange: change("notifications"), ariaLabel: "알림 받기" }) }),
      ]);
    case "DsTopNavigation": {
      const leadingText = settings.leading === "긴 문구" ? "프로젝트 목록으로 돌아가기" : "";
      const save = (text: string) => h("DsButton", { variant: "ghost", size: "sm", disabled, loading: settings.loading, ...action(() => set("message", text + " 요청")) }, text);
      const actions = settings.actions === "없음" ? undefined : settings.actions === "아이콘 조합" ? [
        h("DsRefreshButton", { disabled, loading: settings.loading, onRefresh: () => set("message", "새로고침 요청") }),
        h("DsMenuButton", { compact: true, variant: "ghost", ariaLabel: "더 보기", disabled, loading: settings.loading }, h("DsDropdownItem", { ...action(() => set("message", "세부 정보 요청")) }, "세부 정보")),
        h("DsIconToggle", { activeIcon: "heart", active: get("favorite", false), ariaLabel: "즐겨찾기", disabled, loading: settings.loading, onToggle: () => { set("favorite", !get("favorite", false)); set("message", "즐겨찾기 변경"); } }),
      ] : settings.actions === "여러 행동" ? [save("저장"), save("공유"), save("설정")] : save(settings.actions === "긴 문구" ? "Save changes and continue" : "저장");
      return h("Box", { width: Number(settings.exampleWidth) }, h(name, { title: settings.long ? "팀과 함께 관리하는 프로젝트의 상세 설정" : "프로젝트 설정", description: settings.showDescription ? "변경할 내용을 선택하세요." : undefined, safeAreaTop: settings.safeAreaTop }, undefined, {
        leading: settings.leading === "없음" ? undefined : h("DsButton", { variant: "ghost", size: "sm", ariaLabel: leadingText || "뒤로 가기", prefixIcon: "arrow-left", disabled, ...action(() => set("message", "뒤로 가기 요청")) }, leadingText || undefined), actions,
      }));
    }
    case "DsBottomNavigation":
      return h("Stack", {}, [h(name, { value: get("destination", "home"), items: [{ key: "home", label: "홈", href: "#home", icon: "home" }, { key: "activity", label: settings.long ? "모든 프로젝트 활동 내역" : "활동", href: "#activity", icon: "list", badge: 3 }, { key: "settings", label: "설정", href: "#settings", icon: "settings" }], safeAreaBottom: settings.safeAreaBottom, keyboardVisible: settings.keyboardVisible, hideOnKeyboard: settings.hideOnKeyboard, onNavigate: (key: string, event: any) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button > 0) return; event.preventDefault(); set("destination", key); } }), h("Text", {}, "현재 위치: " + get("destination", "home"))]);
    case "DsBottomActionBar":
      return h(name, { description: settings.long ? "변경한 설정은 저장한 뒤 모든 기기에 적용됩니다. 저장이 완료될 때까지 화면을 유지해 주세요." : "저장하면 모든 기기에 적용됩니다.", safeAreaBottom: settings.safeAreaBottom, keyboardVisible: settings.keyboardVisible, hideOnKeyboard: settings.hideOnKeyboard }, h("DsFormActions", { confirmText: "변경 사항 저장", onConfirm: () => set("message", "저장 요청"), onCancel: () => set("message", "취소 요청") }));
    case "DsImage":
      return h("Stack", {}, [h(name, { src: settings.imageState === "실패" ? "data:image/png;base64,invalid" : settings.imageState === "로딩" && !get("imageReady", false) ? undefined : sampleImage(get("imageVersion", 0)), alt: "산과 하늘을 표현한 프로젝트 표지", decorative: settings.decorative, aspectRatio: settings.aspectRatio, fit: settings.fit, onLoad: () => set("message", "이미지 로드 완료"), onError: () => set("message", "이미지 로드 실패") }, undefined, { fallback: settings.imageState === "로딩" && !get("imageReady", false) ? "이미지 주소를 준비합니다" : "이미지를 불러올 수 없습니다" }), settings.imageState === "로딩" && !get("imageReady", false) ? button("로컬 이미지 준비 · 2초", async () => { await new Promise(resolve => setTimeout(resolve, 2000)); set("imageReady", true); }) : null, button("이미지 주소 변경", () => set("imageVersion", get("imageVersion", 0) + 1))]);
    case "DsAvatar":
      return h(name, { name: "김하늘", src: settings.imageState === "사진" ? sampleImage(0) : settings.imageState === "실패" ? "data:image/png;base64,invalid" : undefined, size: settings.size, shape: settings.shape, decorative: settings.decorative });
    case "DsChip":
      return h("Group", {}, [get("removed", false) ? button("태그 복원", () => set("removed", false)) : h(name, { label: settings.long ? "팀에서 함께 사용하는 프로젝트 분류" : "프로젝트", icon: "folder", removable: settings.removable, disabled, size: settings.size, onRemove: () => set("removed", true) })]);
    case "DsSlider":
      return h(name, { value: get("slider", settings.decimal ? .5 : 40), min: 0, max: settings.decimal ? 1 : 100, step: settings.decimal ? .1 : 1, disabled, label: "알림 음량", onValueChange: change("slider"), onChangeCommit: (value: number) => set("message", "확정: " + value) });
    case "DsRangeSlider":
      return h(name, { value: get("range", settings.decimal ? [.2, .8] : [20, 80]), min: 0, max: settings.decimal ? 1 : 100, step: settings.decimal ? .1 : 1, disabled, label: "조회 범위", thumbLabels: ["시작 값", "끝 값"], onValueChange: change("range"), onChangeCommit: (value: number[]) => set("message", "확정: " + value.join(" ~ ")) });
    case "DsTimePicker":
      return h("Box", { width: 360 }, h("DsFormGroup", { label: "알림 시각", error: error ? "알림 시각을 선택해 주세요." : "" }, h(name, { value: get("time", null), precision: settings.precision, minuteStep: settings.minuteStep, secondStep: settings.secondStep, min: settings.bounded ? (settings.precision === "second" ? "09:30:15" : "09:30") : undefined, max: settings.bounded ? (settings.precision === "second" ? "18:30:45" : "18:30") : undefined, disabled, error, clearable: settings.clearable, size: settings.size, ariaLabel: "알림 시각", onValueChange: change("time"), onChangeCommit: (value: string | null) => set("message", "선택: " + value) })));
    case "DsQuantityStepper":
      return h("Box", { width: 360 }, h("DsFormGroup", { label: "주문 수량", error: error ? "주문 수량을 확인해 주세요." : "" }, h(name, { value: get("quantity", settings.decimal ? 1.25 : 2), min: settings.negative ? -10 : 0, max: 10, step: settings.decimal ? .1 : 1, precision: settings.decimal ? 2 : 0, disabled, error, size: settings.size, block: settings.block, ariaLabel: "주문 수량", onValueChange: change("quantity"), onChangeCommit: (value: number) => set("message", "확정: " + value), onInvalidInput: (draft: string) => set("message", "잘못된 수량: " + draft) })));
  }
}
