import type { ReactNode } from 'react';
import React from 'react';

import classNames from 'classnames';
import { pick } from 'remeda';
import { useShallow } from 'zustand/shallow';

import { modelsWithModules } from '@core/app/actions/beambox/constant';
import { CanvasMode } from '@core/app/constants/canvasMode';
import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import checkWebGL from '@core/helpers/check-webgl';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import isDev from '@core/helpers/is-dev';
import isWeb from '@core/helpers/is-web';
import { isCanvasEmpty } from '@core/helpers/layer/checkContent';
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
}

function PathPreviewButton({ isDeviceConnected }: Props): ReactNode {
  const lang = useI18n().topbar;
  const isMobile = useIsMobile();
  const { mode, togglePathPreview } = useCanvasStore(useShallow((state) => pick(state, ['mode', 'togglePathPreview'])));
  const workarea = useWorkarea();

  if (isMobile || !checkWebGL() || (!isDev() && modelsWithModules.has(workarea))) {
    return null;
  }

  const changeToPathPreviewMode = (): void => {
    if (mode !== CanvasMode.PathPreview && !isCanvasEmpty()) {
      svgCanvas.clearSelection();
      togglePathPreview();
    }
  };
  const className = classNames(styles.button, {
    [styles.disabled]: !isDeviceConnected && isWeb(),
    [styles.highlighted]: mode === CanvasMode.PathPreview,
  });

  return (
    <div className={className} onClick={changeToPathPreviewMode} title={lang.task_preview}>
      <TopBarIcons.PathPreview />
    </div>
  );
}

export default PathPreviewButton;
