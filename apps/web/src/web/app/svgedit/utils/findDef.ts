import NS from 'app/constants/namespaces';

const findDefs = (): SVGDefsElement => {
  let svgElement = document.getElementById('svg_defs') as unknown as SVGSVGElement;
  if (!svgElement) {
    const svgCanvas = document.getElementById('svgcanvas');
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
  return defs;
};

export default findDefs;
