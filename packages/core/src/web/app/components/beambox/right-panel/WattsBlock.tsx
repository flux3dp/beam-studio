import React, { memo, useContext, useEffect, useState } from 'react';

import { CanvasContext } from '@core/app/contexts/CanvasContext';
import initState from '@core/app/views/beambox/Right-Panels/ConfigPanel/initState';
import Select from '@core/app/widgets/AntdSelect';
import type { Hexa2RfWatt } from '@core/helpers/device/deviceStore';
import { fhx2rfWatts, getHexa2RfWatt, setHexa2RfWatt } from '@core/helpers/device/deviceStore';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import { postPresetChange } from '@core/helpers/layer/layer-config-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './Block.module.scss';

const WattsBlock = memo(() => {
  const { selectedDevice } = useContext(CanvasContext);
  const workarea = useWorkarea();
  const [value, setValue] = useState<Hexa2RfWatt>(getHexa2RfWatt(selectedDevice?.uuid || ''));
  const {
    beambox: { document_panel: t },
  } = useI18n();

  useEffect(() => {
    if (selectedDevice?.model !== 'fhx2rf') return;

    setValue(getHexa2RfWatt(selectedDevice?.uuid || ''));
  }, [selectedDevice]);

  useEffect(() => {
    if (workarea !== 'fhx2rf') return;

    postPresetChange();
    initState();
  }, [workarea, value]);

  if (workarea !== 'fhx2rf') return null;

  const options = fhx2rfWatts.map((watt) => ({ label: `${watt}W`, value: watt }));
  const handleChange = (newVal: Hexa2RfWatt) => {
    setValue(newVal);

    if (selectedDevice?.uuid && selectedDevice.model === 'fhx2rf') {
      setHexa2RfWatt(selectedDevice.uuid, newVal);
    }
  };

  return (
    <div className={styles.container}>
      <span className={styles.label}>{t.laser_source}</span>
      <Select className={styles.select} onChange={handleChange} options={options} value={value} />
    </div>
  );
});

export default WattsBlock;
