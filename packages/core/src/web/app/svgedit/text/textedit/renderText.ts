import NS from '@core/app/constants/namespaces';
import selector from '@core/app/svgedit/selector';
import textActions from '@core/app/svgedit/text/textactions';
import updateElementColor from '@core/helpers/color/updateElementColor';

import { getFontSize, getIsVertical, getLetterSpacing, getLineSpacing, isFitText } from './getters';

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
    if (tspan.getAttribute('data-wrapped') === 'true') {
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
 * Render text element
 * @param elem element
 * @param val text to display, break line with \u0085, use current text content if not provided
 * @param showGrips show grip or not
 */
export const renderText = (elem: Element, val?: string, showGrips?: boolean): void => {
  if (!elem) {
    return;
  }

  let textElem = elem;

  if (elem.getAttribute('data-textpath-g')) {
    const text = elem.querySelector('text');

    if (text) {
      renderTextPath(text, val);
      textElem = text;
    }
  } else if (elem.getAttribute('data-textpath')) {
    renderTextPath(elem as SVGTextElement, val);
  } else if (isFitText(elem)) {
    renderFitTextTspan(elem as SVGTextElement, val);
  } else {
    // render multiLine Text
    renderTspan(elem as SVGTextElement, val);
  }

  svgedit.recalculate.recalculateDimensions(textElem);

  if (showGrips) {
    const selectorManager = selector.getSelectorManager();

    selectorManager.requestSelector(textElem)?.resize();
  }
};

export const renderAll = (elems: SVGElement[]): void => {
  elems.forEach((elem) => renderText(elem));
};
