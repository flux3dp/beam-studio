import ObjectPanelController from '@core/app/components/beambox/RightPanel/contexts/ObjectPanelController';
import NS from '@core/app/constants/namespaces';
import selector from '@core/app/svgedit/selector';
import textActions from '@core/app/svgedit/text/textactions';
import updateElementColor from '@core/helpers/color/updateElementColor';

import { getBBox } from '../../utils/getBBox';

import {
  getFitTextAlign,
  getFitTextSize,
  getFontSize,
  getIsVertical,
  getLetterSpacing,
  getLineSpacing,
  isFitText,
} from './getters';

const { svgedit } = window;

const renderTextPath = (text: SVGTextElement, val?: string) => {
  if (typeof val === 'string') {
    const textPath = text.querySelector('textPath');

    if (textPath) {
      textPath.textContent = val;
    }
  }
};

const renderTspan = (text: SVGTextElement, val?: string) => {
  const tspans = (Array.from(text.childNodes) as Element[]).filter(
    (child) => child.tagName === 'tspan',
  ) as SVGTextContentElement[];
  const lines = typeof val === 'string' ? val.split('\u0085') : tspans.map((tspan) => tspan.textContent ?? '');
  const isVertical = getIsVertical(text);
  const lineSpacing = getLineSpacing(text);
  const charHeight = getFontSize(text);
  const letterSpacing = getLetterSpacing(text);
  let isNewElementCreated = false;

  textActions.setIsVertical(isVertical);

  for (let i = 0; i < Math.max(lines.length, tspans.length); i += 1) {
    if (i < lines.length) {
      let tspan: SVGTextContentElement;

      if (tspans[i]) {
        tspan = tspans[i];
      } else {
        tspan = document.createElementNS(NS.SVG, 'tspan') as unknown as SVGTextContentElement;
        text.appendChild(tspan);
        isNewElementCreated = true;
      }

      tspan.textContent = lines[i];

      if (isVertical) {
        const xPos = Number(text.getAttribute('x')) - i * lineSpacing * charHeight;
        let yPos = Number(text.getAttribute('y'));
        // Always set first x, y position
        const x = [xPos.toFixed(2)];
        const y = [yPos.toFixed(2)];

        // Add more position if there are more than 2 characters
        for (let j = 1; j < lines[i].length; j += 1) {
          yPos += (1 + letterSpacing) * charHeight; // text spacing
          x.push(xPos.toFixed(2));
          y.push(yPos.toFixed(2));
        }
        tspan.setAttribute('x', x.join(' '));
        tspan.setAttribute('y', y.join(' '));
      } else {
        tspan.setAttribute('x', text.getAttribute('x')!);
        tspan.setAttribute('y', (Number(text.getAttribute('y')) + i * lineSpacing * charHeight).toFixed(2));
        tspan.textContent = lines[i];
        text.appendChild(tspan);
      }
    } else if (tspans[i]) {
      tspans[i].remove();
    }
  }

  if (isNewElementCreated) updateElementColor(text);
};

/**
 * Reconstruct manual lines from existing tspans, respecting data-wrapped markers.
 * When val is provided, split by \u0085 separator.
 * When val is not provided, read from DOM and group consecutive wrapped tspans.
 */
const getManualLines = (val: string | undefined, tspans: SVGTextContentElement[]): string[] => {
  if (typeof val === 'string') return val.split('\u0085');

  if (tspans.length === 0) return [''];

  const lines: string[] = [];
  let current = '';

  for (const tspan of tspans) {
    if (tspan.getAttribute('data-wrapped')) {
      current += tspan.textContent ?? '';
    } else {
      if (lines.length > 0 || current) {
        lines.push(current);
      }

      current = tspan.textContent ?? '';
    }
  }
  lines.push(current);

  return lines;
};

/**
 * Render fitText tspan elements with character-boundary auto-wrap.
 * Font size stays fixed; text wraps when it exceeds the box width.
 * Continuation tspans are marked with data-wrapped="1".
 */
