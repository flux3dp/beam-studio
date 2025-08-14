import React, { useContext } from 'react';

import Constant from '@core/app/actions/beambox/constant';
import OptionPanelIcons from '@core/app/icons/option-panel/OptionPanelIcons';
import { useStorageStore } from '@core/app/stores/storageStore';
import { ObjectPanelContext } from '@core/app/views/beambox/Right-Panels/contexts/ObjectPanelContext';
import ObjectPanelController from '@core/app/views/beambox/Right-Panels/contexts/ObjectPanelController';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import i18n from '@core/helpers/i18n';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { useIsMobile } from '@core/helpers/system-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import styles from './RectOptions.module.scss';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const LANG = i18n.lang.beambox.right_panel.object_panel.option_panel;

interface Props {
  elem: Element;
}

function RectOptions({ elem }: Props): React.JSX.Element {
  const isMobile = useIsMobile();
  const { dimensionValues, updateDimensionValues } = useContext(ObjectPanelContext);
  const { rx } = dimensionValues;
  const isInch = useStorageStore((state) => state['default-units'] === 'inches');

  const handleRoundedCornerChange = (val: number) => {
    val *= Constant.dpmm;
    svgCanvas.changeSelectedAttribute('rx', val, [elem]);
    updateDimensionValues({ rx: val });
  };

  const renderRoundCornerBlock = () => {
    return isMobile ? (
      <ObjectPanelItem.Number
        id="rounded-corner"
        label={LANG.rounded_corner}
        min={0}
        updateValue={(val) => {
          handleRoundedCornerChange(val);
          ObjectPanelController.updateObjectPanel();
        }}
        value={rx / Constant.dpmm || 0}
      />
    ) : (
      <div className={styles['rounded-corner']} key="rounded-corner">
        <div className={styles.label} title={LANG.rounded_corner}>
          <OptionPanelIcons.RoundedCorner />
        </div>
        <UnitInput
          className={{ 'option-input': true }}
          defaultValue={rx / Constant.dpmm || 0}
          getValue={(val) => handleRoundedCornerChange(val)}
          min={0}
          unit={isInch ? 'in' : 'mm'}
        />
      </div>
    );
  };

  return isMobile ? renderRoundCornerBlock() : <div>{renderRoundCornerBlock()}</div>;
}

export default RectOptions;
