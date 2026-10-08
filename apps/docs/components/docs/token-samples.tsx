'use client';
import type { ReactNode } from 'react';
import { tokens } from '@kjun/tokens';
import Link from './doc-link';
import { DataTable } from './data-table';

export const numeric = (value: ReactNode) => <span className="token-number">{value}</span>;
export function TokenTable(props: { headings: string[]; rows: readonly (readonly ReactNode[])[]; numericColumns?: number[]; spec?: boolean }) {
  return <DataTable headings={props.headings} rows={props.rows} numericColumns={props.numericColumns} presentation={props.spec ? 'spec' : 'tokens'} />;
}
export function Related({ children }: { children: ReactNode }) {
  return <div className="token-related"><span>관련 문서</span><div>{children}</div></div>;
}

export const spacing = Object.entries(tokens.dimension).sort(([, a], [, b]) => a - b);
/** Spacing samples highlight the gap itself; the blocks only frame it. */
export function SpacingSamples({ values }: { values: typeof spacing }) {
  return <ul className="token-spacing-samples">
    {values.map(([name, value]) => <li key={name}>
      <div className="token-gap-sample" style={{ gap: value }} aria-hidden="true"><i /><i /></div>
      <strong>{value}px</strong><code>dimension.{name}</code>
    </li>)}
  </ul>;
}

/** Radii are shown on the shapes that use them, at their real size. */
export function RadiusShapes() {
  const controls = (['sm', 'md', 'lg'] as const).map(size => ({ size, height: tokens.input[size].height, radius: tokens.shape.control[size] }));
  return <div className="token-radius-roles">
    {controls.map(control => <figure key={control.size}>
      <span className="token-radius-control" style={{ height: control.height, borderRadius: control.radius }} aria-hidden="true">{control.size}</span>
      <figcaption><strong>{control.radius}px</strong>shape.control.{control.size} · 높이 {control.height}</figcaption>
    </figure>)}
    <figure>
      <span className="token-radius-card" style={{ borderRadius: tokens.shape.container }} aria-hidden="true" />
      <figcaption><strong>{tokens.shape.container}px</strong>shape.container · 카드·패널</figcaption>
    </figure>
    <figure>
      <span className="token-radius-pill" style={{ borderRadius: tokens.radius.radius9999 }} aria-hidden="true" />
      <figcaption><strong>원형</strong>shape.pill · 배지·스위치</figcaption>
    </figure>
  </div>;
}
export function RadiusScale() {
  return <ul className="token-radius-samples">
    {Object.entries(tokens.radius).sort(([, a], [, b]) => a - b).map(([name, value]) => <li key={name}>
      <div className="token-radius-shape" style={{ borderRadius: value }} aria-hidden="true" />
      <strong>{value === 9999 ? '원형' : value + 'px'}</strong><code>{name}</code>
    </li>)}
  </ul>;
}

type Role = keyof typeof tokens.typography;
/** Core roles first; roles that repeat a size stay listed so their weight difference is visible. */
export const typeRoles: { role: Role; label: string; use: string; sample: string }[] = [
  { role: 'displayMd', label: '큰 수치', use: '대시보드의 핵심 숫자', sample: '1,234' },
  { role: 'pageTitle', label: '페이지 제목', use: '화면의 첫 제목', sample: '주문 내역' },
  { role: 'sectionTitle', label: '섹션 제목', use: '새 내용 묶음의 시작', sample: '배송 안내' },
  { role: 'cardTitle', label: '카드 제목', use: '카드·모달 제목', sample: '결제 수단' },
  { role: 'input', label: '입력값', use: '입력칸 글자 · iOS 확대 방지 16px', sample: '홍길동' },
  { role: 'body', label: '본문', use: '읽고 이해할 주요 내용', sample: '주문한 상품은 순서대로 배송됩니다.' },
  { role: 'label', label: '라벨', use: '필드 라벨·목록 항목 이름', sample: '받는 사람' },
  { role: 'control', label: '컨트롤', use: '버튼·탭 글자', sample: '저장하기' },
  { role: 'caption', label: '보조 정보', use: '날짜·짧은 설명', sample: '업데이트: 오늘 오전 9시' },
  { role: 'meta', label: '메타', use: '개수·상태 같은 짧은 정보', sample: '3개 선택' },
];
export function TypeScale() {
  return <TokenTable spec headings={['역할', '견본', '크기·굵기']} numericColumns={[2]} rows={typeRoles.map(({ role, label, use, sample }) => {
    const spec = tokens.typography[role];
    return [
      <span className="token-type-role"><strong>{label}</strong><span>{use}</span></span>,
      <span className="token-type-sample" style={{ fontSize: spec.fontSizePx, lineHeight: spec.lineHeightPx + 'px', fontWeight: spec.fontWeight, letterSpacing: spec.letterSpacingEm + 'em' }}>{sample}</span>,
      numeric(<>{spec.fontSizePx}/{spec.lineHeightPx}<br />{spec.fontWeight}</>),
    ];
  })} />;
}

