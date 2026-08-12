import React, { useEffect, useMemo, useState } from 'react';

import { PictureOutlined } from '@ant-design/icons';
import { Col, ColorPicker, Form, Input, InputNumber, Modal, Row, Segmented, Space, Upload } from 'antd';

import { CATEGORY_COLORS, MATERIAL_CATEGORIES, MY_MATERIALS_ID } from '@core/app/constants/material-catalog/constants';
import { useMaterialStore } from '@core/app/stores/materialStore';
import { generateUserId } from '@core/app/stores/materialStore/utils';
import Select from '@core/app/widgets/AntdSelect';
import { getMaterialDisplayName } from '@core/helpers/api/material-catalog/utils';
import useI18n from '@core/helpers/useI18n';
import type { Material, MaterialCategory, MaterialRegion } from '@core/interfaces/IMaterial';

import styles from '../MaterialBrowser.module.scss';
import { useMaterialBrowserStore } from '../useMaterialBrowserStore';
import { getThicknessLabel } from '../utils/inchDisplay';

/**
 * Covers are stored as dataURLs in the `materials` storage key, so their size is charged
 * against a budget shared with every other preference (~5 MB on web). 480px covers the
 * largest render (the 320x230 detail hero, and 220x148 cards at 2x) without overshooting.
 */
const MAX_COVER_SIZE = 480;
const COVER_QUALITY = 0.75;
/** Hard ceiling per cover, so a high-detail photo can't blow the budget on its own */
const MAX_COVER_BYTES = 120 * 1024;
/** Progressively harsher fallbacks, applied only when a photo exceeds the ceiling */
const COVER_FALLBACKS: Array<{ quality: number; size: number }> = [
  { quality: 0.6, size: 480 },
  { quality: 0.6, size: 360 },
  { quality: 0.5, size: 280 },
];

const drawToDataUrl = (image: HTMLImageElement, size: number, quality: number): string => {
  const scale = Math.min(1, size / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');

  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/jpeg', quality);
};

/** Downscale + re-encode a user photo until it fits the per-cover ceiling */
const encodeCover = (image: HTMLImageElement): string => {
  let dataUrl = drawToDataUrl(image, MAX_COVER_SIZE, COVER_QUALITY);

  for (const { quality, size } of COVER_FALLBACKS) {
    if (dataUrl.length <= MAX_COVER_BYTES) break;

    dataUrl = drawToDataUrl(image, size, quality);
  }

  return dataUrl;
};

const fileToCoverDataUrl = async (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      const dataUrl = encodeCover(image);

      URL.revokeObjectURL(url);
      resolve(dataUrl);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    image.src = url;
  });

interface FormValues {
  category: MaterialCategory;
  name: string;
  parentId?: string;
  tags?: string[];
  thicknessDen?: number;
  thicknessNum?: number;
}

interface MaterialEditorModalProps {
  region: MaterialRegion;
}

