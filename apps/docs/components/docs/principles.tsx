"use client";
import Image from "next/image";
import { DsIcon as Icon } from "@kjun-ui/react";
import { DataTable } from "./data-table";

type Principle = readonly [title: string, body: string];

/** Numbered principle list shared by the overview (grid) and the principles page (stack). */
export function PrincipleList({ items, layout }: { items: readonly Principle[]; layout: "grid" | "stack" }) {
  return (
    <ol className={`principle-list principle-list--${layout}`}>
      {items.map(([title, body], index) => (
        <li key={title}>
          <span className="section-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          <h3>{title}</h3>
          <p>{body}</p>
        </li>
      ))}
    </ol>
  );
}

const principles: Principle[] = [
  [
    "명확하게",
    "사용자가 해야 할 행동과 현재 상태를 쉽게 이해할 수 있게 합니다. 버튼의 중요도, 필드의 라벨, 확인과 취소의 의미를 일관되게 유지합니다.",
  ],
  [
    "세심하게",
    "로딩, 오류, 비활성 상태까지 설계합니다. 짧은 툴바와 긴 입력 폼, 키보드와 터치 환경의 차이를 고려합니다.",
  ],
  [
    "정직하게",
    "사용자가 실행한 일과 실제 결과를 구분합니다. 진행 중인 작업을 완료로 표현하거나, 아직 검증하지 않은 플랫폼을 지원 완료로 안내하지 않습니다.",
  ],
];

export function Principles() {
  return (
    <div className="reading-document">
      <section id="principles">
        <h2>세 가지 원칙</h2>
        <PrincipleList items={principles} layout="stack" />
      </section>
      <section id="brand">
        <h2>KJUN 브랜드</h2>
        <div className="brand-spec">
          <Image
            unoptimized
            src="/brand/kjun-symbol.svg"
            width={96}
            height={72}
            alt="KJUN 심볼"
          />
          <div>
            <strong>KJUN</strong>
            <p>작은 불편을 덜어주는, 잘 만든 앱.</p>
            <p>Small apps. Thoughtfully made.</p>
          </div>
        </div>
        <p className="body-copy">
          KJUN은 대문자로 표기합니다. KJUN 심볼의 4:3 비율과 여백을
          유지하며, 제품의 포인트 색상과 관계없이 로고는 흑백으로 사용합니다.
        </p>
        <a
          className="text-link"
          href="https://design.penpot.app/#/workspace?team-id=40e06342-8830-80d6-8008-9996bdb46026&file-id=40e06342-8830-80d6-8008-999a518a979f&page-id=fd79eab6-4f25-8071-8008-9aeda7025c12"
          target="_blank"
          rel="noreferrer"
        >
          Penpot 브랜드 가이드 <Icon name="external-link" size={15} />
        </a>
      </section>
      <section id="source">
        <h2>공통 규격과 호환성</h2>
        <p className="body-copy">
          KJUN UI는 컴포넌트의 구조와 동작, 색상의 역할을 정의합니다.
          각 프로젝트는 실제 색상과 서체, 데이터와 업무 처리를 연결합니다.
        </p>
        <DataTable
          presentation="prose"
          headings={["KJUN UI", "적용 프로젝트"]}
          rows={[
            ["색상 역할과 상태별 사용 위치", "실제 색상 값과 모드 전환"],
            ["글자 크기·굵기·줄높이", "폰트 선택과 로딩"],
            ["컴포넌트 구조·간격·반경·동작", "데이터 요청과 업무 처리"],
          ]}
        />
        <p className="principles-note">
          공통 규격을 변경할 때는 호환성을 검토하고 패키지와 문서를 함께
          갱신합니다. 사용 방법은 시작하기와 각 컴포넌트의 API 문서에서 안내합니다.
        </p>
      </section>
    </div>
  );
}
