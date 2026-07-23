import React, { memo } from 'react';

import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import { useCameraPreviewStore } from '@core/app/stores/cameraPreview';
import selectionManager from '@core/app/svgedit/selection';
import { handlePreviewClick } from '@core/helpers/device/camera/previewMode';
import useI18n from '@core/helpers/useI18n';

import FloatingButton from './FloatingButton';
import styles from './PreviewController.module.scss';
import { PreviewFloatingBar } from './PreviewFloatingBar';

const PreviewController = (): React.ReactNode => {
  const lang = useI18n();
  const t = lang.beambox.left_panel;
  const { isDrawing, isStarting } = useCameraPreviewStore();
  const disabled = isDrawing || isStarting;

  return (
    <div className={styles.container}>
      <FloatingButton
        disabled={disabled}
        icon={<LeftPanelIcons.Camera />}
        onClick={() => {
          selectionManager.clearSelection();
          handlePreviewClick();
        }}
        title={t.label.preview}
      />
      <PreviewFloatingBar />
    </div>
  );
};

export default memo(PreviewController);
