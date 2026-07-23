import React, { use, useCallback, useEffect } from 'react';

import InputNumberGroup from '@core/app/components/beambox/RightPanel/common/InputNumberGroup';
import Label from '@core/app/components/beambox/RightPanel/common/Label';
import { ObjectPanelItem } from '@core/app/components/beambox/RightPanel/common/ObjectPanelItem';
import Slider from '@core/app/components/beambox/RightPanel/common/Slider';
import ValueDisplay from '@core/app/components/beambox/RightPanel/common/ValueDisplay';
import OptionPanelIcons from '@core/app/icons/option-panel/OptionPanelIcons';
import { useIsTabletOrMobile } from '@core/app/stores/layoutStore';
import HistoryCommandFactory from '@core/app/svgedit/history/HistoryCommandFactory';
import undoManager from '@core/app/svgedit/history/undoManager';
import { updatePolygonSides } from '@core/app/svgedit/polygon';
import useI18n from '@core/helpers/useI18n';
import type { NumberOptionConfig } from '@core/interfaces/ObjectPanel';

import { ObjectPanelContext } from '../contexts/ObjectPanelContext';

import OptionsInput from './OptionsInput';
import styles from './PolygonOptions.module.scss';

const config: NumberOptionConfig = {
  id: 'polygon-sides',
  min: 3,
  precision: 0,
  sliderMax: 10,
};

interface Props {
  elem: Element;
}

function PolygonOptions({ elem }: Props): React.JSX.Element {
  const { polygonSides } = use(ObjectPanelContext);
  const [sides, setSides] = React.useState(polygonSides || 5);
  const isTablet = useIsTabletOrMobile();
  const lang = useI18n().beambox.right_panel.object_panel.option_panel;

  useEffect(() => {
    if (polygonSides) {
      setSides(polygonSides);
    }
  }, [polygonSides]);

  const handleSideChange = useCallback(
    (val: null | number, addToHistory = true) => {
      if (val === null) return;

      const batchCmd = HistoryCommandFactory.createBatchCommand('Change Polygon Sides');
      const newSides = updatePolygonSides(elem, val, { parentCmd: batchCmd });

      if (addToHistory) {
        if (!batchCmd.isEmpty()) {
          undoManager.addCommandToHistory(batchCmd);
        }

        setSides(newSides);
      }
    },
    [elem],
  );

  const renderSides = () =>
    isTablet ? (
      <ObjectPanelItem
        icon={<OptionPanelIcons.PolygonSide2 />}
        id="polygon-sides"
        renderContent={() => (
          <>
            <Label extra={<ValueDisplay config={config} value={sides} />}>{lang.sides}</Label>
            <Slider config={config} onChange={handleSideChange} value={sides} />
            <InputNumberGroup config={config} onChange={handleSideChange} value={sides} />
          </>
        )}
        title={lang.sides}
      />
    ) : (
      <div className={styles['polygon-sides']} key="polygon-sides">
        <div className={styles.label} title={lang.sides}>
          <OptionPanelIcons.PolygonSide />
        </div>
        <OptionsInput
          id={config.id}
          min={config.min}
          onChange={handleSideChange}
          precision={config.precision}
          value={sides}
        />
      </div>
    );

  return isTablet ? renderSides() : <div>{renderSides()}</div>;
}

export default PolygonOptions;
