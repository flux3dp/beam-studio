import React, { memo, useEffect, useMemo } from 'react';

import EmbeddedCanvas from 'app/widgets/FullWindowPanel/EmbeddedCanvas';
import { AutoFitContour } from 'interfaces/IAutoFit';

import OpacitySlider from './OpacitySlider';
import { AutoFitCanvasManager } from './CanvasManager';

interface Props {
  data: AutoFitContour[][];
  imageUrl: string;
  focusedIndex: number;
}

const Canvas = ({ data, imageUrl, focusedIndex }: Props): JSX.Element => {
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
