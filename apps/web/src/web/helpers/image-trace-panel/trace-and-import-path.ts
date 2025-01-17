import history from 'app/svgedit/history/history';
import ISVGCanvas from 'interfaces/ISVGCanvas';
import requirejsHelper from 'helpers/requirejs-helper';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { moveElements } from 'app/svgedit/operations/move';

let svgCanvas: ISVGCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const traceAndImportPath = async (
  imgBase64: string,
  dimension: { x: number; y: number; width: number; height: number }
): Promise<boolean> => {
  const ImageTracer = await requirejsHelper('imagetracer');
  const { x, y, width, height } = dimension;
  return new Promise((resolve) => {
    ImageTracer.imageToSVG(imgBase64, (svgstr: string) => {
      const gId = svgCanvas.getNextId();
      const batchCmd = new history.BatchCommand('Add Image Trace');
      const g = svgCanvas.addSvgElementFromJson<SVGGElement>({ element: 'g', attr: { id: gId } });
      const path = svgCanvas.addSvgElementFromJson<SVGPathElement>({
        element: 'path',
        attr: {
          id: svgCanvas.getNextId(),
          fill: '#000000',
          'stroke-width': 1,
          'vector-effect': 'non-scaling-stroke',
        },
      });
      path.addEventListener('mouseover', svgCanvas.handleGenerateSensorArea);
      path.addEventListener('mouseleave', svgCanvas.handleGenerateSensorArea);
      batchCmd.addSubCommand(new history.InsertElementCommand(path));
      svgCanvas.selectOnly([g]);
      ImageTracer.appendSVGString(svgstr.replace(/<\/?svg[^>]*>/g, ''), gId);
      const gBBox = g.getBBox();
      if (width !== gBBox.width) svgCanvas.setSvgElemSize('width', width);
      if (height !== gBBox.height) svgCanvas.setSvgElemSize('height', height);
      let d = '';
      for (let i = 0; i < g.childNodes.length; i += 1) {
        const child = g.childNodes[i] as Element;
        if (child.getAttribute('opacity') !== '0') {
          d += child.getAttribute('d');
        }
        child.remove();
        i -= 1;
      }
      g.remove();
      path.setAttribute('d', d);
      moveElements([x], [y], [path], false);
      svgCanvas.selectOnly([path], true);
      svgCanvas.undoMgr.addCommandToHistory(batchCmd);
      resolve(true);
    });
  });
};

export default traceAndImportPath;
