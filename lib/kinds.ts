const KS_MAP: Record<string, string> = {
  WEAPON: '✕',
  ARMOR: '▣',
  TECH: '⊕',
  'SET-DRESS': '▤',
  HERO: '◆',
  GRAPHIC: '△',
};

export const KS = new Proxy(KS_MAP, {
  get(target, prop: string) {
    return target[prop] ?? '◈';
  },
}) as Record<string, string>;

export function pad(n: number | string, w = 3): string {
  return String(n).padStart(w, '0');
}
