import { CanvasElements } from '@core/app/constants/canvasElements';
import updateImageDisplay from '@core/helpers/image/updateImageDisplay';
import symbolMaker from '@core/helpers/symbol-helper/symbolMaker';

const endByLayerSymbol = Symbol('end by_layer');
const endByColorSymbol = Symbol('end by_color');

// TODO: add test
const setElementsColor = (elements: Element[], color: string, isFullColor = false): Promise<void> => {
  const descendants: Array<Element | typeof endByColorSymbol | typeof endByLayerSymbol> = [...elements];
  let svgByColor = 0;
  let isWireFrame = false;
  const promises: Array<Promise<void>> = [];

  while (descendants.length > 0) {
    const elem = descendants.pop()!;

    if (elem === endByColorSymbol) {
      svgByColor -= 1;
    } else if (elem === endByLayerSymbol) {
      isWireFrame = false;
    } else {
      const attrStroke = elem.getAttribute('stroke');
      const attrFill = elem.getAttribute('fill');
      const attrFillOpacity = elem.getAttribute('fill-opacity');

      if (CanvasElements.colorfulElems.includes(elem.tagName)) {
        if (!isFullColor) {
          // remove stroke for self drawn elements, set stroke color for imported elements
          if (elem.tagName === 'text') {
            elem.setAttribute('stroke-width', '2');
            elem
              .querySelectorAll('tspan, textpath')
              .forEach((child) => child.setAttribute('vector-effect', 'non-scaling-stroke'));
          } else {
            elem.removeAttribute('stroke-width');
          }

          elem.setAttribute('vector-effect', 'non-scaling-stroke');

          if (((isWireFrame && svgByColor === 0) || attrStroke) && attrStroke !== 'none') {
            elem.setAttribute('stroke', color);
          }

          if (
            !['#fff', '#ffffff', 'none'].includes(attrFill?.toLowerCase() ?? '') &&
            attrFillOpacity !== '0' &&
            !isWireFrame
          ) {
            elem.setAttribute('fill', color);
            elem.setAttribute('fill-opacity', '1');
          } else if (['#fff', '#ffffff'].includes(attrFill?.toLowerCase() ?? '')) {
            elem.setAttribute('fill', 'none');
            elem.setAttribute('fill-opacity', '0');
          }
        } else {
          elem.removeAttribute('vector-effect');

          if (elem.tagName === 'text') {
            elem.querySelectorAll('tspan, textpath').forEach((child) => child.removeAttribute('vector-effect'));
          }
        }
      } else if (elem.tagName === 'image') {
        // eslint-disable-next-line no-async-promise-executor
        const promise = new Promise<void>(async (resolve) => {
          if (!elem.closest('#svg_defs')) {
            await updateImageDisplay(elem as SVGImageElement);
          }

          if (isFullColor || color === '#000') {
            elem.removeAttribute('filter');
          } else {
            elem.setAttribute('filter', `url(#filter${color})`);
          }

          resolve();
        });

        promises.push(promise);
      } else if (['g', 'svg', 'symbol'].includes(elem.tagName)) {
        if (elem.getAttribute('data-color')) {
          descendants.push(endByColorSymbol);
          svgByColor += 1;
        }

        descendants.push(...(elem.childNodes as unknown as Element[]));
      } else if (elem.tagName === 'use') {
        if (elem.getAttribute('data-wireframe')) {
          descendants.push(endByLayerSymbol);
          isWireFrame = true;
        }

        descendants.push(...(elem.childNodes as unknown as Element[]));

        const href = elem.getAttribute('href') || elem.getAttribute('xlink:href');
        const symbol = href ? (elem.getRootNode() as Element).querySelector(href) : null;

        if (symbol) {
          descendants.push(symbol);
        }

        const promise = symbolMaker.reRenderImageSymbol(elem as SVGUseElement);

        promises.push(promise);
      } else {
        // console.log(`setElementsColor: unsupported element type ${elem.tagName}`);
      }
    }
  }

  return new Promise<void>((resolve) => {
    Promise.allSettled(promises).then(() => {
      resolve();
    });
  });
};

export default setElementsColor;
