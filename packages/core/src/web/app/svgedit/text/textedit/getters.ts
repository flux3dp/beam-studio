import { getCurText } from './curText';

export const getFontFamily = (elem: SVGTextElement): string => {
  return elem.getAttribute('font-family') ?? getCurText().font_family;
};

/**
 * @deprecated
 * Returns the font family data of element
 * Used for mac, because we set font-family to font postscript name
 */
export const getFontFamilyData = (elem: SVGTextElement): string => {
  const dataFontFamily = elem.getAttribute('data-font-family');

  if (!dataFontFamily) return getFontFamily(elem);

  return dataFontFamily;
};

export const getFontPostscriptName = (elem: SVGTextElement): string => {
  return elem.getAttribute('font-postscript') ?? getCurText().font_postscriptName;
};

export const getFontSize = (elem: SVGTextElement): number => {
  const fontSize = elem.getAttribute('font-size');

  if (!fontSize) return Number(getCurText().font_size);

  return Number.parseFloat(fontSize);
};

export const getFontWeight = (elem: SVGTextElement): number => {
  return Number(elem.getAttribute('font-weight'));
};

export const getIsVertical = (elem: SVGTextElement): boolean => {
  return elem.getAttribute('data-verti') === 'true';
};

export const getItalic = (elem: SVGTextElement): boolean => {
  return elem.getAttribute('font-style') === 'italic';
};

export const getLetterSpacing = (elem: SVGTextElement): number => {
  const val = elem.getAttribute('letter-spacing');

  if (val) {
    if (val.toLowerCase().endsWith('em')) {
      return Number.parseFloat(val.slice(0, -2));
    }

    console.warn('letter-spacing should be em!');
  }

  return 0;
};

export const getLineSpacing = (elem: SVGTextElement): number => {
  return Number.parseFloat(elem.getAttribute('data-line-spacing') || '1');
};

export const isFitText = (elem: Element): boolean => {
  return elem.getAttribute('data-fit-text') === 'true';
};

export const getFitTextSize = (elem: Element): number => {
  return Number.parseFloat(elem.getAttribute('data-fit-text-size') || '0');
};

export type FitTextAlign = 'end' | 'justify' | 'middle' | 'start';

export const getFitTextAlign = (elem: Element): FitTextAlign => {
  const val = elem.getAttribute('data-fit-text-align');

  if (val === 'middle' || val === 'end' || val === 'justify') return val;

  return 'start';
};

export const getTextContent = (elem: SVGTextElement): string =>
  Array.from(elem.childNodes)
    .filter((child) => child.nodeName === 'tspan')
    .map((child) => child.textContent ?? '')
    .join('\n');