const MaterialEditorModal = ({ region }: MaterialEditorModalProps): null | React.JSX.Element => {
  const t = useI18n().beambox.material_browser;
  const [form] = Form.useForm<FormValues>();
  const { closeEditors, materialEditor, setActiveTab } = useMaterialBrowserStore();
  const { addMaterial, updateMaterial, userMaterials } = useMaterialStore();
  const editing =
    materialEditor.mode === 'edit' ? userMaterials.find(({ id }) => id === materialEditor.materialId) : undefined;

  const regionUnit = region === 'us' ? 'inch' : 'mm';
  const [appearance, setAppearance] = useState<'color' | 'image'>('color');
  const [color, setColor] = useState(CATEGORY_COLORS.wood);
  const [image, setImage] = useState<string | undefined>();
  const [unit, setUnit] = useState<'inch' | 'mm'>(regionUnit);
  const thicknessNum = Form.useWatch('thicknessNum', form);
  const thicknessDen = Form.useWatch('thicknessDen', form);

  useEffect(() => {
    if (!materialEditor.open) return;

    if (editing) {
      form.setFieldsValue({
        category: editing.category,
        name: getMaterialDisplayName(editing),
        parentId: editing.parentId,
        tags: editing.tags,
        thicknessDen: editing.thicknessDen,
        thicknessNum: editing.thicknessNum,
      });
      setAppearance(editing.image ? 'image' : 'color');
      setColor(editing.coverColor ?? CATEGORY_COLORS[editing.category]);
      setImage(editing.image);
      setUnit(editing.thicknessUnit ?? regionUnit);
    } else {
      form.resetFields();
      setAppearance('color');
      setColor(CATEGORY_COLORS.wood);
      setImage(undefined);
      setUnit(regionUnit);
    }
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [materialEditor.open]);

  const parentOptions = useMemo(
    () =>
      userMaterials
        .filter(({ id, parentId }) => !parentId && id !== MY_MATERIALS_ID && id !== editing?.id)
        .map((material) => ({ label: getMaterialDisplayName(material), value: material.id })),
    [userMaterials, editing],
  );

  if (!materialEditor.open) return null;

  const handleOk = async () => {
    const values = await form.validateFields();
    const patch: Partial<Material> = {
      category: values.category,
      coverColor: appearance === 'color' ? color : undefined,
      image: appearance === 'image' ? image : undefined,
      name: values.name,
      parentId: values.parentId,
      tags: values.tags,
      // Thickness stores the fraction in the chosen authoritative unit; unset num = no thickness
      thicknessDen: values.thicknessNum && unit === 'inch' ? values.thicknessDen : undefined,
      thicknessNum: values.thicknessNum || undefined,
      thicknessUnit: values.thicknessNum ? unit : undefined,
    };

    if (editing) {
      updateMaterial(editing.id, { ...patch, nameKey: undefined });
    } else {
      addMaterial({
        id: generateUserId('user_mat'),
        presets: [],
        source: 'user',
        ...patch,
      } as Material);
      // R14: creating keeps the browser open and jumps to the new material's category
      setActiveTab(values.category);
    }

    closeEditors();
  };

  return (
    <Modal
      okText={editing ? t.editor.title_edit : t.editor.title_add}
      onCancel={closeEditors}
      onOk={handleOk}
      open
      title={editing ? t.editor.title_edit : t.editor.title_add}
      width={760}
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        <Row gutter={28}>
          <Col span={12} xs={24}>
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
            <Form.Item label={t.thickness}>
              <Space align="center">
                <Segmented
                  onChange={(value) => setUnit(value as 'inch' | 'mm')}
                  options={['mm', 'inch']}
                  value={unit}
                />
                <Form.Item name="thicknessNum" noStyle>
                  <InputNumber min={0} step={unit === 'inch' ? 1 : 0.1} style={{ width: 80 }} />
                </Form.Item>
                {unit === 'inch' && (
                  <>
                    ⁄
                    <Form.Item name="thicknessDen" noStyle>
                      <InputNumber min={1} placeholder="16" step={1} style={{ width: 70 }} />
                    </Form.Item>
                  </>
                )}
                <span className={styles['fraction-preview']}>
                  {getThicknessLabel({ thicknessDen, thicknessNum, thicknessUnit: unit }) ?? '—'}
                </span>
              </Space>
            </Form.Item>
          </Col>

          <Col span={12} xs={24}>
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
                    <img alt="" src={image} style={{ borderRadius: 8, maxHeight: 120, maxWidth: '100%' }} />
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
                <div className={styles['color-preview']} style={{ background: color, marginTop: 8 }} />
              </Form.Item>
            )}
            <Form.Item label={t.editor.tags} name="tags">
              <Select mode="tags" open={false} suffixIcon={null} tokenSeparators={[',']} />
            </Form.Item>
            <Form.Item extra={t.editor.parent_hint} label={t.editor.parent_material} name="parentId">
              <Select allowClear options={parentOptions} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default MaterialEditorModal;
