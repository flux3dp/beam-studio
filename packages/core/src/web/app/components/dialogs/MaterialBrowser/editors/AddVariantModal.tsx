import React, { useState } from 'react';

import { Modal, Typography } from 'antd';

import { useMaterialStore } from '@core/app/stores/materialStore';
import { generateUserId } from '@core/app/stores/materialStore/utils';
import type { ThicknessValue } from '@core/helpers/api/material-catalog/thickness';
import { toVariantThickness } from '@core/helpers/api/material-catalog/thickness';
import useI18n from '@core/helpers/useI18n';
import type { Material, MaterialRegion } from '@core/interfaces/IMaterial';

import ThicknessInput from './ThicknessInput';

interface AddVariantModalProps {
  material: Material;
  onClose: () => void;
  region: MaterialRegion;
}

/** Adds a user thickness variant to any material — a variant is only a thickness (identity comes from the material) */
const AddVariantModal = ({ material, onClose, region }: AddVariantModalProps): React.JSX.Element => {
  const t = useI18n().beambox.material_browser;
  const { addVariant, userVariants } = useMaterialStore();
  const [thickness, setThickness] = useState<ThicknessValue>({ thicknessUnit: region === 'us' ? 'inch' : 'mm' });
  const { thicknessDen, thicknessNum, thicknessUnit } = thickness;

  // Same unit + same resolved fraction (cross-multiplied, so 2/16 == 1/8 without float error),
  // checked against catalog variants and user additions alike
  const effectiveDen = thicknessUnit === 'inch' ? (thicknessDen ?? 1) : 1;
  const isDuplicate =
    !!thicknessNum &&
    [...(material.variants ?? []), ...userVariants.filter(({ materialId }) => materialId === material.id)].some(
      (variant) =>
        variant.thicknessUnit === thicknessUnit &&
        (variant.thicknessNum ?? 0) * effectiveDen === thicknessNum * (variant.thicknessDen ?? 1),
    );

  const handleOk = () => {
    const variantThickness = toVariantThickness(thickness);

    if (!variantThickness || isDuplicate) return;

    addVariant(material.id, { id: generateUserId('user_var'), ...variantThickness });
    onClose();
  };

  return (
    <Modal
      okButtonProps={{ disabled: !thicknessNum || isDuplicate }}
      onCancel={onClose}
      onOk={handleOk}
      open
      title={t.thickness}
      width={380}
    >
      <ThicknessInput onChange={setThickness} value={thickness} />
      {isDuplicate && (
        <Typography.Text style={{ display: 'block', marginTop: 8 }} type="danger">
          {t.variant_exists}
        </Typography.Text>
      )}
    </Modal>
  );
};

export default AddVariantModal;
