"use client";
import tokens from "@/lib/generated/tokens.json";
import { DataTable } from "./data-table";
import { useMediaQuery } from "./use-document-palette";

export const kebab = (role: string) => role.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());

/** A role name with a chip of the value the docs palette resolves for it (fallbacks included). */
export function ColorRole({ role }: { role: string }) {
  return <span className="color-role">
    <i className="color-chip" aria-hidden="true" style={{ background: `var(--_kjun-color-${kebab(role)})` }} />
    <code>{role}</code>
  </span>;
}
/** "brand / brandHover" style cells: one chip per role. */
export function ColorRoleList({ roles }: { roles: string }) {
  return <span className="color-role-list">{roles.split(" / ").map(role => <ColorRole key={role} role={role} />)}</span>;
}

const groups: { id: string; label: string; match: (role: string) => boolean }[] = [
  { id: "status", label: "상태와 강조 배경 위 글자", match: role => /^(success|danger|warning|info|on[A-Z])/.test(role) },
  { id: "surface", label: "표면·카드·선택", match: role => /^(card|glass|brand|selected|tertiary)/.test(role) },
  { id: "input", label: "입력·스위치·필터", match: role => /^(input|switch|filter)/.test(role) },
  { id: "data", label: "표·차트·로딩", match: role => /^(table|chart|skeleton)/.test(role) },
  { id: "line", label: "테두리·그림자·오버레이", match: () => true },
];

/** Optional roles, grouped by what they colour. Phones start with the groups folded. */
export function OptionalColorRoles() {
  const narrow = useMediaQuery("(max-width: 767px)");
  const entries = Object.entries(tokens.colorRoleFallbacks);
  const grouped = groups.map(group => ({ ...group, rows: [] as [string, string][] }));
  for (const entry of entries) grouped.find(group => group.match(entry[0]))!.rows.push(entry);
  return <div className="color-role-groups">
    {grouped.filter(group => group.rows.length).map(group => <details key={group.id + String(narrow)} className="color-role-group" open={!narrow}>
      <summary>{group.label} <span>{group.rows.length}개</span></summary>
      <DataTable headings={["선택 역할", "생략 시 사용할 역할"]}
        rows={group.rows.map(([role, fallback]) => [<ColorRole key={role} role={role} />, <ColorRole key={fallback} role={fallback} />])} />
    </details>)}
  </div>;
}
