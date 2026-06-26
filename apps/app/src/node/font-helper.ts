import { ipcMain } from 'electron';

import { FontEvents } from '@core/app/constants/ipcEvents';

import type Font from './interfaces/Fonts';

// `font-scanner` is a native module that can fail to load on some devices
// (e.g. missing system libraries). Loading it with a guarded require prevents
// the import error from crashing the main process and blocking the renderer.
// eslint-disable-next-line ts/consistent-type-imports
let fontScanner: null | typeof import('font-scanner') = null;

try {
  fontScanner = require('font-scanner');
} catch (error) {
  console.error('Failed to load font-scanner, font features will be unavailable:', error);
}

let fontsListCache: Font[] = [];

const getAvailableFontsSync = (): Font[] => fontScanner?.getAvailableFontsSync() ?? [];

const findFontsSync = (arg: Font) => {
  const availableFonts = fontsListCache || getAvailableFontsSync();
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

const findFontSync = (arg: Font): Font | undefined => {
  if (arg.postscriptName) {
    return fontScanner?.findFontSync(arg);
  }

  arg.style = arg.style || 'Regular';

  const availableFonts = fontsListCache || getAvailableFontsSync();
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
    const fonts = getAvailableFontsSync();

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
    const font = fontScanner?.substituteFontSync(postscriptName, text) ?? null;

    event.returnValue = font;
  });
};

export default {
  registerEvents,
};
