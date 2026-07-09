import { memo, use, useMemo } from 'react';

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
import layerManager from '@core/app/svgedit/layer/layerManager';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import { getData, writeDataLayer } from '@core/helpers/layer/layer-config-helper';
import { getDefaultPreset } from '@core/helpers/presets/preset-helper';
import useI18n from '@core/helpers/useI18n';
import type { ConfigKey } from '@core/interfaces/ILayerConfig';

import { ObjectPanelContext } from '../contexts/ObjectPanelContext';
import ObjectPanelItem from '../ObjectPanelItem';
import objectPanelItemStyles from '../ObjectPanelItem.module.scss';

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

      return { label: `${value} DPI`, value };
    });
  }, [workarea]);
  const { change, dpi } = useConfigPanelStore(useShallow(pick(['dpi', 'change'])));

  const dpiNumber = useMemo(() => dpiValueMap[dpi.value], [dpi.value]);
  const handleChange = (value: number) => {
    const newDpi = valueDpiMap[value as EngraveDpiValue];

    if (!dpi.hasMultiValue && newDpi === dpi.value) return;

    change({ dpi: newDpi });

    if (type !== 'modal') {
      const batchCmd = new history.BatchCommand('Change layers dpi');
      let shouldInitState = false;

      useLayerStore.getState().selectedLayers.forEach((layerName) => {
        const layer = layerManager.getLayerElementByName(layerName);

        if (!layer) return;

        writeDataLayer(layer, 'dpi', newDpi, { batchCmd });

        const configName = getData(layer, 'configName');

        if (configName) {
          // Only rewrite keys whose value differs by dpi (per preset.dpiOverrides), so manual edits
          // to other keys survive the dpi change. Mirrors the merge in applyPreset, but surgical.
          const layerModule = getData(layer, 'module');
          const preset = getDefaultPreset(configName, workarea, layerModule);

          if (!preset?.dpiOverrides) return;

          const oldOverrides = preset.dpiOverrides?.[dpi.value];
          const newOverrides = preset.dpiOverrides?.[newDpi];

          if (oldOverrides || newOverrides) {
            const keys = Object.keys({ ...oldOverrides, ...newOverrides }) as ConfigKey[];

            for (const key of keys) {
              const newValue = newOverrides?.[key] ?? preset[key];

              if (newValue === undefined) continue;

              writeDataLayer(layer, key, newValue, { batchCmd });
              shouldInitState = true;
            }
          }
        }
      });

      if (shouldInitState) {
        initState();
      }

      batchCmd.onAfter = initState;
      undoManager.addCommandToHistory(batchCmd);
    }
  };

  const { activeKey } = use(ObjectPanelContext);
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
                  <span style={{ whiteSpace: 'nowrap' }}>{`${dpiNumber} DPI`}</span>
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
