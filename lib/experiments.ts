const raw = process.env.NEXT_PUBLIC_EXPERIMENTS || '';

const ACTIVE_EXPERIMENTS = new Set(
  raw
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
);

export function isExperimentEnabled(name: string): boolean {
  return ACTIVE_EXPERIMENTS.has(name);
}



