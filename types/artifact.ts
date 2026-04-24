export type Kind = string;
export type Status = string;

export interface ArtifactImage {
  src: string;
  thumb?: string;
  w?: number;
  h?: number;
  alt?: string;
  caption?: string;
}

export interface Artifact {
  id: string;
  catNo: string;
  title: string;
  year: number;
  kind: Kind;
  production: string;
  material: string;
  finish: string;
  status: Status;
  dims: string;
  palette: [string, string, string];
  note?: string;
  images?: ArtifactImage[];
  /** 1-based sort index; also used as plate seed when no images exist */
  index: number;
  /** if false, hide from home-page index mosaic (defaults true) */
  showOnIndex?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const KINDS: readonly string[] = ['WEAPON', 'ARMOR', 'TECH', 'SET-DRESS', 'HERO', 'GRAPHIC'] as const;
export const STATUSES: readonly string[] = ['HERO', 'STUNT', 'DISPLAY', 'ARCHIVE'] as const;
