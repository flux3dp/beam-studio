import React, { useContext, useState } from 'react';

import { Checkbox, Switch } from 'antd';

import ConfigPanelIcons from '@core/app/icons/config-panel/ConfigPanelIcons';
import history from '@core/app/svgedit/history/history';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import { writeData } from '@core/helpers/layer/layer-config-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import ConfigPanelContext from './ConfigPanelContext';
import styles from './WhiteInkCheckbox.module.scss';
import WhiteInkSettingsModal from './WhiteInkSettingsModal';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

interface Props {
  type?: 'default' | 'modal' | 'panel-item';
}

// TODO: add test
const WhiteInkCheckbox = ({ type = 'default' }: Props): React.JSX.Element => {
  const lang = useI18n();
  const t = lang.beambox.right_panel.laser_panel;

  const [showModal, setShowModal] = useState(false);
  const { dispatch, initState, selectedLayers, state } = useContext(ConfigPanelContext);
  const { wInk } = state;
  const { value } = wInk;

  if (type === 'modal') {
    return null;
  }

  const handleChange = (checked: boolean) => {
    const newVal = (checked ? 1 : -1) * Math.abs(value);

    dispatch({
      payload: { wInk: newVal },
      type: 'change',
    });

    const batchCmd = new history.BatchCommand('Change white ink toggle');

    selectedLayers.forEach((layerName) => writeData(layerName, 'wInk', newVal, { batchCmd }));
    batchCmd.onAfter = initState;
    svgCanvas.addCommandToHistory(batchCmd);
  };

  return (
    <>
      {type === 'default' ? (
        <div className={styles.panel}>
          <Checkbox checked={value > 0} className="white-ink-checkbox" onChange={(e) => handleChange(e.target.checked)}>
            <div className={styles.title}>{t.white_ink}</div>
          </Checkbox>
          {value > 0 && (
            <div className={styles.setting} onClick={() => setShowModal(true)}>
              <ConfigPanelIcons.Settings />
            </div>
          )}
        </div>
      ) : (
        <>
          <ObjectPanelItem.Divider />
          <ObjectPanelItem.Item
            content={<Switch checked={value > 0} />}
            id="white_ink"
            label={t.white_ink}
            onClick={() => handleChange(value < 0)}
          />
          {value > 0 && (
            <ObjectPanelItem.Item
              content={
                <div className={styles.icon}>
                  <ConfigPanelIcons.Settings />
                </div>
              }
              id="white_ink_setting"
              label={lang.settings.caption}
              onClick={() => setShowModal(true)}
            />
          )}
        </>
      )}
      {showModal && <WhiteInkSettingsModal onClose={() => setShowModal(false)} />}
    </>
  );
};

export default WhiteInkCheckbox;
