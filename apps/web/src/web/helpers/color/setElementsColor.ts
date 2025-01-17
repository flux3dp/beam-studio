import symbolMaker from 'helpers/symbol-maker';
import updateImageDisplay from 'helpers/image/updateImageDisplay';

const endByLayerSymbol = Symbol('end by_layer');
const endByColorSymbol = Symbol('end by_color');

// TODO: add test
const setElementsColor = (
  elements: Element[],
  color: string,
  isFullColor = false
): Promise<void> => {
  const descendants: (Element | typeof endByLayerSymbol | typeof endByColorSymbol)[] = [
    ...elements,
  ];
  let svgByColor = 0;
  let isWireFrame = false;
  const promises = [];
  while (descendants.length > 0) {
    const elem = descendants.pop();
    if (elem === endByColorSymbol) {
      svgByColor -= 1;
    } else if (elem === endByLayerSymbol) {
      isWireFrame = false;
    } else {
      const attrStroke = elem.getAttribute('stroke');
      const attrFill = elem.getAttribute('fill');
      const attrFillOpacity = elem.getAttribute('fill-opacity');
      if (['rect', 'circle', 'ellipse', 'path', 'polygon', 'text', 'line'].includes(elem.tagName)) {
        if (!isFullColor) {
          // remove stroke for self drawn elements, set stroke color for imported elements
          elem.removeAttribute('stroke-width');
          elem.setAttribute('vector-effect', 'non-scaling-stroke');
          if (((isWireFrame && svgByColor === 0) || attrStroke) && attrStroke !== 'none') {
            elem.setAttribute('stroke', color);
          }
          if (
            !['none', '#fff', '#ffffff'].includes(attrFill?.toLowerCase()) &&
            attrFillOpacity !== '0' &&
            !isWireFrame
          ) {
            elem.setAttribute('fill', color);
            elem.setAttribute('fill-opacity', '1');
          }
        } else {
          elem.removeAttribute('vector-effect');
        }
      } else if (elem.tagName === 'image') {
        // eslint-disable-next-line no-async-promise-executor
        const promise = new Promise<void>(async (resolve) => {
          if (!elem.closest('#svg_defs')) await updateImageDisplay(elem as SVGImageElement);
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
        const symbol = (elem.getRootNode() as Element).querySelector(href);
        if (symbol) descendants.push(symbol);
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
