"use client";
import Link from "@/components/docs/doc-link";
import { useDocsPlatform, PlatformLoading } from "./docs-platform";
import { ApiContract, FeedbackReference } from "./api-reference";
import { AccessibilityGuide } from './accessibility-guide';
export { ApiContract } from "./api-reference";
import guides from "../../../../shared/component-guides.json";
import { BasicUsage } from "./usage-source";
import { CodeBlock } from "./code-block";
import { VisualSections, UsageAdvice } from "./visual-guide";
import { CatalogPreview } from "./catalog-preview";
import {
  platformNames,
} from "../../../../shared/demo-config";
export function CatalogComponent({ name }: { name: string }) {
  const guide = guides[name as keyof typeof guides];
  return (
    <>
      <section id="preview">
        <CatalogPreview key={name} name={name} detail />
      </section>
      <section id="guidelines">
        <h2>동작과 책임</h2>
        <p className="body-copy">{guide.interaction}</p>
        <UsageAdvice name={name} />
        {["DsIcon", "DsIconToggle"].includes(name) && <p className="body-copy"><Link href="/icons#catalog">아이콘 목록·검색</Link>에서 이름을 고르고 <Link href="/icons#variants">형태와 선택 상태</Link>를 구분하세요.</p>}
        {["DsDrawer", "DsPopover", "DsTooltip", "DsBottomActionBar", "DsBottomNavigation", "DsTopNavigation"].includes(name) && <p className="body-copy"><Link href="/layout#cta">화면 배치와 하단 영역</Link> · <Link href="/elevation#overlap">레이어 겹침 규칙</Link></p>}
      </section>
      <BasicUsage name={name} />
      <VisualSections name={name} />
      <ApiContract name={name} />
      <AccessibilityGuide name={name} />
    </>
  );
}
export { Coverage } from "./coverage";
export function FeedbackGuide() {
  const { platform } = useDocsPlatform();
  return (
    <>
      <section id="preview">
        <CatalogPreview name="KjunFeedbackProvider" detail />
      </section>
      <section id="guidelines">
        <h2>영역별 피드백</h2>
        <UsageAdvice name="KjunFeedbackProvider" />
        <p className="body-copy"><Link href="/elevation#overlap">Modal·Toast·하단 CTA의 겹침과 포커스 규칙</Link>을 함께 확인하세요.</p>
        <p className="body-copy">
          색상·서체 영역 안에 KjunFeedbackProvider를 놓습니다.
          Toast·Confirm·Prompt는 이 영역의 값을 사용하며, 열린 동안의 모드
          변경도 반영합니다. 여러 확인·입력 요청은 순서대로 처리합니다. 영역이
          해제되면 미완료 Confirm은 false, Prompt는 null로 정리합니다. Toast는
          성공·정보 3초, 경고 4초, 오류 5초 동안 최대 5개를 표시합니다. 마우스나
          키보드 포커스가 머무는 동안 시간을 멈추며 showProgress로 진행 표시를
          제어합니다.
        </p>
      </section>
      <BasicUsage name="KjunFeedbackProvider" />
      <VisualSections name="KjunFeedbackProvider" />
      <section id="api">
        <h2>서비스 계약</h2>
        {!platform ? <PlatformLoading /> : platform !== "vue2" ? <CodeBlock
          label={`${platformNames[platform]} · @kjun-ui/${platform}`}
          code={
            'const feedback = useKjunFeedback();\nfeedback.toast.success("저장했습니다", { duration: 4000 });\nconst confirmed: boolean = await feedback.confirm({ title: "저장할까요?" });\nconst name: string | null = await feedback.prompt({\n  title: "이름 입력",\n  validator: value => value.trim().length > 1 || "두 글자 이상 입력하세요."\n});'
          }
        /> : <CodeBlock
          label="Vue 2 · @kjun-ui/vue2"
          code={
            'export default {\n  inject: ["kjunFeedback"],\n  methods: {\n    async save() {\n      const confirmed = await this.kjunFeedback.confirm({ title: "저장할까요?" });\n      if (confirmed) this.kjunFeedback.toast.success("저장했습니다");\n    }\n  }\n};'
          }
        />}
        <FeedbackReference />
      </section>
      <AccessibilityGuide name="KjunFeedbackProvider" />
    </>
  );
}
