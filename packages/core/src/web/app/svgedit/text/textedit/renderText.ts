import NS from '@core/app/constants/namespaces';
import selector from '@core/app/svgedit/selector';
import textActions from '@core/app/svgedit/text/textactions';
import updateElementColor from '@core/helpers/color/updateElementColor';

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
 * Render fitText tspan elements with textLength compression.
 * For lines wider than the box, textLength is applied to compress.
 * For shorter lines, text-anchor handles alignment.
 */
const renderFitTextTspan = (text: SVGTextElement, val?: string) => {
  const tspans = (Array.from(text.childNodes) as Element[]).filter(
    (child) => child.tagName === 'tspan',
  ) as SVGTextContentElement[];
  const lines = typeof val === 'string' ? val.split('\u0085') : tspans.map((tspan) => tspan.textContent ?? '');
  const isVertical = getIsVertical(text);
  const lineSpacing = getLineSpacing(text);
  const charHeight = getFontSize(text);
  const letterSpacing = getLetterSpacing(text);
  const align = getFitTextAlign(text);

  let isNewElementCreated = false;

  textActions.setIsVertical(isVertical);

  if (isVertical) {
    const height = Number.parseFloat(text.getAttribute('data-fit-text-size') || '0');
    const textX = Number(text.getAttribute('x'));
    const textY = Number(text.getAttribute('y'));

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
        tspan.removeAttribute('textLength');
        tspan.removeAttribute('lengthAdjust');

        const xPos = textX - i * lineSpacing * charHeight;
        const n = lines[i].length;

        if (n === 0) {
          tspan.setAttribute('x', xPos.toFixed(2));
          tspan.setAttribute('y', textY.toFixed(2));
        } else {
          const charsHeight = n * charHeight;
          const spacingHeight = n > 0 ? (n - 1) * letterSpacing * charHeight : 0;
          const naturalSpan = charsHeight + spacingHeight;
          let spacing: number;
          let yStart = textY;

          if (align === 'justify' || naturalSpan > height) {
            spacing = n > 1 ? (height - charHeight) / (n - 1) : 0;
            yStart = textY;
          } else {
            spacing = (1 + letterSpacing) * charHeight;

            if (align === 'middle') {
              yStart = textY + (height - naturalSpan) / 2 - charHeight / 2;
            } else if (align === 'end') {
              yStart = textY + height - naturalSpan;
            } else {
              yStart = textY;
            }
          }

          yStart += charHeight; // adjust for first character

          const xValues: string[] = [];
          const yValues: string[] = [];

          for (let j = 0; j < n; j += 1) {
            xValues.push(xPos.toFixed(2));
            yValues.push((yStart + j * spacing).toFixed(2));
          }
          tspan.setAttribute('x', xValues.join(' '));
          tspan.setAttribute('y', yValues.join(' '));
        }
      } else if (tspans[i]) {
        tspans[i].remove();
      }
    }

    // Vertical mode: remove text-anchor to avoid unwanted horizontal shift
    text.removeAttribute('text-anchor');
  } else {
    const fitTextWidth = getFitTextSize(text);
    const textX = text.getAttribute('x')!;

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
        tspan.setAttribute('x', textX);
        tspan.setAttribute('y', (Number(text.getAttribute('y')) + i * lineSpacing * charHeight).toFixed(2));

        // Remove textLength first to measure natural width
        tspan.removeAttribute('textLength');
        tspan.removeAttribute('lengthAdjust');

        // Measure natural width and apply textLength if needed
        if (lines[i].length > 0 && fitTextWidth > 0) {
          const naturalWidth = tspan.getComputedTextLength();

          if (align === 'justify' || naturalWidth > fitTextWidth) {
            tspan.setAttribute('textLength', fitTextWidth.toString());
            tspan.setAttribute('lengthAdjust', 'spacing');
          }
        }
      } else if (tspans[i]) {
        tspans[i].remove();
      }
    }

    // Horizontal mode: set text-anchor for SVG rendering
    text.setAttribute('text-anchor', align === 'justify' ? 'start' : align);
  }

  if (isNewElementCreated) updateElementColor(text);
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
