import { match, P } from 'ts-pattern';

import type { GoogleFontFiles } from '@core/helpers/fonts/googleFontsApiCache';

import { WEIGHT_FALLBACK_ORDER } from '../constants';

export const getCSSWeight = (variant: string) =>
  match(variant)
    .with('regular', () => '400')
    .with('italic', () => '400:ital')
    .with(P.string.endsWith('italic'), (v) => v.replace('italic', ':ital'))
    .otherwise((variant) => variant);

export const discoverAvailableVariants = (variants: string[]) => {
  const available = new Set<keyof GoogleFontFiles>();

  for (const variant of variants) {
    match(variant)
      .with('regular', () => {
        available.add('regular');
        available.add('400');
      })
      .with('italic', () => {
        available.add('italic');
        available.add('400italic');
      })
      .with(P.string.endsWith('italic'), () => {
        const weight = variant.replace('italic', '');

        available.add(`${weight}italic` as keyof GoogleFontFiles);
      })
      .otherwise(() => {
        available.add(variant as keyof GoogleFontFiles);
      });
  }

  return available;
};

export const findBestVariant = (
  availableVariants: Set<keyof GoogleFontFiles>,
  requestedWeight: number,
  requestedStyle: 'italic' | 'normal',
): keyof GoogleFontFiles | null => {
  const createVariantKey = (style: 'italic' | 'normal', weight: number): keyof GoogleFontFiles =>
    match({ style, weight })
      .with({ style: 'normal', weight: 400 }, () => 'regular')
      .with({ style: 'italic', weight: 400 }, () => 'italic')
      .with({ style: 'italic' }, ({ weight }) => `${weight}italic`)
      .with({ style: 'normal' }, ({ weight }) => `${weight}`)
      .exhaustive() as keyof GoogleFontFiles;
  const exactKey = createVariantKey(requestedStyle, requestedWeight);

  if (availableVariants.has(exactKey)) {
    return exactKey;
  }

  for (const weight of WEIGHT_FALLBACK_ORDER) {
    const key = createVariantKey(requestedStyle, weight);

    if (availableVariants.has(key)) {
      return key;
    }
  }

  const alternateStyle = requestedStyle === 'normal' ? 'italic' : 'normal';

  for (const weight of WEIGHT_FALLBACK_ORDER) {
    const key = createVariantKey(alternateStyle, weight);

    if (availableVariants.has(key)) {
      console.warn(`Font variant fallback: ${requestedStyle} ${requestedWeight} → ${alternateStyle} ${weight}`);

      return key;
    }
  }

  return null;
};

export const buildGoogleFontURL = (
  fontFamily: string,
  options: { italicOnly?: boolean; weight: number } | { variant: string } | { weights: string[] },
): string => {
  const encodedFamily = fontFamily.replace(/ /g, '+');

  if ('variant' in options) {
    const cssWeight = getCSSWeight(options.variant);

    if (cssWeight.includes(':ital')) {
      return `https://fonts.googleapis.com/css2?family=${encodedFamily}:ital,wght@1,${cssWeight.replace(':ital', '')}&display=swap`;
    }

    return `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@${cssWeight}&display=swap`;
  }

  if ('weights' in options) {
    const formattedWeights = options.weights
      .map((w) => (w.includes(':ital') ? `1,${w.replace(':ital', '')}` : `0,${w}`))
      .join(';');

    return `https://fonts.googleapis.com/css2?family=${encodedFamily}:ital,wght@${formattedWeights}&display=swap`;
  }

  if (options.italicOnly) {
    return `https://fonts.googleapis.com/css2?family=${encodedFamily}:ital,wght@1,${options.weight}&display=swap`;
  }

  return `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@${options.weight}&display=swap`;
};
