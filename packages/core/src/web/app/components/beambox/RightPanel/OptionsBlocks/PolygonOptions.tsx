import React, { useContext, useEffect } from 'react';

import OptionPanelIcons from '@core/app/icons/option-panel/OptionPanelIcons';
import HistoryCommandFactory from '@core/app/svgedit/history/HistoryCommandFactory';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { ObjectPanelContext } from '../contexts/ObjectPanelContext';
import ObjectPanelItem from '../ObjectPanelItem';

import OptionsInput from './OptionsInput';
import styles from './PolygonOptions.module.scss';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

interface Props {
  elem: Element;
}

function PolygonOptions({ elem }: Props): React.JSX.Element {
  const { polygonSides } = useContext(ObjectPanelContext);
  const [sides, setSides] = React.useState(polygonSides || 5);
  const isMobile = useIsMobile();
  const lang = useI18n().beambox.right_panel.object_panel.option_panel;

  useEffect(() => {
    if (polygonSides) {
      setSides(polygonSides);
    }
  }, [polygonSides]);

  const handleSideChange = (val: null | number) => {
    if (val === null || val === sides) {
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

    setSides(Number.parseInt(elem.getAttribute('sides') || `${val}`, 10));
  };

  const renderSides = () =>
    isMobile ? (
      <ObjectPanelItem.Number
        decimal={0}
        id="polygon-sides"
        label={lang.sides}
        min={3}
        unit=""
        updateValue={handleSideChange}
        value={sides}
      />
    ) : (
      <div className={styles['polygon-sides']} key="polygon-sides">
        <div className={styles.label} title={lang.sides}>
          <OptionPanelIcons.PolygonSide />
        </div>
        <OptionsInput id="polygon-sides" min={3} onChange={handleSideChange} precision={0} value={sides} />
      </div>
    );

  return isMobile ? renderSides() : <div>{renderSides()}</div>;
}

export default PolygonOptions;
