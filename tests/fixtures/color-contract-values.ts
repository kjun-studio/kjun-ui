import { coreColorRoles, type KjunColors, type KjunCoreColors } from "@kjun/tokens";
import { appColors, cssValues } from "./style-values";
export const core = (changed = false): KjunCoreColors => ({
  ...Object.fromEntries(coreColorRoles.map(role => [role, appColors[role]])) as KjunCoreColors,
  secondary: changed ? "#DDEEDD" : "#DDEEFF",
  focusRing: changed ? "#662244" : "#224466",
});
export const scoped = (changed: boolean, override: boolean): KjunColors => ({
  ...core(changed),
  ...(override ? { inputBg: "#EEDDCC" } : {}),
});
export function rootValues() {
  for (const [name, value] of Object.entries(cssValues(core()))) document.documentElement.style.setProperty(name, value);
}
export { cssValues };
