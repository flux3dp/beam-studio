import React, { use, useCallback, useEffect, useState } from 'react';

import Constant from '@core/app/actions/beambox/constant';
import InputNumberGroup from '@core/app/components/beambox/RightPanel/common/InputNumberGroup';
import Label from '@core/app/components/beambox/RightPanel/common/Label';
import { ObjectPanelItem } from '@core/app/components/beambox/RightPanel/common/ObjectPanelItem';
import Slider from '@core/app/components/beambox/RightPanel/common/Slider';
import ValueDisplay from '@core/app/components/beambox/RightPanel/common/ValueDisplay';
import OptionPanelIcons from '@core/app/icons/option-panel/OptionPanelIcons';
import { useIsTabletOrMobile } from '@core/app/stores/layoutStore';
import { useStorageStore } from '@core/app/stores/storageStore';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import type { NumberOptionConfig } from '@core/interfaces/ObjectPanel';

import { ObjectPanelContext } from '../contexts/ObjectPanelContext';

import OptionsInput from './OptionsInput';
import styles from './RectOptions.module.scss';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const optionConfig: NumberOptionConfig = {
  id: 'rounded-corner',
  min: 0,
  precision: 2,
  sliderMax: 50,
  sliderStep: 0.01,
  unit: 'mm',
};
const optionConfigInch: NumberOptionConfig = {
  ...optionConfig,
  sliderMax: 50.8,
  sliderStep: 0.0127,
  step: 1.27,
  unit: 'in',
};

interface Props {
  elem: Element;
}

function RectOptions({ elem }: Props): React.JSX.Element {
  const lang = useI18n().beambox.right_panel.object_panel.option_panel;
  const isTablet = useIsTabletOrMobile();
  const { dimensionValuesRef, updateDimensionValues } = use(ObjectPanelContext);
  const { rx: dimensionValuesRx } = dimensionValuesRef.current;
  const isInch = useStorageStore((state) => state.isInch);
  const [value, setValue] = useState((dimensionValuesRx || 0) / Constant.dpmm);
  const config = isInch ? optionConfigInch : optionConfig;

  useEffect(() => {
    setValue((dimensionValuesRx || 0) / Constant.dpmm);
  }, [dimensionValuesRx]);

  const handleRoundedCornerChange = useCallback(
    (val: null | number, addToHistory = true) => {
      if (val === null) return;

      const newRx = val * Constant.dpmm;

      if (addToHistory) {
        setValue(val);
        svgCanvas.changeSelectedAttribute('rx', newRx, [elem]);
        updateDimensionValues({ rx: newRx });
      } else {
        svgCanvas.changeSelectedAttributeNoUndo('rx', newRx, [elem]);
      }
    },
    [elem, updateDimensionValues],
  );

  const renderRoundCornerBlock = () => {
    return isTablet ? (
      <ObjectPanelItem
        icon={<OptionPanelIcons.RoundedCorner viewBox="6 6 18 18" />}
        id="rounded-corner"
        renderContent={() => (
          <>
            <Label extra={<ValueDisplay config={config} isInch={isInch} value={value} />}>{lang.rounded_corner}</Label>
            <Slider config={config} isInch={isInch} onChange={handleRoundedCornerChange} value={value} />
            <InputNumberGroup config={config} isInch={isInch} onChange={handleRoundedCornerChange} value={value} />
          </>
        )}
        title={lang.rounded_corner}
      />
    ) : (
      <div className={styles['rounded-corner']}>
        <div className={styles.label} title={lang.rounded_corner}>
          <OptionPanelIcons.RoundedCorner />
        </div>
        <OptionsInput
          id={config.id}
          isInch={isInch}
          min={config.min}
          onChange={handleRoundedCornerChange}
          precision={config.precision}
          unit={config.unit}
          value={value}
          width={66}
        />
      </div>
    );
  };

  return isTablet ? renderRoundCornerBlock() : <div>{renderRoundCornerBlock()}</div>;
}

export default RectOptions;
