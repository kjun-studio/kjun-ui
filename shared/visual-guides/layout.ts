import { part as p, textPart as t, control as c, type GuideAuthor } from "./types.ts";
export const layout: Record<string, GuideAuthor> = {
  DsAccordion: {
    action: "첫 항목",
    parts: [
      c("항목 헤더", "최소 48px 영역에 14px·600 제목과 회전하는 16px 화살표를 배치합니다."),
      t("항목 내용", "제목과 시작선을 맞춘 14px·400 본문입니다. 아래 여백 20px로 다음 항목과 구분합니다.", "첫 내용"),
    ],
    related: "form",
  },
  DsAccordionItem: {
    action: "첫 항목",
    parts: [
      t("자식 헤더", "14px·600 제목과 16px 화살표로 이 항목을 열고 닫습니다.", "첫 항목"),
      t("자식 내용", "해당 항목의 내용입니다.", "첫 내용"),
    ],
    related: "form",
  },
  DsCard: {
    parts: [
      t("제목", "묶인 콘텐츠의 목적을 요약합니다.", "카드 제목"),
      t("본문", "소비자가 제공하는 카드 내용입니다.", "본문과 헤더·푸터 간격을 확인하세요."),
      t("푸터 행동", "내용과 관련된 후속 행동을 제공합니다.", "프로젝트 보기", true),
    ],
    related: "assets",
  },
  DsDrawer: {
    action: "패널 열기",
    parts: [
      t("제목", "열린 패널의 목적을 설명합니다.", "작업 확인"),
      p("닫기", "패널을 닫고 이전 흐름으로 돌아갑니다.", '[aria-label="닫기"]', true),
      p("본문", "소비자가 제공한 입력·작업 영역입니다.", "input"),
    ],
    related: "layers",
  },
  DsModal: {
    action: "모달 열기",
    parts: [
      t("제목", "현재 수행할 작업을 설명합니다.", "작업 확인"),
      p("닫기", "취소 또는 닫기 요청을 전달합니다.", '[aria-label="닫기"]', true),
      p("본문", "입력이나 확인에 필요한 소비자 콘텐츠입니다.", "input"),
      t("확인 행동", "작업을 요청합니다. 완료 후 닫기는 소비자 책임입니다.", "확인", true),
    ],
    related: "layers",
  },
  DsPopover: {
    action: "추가 정보",
    parts: [
      t("트리거", "부가 영역을 여는 ghost 버튼 예제입니다.", "추가 정보"),
      t("부가 내용", "14px·줄 높이 20px의 본문입니다. 내부 여백 16px과 행동 간격 12px을 사용합니다.", "팝오버 내용"),
      t("실행 행동", "내용에 맞는 너비로 오른쪽에 정렬한 버튼 예제입니다.", "실행", true),
    ],
    related: "layers",
  },
  DsScrollFade: {
    parts: [
      p("스크롤 영역", "가로 콘텐츠와 넘친 방향의 페이드를 표시합니다."),
      t("소비자 콘텐츠", "영역 안에 배치한 항목입니다.", "항목 1"),
    ],
    related: "toolbar",
  },
};
