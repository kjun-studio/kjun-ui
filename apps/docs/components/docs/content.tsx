"use client";
import { FoundationAccessibilityGuide } from "./foundation-accessibility";
import { FoundationIconsGuide } from "./foundation-icons";
import { FoundationInteractionGuide } from "./foundation-interaction";
import { ActionLink } from "./action-link";
import { FoundationLayoutGuide } from "./foundation-layout";
import { AccessibilityGuide } from './accessibility-guide';
import { Verification } from './verification';
import { FoundationElevationGuide } from "./foundation-elevation";
import { FoundationMotionGuide } from "./foundation-motion";
import { VisualSections, UsageAdvice } from './visual-guide';
import { UsageGuide, UsageTopic } from './usage-guide';
import { guideTopics } from '../../../../shared/document-navigation';
import {
  CatalogComponent,
  Coverage,
  FeedbackGuide,
  ApiContract,
} from "./catalog-content";
import componentContracts from "../../../../shared/component-guides.json";
import packages from "@/lib/generated/packages.json";
import entries from "@/lib/generated/component-catalog.json";
import Link from "@/components/docs/doc-link";
import { DsIcon as Icon } from "@kjun/react";
import { Tokens } from "./tokens";
import { componentGuides, componentNameFor, type PageId } from "@/lib/catalog";
import { Playground } from "./playground";
import { BasicUsage } from "./usage-source";
import { CodeBlock } from "./code-block";
import { Styling } from "./styling";
import { GettingStarted } from "./getting-started";
import { type ComponentName } from "../../../../shared/demo-config";
import { ComponentGallery, CategoryLinks } from "./component-gallery";
import { OverviewShowcase } from "./overview-showcase";
import { PrincipleList, Principles } from "./principles";
export function Overview() {
  return (
    <>
      <header className="overview-intro">
        <p className="eyebrow">KJUN UI</p>
        <h1>
          하나의 기준,
          <br />
          각자의 모습.
        </h1>
        <p className="lead">
          KJUN의 여러 제품이 함께 사용하는 UI 컴포넌트입니다.
        </p>
        <div className="overview-actions">
          <ActionLink href="/getting-started">
            시작하기 <Icon name="arrow-right" size={16} aria-hidden="true" />
          </ActionLink>
          <ActionLink variant="secondary" href="/components">
            컴포넌트 보기
          </ActionLink>
        </div>
      </header>
      <section id="showcase" className="overview-section">
        <div className="overview-section-heading">
          <h2>컴포넌트로 구성한 화면</h2>
          <p>목록과 입력 폼, 데이터 화면까지 같은 규격으로 구성합니다.</p>
        </div>
        <OverviewShowcase />
      </section>
      <section id="structure" className="overview-section">
        <div className="overview-section-heading">
          <h2>같은 규격, 각자의 색.</h2>
        </div>
        <PrincipleList
          layout="grid"
          items={[
            ["규격은 일관되게", "컴포넌트의 구조, 크기, 간격과 동작을 여러 프로젝트에서 일관되게 사용합니다."],
            ["브랜드는 자유롭게", "색상과 서체는 적용 프로젝트에서 관리합니다. 컴포넌트의 규격은 유지합니다."],
          ]}
        />
      </section>
      <section id="components" className="overview-section">
        <div className="overview-section-heading">
          <h2>컴포넌트</h2>
          <p>
            {entries.filter((x) => x.kind !== "internal").length}개 컴포넌트 · v{packages[0].version}
          </p>
          <Link className="text-link" href="/components">
            전체 컴포넌트 보기 <Icon name="arrow-right" size={14} aria-hidden="true" />
          </Link>
        </div>
        <CategoryLinks />
      </section>
    </>
  );
}
export function ComponentContent({ component }: { component: ComponentName }) {
  const name = { button: "DsButton", input: "DsInput", modal: "DsModal" }[component];
  const guide = componentGuides[component];
  const contract = componentContracts[{ button: "DsButton", input: "DsInput", modal: "DsModal" }[component] as keyof typeof componentContracts];
  return (
    <>
      <section id="preview">
        <h2 className="sr-only">미리보기</h2>
        <Playground component={component} />
      </section>
      <section id="guidelines">
        <h2>{guide.title}</h2>
        <p className="body-copy">{guide.paragraph}</p>
        <p className="body-copy">{contract.interaction}</p>
        <UsageAdvice name={name} advice={[guide.do, guide.dont]} />
        {component === "modal" && <p className="body-copy"><Link href="/elevation#overlap">Modal·Toast·하단 CTA의 겹침 규칙</Link>을 함께 확인하세요.</p>}
      </section>
      <BasicUsage name={name} />
      <VisualSections name={name} />
      <ApiContract
        name={
          { button: "DsButton", input: "DsInput", modal: "DsModal" }[component]
        }
      />
      <AccessibilityGuide name={name} />
    </>
  );
}
export function PageContent({ id }: { id: PageId }) {
  if (id === "overview") return <Overview />;
  if (id === "principles") return <Principles />;
  if (id === "getting-started") return <GettingStarted />;
  if (id === "usage-guide") return <UsageGuide />;
  const topic = guideTopics.find(topic => topic.id === id);
  if (topic) return <UsageTopic topic={topic} />;
  if (id === "icons") return <FoundationIconsGuide />;
  if (id === "tokens") return <Tokens />;
  if (id === "accessibility") return <FoundationAccessibilityGuide />;
  if (id === "interaction") return <FoundationInteractionGuide />;
  if (id === "motion") return <FoundationMotionGuide />;
  if (id === "layout") return <FoundationLayoutGuide />;
  if (id === "elevation") return <FoundationElevationGuide />;
  if (id === "styling") return <Styling />;
  if (id === "catalog") return <Coverage />;
  if (id === "verification") return <Verification />;
  if (id === "components") return <ComponentGallery />;
  if (id === "feedback") return <FeedbackGuide />;
  if (id === "button" || id === "input" || id === "modal")
    return <ComponentContent key={id} component={id} />;
  const name = componentNameFor(id);
  return name ? <CatalogComponent key={id} name={name} /> : null;
}
