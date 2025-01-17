import React, { useEffect } from 'react';

import HistoryCommandFactory from 'app/svgedit/history/HistoryCommandFactory';
import ObjectPanelItem from 'app/views/beambox/Right-Panels/ObjectPanelItem';
import OptionPanelIcons from 'app/icons/option-panel/OptionPanelIcons';
import UnitInput from 'app/widgets/Unit-Input-v2';
import useI18n from 'helpers/useI18n';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { useIsMobile } from 'helpers/system-helper';

import styles from './PolygonOptions.module.scss';


let svgCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

interface Props {
  elem: Element;
  polygonSides: number;
}

function PolygonOptions({ elem, polygonSides }: Props): JSX.Element {
  const [sides, setSides] = React.useState(polygonSides || 5);
  const isMobile = useIsMobile();
  const lang = useI18n().beambox.right_panel.object_panel.option_panel;
  useEffect(() => {
    if (polygonSides) setSides(polygonSides);
  }, [polygonSides]);

  const handleSideChanage = (val) => {
    if (val === sides) return;
    const batchCmd = HistoryCommandFactory.createBatchCommand('Change Polygon Sides');
    svgCanvas.undoMgr.beginUndoableChange('sides', [elem]);
    svgCanvas.undoMgr.beginUndoableChange('points', [elem]);
    window.updatePolygonSides?.(elem, val - sides);
    let cmd = svgCanvas.undoMgr.finishUndoableChange();
    if (!cmd.isEmpty()) batchCmd.addSubCommand(cmd);
    cmd = svgCanvas.undoMgr.finishUndoableChange();
    if (!cmd.isEmpty()) batchCmd.addSubCommand(cmd);
    if (!batchCmd.isEmpty()) svgCanvas.undoMgr.addCommandToHistory(batchCmd);
    setSides(parseInt(elem.getAttribute('sides'), 10));
  };

  const renderSides = () =>
    isMobile ? (
      <ObjectPanelItem.Number
        id="polygon-sides"
        value={sides}
        min={3}
        updateValue={handleSideChanage}
        label={lang.sides}
        unit=""
        decimal={0}
      />
    ) : (
      <div className={styles['polygon-sides']} key="polygon-sides">
        <div className={styles.label} title={lang.sides}>
          <OptionPanelIcons.PolygonSide />
        </div>
        <UnitInput
          min={3}
          className={{ 'option-input': true }}
          defaultValue={sides}
          decimal={0}
          getValue={(val) => handleSideChanage(val)}
        />
      </div>
    );

  return isMobile ? renderSides() : <div>{renderSides()}</div>;
}

export default PolygonOptions;
