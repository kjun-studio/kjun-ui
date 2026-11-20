/** FormGroup as="fieldset" groups several choice controls under one label. The group's id then goes to one control, so
 * app code can focus the group with document.getElementById(id): the first control that asks for it, skipping disabled
 * ones. Controls ask in mount order, which is their order on the page for the usual static list. */
export type FormGroupElement = "div" | "fieldset";
export interface FieldGroupClaim { key: string; disabled: boolean }

/** Adds a claim at the end, or updates a held claim in place so it keeps its position. */
export function claimGroupField(claims: readonly FieldGroupClaim[], key: string, disabled: boolean): FieldGroupClaim[] {
  const at = claims.findIndex(claim => claim.key === key);
  if (at < 0) return [...claims, { key, disabled }];
  if (claims[at].disabled === disabled) return claims as FieldGroupClaim[];
  const next = claims.slice();
  next[at] = { key, disabled };
  return next;
}

export function releaseGroupField(claims: readonly FieldGroupClaim[], key: string): FieldGroupClaim[] {
  return claims.some(claim => claim.key === key) ? claims.filter(claim => claim.key !== key) : claims as FieldGroupClaim[];
}

/** The claim that takes the group's id: the first enabled one, or the first one when every control is disabled. */
export function groupFieldOwner(claims: readonly FieldGroupClaim[]): string | undefined {
  return (claims.find(claim => !claim.disabled) ?? claims[0])?.key;
}

/** Index of the option that carries the group's id inside a ButtonGroup or FilterGroup: the first enabled one. */
export function firstEnabledIndex(options: readonly { disabled?: boolean }[], groupDisabled = false): number {
  if (groupDisabled) return options.length ? 0 : -1;
  const at = options.findIndex(option => !option.disabled);
  return at < 0 && options.length ? 0 : at;
}
