export type CaptureType = 'small' | 'control' | 'large' | 'desktop';
export interface Capture { width: number; height: number; deviceScaleFactor: number; padding: number }
export interface Presentation { name: string; width: number | null; captureType: CaptureType; prepare?: string | null; layer?: boolean; highlight?: string | null }
export const presentations: Presentation[];
export const overviewScenes: (Presentation & { id: string; title: string; description: string; destination: string; alt: string })[];
export const captureProfiles: Record<CaptureType, Capture>;
export const capture: Capture;
export const captureFor: (scene: Presentation) => Capture;
