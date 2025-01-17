import classNames from 'classnames';
import React, { memo, useEffect, useRef } from 'react';

import ZoomBlock from 'app/components/beambox/ZoomBlock';

import constant from 'app/actions/beambox/constant';
import styles from './EmbeddedCanvas.module.scss';
import { EmbeddedCanvasManager } from './EmbeddedCanvasManager';

interface Props {
  className?: string;
  canvasManager?: EmbeddedCanvasManager;
  children?: React.ReactNode;
}

const EmbeddedCanvas = ({
  className,
  canvasManager = EmbeddedCanvasManager.getInstance(),
  children,
}: Props): JSX.Element => {
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
        setZoom={(ratio) => canvasManager.zoom(ratio / constant.dpmm)}
        resetView={canvasManager.resetView}
      />
      {children}
    </div>
  );
};

export default memo(EmbeddedCanvas);
