import React, { memo, useEffect, useMemo } from 'react';

import EmbeddedCanvas from '@core/app/widgets/FullWindowPanel/EmbeddedCanvas';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

import { PrintAndCutCanvasManager } from './CanvasManager';
import { usePrintAndCutStore } from './store';
import { getContourPathElements } from './utils/contourElements';
import { getGridOffsets, getPaperRect } from './utils/layout';

const canvasEvents = eventEmitterFactory.createEventEmitter('canvas');

// bumped per manager so EmbeddedCanvas remounts (dropping the old canvas root)
// whenever a new manager is created
let managerCount = 0;

const Canvas = (): React.JSX.Element => {
  // both shape the content clone, so a change (Start Over resets them from
  // their resume values) needs a fresh manager and a re-clone
  const isResume = usePrintAndCutStore((state) => state.isResume);
  const printingContentsElementIds = usePrintAndCutStore((state) => state.printingContentsElementIds);
  const [canvasManager, managerKey] = useMemo(() => {
    managerCount += 1;

    return [new PrintAndCutCanvasManager({ isResume, printingContentsElementIds }), managerCount] as const;
  }, [isResume, printingContentsElementIds]);
  const alignmentTransform = usePrintAndCutStore((state) => state.alignmentTransform);
  const cameraImageUrl = usePrintAndCutStore((state) => state.cameraImageUrl);
  const contourElements = usePrintAndCutStore((state) => state.contourElements);
  const contourLayerName = usePrintAndCutStore((state) => state.contourLayerName);
  const contourPathD = usePrintAndCutStore((state) => state.contourPathD);
  const contourSource = usePrintAndCutStore((state) => state.contourSource);
  const detectedMarkCenters = usePrintAndCutStore((state) => state.detectedMarkCenters);
  const fullBBox = usePrintAndCutStore((state) => state.fullBBox);
  const gridColumns = usePrintAndCutStore((state) => state.gridColumns);
  const gridGapMm = usePrintAndCutStore((state) => state.gridGapMm);
  const gridRows = usePrintAndCutStore((state) => state.gridRows);
  const markPositions = usePrintAndCutStore((state) => state.markPositions);
  const orientation = usePrintAndCutStore((state) => state.orientation);
  const paperKey = usePrintAndCutStore((state) => state.paperKey);
  const step = usePrintAndCutStore((state) => state.step);

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

  // applying the detected transform must not reset the zoom
  useEffect(() => {
    canvasManager.setContentTransform(step === 'align' ? alignmentTransform : null);
  }, [alignmentTransform, canvasManager, step]);

  // zoom to the marks as soon as they are located, so the refinement retakes
  // are watched up close; a cleared value is a new capture: re-frame the bed
  useEffect(() => {
    if (step !== 'align') return;

    if (detectedMarkCenters?.length) canvasManager.zoomToMarks(detectedMarkCenters);
    else canvasManager.resetView();
  }, [canvasManager, detectedMarkCenters, step]);

  useEffect(() => {
    // the align step sets its own background below
    if (step === 'align') return;

    // setup previews the 'fit' paper (content + marks + print margin)
    const backgroundRect =
      step === 'setup'
        ? getPaperRect({ fullBBox, markPositions, orientation: 'portrait', paperKey: 'fit' })
        : getPaperRect({ fullBBox, markPositions, orientation, paperKey });

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
