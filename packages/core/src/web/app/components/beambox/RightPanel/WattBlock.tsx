import React, { memo, use, useEffect } from 'react';

import { CanvasContext } from '@core/app/contexts/CanvasContext';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import Select from '@core/app/widgets/AntdSelect';
import type { Hexa2RfWatt } from '@core/helpers/device/deviceStore';
import { fhx2rfWatts, getHexa2RfWatt, setHexa2RfWatt } from '@core/helpers/device/deviceStore';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import { postPresetChange } from '@core/helpers/layer/layer-config-helper';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './Block.module.scss';
import initState from './ConfigPanel/initState';
import ObjectPanelItem from './ObjectPanelItem';

const WattBlock = memo(() => {
  const isMobile = useIsMobile();
  const { selectedDevice } = use(CanvasContext);
  const workarea = useWorkarea();
  const value = useCanvasStore((state) => state.watt);
  const {
    beambox: { document_panel: t },
  } = useI18n();

  useEffect(() => {
    if (selectedDevice?.model !== 'fhx2rf') return;

    useCanvasStore.setState({ watt: getHexa2RfWatt(selectedDevice?.uuid || '') });
  }, [selectedDevice]);

  useEffect(() => {
    if (workarea !== 'fhx2rf') return;

    postPresetChange();
    initState();
  }, [workarea, value]);

  if (workarea !== 'fhx2rf') return null;

  const options = fhx2rfWatts.map((watt) => ({ label: `${watt}W`, value: watt }));
  const handleChange = (newVal: Hexa2RfWatt) => {
    useCanvasStore.setState({ watt: newVal });

    if (selectedDevice?.uuid && selectedDevice.model === 'fhx2rf') {
      setHexa2RfWatt(selectedDevice.uuid, newVal);
    }
  };

  return isMobile ? (
    <ObjectPanelItem.Select
      id="watt-select-mobile"
      label={t.laser_source}
      onChange={handleChange as any}
      options={options}
      selected={options.find((option) => option.value === value)}
    />
  ) : (
    <div className={styles.container}>
      <span className={styles.label}>{t.laser_source}</span>
      <Select className={styles.select} onChange={handleChange} options={options} value={value} />
    </div>
  );
});

export default WattBlock;
