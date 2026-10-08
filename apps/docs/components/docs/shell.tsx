"use client";
import Link from "@/components/docs/doc-link";
import packages from "@/lib/generated/packages.json";

import { DsIcon as Icon } from "@kjun-ui/react";
import {
  SidebarProvider,
  SidebarTrigger,
} from "./sidebar";
import { findPage, type PageId } from "@/lib/catalog";
import { PageContent } from "./content";
import { Navigation } from "./navigation";
import { DocsSearch } from "./docs-search";
import { NativePreviewNotice } from "./platform-status";
import { DocsPlatformSelect } from "./docs-platform";
import { categoryFor, navigationDocuments } from "@/lib/discovery";
import { useDocumentAnchor } from "./use-document-anchor";
import { useDocumentNavigation } from './use-document-navigation';
import { DocumentShortcuts } from './document-navigation';
export function DocsShell({ id }: { id: PageId }) {
  const page = findPage(id);
  const index = navigationDocuments.findIndex((r) => r.id === id);
  const category = categoryFor(page.category);
  const parent = page.parentPageId ? findPage(page.parentPageId) : null;
  const active = useDocumentNavigation(page);
  useDocumentAnchor(id);
  return (
    <SidebarProvider>
      <a href="#main-content" className="skip-link">
        본문으로 건너뛰기
      </a>
      <Navigation id={id} />
      <div className="doc-body">
        <header className="topbar">
          <SidebarTrigger />
          <div className="breadcrumbs">
            <span>{page.group}</span>
            {parent && <><Icon name="chevron-right" size={13} /><Link href={parent.path}>{parent.title}</Link></>}
            {category && <><Icon name="chevron-right" size={13} /><Link href={`/components?category=${category.id}`}>{category.label}</Link></>}
            <Icon name="chevron-right" size={13} />
            <span>{page.title}</span>
          </div>
          <DocsPlatformSelect />
          <DocsSearch />
        </header>
        <div className={`reading-layout${id === "components" ? " gallery-layout" : id === "overview" ? " overview-layout" : ""}`}>
          <main className={`doc-main${id === 'tokens' ? ' tokens-document' : id === 'motion' ? ' motion-document' : ''}`} id="main-content" tabIndex={-1}>
            {id !== "overview" && (
              <div className="page-intro">
                <p className="eyebrow">{page.group.toUpperCase()}</p>
                <h1>{page.title}</h1>
                <p className="lead">{page.description}</p>
              </div>
            )}
            {id !== "catalog" && <NativePreviewNotice />}
            <DocumentShortcuts page={page} active={active} />
            <PageContent id={id} />
            {index >= 0 && <div className="page-navigation">
              {index > 0 ? (
                <Link href={navigationDocuments[index - 1].path}>
                  <Icon name="arrow-left" size={16} />
                  <div>
                    <small>이전</small>
                    <span>{navigationDocuments[index - 1].title}</span>
                  </div>
                </Link>
              ) : (
                <span />
              )}
              {index < navigationDocuments.length - 1 && (
                <Link href={navigationDocuments[index + 1].path}>
                  <div>
                    <small>다음</small>
                    <span>{navigationDocuments[index + 1].title}</span>
                  </div>
                  <Icon name="arrow-right" size={16} />
                </Link>
              )}
            </div>}
            <footer className="doc-footer">
              <span>KJUN UI · v{packages[0].version}</span>
              <span>Small apps. Thoughtfully made.</span>
            </footer>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
