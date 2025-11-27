import curveEngravingModeController from '@core/app/actions/canvas/curveEngravingModeController';
import LeftPanelButton from '@core/app/components/beambox/LeftPanel/components/LeftPanelButton';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import useHasCurveEngraving from '@core/helpers/hooks/useHasCurveEngraving';
import useForceUpdate from '@core/helpers/use-force-update';
import useI18n from '@core/helpers/useI18n';

interface Props {
  className: string;
}

// TODO add unit tests
const CurveEngravingTool = ({ className }: Props): JSX.Element => {
  const forceUpdate = useForceUpdate();
  const hasCurveEngraving = useHasCurveEngraving();
  const mouseMode = useCanvasStore((state) => state.mouseMode);

  const lang = useI18n().beambox.left_panel.label;

  return (
    <div className={className}>
      <LeftPanelButton
        icon={<LeftPanelIcons.Back />}
        id="back"
        onClick={() => curveEngravingModeController.back()}
        title={lang.curve_engraving.exit}
      />
      <LeftPanelButton
        active={mouseMode === 'select'}
        icon={<LeftPanelIcons.Cursor />}
        id="cursor"
        onClick={() => {
          curveEngravingModeController.toCanvasSelectMode();
          forceUpdate();
        }}
        title={lang.cursor}
      />
      <LeftPanelButton
        active={mouseMode === 'curve-engraving'}
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
        icon={<LeftPanelIcons.CurvePreview />}
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
