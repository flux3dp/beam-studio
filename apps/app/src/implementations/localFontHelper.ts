import type { FontCollection, Font as FontkitFont } from 'fontkit';
import { openSync } from 'fontkit';

import { FontEvents } from '@core/app/constants/ipcEvents';
import communicator from '@core/implementations/communicator';
import type { FontDescriptor, LocalFontHelper } from '@core/interfaces/IFont';

interface Font extends FontkitFont {
  name?: { records: { fontFamily: Record<string, string> } };
}

export default {
  findFont(fontDescriptor: FontDescriptor): FontDescriptor {
    return communicator.sendSync(FontEvents.FindFont, fontDescriptor);
  },
  findFonts(fontDescriptor: FontDescriptor): FontDescriptor[] {
    return communicator.sendSync(FontEvents.FindFonts, fontDescriptor);
  },
  getAvailableFonts(): FontDescriptor[] {
    return communicator.sendSync(FontEvents.GetAvailableFonts);
  },
  getFontName(font: FontDescriptor): string {
    let fontName = font.family;

    try {
      const res = openSync(font?.path || '');
      let fontkitFont: Font;

      if ('fonts' in res && res.fonts && res.fonts[0]) {
        // Font Collection
        fontkitFont =
          res.fonts.find((f) => {
            if (f.familyName === font.family) {
              return true;
            }

            if (f.getName('fontFamily', navigator.language) === font.family) {
              return true;
            }

            return false;
          }) || res.fonts[0];
      } else {
        fontkitFont = res as Font;
      }

      if (fontkitFont.name) {
        const firstNotEn = Object.keys(fontkitFont.name.records.fontFamily).find((key) => key !== 'en');

        fontName =
          fontkitFont.name.records.fontFamily[navigator.language] ||
          fontkitFont.name.records.fontFamily[firstNotEn || ''] ||
          fontkitFont.getName('fontFamily', navigator.language) ||
          fontName;
      }
    } catch (err) {
      console.warn(`Error when get font name of ${font.family}:`, err);
    }

    return fontName || '';
  },
  getLocalFont: (font: FontDescriptor) => {
    try {
      const getFontDirectly = openSync(font.path ?? '', font.postscriptName);

      if (getFontDirectly) {
        return getFontDirectly;
      }

      const getFontFromPath = openSync(font.path ?? '');

      if (['TTF', 'WOFF', 'WOFF2'].includes(getFontFromPath.type)) {
        return getFontFromPath;
      }

      // Font Collection
      return (getFontFromPath as FontCollection).fonts[0];
    } catch {
      // Single Font
      const getFontFromPath = openSync(font.path ?? '');

      // @ts-expect-error
      if (getFontFromPath.namedVariations[font.style]) {
        // @ts-expect-error
        return getFontFromPath.getVariation(getFontFromPath.namedVariations[font.style]);
      }

      return getFontFromPath;
    }
  },
  substituteFont(postscriptName: string, text: string): FontDescriptor[] {
    return communicator.sendSync(FontEvents.SubstituteFont, postscriptName, text);
  },
} as LocalFontHelper;
