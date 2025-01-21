import classNames from 'classnames';
import React, { memo, useContext, useMemo } from 'react';
import { QuestionCircleOutlined } from '@ant-design/icons';

import browser from '@app/implementations/browser';
import history from '@core/app/svgedit/history/history';
import ISVGCanvas from '@core/interfaces/ISVGCanvas';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import Select from '@core/app/widgets/AntdSelect';
import useI18n from '@core/helpers/useI18n';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { writeData } from '@core/helpers/layer/layer-config-helper';

import ConfigPanelContext from './ConfigPanelContext';
import styles from './HalftoneBlock.module.scss';

let svgCanvas: ISVGCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});
const HalftoneBlock = ({
  type = 'default',
}: {
  type?: 'default' | 'panel-item' | 'modal';
}): JSX.Element => {
  const lang = useI18n().beambox.right_panel.laser_panel;

  const { selectedLayers, state, dispatch, initState } = useContext(ConfigPanelContext);
  const { halftone } = state;

  const handleChange = (value: number) => {
    if (value === halftone.value) return;
    dispatch({ type: 'change', payload: { halftone: value } });
    if (type !== 'modal') {
      const batchCmd = new history.BatchCommand('Change Halftone');
      selectedLayers.forEach((layerName) => writeData(layerName, 'halftone', value, { batchCmd }));
      batchCmd.onAfter = initState;
      svgCanvas.addCommandToHistory(batchCmd);
    }
  };

  const { value, hasMultiValue } = halftone;

  const options = useMemo(
    () =>
      [
        hasMultiValue ? { value: 0, label: '-' } : null,
        { value: 1, label: 'FM' },
        { value: 2, label: 'AM' },
      ].filter((option) => option),
    [hasMultiValue],
  );
  return type === 'panel-item' ? (
    <ObjectPanelItem.Select
      id="halftone-type"
      selected={hasMultiValue ? options[0] : options[value - 1]}
      onChange={handleChange}
      options={options}
      label={lang.halftone}
    />
  ) : (
    <div className={classNames(styles.panel)}>
      <span className={styles.title}>
        {lang.halftone}
        <QuestionCircleOutlined
          className={styles.icon}
          onClick={() => browser.open(lang.halftone_link)}
        />
      </span>
      <Select
        className={styles['inline-select']}
        onChange={handleChange}
        value={hasMultiValue ? 0 : value}
      >
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
