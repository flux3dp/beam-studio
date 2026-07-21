import { memo, type ReactNode, useMemo } from 'react';

import { CloseOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import classNames from 'classnames';

import { adorModels } from '@core/app/actions/beambox/constant';
import previewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import previewModeController from '@core/app/actions/beambox/preview-mode-controller';
import { PreviewMode } from '@core/app/constants/cameraConstants';
import { CanvasMode } from '@core/app/constants/canvasMode';
import CameraIcons from '@core/app/icons/camera/CameraIcons';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import beamboxStore from '@core/app/stores/beambox-store';
import { setCameraPreviewState, useCameraPreviewStore } from '@core/app/stores/cameraPreview';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import selectionManager from '@core/app/svgedit/selection';
import { endPreviewMode, handlePreviewClick } from '@core/helpers/device/camera/previewMode';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import localeHelper from '@core/helpers/locale-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './PreviewFloatingBar.module.scss';

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
    <Tooltip placement="bottom" title={title}>
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
      >
        {children}
      </div>
    </Tooltip>
  ),
);

export const PreviewFloatingBar = memo((): ReactNode => {
  const {
    beambox: { left_panel: lang },
  } = useI18n();
  const workarea = useWorkarea();
  const isAdorSeries = useMemo(() => adorModels.has(workarea), [workarea]);
  const mode = useCanvasStore((state) => state.mode);
  const mouseMode = useCanvasStore((state) => state.mouseMode);
  const {
    isClean,
    isDrawing,
    isLiveMode,
    isPreviewMode,
    isStarting,
    pendingPreviewMode,
    previewMode,
    supportedPreviewModes,
  } = useCameraPreviewStore();
  const activePreviewMode = pendingPreviewMode ?? previewMode;
  const isCanvasEmpty = isDrawing || isClean;
  const isMouseInPreviewMode = useMemo(() => ['pre_preview', 'preview'].includes(mouseMode), [mouseMode]);

  if (mode !== CanvasMode.Draw) return null;

  if (!isPreviewMode && !isStarting && !isMouseInPreviewMode) return null;

  const startImageTrace = () => {
    endPreviewMode();
    selectionManager.clearSelection();
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
        {supportedPreviewModes.length > 1 && supportedPreviewModes.includes(PreviewMode.FULL_AREA) && (
          <Button
            disabled={!isPreviewMode || isDrawing || isStarting}
            id="wide-angle-camera"
            onClick={async () => {
              if (previewMode !== PreviewMode.FULL_AREA) {
                await previewModeController.switchPreviewMode(PreviewMode.FULL_AREA);
              }

              handlePreviewClick();
            }}
            title={lang.label.preview_wide_angle}
          >
            <CameraIcons.Single />
          </Button>
        )}
        <Button
          blue={isMouseInPreviewMode && activePreviewMode === PreviewMode.REGION}
          disabled={isDrawing || isStarting}
          id="laser-head-camera"
          onClick={async () => {
            if (isPreviewMode) {
              if (previewMode !== PreviewMode.REGION) {
                await previewModeController.switchPreviewMode(PreviewMode.REGION);
              }
            } else {
              setCameraPreviewState({ pendingPreviewMode: PreviewMode.REGION });
            }

            handlePreviewClick();
          }}
          title={lang.label.preview}
        >
          <CameraIcons.Normal />
        </Button>
        {supportedPreviewModes.includes(PreviewMode.PRECISE_REGION) && (
          <Button
            blue={isMouseInPreviewMode && activePreviewMode === PreviewMode.PRECISE_REGION}
            disabled={isDrawing || isStarting}
            id="laser-head-camera-precise"
            onClick={async () => {
              if (isPreviewMode) {
                if (previewMode !== PreviewMode.PRECISE_REGION) {
                  await previewModeController.switchPreviewMode(PreviewMode.PRECISE_REGION);
                }
              } else {
                setCameraPreviewState({ pendingPreviewMode: PreviewMode.PRECISE_REGION });
              }

              handlePreviewClick();
            }}
            title={lang.label.preview_precise}
          >
            <CameraIcons.Precise />
          </Button>
        )}
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
        <Tooltip placement="bottom" title={lang.label.end_preview}>
          <div className={classNames(styles.button, styles.close)} id="end-preview-mode" onClick={endPreviewMode}>
            <CloseOutlined />
          </div>
        </Tooltip>
      </div>
    </div>
  );
});

export default PreviewFloatingBar;
