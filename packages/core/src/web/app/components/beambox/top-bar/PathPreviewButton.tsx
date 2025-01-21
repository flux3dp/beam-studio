import classNames from 'classnames';
import React, { useContext } from 'react';

import checkWebGL from '@core/helpers/check-webgl';
import constant from '@core/app/actions/beambox/constant';
import isDev from '@core/helpers/is-dev';
import isWeb from '@core/helpers/is-web';
import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';
import useI18n from '@core/helpers/useI18n';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { useIsMobile } from '@core/helpers/system-helper';

import styles from './PathPreviewButton.module.scss';

let svgCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

interface Props {
  isDeviceConnected: boolean;
  togglePathPreview: () => void;
}

function PathPreviewButton({ isDeviceConnected, togglePathPreview }: Props): JSX.Element {
  const lang = useI18n().topbar;
  const isMobile = useIsMobile();
  const { mode } = useContext(CanvasContext);
  const workarea = useWorkarea();
  if (isMobile || !checkWebGL()) return null;
  if (!isDev() && constant.adorModels.includes(workarea)) return null;

  const changeToPathPreviewMode = (): void => {
    if (mode !== CanvasMode.PathPreview) {
      svgCanvas.clearSelection();
      togglePathPreview();
    }
  };
  const className = classNames(styles.button, {
    [styles.highlighted]: mode === CanvasMode.PathPreview,
    [styles.disabled]: mode === CanvasMode.Preview || (!isDeviceConnected && isWeb()),
  });
  return (
    <div className={className} onClick={changeToPathPreviewMode} title={lang.task_preview}>
      <TopBarIcons.PathPreview />
    </div>
  );
}

export default PathPreviewButton;
