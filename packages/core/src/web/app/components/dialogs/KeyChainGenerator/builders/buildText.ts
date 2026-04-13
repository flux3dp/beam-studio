import fontFuncs from '@core/app/actions/beambox/font-funcs';
import NS from '@core/app/constants/namespaces';

import type { KeyChainState, TextOptionDef } from '../types';

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
  const text = document.createElementNS(NS.SVG, 'text');

  text.setAttribute('font-family', `'${font.family}'`);
  text.setAttribute('font-postscript', font.postscriptName);
  text.setAttributeNS(NS.XML, 'xml:space', 'preserve');

  try {
    await Promise.race([
      document.fonts.load(`${fontSize}px '${font.family}'`),
      new Promise((resolve) => setTimeout(resolve, 3000)), // timeout to prevent hanging if font fails to load
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

/**
 * Measures the bounding box of a text element by temporarily attaching the
 * parent SVG to the DOM. The SVG is removed after measurement.
 */
const measureTextBBox = (svg: SVGSVGElement, textEl: SVGTextElement): DOMRect => {
  svg.style.visibility = 'hidden';
  document.body.appendChild(svg);

  const bbox = textEl.getBBox();

  document.body.removeChild(svg);
  svg.style.removeProperty('visibility');

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

    const { bounds } = textDef;
    const { font, fontSize, letterSpacing, lineSpacing, text } = textValues;
    const textEl = await createTextElement(text, font, fontSize, letterSpacing, lineSpacing, bounds);

    svg.appendChild(textEl);

    // Auto-resize loop: scale down fontSize until text fits within bounds
    const MAX_ITERATIONS = 10;
    let currentFontSize = fontSize;
    let finalBBox = measureTextBBox(svg, textEl);

    for (let i = 0; i < MAX_ITERATIONS; i += 1) {
      if (finalBBox.width <= bounds.width && finalBBox.height <= bounds.height) break;

      const scale = Math.min(bounds.width / finalBBox.width, bounds.height / finalBBox.height, 1);

      currentFontSize = Math.floor(currentFontSize * scale);
      updateTextFontSize(textEl, currentFontSize, lineSpacing, bounds.y);
      finalBBox = measureTextBBox(svg, textEl);
    }

    // Vertical center: shift the first tspan's y so text block is centered in bounds
    const offsetY = bounds.y + bounds.height / 2 - (finalBBox.y + finalBBox.height / 2);

    textEl.querySelectorAll('tspan').forEach((tspan) => {
      const y = Number.parseFloat(tspan.getAttribute('y') ?? '0');

      tspan.setAttribute('y', String(y + offsetY));
    });
  }
};
