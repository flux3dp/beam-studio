import React, { use, useEffect, useMemo } from 'react';

import constant from '@core/app/actions/beambox/constant';
import EmbeddedCanvas from '@core/app/widgets/FullWindowPanel/EmbeddedCanvas';

import { PassThroughCanvasManager } from './canvasManager';
import styles from './PassThrough.module.scss';
import { PassThroughContext } from './PassThroughContext';

const Canvas = (): React.JSX.Element => {
  const canvasManager = useMemo(() => PassThroughCanvasManager.getInstance(), []);
  const { addOnInfo, guideMark, passThroughHeight, workareaObj } = use(PassThroughContext);

  useEffect(() => () => PassThroughCanvasManager.clear(), []);

  useEffect(
    () => canvasManager.setWorkareaLimit(workareaObj.height * constant.dpmm, addOnInfo.passThrough?.minY),
    [canvasManager, workareaObj, addOnInfo],
  );
  useEffect(() => {
    canvasManager.setPassThroughHeight(passThroughHeight * constant.dpmm);
  }, [canvasManager, passThroughHeight]);
  useEffect(() => {
    canvasManager.setGuideMark(guideMark.show, guideMark.x * constant.dpmm, guideMark.width * constant.dpmm);
  }, [canvasManager, guideMark]);

  return <EmbeddedCanvas canvasManager={canvasManager} className={styles.container} />;
};

export default Canvas;
