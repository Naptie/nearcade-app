/**
 * Live-attendance density level, mirroring the website's ShopCard
 * green/yellow/orange/red-500 border coding.
 */
export type DensityLevel = 0 | 1 | 2 | 3 | 4;

export function attendanceDensity(count: number | undefined | null): DensityLevel {
  const n = count ?? 0;
  if (n <= 0) return 0;
  if (n < 5) return 1;
  if (n < 10) return 2;
  if (n < 20) return 3;
  return 4;
}

/** Tailwind class fragments per density level (border + text colors). */
export const DENSITY_BORDER: Record<DensityLevel, string> = {
  0: 'border-base-300/60',
  1: 'border-density-1/40',
  2: 'border-density-2/50',
  3: 'border-density-3/50',
  4: 'border-density-4/50',
};

export const DENSITY_TEXT: Record<DensityLevel, string> = {
  0: 'text-base-content/60',
  1: 'text-density-1',
  2: 'text-density-2',
  3: 'text-density-3',
  4: 'text-density-4',
};
