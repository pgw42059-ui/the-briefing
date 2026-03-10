import type { ChartPointForTechnicals } from './compute-technicals';

/**
 * Compute dynamic support/resistance levels from historical chart data.
 * Uses recent swing lows/highs and SMA clusters.
 */
export function computeKeyLevels(
  points: ChartPointForTechnicals[],
  currentPrice: number
): { support: number; resistance: number } | null {
  if (points.length < 20) return null;

  const recent = points.slice(-60); // last ~3 months of daily data
  const lows = recent.map(p => p.low).filter(v => v > 0);
  const highs = recent.map(p => p.high).filter(v => v > 0);

  if (lows.length < 5 || highs.length < 5) return null;

  // Find support: highest low that is below current price
  const supportCandidates = lows.filter(l => l < currentPrice).sort((a, b) => b - a);
  // Find resistance: lowest high that is above current price
  const resistanceCandidates = highs.filter(h => h > currentPrice).sort((a, b) => a - b);

  // Use percentile-based approach for robustness
  const support = supportCandidates.length > 0
    ? supportCandidates[Math.min(2, supportCandidates.length - 1)] // ~3rd highest support
    : Math.min(...lows);

  const resistance = resistanceCandidates.length > 0
    ? resistanceCandidates[Math.min(2, resistanceCandidates.length - 1)] // ~3rd lowest resistance
    : Math.max(...highs);

  // Round appropriately based on price magnitude
  const precision = currentPrice > 1000 ? 0 : currentPrice > 10 ? 2 : 4;
  return {
    support: Number(support.toFixed(precision)),
    resistance: Number(resistance.toFixed(precision)),
  };
}
