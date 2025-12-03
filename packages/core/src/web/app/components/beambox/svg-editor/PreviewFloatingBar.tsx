import { memo, type ReactNode, useMemo } from 'react';

import { CloseOutlined } from '@ant-design/icons';
import classNames from 'classnames';

import alertCaller from '@core/app/actions/alert-caller';
import { adorModels } from '@core/app/actions/beambox/constant';
import previewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import previewModeController from '@core/app/actions/beambox/preview-mode-controller';
import { CameraType } from '@core/app/constants/cameraConstants';
import { CanvasMode } from '@core/app/constants/canvasMode';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import beamboxStore from '@core/app/stores/beambox-store';
import { useCameraPreviewStore } from '@core/app/stores/cameraPreview';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { endPreviewMode, handlePreviewClick } from '@core/helpers/device/camera/previewMode';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import localeHelper from '@core/helpers/locale-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import styles from './PreviewFloatingBar.module.scss';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const Button = memo(
  ({
    active,
    blue,
    children,
    disabled,
    id,
    onClick,
    title,
  }: {
    active?: boolean;
    blue?: boolean;
    children: ReactNode;
    disabled?: boolean;
    id: string;
    onClick?: () => void;
    title: string;
  }): React.JSX.Element => (
    <div
      className={classNames(styles.button, {
        [styles.active]: active,
        [styles.blue]: blue,
        [styles.disabled]: disabled,
      })}
      id={id}
      onClick={() => {
        if (!disabled) onClick?.();
      }}
      title={title}
    >
      {children}
    </div>
  ),
);

export const PreviewFloatingBar = memo((): ReactNode => {
  const {
    beambox: { left_panel: lang },
    message: { camera: tCamera },
  } = useI18n();
  const workarea = useWorkarea();
  const isAdorSeries = useMemo(() => adorModels.has(workarea), [workarea]);
  const mode = useCanvasStore((state) => state.mode);
  const mouseMode = useCanvasStore((state) => state.mouseMode);
  const {
    cameraType,
    hasWideAngleCamera,
    isClean,
    isDrawing,
    isLiveMode,
    isPreviewMode,
    isStarting,
    isWideAngleCameraCalibrated,
  } = useCameraPreviewStore();
  const isCanvasEmpty = isDrawing || isClean;
  const isMouseInPreviewMode = useMemo(() => ['pre_preview', 'preview'].includes(mouseMode), [mouseMode]);

  if (mode !== CanvasMode.Draw) return null;

  if (!isPreviewMode && !isStarting && !isMouseInPreviewMode) return null;

  const startImageTrace = () => {
    endPreviewMode();
    svgCanvas.clearSelection();
    beamboxStore.emitShowCropper();
  };

  const clearPreview = () => {
    if (!isClean) {
      previewModeBackgroundDrawer.resetCoordinates();
      previewModeBackgroundDrawer.clear();
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        {hasWideAngleCamera && (
          <Button
            disabled={!isPreviewMode || isDrawing || isStarting}
            id="wide-angle-camera"
            onClick={async () => {
              if (cameraType !== CameraType.WIDE_ANGLE) {
                if (!isWideAngleCameraCalibrated) {
                  alertCaller.popUpError({ message: tCamera.calibration_wide_angle_camera_first });

                  return;
                }

                await previewModeController.switchCamera(CameraType.WIDE_ANGLE);
              }

              handlePreviewClick();
            }}
            title={lang.label.preview_wide_angle}
          >
            <LeftPanelIcons.ShootWideAngle />
          </Button>
        )}
        <Button
          blue={isMouseInPreviewMode && cameraType === CameraType.LASER_HEAD}
          disabled={!isPreviewMode || isDrawing || isStarting}
          id="laser-head-camera"
          onClick={async () => {
            if (cameraType !== CameraType.LASER_HEAD) await previewModeController.switchCamera(CameraType.LASER_HEAD);

            handlePreviewClick();
          }}
          title={lang.label.preview}
        >
          <LeftPanelIcons.Shoot />
        </Button>
        <Button disabled={isCanvasEmpty} id="image-trace" onClick={startImageTrace} title={lang.label.trace}>
          <LeftPanelIcons.Trace />
        </Button>
        {isAdorSeries && !localeHelper.isNorthAmerica && (
          <Button
            active={isLiveMode}
            disabled={!isPreviewMode}
            id="preview-live"
            onClick={() => previewModeController.toggleFullWorkareaLiveMode()}
            title={lang.label.live_feed}
          >
            <LeftPanelIcons.Live />
          </Button>
        )}
        {isAdorSeries && (
          <Button
            disabled={!isPreviewMode}
            id="adjust-height"
            onClick={() => previewModeController.resetFishEyeObjectHeight()}
            title={lang.label.adjust_height}
          >
            <LeftPanelIcons.AdjustHeight />
          </Button>
        )}
        <Button disabled={isCanvasEmpty} id="clear-preview" onClick={clearPreview} title={lang.label.clear_preview}>
          <LeftPanelIcons.Delete />
        </Button>
        <div className={styles.separator} />
        <div
          className={classNames(styles.button, styles.close)}
          id="end-preview-mode"
          onClick={endPreviewMode}
          title={lang.label.end_preview}
        >
          <CloseOutlined />
        </div>
      </div>
    </div>
  );
});

export default PreviewFloatingBar;
