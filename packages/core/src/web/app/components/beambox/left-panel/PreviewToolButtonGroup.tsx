import React, { useContext, useMemo } from 'react';

import constant from '@core/app/actions/beambox/constant';
import PreviewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import PreviewModeController from '@core/app/actions/beambox/preview-mode-controller';
import LeftPanelButton from '@core/app/components/beambox/left-panel/LeftPanelButton';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import beamboxStore from '@core/app/stores/beambox-store';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import localeHelper from '@core/helpers/locale-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useForceUpdate from '@core/helpers/use-force-update';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

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
  const forceUpdate = useForceUpdate();
  const { endPreviewMode, setupPreviewMode } = useContext(CanvasContext);

  const startImageTrace = () => {
    endPreviewMode();
    svgCanvas.clearSelection();
    beamboxStore.emitShowCropper();
  };

  const clearPreview = () => {
    if (!PreviewModeBackgroundDrawer.isClean()) {
      PreviewModeBackgroundDrawer.resetCoordinates();
      PreviewModeBackgroundDrawer.clear();
    }
  };

  const isCanvasEmpty = PreviewModeController.isDrawing || PreviewModeBackgroundDrawer.isClean();
  const isLiveMode = PreviewModeController.isLiveModeOn();
  const isPreviewMode = PreviewModeController.isPreviewMode();

  return (
    <div className={className}>
      <LeftPanelButton
        icon={<LeftPanelIcons.Back />}
        id="preview-back"
        onClick={endPreviewMode}
        title={lang.label.end_preview}
      />
      <LeftPanelButton
        active
        icon={<LeftPanelIcons.Shoot />}
        id="preview-shoot"
        onClick={() => {
          if (!PreviewModeController.isPreviewMode()) {
            setupPreviewMode();
          }
        }}
        title={lang.label.preview}
      />
      {isAdorSeries && !localeHelper.isNorthAmerica && (
        <LeftPanelButton
          active={isLiveMode}
          disabled={!isPreviewMode}
          icon={<LeftPanelIcons.Live />}
          id="preview-live"
          onClick={() => {
            if (PreviewModeController.isPreviewMode()) {
              PreviewModeController.toggleFullWorkareaLiveMode();
              forceUpdate();
            }
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
            if (PreviewModeController.isPreviewMode()) {
              PreviewModeController.resetFishEyeObjectHeight();
            }
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
