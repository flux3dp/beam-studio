/**
 * Editing text element attribute
 */

export { getCurText, initCurText, updateCurText, useDefaultFont } from './curText';
export type { FitTextAlign, TextTransform } from './getters';
export {
  applyTextTransform,
  getFitTextAlign,
  getFitTextSize,
  getFontFamily,
  getFontFamilyData,
  getFontPostscriptName,
  getFontSize,
  getFontWeight,
  getIsVertical,
  getItalic,
  getLetterSpacing,
  getLineSpacing,
  getTextContent,
  getTextTransform,
  isFitText,
} from './getters';
export { renderAll, renderText } from './renderText';
export {
  setFitTextAlign,
  setFontFamily,
  setFontPostscriptName,
  setFontSize,
  setFontWeight,
  setIsVertical,
  setItalic,
  setLetterSpacing,
  setLineSpacing,
  setTextContent,
  setTextTransform,
  textContentEvents,
} from './setters';

// Default export for backward compatibility
import { getCurText, updateCurText, useDefaultFont } from './curText';
import {
  getFitTextAlign,
  getFitTextSize,
  getFontFamily,
  getFontFamilyData,
  getFontPostscriptName,
  getFontSize,
  getFontWeight,
  getIsVertical,
  getItalic,
  getLetterSpacing,
  getLineSpacing,
  getTextContent,
  isFitText,
} from './getters';
import { applyTextTransform, getTextTransform } from './getters';
import { renderText } from './renderText';
import {
  setFitTextAlign,
  setFontFamily,
  setFontPostscriptName,
  setFontSize,
  setFontWeight,
  setIsVertical,
  setItalic,
  setLetterSpacing,
  setLineSpacing,
  setTextContent,
  setTextTransform,
  textContentEvents,
} from './setters';

export default {
  applyTextTransform,
  getCurText,
  getFitTextAlign,
  getFitTextSize,
  getFontFamily,
  getFontFamilyData,
  getFontPostscriptName,
  getFontSize,
  getFontWeight,
  getIsVertical,
  getItalic,
  getLetterSpacing,
  getLineSpacing,
  getTextContent,
  getTextTransform,
  isFitText,
  renderText,
  setFitTextAlign,
  setFontFamily,
  setFontPostscriptName,
  setFontSize,
  setFontWeight,
  setIsVertical,
  setItalic,
  setLetterSpacing,
  setLineSpacing,
  setTextContent,
  setTextTransform,
  textContentEvents,
  updateCurText,
  useDefaultFont,
};
