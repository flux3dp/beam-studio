import React, { memo, useEffect, useMemo } from 'react';

import { pick } from 'remeda';
import { match } from 'ts-pattern';
import { useShallow } from 'zustand/react/shallow';

import { dpmm } from '@core/app/actions/beambox/constant';
import EmbeddedCanvas from '@core/app/widgets/FullWindowPanel/EmbeddedCanvas';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

import { PrintAndCutCanvasManager } from './CanvasManager';
import { usePrintAndCutStore } from './store';
import { getContourPathElements } from './utils/contourElements';
import { getContentBBoxFromState, getGridOffsets, getPaperRect } from './utils/layout';

/** Background padding around the content (design + marks) during setup, in mm */
const SETUP_BACKGROUND_PADDING_MM = 10;
const canvasEvents = eventEmitterFactory.createEventEmitter('canvas');

// bumped per manager so EmbeddedCanvas remounts (dropping the old canvas root)
// whenever a new manager is created
let managerCount = 0;

const Canvas = (): React.JSX.Element => {
  // both shape the content clone, so a change (Start Over resets them from
  // their resume values) needs a fresh manager and a re-clone
  const { isResume, printingContentsElementIds } = usePrintAndCutStore(
    useShallow(pick(['isResume', 'printingContentsElementIds'])),
  );
  const [canvasManager, managerKey] = useMemo(() => {
    managerCount += 1;

    return [new PrintAndCutCanvasManager({ isResume, printingContentsElementIds }), managerCount] as const;
  }, [isResume, printingContentsElementIds]);
  const {
    alignmentTransform,
    cameraImageUrl,
    contourElements,
    contourLayerName,
    contourPathD,
    contourSource,
    fullBBox,
    gridColumns,
    gridGapMm,
    gridRows,
    markPositions,
    orientation,
    paperKey,
    step,
  } = usePrintAndCutStore(
    useShallow(
      pick([
        'alignmentTransform',
        'cameraImageUrl',
        'contourElements',
        'contourLayerName',
        'contourPathD',
        'contourSource',
        'fullBBox',
        'gridColumns',
        'gridGapMm',
        'gridRows',
        'markPositions',
        'orientation',
        'paperKey',
        'step',
      ]),
    ),
  );

  useEffect(() => {
    canvasManager.setGridOffsets(getGridOffsets({ fullBBox, gridColumns, gridGapMm, gridRows }));
  }, [canvasManager, gridColumns, gridGapMm, gridRows, fullBBox]);

  useEffect(() => {
    canvasManager.setMarks(markPositions);
  }, [canvasManager, markPositions]);

  useEffect(() => {
    canvasManager.setContourPath(contourSource === 'outline' ? contourPathD : null);

    if (contourSource === 'layer' && contourLayerName) {
      // a resumed run highlights the geometry frozen when the sheets were
      // printed, not the live layer (which may have changed since)
      canvasManager.setContourLayerPaths(getContourPathElements(contourElements, contourLayerName));
    } else {
      canvasManager.setContourLayerPaths([]);
    }
  }, [canvasManager, contourElements, contourLayerName, contourPathD, contourSource]);

  // the camera image has its own effect so progressive updates during the
  // region sweep only swap the image, without re-fitting the view each time
  useEffect(() => {
    canvasManager.setCameraImage(step === 'align' ? cameraImageUrl : null);
  }, [cameraImageUrl, canvasManager, step]);

  // likewise, applying the detected transform must not reset a manual zoom
  useEffect(() => {
    canvasManager.setContentTransform(step === 'align' ? alignmentTransform : null);
  }, [alignmentTransform, canvasManager, step]);

  useEffect(() => {
    // the align step sets its own background below
    if (step === 'align') return;

    const backgroundRect = match(step)
      .with('setup', () => {
        const contentBBox = getContentBBoxFromState({ fullBBox, markPositions });

        if (!contentBBox) return null;

        const pad = SETUP_BACKGROUND_PADDING_MM * dpmm;

        return {
          height: contentBBox.height + 2 * pad,
          width: contentBBox.width + 2 * pad,
          x: contentBBox.x - pad,
          y: contentBBox.y - pad,
        };
      })
      .with('paper', 'export', 'resume', () => getPaperRect({ fullBBox, markPositions, orientation, paperKey }))
      .exhaustive();

    canvasManager.setBackgroundRect(backgroundRect);
    // zoom to the selected paper, or to the padded content during setup
    canvasManager.resetView();
  }, [canvasManager, fullBBox, markPositions, orientation, paperKey, step]);

  useEffect(() => {
    if (step !== 'align') return;

    // the camera preview step always frames the whole workarea, so the
    // captured sheet is visible wherever it was placed
    const frameWorkarea = () => {
      canvasManager.setBackgroundRect(null);
      canvasManager.resetView();
    };

    frameWorkarea();

    canvasEvents.on('canvas-change', frameWorkarea);

    return () => {
      canvasEvents.removeListener('canvas-change', frameWorkarea);
    };
  }, [canvasManager, step]);

  return <EmbeddedCanvas canvasManager={canvasManager} key={managerKey} />;
};

export default memo(Canvas);
