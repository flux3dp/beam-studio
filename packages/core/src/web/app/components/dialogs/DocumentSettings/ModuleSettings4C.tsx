import { useState } from 'react';

import { Checkbox } from 'antd';

import { useDocumentStore } from '@core/app/stores/documentStore';
import DraggableModal from '@core/app/widgets/DraggableModal';
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
  const [enablePresprayArea, setEnablePresprayArea] = useState(
    Boolean(useDocumentStore.getState()['enable-4c-prespray-area']),
  );
  const handleSave = () => {
    useDocumentStore.getState().update({
      'enable-4c-prespray-area': enablePresprayArea,
      skip_prespray: skipPrespray,
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
        <div>
          <Checkbox checked={enablePresprayArea} onChange={(e) => setEnablePresprayArea(e.target.checked)}>
            {tDocument.enable_nozzle_refresh_area}
          </Checkbox>
        </div>
      </div>
    </DraggableModal>
  );
};
