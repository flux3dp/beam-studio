import { WEIGHT_STYLES } from '../constants';

export const generateGoogleFontPostScriptName = (family: string, weight: number, italic: boolean): string => {
  const cleanFamily = family.replace(/\s+/g, '');
  const weightStyle = WEIGHT_STYLES[weight] || 'Regular';
  const suffix = italic ? `${weightStyle}Italic` : weightStyle;

  return `${cleanFamily}-${suffix}`;
};
