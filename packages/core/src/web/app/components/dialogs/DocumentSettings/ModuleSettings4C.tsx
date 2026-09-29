import { useState } from 'react';

import { Checkbox } from 'antd';

import { useDocumentStore } from '@core/app/stores/documentStore';
import DraggableModal from '@core/app/widgets/DraggableModal';
import UnitInput from '@core/app/widgets/UnitInput';
import isDev from '@core/helpers/is-dev';
import useI18n from '@core/helpers/useI18n';

import styles from './ModuleSettings4C.module.scss';

interface Props {
  onClose: () => void;
}

export const ModuleSettings4C = ({ onClose }: Props) => {
  const {
    beambox: { document_panel: tDocument },
    device: tDevice,
    global: tGlobal,
    layer_module: tModule,
  } = useI18n();
  const [skipPrespray, setSkipPrespray] = useState(useDocumentStore.getState().skip_prespray);
  const [presprayTimes, setPresprayTimes] = useState(useDocumentStore.getState().prespray_times);
  const [enablePresprayArea, setEnablePresprayArea] = useState(
    Boolean(useDocumentStore.getState()['enable-4c-prespray-area']),
  );
  const [swapInkOrder, setSwapInkOrder] = useState(Boolean(useDocumentStore.getState()['swap-4c-ink-order']));
  const handleSave = () => {
    useDocumentStore.getState().update({
      'enable-4c-prespray-area': enablePresprayArea,
      prespray_times: presprayTimes,
      skip_prespray: skipPrespray,
      'swap-4c-ink-order': swapInkOrder,
    });
    onClose();
  };

  return (
    <DraggableModal
      cancelText={tGlobal.cancel}
      okText={tGlobal.save}
      onCancel={onClose}
      onOk={handleSave}
      open
      scrollableContent
      title={`${tDevice.submodule_type} (${tModule.printing})`}
      width={410}
    >
      <div className={styles.container}>
        <div>
          <Checkbox checked={skipPrespray} onChange={(e) => setSkipPrespray(e.target.checked)}>
            {tDocument.skip_prespray}
          </Checkbox>
        </div>
        <div className={styles.row}>
          <span>{tDocument.prespray_times}</span>
          <UnitInput
            className={styles.input}
            clipValue
            disabled={skipPrespray}
            max={10}
            min={1}
            onChange={(val) => {
              if (val) setPresprayTimes(val);
            }}
            precision={0}
            value={presprayTimes}
          />
        </div>
        <div>
          <Checkbox checked={enablePresprayArea} onChange={(e) => setEnablePresprayArea(e.target.checked)}>
            {tDocument.enable_nozzle_refresh_area}
          </Checkbox>
        </div>
        {isDev() && (
          <div>
            <Checkbox checked={swapInkOrder} onChange={(e) => setSwapInkOrder(e.target.checked)}>
              Swap ink order (CYMK cartridge)
            </Checkbox>
          </div>
        )}
      </div>
    </DraggableModal>
  );
};
