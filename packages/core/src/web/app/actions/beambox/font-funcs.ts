import type * as fontkit from 'fontkit';
import { sprintf } from 'sprintf-js';
import { match, P } from 'ts-pattern';

import Alert from '@core/app/actions/alert-caller';
import Progress from '@core/app/actions/progress-caller';
import AlertConstants from '@core/app/constants/alert-constants';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { useGoogleFontStore } from '@core/app/stores/googleFontStore';
import history from '@core/app/svgedit/history/history';
import { moveElements } from '@core/app/svgedit/operations/move';
import textedit from '@core/app/svgedit/text/textedit';
import { discoverManager } from '@core/helpers/api/discover';
import SvgLaserParser from '@core/helpers/api/svg-laser-parser';
import updateElementColor from '@core/helpers/color/updateElementColor';
import type { AttributeMap } from '@core/helpers/element/attribute';
import { getAttributes, setAttributes } from '@core/helpers/element/attribute';
import { toggleUnsavedChangedDialog } from '@core/helpers/file/export';
import fontHelper from '@core/helpers/fonts/fontHelper';
import { getOS } from '@core/helpers/getOS';
import { hashMap } from '@core/helpers/hashHelper';
import i18n from '@core/helpers/i18n';
import isWeb from '@core/helpers/is-web';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import weldPath from '@core/helpers/weldPath';
import localFontHelper from '@core/implementations/localFontHelper';
import storage from '@core/implementations/storage';
import type { FontDescriptor, GeneralFont, GoogleFont, IFontQuery } from '@core/interfaces/IFont';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { loadGoogleFont, loadWebFont } from './font-funcs.util';

let svgCanvas: ISVGCanvas;
let svgedit: any;

getSVGAsync(({ Canvas, Edit }) => {
  svgCanvas = Canvas;
  svgedit = Edit;
});

const svgWebSocket = SvgLaserParser({ type: 'svgeditor' });
const fontObjCache = new Map<string, fontkit.Font>();

const SubstituteResult = { CANCEL_OPERATION: 0, DO_NOT_SUB: 1, DO_SUB: 2 } as const;

type SubstituteResultType = (typeof SubstituteResult)[keyof typeof SubstituteResult];

export const ConvertResult = { CANCEL_OPERATION: 0, CONTINUE: 2, UNSUPPORT: 1 } as const;
export type ConvertResultType = (typeof ConvertResult)[keyof typeof ConvertResult];

export type ConvertToTextPathResult =
  | { command: IBatchCommand; path: SVGPathElement; status: ConvertResultType }
  | { command: null; path: null; status: ConvertResultType };

type IConvertInfo = null | {
  d: string | string[];
  moveElement?: { x: number; y: number };
  transform: null | string;
};

// a simple memoize function that takes in a function
// and returns a memoized function
const memoize = <T extends (arg: any) => any>(fn: T): T => {
  const cache: Record<string, ReturnType<T>> = {};

  return ((...args: Parameters<T>): ReturnType<T> => {
    const n = args[0];

    if (n in cache) return cache[n];

    const result = fn(n);

    cache[n] = result;

    return result;
  }) as T;
};

let fontNameMapObj: Record<string, string> = storage.get('font-name-map') || {};

if (fontNameMapObj.navigatorLang !== navigator.language) {
  fontNameMapObj = {};
}

const fontNameMap = new Map<string, string>();

// Cache for available font families and lowercase mappings for O(1) lookup
let lowercaseFontFamilyMap: Map<string, string> | null = null;

