import * as fontkit from 'fontkit';
import { sprintf } from 'sprintf-js';

import Alert from '@core/app/actions/alert-caller';
import BeamboxPreference from '@core/app/actions/beambox/beambox-preference';
import textPathEdit from '@core/app/actions/beambox/textPathEdit';
import Progress from '@core/app/actions/progress-caller';
import AlertConstants from '@core/app/constants/alert-constants';
import history from '@core/app/svgedit/history/history';
import { moveElements } from '@core/app/svgedit/operations/move';
import textedit from '@core/app/svgedit/text/textedit';
import AlertConfig from '@core/helpers/api/alert-config';
import { checkConnection } from '@core/helpers/api/discover';
import SvgLaserParser from '@core/helpers/api/svg-laser-parser';
import fileExportHelper from '@core/helpers/file-export-helper';
import fontHelper from '@core/helpers/fonts/fontHelper';
import i18n from '@core/helpers/i18n';
import isWeb from '@core/helpers/is-web';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import weldPath from '@core/helpers/weldPath';
import localFontHelper from '@core/implementations/localFontHelper';
import storage from '@core/implementations/storage';
import type { FontDescriptor, GeneralFont, IFontQuery, WebFont } from '@core/interfaces/IFont';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;
let svgedit: any;

getSVGAsync(({ Canvas, Edit }) => {
  svgCanvas = Canvas;
  svgedit = Edit;
});

const { $ } = window;
const svgWebSocket = SvgLaserParser({ type: 'svgeditor' });
const LANG = i18n.lang.beambox.object_panels;
const fontObjCache = new Map<string, fontkit.Font>();

const SubstituteResult = {
  CANCEL_OPERATION: 0,
  DO_NOT_SUB: 1,
  DO_SUB: 2,
} as const;

type SubstituteResultType = (typeof SubstituteResult)[keyof typeof SubstituteResult];

const ConvertResult = {
  CANCEL_OPERATION: 0,
  CONTINUE: 2,
  UNSUPPORT: 1,
} as const;

type ConvertResultType = (typeof ConvertResult)[keyof typeof ConvertResult];

type ConvertToTextPathResult =
  | {
      command: IBatchCommand;
      path: SVGPathElement;
      status: ConvertResultType;
      textPathPath?: SVGPathElement;
    }
  | {
      command: null;
      path: null;
      status: ConvertResultType;
    };

const tempPaths: SVGPathElement[] = [];

