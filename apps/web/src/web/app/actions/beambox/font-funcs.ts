/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-console */
import * as fontkit from 'fontkit';
import { sprintf } from 'sprintf-js';

import Alert from 'app/actions/alert-caller';
import AlertConfig from 'helpers/api/alert-config';
import AlertConstants from 'app/constants/alert-constants';
import BeamboxPreference from 'app/actions/beambox/beambox-preference';
import fileExportHelper from 'helpers/file-export-helper';
import fontHelper from 'helpers/fonts/fontHelper';
import history from 'app/svgedit/history/history';
import ISVGCanvas from 'interfaces/ISVGCanvas';
import i18n from 'helpers/i18n';
import isWeb from 'helpers/is-web';
import localFontHelper from 'implementations/localFontHelper';
import Progress from 'app/actions/progress-caller';
import SvgLaserParser from 'helpers/api/svg-laser-parser';
import storage from 'implementations/storage';
import textPathEdit from 'app/actions/beambox/textPathEdit';
import weldPath from 'helpers/weldPath';
import { checkConnection } from 'helpers/api/discover';
import { FontDescriptor, IFont, IFontQuery, WebFont } from 'interfaces/IFont';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { moveElements } from 'app/svgedit/operations/move';

let svgCanvas: ISVGCanvas;
let svgedit;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgedit = globalSVG.Edit;
});

const { $ } = window;

const svgWebSocket = SvgLaserParser({ type: 'svgeditor' });
const LANG = i18n.lang.beambox.object_panels;

const fontObjCache = new Map<string, fontkit.Font>();

enum SubstituteResult {
  DO_SUB = 2,
  DONT_SUB = 1,
  CANCEL_OPERATION = 0,
}

enum ConvertResult {
  CONTINUE = 2,
  UNSUPPORT = 1,
  CANCEL_OPERATION = 0,
}

let tempPaths = [];

type IConvertInfo = {
  d: string;
  transform: string | null;
  moveElement?: { x: number; y: number };
} | null;

// a simple memoize function that takes in a function
// and returns a memoized function
const memoize = (fn) => {
  const cache = {};
  return (...args) => {
    const n = args[0]; // just taking one argument here
    if (n in cache) {
      // console.log('Fetching from cache');
      return cache[n];
    }
    // console.log('Calculating result');
    const result = fn(n);
    cache[n] = result;
    return result;
  };
};

// TODO: Fix config
let fontNameMapObj: { [key: string]: string } = storage.get('font-name-map') || {};
if (fontNameMapObj.navigatorLang !== navigator.language) {
  fontNameMapObj = {};
}
const fontNameMap = new Map<string, string>();
const requestAvailableFontFamilies = (withoutMonotype = false) => {
  // get all available fonts in user PC
  const fonts = fontHelper.getAvailableFonts(withoutMonotype);
  fonts.forEach((font) => {
    if (!fontNameMap.get(font.family)) {
      let fontName = font.family;
      if (fontNameMapObj[font.family]) {
        fontName = fontNameMapObj[font.family];
      } else {
        fontName = fontHelper.getFontName(font);
      }

      if (typeof fontName === 'string') {
        fontNameMap.set(font.family, fontName);
      } else {
        fontNameMap.set(font.family, font.family);
      }
    }
  });

  fontNameMap.forEach((value: string, key: string) => {
    fontNameMapObj[key] = value;
  });
  fontNameMapObj.navigatorLang = navigator.language;
  storage.set('font-name-map', fontNameMapObj);

  // make it unique
  const fontFamilySet = new Set<string>();
  fonts.map((font) => fontFamilySet.add(font.family));

  // transfer to array and sort!
  return Array.from(fontFamilySet).sort((a, b) => {
    if (a?.toLowerCase?.() < b?.toLowerCase?.()) {
      return -1;
    }
    if (a?.toLowerCase?.() > b?.toLowerCase?.()) {
      return 1;
    }
    return 0;
  });
};

