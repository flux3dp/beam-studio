import type { AspectRatio, Orientation } from '../types';

/**
 * Represents a single aspect ratio option with its display configuration
 */
export interface RatioOption {
  aspectRatio: AspectRatio;
  displayLabel: string;
  orientation: Orientation;
}

/**
 * All available ratio options
 * First 3 are always displayed, rest are in "More" menu
 */
export const ALL_RATIOS: RatioOption[] = [
  // Always displayed ratios
  { aspectRatio: '1:1', displayLabel: '1:1', orientation: 'landscape' },
  { aspectRatio: '4:3', displayLabel: '4:3', orientation: 'landscape' },
  { aspectRatio: '16:9', displayLabel: '16:9', orientation: 'landscape' },
  // Additional ratios (in "More" menu)
  { aspectRatio: '3:2', displayLabel: '3:2', orientation: 'landscape' },
  { aspectRatio: '3:2', displayLabel: '2:3', orientation: 'portrait' },
  { aspectRatio: '4:3', displayLabel: '3:4', orientation: 'portrait' },
  { aspectRatio: '16:9', displayLabel: '9:16', orientation: 'portrait' },
];

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
