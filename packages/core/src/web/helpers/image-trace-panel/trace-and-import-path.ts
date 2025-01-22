import history from '@core/app/svgedit/history/history';
import { moveElements } from '@core/app/svgedit/operations/move';
import requirejsHelper from '@core/helpers/requirejs-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const traceAndImportPath = async (
  imgBase64: string,
  dimension: { height: number; width: number; x: number; y: number },
): Promise<boolean> => {
  const ImageTracer = await requirejsHelper('imagetracer');
  const { height, width, x, y } = dimension;

  return new Promise((resolve) => {
    ImageTracer.imageToSVG(imgBase64, (svgstr: string) => {
      const gId = svgCanvas.getNextId();
      const batchCmd = new history.BatchCommand('Add Image Trace');
      const g = svgCanvas.addSvgElementFromJson<SVGGElement>({ attr: { id: gId }, element: 'g' });
      const path = svgCanvas.addSvgElementFromJson<SVGPathElement>({
        attr: {
          fill: '#000000',
          id: svgCanvas.getNextId(),
          'stroke-width': 1,
          'vector-effect': 'non-scaling-stroke',
        },
        element: 'path',
      });

      path.addEventListener('mouseover', svgCanvas.handleGenerateSensorArea);
      path.addEventListener('mouseleave', svgCanvas.handleGenerateSensorArea);
      batchCmd.addSubCommand(new history.InsertElementCommand(path));
      svgCanvas.selectOnly([g]);
      ImageTracer.appendSVGString(svgstr.replace(/<\/?svg[^>]*>/g, ''), gId);

      const gBBox = g.getBBox();

      if (width !== gBBox.width) {
        svgCanvas.setSvgElemSize('width', width);
      }

      if (height !== gBBox.height) {
        svgCanvas.setSvgElemSize('height', height);
      }

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
