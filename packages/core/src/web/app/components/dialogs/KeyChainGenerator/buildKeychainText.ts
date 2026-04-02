import fontFuncs from '@core/app/actions/beambox/font-funcs';
import NS from '@core/app/constants/namespaces';

import type { KeyChainState, TextOptionDef } from './types';

/**
 * Creates an SVG <text> element with <tspan> children for multi-line text.
 */
const createTextElement = (
  textDef: TextOptionDef,
  content: string,
  font: { family: string; postscriptName: string; style: string },
  fontSize: number,
  letterSpacing: number,
  lineSpacing: number,
): SVGTextElement => {
  const { bounds } = textDef;
  const text = document.createElementNS(NS.SVG, 'text');

  text.setAttribute('font-family', `'${font.family}'`);
  text.setAttribute('font-postscript', font.postscriptName);

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
  const centerX = bounds.x + bounds.width / 2;

  for (let i = 0; i < lines.length; i += 1) {
    const tspan = document.createElementNS(NS.SVG, 'tspan');

    tspan.setAttribute('x', String(centerX));
    tspan.textContent = lines[i];

    if (i === 0) {
      tspan.setAttribute('y', String(bounds.y + fontSize));
    } else {
      tspan.setAttribute('dy', String(lineHeight));
    }

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
  const tspans = textEl.querySelectorAll('tspan');

  tspans.forEach((tspan, i) => {
    if (i === 0) {
      tspan.setAttribute('y', String(boundsY + fontSize));
    } else {
      tspan.setAttribute('dy', String(lineHeight));
    }
  });
};

/**
 * Measures the bounding box of a text element by temporarily attaching the
 * parent SVG to the DOM. The SVG is removed after measurement.
 */
const measureTextBBox = (svg: SVGSVGElement, textEl: SVGTextElement): { height: number; width: number } => {
  svg.style.visibility = 'hidden';
  document.body.appendChild(svg);

  const bbox = textEl.getBBox();
  const result = { height: bbox.height, width: bbox.width };

  document.body.removeChild(svg);
  svg.style.removeProperty('visibility');

  return result;
};

/**
 * Applies all text options to the SVG element:
 * 1. For each enabled text def, create a <text> element and append to svg
 * 2. Temporarily attach svg to DOM, measure actual bbox
 * 3. If bbox exceeds bounds, scale down fontSize to fit
 * 4. Detach svg from DOM
 */
export const applyTexts = (svg: SVGSVGElement, state: KeyChainState, textDefs: TextOptionDef[]): void => {
  for (const textDef of textDefs) {
    const textValues = state.texts[textDef.id];

    if (!textValues?.enabled || !textValues.content.trim()) continue;

    const { bounds } = textDef;
    const { content, font, fontSize, letterSpacing, lineSpacing } = textValues;

    const textEl = createTextElement(textDef, content, font, fontSize, letterSpacing, lineSpacing);

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
    const offsetY = (bounds.height - finalBBox.height) / 2;
    const firstTspan = textEl.querySelector('tspan');

    if (firstTspan) {
      const currentY = Number.parseFloat(firstTspan.getAttribute('y') ?? '0');

      firstTspan.setAttribute('y', String(currentY + offsetY));
    }
  }
};
