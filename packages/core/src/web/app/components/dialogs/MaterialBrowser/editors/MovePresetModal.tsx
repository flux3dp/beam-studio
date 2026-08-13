import React, { useMemo, useState } from 'react';

import { Form, Modal } from 'antd';

import { MY_MATERIALS_ID } from '@core/app/constants/material-catalog/constants';
import { useMaterialStore } from '@core/app/stores/materialStore';
import Select from '@core/app/widgets/AntdSelect';
import { materialCatalogCache } from '@core/helpers/api/material-catalog/materialCatalogCache';
import { getMaterialDisplayName } from '@core/helpers/api/material-catalog/utils';
import useI18n from '@core/helpers/useI18n';
import type { Material } from '@core/interfaces/IMaterial';

interface MovePresetModalProps {
  onClose: () => void;
  presetId: string;
}

const MovePresetModal = ({ onClose, presetId }: MovePresetModalProps): React.JSX.Element => {
  const t = useI18n().beambox.material_browser;
  const { movePreset, userMaterials } = useMaterialStore();
  const [targetId, setTargetId] = useState(MY_MATERIALS_ID);

  const options = useMemo(() => {
    const catalogMaterials = materialCatalogCache.getCatalogSync().materials;
    const toOption = (material: Material) => ({ label: getMaterialDisplayName(material), value: material.id });

    return [
      { label: t.catalog.materials.my_materials, value: MY_MATERIALS_ID },
      ...userMaterials.filter(({ id }) => id !== MY_MATERIALS_ID).map(toOption),
      ...catalogMaterials.map(toOption),
    ];
  }, [userMaterials, t]);

  return (
    <Modal
      okText={t.move_to_material}
      onCancel={onClose}
      onOk={() => {
        movePreset(presetId, targetId);
        onClose();
      }}
      open
      title={t.move_to_material}
      width={420}
    >
      <Form layout="vertical">
        <Form.Item label={t.add_from_layer.attach_to}>
          <Select onChange={setTargetId} options={options} showSearch value={targetId} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default MovePresetModal;
