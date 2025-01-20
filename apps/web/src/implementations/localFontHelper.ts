import type { LocalFontHelper } from '@core/interfaces/IFont';

export default {
  findFont: () => null,
  findFonts: () => [],
  getAvailableFonts: () => [],
  getFontName: () => '',
  getLocalFont: () => undefined,
  substituteFont: () => null,
} as LocalFontHelper;
