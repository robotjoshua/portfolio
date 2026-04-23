export interface Identity {
  name: string;
  role: string;
  callsign: string;
  locationShort: string;
  addressLine: string;
  hours: string;
  email: string;
  handle: string;
  bio: string;
  available: boolean;
}

export interface ActiveBuild {
  production: string;
  prop: string;
  phases: string[];
  currentPhase: number;
  pct: number;
  due: string;
}

export interface SkillItem {
  k: string;
  v: number;
  t: string;
}

export interface SkillGroup {
  cat: string;
  items: SkillItem[];
}

export interface CvRow {
  yr: string;
  t: string;
  s: string;
}

export interface Profile {
  identity: Identity;
  build: ActiveBuild;
  skills: SkillGroup[];
  cv: CvRow[];
}
