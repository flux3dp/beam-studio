import React, { useEffect } from 'react';

import OptionPanelIcons from '@core/app/icons/option-panel/OptionPanelIcons';
import HistoryCommandFactory from '@core/app/svgedit/history/HistoryCommandFactory';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './PolygonOptions.module.scss';

let svgCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

interface Props {
  elem: Element;
  polygonSides: number;
}

function PolygonOptions({ elem, polygonSides }: Props): React.JSX.Element {
  const [sides, setSides] = React.useState(polygonSides || 5);
  const isMobile = useIsMobile();
  const lang = useI18n().beambox.right_panel.object_panel.option_panel;

  useEffect(() => {
    if (polygonSides) {
      setSides(polygonSides);
    }
  }, [polygonSides]);

  const handleSideChanage = (val) => {
    if (val === sides) {
      return;
    }

    const batchCmd = HistoryCommandFactory.createBatchCommand('Change Polygon Sides');

    svgCanvas.undoMgr.beginUndoableChange('sides', [elem]);
    svgCanvas.undoMgr.beginUndoableChange('points', [elem]);
    window.updatePolygonSides?.(elem, val - sides);

    let cmd = svgCanvas.undoMgr.finishUndoableChange();

    if (!cmd.isEmpty()) {
      batchCmd.addSubCommand(cmd);
    }

    cmd = svgCanvas.undoMgr.finishUndoableChange();

    if (!cmd.isEmpty()) {
      batchCmd.addSubCommand(cmd);
    }

    if (!batchCmd.isEmpty()) {
      svgCanvas.undoMgr.addCommandToHistory(batchCmd);
    }

    setSides(Number.parseInt(elem.getAttribute('sides'), 10));
  };

  const renderSides = () =>
    isMobile ? (
      <ObjectPanelItem.Number
        decimal={0}
        id="polygon-sides"
        label={lang.sides}
        min={3}
        unit=""
        updateValue={handleSideChanage}
        value={sides}
      />
    ) : (
      <div className={styles['polygon-sides']} key="polygon-sides">
        <div className={styles.label} title={lang.sides}>
          <OptionPanelIcons.PolygonSide />
        </div>
        <UnitInput
          className={{ 'option-input': true }}
          decimal={0}
          defaultValue={sides}
          getValue={(val) => handleSideChanage(val)}
          min={3}
        />
      </div>
    );

  return isMobile ? renderSides() : <div>{renderSides()}</div>;
}

export default PolygonOptions;
