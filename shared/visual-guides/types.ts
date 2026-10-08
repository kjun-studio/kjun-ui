import type { Settings, Values } from "../example-registry.ts";
import type { PlatformName } from "../demo-config.ts";
export interface AnatomyPart {
  label: string;
  description: string;
  target: string;
  optional: boolean;
}
export interface GuideCase {
  id: string;
  label: string;
  description: string;
  settings?: Settings;
  values?: Values;
  action?: string;
  viewportWidth?: number;
  viewportHeight?: number;
}
export interface FigureSpec extends GuideCase {
  parts: AnatomyPart[];
  captureParts?: boolean;
}
// Shown only when an author describes the default figure; the generic text stays hidden.
export const defaultFigureDescription = "문서 기본 색상과 서체로 캡처한 대표 예제입니다.";
export interface GuideAuthor {
  parts: AnatomyPart[];
  description?: string;
  captureParts?: boolean;
  action?: string;
  settings?: Settings;
  values?: Values;
  figures?: FigureSpec[];
  states?: GuideCase[];
  related?: string;
}
export interface VisualGuide {
  name: string;
  path: string;
  related: string;
  description: string;
  platforms: Record<
    PlatformName,
    {
      figures: FigureSpec[];
      states: GuideCase[];
      sizes: GuideCase[];
      sizeDefault: string;
      note: string;
    }
  >;
}
export const part = (
  label: string,
  description: string,
  target = ".catalog-render > *",
  optional = false,
): AnatomyPart => ({ label, description, target, optional });
export const textPart = (label: string, description: string, text: string, optional = false) =>
  part(label, description, "text=" + text, optional);
export const control = (label: string, description: string, role = "button") =>
  part(
    label,
    description,
    role === "button"
      ? 'button, [role="button"]'
      : ["checkbox", "radio"].includes(role)
        ? `.ds-${role}, label:has(input[type="${role}"]) > span, [role="${role}"]`
        : `[role="${role}"]`,
  );
export const visual = (name: string, props: Record<string, unknown>, text?: string): Settings => ({
  visual: JSON.stringify({ [name]: { props, ...(text == null ? {} : { text }) } }),
});
