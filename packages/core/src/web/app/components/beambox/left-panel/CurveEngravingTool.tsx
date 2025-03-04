import curveEngravingModeController from '@core/app/actions/canvas/curveEngravingModeController';
import LeftPanelButton from '@core/app/components/beambox/left-panel/LeftPanelButton';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import useHasCurveEngraving from '@core/helpers/hooks/useHasCurveEngraving';
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
const CurveEngravingTool = ({ className }: Props): JSX.Element => {
  const forceUpdate = useForceUpdate();
  const hasCurveEngraving = useHasCurveEngraving();

  const lang = useI18n().beambox.left_panel.label;
  const currentCursorMode = svgCanvas.getMode();

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
        disabled={!hasCurveEngraving}
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