const requestAvailableFontFamilies = (withoutMonotype = false) => {
  // get all available fonts in local
  const fonts = fontHelper.getAvailableFonts(withoutMonotype);

  fonts.forEach((font) => {
    const family = font.family!;

    if (!fontNameMap.get(family)) {
      const fontName = fontNameMapObj[family] ? fontNameMapObj[family] : fontHelper.getFontName(font);

      fontNameMap.set(family, typeof fontName === 'string' ? fontName : family);
    }
  });

  fontNameMap.forEach((value: string, key: string) => {
    fontNameMapObj[key] = value;
  });
  fontNameMapObj.navigatorLang = navigator.language;
  storage.set('font-name-map', fontNameMapObj);

  const fontFamilySet = new Set<string>();

  fonts.map((font) => fontFamilySet.add(font.family!));

  const sortedFamilies = Array.from(fontFamilySet).sort((a, b) =>
    String(a ?? '').localeCompare(String(b ?? ''), undefined, { sensitivity: 'base' }),
  );

  lowercaseFontFamilyMap = new Map(sortedFamilies.map((family) => [family.toLowerCase(), family]));

  return sortedFamilies;
};

// Optimized O(1) case-insensitive font family lookup
const findFontFamilyCaseInsensitive = (family: string): string | undefined => {
  if (!lowercaseFontFamilyMap) {
    requestAvailableFontFamilies();
  }

  return lowercaseFontFamilyMap!.get(family.toLowerCase());
};

const getFontOfPostscriptName = memoize((postscriptName: string) => {
  // Check if font is already registered in the registry
  const registeredFont = useGoogleFontStore.getState().getRegisteredFont(postscriptName);

  if (registeredFont) {
    return registeredFont;
  }

  if (getOS() === 'MacOS') {
    return fontHelper.findFont({ postscriptName });
  }

  const allFonts = fontHelper.getAvailableFonts();
  const fit = allFonts.filter((f) => f.postscriptName === postscriptName);

  return (fit.length > 0 ? fit : allFonts)[0];
});

const init = () => {
  getFontOfPostscriptName('ArialMT');
};

init();

const requestFontsOfTheFontFamily = memoize((family: string) => Array.from(fontHelper.findFonts({ family })));

const requestFontByFamilyAndStyle = ({ family, italic, style, weight }: IFontQuery): GeneralFont =>
  fontHelper.findFont({ family, italic, style, weight });

export const getFontObj = async (font: GeneralFont): Promise<fontkit.Font | undefined> => {
  const { postscriptName } = font;

  if (!postscriptName) {
    console.error('Font object is missing a postscriptName.', font);

    return undefined;
  }

  try {
    // 1. Check the cache first for performance
    const cachedFont = fontObjCache.get(postscriptName);

    if (cachedFont) {
      return cachedFont;
    }

    // 2. If not cached, determine the font type and load it
    const fontObject = await match(font)
      .with({ path: P.string }, (font) => localFontHelper.getLocalFont(font))
      .with({ source: 'google' }, async (font) => await loadGoogleFont(font as GoogleFont))
      .otherwise(async (font) => await loadWebFont(font));

    // 3. If loaded successfully, add it to the cache
    if (fontObject) {
      fontObjCache.set(postscriptName, fontObject);
    }

    return fontObject;
  } catch (err) {
    console.error(`Unable to get fontObj for ${postscriptName}:`, err);

    return undefined;
  }
};

