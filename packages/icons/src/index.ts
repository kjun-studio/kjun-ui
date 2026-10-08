export const tablerVersion = '3.48.0' as const;
export type IconNode = [string, Record<string, string>];
export interface KjunIconDefinition {
  readonly outline: readonly IconNode[];
  readonly filled?: readonly IconNode[];
}
export type KjunIconRegistry = Readonly<Record<string, KjunIconDefinition>>;
export interface KjunIconMetadata {
  readonly name: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly filled: boolean;
}
