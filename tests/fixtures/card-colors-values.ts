import type { KjunColors } from "@kjun-ui/tokens";
import { core } from "./color-contract-values";
export { cssValues } from "./style-values";

export const cardColors = (changed: boolean, override: boolean): KjunColors => ({
  ...core(changed),
  glassBg: "#F1F2F3",
  glassBorder: "#123456",
  ...(override ? {
    cardAccentStart: changed ? "#AA4411" : "#116644",
    cardAccentEnd: changed ? "#EEDDCC" : "#88CCAA",
    cardSubtleStart: changed ? "#FFF0DD" : "#EAF6F0",
    cardSubtleEnd: changed ? "#FFFAEE" : "#F6FCF8",
    cardSubtleBorder: changed ? "#885522" : "#447766",
  } : {}),
});