const getFontOfPostscriptName = memoize((postscriptName: string) => {
  if (window.os === 'MacOS') {
    const font = fontHelper.findFont({ postscriptName });
    return font;
  }
  const allFonts = fontHelper.getAvailableFonts();
  const fit = allFonts.filter((f) => f.postscriptName === postscriptName);
  console.log(fit);
  if (fit.length > 0) {
    return fit[0];
  }
  return allFonts[0];
});

const init = () => {
  getFontOfPostscriptName('ArialMT');
};
init();

const requestFontsOfTheFontFamily = memoize((family: string) => {
  const fonts = fontHelper.findFonts({ family });
  return Array.from(fonts);
});

const requestFontByFamilyAndStyle = (opts: IFontQuery): IFont => {
  const font = fontHelper.findFont({
    family: opts.family,
    style: opts.style,
    weight: opts.weight,
    italic: opts.italic,
  });
  return font;
};

export const getFontObj = async (
  font: WebFont | FontDescriptor
): Promise<fontkit.Font | undefined> => {
  try {
    const { postscriptName } = font;
    let fontObj = fontObjCache.get(postscriptName);
    if (!fontObj) {
      if ((font as FontDescriptor).path) {
        fontObj = localFontHelper.getLocalFont(font);
      } else {
        const { fileName = `${postscriptName}.ttf`, collectionIdx = 0 } = font as WebFont;
        const protocol = isWeb() ? window.location.protocol : 'https:';
        let url = `${protocol}//beam-studio-web.s3.ap-northeast-1.amazonaws.com/fonts/${fileName}`;
        if ('hasLoaded' in font) {
          const monotypeUrl = await fontHelper.getMonotypeUrl(postscriptName);
          if (monotypeUrl) url = monotypeUrl;
          else return undefined;
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
        fontObjCache.set(postscriptName, fontObj);
      }
    }
    return fontObj;
  } catch (err) {
    console.log(`Unable to get fontObj of ${font.postscriptName}, ${err}`);
    return null;
  }
};

export const convertTextToPathByFontkit = (
  textElem: Element,
  fontObj: fontkit.Font
): IConvertInfo => {
  try {
    const maxChar = 0xffff;
    const fontSize = +textElem.getAttribute('font-size');
    const sizeRatio = fontSize / fontObj.unitsPerEm;

    let d = '';
    const textPaths = textElem.querySelectorAll('textPath');
    /* eslint-disable no-param-reassign */
    textPaths.forEach((textPath) => {
      let alignOffset = 0;
      const text = textPath.textContent;
      const alignmentBaseline = textPath.getAttribute('alignment-baseline');
      const dominantBaseline = textPath.getAttribute('dominant-baseline');
      if (alignmentBaseline || dominantBaseline) {
        textPath.textContent = 'i';
        const { x, y } = textPath.getBBox();
        textPath.removeAttribute('alignment-baseline');
        textPath.removeAttribute('dominant-baseline');
        const { x: x2, y: y2 } = textPath.getBBox();
        alignOffset = Math.hypot(x - x2, y - y2);
        textPath.setAttribute('alignment-baseline', alignmentBaseline);
        textPath.setAttribute('dominant-baseline', dominantBaseline);
        textPath.textContent = text;
      }

      const run = fontObj.layout(text);
      const { glyphs, direction, positions } = run;
      const isRtl = direction === 'rtl';
      if (isRtl) {
        glyphs.reverse();
        positions.reverse();
      }
      let i = 0;
      d += glyphs
        .map((char, idx) => {
          const pos = positions[idx];
          const start = textPath.getStartPositionOfChar(i);
          const end = textPath.getEndPositionOfChar(i);
          if ([start.x, start.y, end.x, end.y].every((v) => v === 0)) return '';
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

    const tspans = textElem.querySelectorAll('tspan');
    tspans.forEach((tspan) => {
      const text = tspan.textContent;
      const run = fontObj.layout(text);
      const { glyphs, direction, positions } = run;
      const isRtl = direction === 'rtl';
      if (isRtl) {
        glyphs.reverse();
        positions.reverse();
      }
      let i = 0;
      d += glyphs
        .map((char, idx) => {
          const pos = positions[idx];
          const start = tspan.getStartPositionOfChar(i);
          const end = tspan.getEndPositionOfChar(i);
          const { x, y } = isRtl ? end : start;
          char.codePoints.forEach((codePoint) => {
            i = codePoint > maxChar ? i + 2 : i + 1;
          });
          return char.path
            .translate(pos.xOffset, pos.yOffset)
            .scale(sizeRatio, -sizeRatio)
            .translate(x, y)
            .toSVG();
        })
        .join('');
    });

    return { d, transform: textElem.getAttribute('transform') };
  } catch (err) {
    console.log(
      `Unable to handle font ${textElem.getAttribute('font-postscript')} by fontkit, ${err}`
    );
    return null;
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getPathAndTransformFromSvg = async (data: any, isFilled: boolean) =>
  new Promise<{ d: string; transform: string }>((resolve) => {
    const fileReader = new FileReader();
    fileReader.onloadend = (e) => {
      const svgString = e.target.result as string;
      const dRegex = svgString.match(/ d="([^"]+)"/g);
      const transRegex = svgString.match(/transform="([^"]+)/);
      const d = dRegex ? dRegex.map((p) => p.substring(4, p.length - 1))?.join('') : '';
      const transform = transRegex ? transRegex[1] : '';
      resolve({ d, transform });
    };
    if (isFilled) {
      fileReader.readAsText(data.colors);
    } else {
      fileReader.readAsText(data.strokes);
    }
  });

const convertTextToPathByGhost = async (
  textElem: Element,
  isFilled: boolean,
  font: FontDescriptor
): Promise<IConvertInfo> => {
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
    const res = await fontHelper.getWebFontAndUpload(postscriptName);
    if (!res) {
      throw new Error('Error when uploading');
    }
    await svgWebSocket.uploadPlainTextSVG(textElem, bbox);
    const outputs = await svgWebSocket.divideSVG({ scale: 1, timeout: 15000 });
    if (!outputs.res) {
      throw new Error(`Fluxsvg: ${outputs.data}`);
    }
    const convertRes = await getPathAndTransformFromSvg(outputs.data, isFilled);
    return { ...convertRes, moveElement: bbox };
  } catch (err) {
    console.log(
      `Unable to handle font ${textElem.getAttribute('font-postscript')} by ghost, ${err}`
    );
    return null;
  }
};

const getUnsupportedChar = async (
  font: WebFont | FontDescriptor,
  textContent: string[]
): Promise<string[] | null> => {
  const fontObj = await getFontObj(font);
  if (fontObj) {
    return textContent.filter((c) => !fontObj.hasGlyphForCodePoint(c.codePointAt(0)));
  }
  return null;
};

const substitutedFont = async (font: WebFont | FontDescriptor, textElement: Element) => {
  const originFont = getFontOfPostscriptName(textElement.getAttribute('font-postscript'));
  const fontFamily = textElement.getAttribute('font-family');
  const text = textElement.textContent;

  // Escape for Whitelists
  const whiteList = ['標楷體'];
  const whiteKeyWords = ['華康', 'Adobe', '文鼎'];
  if (whiteList.indexOf(fontFamily) >= 0) {
    return { font: originFont };
  }
  for (let i = 0; i < whiteKeyWords.length; i += 1) {
    const keyword = whiteKeyWords[i];
    if (fontFamily && fontFamily.indexOf(keyword) >= 0) {
      return { font: originFont };
    }
  }
  // if only contain basic character (123abc!@#$...), don't substitute.
  // because my Mac cannot substituteFont properly handing font like 'Windings'
  // but we have to subsittue text if text contain both English and Chinese
  const textOnlyContainBasicLatin = Array.from(text).every(
    (char: string) => char.charCodeAt(0) <= 0x007f
  );
  if (textOnlyContainBasicLatin) {
    return { font: originFont };
  }
  // array of used family which are in the text

  const originPostscriptName = originFont.postscriptName;
  const fontOptions: { [postscriptName: string]: FontDescriptor } = { originPostscriptName: font };
  const textContent = [...new Set(Array.from(text))];
  let fontList: FontDescriptor[] = [font];
  let unsupportedChar = await getUnsupportedChar(originFont, textContent);
  if (unsupportedChar && unsupportedChar.length === 0) {
    console.log(`Original font ${originFont.postscriptName} fits for all char`);
    return { font: originFont };
  }

  if (!isWeb()) {
    unsupportedChar = [];
    textContent.forEach((char) => {
      const sub = localFontHelper.substituteFont(originPostscriptName, char);
      if (sub.postscriptName !== originPostscriptName) unsupportedChar.push(char);
      if (!fontOptions[sub.postscriptName]) fontOptions[sub.postscriptName] = sub;
    });
    fontList = Object.values(fontOptions);

    if (fontList.length === 1) {
      return {
        font: fontList[0],
        unsupportedChar,
      };
    }
    // Test all found fonts if they contain all
    for (let i = 0; i < fontList.length; i += 1) {
      let allFit = true;
      for (let j = 0; j < text.length; j += 1) {
        const foundfont = localFontHelper.substituteFont(fontList[i].postscriptName, text[j]);
        if (fontList[i].postscriptName !== foundfont.postscriptName) {
          allFit = false;
          break;
        }
      }
      if (allFit) {
        console.log(`Find ${fontList[i].postscriptName} fit for all char`);
        return {
          font: fontList[i],
          unsupportedChar,
        };
      }
    }
    console.log('Cannot find a font fit for all');
  }
  // Test all found fonts and Noto fonts with fontkit and select the best one
  const NotoFamilySuffixes = ['', ' TC', ' HK', ' SC', ' JP', ' KR'];
  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < NotoFamilySuffixes.length; i += 1) {
    const family = `Noto Sans${NotoFamilySuffixes[i]}`;
    const res = fontHelper.findFont({ ...font, family, postscriptName: undefined });
    fontList.push(res);
  }
  let minFailure = Number.MIN_VALUE;
  let bestFont = fontList[0];
  for (let i = 0; i < fontList.length; i += 1) {
    const currentFont = fontList[i];
    const unsupported = await getUnsupportedChar(currentFont, textContent);
    if (unsupported) {
      if (currentFont.postscriptName === font.postscriptName) unsupportedChar = unsupported;
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
  /* eslint-ensable no-await-in-loop */
  return {
    font: bestFont,
    unsupportedChar,
  };
};

const showSubstitutedFamilyPopup = (newFont: string) =>
  new Promise<SubstituteResult>((resolve) => {
    const message = sprintf(LANG.text_to_path.font_substitute_pop, fontNameMap.get(newFont));
    const buttonLabels = [
      i18n.lang.alert.confirm,
      LANG.text_to_path.use_current_font,
      i18n.lang.alert.cancel,
    ];
    const callbacks = [
      () => resolve(SubstituteResult.DO_SUB),
      () => resolve(SubstituteResult.DONT_SUB),
      () => resolve(SubstituteResult.CANCEL_OPERATION),
    ];
    Alert.popUp({
      type: AlertConstants.SHOW_POPUP_WARNING,
      message,
      buttonLabels,
      callbacks,
      primaryButtonIndex: 0,
    });
  });

const calculateFilled = (textElement: Element) => {
  if (parseInt(textElement.getAttribute('fill-opacity'), 10) === 0) {
    return false;
  }
  const fillAttr = textElement.getAttribute('fill');
  if (['#fff', '#ffffff', 'none'].includes(fillAttr)) {
    return false;
  }
  if (fillAttr || fillAttr === null) {
    return true;
  }
  return false;
};

const setTextPostscriptnameIfNeeded = (textElement: Element) => {
  if (!textElement.getAttribute('font-postscript')) {
    const font = requestFontByFamilyAndStyle({
      family: textElement.getAttribute('font-family'),
      weight: parseInt(textElement.getAttribute('font-weight'), 10),
      italic: textElement.getAttribute('font-style') === 'italic',
      style: null,
    });
    textElement.setAttribute('font-postscript', font.postscriptName);
  }
};

const convertTextToPath = async (
  textElement: Element,
  opts?: { isTempConvert?: boolean; weldingTexts?: boolean }
): Promise<ConvertResult> => {
  if (!textElement.textContent) {
    return ConvertResult.CONTINUE;
  }
  await Progress.openNonstopProgress({ id: 'parsing-font', message: LANG.wait_for_parsing_font });
  try {
    const { isTempConvert, weldingTexts } = opts || { isTempConvert: false, weldingTexts: false };
    setTextPostscriptnameIfNeeded(textElement);
    const batchCmd = new history.BatchCommand('Text to Path');
    const origFontFamily = textElement.getAttribute('font-family');
    const origFontPostscriptName = textElement.getAttribute('font-postscript');
    let font = getFontOfPostscriptName(origFontPostscriptName);
    let fontObj = await getFontObj(font);

    let hasUnsupportedFont = false;
    if (BeamboxPreference.read('font-substitute') !== false) {
      const { font: newFont, unsupportedChar } = await substitutedFont(font, textElement);
      if (
        newFont.postscriptName !== origFontPostscriptName &&
        unsupportedChar &&
        unsupportedChar.length > 0
      ) {
        hasUnsupportedFont = true;
        const doSub = await showSubstitutedFamilyPopup(newFont.family);
        if (doSub === SubstituteResult.DO_SUB) {
          svgCanvas.undoMgr.beginUndoableChange('font-family', [textElement]);
          textElement.setAttribute('font-family', newFont.family);
          batchCmd.addSubCommand(svgCanvas.undoMgr.finishUndoableChange());
          svgCanvas.undoMgr.beginUndoableChange('font-postscript', [textElement]);
          textElement.setAttribute('font-postscript', newFont.postscriptName);
          batchCmd.addSubCommand(svgCanvas.undoMgr.finishUndoableChange());
          fontObj = await getFontObj(newFont);
          font = newFont;
        } else if (doSub === SubstituteResult.CANCEL_OPERATION) {
          return ConvertResult.CANCEL_OPERATION;
        }
      }
    }
    if (fontHelper.usePostscriptAsFamily(font)) {
      svgCanvas.undoMgr.beginUndoableChange('font-family', [textElement]);
      textElement.setAttribute('font-family', textElement.getAttribute('font-postscript'));
      batchCmd.addSubCommand(svgCanvas.undoMgr.finishUndoableChange());
    }

    const { postscriptName } = font;
    console.log(textElement.getAttribute('font-family'), postscriptName);
    textElement.removeAttribute('stroke-width');
    const isFilled = calculateFilled(textElement);
    let color = textElement.getAttribute('stroke') || 'none';
    color = color !== 'none' ? color : textElement.getAttribute('fill');

    let res: IConvertInfo = null;
    if (BeamboxPreference.read('font-convert') === '1.0') {
      if (isWeb() && !checkConnection()) {
        Alert.popUp({
          caption: i18n.lang.alert.oops,
          message: i18n.lang.device_selection.no_device_web,
          buttonType: AlertConstants.CUSTOM_CANCEL,
          buttonLabels: [i18n.lang.topbar.menu.add_new_machine],
          callbacks: async () => {
            const saveRes = await fileExportHelper.toggleUnsavedChangedDialog();
            if (saveRes) window.location.hash = '#initialize/connect/select-machine-model';
          },
        });
        return ConvertResult.CONTINUE;
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
      const { transform, moveElement } = res;
      let { d } = res;
      if (weldingTexts) {
        d = weldPath(d);
      }
      const newPathId = svgCanvas.getNextId();
      const path = document.createElementNS(svgedit.NS.SVG, 'path');
      path.setAttribute('id', newPathId);
      path.setAttribute('d', d);
      if (transform) path.setAttribute('transform', transform);
      path.setAttribute('fill', isFilled ? color : 'none');
      path.setAttribute('fill-opacity', isFilled ? '1' : '0');
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-opacity', '1');
      path.setAttribute('stroke-dasharray', 'none');
      path.setAttribute('vector-effect', 'non-scaling-stroke');
      textElement.parentNode.insertBefore(path, textElement.nextSibling);
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
        tempPaths.push(path);
      }
      svgedit.recalculate.recalculateDimensions(path);
    } else {
      Alert.popUp({
        type: AlertConstants.SHOW_POPUP_ERROR,
        caption: `#846 ${LANG.text_to_path.error_when_parsing_text}`,
        message: LANG.text_to_path.retry,
      });
      return ConvertResult.CONTINUE;
    }

    if (!isTempConvert) {
      const parent = textElement.parentNode;
      const { nextSibling } = textElement;
      const elem = parent.removeChild(textElement);
      batchCmd.addSubCommand(new history.RemoveElementCommand(elem, nextSibling, parent));

      if (textElement.getAttribute('data-textpath')) {
        const cmd = textPathEdit.ungroupTextPath(parent as SVGGElement);
        if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);
      }

      if (!batchCmd.isEmpty()) {
        svgCanvas.undoMgr.addCommandToHistory(batchCmd);
      }
    }
    return hasUnsupportedFont ? ConvertResult.UNSUPPORT : ConvertResult.CONTINUE;
  } catch (err) {
    Alert.popUp({
      type: AlertConstants.SHOW_POPUP_ERROR,
      caption: `#846 ${LANG.text_to_path.error_when_parsing_text}`,
      message: err,
    });
    return ConvertResult.CONTINUE;
  } finally {
    Progress.popById('parsing-font');
  }
};

const tempConvertTextToPathAmoungSvgcontent = async () => {
  let isAnyFontUnsupported = false;
  const texts = [
    ...document.querySelectorAll('#svgcontent g.layer:not([display="none"]) text'),
    ...document.querySelectorAll('#svg_defs text'),
  ];
  for (let i = 0; i < texts.length; i += 1) {
    const el = texts[i];
    // eslint-disable-next-line no-await-in-loop
    const convertRes = await convertTextToPath(el, { isTempConvert: true });
    if (convertRes === ConvertResult.CANCEL_OPERATION) {
      return false;
    }
    if (convertRes === ConvertResult.UNSUPPORT) {
      isAnyFontUnsupported = true;
    }
  }

  if (isAnyFontUnsupported && !AlertConfig.read('skip_check_thumbnail_warning')) {
    await new Promise<void>((resolve) => {
      Alert.popUp({
        type: AlertConstants.SHOW_POPUP_WARNING,
        message: LANG.text_to_path.check_thumbnail_warning,
        callbacks: () => resolve(null),
        checkbox: {
          text: i18n.lang.beambox.popup.dont_show_again,
          callbacks: () => {
            AlertConfig.write('skip_check_thumbnail_warning', true);
            resolve(null);
          },
        },
      });
    });
  }
  return true;
};

const revertTempConvert = async (): Promise<void> => {
  const texts = [
    ...$('#svgcontent').find('text').toArray(),
    ...$('#svg_defs').find('text').toArray(),
  ];
  texts.forEach((t) => {
    $(t).removeAttr('display');
  });
  for (let i = 0; i < tempPaths.length; i += 1) {
    tempPaths[i].remove();
  }
  tempPaths = [];
};

export default {
  requestAvailableFontFamilies,
  fontNameMap,
  requestFontsOfTheFontFamily,
  requestFontByFamilyAndStyle,
  convertTextToPath,
  tempConvertTextToPathAmoungSvgcontent,
  revertTempConvert,
  getFontOfPostscriptName,
};