export const convertTextToPathByFontkit = (
  textElem: Element,
  fontObj: fontkit.Font | undefined,
  pathPerChar: boolean,
): IConvertInfo => {
  try {
    if (!fontObj) {
      throw new Error('Unable to get fontObj');
    }

    // Debug: Check if font has glyphs for the text
    const allText = textElem.textContent || '';
    const uniqueChars = [...new Set(allText)];
    const missingGlyphs = uniqueChars.filter((char) => {
      const codePoint = char.codePointAt(0);

      return codePoint !== undefined && !fontObj.hasGlyphForCodePoint(codePoint);
    });

    if (missingGlyphs.length > 0) {
      console.warn(`Font ${fontObj.postscriptName} missing glyphs for characters:`, missingGlyphs);
      console.warn(
        `Character codes:`,
        missingGlyphs.map((c) => `${c} (U+${c.codePointAt(0)?.toString(16).toUpperCase()})`),
      );
    }

    const maxChar = 0xffff;
    const fontSize = textedit.getFontSize(textElem as SVGTextElement);
    const sizeRatio = fontSize / fontObj.unitsPerEm;
    let d: string[] = [];
    const textPaths = textElem.querySelectorAll('textPath');

    textPaths.forEach((textPath) => {
      let alignOffset = 0;
      const text = textPath.textContent;
      const charCount = textPath.getNumberOfChars();
      const alignmentBaseline = textPath.getAttribute('alignment-baseline');
      const dominantBaseline = textPath.getAttribute('dominant-baseline');

      if (alignmentBaseline || dominantBaseline) {
        textPath.textContent = 'i';

        const { x, y } = textPath.getBBox();

        textPath.removeAttribute('alignment-baseline');
        textPath.removeAttribute('dominant-baseline');

        const { x: x2, y: y2 } = textPath.getBBox();

        alignOffset = Math.hypot(x - x2, y - y2);
        textPath.setAttribute('alignment-baseline', alignmentBaseline!);
        textPath.setAttribute('dominant-baseline', dominantBaseline!);
        textPath.textContent = text;
      }

      const run = fontObj.layout(text!);
      const { direction, glyphs, positions } = run;
      const isRtl = direction === 'rtl';

      // Debug: Check if layout produced glyphs
      if (glyphs.length === 0 && text && text.length > 0) {
        console.error(`No glyphs produced for textPath: "${text}" with font ${fontObj.postscriptName}`);
      }

      if (isRtl) {
        glyphs.reverse();
        positions.reverse();
      }

      let i = 0;

      d.push(
        ...glyphs.map((char, idx) => {
          if (i >= charCount) return '';

          const pos = positions[idx];
          const start = textPath.getStartPositionOfChar(i);
          const end = textPath.getEndPositionOfChar(i);

          if ([start.x, start.y, end.x, end.y].every((v) => v === 0)) {
            return '';
          }

          const rot = (textPath.getRotationOfChar(i) / 180) * Math.PI;
          const { x, y } = isRtl ? end : start;

          char.codePoints.forEach((codePoint) => {
            i = codePoint > maxChar ? i + 2 : i + 1;
          });

          return char.path
            .translate(pos.xOffset, pos.yOffset)
            .scale(sizeRatio, -sizeRatio)
            .translate(0, alignOffset)
            .rotate(rot)
            .translate(x, y)
            .toSVG();
        }),
      );
    });

    const tSpans = textElem.querySelectorAll('tspan');

    tSpans.forEach((tspan) => {
      const text = tspan.textContent;
      const charCount = tspan.getNumberOfChars();
      const run = fontObj.layout(text!);
      const { direction, glyphs, positions } = run;
      const isRtl = direction === 'rtl';

      // Debug: Check if layout produced glyphs
      if (glyphs.length === 0 && text && text.length > 0) {
        console.error(`No glyphs produced for textPath: "${text}" with font ${fontObj.postscriptName}`);
      }

      if (isRtl) {
        glyphs.reverse();
        positions.reverse();
      }

      let i = 0;

      d.push(
        ...glyphs.map((char, idx) => {
          if (i >= charCount) return '';

          const pos = positions[idx];
          const start = tspan.getStartPositionOfChar(i);
          const end = tspan.getEndPositionOfChar(i);
          const { x, y } = isRtl ? end : start;

          char.codePoints.forEach((codePoint) => {
            i = codePoint > maxChar ? i + 2 : i + 1;
          });

          return char.path.translate(pos.xOffset, pos.yOffset).scale(sizeRatio, -sizeRatio).translate(x, y).toSVG();
        }),
      );
    });

    return { d: pathPerChar ? d : d.join(' '), transform: textElem.getAttribute('transform') };
  } catch (err) {
    console.error(`Unable to handle font ${textElem.getAttribute('font-postscript')} by fontkit, ${err}`);

    return null;
  }
};

