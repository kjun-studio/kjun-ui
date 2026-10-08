import type { ExampleTools } from "./example-tools";

export function renderFoundationExample(name: string, tools: ExampleTools): any {
  const { h, get, set, change, action, button, settings, feedback, platform } = tools;
  switch (name) {
    case "GuideScreenLayout": {
      const main = h("DsCard", { title: settings.reading ? "프로젝트 설정" : "프로젝트 활동", padding: "lg", border: true }, h("Stack", {}, [
        h("Text", {}, settings.long ? "여러 팀원이 함께 검토하는 프로젝트의 활동과 변경 사항을 확인합니다. 화면이 좁아져도 본문을 먼저 읽고 보조 정보를 이어서 확인합니다." : "본문이 먼저 나오고 보조 정보가 뒤따릅니다."),
        h("DsFormGroup", { label: "프로젝트 이름", hint: "배치가 바뀌어도 입력한 내용과 읽기 순서를 유지합니다." }, h("DsInput", { value: get("project", "함께 만드는 프로젝트"), onValueChange: change("project"), ariaLabel: "프로젝트 이름" })),
        h("DsButton", { size: "lg", block: true, ...action(() => set("message", "프로젝트 설정 저장")) }, "변경 사항 저장"),
      ]));
      const aside = h("DsCard", { title: "보조 정보", padding: "lg", border: true }, h("Stack", {}, [
        h("Text", {}, settings.long ? "변경 내역, 담당자, 관련 자료처럼 본문을 보완하는 정보를 배치합니다. 필수 입력은 본문과 함께 둡니다." : "담당자 김하늘 · 최근 수정 오늘"),
        h("DsButton", { variant: "secondary", block: true, ...action(() => set("message", "변경 기록 열기")) }, "변경 기록"),
      ]));
      return h("FoundationLayout", { reading: settings.reading }, settings.reading ? [main] : [main, aside]);
    }
    case "GuideScrollCTA":
    case "GuideLayerStack": {
      const layers = name === "GuideLayerStack";
      const keyboard = layers ? false : get("keyboard", settings.keyboardVisible);
      const long = get("long", settings.long);
      const header = h("DsTopNavigation", { title: "프로젝트 설정", safeAreaTop: 24 });
      const dock = [
        h("DsBottomActionBar", { description: long ? "팀원이 함께 사용하는 프로젝트입니다. 변경 내용을 충분히 검토한 뒤 저장해 주세요. 저장한 설정은 다음 활동부터 적용됩니다." : "변경한 내용을 확인한 뒤 저장하세요.", safeAreaBottom: keyboard ? settings.safeAreaBottom : 0, keyboardVisible: keyboard },
          h("DsButton", { size: "lg", block: true, ...action(() => layers ? set("open", true) : set("message", "변경 사항 저장")) }, layers ? "변경 내용 확인" : "변경 사항 저장")),
        h("DsBottomNavigation", { value: get("destination", "home"), safeAreaBottom: settings.safeAreaBottom, keyboardVisible: keyboard,
          items: [{ key: "home", label: "홈", href: "#home", icon: "home" }, { key: "activity", label: "활동", href: "#activity", icon: "list" }],
          onNavigate: (key: string, event: any) => { event.preventDefault(); set("destination", key); },
        }),
      ];
      const content = h("Stack", {}, [
        h("Inset", {}, h("DsFormGroup", { label: "프로젝트 이름" }, h("DsInput", { value: get("project", "함께 만드는 프로젝트"), onValueChange: change("project"), ariaLabel: "프로젝트 이름" }))),
        h("DsListSection", {}, Array.from({ length: 10 }, (_, index) => h("DsListRow", { title: "활동 " + (index + 1), description: long ? "길어진 한국어 설명과 여러 줄의 본문도 마지막까지 스크롤해서 확인할 수 있습니다." : "본문만 스크롤하는 영역입니다." }))),
        h("Inset", {}, h("Text", {}, "마지막 콘텐츠")),
      ]);
      return h("Stack", {}, [
        ...(!layers ? [h("Group", {}, [
          // Demo controls stay secondary so the screen's own CTA remains the only primary action.
          h("DsButton", { variant: "secondary", ...action(() => set("long", !long)) }, long ? "짧은 CTA 문구" : "긴 CTA 문구"),
          h("DsButton", { variant: "secondary", ...action(() => set("keyboard", !keyboard)) }, keyboard ? "키보드 상태 해제" : "키보드 상태 적용"),
        ])] : []),
        ...(layers ? [
          h("Group", {}, [
            h("DsPopover", { ariaLabel: "화면 팝업", open: get("pagePopup", false), onOpenChange: change("pagePopup") },
              button("새 모달 열기", () => set("childOpen", true)), { trigger: button("팝업 메뉴", () => {}) }),
            h("DsButton", { variant: "secondary", ...action(() => set("drawerOpen", true)) }, "Drawer 열기"),
          ]),
          h("DsDrawer", { open: get("drawerOpen", false), onOpenChange: change("drawerOpen"), title: "떠 있는 패널" }, h("Text", {}, "같은 floating 원형의 방향만 바꿉니다.")),
          // The new window must survive closing its launching popup.
          h("DsModal", { open: get("childOpen", false), onOpenChange: change("childOpen"), title: "팝업에서 연 새 모달" },
            h("Stack", {}, [
              h("Text", {}, "이전 팝업은 닫히고 이 창만 조작할 수 있습니다. 닫기 버튼이나 Escape로 닫으면 이 창을 열었던 팝업 버튼으로 포커스가 돌아갑니다."),
              button("알림 표시", () => feedback.toast.info("활성 창의 알림", { duration: 6000 })),
            ])),
        ] : []),
        h("FoundationScreen", { overlay: settings.overlay, height: keyboard ? 400 : 520 }, content, { header, dock }),
        ...(layers ? [h("DsModal", { open: get("open", false), onOpenChange: change("open"), title: "변경 내용 확인", height: platform === "vue2" ? "440px" : 440 }, h("Stack", {}, [
          h("Text", {}, "배경의 하단 CTA는 이 창을 닫은 뒤 다시 사용할 수 있습니다."),
          h("DsPopover", { ariaLabel: "모달 팝업", open: get("modalPopup", false), onOpenChange: change("modalPopup") },
            button("새 모달 열기", () => set("childOpen", true)), { trigger: button("모달 안 팝업", () => {}) }),
          button("Toast 표시", () => feedback.toast.success("변경 내용을 확인했습니다", { duration: 0, action: { label: "기록 보기", onClick: () => set("message", "알림의 기록 보기 실행") } })),
          ...Array.from({ length: settings.long ? 16 : 6 }, (_, index) => h("Text", {}, "검토 항목 " + (index + 1) + " · 모달 본문만 스크롤합니다.")),
          h("Text", {}, "모달 마지막 콘텐츠"),
        ]), { footer: h("DsButton", { size: "lg", ...action(() => set("open", false)) }, "검토 완료") })] : []),
      ]);
    }
  }
}
