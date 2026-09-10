import React, { useState } from 'react';

import { Form, Modal } from 'antd';

import { MY_MATERIALS_ID } from '@core/app/constants/material-catalog/constants';
import { useMaterialStore } from '@core/app/stores/materialStore';
import Select from '@core/app/widgets/AntdSelect';
import useI18n from '@core/helpers/useI18n';

import { findTargetMaterial, getMaterialTargetOptions, getVariantTargetOptions } from '../utils/materialTargetOptions';

interface MovePresetModalProps {
  onClose: () => void;
  presetId: string;
}

const MovePresetModal = ({ onClose, presetId }: MovePresetModalProps): React.JSX.Element => {
  const t = useI18n().beambox.material_browser;
  const tGlobal = useI18n().global;
  const { movePreset, userMaterials, userVariants } = useMaterialStore();
  const [targetId, setTargetId] = useState(MY_MATERIALS_ID);
  // '' = whole material; otherwise a variant id of the target material
  const [variantId, setVariantId] = useState('');

  const options = getMaterialTargetOptions(userMaterials);
  const targetMaterial = findTargetMaterial(targetId, userMaterials);
  const variantOptions = targetMaterial ? getVariantTargetOptions(targetMaterial, userVariants) : [];

  return (
    <Modal
      cancelText={tGlobal.cancel}
      okText={t.move_to_material}
      onCancel={onClose}
      onOk={() => {
        movePreset(presetId, targetId, variantId || undefined);
        onClose();
      }}
      open
      title={t.move_to_material}
      width={420}
    >
      <Form layout="vertical">
        <Form.Item label={t.add_from_layer.attach_to}>
          <Select
            onChange={(id) => {
              setTargetId(id);
              setVariantId('');
            }}
            options={options}
            showSearch
            value={targetId}
          />
        </Form.Item>
        {variantOptions.length > 0 && (
          <Form.Item label={t.thickness}>
            <Select onChange={setVariantId} options={variantOptions} value={variantId} />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default MovePresetModal;
