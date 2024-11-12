import fontkit, { FontCollection } from 'fontkit';

import communicator from 'implementations/communicator';
import { FontDescriptor, LocalFontHelper } from 'interfaces/IFont';

interface Font extends fontkit.Font {
  name?: {
    records: {
      fontFamily: {
        [key: string]: string;
      };
    };
  };
}

interface GeneralFont extends Font {
  fonts?: Font[];
}

export default {
  findFont(fontDescriptor: FontDescriptor): FontDescriptor {
    return communicator.sendSync('FIND_FONT', fontDescriptor);
  },
  findFonts(fontDescriptor: FontDescriptor): FontDescriptor[] {
    return communicator.sendSync('FIND_FONTS', fontDescriptor);
  },
  getAvailableFonts(): FontDescriptor[] {
    return communicator.sendSync('GET_AVAILABLE_FONTS');
  },
  substituteFont(postscriptName: string, text: string): FontDescriptor[] {
    return communicator.sendSync('SUBSTITUTE_FONT', postscriptName, text);
  },
  getFontName(font: FontDescriptor): string {
    let fontName = font.family;
    try {
      let fontInfo: GeneralFont = fontkit.openSync(font.path);
      if (fontInfo.fonts && fontInfo.fonts[0]) {
        fontInfo =
          fontInfo.fonts.find((f) => {
            if (f.familyName === font.family) return true;
            if (f.name.records.fontFamily[navigator.language] === font.family) return true;
            return false;
          }) || fontInfo.fonts[0];
      }
      if (fontInfo) {
        const firstNotEn = Object.keys(fontInfo.name.records.fontFamily).find(
          (key) => key !== 'en'
        );
        fontName =
          fontInfo.name.records.fontFamily[navigator.language] ||
          fontInfo.name.records.fontFamily[firstNotEn] ||
          fontInfo.name.records.fontFamily.en ||
          fontName;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`Error when get font name of ${font.family}:`, err);
    }
    return fontName;
  },
  getLocalFont: (font: FontDescriptor) => {
    try {
      const getFontDirectly = fontkit.openSync(font.path, font.postscriptName)

      if (getFontDirectly) {
        return getFontDirectly;
      }

      const getFontFromPath = fontkit.openSync(font.path);

      if (["TTF" , "WOFF" , "WOFF2"].includes(getFontFromPath.type)) {
        return getFontFromPath;
      }

      // Font Collection
      return (getFontFromPath as FontCollection).fonts[0];
    } catch {
      // Single Font
      return fontkit.openSync(font.path);
    }
  },
} as LocalFontHelper;