const getPathAndTransformFromSvg = async (data: any, isFilled: boolean) =>
  new Promise<{ d: string; transform: string }>((resolve) => {
    const fileReader = new FileReader();

    fileReader.onloadend = (e) => {
      const svgString = e.target!.result as string;
      const dRegex = svgString.match(/ d="([^"]+)"/g);
      const transRegex = svgString.match(/transform="([^"]+)/);
      const d = dRegex ? dRegex.map((p) => p.substring(4, p.length - 1))?.join('') : '';
      const transform = transRegex ? transRegex[1] : '';

      resolve({ d, transform });
    };

    fileReader.readAsText(data[isFilled ? 'colors' : 'strokes']);
  });

const convertTextToPathByGhost = async (
  textElem: Element,
  isFilled: boolean,
  font: GeneralFont,
): Promise<IConvertInfo> => {
  const origFontFamily = textElem.getAttribute('font-family')!;

  try {
    if ('hasLoaded' in font) {
      throw new Error('Monotype');
    }

    const web = isWeb();

    if (!web && !('path' in font)) {
      throw new Error('Web font');
    }

    if (web && !discoverManager.checkConnection()) {
      throw new Error('No connection');
    }

    const bbox = svgCanvas.calculateTransformedBBox(textElem);
    const { postscriptName } = font;
    const res = await fontHelper.getWebFontAndUpload(postscriptName!);

    if (!res) {
      throw new Error('Error when uploading');
    }

    if (fontHelper.usePostscriptAsFamily(font)) {
      textElem.setAttribute('font-family', textElem.getAttribute('font-postscript')!);
    }

    await svgWebSocket.uploadPlainTextSVG(textElem, bbox);

    const outputs = await svgWebSocket.divideSVG({ scale: 1, timeout: 15000 });

    if (!outputs.res) {
      throw new Error(`Fluxsvg: ${outputs.data}`);
    }

    const convertRes = await getPathAndTransformFromSvg(outputs.data, isFilled);

    return { ...convertRes, moveElement: bbox };
  } catch (err) {
    console.error(`Unable to handle font ${textElem.getAttribute('font-postscript')} by ghost, ${err}`);

    return null;
  } finally {
    if (fontHelper.usePostscriptAsFamily(font)) {
      textElem.setAttribute('font-family', origFontFamily);
    }
  }
};

const getUnsupportedChar = async (font: GeneralFont, textContent: string[]): Promise<null | string[]> => {
  const fontObj = await getFontObj(font);

  if (fontObj) {
    try {
      return textContent.filter((c) => !fontObj.hasGlyphForCodePoint(c.codePointAt(0)!));
    } catch (err) {
      console.error(`Unable to get unsupported characters for font ${font.postscriptName}:`, err);
    }
  }

  return textContent;
};

