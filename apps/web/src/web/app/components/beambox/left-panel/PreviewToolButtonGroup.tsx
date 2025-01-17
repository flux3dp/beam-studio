import React, { useContext, useMemo } from 'react';

import beamboxStore from 'app/stores/beambox-store';
import constant from 'app/actions/beambox/constant';
import ISVGCanvas from 'interfaces/ISVGCanvas';
import LeftPanelButton from 'app/components/beambox/left-panel/LeftPanelButton';
import LeftPanelIcons from 'app/icons/left-panel/LeftPanelIcons';
import localeHelper from 'helpers/locale-helper';
import PreviewModeBackgroundDrawer from 'app/actions/beambox/preview-mode-background-drawer';
import PreviewModeController from 'app/actions/beambox/preview-mode-controller';
import useI18n from 'helpers/useI18n';
import useForceUpdate from 'helpers/use-force-update';
import useWorkarea from 'helpers/hooks/useWorkarea';
import { CanvasContext } from 'app/contexts/CanvasContext';
import { getSVGAsync } from 'helpers/svg-editor-helper';

let svgCanvas: ISVGCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

interface Props {
  className: string;
}

const PreviewToolButtonGroup = ({ className }: Props): JSX.Element => {
  const lang = useI18n().beambox.left_panel;
  const workarea = useWorkarea();
  const isAdorSeries = useMemo(() => constant.adorModels.includes(workarea), [workarea]);
  const forceUpdate = useForceUpdate();
  const { setupPreviewMode, endPreviewMode } = useContext(CanvasContext);

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
        id="preview-back"
        icon={<LeftPanelIcons.Back />}
        title={lang.label.end_preview}
        onClick={endPreviewMode}
      />
      <LeftPanelButton
        id="preview-shoot"
        icon={<LeftPanelIcons.Shoot />}
        title={lang.label.preview}
        active
        onClick={() => {
          if (!PreviewModeController.isPreviewMode()) {
            setupPreviewMode();
          }
        }}
      />
      {isAdorSeries && !localeHelper.isNorthAmerica && (
        <LeftPanelButton
          id="preview-live"
          icon={<LeftPanelIcons.Live />}
          title={lang.label.live_feed}
          active={isLiveMode}
          disabled={!isPreviewMode}
          onClick={() => {
            if (PreviewModeController.isPreviewMode()) {
              PreviewModeController.toggleFullWorkareaLiveMode();
              forceUpdate();
            }
          }}
        />
      )}
      <LeftPanelButton
        id="image-trace"
        icon={<LeftPanelIcons.Trace />}
        title={lang.label.trace}
        disabled={isCanvasEmpty}
        onClick={startImageTrace}
      />
      {isAdorSeries && (
        <LeftPanelButton
          id="adjust-height"
          icon={<LeftPanelIcons.AdjustHeight />}
          title={lang.label.adjust_height}
          disabled={!isPreviewMode}
          onClick={() => {
            if (PreviewModeController.isPreviewMode())
              PreviewModeController.resetFishEyeObjectHeight();
          }}
        />
      )}
      <LeftPanelButton
        id="clear-preview"
        icon={<LeftPanelIcons.Delete />}
        title={lang.label.clear_preview}
        disabled={isCanvasEmpty}
        onClick={clearPreview}
      />
    </div>
  );
};

export default PreviewToolButtonGroup;
