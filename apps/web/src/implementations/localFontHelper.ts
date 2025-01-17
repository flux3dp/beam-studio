import { LocalFontHelper } from 'core-interfaces/IFont';

export default {
  findFont: () => null,
  findFonts: () => [],
  getAvailableFonts: () => [],
  substituteFont: () => null,
  getFontName: () => '',
  getLocalFont: () => undefined,
} as LocalFontHelper;
