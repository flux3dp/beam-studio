import { match, P } from 'ts-pattern';

import alertCaller from '@core/app/actions/alert-caller';
import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import progressCaller from '@core/app/actions/progress-caller';
import alertConstants from '@core/app/constants/alert-constants';
import history from '@core/app/svgedit/history/history';
import updateElementColor from '@core/helpers/color/updateElementColor';
import i18n from '@core/helpers/i18n';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import ClipperBase from '../clipper';
import getClipperLib from '../getClipperLib';

import { buildSvgPathD } from './buildSvgPathD';
import { ARC_TOLERANCE, MITER_LIMIT, type OffsetMode, SCALE_FACTOR } from './constants';
import { processElementForOffset } from './processElementForOffset';
import { showOffsetAlert } from './showOffSetAlert';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

const offsetElements = async (
  mode: OffsetMode,
  distance: number,
  cornerType: 'round' | 'sharp',
  elems?: SVGElement[],
): Promise<void> => {
  progressCaller.openNonstopProgress({ id: 'offset-path', message: i18n.lang.beambox.popup.progress.calculating });
  // Brief pause for UI to update
  await new Promise((resolve) => setTimeout(resolve, 50));

  const targetElements = elems || svgCanvas.getSelectedElems(true);

  if (targetElements.length === 0) {
    progressCaller.popById('offset-path');
    console.log('No elements selected or provided for offset.');

    return;
  }

  // For 'Filled' modes, only one element is supported
  if (targetElements.length > 1 && ['inwardFilled', 'outwardFilled'].includes(mode)) {
    alertCaller.popUp({
      id: 'OffsetMultipleNotSupported',
      message: 'This operation mode currently supports only a single selected element to adjust its internal gaps.',
      type: alertConstants.SHOW_POPUP_WARNING,
    });
    progressCaller.popById('offset-path');

    return;
  }

  const elementToOffset = targetElements[0];
  const ClipperLib = getClipperLib();
  const co = new ClipperBase('offset', MITER_LIMIT, ARC_TOLERANCE);
  const delta: number = match(mode)
    .with(P.union('outwardFilled', 'outwardOutline'), () => distance * SCALE_FACTOR)
    .with(P.union('inwardFilled', 'inwardOutline'), () => -distance * SCALE_FACTOR)
    .exhaustive();
  const processResult = await processElementForOffset(elementToOffset, co, ClipperLib, cornerType);

  if (processResult.isUnsupported || !processResult.success) {
    if (processResult.isUnsupported) showOffsetAlert('unsupported');
    else showOffsetAlert('failed');

    progressCaller.popById('offset-path');
    co.terminate();

    return;
  }

  let solutionPaths: Array<Array<{ X: number; Y: number }>> = [];

  try {
    solutionPaths = await co.execute([], delta);
  } catch (clipperError) {
    console.error('Clipper execution failed:', clipperError);

    showOffsetAlert('failed');
    progressCaller.popById('offset-path');
    co.terminate();

    return;
  } finally {
    // Terminate clipper instance for offset operation, but not for union if needed next
    if (!(['inwardFilled', 'outwardOutline'].includes(mode) && solutionPaths.length > 1)) {
      co.terminate();
    }
  }

  solutionPaths = solutionPaths.filter((path) => path?.length > 0);

  // Union operation for specific modes if multiple paths result
  if (['inwardFilled', 'outwardOutline'].includes(mode) && solutionPaths.length > 1) {
    console.log(`Mode ${mode} resulted in ${solutionPaths.length} paths, attempting to union.`);

    const unionClipper = new ClipperBase('clipper'); // Setup for boolean ops

    try {
      await unionClipper.addPaths(solutionPaths, ClipperLib.PolyType.ptSubject, true);

      const clipTypeUnion = ClipperLib.ClipType.ctUnion;
      const fillRule = ClipperLib.PolyFillType.pftNonZero;
      const unionedResultPaths = (await unionClipper.execute(
        clipTypeUnion,
        new ClipperLib.Paths(),
        fillRule,
        fillRule,
      )) as Array<Array<{ X: number; Y: number }>>;

      solutionPaths = unionedResultPaths.filter((path) => path?.length > 0);
    } catch (unionError) {
      console.error('Union operation failed:', unionError);
      showOffsetAlert('failed');
      progressCaller.popById('offset-path');

      return;
    } finally {
      unionClipper.terminate();
      co.terminate(); // ensure original co is also terminated
    }
  } else if (solutionPaths.length > 0) {
    co.terminate();
  }

  progressCaller.popById('offset-path'); // Pop progress after all computations

  if (solutionPaths.length === 0) {
    // This implies either the offset or the union (if attempted) resulted in no paths.
    showOffsetAlert('failed');
    console.log('Offset operation produced no valid paths.');

    return;
  }

  const pathD = buildSvgPathD(solutionPaths, beamboxPreference.read('simplify_clipper_path'));

  if (!pathD) {
    console.log('Failed to build path string D from solution paths.');
    showOffsetAlert('failed');

    return;
  }

  const batchCmd = new history.BatchCommand('Create Offset Elements');
  const newElem = svgCanvas.addSvgElementFromJson({
    attr: { d: pathD, fill: 'none', 'fill-opacity': '0', id: svgCanvas.getNextId(), stroke: '#000' },
    curStyles: false,
    element: 'path',
  });

  svgCanvas.pathActions.fixEnd(newElem);
  batchCmd.addSubCommand(new history.InsertElementCommand(newElem));

  if (svgCanvas.isUsingLayerColor) {
    updateElementColor(newElem);
  }

  svgCanvas.selectOnly([newElem], true);
  svgCanvas.addCommandToHistory(batchCmd);

  console.log('Offset element operation completed.');
};

export default offsetElements;
