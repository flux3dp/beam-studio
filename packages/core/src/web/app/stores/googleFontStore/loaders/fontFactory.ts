import type { GoogleFont } from '@core/interfaces/IFont';

import { DEFAULT_FONT_WEIGHT, WEIGHT_STYLES } from '../constants';
import { generateGoogleFontPostScriptName } from '../utils/fontNaming';

export const createGoogleFontObject = (
  fontFamily: string,
  weight = DEFAULT_FONT_WEIGHT,
  style: 'italic' | 'normal' = 'normal',
  binaryLoader: (fontFamily: string, weight?: number, style?: 'italic' | 'normal') => Promise<ArrayBuffer | null>,
): GoogleFont => {
  const italic = style === 'italic';
  const styleWeight = WEIGHT_STYLES[weight] || 'Regular';
  const displayStyle = italic ? `${styleWeight} Italic` : styleWeight;

  return {
    binaryLoader,
    family: fontFamily,
    italic,
    postscriptName: generateGoogleFontPostScriptName(fontFamily, weight, italic),
    source: 'google',
    style: displayStyle,
    weight,
  };
};
