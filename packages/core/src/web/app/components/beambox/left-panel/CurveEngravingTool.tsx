import React, { useEffect, useMemo } from 'react';

import curveEngravingModeController from '@core/app/actions/canvas/curveEngravingModeController';
import LeftPanelButton from '@core/app/components/beambox/left-panel/LeftPanelButton';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
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

// TODO add unit tests
const CurveEngravingTool = ({ className }: Props): React.JSX.Element => {
  const forceUpdate = useForceUpdate();
  const canvasEventEmitter = useMemo(() => eventEmitterFactory.createEventEmitter('canvas'), []);

  useEffect(() => {
    canvasEventEmitter.on('CURVE_ENGRAVING_AREA_SET', forceUpdate);

    return () => {
      canvasEventEmitter.removeListener('CURVE_ENGRAVING_AREA_SET', forceUpdate);
    };
  }, [canvasEventEmitter, forceUpdate]);

  const lang = useI18n().beambox.left_panel.label;
  const currentCursorMode = svgCanvas.getMode();

  // TODO: add i18n
  return (
    <div className={className}>
      <LeftPanelButton
        icon={<LeftPanelIcons.Back />}
        id="back"
        onClick={() => curveEngravingModeController.back()}
        title={lang.curve_engraving.exit}
      />
      <LeftPanelButton
        active={currentCursorMode === 'select'}
        icon={<LeftPanelIcons.Cursor />}
        id="cursor"
        onClick={() => {
          curveEngravingModeController.toCanvasSelectMode();
          forceUpdate();
        }}
        title={lang.cursor}
      />
      <LeftPanelButton
        active={currentCursorMode === 'curve-engraving'}
        icon={<LeftPanelIcons.CurveSelect />}
        id="curve-select"
        onClick={() => {
          curveEngravingModeController.toAreaSelectMode();
          forceUpdate();
        }}
        title={lang.curve_engraving.select_area}
      />
      <LeftPanelButton
        disabled={!curveEngravingModeController.hasArea()}
        icon={<LeftPanelIcons.CuverPreview />}
        id="curve-preview"
        onClick={() => curveEngravingModeController.preview()}
        title={lang.curve_engraving.preview_3d_curve}
      />
      <LeftPanelButton
        icon={<LeftPanelIcons.Delete />}
        id="delete"
        onClick={() => curveEngravingModeController.clearArea()}
        title={lang.curve_engraving.clear_area}
      />
    </div>
  );
};

export default CurveEngravingTool;