const substitutedFont = async (font: GeneralFont, textElement: Element) => {
  const originFont = getFontOfPostscriptName(textElement.getAttribute('font-postscript')!);
  const fontFamily = textElement.getAttribute('font-family');
  const text = textElement.textContent;

  // Escape for Whitelists
  const whiteList = ['標楷體'];
  const whiteKeyWords = ['華康', 'Adobe', '文鼎'];

  if (whiteList.includes(fontFamily!)) {
    return { font: originFont };
  }

  for (const keyword of whiteKeyWords) {
    if (fontFamily && fontFamily.includes(keyword)) {
      return { font: originFont };
    }
  }

  // if only contain basic character (123abc!@#$...), don't substitute.
  // because my Mac cannot substituteFont properly handing font like 'Windings'
  // but we have to substitute text if text contain both English and Chinese
  const textOnlyContainBasicLatin = Array.from(text!).every((char: string) => char.charCodeAt(0) <= 0x007f);

  if (textOnlyContainBasicLatin) {
    return { font: originFont };
  }
  // array of used family which are in the text

  const originPostscriptName = originFont.postscriptName;
  const fontOptions: Record<string, GeneralFont> = { originPostscriptName: font };
  const textContent = [...new Set(Array.from(text!))];
  let fontList: GeneralFont[] = [font];
  let unsupportedChar = (await getUnsupportedChar(originFont, textContent)) ?? [];

  if (unsupportedChar && unsupportedChar.length === 0) {
    return { font: originFont };
  }

  if (!isWeb()) {
    unsupportedChar = [];
    textContent.forEach((char) => {
      const sub = localFontHelper.substituteFont(originPostscriptName!, char) as FontDescriptor;

      if (sub.postscriptName !== originPostscriptName) {
        unsupportedChar.push(char);
      }

      if (!fontOptions[sub.postscriptName!]) {
        fontOptions[sub.postscriptName!] = sub;
      }
    });
    fontList = Object.values(fontOptions);

    if (fontList.length === 1) {
      return { font: fontList[0], unsupportedChar };
    }

    // Test all found fonts if they contain all
    for (const font of fontList) {
      let allFit = true;

      for (const char of text ?? '') {
        const foundFont = localFontHelper.substituteFont(font.postscriptName!, char);

        if (font.postscriptName !== foundFont!.postscriptName) {
          allFit = false;
          break;
        }
      }

      if (allFit) {
        return { font, unsupportedChar };
      }
    }
    console.error('Cannot find a font fit for all');
  }

  // Test all found fonts and Noto fonts with fontkit and select the best one
  const NotoFamilySuffixes = ['', ' TC', ' HK', ' SC', ' JP', ' KR'];

  for (const suffix of NotoFamilySuffixes) {
    const family = `Noto Sans${suffix}`;
    const res = fontHelper.findFont({ ...font, family, postscriptName: undefined });

    fontList.push(res);
  }

  let minFailure = Number.MIN_VALUE;
  let bestFont = fontList[0];

  for (const currentFont of fontList) {
    const unsupported = await getUnsupportedChar(currentFont, textContent);

    if (unsupported) {
      if (currentFont.postscriptName === font.postscriptName) {
        unsupportedChar = unsupported;
      }

      if (unsupported.length === 0) {
        return { font: currentFont, unsupportedChar };
      }

      if (unsupported.length < minFailure) {
        minFailure = unsupported.length;
        bestFont = currentFont;
      }
    }
  }

  return { font: bestFont, unsupportedChar };
};

const showSubstitutedFamilyPopup = (newFont: string) =>
  new Promise<SubstituteResultType>((resolve) => {
    const LANG = i18n.lang.beambox.object_panels;
    const message = sprintf(LANG.text_to_path.font_substitute_pop, fontNameMap.get(newFont));
    const buttonLabels = [i18n.lang.alert.confirm, LANG.text_to_path.use_current_font, i18n.lang.alert.cancel];
    const callbacks = [
      () => resolve(SubstituteResult.DO_SUB),
      () => resolve(SubstituteResult.DO_NOT_SUB),
      () => resolve(SubstituteResult.CANCEL_OPERATION),
    ];

    Alert.popUp({
      buttonLabels,
      callbacks,
      message,
      primaryButtonIndex: 0,
      type: AlertConstants.SHOW_POPUP_WARNING,
    });
  });

const calculateFilled = (textElement: Element) => {
  if (Number.parseInt(textElement.getAttribute('fill-opacity')!, 10) === 0) {
    return false;
  }

  const fillAttr = textElement.getAttribute('fill')!;

  if (['#fff', '#ffffff', 'none'].includes(fillAttr)) {
    return false;
  }

  if (fillAttr || fillAttr === null) {
    return true;
  }

  return false;
};

