import React, { memo, useContext, useMemo } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import classNames from 'classnames';

import history from '@core/app/svgedit/history/history';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import Select from '@core/app/widgets/AntdSelect';
import { writeData } from '@core/helpers/layer/layer-config-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import browser from '@app/implementations/browser';

import ConfigPanelContext from './ConfigPanelContext';
import styles from './HalftoneBlock.module.scss';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const HalftoneBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  const lang = useI18n().beambox.right_panel.laser_panel;

  const { dispatch, initState, selectedLayers, state } = useContext(ConfigPanelContext);
  const { halftone } = state;

  const handleChange = (value: number) => {
    if (value === halftone.value) {
      return;
    }

    dispatch({ payload: { halftone: value }, type: 'change' });

    if (type !== 'modal') {
      const batchCmd = new history.BatchCommand('Change Halftone');

      selectedLayers.forEach((layerName) => writeData(layerName, 'halftone', value, { batchCmd }));
      batchCmd.onAfter = initState;
      svgCanvas.addCommandToHistory(batchCmd);
    }
  };

  const { hasMultiValue, value } = halftone;

  const options = useMemo(
    () =>
      [hasMultiValue ? { label: '-', value: 0 } : null, { label: 'FM', value: 1 }, { label: 'AM', value: 2 }].filter(
        (option) => option,
      ),
    [hasMultiValue],
  );

  return type === 'panel-item' ? (
    <ObjectPanelItem.Select
      id="halftone-type"
      label={lang.halftone}
      onChange={handleChange}
      options={options}
      selected={hasMultiValue ? options[0] : options[value - 1]}
    />
  ) : (
    <div className={classNames(styles.panel)}>
      <span className={styles.title}>
        {lang.halftone}
        <QuestionCircleOutlined className={styles.icon} onClick={() => browser.open(lang.halftone_link)} />
      </span>
      <Select className={styles['inline-select']} onChange={handleChange} value={hasMultiValue ? 0 : value}>
        {options.map((option) => (
          <Select.Option key={option.value} value={option.value}>
            {option.label}
          </Select.Option>
        ))}
      </Select>
    </div>
  );
};

export default memo(HalftoneBlock);
