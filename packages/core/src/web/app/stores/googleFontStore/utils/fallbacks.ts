import { DEFAULT_FALLBACK_FONT, FALLBACK_POSTSCRIPT_NAMES } from '../constants';

export const getFallbackPostScriptName = (fallbackFont: string): string => {
  return FALLBACK_POSTSCRIPT_NAMES[fallbackFont] || 'ArialMT';
};

export const getFallbackFont = (googleFontFamily: string): string => {
  const lowerFamily = googleFontFamily.toLowerCase();

  if (
    lowerFamily.includes('serif') ||
    lowerFamily.includes('times') ||
    lowerFamily.includes('georgia') ||
    lowerFamily.includes('playfair') ||
    lowerFamily.includes('baskerville')
  ) {
    return 'Times New Roman, serif';
  }

  if (
    lowerFamily.includes('mono') ||
    lowerFamily.includes('code') ||
    lowerFamily.includes('courier') ||
    lowerFamily.includes('console')
  ) {
    return 'Courier New, monospace';
  }

  if (
    lowerFamily.includes('display') ||
    lowerFamily.includes('bold') ||
    lowerFamily.includes('black') ||
    lowerFamily.includes('heavy')
  ) {
    return 'Arial Black, Arial, sans-serif';
  }

  return DEFAULT_FALLBACK_FONT;
};
