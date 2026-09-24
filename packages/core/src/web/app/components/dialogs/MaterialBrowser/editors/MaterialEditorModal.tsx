import React, { useState } from 'react';

import { PictureOutlined } from '@ant-design/icons';
import { ColorPicker, Form, Input, Segmented, Upload } from 'antd';

import { CATEGORY_COLORS, MATERIAL_CATEGORIES } from '@core/app/constants/material-catalog/constants';
import { useMaterialStore } from '@core/app/stores/materialStore';
import { generateUserId } from '@core/app/stores/materialStore/utils';
import Select from '@core/app/widgets/AntdSelect';
import DraggableModal from '@core/app/widgets/DraggableModal';
import type { ThicknessValue } from '@core/helpers/api/material-catalog/thickness';
import { toVariantThickness } from '@core/helpers/api/material-catalog/thickness';
import { getMaterialDisplayName, getMaterialRegion } from '@core/helpers/api/material-catalog/utils';
import useI18n from '@core/helpers/useI18n';
import type { Material, MaterialCategory } from '@core/interfaces/IMaterial';

import { fileToCoverDataUrl } from '../utils/coverImage';

import styles from './MaterialEditorModal.module.scss';
import ThicknessInput from './ThicknessInput';

interface FormValues {
  category: MaterialCategory;
  name: string;
  tags?: string[];
}

interface MaterialEditorModalProps {
  /** Pre-selected category when creating (e.g. the browser's current tab) */
  defaultCategory?: MaterialCategory;
  /** Edits this user material; omitted = create a new one */
  materialId?: string;
  onClose: () => void;
  /** Called with the new material after creation */
  onCreated?: (material: Material) => void;
}

const MaterialEditorModal = ({
  defaultCategory,
  materialId,
  onClose,
  onCreated,
}: MaterialEditorModalProps): React.JSX.Element => {
  const t = useI18n().beambox.material_browser;
  const tGlobal = useI18n().global;
  const [form] = Form.useForm<FormValues>();
  const { addMaterial, addVariant, updateMaterial, userMaterials } = useMaterialStore();
  const editing = materialId ? userMaterials.find(({ id }) => id === materialId) : undefined;
  const [appearance, setAppearance] = useState<'color' | 'image'>(editing?.image ? 'image' : 'color');
  const [color, setColor] = useState(
    editing?.coverColor ?? CATEGORY_COLORS[editing?.category ?? defaultCategory ?? 'wood'],
  );
  const [image, setImage] = useState<string | undefined>(editing?.image);
  const [thickness, setThickness] = useState<ThicknessValue>({
    thicknessUnit: getMaterialRegion() === 'us' ? 'inch' : 'mm',
  });

  const handleOk = async () => {
    const values = await form.validateFields();
    const patch: Partial<Material> = {
      category: values.category,
      coverColor: appearance === 'color' ? color : undefined,
      image: appearance === 'image' ? image : undefined,
      name: values.name,
      tags: values.tags,
    };

    if (editing) {
      updateMaterial(editing.id, { ...patch, nameKey: undefined });
    } else {
      const material = { id: generateUserId('user_mat'), presets: [], source: 'user', ...patch } as Material;

      addMaterial(material);

      // A creation thickness becomes the material's first variant right away
      const variantThickness = toVariantThickness(thickness);

      if (variantThickness) addVariant(material.id, { id: generateUserId('user_var'), ...variantThickness });

      onCreated?.(material);
    }

    onClose();
  };

  return (
    <DraggableModal
      cancelText={tGlobal.cancel}
      okText={editing ? t.editor.title_edit : t.editor.title_add}
      onCancel={onClose}
      onOk={handleOk}
      open
      scrollableContent
      title={editing ? t.editor.title_edit : t.editor.title_add}
    >
      <Form
        form={form}
        initialValues={
          editing
            ? { category: editing.category, name: getMaterialDisplayName(editing), tags: editing.tags }
            : { category: defaultCategory }
        }
        layout="vertical"
        requiredMark="optional"
      >
        <div className={styles.columns}>
          <div>
            <Form.Item label={t.editor.name} name="name" rules={[{ message: t.editor.name_required, required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item
              label={t.editor.category}
              name="category"
              rules={[{ message: t.editor.category_required, required: true }]}
            >
              <Select
                options={MATERIAL_CATEGORIES.map((category) => ({ label: t.categories[category], value: category }))}
              />
            </Form.Item>
            {!editing && (
              <Form.Item label={t.thickness}>
                <ThicknessInput onChange={setThickness} value={thickness} />
              </Form.Item>
            )}
            <Form.Item label={t.editor.tags} name="tags">
              <Select mode="tags" open={false} suffixIcon={null} tokenSeparators={[',']} />
            </Form.Item>
          </div>

          <div className={styles.appearance}>
            <Form.Item extra={t.editor.appearance_hint} label={t.editor.appearance}>
              <Segmented
                block
                onChange={(value) => setAppearance(value as 'color' | 'image')}
                options={[
                  { label: t.editor.photo, value: 'image' },
                  { label: t.editor.color, value: 'color' },
                ]}
                value={appearance}
              />
            </Form.Item>
            {appearance === 'image' ? (
              <Form.Item>
                <Upload.Dragger
                  accept="image/*"
                  beforeUpload={async (file) => {
                    setImage(await fileToCoverDataUrl(file));

                    return false;
                  }}
                  maxCount={1}
                  showUploadList={false}
                >
                  {image ? (
                    <img alt="" className={styles['image-preview']} src={image} />
                  ) : (
                    <>
                      <p className="ant-upload-drag-icon">
                        <PictureOutlined />
                      </p>
                      <p className="ant-upload-hint">{t.editor.upload_hint}</p>
                    </>
                  )}
                </Upload.Dragger>
              </Form.Item>
            ) : (
              <Form.Item>
                <ColorPicker onChange={(_, hex) => setColor(hex)} showText size="large" value={color} />
                <div className={styles['color-preview']} style={{ background: color }} />
              </Form.Item>
            )}
          </div>
        </div>
      </Form>
    </DraggableModal>
  );
};

export default MaterialEditorModal;
