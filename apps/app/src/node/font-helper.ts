import { ipcMain } from 'electron';
import fontScanner from 'font-scanner';

import { FontEvents } from '@core/app/constants/ipcEvents';

import type Font from './interfaces/Fonts';

let fontsListCache: Font[] = [];

const findFontsSync = (arg: Font) => {
  const availableFonts = fontsListCache || fontScanner.getAvailableFontsSync();
  const matchFamily = availableFonts.filter((font) => font.family === arg.family);
  const match = matchFamily.filter((font) => {
    let result = true;

    Object.getOwnPropertyNames(arg).forEach((a) => {
      if (arg[a as keyof Font] !== font[a as keyof Font]) {
        result = false;
      }
    });

    return result;
  });

  return match;
};

const findFontSync = (arg: Font) => {
  if (arg.postscriptName) {
    return fontScanner.findFontSync(arg);
  }

  arg.style = arg.style || 'Regular';

  const availableFonts = fontsListCache || fontScanner.getAvailableFontsSync();
  let font = availableFonts[0];
  let match = availableFonts.filter((f) => f.family === arg.family);

  font = match[0] || font;

  if (arg.italic != null) {
    match = match.filter((f) => f.italic === arg.italic);
    font = match[0] || font;
  }

  match = match.filter((f) => f.style === arg.style);
  font = match[0] || font;

  if (arg.weight != null) {
    match = match.filter((f) => f.weight === arg.weight);
  }

  font = match[0] || font;

  return font;
};

const registerEvents = (): void => {
  ipcMain.on(FontEvents.GetAvailableFonts, (event) => {
    const fonts = fontScanner.getAvailableFontsSync();

    fontsListCache = fonts;
    event.returnValue = fonts;
  });

  ipcMain.on(FontEvents.FindFonts, (event, arg) => {
    const fonts = findFontsSync(arg);

    event.returnValue = fonts;
  });

  ipcMain.on(FontEvents.FindFont, (event, arg) => {
    const font = findFontSync(arg);

    event.returnValue = font;
  });

  ipcMain.on(FontEvents.SubstituteFont, (event, postscriptName, text) => {
    const font = fontScanner.substituteFontSync(postscriptName, text);

    event.returnValue = font;
  });
};

export default {
  registerEvents,
};
