export function rnd(s: number, t = 0): number {
  const x = (s * 9301 + t * 49297 + 233280) % 233280;
  return x / 233280;
}

export function hash(n: number, s = 0): number {
  const x = (n * 9301 + s * 49297 + 233280) % 233280;
  return x / 233280;
}