const breakpointUses: Record<string, string> = {
  modal: 'Modal', drawer: 'Drawer', toast: 'Toast', pagination: 'Pagination', paginationWide: 'Pagination 넓은 보기',
  kpiHero: 'KPI 강조', kpiRow: 'KPI 행', market: '시장 목록', selection: '선택 그룹', formColumns: '폼 열', table: 'Table 카드 전환', bottomAction: '하단 액션',
};
export function BreakpointTable() {
  const names: Record<string, string> = { actionContent: '액션 내용', compact: '좁은 화면', medium: '중간 화면', wide: '넓은 화면' };
  const rows = Object.entries(tokens.breakpoints).sort(([, a], [, b]) => a - b).map(([name, value]) => {
    const users = Object.entries(tokens.responsive).filter(([, width]) => width === value).map(([key]) => breakpointUses[key] || key);
    return [<strong>{names[name] || name}</strong>, numeric(value), users.join(' · ') || '—'];
  });
  return <TokenTable spec headings={['기준', '너비', '이 기준으로 전환하는 컴포넌트']} numericColumns={[1]} rows={rows} />;
}

export function MotionScale() {
  const steps = (['instant', 'quick', 'fast', 'normal'] as const);
  const uses = { instant: '툴팁·퇴장 페이드', quick: '팝업 퇴장·배경 퇴장', fast: '버튼·선택선·팝업·접기', normal: '모달·패널 등장' };
  return <ul className="token-motion-scale">{steps.map(step => <li key={step}>
    <span className="token-motion-bar" style={{ width: `${tokens.motion[step] / tokens.motion.normal * 100}%` }} aria-hidden="true" />
    <strong>{tokens.motion[step]}ms</strong><span>{uses[step]}</span><code>motion.{step}</code>
  </li>)}</ul>;
}

export const tokenGroups: { label: string; href: string; detail: string }[] = [
  { label: '간격', href: '#spacing', detail: `${spacing.length}단계` },
  { label: '모서리', href: '#radius', detail: `${Object.keys(tokens.radius).length}단계` },
  { label: '컴포넌트 치수', href: '#sizes', detail: 'xs–xl' },
  { label: '타이포그래피', href: '#typography', detail: `${Object.keys(tokens.typography).length}개 역할` },
  { label: '반응형 전환', href: '#responsive', detail: `${Object.keys(tokens.breakpoints).length}개 기준` },
  { label: '모션', href: '#motion', detail: '지속 시간·가속' },
  { label: '그림자·Elevation', href: '/elevation', detail: '다른 문서' },
  { label: '상태·포커스', href: '/interaction', detail: '다른 문서' },
  { label: '색상 역할·서체', href: '/styling', detail: '프로젝트가 연결' },
  { label: '아이콘 크기', href: '/icons', detail: '다른 문서' },
];
export function TokenIndex() {
  return <nav className="token-index" aria-label="토큰 그룹">
    <ul>{tokenGroups.map(group => <li key={group.label}>
      {group.href.startsWith('#') ? <a href={group.href}>{group.label}</a> : <Link href={group.href}>{group.label}</Link>}
      <span>{group.detail}</span>
    </li>)}</ul>
  </nav>;
}
