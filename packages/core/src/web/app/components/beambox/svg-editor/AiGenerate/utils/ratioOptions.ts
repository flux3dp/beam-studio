import type { AspectRatio } from '../types';

/**
 * Represents a single aspect ratio option with its display configuration
 * Orientation is now implicit: width > height = landscape, width < height = portrait
 */
export interface RatioOption {
  aspectRatio: AspectRatio;
  displayLabel: string;
}

/**
 * All available ratio options
 * First 3 are always displayed, rest are in "More" menu
 */
export const ALL_RATIOS: RatioOption[] = [
  // Always displayed ratios
  { aspectRatio: '1:1', displayLabel: '1:1' },
  { aspectRatio: '4:3', displayLabel: '4:3' },
  { aspectRatio: '16:9', displayLabel: '16:9' },
  // Additional ratios (in "More" menu)
  { aspectRatio: '3:2', displayLabel: '3:2' },
  { aspectRatio: '2:3', displayLabel: '2:3' },
  { aspectRatio: '3:4', displayLabel: '3:4' },
  { aspectRatio: '9:16', displayLabel: '9:16' },
  { aspectRatio: '21:9', displayLabel: '21:9' },
] as const;

/**
 * Number of ratios always displayed (not in "More" menu)
 */
export const ALWAYS_DISPLAYED_COUNT = 3;

/**
 * Ratios that are always visible in the UI
 */
export const ALWAYS_DISPLAYED_RATIOS = ALL_RATIOS.slice(0, ALWAYS_DISPLAYED_COUNT);

/**
 * Additional ratios shown in the "More" dropdown menu
 */
export const ADDITIONAL_RATIOS = ALL_RATIOS.slice(ALWAYS_DISPLAYED_COUNT);
