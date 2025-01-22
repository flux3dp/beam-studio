import React, { memo, useEffect, useMemo } from 'react';

import EmbeddedCanvas from '@core/app/widgets/FullWindowPanel/EmbeddedCanvas';
import type { AutoFitContour } from '@core/interfaces/IAutoFit';

import { AutoFitCanvasManager } from './CanvasManager';
import OpacitySlider from './OpacitySlider';

interface Props {
  data: AutoFitContour[][];
  focusedIndex: number;
  imageUrl: string;
}

const Canvas = ({ data, focusedIndex, imageUrl }: Props): React.JSX.Element => {
  const canvasManager = useMemo(() => new AutoFitCanvasManager(), []);

  useEffect(() => {
    AutoFitCanvasManager.clear();
  }, []);

  useEffect(() => {
    canvasManager.setImageUrl(imageUrl);
  }, [canvasManager, imageUrl]);
  useEffect(() => {
    canvasManager.setData(data);
  }, [canvasManager, data]);
  useEffect(() => {
    canvasManager.setFocusedIndex(focusedIndex);
  }, [canvasManager, focusedIndex]);

  return (
    <>
      <EmbeddedCanvas canvasManager={canvasManager}>
        <OpacitySlider canvasManager={canvasManager} />
      </EmbeddedCanvas>
    </>
  );
};

export default memo(Canvas);
