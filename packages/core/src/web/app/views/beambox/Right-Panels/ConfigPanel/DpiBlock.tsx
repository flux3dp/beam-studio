import { memo, useContext, useMemo } from 'react';

import { Button, Popover } from 'antd-mobile';
import classNames from 'classnames';
import { pick } from 'remeda';
import { useShallow } from 'zustand/shallow';

import type { EngraveDpiValue } from '@core/app/constants/resolutions';
import { defaultEngraveDpiOptions, dpiValueMap, valueDpiMap } from '@core/app/constants/resolutions';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import useLayerStore from '@core/app/stores/layer/layerStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import objectPanelItemStyles from '@core/app/views/beambox/Right-Panels/ObjectPanelItem.module.scss';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import { writeData } from '@core/helpers/layer/layer-config-helper';
import useI18n from '@core/helpers/useI18n';

import { ObjectPanelContext } from '../contexts/ObjectPanelContext';

import styles from './Block.module.scss';
import ConfigSlider from './ConfigSlider';
import ConfigValueDisplay from './ConfigValueDisplay';
import initState from './initState';

const DpiBlock = ({ type = 'default' }: { type?: 'default' | 'modal' | 'panel-item' }) => {
  const lang = useI18n();
  const workarea = useWorkarea();
  const options = useMemo(() => {
    const options = getWorkarea(workarea).engraveDpiOptions ?? defaultEngraveDpiOptions;

    return options.map((dpiLabel) => {
      const value = dpiValueMap[dpiLabel];

      return { label: `${lang.resolution.values[dpiLabel]} (${value} DPI)`, value };
    });
  }, [workarea, lang]);
  const { change, dpi } = useConfigPanelStore(useShallow(pick(['dpi', 'change'])));

  const dpiNumber = useMemo(() => dpiValueMap[dpi.value], [dpi.value]);
  const handleChange = (value: number) => {
    const newDpi = valueDpiMap[value as EngraveDpiValue];

    change({ dpi: newDpi });

    if (type !== 'modal') {
      const batchCmd = new history.BatchCommand('Change layers dpi');

      useLayerStore.getState().selectedLayers.forEach((layerName) => {
        writeData(layerName, 'dpi', newDpi, { batchCmd });
      });
      batchCmd.onAfter = initState;
      undoManager.addCommandToHistory(batchCmd);
    }
  };

  const { activeKey } = useContext(ObjectPanelContext);
  const visible = activeKey === 'dpi';

  const content = (
    <div className={classNames(styles.panel, styles[type])}>
      <span className={styles.title}>{lang.resolution.title}</span>
      <ConfigValueDisplay
        hasMultiValue={dpi.hasMultiValue}
        inputId="dpi-input"
        onChange={handleChange}
        options={options}
        type={type}
        value={dpiNumber}
      />
      <ConfigSlider id="dpi" onChange={handleChange} options={options} value={dpiNumber} />
    </div>
  );

  return (
    <>
      {type === 'panel-item' ? (
        <>
          <Popover content={content} visible={visible}>
            <ObjectPanelItem.Item
              autoClose={false}
              content={
                <Button className={objectPanelItemStyles['number-item']} fill="outline" shape="rounded" size="mini">
                  <span
                    style={{ whiteSpace: 'nowrap' }}
                  >{`${lang.resolution.values[dpi.value]} (${dpiNumber} DPI)`}</span>
                </Button>
              }
              id="dpi"
              label={lang.resolution.title}
            />
          </Popover>
        </>
      ) : (
        content
      )}
    </>
  );
};

export default memo(DpiBlock);