type IConvertInfo = null | {
  d: string;
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

// TODO: Fix config
let fontNameMapObj: Record<string, string> = storage.get('font-name-map') || {};

if (fontNameMapObj.navigatorLang !== navigator.language) {
  fontNameMapObj = {};
}

const fontNameMap = new Map<string, string>();
const requestAvailableFontFamilies = (withoutMonotype = false) => {
  // get all available fonts in user PC
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

  // make it unique
  const fontFamilySet = new Set<string>();

  fonts.map((font) => fontFamilySet.add(font.family!));

  // transfer to array and sort!
  return Array.from(fontFamilySet).sort((a, b) =>
    String(a ?? '').localeCompare(String(b ?? ''), undefined, { sensitivity: 'base' }),
  );
};

const getFontOfPostscriptName = memoize((postscriptName: string) => {
  if (window.os === 'MacOS') {
    return fontHelper.findFont({ postscriptName });
  }

  const allFonts = fontHelper.getAvailableFonts();
  const fit = allFonts.filter((f) => f.postscriptName === postscriptName);

  console.log(fit);

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
  try {
    const { postscriptName } = font;
    let fontObj = fontObjCache.get(postscriptName!);

    if (!fontObj) {
      if ('path' in font) {
        fontObj = localFontHelper.getLocalFont(font);
      } else {
        const { collectionIdx = 0, fileName = `${postscriptName}.ttf` } = font as WebFont;
        const protocol = isWeb() ? window.location.protocol : 'https:';
        let url = `${protocol}//beam-studio-web.s3.ap-northeast-1.amazonaws.com/fonts/${fileName}`;

        if ('hasLoaded' in font) {
          const monotypeUrl = await fontHelper.getMonotypeUrl(postscriptName!);

          if (monotypeUrl) {
            url = monotypeUrl;
          } else {
            return undefined;
          }
        }

        const data = await fetch(url, { mode: 'cors' });
        const buffer = Buffer.from(await data.arrayBuffer());

        try {
          // Font Collection
          fontObj = fontkit.create(buffer, font.postscriptName) as fontkit.Font;

          if (!fontObj) {
            const res = fontkit.create(buffer) as fontkit.FontCollection;

            if (!res) {
              throw new Error('Failed to create font collection');
            }

            fontObj = res.fonts[collectionIdx];
          }
        } catch {
          // Single Font
          fontObj = fontkit.create(buffer) as fontkit.Font;
        }
      }

      if (fontObj) {
        fontObjCache.set(postscriptName!, fontObj);
      }
    }

    return fontObj;
  } catch (err) {
    console.log(`Unable to get fontObj of ${font.postscriptName}, ${err}`);

    return undefined;
  }
};

export const convertTextToPathByFontkit = (textElem: Element, fontObj: fontkit.Font | undefined): IConvertInfo => {
  try {
    if (!fontObj) {
      throw new Error('Unable to get fontObj');
    }

    const maxChar = 0xffff;
    const fontSize = textedit.getFontSize(textElem as SVGTextElement);
    const sizeRatio = fontSize / fontObj.unitsPerEm;
    let d = '';
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

      if (isRtl) {
        glyphs.reverse();
        positions.reverse();
      }

      let i = 0;

      d += glyphs
        .map((char, idx) => {
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
        })
        .join('');
    });

    const tSpans = textElem.querySelectorAll('tspan');

    tSpans.forEach((tspan) => {
      const text = tspan.textContent;
      const charCount = tspan.getNumberOfChars();
      const run = fontObj.layout(text!);
      const { direction, glyphs, positions } = run;
      const isRtl = direction === 'rtl';

      if (isRtl) {
        glyphs.reverse();
        positions.reverse();
      }

      let i = 0;

      d += glyphs
        .map((char, idx) => {
          if (i >= charCount) return '';

          const pos = positions[idx];
          const start = tspan.getStartPositionOfChar(i);
          const end = tspan.getEndPositionOfChar(i);
          const { x, y } = isRtl ? end : start;

          char.codePoints.forEach((codePoint) => {
            i = codePoint > maxChar ? i + 2 : i + 1;
          });

          return char.path.translate(pos.xOffset, pos.yOffset).scale(sizeRatio, -sizeRatio).translate(x, y).toSVG();
        })
        .join('');
    });

    return { d, transform: textElem.getAttribute('transform') };
  } catch (err) {
    console.log(`Unable to handle font ${textElem.getAttribute('font-postscript')} by fontkit, ${err}`);

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

    if (web && !checkConnection()) {
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
    console.log(`Unable to handle font ${textElem.getAttribute('font-postscript')} by ghost, ${err}`);

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
    return textContent.filter((c) => !fontObj.hasGlyphForCodePoint(c.codePointAt(0)!));
  }

  return null;
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
    console.log(`Original font ${originFont.postscriptName} fits for all char`);

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
        console.log(`Find ${font.postscriptName} fit for all char`);

        return { font, unsupportedChar };
      }
    }
    console.log('Cannot find a font fit for all');
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
        console.log(`Find ${currentFont.postscriptName} fit for all char with fontkit`);

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

