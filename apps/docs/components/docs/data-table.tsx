"use client";
import type { ReactNode } from "react";
import { DsTable } from '@kjun-ui/react';
export function DataTable({ headings, rows, presentation = 'default', numericColumns = [] }: {
  headings: string[];
  rows: readonly (readonly ReactNode[])[];
  presentation?: 'default' | 'tokens' | 'spec' | 'document' | 'prose';
  numericColumns?: number[];
}) {
  // Prose, size-spec and short document tables compare values across columns, so they stay a table on narrow screens.
  const className = { default: 'docs-table', tokens: 'token-table', spec: 'token-table token-spec', document: 'document-table', prose: 'docs-table docs-table--prose' }[presentation];
  return <div className={className}><DsTable responsive={['prose', 'spec', 'document'].includes(presentation) ? 'none' : 'card'} hoverable={false} sortable={false}
    cardSections={[{ layout: 'stack', columns: headings.slice(1).map((_, index) => String(index + 1)) }]}
    ariaLabel={headings.join(' · ')} columns={headings.map((label, index) => ({ key: String(index), label, ...(numericColumns.includes(index) ? { align: 'right' as const } : {}) }))}
    data={rows.map((cells, id) => ({ id, cells }))} renderCell={(_, column, row) => row.cells[Number(column.key)]} />
  </div>;
}