const setTextPostscriptNameIfNeeded = (textElement: Element) => {
  if (!textElement.getAttribute('font-postscript')) {
    const font = requestFontByFamilyAndStyle({
      family: textElement.getAttribute('font-family')!,
      italic: textElement.getAttribute('font-style')! === 'italic',
      style: undefined,
      weight: Number.parseInt(textElement.getAttribute('font-weight')!, 10),
    });

    textElement.setAttribute('font-postscript', font.postscriptName!);
  }
};

const createPathElement = (d: string, textAttr: AttributeMap) => {
  const path = document.createElementNS(svgedit.NS.SVG, 'path') as unknown as SVGPathElement;

  setAttributes(path, {
    ...textAttr,
    d,
    id: svgCanvas.getNextId(),
    'stroke-dasharray': 'none',
    'stroke-opacity': '1',
  });
  path.addEventListener('mouseover', svgCanvas.handleGenerateSensorArea);
  path.addEventListener('mouseleave', svgCanvas.handleGenerateSensorArea);
  svgCanvas.pathActions.fixEnd(path);

  return path;
};

const convertTextToPath = async (
  textElement: Element,
  opts?: { isSubCommand?: boolean; pathPerChar?: boolean; weldingTexts?: boolean },
): Promise<ConvertToTextPathResult> => {
  const LANG = i18n.lang.beambox.object_panels;

  if (!textElement.textContent) {
    console.warn('Text element has no content, skipping conversion.');

    return { command: null, path: null, status: ConvertResult.CONTINUE };
  }

  await Progress.openNonstopProgress({ id: 'parsing-font', message: LANG.wait_for_parsing_font });

  let newPathElement: SVGPathElement;

  try {
    const { isSubCommand = false, pathPerChar = false, weldingTexts = false } = opts || {};
    const globalPreference = useGlobalPreferenceStore.getState();

    setTextPostscriptNameIfNeeded(textElement);

    // Create a batch command for the undo/redo manager. Groups all changes into one undo step.
    const batchCmd = new history.BatchCommand('Text to Path');
    const origFontPostscriptName = textElement.getAttribute('font-postscript')!;
    // Get the Font object based on the PostScript name.
    let font = getFontOfPostscriptName(origFontPostscriptName);
    // Asynchronously load the font data object (e.g., using opentype.js or similar).
    let fontObj = await getFontObj(font);

    let hasUnsupportedFont = false;

    if (globalPreference['font-substitute']) {
      const { font: newFont, unsupportedChar } = await substitutedFont(font, textElement);

      if (newFont.postscriptName !== origFontPostscriptName && unsupportedChar && unsupportedChar.length > 0) {
        hasUnsupportedFont = true;

        const doSub = await showSubstitutedFamilyPopup(newFont.family!);

        if (doSub === SubstituteResult.DO_SUB) {
          svgCanvas.undoMgr.beginUndoableChange('font-family', [textElement]);
          textElement.setAttribute('font-family', newFont.family!);
          batchCmd.addSubCommand(svgCanvas.undoMgr.finishUndoableChange());
          svgCanvas.undoMgr.beginUndoableChange('font-postscript', [textElement]);
          textElement.setAttribute('font-postscript', newFont.postscriptName!);
          batchCmd.addSubCommand(svgCanvas.undoMgr.finishUndoableChange());
          fontObj = await getFontObj(newFont);
          font = newFont;
        } else if (doSub === SubstituteResult.CANCEL_OPERATION) {
          // User cancelled the entire operation from the popup.
          console.log('Font substitution cancelled by user.');

          // Return CANCEL status and a null path.
          return { command: null, path: null, status: ConvertResult.CANCEL_OPERATION };
        }
      }
    }

    const textAttr = getAttributes(textElement, ['data-ratiofixed', 'fill', 'fill-opacity', 'stroke', 'stroke-width']);
    const isFilled = calculateFilled(textElement); // for ghost

    let res: IConvertInfo = null;
    let preferGhost = !pathPerChar && globalPreference['font-convert'] === '1.0';

    if (preferGhost && fontObj) {
      try {
        const content = textElement.textContent;
        const { direction } = fontObj.layout(content);

        if (direction === 'rtl') {
          preferGhost = false;
        }
      } catch (e) {
        console.error('Test font direction failed', e);
      }
    }

    if (preferGhost) {
      if (isWeb() && !discoverManager.checkConnection()) {
        Alert.popUp({
          buttonLabels: [i18n.lang.topbar.menu.add_new_machine],
          buttonType: AlertConstants.CUSTOM_CANCEL,
          callbacks: async () => {
            if (await toggleUnsavedChangedDialog()) {
              window.location.hash = hashMap.machineSetup;
            }
          },
          caption: i18n.lang.alert.oops,
          message: i18n.lang.device_selection.no_device_web,
        });

        return { command: null, path: null, status: ConvertResult.CONTINUE };
      }

      res =
        (await convertTextToPathByGhost(textElement, isFilled, font)) ||
        convertTextToPathByFontkit(textElement, fontObj, pathPerChar);
    } else {
      res =
        convertTextToPathByFontkit(textElement, fontObj, pathPerChar) ||
        (await convertTextToPathByGhost(textElement, isFilled, font));
    }

    if (res) {
      const { moveElement, transform } = res;
      let { d } = res;

      if (transform) {
        textAttr.transform = transform;
      }

      if (typeof d === 'string') {
        if (weldingTexts) {
          d = weldPath(d);
        }

        newPathElement = createPathElement(d, textAttr);
      } else {
        const group = document.createElementNS(svgedit.NS.SVG, 'g');

        d.forEach((dStr) => {
          group.appendChild(createPathElement(dStr, textAttr));
        });
        //@ts-ignore newPathElement is not used when pathPerChar is true, ignore type mismatch
        newPathElement = group;
      }

      textElement.parentNode!.insertBefore(newPathElement, textElement.nextSibling);
      batchCmd.addSubCommand(new history.InsertElementCommand(newPathElement));
      updateElementColor(newPathElement);

      if (moveElement) {
        // output of fluxsvg will locate at (0,0), so move it.
        moveElements([moveElement.x], [moveElement.y], [newPathElement], false);
      }

      svgedit.recalculate.recalculateDimensions(newPathElement!);
    } else {
      Alert.popUp({
        caption: `#846 ${LANG.text_to_path.error_when_parsing_text}`,
        message: LANG.text_to_path.retry,
        type: AlertConstants.SHOW_POPUP_ERROR,
      });

      return { command: null, path: null, status: ConvertResult.CONTINUE };
    }

    const parent = textElement.parentNode!;
    const { nextSibling } = textElement;
    const elem = parent.removeChild(textElement);

    batchCmd.addSubCommand(new history.RemoveElementCommand(elem, nextSibling!, parent));

    if (!batchCmd.isEmpty() && !isSubCommand) {
      svgCanvas.undoMgr.addCommandToHistory(batchCmd);
    }

    const finalStatus = hasUnsupportedFont ? ConvertResult.UNSUPPORT : ConvertResult.CONTINUE;

    return { command: batchCmd, path: newPathElement, status: finalStatus };
  } catch (err) {
    Alert.popUp({
      caption: `#846 ${LANG.text_to_path.error_when_parsing_text}`,
      message: err as string,
      type: AlertConstants.SHOW_POPUP_ERROR,
    });

    return { command: null, path: null, status: ConvertResult.CONTINUE };
  } finally {
    Progress.popById('parsing-font');
  }
};

export default {
  convertTextToPath,
  findFontFamilyCaseInsensitive,
  fontNameMap,
  getFontOfPostscriptName,
  requestAvailableFontFamilies,
  requestFontByFamilyAndStyle,
  requestFontsOfTheFontFamily,
};
