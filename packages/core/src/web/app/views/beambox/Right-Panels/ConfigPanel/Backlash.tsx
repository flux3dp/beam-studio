import React, { memo, useContext, useMemo } from 'react';

import { Button, Popover } from 'antd-mobile';
import classNames from 'classnames';

import history from '@core/app/svgedit/history/history';
import { ObjectPanelContext } from '@core/app/views/beambox/Right-Panels/contexts/ObjectPanelContext';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import objectPanelItemStyles from '@core/app/views/beambox/Right-Panels/ObjectPanelItem.module.scss';
import { writeData } from '@core/helpers/layer/layer-config-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import units from '@core/helpers/units';
import useI18n from '@core/helpers/useI18n';
import storage from '@core/implementations/storage';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import styles from './Block.module.scss';
import ConfigPanelContext from './ConfigPanelContext';
import ConfigSlider from './ConfigSlider';
import ConfigValueDisplay from './ConfigValueDisplay';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const Backlash = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }): React.JSX.Element => {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const { activeKey } = useContext(ObjectPanelContext);
  const visible = activeKey === 'backlash';
  const { dispatch, initState, selectedLayers, state } = useContext(ConfigPanelContext);
  const { backlash } = state;
  const handleChange = (value: number) => {
    dispatch({
      payload: { backlash: value },
      type: 'change',
    });

    const batchCmd = new history.BatchCommand('Change backlash');

    selectedLayers.forEach((layerName) => {
      writeData(layerName, 'backlash', value, { batchCmd });
    });
    batchCmd.onAfter = initState;
    svgCanvas.addCommandToHistory(batchCmd);
  };
  const {
    calculate: calculateUnit,
    decimal,
    display: displayUnit,
  } = useMemo(() => {
    const unit: 'inches' | 'mm' = storage.get('default-units') || 'mm';

    return unit === 'mm'
      ? { calculate: 'mm', decimal: 2, display: 'mm' }
      : { calculate: 'inch', decimal: 2, display: 'in' };
  }, []);

  if (type === 'modal') {
    return null;
  }

  const content = (
    <div className={classNames(styles.panel, styles[type])}>
      <span className={styles.title}>{t.backlash}</span>
      <ConfigValueDisplay
        decimal={decimal}
        hasMultiValue={backlash.hasMultiValue}
        inputId="backlash-input"
        max={10}
        min={0}
        onChange={handleChange}
        type={type}
        unit={displayUnit}
        value={backlash.value}
      />
      <ConfigSlider
        decimal={decimal}
        id="backlash"
        max={10}
        min={0}
        onChange={handleChange}
        step={0.1}
        unit={displayUnit}
        value={backlash.value}
      />
    </div>
  );

  return type === 'panel-item' ? (
    <Popover content={content} visible={visible}>
      <ObjectPanelItem.Item
        autoClose={false}
        content={
          <Button className={objectPanelItemStyles['number-item']} fill="outline" shape="rounded" size="mini">
            {units.convertUnit(backlash.value, calculateUnit as 'inch' | 'mm', 'mm').toFixed(decimal)}
          </Button>
        }
        id="backlash"
        label={t.backlash}
      />
    </Popover>
  ) : (
    content
  );
};

export default memo(Backlash);
