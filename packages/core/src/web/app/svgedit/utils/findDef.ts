import { match } from 'ts-pattern';

import NS from '@core/app/constants/namespaces';

export const findDefs = (defType: 'all' | 'image' | 'path' = 'all'): SVGDefsElement => {
  let svgElement = document.getElementById('svg_defs') as unknown as SVGSVGElement;

  if (!svgElement) {
    const svgCanvas = document.getElementById('svgcanvas') as unknown as SVGSVGElement;
    const svgdoc = svgCanvas.ownerDocument;

    svgElement = svgdoc.createElementNS(NS.SVG, 'svg') as unknown as SVGSVGElement;

    svgElement.setAttribute('id', 'svg_defs');
    svgCanvas.appendChild(svgElement);
  }

  const res = svgElement.getElementsByTagNameNS(NS.SVG, 'defs') as unknown as SVGDefsElement[];
  let defs: SVGDefsElement;

  if (res.length > 0) {
    [defs] = res;
  } else {
    defs = svgElement.ownerDocument.createElementNS(NS.SVG, 'defs') as SVGDefsElement;
    svgElement.insertBefore(defs, svgElement.firstChild);
  }

  console.log(`findDefs: ${defType}`, defs);

  return match(defType)
    .with('image', () => {
      const imageDefs = defs.querySelectorAll('image');

      if (imageDefs.length > 0) {
        return imageDefs[0].parentElement as SVGDefsElement;
      }

      return defs;
    })
    .with('path', () => {
      const pathDefs = defs.querySelectorAll('path');

      if (pathDefs.length > 0) {
        return pathDefs[0].parentElement as SVGDefsElement;
      }

      return defs;
    })
    .otherwise(() => defs);
};

export default findDefs;