const convertTextToPath = async (
  textElement: Element,
  opts?: { isSubCommand?: boolean; isTempConvert?: boolean; weldingTexts?: boolean },
): Promise<ConvertToTextPathResult> => {
  if (!textElement.textContent) {
    console.warn('Text element has no content, skipping conversion.');

    return { command: null, path: null, status: ConvertResult.CONTINUE };
  }

  await Progress.openNonstopProgress({ id: 'parsing-font', message: LANG.wait_for_parsing_font });

  let newPathElement: null | SVGPathElement = null;

  try {
    const { isSubCommand = false, isTempConvert = false, weldingTexts = false } = opts || {};

    setTextPostscriptNameIfNeeded(textElement);

    // Create a batch command for the undo/redo manager. Groups all changes into one undo step.
    const batchCmd = new history.BatchCommand('Text to Path');
    // Store original font attributes for potential restoration (used in temp convert).
    const origFontFamily = textElement.getAttribute('font-family')!;
    const origFontPostscriptName = textElement.getAttribute('font-postscript')!;
    // Get the Font object based on the PostScript name.
    let font = getFontOfPostscriptName(origFontPostscriptName);
    // Asynchronously load the font data object (e.g., using opentype.js or similar).
    let fontObj = await getFontObj(font);

    let hasUnsupportedFont = false;

    if (BeamboxPreference.read('font-substitute')) {
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

    const strokeWidth = textElement.getAttribute('stroke-width');

    textElement.removeAttribute('stroke-width');

    const isFilled = calculateFilled(textElement);
    let color = textElement.getAttribute('stroke') || 'none';

    color = color !== 'none' ? color : textElement.getAttribute('fill')!;

    let res: IConvertInfo = null;
    let preferGhost = BeamboxPreference.read('font-convert') === '1.0';

    if (preferGhost && fontObj) {
      try {
        const content = textElement.textContent;
        const { direction } = fontObj.layout(content);

        if (direction === 'rtl') {
          preferGhost = false;
        }
      } catch (e) {
        console.log('Test font direction failed', e);
      }
    }

    if (preferGhost) {
      if (isWeb() && !checkConnection()) {
        Alert.popUp({
          buttonLabels: [i18n.lang.topbar.menu.add_new_machine],
          buttonType: AlertConstants.CUSTOM_CANCEL,
          callbacks: async () => {
            const saveRes = await fileExportHelper.toggleUnsavedChangedDialog();

            if (saveRes) {
              window.location.hash = '#/initialize/connect/select-machine-model';
            }
          },
          caption: i18n.lang.alert.oops,
          message: i18n.lang.device_selection.no_device_web,
        });

        return { command: null, path: null, status: ConvertResult.CONTINUE };
      }

      res =
        (await convertTextToPathByGhost(textElement, isFilled, font)) ||
        convertTextToPathByFontkit(textElement, fontObj);
    } else {
      res =
        convertTextToPathByFontkit(textElement, fontObj) ||
        (await convertTextToPathByGhost(textElement, isFilled, font));
    }

    if (res) {
      const { moveElement, transform } = res;
      let { d } = res;

      if (weldingTexts) {
        d = weldPath(d);
      }

      const newPathId = svgCanvas.getNextId();
      const path = document.createElementNS(svgedit.NS.SVG, 'path') as unknown as SVGPathElement;

      newPathElement = path;

      path.setAttribute('id', newPathId);
      path.setAttribute('d', d);

      if (transform) {
        path.setAttribute('transform', transform);
      }

      path.setAttribute('fill', isFilled ? color : 'none');
      path.setAttribute('fill-opacity', isFilled ? '1' : '0');
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-opacity', '1');
      path.setAttribute('stroke-dasharray', 'none');
      path.setAttribute('vector-effect', 'non-scaling-stroke');

      if (strokeWidth) {
        path.setAttribute('stroke-width', (+strokeWidth / 2).toString());
      }

      textElement.parentNode!.insertBefore(path, textElement.nextSibling);
      path.addEventListener('mouseover', svgCanvas.handleGenerateSensorArea);
      path.addEventListener('mouseleave', svgCanvas.handleGenerateSensorArea);
      svgCanvas.pathActions.fixEnd(path);
      batchCmd.addSubCommand(new history.InsertElementCommand(path));

      if (moveElement) {
        // output of fluxsvg will locate at (0,0), so move it.
        moveElements([moveElement.x], [moveElement.y], [path], false);
      }

      if (isTempConvert) {
        textElement.setAttribute('display', 'none');
        textElement.setAttribute('font-family', origFontFamily);
        textElement.setAttribute('font-postscript', origFontPostscriptName);
        textElement.setAttribute('stroke-width', '2');
        textElement.setAttribute('data-path-id', newPathId);
        tempPaths.push(path as any);
      }

      svgedit.recalculate.recalculateDimensions(path);
    } else {
      Alert.popUp({
        caption: `#846 ${LANG.text_to_path.error_when_parsing_text}`,
        message: LANG.text_to_path.retry,
        type: AlertConstants.SHOW_POPUP_ERROR,
      });

      return { command: null, path: null, status: ConvertResult.CONTINUE };
    }

    let textPathPath: SVGPathElement | undefined = undefined;

    if (!isTempConvert) {
      const parent = textElement.parentNode!;
      const { nextSibling } = textElement;
      const elem = parent.removeChild(textElement);

      batchCmd.addSubCommand(new history.RemoveElementCommand(elem, nextSibling!, parent));

      if (textElement.getAttribute('data-textpath')) {
        textPathPath = parent.querySelector('path') as SVGPathElement;

        const cmd = textPathEdit.ungroupTextPath(parent as SVGGElement);

        if (cmd && !cmd.isEmpty()) {
          batchCmd.addSubCommand(cmd);
        }
      }

      if (!batchCmd.isEmpty() && !isSubCommand) {
        svgCanvas.undoMgr.addCommandToHistory(batchCmd);
      }
    }

    const finalStatus = hasUnsupportedFont ? ConvertResult.UNSUPPORT : ConvertResult.CONTINUE;

    return { command: batchCmd, path: newPathElement, status: finalStatus, textPathPath };
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

const tempConvertTextToPathAmongSvgContent = async () => {
  let isAnyFontUnsupported = false;
  const texts = [
    ...document.querySelectorAll('#svgcontent g.layer:not([display="none"]) text'),
    ...document.querySelectorAll('#svg_defs text'),
  ];

  for (const text of texts) {
    const { status } = await convertTextToPath(text, { isTempConvert: true });

    if (status === ConvertResult.CANCEL_OPERATION) return false;

    if (status === ConvertResult.UNSUPPORT) isAnyFontUnsupported = true;
  }

  if (isAnyFontUnsupported && !AlertConfig.read('skip_check_thumbnail_warning')) {
    await new Promise<void>((resolve) => {
      Alert.popUp({
        callbacks: () => resolve(),
        checkbox: {
          callbacks: () => {
            AlertConfig.write('skip_check_thumbnail_warning', true);
            resolve();
          },
          text: i18n.lang.alert.dont_show_again,
        },
        message: LANG.text_to_path.check_thumbnail_warning,
        type: AlertConstants.SHOW_POPUP_WARNING,
      });
    });
  }

  return true;
};

const revertTempConvert = async (): Promise<void> => {
  const texts = [...$('#svgcontent').find('text').toArray(), ...$('#svg_defs').find('text').toArray()];

  texts.forEach((t) => {
    $(t).removeAttr('display');
  });

  for (const tempPath of tempPaths) {
    tempPath.remove();
  }

  tempPaths.length = 0;
};

export default {
  convertTextToPath,
  fontNameMap,
  getFontOfPostscriptName,
  requestAvailableFontFamilies,
  requestFontByFamilyAndStyle,
  requestFontsOfTheFontFamily,
  revertTempConvert,
  tempConvertTextToPathAmongSvgContent,
};