const renderFitTextTspan = (text: SVGTextElement, val?: string) => {
  const existingTspans = (Array.from(text.childNodes) as Element[]).filter(
    (child) => child.tagName === 'tspan',
  ) as SVGTextContentElement[];
  const lines = getManualLines(val, existingTspans);
  const isVertical = getIsVertical(text);
  const lineSpacing = getLineSpacing(text);
  const charHeight = getFontSize(text);
  const letterSpacing = getLetterSpacing(text);
  const align = getFitTextAlign(text);

  let isNewElementCreated = false;

  textActions.setIsVertical(isVertical);

  // Remove all existing tspans — we rebuild them
  for (const tspan of existingTspans) {
    tspan.remove();
  }

  const createTspan = (): SVGTextContentElement => {
    const tspan = document.createElementNS(NS.SVG, 'tspan') as unknown as SVGTextContentElement;

    text.appendChild(tspan);
    isNewElementCreated = true;

    return tspan;
  };

  if (isVertical) {
    const fitTextSize = getFitTextSize(text);
    const textX = Number(text.getAttribute('x'));
    const textY = Number(text.getAttribute('y'));
    const charSpacing = (1 + letterSpacing) * charHeight;
    const charsPerColumn = charSpacing > 0 ? Math.max(1, Math.floor((fitTextSize - charHeight) / charSpacing) + 1) : 1;

    let columnIndex = 0;

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];

      if (line.length === 0) {
        const tspan = createTspan();
        const xPos = textX - columnIndex * lineSpacing * charHeight;
        let emptyY = textY + charHeight;

        if (align === 'middle' || align === 'justify') {
          emptyY = textY + charHeight + fitTextSize / 2;
        } else if (align === 'end') {
          emptyY = textY + charHeight + fitTextSize - charHeight;
        }

        tspan.textContent = '';
        tspan.setAttribute('x', xPos.toFixed(2));
        tspan.setAttribute('y', emptyY.toFixed(2));
        columnIndex += 1;

        continue;
      }

      // Split into sub-columns
      let remaining = line;
      let isFirstChunk = true;

      while (remaining.length > 0) {
        const chunk = remaining.substring(0, charsPerColumn);

        remaining = remaining.substring(charsPerColumn);

        const tspan = createTspan();

        tspan.textContent = chunk;

        if (!isFirstChunk) {
          tspan.setAttribute('data-wrapped', '1');
        }

        const xPos = textX - columnIndex * lineSpacing * charHeight;
        const n = chunk.length;
        const xValues: string[] = [];
        const yValues: string[] = [];

        const usedHeight = charHeight + (n - 1) * charSpacing;
        const remainingSpace = fitTextSize - usedHeight;
        let yOffset = 0;
        let effectiveSpacing = charSpacing;

        if (align === 'middle') {
          yOffset = remainingSpace / 2;
        } else if (align === 'end') {
          yOffset = remainingSpace;
        } else if (align === 'justify') {
          if (n > 1) {
            effectiveSpacing = (fitTextSize - charHeight) / (n - 1);
          } else {
            yOffset = remainingSpace / 2;
          }
        }

        for (let j = 0; j < n; j += 1) {
          xValues.push(xPos.toFixed(2));
          yValues.push((textY + charHeight + yOffset + j * effectiveSpacing).toFixed(2));
        }

        tspan.setAttribute('x', xValues.join(' '));
        tspan.setAttribute('y', yValues.join(' '));

        columnIndex += 1;
        isFirstChunk = false;
      }
    }

    // Vertical mode: remove text-anchor to avoid unwanted horizontal shift
    text.removeAttribute('text-anchor');
  } else {
    const fitTextSize = getFitTextSize(text);
    const textX = text.getAttribute('x')!;
    const baseY = Number(text.getAttribute('y'));

    let visualLineIndex = 0;

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];

      if (line.length === 0 || fitTextSize <= 0) {
        const tspan = createTspan();

        tspan.textContent = '';
        tspan.setAttribute('x', textX);
        tspan.setAttribute('y', (baseY + visualLineIndex * lineSpacing * charHeight).toFixed(2));
        tspan.removeAttribute('textLength');
        tspan.removeAttribute('lengthAdjust');
        tspan.removeAttribute('data-wrapped');
        visualLineIndex += 1;

        continue;
      }

      let remaining = line;
      let isFirstChunk = true;

      while (remaining.length > 0) {
        const tspan = createTspan();

        tspan.textContent = remaining;
        tspan.setAttribute('x', textX);
        tspan.setAttribute('y', (baseY + visualLineIndex * lineSpacing * charHeight).toFixed(2));

        if (align === 'justify') {
          tspan.setAttribute('textLength', fitTextSize.toString());
          tspan.setAttribute('lengthAdjust', 'spacing');
        } else {
          tspan.removeAttribute('textLength');
          tspan.removeAttribute('lengthAdjust');
        }

        if (!isFirstChunk) {
          tspan.setAttribute('data-wrapped', '1');
        } else {
          tspan.removeAttribute('data-wrapped');
        }

        const naturalWidth = tspan.getComputedTextLength();

        if (naturalWidth <= fitTextSize) {
          // Fits — done with this manual line
          break;
        }

        // Binary search for break point
        let low = 1;
        let high = remaining.length;
        let breakAt = 1;

        while (low <= high) {
          const mid = Math.floor((low + high) / 2);

          tspan.textContent = remaining.substring(0, mid);

          if (tspan.getComputedTextLength() <= fitTextSize) {
            breakAt = mid;
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }

        tspan.textContent = remaining.substring(0, breakAt);

        remaining = remaining.substring(breakAt);
        isFirstChunk = false;
        visualLineIndex += 1;
      }

      visualLineIndex += 1;
    }

    // Horizontal mode: set text-anchor for SVG rendering
    text.setAttribute('text-anchor', align === 'justify' ? 'middle' : align);
  }

  if (isNewElementCreated) updateElementColor(text);
};

/**
 * Render text element
 * @param elem text | text path container element
 * @param val text to display, break line with \u0085, use current text content if not provided
 * @param showGrips show grip or not
 */
export const renderText = (elem: SVGGElement | SVGTextElement, val?: string, showGrips?: boolean): void => {
  if (!elem) {
    return;
  }

  let textElem = elem;
  const isFitTextElem = isFitText(elem);

  if (elem.getAttribute('data-textpath-g')) {
    const text = elem.querySelector('text');

    if (text) {
      renderTextPath(text, val);
      textElem = text;
    }
  } else if (elem.getAttribute('data-textpath')) {
    renderTextPath(elem as SVGTextElement, val);
  } else if (isFitTextElem) {
    renderFitTextTspan(elem as SVGTextElement, val);
  } else {
    // render multiLine Text
    renderTspan(elem as SVGTextElement, val);
  }

  svgedit.recalculate.recalculateDimensions(textElem);

  const selectorManager = selector.getSelectorManager();

  if (showGrips) {
    selectorManager.requestSelector(textElem)?.resize();
  }

  if (isFitTextElem) {
    // The fit text bbox may change after rendering, so update selector and dimension panel
    if (!showGrips) {
      selectorManager.resizeSelectors([textElem]);
    }

    ObjectPanelController.updateDimensionValues(getBBox(textElem as SVGTextElement));
  }
};

export const renderAll = (elems: SVGElement[]): void => {
  elems.forEach((elem) => renderText(elem as SVGTextElement));
};
