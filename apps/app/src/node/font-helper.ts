import { ipcMain } from 'electron';
import { openSync } from 'fontkit';

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

// font-scanner's mac and Linux backends map the platform weight (CoreText trait, fontconfig
// scale) onto a 9-step table, so non-standard weights collapse: Noto Sans Mono Thin
// (usWeightClass 250) comes back as 400 and Chromium then renders Regular. Windows returns
// usWeightClass directly. Resolve the weight ourselves: a standard style name wins (Noto's Thin
// and ExtraLight files both carry 250, so the file alone cannot tell them apart), otherwise
// the named instance's wght for a variable font (its OS/2 table only describes the default
// instance), otherwise the OS/2 table.
const STYLE_WEIGHTS: Array<[RegExp, number]> = [
  [/thin|hairline/i, 100],
  [/extra ?light|ultra ?light/i, 200],
  [/light/i, 300],
  [/regular|normal|book|roman/i, 400],
  [/medium/i, 500],
  [/semi ?bold|demi ?bold/i, 600],
  [/bold/i, 700],
  [/extra ?bold|ultra ?bold/i, 800],
  [/black|heavy/i, 900],
];
const fileWeightCache = new Map<string, number>();
const withResolvedWeight = (font: Font, readFile: boolean): Font => {
  const named = STYLE_WEIGHTS.find(([re]) => re.test(font.style))?.[1];

  if (named) return { ...font, weight: named };

  if (!readFile || !font.path) return font;

  const key = `${font.path}#${font.postscriptName}`;
  let weight = fileWeightCache.get(key);

  if (weight === undefined) {
    try {
      const opened = openSync(font.path);
      const face = 'fonts' in opened ? opened.fonts.find((f) => f.postscriptName === font.postscriptName) : opened;

      // namedVariations is missing from @types/fontkit
      const instances = (face as undefined | { namedVariations?: Record<string, { wght?: number }> })?.namedVariations;

      weight = instances?.[font.style]?.wght ?? face?.['OS/2']?.usWeightClass ?? 0;
    } catch {
      weight = 0;
    }

    fileWeightCache.set(key, weight);
  }

  return weight >= 1 && weight <= 1000 ? { ...font, weight } : font;
};

const getAvailableFontsSync = (): Font[] =>
  (fontScanner?.getAvailableFontsSync() ?? []).map((font) => withResolvedWeight(font, false));

const findFontsSync = (arg: Font) => {
  const availableFonts = fontsListCache || getAvailableFontsSync();
  const matchFamily = availableFonts
    .filter((font) => font.family === arg.family)
    .map((font) => withResolvedWeight(font, true));
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
    const font = fontScanner?.findFontSync(arg);

    return font && withResolvedWeight(font, true);
  }

  arg.style = arg.style || 'Regular';

  const availableFonts = fontsListCache || getAvailableFontsSync();
  let font = availableFonts[0];
  let match = availableFonts.filter((f) => f.family === arg.family).map((font) => withResolvedWeight(font, true));

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
