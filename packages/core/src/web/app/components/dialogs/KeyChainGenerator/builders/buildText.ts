import { createTextElement, createTextPath } from '@core/helpers/generator/textElement';

import type { KeyChainState, TextOptionDef } from '../types';

export { createTextElement, createTextPath };

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
