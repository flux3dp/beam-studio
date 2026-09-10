/**
 * Editing text element attribute
 */

export { getCurText, initCurText, updateCurText, useDefaultFont } from './curText';
export type { FitTextAlign } from './getters';
export {
  getColumnCount,
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
  isParamsLabel,
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
  textContentEvents,
} from './setters';

// Default export for backward compatibility
import { getCurText, updateCurText, useDefaultFont } from './curText';
import {
  getColumnCount,
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
  isParamsLabel,
} from './getters';
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
  textContentEvents,
} from './setters';

export default {
  getColumnCount,
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
  isFitText,
  isParamsLabel,
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
  textContentEvents,
  updateCurText,
  useDefaultFont,
};
