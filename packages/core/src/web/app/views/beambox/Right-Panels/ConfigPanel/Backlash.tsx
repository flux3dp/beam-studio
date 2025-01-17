import classNames from 'classnames';
import React, { memo, useContext, useMemo } from 'react';
import { Button, Popover } from 'antd-mobile';

import history from 'app/svgedit/history/history';
import ISVGCanvas from 'interfaces/ISVGCanvas';
import ObjectPanelItem from 'app/views/beambox/Right-Panels/ObjectPanelItem';
import objectPanelItemStyles from 'app/views/beambox/Right-Panels/ObjectPanelItem.module.scss';
import storage from 'implementations/storage';
import units from 'helpers/units';
import useI18n from 'helpers/useI18n';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { ObjectPanelContext } from 'app/views/beambox/Right-Panels/contexts/ObjectPanelContext';
import { writeData } from 'helpers/layer/layer-config-helper';

import ConfigPanelContext from './ConfigPanelContext';
import ConfigSlider from './ConfigSlider';
import ConfigValueDisplay from './ConfigValueDisplay';
import styles from './Block.module.scss';

let svgCanvas: ISVGCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const Backlash = ({
  type = 'default',
}: {
  type?: 'default' | 'panel-item' | 'modal';
}): JSX.Element => {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;
  const { activeKey } = useContext(ObjectPanelContext);
  const visible = activeKey === 'backlash';
  const { selectedLayers, state, dispatch, initState } = useContext(ConfigPanelContext);
  const { backlash } = state;
  const handleChange = (value: number) => {
    dispatch({
      type: 'change',
      payload: { backlash: value },
    });
    const batchCmd = new history.BatchCommand('Change backlash');
    selectedLayers.forEach((layerName) => {
      writeData(layerName, 'backlash', value, { batchCmd });
    });
    batchCmd.onAfter = initState;
    svgCanvas.addCommandToHistory(batchCmd);
  };
  const {
    display: displayUnit,
    decimal,
    calculate: calculateUnit,
  } = useMemo(() => {
    const unit: 'mm' | 'inches' = storage.get('default-units') || 'mm';
    return unit === 'mm'
      ? { display: 'mm', decimal: 2, calculate: 'mm' }
      : { display: 'in', decimal: 2, calculate: 'inch' };
  }, []);

  if (type === 'modal') return null;

  const content = (
    <div className={classNames(styles.panel, styles[type])}>
      <span className={styles.title}>{t.backlash}</span>
      <ConfigValueDisplay
        inputId="backlash-input"
        type={type}
        max={10}
        min={0}
        value={backlash.value}
        hasMultiValue={backlash.hasMultiValue}
        decimal={decimal}
        onChange={handleChange}
        unit={displayUnit}
      />
      <ConfigSlider
        id="backlash"
        value={backlash.value}
        onChange={handleChange}
        min={0}
        max={10}
        step={0.1}
        decimal={decimal}
        unit={displayUnit}
      />
    </div>
  );

  return type === 'panel-item' ? (
    <Popover visible={visible} content={content}>
      <ObjectPanelItem.Item
        id="backlash"
        content={
          <Button
            className={objectPanelItemStyles['number-item']}
            shape="rounded"
            size="mini"
            fill="outline"
          >
            {units
              .convertUnit(backlash.value, calculateUnit as 'mm' | 'inch', 'mm')
              .toFixed(decimal)}
          </Button>
        }
        label={t.backlash}
        autoClose={false}
      />
    </Popover>
  ) : (
    content
  );
};

export default memo(Backlash);
