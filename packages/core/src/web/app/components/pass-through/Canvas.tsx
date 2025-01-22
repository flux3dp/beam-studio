import React, { useContext, useEffect, useMemo } from 'react';

import constant from '@core/app/actions/beambox/constant';
import EmbeddedCanvas from '@core/app/widgets/FullWindowPanel/EmbeddedCanvas';

import { PassThroughCanvasManager } from './canvasManager';
import styles from './PassThrough.module.scss';
import { PassThroughContext } from './PassThroughContext';

const Canvas = (): React.JSX.Element => {
  const canvasManager = useMemo(() => PassThroughCanvasManager.getInstance(), []);
  const { guideMark, passThroughHeight } = useContext(PassThroughContext);

  useEffect(() => () => PassThroughCanvasManager.clear(), []);

  useEffect(() => {
    canvasManager.setPassThroughHeight(passThroughHeight * constant.dpmm);
  }, [canvasManager, passThroughHeight]);
  useEffect(() => {
    canvasManager.setGuideMark(guideMark.show, guideMark.x * constant.dpmm, guideMark.width * constant.dpmm);
  }, [canvasManager, guideMark]);

  return <EmbeddedCanvas canvasManager={canvasManager} className={styles.container} />;
};

export default Canvas;
