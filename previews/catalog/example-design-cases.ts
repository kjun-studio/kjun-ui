import type { ExampleTools } from "./example-tools";

export function renderDesignExample(name: string, tools: ExampleTools): any {
  const { h, get, set, change, action, settings, platform } = tools;
  switch (name) {
    case "GuideActionPlacement": {
      const save = () => set("message", "변경 사항을 저장했습니다."),
        cancel = () => { set("project", "함께 만드는 프로젝트"); set("message", "편집을 취소했습니다."); };
      return h("Stack", {}, [
        h("Text", {}, "프로젝트 설정"),
        h("DsFormGroup", { id: "design-project", label: "프로젝트 이름", hint: "팀이 알아볼 수 있는 이름을 사용하세요." },
          h("DsInput", { id: "design-project", value: get("project", "함께 만드는 프로젝트"), onValueChange: change("project") })),
        h("CasePart", { id: "actions" }, settings.arrangement === "before"
          ? h("Group", {}, [h("DsButton", { size: "lg", ...action(save) }, "변경 사항 저장"), h("DsButton", { size: "lg", ...action(cancel) }, "취소")])
          : h("DsFormActions", { confirmText: "변경 사항 저장", cancelText: "취소", onConfirm: save, onCancel: cancel })),
      ]);
    }
    case "GuideLongFields": {
      const invalid = get("invalid", false);
      const first = h("DsFormGroup", {
        id: "design-team-name", label: "프로젝트에 참여하는 모든 팀원에게 표시할 이름", required: true,
        hint: "다른 프로젝트와 구분할 수 있도록 팀 이름과 작업 목적을 함께 입력해 주세요.",
        error: invalid ? "팀원이 알아볼 수 있는 프로젝트 이름을 입력해 주세요." : "",
      }, h("DsInput", { id: "design-team-name", value: get("project", ""), onValueChange: change("project"), error: invalid, placeholder: "예: 디자인팀 문서 정리" }));
      const second = h("DsFormGroup", {
        id: "design-team-note", label: "새로운 팀원에게 전달할 프로젝트 안내 문구",
        hint: "프로젝트의 목표와 함께 확인해야 할 자료를 간단히 설명해 주세요.",
      }, h("DsInput", { id: "design-team-note", value: get("note", ""), onValueChange: change("note"), placeholder: "예: 매주 월요일 문서 검토" }));
      return h("Stack", {}, [
        h("Text", {}, "팀과 공유할 정보"),
        h("CasePart", { id: "fields" }, h("CaseColumns", { columns: settings.arrangement === "before" ? 2 : 1 }, [
          h("CaseCell", {}, h("CasePart", { id: "first-field" }, first)), h("CaseCell", {}, second),
        ])),
        h("DsFormActions", { confirmText: "변경 사항 저장", showCancel: false, onConfirm: () => {
          const empty = !get("project", "").trim(); set("invalid", empty);
          set("message", empty ? "입력 내용을 확인해 주세요." : "변경 사항을 저장했습니다.");
        } }),
      ]);
    }
    case "GuideLongButton": {
      const before = settings.arrangement === "before";
      return h("Stack", {}, [
        h("Text", {}, "변경 사항 적용"),
        h("CasePart", { id: "button-context" }, before
          ? h("Text", {}, "변경한 내용을 확인해 주세요.")
          : h("Text", {}, "모든 팀원에게 적용됩니다. 저장 후 설정 화면으로 돌아갑니다.")),
        h("CasePart", { id: "button-action", scroll: true }, h("DsButton", {
          size: "lg", ...action(() => set("message", "모든 팀원에게 적용하고 설정 화면으로 돌아갔습니다.")),
        }, before ? "모든 팀원에게 적용할 변경 사항을 저장하고 설정 화면으로 돌아가기" : "변경 사항 저장")),
      ]);
    }
    case "GuideRowActions": {
      const after = settings.arrangement === "after", documents = ["프로젝트 계획", "회의 기록"];
      const share = (title: string, index: number) => h("CasePart", { id: index === 0 ? "row-share" : "second-share", inline: true },
        h("DsButton", { variant: "ghost", size: "sm", ariaLabel: title + " 공유", ...action(() => set("message", title + " 공유 안내")) }, "공유"));
      return h("Stack", {}, [
        h("CasePart", { id: "rows" }, h("DsListSection", { title: "프로젝트 문서", description: "제목을 누르면 상세 내용을 엽니다." }, documents.map((title, index) =>
          h("DsListRow", { title, description: index === 0 ? "이번 주 목표와 담당자" : "팀이 함께 결정한 내용", ...action(() => set("message", title + " 상세 열기")) }, undefined, {
            trailing: h("DsIcon", { name: "chevron-right", size: 16 }), ...(after ? { actions: share(title, index) } : {}),
          })))),
        ...(!after ? [h("Group", {}, documents.map(share))] : []),
      ]);
    }
    case "GuideFieldErrors": {
      const after = settings.arrangement === "after", invalid = get("invalid", true);
      const error = "@ 뒤에 도메인을 입력해 주세요. 예: team@example.com";
      return h("Stack", {}, [
        h("Text", {}, "프로젝트 알림 설정"),
        ...(!after && invalid ? [h("CasePart", { id: "field-error" }, h("DsAlert", { type: "danger" }, "입력 오류"))] : []),
        h("CasePart", { id: after ? "field-error" : "field-group" }, h("DsFormGroup", {
          id: "design-email", label: "알림 이메일", hint: "프로젝트 변경 소식을 받을 주소입니다.",
          error: after && invalid ? error : "",
        }, h("CasePart", { id: "email-input" }, h("DsInput", {
          id: "design-email", ariaLabel: "알림 이메일", value: get("email", "team@"),
          error: after && invalid, onValueChange: change("email"),
        })))),
        h("DsButton", { ...action(() => {
          const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(get("email", "team@"));
          set("invalid", !valid); set("message", valid ? "알림 이메일을 저장했습니다." : "이메일을 수정한 뒤 다시 저장해 주세요.");
        }) }, "이메일 저장"),
      ]);
    }
    case "GuideDeleteConfirmation": {
      const after = settings.arrangement === "after", deleted = get("deleted", false);
      return h("Stack", {}, [
        h("Text", {}, "프로젝트 문서 · 로컬 삭제 예제"),
        deleted ? h("DsEmpty", { text: "문서를 삭제했습니다", description: "이 예제의 항목만 제거했습니다." })
          : h("DsListSection", {}, h("DsListRow", { title: "프로젝트 계획", description: "이번 주 목표와 담당자" })),
        h("DsButton", { variant: "secondary", ...action(() => { set("deleted", false); set("open", true); set("message", ""); }) }, deleted ? "문서 복원 후 삭제 확인" : "삭제 확인 열기"),
        h("DsModal", {
          open: get("open", false), onOpenChange: change("open"), size: "sm", showFooter: true,
          title: after ? "‘프로젝트 계획’을 삭제할까요?" : "작업 확인", cancelText: "취소",
          confirmText: after ? "문서 삭제" : "확인", confirmVariant: after ? "danger" : "primary",
          onCancel: () => { set("open", false); set("message", "삭제를 취소했습니다. 문서를 유지합니다."); },
          onConfirm: () => { set("deleted", true); set("open", false); set("message", "예제의 문서만 삭제했습니다."); },
        }, h("CasePart", { id: "delete-context" }, h("Text", {}, after
          ? "‘프로젝트 계획’ 문서가 삭제되며 복구할 수 없습니다. 계속하려면 문서 삭제를 선택하세요."
          : "계속 진행할까요?"))),
      ]);
    }
    case "GuideRefreshContext": {
      const after = settings.arrangement === "after", phase = get("phase", "refreshing");
      const start = () => { set("phase", "refreshing"); set("message", ""); };
      return h("Stack", {}, [
        h("Text", {}, "같은 조건의 문서 갱신 · 수동 시뮬레이션"),
        h("CasePart", { id: "refresh-controls" }, h("Group", {}, [
          h("DsRefreshButton", { targetName: "문서 목록", mode: "text", text: "갱신 시작", loading: phase === "refreshing", onRefresh: start }),
          h("DsButton", { variant: "secondary", size: "sm", ...action(() => { set("phase", "complete"); set("message", "목록을 갱신했습니다."); }) }, "갱신 완료"),
          h("DsButton", { variant: "secondary", size: "sm", ...action(() => { set("phase", "failed"); set("message", ""); }) }, "갱신 실패"),
        ])),
        h("CasePart", { id: "refresh-content" }, h("DsDataState", {
          queryKey: after ? "documents" : null, resultKey: after ? "documents" : null,
          loading: phase === "refreshing", error: phase === "failed" ? "갱신하지 못했습니다" : null,
          refreshingText: "문서 갱신 중", loadingText: "문서 갱신 중", size: "sm", retryText: "갱신 재시도", onRetry: start,
        }, h("DsListSection", { title: "프로젝트 문서", description: "전체 문서 · 마지막 성공 결과 2개" }, [
          h("DsListRow", { title: "프로젝트 계획", description: "이번 주 목표와 담당자" }, undefined, {
            actions: h("DsCheckbox", { value: get("selected", true), label: "선택", ariaLabel: "프로젝트 계획 선택", onValueChange: change("selected") }),
          }),
          h("DsListRow", { title: "회의 기록", description: "팀이 함께 결정한 내용" }),
        ]))),
      ]);
    }
    case "GuideEmptyVsError": {
      const after = settings.arrangement === "after", reset = get("filterReset", false), retried = get("retried", false);
      const retry = () => set("retried", true);
      const failure = h("DsAlert", { type: "danger", title: "문서를 불러오지 못했습니다" }, "연결 상태를 확인한 뒤 다시 시도해 주세요.",
        { actions: h("DsButton", { variant: "secondary", ...action(retry) }, "조회 재시도") });
      return h("Stack", {}, [
        h("CasePart", { id: "empty-result" }, h("Stack", {}, [
          h("Text", {}, reset ? "1. 조회 성공 · 전체 문서" : "1. 조회 성공 · 완료된 문서 필터"),
          reset ? h("DsListRow", { title: "프로젝트 계획", description: "진행 중 · 전체 문서에서 표시" }) : h("DsEmpty", {
            text: after ? "완료된 문서가 없습니다" : "데이터 없음",
            description: after ? "필터를 초기화하면 전체 문서를 볼 수 있습니다." : "",
          }, after ? h("DsButton", { variant: "secondary", size: "sm", ...action(() => set("filterReset", true)) }, "필터 초기화") : undefined),
        ])),
        h("CasePart", { id: "failed-result" }, h("Stack", {}, [
          h("Text", {}, "2. 문서 조회 요청"),
          !after ? h("DsEmpty", { text: "데이터 없음" }) : h("DsDataState", {
            error: retried ? null : "연결 실패", size: "sm", onRetry: retry,
          }, h("DsListRow", { title: "회의 기록", description: "재시도 완료 · 로컬 성공 결과" }), platform === "vue2" ? { error: failure } : { errorContent: failure }),
        ])),
      ]);
    }
    case "GuideBottomCtaLayout": {
      const after = settings.arrangement === "after";
      return h("Stack", {}, [
        h("Text", {}, "검토 목록 · 마지막 항목까지 스크롤해 보세요"),
        h("CaseScreen", {}, h("CaseViewport", {}, [
          h("CaseScroll", {}, [
            ...Array.from({ length: 7 }, (_, i) => h("DsListRow", { title: "검토 항목 " + (i + 1), description: "공유 전 내용을 확인해 주세요." })),
            h("CasePart", { id: "last-content" }, h("DsListRow", { title: "마지막 검토 항목", description: "이 문장까지 읽은 뒤 저장하세요." })),
          ]),
          h("CaseFooter", { overlay: !after }, [
            h("DsBottomActionBar", { safeAreaBottom: 0 }, h("DsButton", { ...action(() => set("message", "검토 내용을 저장했습니다.")) }, "검토 내용 저장")),
            h("DsBottomNavigation", {
              value: get("destination", "documents"), safeAreaBottom: 24,
              items: [{ key: "documents", label: "문서", icon: "list", href: "#documents" }, { key: "activity", label: "활동", icon: "list", href: "#activity" }],
              onNavigate: (key: string, event: any) => { event?.preventDefault(); set("destination", key); },
            }),
          ]),
        ])),
      ]);
    }
    case "GuideKeyboardLayout": {
      const after = settings.arrangement === "after", keyboard = get("keyboard", true);
      return h("Stack", {}, [
        h("DsButton", { variant: "secondary", size: "sm", ...action(() => set("keyboard", !keyboard)) }, keyboard ? "키보드 모의 영역 끄기" : "키보드 모의 영역 켜기"),
        h("Text", {}, "220px 모의 키보드 · OS 키보드 아님"),
        h("CaseScreen", {}, [
          h("CaseViewport", { inset: after && keyboard ? 220 : 0 }, [
            h("CaseScroll", {}, [
              ...Array.from({ length: 5 }, (_, i) => h("DsListRow", { title: "설정 안내 " + (i + 1), description: "본문을 스크롤하며 입력을 확인하세요." })),
              h("DsFormGroup", { id: "design-keyboard-project", label: "프로젝트 이름" }, h("DsInput", {
                id: "design-keyboard-project", ariaLabel: "프로젝트 이름", value: get("project", "함께 만드는 프로젝트"), onValueChange: change("project"),
              })),
            ]),
            h("CaseFooter", { overlay: !after }, h("DsBottomActionBar", { keyboardVisible: keyboard, safeAreaBottom: keyboard ? 0 : 24 },
              h("DsButton", { ...action(() => set("message", "변경 사항을 저장했습니다.")) }, "변경 사항 저장"))),
          ]),
          ...(keyboard ? [h("CaseKeyboard", {}, h("Text", {}, "키보드 모의 영역 · 220px"))] : []),
        ]),
      ]);
    }
  }
}
