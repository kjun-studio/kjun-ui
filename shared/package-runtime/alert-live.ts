export type AlertLive = "assertive" | "polite" | "off";

/** Alert announcement role: `live` overrides the tone default (danger interrupts, others are polite); off announces nothing. */
export function alertRole(tone: string, live?: AlertLive): "alert" | "status" | undefined {
  if (live === "off") return undefined;
  if (live) return live === "assertive" ? "alert" : "status";
  return tone === "danger" ? "alert" : "status";
}
