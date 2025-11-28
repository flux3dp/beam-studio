import React, { memo, useEffect, useRef } from 'react';

import classNames from 'classnames';

import constant from '@core/app/actions/beambox/constant';
import ZoomBlock from '@core/app/components/beambox/svg-editor/ZoomBlock';

import styles from './EmbeddedCanvas.module.scss';
import { EmbeddedCanvasManager } from './EmbeddedCanvasManager';

interface Props {
  canvasManager?: EmbeddedCanvasManager;
  children?: React.ReactNode;
  className?: string;
}

const EmbeddedCanvas = ({
  canvasManager = EmbeddedCanvasManager.getInstance(),
  children,
  className,
}: Props): React.JSX.Element => {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      canvasManager.render(canvasRef.current);
    }
  }, [canvasManager]);

  return (
    <div className={classNames(styles.container, className)}>
      <div className={styles.canvas} ref={canvasRef} />
      <ZoomBlock
        className={styles['zoom-block']}
        getZoom={() => canvasManager.zoomRatio * constant.dpmm}
        resetView={canvasManager.resetView}
        setZoom={(ratio) => canvasManager.zoom(ratio / constant.dpmm)}
      />
      {children}
    </div>
  );
};

export default memo(EmbeddedCanvas);
