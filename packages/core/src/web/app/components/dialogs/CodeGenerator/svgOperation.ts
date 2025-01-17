/* eslint-disable no-param-reassign */
import fontFuncs, { convertTextToPathByFontkit, getFontObj } from 'app/actions/beambox/font-funcs';
import NS from 'app/constants/namespaces';
import history from 'app/svgedit/history/history';
import undoManager from 'app/svgedit/history/undoManager';
import importSvgString from 'app/svgedit/operations/import/importSvgString';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { FontDescriptor } from 'interfaces/IFont';
import ISVGCanvas from 'interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

export function extractSvgTags(svgString: string, tag: string): Array<string> {
  const elements = new DOMParser()
    .parseFromString(svgString, 'image/svg+xml')
    .querySelectorAll(tag);

  return Array.from(elements).map(({ outerHTML }) => outerHTML);
}

function extractFontDetails(fontStyle: string): {
  fontFamily: string;
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
} {
  const isBold = /bold/i.test(fontStyle);
  const isItalic = /italic/i.test(fontStyle);
  const fontSizeInfo = fontStyle.match(/(\d+px|\d+em|\d+rem|\d+pt)/)?.[0] || '16px';
  const fontSize = Number.parseFloat(fontSizeInfo.match(/^(\d+(\.\d+)?)/)?.[0]) || 16;
  const fontFamily = fontStyle
    .replace(/font:\s*|bold|italic|(\d+px|\d+em|\d+rem|\d+pt)/g, '')
    .trim();

  return { fontFamily, fontSize, isBold, isItalic };
}

function findMatchingFont(
  fontInfos: Array<FontDescriptor>,
  isBold: boolean,
  isItalic: boolean
): FontDescriptor {
  return (
    fontInfos.find(
      ({ postscriptName }) =>
        isBold === postscriptName.includes('Bold') && isItalic === postscriptName.includes('Italic')
    ) || fontInfos[0]
  );
}

function preProcessTextTag(svgElement: SVGElement): SVGElement {
  const texts = svgElement.querySelectorAll('text');

  if (!texts.length) {
    return svgElement;
  }

  texts.forEach((text) => {
    const { fontFamily, fontSize, isBold, isItalic } = extractFontDetails(
      text.getAttribute('style')
    );
    const fonts: Array<FontDescriptor> = fontFuncs.requestFontsOfTheFontFamily(fontFamily);
    const font = findMatchingFont(fonts, isBold, isItalic);

    text.setAttribute('font-family', `'${font.family}'`);
    text.setAttribute('font-size', fontSize.toString());
    text.setAttribute('font-style', isItalic ? 'italic' : 'normal');
    text.setAttribute('font-weight', font.weight.toString());
    text.setAttribute('font-postscript', font.postscriptName);
    text.removeAttribute('style');
  });

  return svgElement;
}

function getTranslateValues(transform: string): { x: number; y: number } {
  const match = transform.match(/translate\(([^,]+),?\s*([^)]+)?\)/);

  if (match) {
    const x = parseFloat(match[1]);
    // default to 0 if missing
    const y = match[2] ? parseFloat(match[2]) : 0;

    return { x, y };
  }

  return { x: 0, y: 0 };
}

/* Barcode */
async function getDFromBarcodeSvgElement(svgElement: SVGElement) {
  const ds = Array.of<string>();

  preProcessTextTag(svgElement);

  const fontObj = await getFontObj(
    fontFuncs.getFontOfPostscriptName(
      svgElement.querySelector('text')?.getAttribute('font-postscript')
    )
  );

  svgElement.querySelectorAll('g').forEach((g) => {
    const transform = getTranslateValues(g.getAttribute('transform'));

    g.querySelectorAll('rect').forEach((rect) => {
      const { x, y } = rect.getBBox();

      rect.setAttribute('x', `${x + transform.x}`);
      rect.setAttribute('y', `${y + transform.y}`);

      const { path } = svgCanvas.convertToPath(rect, true);

      ds.push(path.getAttribute('d'));
    });

    g.querySelectorAll('text').forEach((text) => {
      const { textContent } = text;

      if (!textContent) {
        return;
      }

      const tspan = document.createElementNS(NS.SVG, 'tspan');

      tspan.setAttribute('x', `${Number.parseFloat(text.getAttribute('x')) + transform.x}`);
      tspan.setAttribute('y', `${Number.parseFloat(text.getAttribute('y')) + transform.y}`);
      tspan.textContent = textContent;

      text.textContent = '';
      text.appendChild(tspan);

      const { d } = convertTextToPathByFontkit(text, fontObj);

      ds.push(d);
    });
  });

  return ds.filter(Boolean).join(' ');
}

async function getSubtractedDFromBarcodeSvgElement(svgElement: SVGElement) {
  const { width, height } = svgElement.getBoundingClientRect();
  const backgroundPath = document.createElementNS(NS.SVG, 'path');

  backgroundPath.setAttribute('fill', 'black');
  backgroundPath.setAttribute('d', `M0 0h${width}v${height}H0z`);

  const d = await getDFromBarcodeSvgElement(svgElement);
  const codePath = document.createElementNS(NS.SVG, 'path');

  codePath.setAttribute('fill', 'black');
  codePath.setAttribute('d', d);

  const subtractedD = svgCanvas.pathActions.booleanOperation(
    new XMLSerializer().serializeToString(backgroundPath),
    new XMLSerializer().serializeToString(codePath),
    2
  );

  codePath.remove();
  backgroundPath.remove();

  return subtractedD;
}

export async function importBarcodeSvgElement(
  svgElement: SVGElement,
  isInvert = false
): Promise<void> {
  const batchCmd = new history.BatchCommand('Import Barcode');
  const d = isInvert
    ? await getSubtractedDFromBarcodeSvgElement(svgElement)
    : await getDFromBarcodeSvgElement(svgElement);

  const pathElement = svgCanvas.addSvgElementFromJson({
    element: 'path',
    curStyles: true,
    attr: { d, fill: 'black', opacity: 1, 'fill-opacity': 1, id: svgCanvas.getNextId() },
  });

  batchCmd.addSubCommand(new history.InsertElementCommand(pathElement));

  svgCanvas.updateElementColor(pathElement);
  svgCanvas.selectOnly([pathElement]);
  svgCanvas.zoomSvgElem(10);

  svgElement.remove();

  if (!batchCmd.isEmpty()) {
    undoManager.addCommandToHistory(batchCmd);
  }
}

/* QR Code */
function handleQrCodeInvertColor(svgElement: SVGElement): string {
  const size = svgElement.getAttribute('viewBox')?.split(' ')[2];
  const svg = document.createElementNS(NS.SVG, 'svg');

  svg.setAttribute('xmlns', NS.SVG);
  svg.setAttribute('height', '1000');
  svg.setAttribute('width', '1000');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);

  const [backgroundPath, codePath] = extractSvgTags(
    new XMLSerializer().serializeToString(svgElement),
    'path'
  );
  const subtractedD = svgCanvas.pathActions.booleanOperation(backgroundPath, codePath, 2);
  const path = document.createElementNS(NS.SVG, 'path');

  path.setAttribute('fill', 'black');
  path.setAttribute('d', subtractedD);

  svg.appendChild(path);

  const svgString = new XMLSerializer().serializeToString(svg);

  svg.remove();

  return svgString;
}

export async function importQrCodeSvgElement(
  svgElement: SVGElement,
  isInvert = false
): Promise<void> {
  const svgString = isInvert
    ? handleQrCodeInvertColor(svgElement)
    : new XMLSerializer().serializeToString(svgElement);

  await importSvgString(svgString, { type: 'layer' });
}
