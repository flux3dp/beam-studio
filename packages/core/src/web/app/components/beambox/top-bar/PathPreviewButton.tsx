import type { ReactNode } from 'react';
import React, { useContext } from 'react';

import classNames from 'classnames';

import { modelsWithModules } from '@core/app/actions/beambox/constant';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';
import checkWebGL from '@core/helpers/check-webgl';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import isDev from '@core/helpers/is-dev';
import isWeb from '@core/helpers/is-web';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import styles from './PathPreviewButton.module.scss';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

interface Props {
  isDeviceConnected: boolean;
  togglePathPreview: () => void;
}

function PathPreviewButton({ isDeviceConnected, togglePathPreview }: Props): ReactNode {
  const lang = useI18n().topbar;
  const isMobile = useIsMobile();
  const { mode } = useContext(CanvasContext);
  const workarea = useWorkarea();

  if (isMobile || !checkWebGL()) {
    return null;
  }

  if (!isDev() && modelsWithModules.has(workarea)) {
    return null;
  }

  const changeToPathPreviewMode = (): void => {
    if (mode !== CanvasMode.PathPreview) {
      svgCanvas.clearSelection();
      togglePathPreview();
    }
  };
  const className = classNames(styles.button, {
    [styles.disabled]: mode === CanvasMode.Preview || (!isDeviceConnected && isWeb()),
    [styles.highlighted]: mode === CanvasMode.PathPreview,
  });

  return (
    <div className={className} onClick={changeToPathPreviewMode} title={lang.task_preview}>
      <TopBarIcons.PathPreview />
    </div>
  );
}

export default PathPreviewButton;
