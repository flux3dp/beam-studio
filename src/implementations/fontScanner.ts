import fontScanner from 'font-scanner';
import { FontDescriptor, IFontScanner } from 'interfaces/IFont';

export default {
  findFont(fontDescriptor: FontDescriptor): FontDescriptor {
    return fontScanner.findFontSync(fontDescriptor);
  },
  findFonts(fontDescriptor: FontDescriptor): FontDescriptor[] {
    return fontScanner.findFontsSync(fontDescriptor);
  },
  getAvailableFonts() {
    return fontScanner.getAvailableFontsSync();
  },
  substituteFont(postscriptName: string, text: string) {
    return fontScanner.substituteFontSync(postscriptName, text);
  },
} as IFontScanner;
