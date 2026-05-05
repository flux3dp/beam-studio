import fontFuncs from '@core/app/actions/beambox/font-funcs';
import NS from '@core/app/constants/namespaces';

import type { KeyChainState, TextOptionDef } from '../types';

/**
 * Creates a <text> element with font attributes loaded and applied.
 */
const createBaseTextElement = async (
  font: { family: string; postscriptName: string; style: string },
  fontSize: number,
  letterSpacing: number,
): Promise<SVGTextElement> => {
  const text = document.createElementNS(NS.SVG, 'text');

  text.setAttribute('font-family', `'${font.family}'`);
  text.setAttribute('font-postscript', font.postscriptName);
  text.setAttributeNS(NS.XML, 'xml:space', 'preserve');

  try {
    await Promise.race([
      document.fonts.load(`${fontSize}px '${font.family}'`),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
  } catch {
    console.error(`Fail to load ${font.family}`);
  }

  const fontDesc = fontFuncs.getFontOfPostscriptName(font.postscriptName);

  if (fontDesc) {
    text.setAttribute('font-weight', String(fontDesc.weight ?? 400));

    if (fontDesc.italic) {
      text.setAttribute('font-style', 'italic');
    }
  }

  text.setAttribute('font-size', String(fontSize));
  text.setAttribute('fill', '#000');
  text.setAttribute('text-anchor', 'middle');

  if (letterSpacing !== 0) {
    text.setAttribute('letter-spacing', String(letterSpacing));
  }

  return text;
};

/**
 * Creates an SVG <text> element with <tspan> children for multi-line text.
 */
export const createTextElement = async (
  content: string,
  font: { family: string; postscriptName: string; style: string },
  fontSize: number,
  letterSpacing: number,
  lineSpacing: number,
  bounds?: { height: number; width: number; x: number; y: number },
): Promise<SVGTextElement> => {
  const text = await createBaseTextElement(font, fontSize, letterSpacing);

  const lines = content.split('\n');
  const lineHeight = fontSize * lineSpacing;
  const x = bounds ? bounds.x + bounds.width / 2 : 0;
  const y = bounds ? bounds.y + fontSize : fontSize;

  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (lines[i].trim() === '') {
      lines.pop();
    } else {
      break;
    }
  }

  for (let i = 0; i < lines.length; i += 1) {
    const tspan = document.createElementNS(NS.SVG, 'tspan');

    tspan.setAttribute('x', String(x));
    tspan.textContent = lines[i];
    tspan.setAttribute('y', String(y + i * lineHeight));
    text.appendChild(tspan);
  }

  return text;
};

/**
 * Creates an invisible reference <path> (marked with data-textpath-ref) and a
 * <text><textPath> element for text-on-path.
 */
export const createTextPath = async (
  content: string,
  font: { family: string; postscriptName: string; style: string },
  fontSize: number,
  letterSpacing: number,
  pathD: string,
  pathId: string,
): Promise<{ refPath: SVGPathElement; textEl: SVGTextElement }> => {
  // Invisible reference path
  const refPath = document.createElementNS(NS.SVG, 'path');

  refPath.setAttribute('id', pathId);
  refPath.setAttribute('d', pathD);
  refPath.setAttribute('fill', 'none');
  refPath.setAttribute('stroke', 'none');
  refPath.setAttribute('data-textpath-ref', 'true');

  // Text element
  const textEl = await createBaseTextElement(font, fontSize, letterSpacing);

  // textPath child — newlines replaced with spaces since textPath is single-line
  const textPath = document.createElementNS(NS.SVG, 'textPath');

  textPath.setAttribute('href', `#${pathId}`);
  textPath.setAttribute('startOffset', '50%');
  textPath.textContent = content.replace(/\n/g, ' ');
  textEl.appendChild(textPath);

  return { refPath, textEl };
};

/**
 * Updates font-size, first tspan y, and subsequent tspan dy on an existing text element.
 */
const updateTextFontSize = (textEl: SVGTextElement, fontSize: number, lineSpacing: number, boundsY: number): void => {
  textEl.setAttribute('font-size', String(fontSize));

  const lineHeight = fontSize * lineSpacing;
  const baseY = boundsY + fontSize;

  textEl.querySelectorAll('tspan').forEach((tspan, i) => {
    tspan.setAttribute('y', String(baseY + i * lineHeight));
  });
};

const attachSvgForMeasurement = (svg: SVGSVGElement): void => {
  svg.style.visibility = 'hidden';
  document.body.appendChild(svg);
};

const detachSvgAfterMeasurement = (svg: SVGSVGElement): void => {
  document.body.removeChild(svg);
  svg.style.removeProperty('visibility');
};

/**
 * Measures the bounding box of a text element by temporarily attaching the
 * parent SVG to the DOM. The SVG is removed after measurement.
 */
const measureTextBBox = (svg: SVGSVGElement, textEl: SVGTextElement): DOMRect => {
  const bbox = textEl.getBBox();

  return bbox;
};

/**
 * Applies all text options to the SVG element:
 * 1. For each enabled text def, create a <text> element and append to svg
 * 2. Temporarily attach svg to DOM, measure actual bbox
 * 3. If bbox exceeds bounds, scale down fontSize to fit
 * 4. Detach svg from DOM
 */
export const applyTexts = async (
  svg: SVGSVGElement,
  state: KeyChainState,
  textDefs: TextOptionDef[],
): Promise<void> => {
  for (const textDef of textDefs) {
    const textValues = state.texts[textDef.id];

    if (!textValues?.enabled || !textValues.text.trim()) continue;

    const { font, fontSize, letterSpacing, lineSpacing, text } = textValues;

    // Text-on-path mode
    if ('path' in textDef) {
      const pathId = `kc-tp-${textDef.id}`;
      const { refPath, textEl } = await createTextPath(text, font, fontSize, letterSpacing, textDef.path, pathId);

      svg.appendChild(refPath);
      svg.appendChild(textEl);

      continue;
    }

    // Bounded tspan mode (original behavior)
    const { bounds } = textDef;
    const textEl = await createTextElement(text, font, fontSize, letterSpacing, lineSpacing, bounds);

    svg.appendChild(textEl);
    attachSvgForMeasurement(svg);

    // Auto-resize loop: scale down fontSize until text fits within bounds
    const MAX_ITERATIONS = 10;
    let currentFontSize = fontSize;
    let finalBBox = measureTextBBox(svg, textEl);

    for (let i = 0; i < MAX_ITERATIONS; i += 1) {
      if (finalBBox.width <= bounds.width && finalBBox.height <= bounds.height) break;

      const scale = Math.min(bounds.width / finalBBox.width, bounds.height / finalBBox.height, 1);

      currentFontSize = Math.floor(currentFontSize * scale);

      if (currentFontSize <= 0) break;

      updateTextFontSize(textEl, currentFontSize, lineSpacing, bounds.y);
      finalBBox = measureTextBBox(svg, textEl);
    }

    detachSvgAfterMeasurement(svg);

    // Vertical center: shift the first tspan's y so text block is centered in bounds
    const offsetY = bounds.y + bounds.height / 2 - (finalBBox.y + finalBBox.height / 2);

    textEl.querySelectorAll('tspan').forEach((tspan) => {
      const y = Number.parseFloat(tspan.getAttribute('y') ?? '0');

      tspan.setAttribute('y', String(y + offsetY));
    });
  }
};
