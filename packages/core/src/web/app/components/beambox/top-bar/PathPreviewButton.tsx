import classNames from 'classnames';
import React, { useContext } from 'react';

import checkWebGL from 'helpers/check-webgl';
import constant from 'app/actions/beambox/constant';
import isDev from 'helpers/is-dev';
import isWeb from 'helpers/is-web';
import TopBarIcons from 'app/icons/top-bar/TopBarIcons';
import useI18n from 'helpers/useI18n';
import useWorkarea from 'helpers/hooks/useWorkarea';
import { CanvasContext } from 'app/contexts/CanvasContext';
import { CanvasMode } from 'app/constants/canvasMode';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { useIsMobile } from 'helpers/system-helper';

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
