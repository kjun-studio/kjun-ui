export interface PlatformState {
  status: string;
  verification: string;
  runtime: string;
  deviceVerification?: string;
}
export interface DiscoveryCategory {
  id: string;
  label: string;
  description: string;
  aliases: string[];
  count: number;
}
export interface DiscoveryDocument {
  id: string;
  path: string;
  title: string;
  group: string;
  description: string;
  category?: string;
  navigation?: boolean;
  parent?: string;
  parentPageId?: string;
  sectionGroups?: { id: string; title: string; sections: string[] }[];
  component?: string;
  thumbnail?: string;
  platforms?: Record<string, PlatformState>;
  aliases: string[];
  useCases: string[];
  api: string[];
  terms: string[];
  sections: [string, string][];
}
export interface DiscoveryIndex {
  categories: DiscoveryCategory[];
  documents: DiscoveryDocument[];
}
export interface SearchResult {
  document: DiscoveryDocument;
  href: string;
  match: string;
  score: number;
}
export function normalizeSearch(value: string): string;
export function searchDocuments(documents: DiscoveryDocument[], query: string): SearchResult[];
