import React, { useState } from 'react';

import { InputNumber, Modal, Segmented, Space, Typography } from 'antd';

import { useMaterialStore } from '@core/app/stores/materialStore';
import { generateUserId } from '@core/app/stores/materialStore/utils';
import useI18n from '@core/helpers/useI18n';
import type { Material, MaterialRegion } from '@core/interfaces/IMaterial';

import styles from '../MaterialBrowser.module.scss';
import { getThicknessLabel } from '../utils/inchDisplay';

interface AddVariantModalProps {
  material: Material;
  onClose: () => void;
  region: MaterialRegion;
}

/** Adds a user thickness variant to any material — a variant is only a thickness (identity comes from the material) */
const AddVariantModal = ({ material, onClose, region }: AddVariantModalProps): React.JSX.Element => {
  const t = useI18n().beambox.material_browser;
  const { addVariant, userVariants } = useMaterialStore();
  const [unit, setUnit] = useState<'inch' | 'mm'>(region === 'us' ? 'inch' : 'mm');
  const [num, setNum] = useState<number | undefined>();
  const [den, setDen] = useState<number | undefined>();

  // Same unit + same resolved fraction (cross-multiplied, so 2/16 == 1/8 without float error),
  // checked against catalog variants and user additions alike
  const effectiveDen = unit === 'inch' ? (den ?? 1) : 1;
  const isDuplicate =
    !!num &&
    [...(material.variants ?? []), ...userVariants.filter(({ materialId }) => materialId === material.id)].some(
      (variant) =>
        variant.thicknessUnit === unit &&
        (variant.thicknessNum ?? 0) * effectiveDen === num * (variant.thicknessDen ?? 1),
    );

  const handleOk = () => {
    if (!num || isDuplicate) return;

    addVariant(material.id, {
      id: generateUserId('user_var'),
      thicknessNum: num,
      thicknessUnit: unit,
      ...(unit === 'inch' && den && { thicknessDen: den }),
    });
    onClose();
  };

  return (
    <Modal
      okButtonProps={{ disabled: !num || isDuplicate }}
      onCancel={onClose}
      onOk={handleOk}
      open
      title={t.thickness}
      width={380}
    >
      <Space align="center">
        <Segmented onChange={(value) => setUnit(value as 'inch' | 'mm')} options={['mm', 'inch']} value={unit} />
        <InputNumber
          min={0}
          onChange={(value) => setNum(value ?? undefined)}
          step={unit === 'inch' ? 1 : 0.1}
          style={{ width: 80 }}
          value={num}
        />
        {unit === 'inch' && (
          <>
            ⁄
            <InputNumber
              min={1}
              onChange={(value) => setDen(value ?? undefined)}
              placeholder="16"
              step={1}
              style={{ width: 70 }}
              value={den}
            />
          </>
        )}
        <span className={styles['fraction-preview']}>
          {getThicknessLabel({ thicknessDen: den, thicknessNum: num, thicknessUnit: unit }) ?? '—'}
        </span>
      </Space>
      {isDuplicate && (
        <Typography.Text style={{ display: 'block', marginTop: 8 }} type="danger">
          {t.variant_exists}
        </Typography.Text>
      )}
    </Modal>
  );
};

export default AddVariantModal;
