import { memo, useMemo } from 'react';

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
import Select from '@core/app/widgets/AntdSelect';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import { writeDataLayer } from '@core/helpers/layer/layer-config-helper';
import useI18n from '@core/helpers/useI18n';

import ObjectPanelItem from '../ObjectPanelItem';

import styles from './DpiBlock.module.scss';
import initState from './initState';
import { applyDpiOverrides } from './sideEffects';

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

        shouldInitState = applyDpiOverrides(layer, dpi.value, newDpi, workarea, batchCmd) || shouldInitState;
      });

      if (shouldInitState) {
        initState();
      }

      batchCmd.onAfter = initState;
      undoManager.addCommandToHistory(batchCmd);
    }
  };

  const content = (
    <div className={classNames(styles.panel, styles[type])}>
      <span className={styles.title}>{lang.resolution.title}</span>
      <Select
        className={styles.select}
        id="dpi-select"
        onChange={handleChange}
        options={options}
        placeholder="-"
        value={dpi.hasMultiValue ? undefined : dpiNumber}
      />
    </div>
  );

  return type === 'panel-item' ? (
    <ObjectPanelItem.Select
      id="dpi"
      label={lang.resolution.title}
      onChange={handleChange}
      options={options}
      selected={dpi.hasMultiValue ? undefined : { label: `${dpiNumber} DPI`, value: dpiNumber }}
    />
  ) : (
    content
  );
};

export default memo(DpiBlock);
