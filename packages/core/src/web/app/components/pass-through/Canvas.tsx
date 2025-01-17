import React, { useContext, useEffect, useMemo } from 'react';

import EmbeddedCanvas from 'app/widgets/FullWindowPanel/EmbeddedCanvas';
import constant from 'app/actions/beambox/constant';

import styles from './PassThrough.module.scss';
import { PassThroughCanvasManager } from './canvasManager';
import { PassThroughContext } from './PassThroughContext';

const Canvas = (): JSX.Element => {
  const canvasManager = useMemo(() => PassThroughCanvasManager.getInstance(), []);
  const { passThroughHeight, guideMark } = useContext(PassThroughContext);

  useEffect(() => () => PassThroughCanvasManager.clear(), []);

  useEffect(() => {
    canvasManager.setPassThroughHeight(passThroughHeight * constant.dpmm);
  }, [canvasManager, passThroughHeight]);
  useEffect(() => {
    canvasManager.setGuideMark(
      guideMark.show,
      guideMark.x * constant.dpmm,
      guideMark.width * constant.dpmm
    );
  }, [canvasManager, guideMark]);

  return <EmbeddedCanvas className={styles.container} canvasManager={canvasManager} />;
};

export default Canvas;
