import { useEffect, useState } from 'react';

type TipIndex = 0 | 1 | 2 | 3 | 4;

/**
 * Calculate tip index from elapsed time.
 * Returns 0-4 based on time thresholds: 0-15s, 15-30s, 30-60s, 60-90s, >90s
 */
const calculateTipIndex = (startTime: number): TipIndex => {
  const elapsed = Date.now() - startTime;

  if (elapsed > 90000) return 4;

  if (elapsed > 60000) return 3;

  if (elapsed > 30000) return 2;

  if (elapsed > 15000) return 1;

  return 0;
};

/**
 * Hook to calculate a tip index based on elapsed time since a start timestamp.
 * Used to show progressively different loading tips during AI generation.
 *
 * @param startTime - The timestamp when the operation started (in ms)
 * @returns A tip index (0-4) based on elapsed time
 */
export const useTipIndex = (startTime: number): TipIndex => {
  const [tipIndex, setTipIndex] = useState<TipIndex>(() => calculateTipIndex(startTime));

  useEffect(() => {
    // Reset immediately when startTime changes
    setTipIndex(calculateTipIndex(startTime));

    const interval = setInterval(() => {
      setTipIndex(calculateTipIndex(startTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return tipIndex;
};
