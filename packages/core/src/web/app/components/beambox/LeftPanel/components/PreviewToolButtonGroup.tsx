import React, { useMemo } from 'react';

import alertCaller from '@core/app/actions/alert-caller';
import constant from '@core/app/actions/beambox/constant';
import PreviewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import PreviewModeController from '@core/app/actions/beambox/preview-mode-controller';
import LeftPanelButton from '@core/app/components/beambox/LeftPanel/components/LeftPanelButton';
import { CameraType } from '@core/app/constants/cameraConstants';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import beamboxStore from '@core/app/stores/beambox-store';
import { useCameraPreviewStore } from '@core/app/stores/cameraPreview';
import { endPreviewMode, setupPreviewMode } from '@core/app/stores/canvas/utils/previewMode';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import localeHelper from '@core/helpers/locale-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import LeftPanelSegmented from './LeftPanelSegmented';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

interface Props {
  className: string;
}

const PreviewToolButtonGroup = ({ className }: Props): React.JSX.Element => {
  const lang = useI18n().beambox.left_panel;
  const workarea = useWorkarea();
  const isAdorSeries = useMemo(() => constant.adorModels.includes(workarea), [workarea]);
  const { cameraType, hasWideAngleCamera, isClean, isDrawing, isLiveMode, isPreviewMode, isWideAngleCameraCalibrated } =
    useCameraPreviewStore();

  const startImageTrace = () => {
    endPreviewMode();
    svgCanvas.clearSelection();
    beamboxStore.emitShowCropper();
  };

  const clearPreview = () => {
    if (!isClean) {
      PreviewModeBackgroundDrawer.resetCoordinates();
      PreviewModeBackgroundDrawer.clear();
    }
  };

  const isCanvasEmpty = isDrawing || isClean;

  return (
    <div className={className}>
      <LeftPanelButton
        icon={<LeftPanelIcons.Back />}
        id="preview-back"
        onClick={endPreviewMode}
        title={lang.label.end_preview}
      />
      {isPreviewMode && hasWideAngleCamera ? (
        <LeftPanelSegmented
          onChange={(value) => {
            if (value === CameraType.WIDE_ANGLE && !isWideAngleCameraCalibrated) {
              alertCaller.popUpError({ message: 'tPlease calibration wide angle camera first.' });

              return;
            }

            PreviewModeController.switchCamera(value);
          }}
          options={[
            { label: <LeftPanelIcons.Shoot />, title: lang.label.preview, value: CameraType.LASER_HEAD },
            {
              label: <LeftPanelIcons.ShootWideAngle />,
              title: lang.label.preview_wide_angle,
              value: CameraType.WIDE_ANGLE,
            },
          ]}
          value={cameraType}
        />
      ) : (
        <LeftPanelButton
          active
          icon={<LeftPanelIcons.Shoot />}
          id="preview-shoot"
          onClick={() => {
            if (!isPreviewMode) setupPreviewMode();
          }}
          title={lang.label.preview}
        />
      )}
      {isAdorSeries && !localeHelper.isNorthAmerica && (
        <LeftPanelButton
          active={isLiveMode}
          disabled={!isPreviewMode}
          icon={<LeftPanelIcons.Live />}
          id="preview-live"
          onClick={() => {
            if (isPreviewMode) PreviewModeController.toggleFullWorkareaLiveMode();
          }}
          title={lang.label.live_feed}
        />
      )}
      <LeftPanelButton
        disabled={isCanvasEmpty}
        icon={<LeftPanelIcons.Trace />}
        id="image-trace"
        onClick={startImageTrace}
        title={lang.label.trace}
      />
      {isAdorSeries && (
        <LeftPanelButton
          disabled={!isPreviewMode}
          icon={<LeftPanelIcons.AdjustHeight />}
          id="adjust-height"
          onClick={() => {
            if (isPreviewMode) PreviewModeController.resetFishEyeObjectHeight();
          }}
          title={lang.label.adjust_height}
        />
      )}
      <LeftPanelButton
        disabled={isCanvasEmpty}
        icon={<LeftPanelIcons.Delete />}
        id="clear-preview"
        onClick={clearPreview}
        title={lang.label.clear_preview}
      />
    </div>
  );
};

export default PreviewToolButtonGroup;
