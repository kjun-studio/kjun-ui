import { sampleImage, type ExampleTools } from "./example-tools";
export function renderRecipeExample(name: string, tools: ExampleTools): any {
  const { h, get, set, change, action, button, settings, platform } = tools;
  switch (name) {
    case "GuideGenericLists":
      return h("KjunListSection", { title: "활동과 알림", description: "이동, 공유, 선택은 각각 다른 행동입니다." }, [
        h("KjunListRow", { title: settings.content === "긴 콘텐츠" ? "김하늘 님이 모든 팀원이 확인할 수 있는 새 프로젝트 문서를 추가했습니다" : "김하늘 님이 문서를 추가했습니다", description: "오늘 오전 9:30 · 프로젝트 활동", ...action(() => set("message", "활동 상세 열기")) }, undefined, { leading: h("KjunAvatar", { name: "김하늘", size: "sm" }), trailing: h("KjunBadge", {}, "새 소식"), actions: h("KjunButton", { variant: "ghost", size: "sm", ...action(() => set("message", "활동 공유")) }, "공유") }),
        h("KjunListRow", { title: "프로젝트 알림 받기", description: "새로운 활동을 알려드립니다." }, undefined, { actions: h("KjunSwitch", { value: get("notify", true), onValueChange: change("notify"), ariaLabel: "프로젝트 알림 받기" }) }),
        h("KjunListRow", { title: "검토할 항목", description: "선택 여부는 체크박스가 관리합니다." }, undefined, { actions: h("KjunCheckbox", { value: get("checked", false), onValueChange: change("checked"), ariaLabel: "검토할 항목 선택" }) }),
      ]);
    case "GuideAppScreen": {
      const keyboard = get("keyboard", settings.keyboardVisible), current = get("destination", "home");
      return h("Stack", {}, [h("KjunButton", { variant: "secondary", ...action(() => set("keyboard", !keyboard)) }, "키보드 상태 전환"), h("Text", {}, "문서에서는 키보드 상태를 수동으로 재현합니다. 실제 화면에서는 앱의 키보드 높이와 안전 영역 값을 사용하세요."), h("Screen", { height: keyboard ? 400 : 520 }, [
        h("KjunTopNavigation", { title: settings.content === "긴 콘텐츠" ? "팀과 함께 관리하는 프로젝트의 상세 설정과 활동" : "프로젝트", safeAreaTop: settings.safeAreaTop }, undefined, { leading: h("KjunButton", { variant: "ghost", size: "sm", ariaLabel: "뒤로 가기", prefixIcon: "arrow-left", ...action(() => set("message", "뒤로 가기 요청")) }) }),
        h("Scroll", {}, [h("Inset", {}, h("KjunFormGroup", { label: "프로젝트 이름", hint: "입력에 초점을 두면 앱에서 키보드 상태를 전달합니다." }, h("KjunInput", { value: get("project", "함께 만드는 프로젝트"), onValueChange: change("project"), ariaLabel: "프로젝트 이름", onFocus: () => set("keyboard", true) }))), h("KjunListSection", {}, Array.from({ length: 8 }, (_, index) => h("KjunListRow", { title: "활동 " + (index + 1), description: settings.content === "긴 콘텐츠" ? "여러 줄로 표시되는 긴 한국어 설명도 하단 영역 뒤로 가려지지 않습니다." : "본문만 스크롤합니다." }))), h("Inset", {}, h("Text", {}, "마지막 콘텐츠"))]),
        h("KjunBottomActionBar", { description: "변경한 내용을 확인한 뒤 저장하세요.", keyboardVisible: keyboard, safeAreaBottom: keyboard ? settings.safeAreaBottom : 0 }, h("KjunButton", { ...action(() => set("message", "변경 사항 저장")) }, "변경 사항 저장")),
        h("KjunBottomNavigation", { value: current, keyboardVisible: keyboard, safeAreaBottom: settings.safeAreaBottom, items: [{ key: "home", label: "홈", href: "#home", icon: "home" }, { key: "activity", label: "활동", href: "#activity", icon: "list" }, { key: "settings", label: "설정", href: "#settings", icon: "settings" }], onNavigate: (key: string, event: any) => { event.preventDefault(); set("destination", key); } }),
      ])]);
    }
    case "GuideInputSettings":
      return h("Stack", {}, [
        h("KjunFormGroup", { label: "알림 시각", hint: "초 단위까지 선택합니다." }, h("KjunTimePicker", { value: get("time", "09:30:00"), precision: "second", ariaLabel: "알림 시각", onValueChange: change("time") })),
        h("KjunFormGroup", { label: "요청 수량", hint: "0.1씩 증감하고 소수 두 자리까지 직접 입력합니다." }, h("KjunQuantityStepper", { value: get("quantity", 1.25), min: 0, max: 10, step: .1, precision: 2, ariaLabel: "요청 수량", onValueChange: change("quantity") })),
        h("KjunRangeSlider", { label: "알림 범위", value: get("range", [20, 80]), onValueChange: change("range") }),
        h("Group", {}, ["개인", "팀"].filter(tag => !get("removedTags", []).includes(tag)).map(tag => h("KjunChip", { label: settings.content === "긴 콘텐츠" ? tag + " 프로젝트의 모든 알림 분류" : tag, removable: true, onRemove: () => set("removedTags", [...get("removedTags", []), tag]) }))),
        button("분류 초기화", () => set("removedTags", [])),
      ]);
    case "GuideBottomSheet":
      return h("Stack", {}, [button("하단 패널 열기", () => set("open", true)), h("KjunDrawer", { open: get("open", false), onOpenChange: change("open"), position: "bottom", title: "알림 설정" }, h("Stack", {}, [h("Text", {}, "기존 Drawer의 하단 배치입니다. 드래그·스냅 제스처는 제공하지 않습니다."), h("KjunSwitch", { value: get("notify", true), onValueChange: change("notify"), label: "활동 알림 받기" })]), { footer: h("KjunButton", { ...action(() => set("open", false)) }, "설정 완료") })]);
    case "GuideThumbnail":
      return h("KjunListSection", { title: "프로젝트 자료" }, [h("KjunListRow", { title: settings.content === "긴 콘텐츠" ? "프로젝트에서 함께 검토하는 이미지와 설명 자료" : "프로젝트 표지", description: "Image를 목록 앞 영역에 배치한 Thumbnail 레시피입니다." }, undefined, { leading: h("Box", { width: 72 }, h("KjunImage", { src: sampleImage(0), alt: "산과 하늘 표지", aspectRatio: 4 / 3 })) })]);
    case "GuideSegmentedSelection":
      return h("Stack", {}, [h("KjunButtonGroup", { value: get("period", "week"), ariaLabel: "조회 기간", fullWidth: true, options: [{ value: "day", label: "일" }, { value: "week", label: "주" }, { value: "month", label: "월" }], onValueChange: change("period") }), h("Text", {}, "선택한 조회 단위: " + get("period", "week")), h("Text", {}, "ButtonGroup은 하나의 값을 선택합니다. 콘텐츠 패널 전환은 Tabs, 여러 필터는 FilterGroup을 사용하세요.")]);
  }
}
