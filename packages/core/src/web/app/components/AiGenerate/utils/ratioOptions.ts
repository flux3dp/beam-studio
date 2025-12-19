import type { AspectRatio } from '../types';

/**
 * Represents a single aspect ratio option with its display configuration
 * Orientation is now implicit: width > height = landscape, width < height = portrait
 */
export interface RatioOption {
  aspectRatio: AspectRatio;
  displayLabel: string;
}

/** Ratios that are always visible in the UI */
export const ALWAYS_DISPLAYED_RATIOS = [
  { aspectRatio: '1:1', displayLabel: '1:1' },
  { aspectRatio: '4:3', displayLabel: '4:3' },
  { aspectRatio: '16:9', displayLabel: '16:9' },
] as const;

/** Additional ratios shown in the "More" dropdown menu */
export const ADDITIONAL_RATIOS = [
  { aspectRatio: '3:2', displayLabel: '3:2' },
  { aspectRatio: '2:3', displayLabel: '2:3' },
  { aspectRatio: '3:4', displayLabel: '3:4' },
  { aspectRatio: '9:16', displayLabel: '9:16' },
  { aspectRatio: '21:9', displayLabel: '21:9' },
] as const;

export const ALL_RATIOS: RatioOption[] = [...ALWAYS_DISPLAYED_RATIOS, ...ADDITIONAL_RATIOS];
