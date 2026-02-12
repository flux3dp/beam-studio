/**
 * Make symbol elements for <use> element
 */

import Progress from '@core/app/actions/progress-caller';
import NS from '@core/app/constants/namespaces';
import history from '@core/app/svgedit/history/history';
import layerManager from '@core/app/svgedit/layer/layerManager';
import findDefs from '@core/app/svgedit/utils/findDef';
import { getBBox } from '@core/app/svgedit/utils/getBBox';
import workareaManager from '@core/app/svgedit/workarea';
import updateElementColor from '@core/helpers/color/updateElementColor';
import { getObjectLayer } from '@core/helpers/layer/layer-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { getSVGAsync } from '../svg-editor-helper';

import updateImageSymbol, { waitForImageSymbolUrl } from './updateImageSymbol';

let svgCanvas: ISVGCanvas;
let svgedit: any;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgedit = globalSVG.Edit;
});

let clipCount = 1;

const makeSymbol = (
  elem: Element,
  attrs: Array<{ nodeName: string; value: string }>,
  batchCmd: IBatchCommand,
  defs: Element[],
  type: string,
): null | SVGSymbolElement => {
  if (!elem) return null;

  const svgdoc = document.getElementById('svgcanvas')!.ownerDocument;
  const symbol = svgdoc.createElementNS(NS.SVG, 'symbol') as unknown as SVGSymbolElement;
  const symbolDefs = svgdoc.createElementNS(NS.SVG, 'defs') as unknown as SVGDefsElement;
  const oldLinkMap = new Map();

  defs.forEach((def) => {
    const clonedDef = def.cloneNode(true) as Element;
    const oldId = clonedDef.id;

    if (oldId) {
      const newId = `def${clipCount}`;

      clipCount += 1;
      oldLinkMap.set(oldId, newId);
      clonedDef.id = newId;
    }

    symbolDefs.appendChild(clonedDef);
  });

  symbol.appendChild(symbolDefs);

  symbol.appendChild(elem);
  function traverseForRemappingId(node: Element) {
    if (!node.attributes) {
      return;
    }

    for (let i = 0; i < node.attributes.length; i += 1) {
      const attr = node.attributes.item(i);

      if (!attr) continue;

      const re = /url\(#([^)]+)\)/g;
      const linkRe = /#(.+)/g;
      const urlMatch = attr.nodeName === 'xlink:href' ? linkRe.exec(attr.value) : re.exec(attr.value);

      if (urlMatch) {
        const oldId = urlMatch[1];

        if (oldLinkMap.get(oldId)) {
          node.setAttribute(attr.nodeName, attr.value.replace(`#${oldId}`, `#${oldLinkMap.get(oldId)}`));
        }
      }
    }

    if (!node.childNodes) {
      return;
    }

    Array.from(node.childNodes).map((child) => traverseForRemappingId(child as Element));
  }
  traverseForRemappingId(symbol);

  (function remapIdOfStyle() {
    (Array.from(symbolDefs.childNodes) as SVGElement[]).forEach((child) => {
      if (child.tagName !== 'style') {
        return;
      }

      const originStyle = child.innerHTML;
      const re = /url\(#([^)]+)\)/g;
      const mappedStyle = originStyle.replace(re, (match, p1) => {
        if (oldLinkMap.get(p1)) {
          return `url(#${oldLinkMap.get(p1)})`;
        }

        return '';
      });

      child.innerHTML = mappedStyle;
    });
  })();

  for (let i = 0; i < attrs.length; i += 1) {
    const attr = attrs[i];

    symbol.setAttribute(attr.nodeName, attr.value);
  }
  symbol.id = svgCanvas.getNextId();

  const firstChild = elem.firstChild as Element;

  if (firstChild && (firstChild.id || firstChild.getAttributeNS(NS.INKSCAPE, 'label'))) {
    if (firstChild.getAttributeNS(NS.INKSCAPE, 'label')) {
      const id = firstChild.getAttributeNS(NS.INKSCAPE, 'label')!;

      symbol.setAttribute('data-id', id);
      firstChild.removeAttributeNS(NS.INKSCAPE, 'label');
    } else {
      symbol.setAttribute('data-id', firstChild.id);
    }
  }

  // If import by layer but no valid layer available, use current layer
  const currentLayerName = layerManager.getCurrentLayerName()!;

  if (type === 'layer' && !symbol.getAttribute('data-id')) {
    symbol.setAttribute('data-id', currentLayerName);
  }

  if (firstChild && firstChild.getAttribute('data-color')) {
    symbol.setAttribute('data-color', firstChild.getAttribute('data-color')!);
  }

  findDefs().appendChild(symbol);

  // remove invisible nodes (such as invisible layer in Illustrator)
  (Array.from(symbol.querySelectorAll('*')) as HTMLElement[])
    .filter((element) => element.style.display === 'none')
    .forEach((element) => element.remove());
  Array.from(symbol.querySelectorAll('use'))
    .filter((element) => $(symbol).find(svgedit.utilities.getHref(element)).length === 0)
    .forEach((element) => element.remove());

  // add prefix(which constrain css selector to symbol's id) to prevent class style pollution
  let originStyle = $(symbol).find('style').text();

  if (type === 'nolayer') {
    originStyle = originStyle.replace(/stroke[^a-zA-Z]*:[^;]*;/g, '');
    originStyle = originStyle.replace(/stroke-width[^a-zA-Z]*:[^;]*;/g, '');
  }

  const svgPixelTomm = 254 / 72; // 本來 72 個點代表 1 inch, 現在 254 個點代表 1 inch.
  const unitMap: Record<string, number> = {
    cm: (10 * 10) / svgPixelTomm,
    in: (25.4 * 10) / svgPixelTomm,
    mm: 10 / svgPixelTomm,
    px: 1,
  };
  const getFontSizeInPixel = (fontSizeCss: string) => {
    if (!Number.isNaN(Number(fontSizeCss))) {
      return fontSizeCss;
    }

    const unit = fontSizeCss.substr(-2);
    const num = fontSizeCss.substr(0, fontSizeCss.length - 2);

    if (!unit || !unitMap[unit]) {
      return num;
    }

    return Number(num) * unitMap[unit];
  };

  const textElems = $(symbol).find('text');

  for (let i = 0; i < textElems.length; i += 1) {
    // Remove text in <text> to <tspan>
    const textElem = textElems[i];
    const fontFamily = $(textElem).css('font-family');

    $(textElem).attr('font-family', fontFamily);

    const fontSize = getFontSizeInPixel($(textElem).css('font-size'));

    $(textElem).attr('font-size', fontSize);
    $(textElem).attr('stroke-width', 2);

    if (!$(textElem).attr('x')) {
      $(textElem).attr('x', 0);
    }

    if (!$(textElem).attr('y')) {
      $(textElem).attr('y', 0);
    }

    const texts = Array.from(textElem.childNodes).filter((child: ChildNode) => child.nodeType === 3);

    for (let j = texts.length - 1; j >= 0; j -= 1) {
      const t = texts[j] as SVGTextContentElement;
      const tspan = document.createElementNS(NS.SVG, 'tspan');

      textElem.prepend(tspan);
      tspan.textContent = t.textContent;
      $(t).remove();
      $(tspan).attr({
        'vector-effect': 'non-scaling-stroke',
        x: textElem.getAttribute('x'),
        y: textElem.getAttribute('y'),
      });
    }
  }

  // the regex indicate the css selector
  // but the selector may contain comma, so we replace it again.
  let prefixedStyle = originStyle.replace(/([^{}]+){/g, (match) => {
    const prefix = `#${symbol.id} `;
    const replace = match.replace(',', `,${prefix}`);

    return prefix + replace;
  });

  prefixedStyle = `${prefixedStyle}
        #${symbol.id} *[data-color] ellipse[fill=none],
        #${symbol.id} *[data-color] circle[fill=none],
        #${symbol.id} *[data-color] rect[fill=none],
        #${symbol.id} *[data-color] path[fill=none],
        #${symbol.id} *[data-color] polygon[fill=none] {
            fill-opacity: 0 !important;
            stroke-width: 1px !important;
            stroke-opacity: 1 !important;
            vector-effect: non-scaling-stroke !important;
        }

        #${symbol.id} *[data-color] ellipse[stroke=none],
        #${symbol.id} *[data-color] circle[stroke=none],
        #${symbol.id} *[data-color] rect[stroke=none],
        #${symbol.id} *[data-color] path[stroke=none],
        #${symbol.id} *[data-color] polygon[stroke=none],
        #${symbol.id} *[data-color] ellipse:not([stroke]),
        #${symbol.id} *[data-color] circle:not([stroke]),
        #${symbol.id} *[data-color] rect:not([stroke]),
        #${symbol.id} *[data-color] path:not([stroke]),
        #${symbol.id} *[data-color] polygon:not([stroke]) {
            fill-opacity: 1 !important;
            stroke-width: 0 !important;
        }

        *[data-wireframe] {
            stroke-width: 1px !important;
            stroke-opacity: 1.0 !important;
            stroke-dasharray: 0 !important;
            opacity: 1 !important;
            vector-effect: non-scaling-stroke !important;
            filter: none !important;
        }

        #${symbol.id} {
            overflow: visible;
        }
    `;

  if ($(symbol).find('style').length) {
    $(symbol).find('style').text(prefixedStyle);
  } else {
    $(symbol).find('defs').append(`<style>${prefixedStyle}</style>`);
  }

  batchCmd.addSubCommand(new history.InsertElementCommand(symbol));

  return symbol;
};

const getStrokeWidth = (imageRatio: number, scale: number) => {
  if (!scale) return 1;

  let strokeWidth = (0.8 * imageRatio) / (scale * workareaManager.zoomRatio);

  return Math.max(4, strokeWidth);
};

const sendTaskToWorker = async (data: any) =>
  new Promise((resolve) => {
    const worker = new Worker(
      new URL(/* webpackChunkName: "image-symbol.worker" */ './image-symbol.worker.ts', import.meta.url),
    );

    worker.postMessage(data);
    worker.onerror = (e) => console.log(e);
    worker.onmessage = (e) => {
      resolve(e.data);
      worker.terminate();
    };
  });

const calculateImageRatio = (bb: { height: number; width: number; x: number; y: number }) => {
  const zoomRatio = Math.max(1, workareaManager.zoomRatio);
  const widthRatio = Math.min(4096, window.innerWidth * zoomRatio) / bb.width;
  const heightRatio = Math.min(4096, window.innerHeight * zoomRatio) / bb.height;
  let imageRatio = Math.ceil(10000 * Math.min(widthRatio, heightRatio)) / 10000;

  imageRatio *= svgedit.browser.isSafari() ? 0.95 : 2;

  return imageRatio;
};

const createImageSymbol = (symbol: SVGSymbolElement): SVGSymbolElement => {
  const id = `${symbol.id}_image`;

  document.querySelectorAll(`#${id}`).forEach((elem) => elem.remove());

  const image = document.createElementNS(NS.SVG, 'image');
  const imageSymbol = document.createElementNS(NS.SVG, 'symbol') as unknown as SVGSymbolElement;

  imageSymbol.appendChild(image);

  const defs = findDefs();

  defs.appendChild(imageSymbol);
  imageSymbol.setAttribute('overflow', 'visible');
  imageSymbol.setAttribute('id', `${symbol.id}_image`);
  imageSymbol.setAttribute('data-origin-symbol', `${symbol.id}`);
  symbol.setAttribute('data-image-symbol', `${imageSymbol.id}`);

  return imageSymbol;
};

const makeImageSymbol = async (
  symbol: SVGSymbolElement,
  opts: {
    force?: boolean;
    fullColor?: boolean;
    imageSymbol?: SVGSymbolElement;
    scale?: number;
  } = {},
): Promise<null | SVGSymbolElement> => {
  const { force = false, fullColor = false, scale = 1 } = opts;
  let { imageSymbol } = opts;
  const svgdoc = (document.getElementById('svgcanvas') as Element).ownerDocument;

  // eslint-disable-next-line no-async-promise-executor
  return new Promise<null | SVGSymbolElement>(async (resolve) => {
    const generateTempSvg = () => {
      const tempSvg = svgdoc.createElementNS(NS.SVG, 'svg');
      const tempUse = svgdoc.createElementNS(NS.SVG, 'use');
      const tempSymbol = symbol.cloneNode(true) as SVGSymbolElement;

      tempSvg.appendChild(tempSymbol);
      tempSvg.appendChild(tempUse);
      svgedit.utilities.setHref(tempUse, `#${symbol.id}`);

      return { tempSvg, tempSymbol, tempUse };
    };

    const calculateSvgBBox = () => {
      const bbText = symbol.getAttribute('data-bbox');
      let bb: { height: number; width: number; x: number; y: number };

      if (!bbText) {
        // Unable to getBBox if <use> not mounted
        const useElemForBB = svgedit.utilities.findTempUse();

        svgedit.utilities.setHref(useElemForBB, `#${symbol.id}`);
        bb = useElemForBB.getBBox();
        svgedit.utilities.setHref(useElemForBB, '');
        bb.height = Math.max(0, bb.height);
        bb.width = Math.max(0, bb.width);

        const obj = {
          height: Number.parseFloat(bb.height.toFixed(5)),
          width: Number.parseFloat(bb.width.toFixed(5)),
          x: Number.parseFloat(bb.x.toFixed(5)),
          y: Number.parseFloat(bb.y.toFixed(5)),
        };

        symbol.setAttribute('data-bbox', JSON.stringify(obj));
      } else {
        bb = JSON.parse(bbText) as { height: number; width: number; x: number; y: number };
      }

      const bbObject = {
        height: bb.height,
        width: bb.width,
        x: bb.x,
        y: bb.y,
      };

      return bbObject;
    };

    const bb = calculateSvgBBox();

    if (bb.width < 1 || bb.height < 1) {
      resolve(null);

      return;
    }

    const imageRatio = calculateImageRatio(bb);
    const strokeWidth = fullColor ? 1 : getStrokeWidth(imageRatio, scale);

    if (
      imageSymbol?.getAttribute('data-stroke-width') === strokeWidth.toPrecision(6) &&
      imageSymbol.getAttribute('data-fullcolor') === (fullColor ? '1' : '0') &&
      !force
    ) {
      resolve(imageSymbol);

      return;
    }

    const { tempSvg, tempSymbol, tempUse } = generateTempSvg();

    tempSymbol.setAttribute('x', `${-bb.x}`);
    tempSymbol.setAttribute('y', `${-bb.y}`);

    const descendants = Array.from(tempSymbol.querySelectorAll('*'));

    descendants.forEach((d) => {
      if (!fullColor) {
        d.setAttribute('stroke-width', `${strokeWidth}px`);
      }

      d.setAttribute('vector-effect', 'non-scaling-stroke');
    });

    const styles = Array.from(tempSymbol.querySelectorAll('style'));

    styles.forEach((styleNode) => {
      let styleText = styleNode.textContent;

      styleText =
        styleText?.replace(
          /stroke-width: 1px !important;/g,
          fullColor ? '' : `stroke-width: ${strokeWidth}px !important;`,
        ) || styleNode.textContent;
      styleNode.textContent = styleText;
    });
    tempUse.setAttribute('transform', `translate(${0.5 * strokeWidth}, ${0.5 * strokeWidth}) scale(${imageRatio})`);

    const svgString = new XMLSerializer().serializeToString(tempSvg);
    const svgBlob = (await sendTaskToWorker({ svgString, type: 'svgStringToBlob' })) as Blob;
    let isNewImageSymbol = false;

    if (!imageSymbol) {
      imageSymbol = createImageSymbol(symbol);
      isNewImageSymbol = true;
    }

    updateImageSymbol({ bb, fullColor, imageRatio, imageSymbol, strokeWidth, svgBlob });

    if (isNewImageSymbol) await waitForImageSymbolUrl(imageSymbol);

    resolve(imageSymbol);
  });
};

const reRenderImageSymbol = async (useElement: SVGUseElement, opts: { force?: boolean } = {}): Promise<void> => {
  if (!useElement.parentNode) return;

  const { force = false } = opts;
  const { height, width } = getBBox(useElement);
  const { height: origHeight, width: origWidth } = useElement.getBBox();

  if (origWidth * origHeight === 0) return;

  const fullColor = getObjectLayer(useElement)?.elem?.getAttribute('data-fullcolor') === '1';

  const scale = Math.sqrt((width * height) / (origWidth * origHeight));
  const href = svgCanvas.getHref(useElement);
  const currentSymbol = document.querySelector(href) as SVGSymbolElement;

  if (currentSymbol && currentSymbol.tagName === 'symbol') {
    const origSymbolId = currentSymbol.getAttribute('data-origin-symbol');
    const imageSymbolId = currentSymbol.getAttribute('data-image-symbol');

    if (origSymbolId) {
      const origSymbol = document.getElementById(origSymbolId) as unknown as SVGSymbolElement;

      if (origSymbol && origSymbol.tagName === 'symbol') {
        await makeImageSymbol(origSymbol, { force, fullColor, imageSymbol: currentSymbol, scale });
      }
    } else if (imageSymbolId) {
      let imageSymbol = document.getElementById(imageSymbolId) as unknown as SVGSymbolElement;

      if (imageSymbol && imageSymbol.tagName === 'symbol') {
        await makeImageSymbol(currentSymbol, { force, fullColor, imageSymbol, scale });
      } else {
        await makeImageSymbol(currentSymbol, { force, fullColor, scale });
      }
    }
  }
};

const reRenderImageSymbolArray = async (
  useElements: SVGUseElement[],
  opts: { force?: boolean } = {},
): Promise<void> => {
  const convertAllUses = useElements.map((use) => reRenderImageSymbol(use, opts));

  await Promise.all(convertAllUses);
};

const reRenderAllImageSymbols = async (): Promise<void> => {
  const useElements: SVGUseElement[] = [];
  const layers = Array.from(document.querySelectorAll('#svgcontent > g.layer'));

  layers.forEach((layer) => {
    const uses = Array.from(layer.querySelectorAll('use'));

    useElements.push(...uses);
  });
  await reRenderImageSymbolArray(useElements);
};

const switchImageSymbol = (elem: SVGUseElement, shouldUseImage: boolean): IBatchCommand | null => {
  const href = elem.getAttribute('xlink:href') as string;

  if (href.endsWith('_image') && shouldUseImage) {
    console.log(`${elem.id} is already using image`);

    return null;
  }

  if (!href.endsWith('_image') && !shouldUseImage) {
    console.log(`${elem.id} is already using svg symbol`);

    return null;
  }

  const currentSymbol = document.querySelector(href);

  if (currentSymbol?.tagName === 'symbol') {
    const targetId = shouldUseImage
      ? currentSymbol.getAttribute('data-image-symbol')
      : currentSymbol.getAttribute('data-origin-symbol');

    if (!targetId) {
      console.warn(`Switcing failed, Unable to find target origin/image symbol ${targetId}.`);

      return null;
    }

    const targetSymbol = document.querySelector(`#${targetId}`);

    if (targetSymbol?.tagName === 'symbol') {
      svgCanvas.undoMgr.beginUndoableChange('xlink:href', [elem]);
      elem.setAttribute('xlink:href', `#${targetId}`);

      const cmd = svgCanvas.undoMgr.finishUndoableChange();

      if (shouldUseImage) {
        updateElementColor(elem);
      }

      return cmd;
    }

    console.warn(`Switcing failed, Unable to find symbol ${targetId}.`);
  } else {
    console.warn(`Switcing failed, Unable to find Current symbol ${href}.`);
  }

  return null;
};

const switchImageSymbolForAll = (shouldUseImage: boolean): void => {
  Progress.openNonstopProgress({ id: 'switch-all-symbol' });

  const layers = $('#svgcontent > g.layer').toArray();

  layers.forEach((layer) => {
    const uses: SVGUseElement[] = Array.from(layer.querySelectorAll('use'));

    uses.forEach((use) => {
      switchImageSymbol(use, shouldUseImage);
    });
  });
  Progress.popById('switch-all-symbol');
};

const symbolMaker = {
  createImageSymbol,
  makeImageSymbol,
  makeSymbol,
  reRenderAllImageSymbols,
  reRenderImageSymbol,
  reRenderImageSymbolArray,
  switchImageSymbol,
  switchImageSymbolForAll,
};

export default symbolMaker;
