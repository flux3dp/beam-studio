import type { ReactNode } from 'react';
import React from 'react';

import classNames from 'classnames';
import { pick } from 'remeda';
import { useShallow } from 'zustand/shallow';

import { CanvasMode } from '@core/app/constants/canvasMode';
import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { useIsMobile } from '@core/app/stores/screenStore';
import selectionManager from '@core/app/svgedit/selection';
import checkWebGL from '@core/helpers/check-webgl';
import isWeb from '@core/helpers/is-web';
import { isCanvasEmpty } from '@core/helpers/layer/checkContent';
import useI18n from '@core/helpers/useI18n';

import styles from './PathPreviewButton.module.scss';

interface Props {
  isDeviceConnected: boolean;
}

function PathPreviewButton({ isDeviceConnected }: Props): ReactNode {
  const lang = useI18n().topbar;
  const isMobile = useIsMobile();
  const { mode, togglePathPreview } = useCanvasStore(useShallow((state) => pick(state, ['mode', 'togglePathPreview'])));

  if (isMobile || !checkWebGL()) {
    return null;
  }

  const changeToPathPreviewMode = (): void => {
    if (mode !== CanvasMode.PathPreview && !isCanvasEmpty()) {
      selectionManager.clearSelection();
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
